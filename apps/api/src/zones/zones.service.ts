import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createZoneDto: CreateZoneDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createZoneDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.zone.create({
      data: {
        companyId: createZoneDto.companyId,
        name: createZoneDto.name,
        zoneType: createZoneDto.zoneType,
        description: createZoneDto.description,
        adjustmentType: createZoneDto.adjustmentType,
        adjustmentValue: createZoneDto.adjustmentValue,
        roadCondition: createZoneDto.roadCondition,
        isActive: createZoneDto.isActive ?? true,
      },
      include: {
        company: true,
      },
    });
  }

  findAll() {
    return this.prisma.zone.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!zone) {
      throw new NotFoundException('Zone not found');
    }

    return zone;
  }

  async update(id: string, updateZoneDto: UpdateZoneDto) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
    });

    if (!zone) {
      throw new NotFoundException('Zone not found');
    }

    return this.prisma.zone.update({
      where: { id },
      data: {
        name: updateZoneDto.name,
        zoneType: updateZoneDto.zoneType,
        description: updateZoneDto.description,
        adjustmentType: updateZoneDto.adjustmentType,
        adjustmentValue: updateZoneDto.adjustmentValue,
        roadCondition: updateZoneDto.roadCondition,
        isActive: updateZoneDto.isActive,
      },
      include: {
        company: true,
      },
    });
  }
}