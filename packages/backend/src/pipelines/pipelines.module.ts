import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmPipeline, CrmStageDefinition, CrmPipelineSettings } from '../entities';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CrmPipeline, CrmStageDefinition, CrmPipelineSettings])],
  controllers: [PipelinesController],
  providers: [PipelinesService],
  exports: [PipelinesService],
})
export class PipelinesModule {}
