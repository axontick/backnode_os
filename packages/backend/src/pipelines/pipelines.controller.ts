import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('pipelines')
@UseGuards(JwtAuthGuard)
export class PipelinesController {
  constructor(@Inject(PipelinesService) private readonly pipelinesService: PipelinesService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.pipelinesService.findAll(user.accountId);
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.pipelinesService.getSettings(user.accountId);
  }

  @Put('settings')
  async updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: any,
  ) {
    return this.pipelinesService.updateSettings(user.accountId, data);
  }

  @Get('stages')
  async getStages(@CurrentUser() user: CurrentUserPayload) {
    return this.pipelinesService.getStages(user.accountId);
  }

  @Put('stages')
  async updateStages(
    @CurrentUser() user: CurrentUserPayload,
    @Body() stages: any[],
  ) {
    return this.pipelinesService.updateStages(user.accountId, stages);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.pipelinesService.findOne(user.accountId, id);
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: any,
  ) {
    return this.pipelinesService.create(user.accountId, data);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.pipelinesService.update(user.accountId, id, data);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.pipelinesService.delete(user.accountId, id);
  }
}
