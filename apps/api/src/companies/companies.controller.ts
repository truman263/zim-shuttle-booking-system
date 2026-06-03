import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CreateCompanyDto } from './dto/create-company.dto';

@Controller('companies')
@UseGuards(AdminAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
