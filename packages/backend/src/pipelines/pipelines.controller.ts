import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';

@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  async findAll() {
    return this.pipelinesService.findAll();
  }

  @Get('settings')
  async getSettings() {
    return this.pipelinesService.getSettings();
  }

  @Put('settings')
  async updateSettings(@Body() data: any) {
    return this.pipelinesService.updateSettings(data);
  }

  @Get('stages')
  async getStages() {
    return this.pipelinesService.getStages();
  }

  @Put('stages')
  async updateStages(@Body() stages: any[]) {
    return this.pipelinesService.updateStages(stages);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pipelinesService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.pipelinesService.create(data);
  }
}
