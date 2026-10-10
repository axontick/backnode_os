import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(@Inject(DealsService) private readonly dealsService: DealsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.dealsService.findAll(user.accountId, pipelineId, user);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.dealsService.findOne(user.accountId, id, user);
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createDealDto: any,
  ) {
    return this.dealsService.create(user.accountId, createDealDto, user);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() updateDealDto: any,
  ) {
    return this.dealsService.update(user.accountId, id, updateDealDto, user);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.dealsService.remove(user.accountId, id, user);
  }
}
