import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRouteDto: CreateRouteDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createRouteDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.route.create({
      data: {
        companyId: createRouteDto.companyId,
        name: createRouteDto.name,
        pickupCity: createRouteDto.pickupCity,
        destinationCity: createRouteDto.destinationCity,
        basePrice: createRouteDto.basePrice,
        isActive: createRouteDto.isActive ?? true,
      },
    });
  }

  findAll() {
    return this.prisma.route.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.route.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
  }
}