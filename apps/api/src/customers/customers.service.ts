import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createCustomerDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.customer.create({
      data: {
        companyId: createCustomerDto.companyId,
        fullName: createCustomerDto.fullName,
        phone: createCustomerDto.phone,
        email: createCustomerDto.email,
        nationalId: createCustomerDto.nationalId,
        address: createCustomerDto.address,
      },
    });
  }

  findAll() {
    return this.prisma.customer.findMany({
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        company: true,
        bookings: true,
      },
    });
  }
}