import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskItem } from '../entities';
import { RolesService } from '../roles/roles.service';
import { CurrentUserPayload } from '../auth/current-user.decorator';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskItem)
    private readonly taskRepo: Repository<TaskItem>,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
  ) {}

  private isAssignedToUser(task: TaskItem, user?: CurrentUserPayload): boolean {
    if (!user) return true;
    if (user.role === 'OWNER') return true;
    if (task.assigneeId && task.assigneeId === user.id) return true;
    if (task.assignee?.id === user.id) return true;
    if (user.email && task.assignee?.email && task.assignee.email.toLowerCase() === user.email.toLowerCase()) return true;
    if (user.name && task.assignee?.name && task.assignee.name.toLowerCase() === user.name.toLowerCase()) return true;
    return false;
  }

  async findAll(
    accountId: string,
    query?: { status?: string; priority?: string; assigneeId?: string },
    currentUser?: CurrentUserPayload,
  ) {
    if (currentUser) {
      const perms = await this.rolesService.getEffectivePermissions(accountId, currentUser);
      if (perms.tasks.view === 'none') {
        return [];
      }
    }

    const where: any = { accountId };
    if (query?.status) where.status = query.status;
    if (query?.priority) where.priority = query.priority;
    if (query?.assigneeId) where.assigneeId = query.assigneeId;

    const tasks = await this.taskRepo.find({
      where,
      relations: { assignee: true },
      order: {
        createdAt: 'ASC',
      },
    });

    if (currentUser) {
      const perms = await this.rolesService.getEffectivePermissions(accountId, currentUser);
      if (perms.tasks.view === 'assigned') {
        return tasks.filter((t) => this.isAssignedToUser(t, currentUser));
      }
    }

    return tasks;
  }

  async findOne(accountId: string, id: string, currentUser?: CurrentUserPayload) {
    const task = await this.taskRepo.findOne({
      where: { id, accountId },
      relations: { assignee: true },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found in this account`);
    }

    if (currentUser) {
      const perms = await this.rolesService.getEffectivePermissions(accountId, currentUser);
      if (perms.tasks.view === 'none') {
        throw new ForbiddenException('You do not have permission to view tasks.');
      }
      if (perms.tasks.view === 'assigned' && !this.isAssignedToUser(task, currentUser)) {
        throw new ForbiddenException('Access restricted: You can only view tasks assigned to you.');
      }
    }

    return task;
  }

  async create(accountId: string, data: any, currentUser?: CurrentUserPayload) {
    if (currentUser) {
      const perms = await this.rolesService.getEffectivePermissions(accountId, currentUser);
      if (!perms.tasks.create) {
        throw new ForbiddenException('You do not have permission to create tasks.');
      }
      if (!perms.tasks.assign && data.assigneeId && data.assigneeId !== currentUser.id) {
        throw new ForbiddenException('You do not have permission to assign tasks to other members.');
      }
    }

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
    return this.findOne(accountId, id, currentUser);
  }

  async update(accountId: string, id: string, data: any, currentUser?: CurrentUserPayload) {
    const task = await this.findOne(accountId, id, currentUser);

    if (currentUser) {
      const perms = await this.rolesService.getEffectivePermissions(accountId, currentUser);

      if (perms.tasks.update === 'none') {
        throw new ForbiddenException('You do not have permission to update tasks.');
      }
      if (perms.tasks.update === 'assigned' && !this.isAssignedToUser(task, currentUser)) {
        throw new ForbiddenException('Access restricted: You can only edit tasks assigned to you.');
      }

      if (data.status !== undefined && data.status !== task.status) {
        if (perms.tasks.change_status === 'none') {
          throw new ForbiddenException('You do not have permission to change task statuses.');
        }
        if (perms.tasks.change_status === 'assigned' && !this.isAssignedToUser(task, currentUser)) {
          throw new ForbiddenException('Access restricted: You can only change status for tasks assigned to you.');
        }
      }

      if (
        (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) ||
        (data.assignee !== undefined && data.assignee?.id !== task.assigneeId)
      ) {
        if (!perms.tasks.assign) {
          throw new ForbiddenException('You do not have permission to reassign tasks.');
        }
      }
    }

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
    return this.findOne(accountId, id, currentUser);
  }

  async remove(accountId: string, id: string, currentUser?: CurrentUserPayload) {
    const task = await this.findOne(accountId, id, currentUser);

    if (currentUser) {
      const perms = await this.rolesService.getEffectivePermissions(accountId, currentUser);
      if (perms.tasks.delete === 'none') {
        throw new ForbiddenException('You do not have permission to delete tasks.');
      }
      if (perms.tasks.delete === 'assigned' && !this.isAssignedToUser(task, currentUser)) {
        throw new ForbiddenException('Access restricted: You can only delete tasks assigned to you.');
      }
    }

    await this.taskRepo.remove(task);
    return { id };
  }
}
