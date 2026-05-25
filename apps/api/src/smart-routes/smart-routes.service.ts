import { Injectable } from '@nestjs/common';
import { EstimateSmartRouteDto } from './dto/estimate-smart-route.dto';

type GoogleRouteResponse = {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
  }>;
};

@Injectable()
export class SmartRoutesService {
  private readonly baseFare = 10;
  private readonly pricePerKm = 1.2;
  private readonly minimumFare = 15;

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

      const oneWayPrice = this.calculateOneWayPrice(distanceKm);
      const estimatedPrice =
        tripDirection === 'ROUND_TRIP'
          ? Math.round(oneWayPrice * 2 * 100) / 100
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
            amount: Math.round(distanceKm * this.pricePerKm * 100) / 100,
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
  }) {
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
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

    const data = (await response.json()) as GoogleRouteResponse & {
      error?: {
        message?: string;
      };
    };

    if (!response.ok) {
      throw new Error(
        data.error?.message || 'Google Routes API request failed.',
      );
    }

    const firstRoute = data.routes?.[0];

    if (!firstRoute?.distanceMeters || !firstRoute?.duration) {
      throw new Error('Google Routes API did not return a valid route.');
    }

    return {
      distanceMeters: firstRoute.distanceMeters,
      durationSeconds: this.parseGoogleDuration(firstRoute.duration),
    };
  }

  private parseGoogleDuration(duration: string) {
    const match = duration.match(/^(\d+)s$/);

    if (!match) {
      return 0;
    }

    return Number(match[1]);
  }

  private calculateOneWayPrice(distanceKm: number) {
    const rawPrice = this.baseFare + distanceKm * this.pricePerKm;
    const finalPrice = Math.max(rawPrice, this.minimumFare);

    return Math.round(finalPrice * 100) / 100;
  }
}
