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
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(@Inject(TasksService) private readonly tasksService: TasksService) {}

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.tasksService.findAll(user.accountId, { status, priority, assigneeId }, user);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.tasksService.findOne(user.accountId, id, user);
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createTaskDto: any,
  ) {
    return this.tasksService.create(user.accountId, createTaskDto, user);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() updateTaskDto: any,
  ) {
    return this.tasksService.update(user.accountId, id, updateTaskDto, user);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.tasksService.remove(user.accountId, id, user);
  }
}
