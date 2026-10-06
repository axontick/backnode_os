import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskItem } from '../entities';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskItem)
    private readonly taskRepo: Repository<TaskItem>,
  ) {}

  async findAll(accountId: string, query?: { status?: string; priority?: string; assigneeId?: string }) {
    const where: any = { accountId };
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;
    if (query?.assigneeId) where.assigneeId = query.assigneeId;

    return this.taskRepo.find({
      where,
      relations: { assignee: true },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findOne(accountId: string, id: string) {
    const task = await this.taskRepo.findOne({
      where: { id, accountId },
      relations: { assignee: true },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found in this account`);
    }
    return task;
  }

  async create(accountId: string, data: any) {
    let id = data.id;
    if (!id) {
      const count = await this.taskRepo.count({ where: { accountId } });
      id = `BK-${1100 + count}`;
    }

    const {
      title,
      description = '',
      specMarkdown = '',
      status = 'Backlog',
      priority = 'Medium',
      assigneeId,
      assignee,
      tags = [],
      subtasks = [],
      estimation,
      targetCycle = 'Sprint 14 - Q4 Infra',
      dueDate = '',
      gitBranch = '',
      replicationHash = '0x' + Math.random().toString(16).substring(2, 8),
      timeInStage = 'Just now',
      linkedCrmDeal,
      activity = [],
    } = data;

    const resolvedAssigneeId = assigneeId || (assignee ? assignee.id : null);

    const task = this.taskRepo.create({
      id,
      title,
      description,
      specMarkdown,
      status,
      priority,
      assigneeId: resolvedAssigneeId,
      tags,
      subtasks,
      estimation,
      targetCycle,
      dueDate,
      gitBranch,
      replicationHash,
      timeInStage,
      linkedCrmDeal,
      activity,
      accountId,
    });

    await this.taskRepo.save(task);
    return this.findOne(accountId, id);
  }

  async update(accountId: string, id: string, data: any) {
    const task = await this.findOne(accountId, id);

    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.specMarkdown !== undefined) task.specMarkdown = data.specMarkdown;
    if (data.status !== undefined) task.status = data.status;
    if (data.priority !== undefined) task.priority = data.priority;
    if (data.assigneeId !== undefined) task.assigneeId = data.assigneeId;
    if (data.assignee !== undefined) task.assigneeId = data.assignee?.id || null;
    if (data.tags !== undefined) task.tags = data.tags;
    if (data.subtasks !== undefined) task.subtasks = data.subtasks;
    if (data.estimation !== undefined) task.estimation = data.estimation;
    if (data.targetCycle !== undefined) task.targetCycle = data.targetCycle;
    if (data.dueDate !== undefined) task.dueDate = data.dueDate;
    if (data.gitBranch !== undefined) task.gitBranch = data.gitBranch;
    if (data.replicationHash !== undefined) task.replicationHash = data.replicationHash;
    if (data.timeInStage !== undefined) task.timeInStage = data.timeInStage;
    if (data.linkedCrmDeal !== undefined) task.linkedCrmDeal = data.linkedCrmDeal;
    if (data.activity !== undefined) task.activity = data.activity;

    await this.taskRepo.save(task);
    return this.findOne(accountId, id);
  }

  async remove(accountId: string, id: string) {
    const task = await this.findOne(accountId, id);
    await this.taskRepo.remove(task);
    return { id };
  }
}
