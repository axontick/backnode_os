import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmDeal } from '../entities';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CrmDeal])],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
