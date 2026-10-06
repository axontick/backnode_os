import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { status?: string; priority?: string; assigneeId?: string }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;
    if (query?.assigneeId) where.assigneeId = query.assigneeId;

    return this.prisma.taskItem.findMany({
      where,
      include: {
        assignee: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.taskItem.findUnique({
      where: { id },
      include: {
        assignee: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async create(data: any) {
    // Generate an ID if not provided, e.g. BK-XXXX
    let id = data.id;
    if (!id) {
      const count = await this.prisma.taskItem.count();
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

    return this.prisma.taskItem.create({
      data: {
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
      },
      include: {
        assignee: true,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.specMarkdown !== undefined) updateData.specMarkdown = data.specMarkdown;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.assignee !== undefined) updateData.assigneeId = data.assignee?.id || null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.subtasks !== undefined) updateData.subtasks = data.subtasks;
    if (data.estimation !== undefined) updateData.estimation = data.estimation;
    if (data.targetCycle !== undefined) updateData.targetCycle = data.targetCycle;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.gitBranch !== undefined) updateData.gitBranch = data.gitBranch;
    if (data.replicationHash !== undefined) updateData.replicationHash = data.replicationHash;
    if (data.timeInStage !== undefined) updateData.timeInStage = data.timeInStage;
    if (data.linkedCrmDeal !== undefined) updateData.linkedCrmDeal = data.linkedCrmDeal;
    if (data.activity !== undefined) updateData.activity = data.activity;

    return this.prisma.taskItem.update({
      where: { id },
      data: updateData,
      include: {
        assignee: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.taskItem.delete({
      where: { id },
    });
  }
}
