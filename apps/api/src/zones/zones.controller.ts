import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Controller('zones')
@UseGuards(AdminAuthGuard)
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.zonesService.create(createZoneDto);
  }

  @Get()
  findAll() {
    return this.zonesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto) {
    return this.zonesService.update(id, updateZoneDto);
  }
}
