import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstimateSmartRouteDto } from './dto/estimate-smart-route.dto';

type GoogleRouteResponse = {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
  }>;
};

type GoogleGeocodeResponse = {
  status?: string;
  results?: Array<{
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type ComputedRoute = {
  distanceMeters: number;
  durationSeconds: number;
};

type CorridorMatch = {
  routeId: string;
  routeName: string;
  pickupCity: string;
  destinationCity: string;
  basePrice: number;
  priceUnit: string;
  matchType: 'DIRECT' | 'REVERSE';
  pickupDistanceKm: number;
  destinationDistanceKm: number;
  totalMatchDistanceKm: number;
  matchRadiusKm: number;
};

@Injectable()
export class SmartRoutesService {
  private readonly baseFare = 10;
  private readonly pricePerKm = 1.2;
  private readonly minimumFare = 15;

  /**
   * Maximum corridor tolerance for long inter-city routes.
   * Short urban routes use a much smaller dynamic radius to avoid over-matching.
   */
  private readonly maxCorridorMatchRadiusKm = 30;

  constructor(private readonly prisma: PrismaService) {}

  async estimate(dto: EstimateSmartRouteDto) {
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
    const region = process.env.GOOGLE_MAPS_REGION || 'ZW';
    const language = process.env.GOOGLE_MAPS_LANGUAGE || 'en';

    const passengers = Number(dto.passengers || 1);
    const tripDirection = dto.tripDirection || 'ONE_WAY';

    if (!apiKey) {
      return {
        requiresManualQuote: true,
        reason: 'GOOGLE_MAPS_SERVER_KEY is not configured.',
        companyId: dto.companyId,
        pickupLocation: dto.pickupLocation,
        destination: dto.destination,
        tripDirection,
        passengers,
        estimatedPrice: null,
        distanceKm: null,
        durationMinutes: null,
        message:
          'This custom route requires a manual quote because Google Maps is not configured yet.',
      };
    }

    try {
      const route = await this.computeRoute({
        apiKey,
        region,
        language,
        pickupLocation: dto.pickupLocation,
        destination: dto.destination,
      });

      const distanceKm = Math.round((route.distanceMeters / 1000) * 10) / 10;
      const durationMinutes = Math.ceil(route.durationSeconds / 60);

      const corridorMatch = await this.findMatchingFixedRouteCorridor({
        apiKey,
        region,
        language,
        companyId: dto.companyId,
        pickupLocation: dto.pickupLocation,
        destination: dto.destination,
      });

      if (corridorMatch) {
        const oneWayPrice = this.calculateMatchedRoutePrice(
          corridorMatch.basePrice,
          corridorMatch.priceUnit,
          passengers,
        );

        const estimatedPrice =
          tripDirection === 'ROUND_TRIP'
            ? this.roundMoney(oneWayPrice * 2)
            : oneWayPrice;

        return {
          requiresManualQuote: false,
          pricingMode: 'MATCHED_FIXED_ROUTE',
          companyId: dto.companyId,
          pickupLocation: dto.pickupLocation,
          destination: dto.destination,
          tripDirection,
          passengers,
          distanceKm,
          durationMinutes,
          estimatedPrice,
          matchedRouteId: corridorMatch.routeId,
          matchedRouteName: corridorMatch.routeName,
          matchedRouteDirection: corridorMatch.matchType,
          matchedPickupCity: corridorMatch.pickupCity,
          matchedDestinationCity: corridorMatch.destinationCity,
          matchRadiusKm: corridorMatch.matchRadiusKm,
          message: `Matched to fixed route: ${corridorMatch.routeName}`,
          breakdown: [
            {
              label: `Matched fixed route: ${corridorMatch.routeName}`,
              amount: oneWayPrice,
            },
            ...(tripDirection === 'ROUND_TRIP'
              ? [
                  {
                    label: 'Round trip return journey',
                    amount: oneWayPrice,
                  },
                ]
              : []),
          ],
        };
      }

      const oneWayPrice = this.calculateOneWayPrice(distanceKm);
      const estimatedPrice =
        tripDirection === 'ROUND_TRIP'
          ? this.roundMoney(oneWayPrice * 2)
          : oneWayPrice;

      return {
        requiresManualQuote: false,
        pricingMode: 'DISTANCE_BASED',
        companyId: dto.companyId,
        pickupLocation: dto.pickupLocation,
        destination: dto.destination,
        tripDirection,
        passengers,
        distanceKm,
        durationMinutes,
        estimatedPrice,
        breakdown: [
          {
            label: 'Base fare',
            amount: this.baseFare,
          },
          {
            label: `${distanceKm} km × $${this.pricePerKm.toFixed(2)}`,
            amount: this.roundMoney(distanceKm * this.pricePerKm),
          },
          ...(tripDirection === 'ROUND_TRIP'
            ? [
                {
                  label: 'Round trip return journey',
                  amount: oneWayPrice,
                },
              ]
            : []),
        ],
      };
    } catch (error) {
      return {
        requiresManualQuote: true,
        reason: error instanceof Error ? error.message : 'Unknown route error.',
        companyId: dto.companyId,
        pickupLocation: dto.pickupLocation,
        destination: dto.destination,
        tripDirection,
        passengers,
        estimatedPrice: null,
        distanceKm: null,
        durationMinutes: null,
        message:
          'We could not calculate this route automatically. The booking can continue as a manual quote.',
      };
    }
  }

  private async findMatchingFixedRouteCorridor({
    apiKey,
    region,
    language,
    companyId,
    pickupLocation,
    destination,
  }: {
    apiKey: string;
    region: string;
    language: string;
    companyId: string;
    pickupLocation: string;
    destination: string;
  }): Promise<CorridorMatch | null> {
    const activeRoutes = await this.prisma.route.findMany({
      where: {
        companyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        pickupCity: true,
        destinationCity: true,
        basePrice: true,
        priceUnit: true,
        distanceKm: true,
      },
    });

    if (!activeRoutes.length) {
      return null;
    }

    const geocodeCache = new Map<string, Coordinates>();

    const customPickup = await this.geocodePlace({
      apiKey,
      region,
      language,
      address: pickupLocation,
      cache: geocodeCache,
    });

    const customDestination = await this.geocodePlace({
      apiKey,
      region,
      language,
      address: destination,
      cache: geocodeCache,
    });

    let bestMatch: CorridorMatch | null = null;

    for (const savedRoute of activeRoutes) {
      const savedPickup = await this.geocodePlace({
        apiKey,
        region,
        language,
        address: this.addCountryHint(savedRoute.pickupCity, region),
        cache: geocodeCache,
      });

      const savedDestination = await this.geocodePlace({
        apiKey,
        region,
        language,
        address: this.addCountryHint(savedRoute.destinationCity, region),
        cache: geocodeCache,
      });

      const savedRouteDistanceKm =
        savedRoute.distanceKm === null || savedRoute.distanceKm === undefined
          ? null
          : Number(savedRoute.distanceKm);

      const routeMatchRadiusKm =
        this.resolveCorridorMatchRadiusKm(savedRouteDistanceKm);

      const directPickupDistance = this.calculateDistanceKm(
        customPickup,
        savedPickup,
      );
      const directDestinationDistance = this.calculateDistanceKm(
        customDestination,
        savedDestination,
      );

      const reversePickupDistance = this.calculateDistanceKm(
        customPickup,
        savedDestination,
      );
      const reverseDestinationDistance = this.calculateDistanceKm(
        customDestination,
        savedPickup,
      );

      const directIsMatch =
        directPickupDistance <= routeMatchRadiusKm &&
        directDestinationDistance <= routeMatchRadiusKm;

      const reverseIsMatch =
        reversePickupDistance <= routeMatchRadiusKm &&
        reverseDestinationDistance <= routeMatchRadiusKm;

      const candidates: CorridorMatch[] = [];

      if (directIsMatch) {
        candidates.push({
          routeId: savedRoute.id,
          routeName: savedRoute.name,
          pickupCity: savedRoute.pickupCity,
          destinationCity: savedRoute.destinationCity,
          basePrice: Number(savedRoute.basePrice),
          priceUnit: savedRoute.priceUnit,
          matchType: 'DIRECT',
          pickupDistanceKm: this.roundDistance(directPickupDistance),
          destinationDistanceKm: this.roundDistance(directDestinationDistance),
          totalMatchDistanceKm: this.roundDistance(
            directPickupDistance + directDestinationDistance,
          ),
          matchRadiusKm: routeMatchRadiusKm,
        });
      }

      if (reverseIsMatch) {
        candidates.push({
          routeId: savedRoute.id,
          routeName: savedRoute.name,
          pickupCity: savedRoute.destinationCity,
          destinationCity: savedRoute.pickupCity,
          basePrice: Number(savedRoute.basePrice),
          priceUnit: savedRoute.priceUnit,
          matchType: 'REVERSE',
          pickupDistanceKm: this.roundDistance(reversePickupDistance),
          destinationDistanceKm: this.roundDistance(reverseDestinationDistance),
          totalMatchDistanceKm: this.roundDistance(
            reversePickupDistance + reverseDestinationDistance,
          ),
          matchRadiusKm: routeMatchRadiusKm,
        });
      }

      for (const candidate of candidates) {
        if (
          !bestMatch ||
          candidate.totalMatchDistanceKm < bestMatch.totalMatchDistanceKm
        ) {
          bestMatch = candidate;
        }
      }
    }

    return bestMatch;
  }

  private resolveCorridorMatchRadiusKm(savedRouteDistanceKm: number | null) {
    if (!savedRouteDistanceKm || !Number.isFinite(savedRouteDistanceKm)) {
      return 10;
    }

    if (savedRouteDistanceKm <= 30) {
      return 5;
    }

    if (savedRouteDistanceKm <= 100) {
      return 15;
    }

    return this.maxCorridorMatchRadiusKm;
  }

  private calculateMatchedRoutePrice(
    basePrice: number,
    priceUnit: string,
    passengers: number,
  ) {
    if (priceUnit === 'PER_PASSENGER') {
      return this.roundMoney(basePrice * Math.max(passengers, 1));
    }

    return this.roundMoney(basePrice);
  }

  private async computeRoute({
    apiKey,
    region,
    language,
    pickupLocation,
    destination,
  }: {
    apiKey: string;
    region: string;
    language: string;
    pickupLocation: string;
    destination: string;
  }): Promise<ComputedRoute> {
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
        },
        body: JSON.stringify({
          origin: {
            address: pickupLocation,
          },
          destination: {
            address: destination,
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          languageCode: language,
          regionCode: region,
          units: 'METRIC',
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Google Routes API failed: ${response.status}`);
    }

    const data = (await response.json()) as GoogleRouteResponse;
    const route = data.routes?.[0];

    if (!route?.distanceMeters || !route.duration) {
      throw new Error('Google Routes API did not return route distance.');
    }

    return {
      distanceMeters: route.distanceMeters,
      durationSeconds: this.parseGoogleDurationSeconds(route.duration),
    };
  }

  private async geocodePlace({
    apiKey,
    region,
    language,
    address,
    cache,
  }: {
    apiKey: string;
    region: string;
    language: string;
    address: string;
    cache: Map<string, Coordinates>;
  }): Promise<Coordinates> {
    const cacheKey = address.trim().toLowerCase();

    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('region', region.toLowerCase());
    url.searchParams.set('language', language);

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Google Geocoding API failed: ${response.status}`);
    }

    const data = (await response.json()) as GoogleGeocodeResponse;
    const location = data.results?.[0]?.geometry?.location;

    if (!location?.lat || !location?.lng) {
      throw new Error(`Could not geocode location: ${address}`);
    }

    const coordinates = {
      lat: location.lat,
      lng: location.lng,
    };

    cache.set(cacheKey, coordinates);

    return coordinates;
  }

  private addCountryHint(location: string, region: string) {
    const cleanLocation = location.trim();

    if (/zimbabwe|zw/i.test(cleanLocation)) {
      return cleanLocation;
    }

    if (region.toUpperCase() === 'ZW') {
      return `${cleanLocation}, Zimbabwe`;
    }

    return cleanLocation;
  }

  private calculateDistanceKm(a: Coordinates, b: Coordinates) {
    const earthRadiusKm = 6371;

    const dLat = this.toRadians(b.lat - a.lat);
    const dLng = this.toRadians(b.lng - a.lng);

    const lat1 = this.toRadians(a.lat);
    const lat2 = this.toRadians(b.lat);

    const haversine =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const angle =
      2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return earthRadiusKm * angle;
  }

  private toRadians(value: number) {
    return (value * Math.PI) / 180;
  }

  private parseGoogleDurationSeconds(duration: string) {
    const seconds = Number(duration.replace('s', ''));

    if (!Number.isFinite(seconds)) {
      throw new Error('Google Routes API returned an invalid duration.');
    }

    return seconds;
  }

  private calculateOneWayPrice(distanceKm: number) {
    const calculated = this.baseFare + distanceKm * this.pricePerKm;
    return this.roundMoney(Math.max(this.minimumFare, calculated));
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private roundDistance(value: number) {
    return Math.round(value * 10) / 10;
  }
}
