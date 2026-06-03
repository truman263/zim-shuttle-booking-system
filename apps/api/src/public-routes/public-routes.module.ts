import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicRoutesController } from './public-routes.controller';
import { PublicRoutesService } from './public-routes.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicRoutesController],
  providers: [PublicRoutesService],
})
export class PublicRoutesModule {}
