import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DealsService } from './deals.service';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  async findAll(@Query('pipelineId') pipelineId?: string) {
    return this.dealsService.findAll(pipelineId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Post()
  async create(@Body() createDealDto: any) {
    return this.dealsService.create(createDealDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDealDto: any) {
    return this.dealsService.update(id, updateDealDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }
}
