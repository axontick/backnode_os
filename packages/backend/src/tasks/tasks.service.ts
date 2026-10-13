import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
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
    query?: { status?: string; priority?: string; assigneeId?: string; listId?: string },
    currentUser?: CurrentUserPayload,
  ) {
    let canViewAll = true;
    let canViewMe = false;

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      canViewAll = isWildcard || explicitPerms.includes('tasks.view.all');
      canViewMe = explicitPerms.includes('tasks.view.me');

      if (!canViewAll && !canViewMe) {
        const perms = await this.rolesService.getEffectivePermissions(accountId, currentUser);
        if (perms?.tasks?.view === 'none') {
          return [];
        }
        if (perms?.tasks?.view === 'assigned') {
          canViewMe = true;
        }
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

    let result = tasks;
    if (query?.listId) {
      const q = query.listId.toLowerCase();
      result = result.filter(
        (t) =>
          (t.listId && t.listId.toLowerCase() === q) ||
          (t.targetCycle && t.targetCycle.toLowerCase() === q) ||
          (t.targetCycle && t.targetCycle.toLowerCase().includes(q))
      );
    }

    if (currentUser && !canViewAll && canViewMe) {
      return result.filter((t) => this.isAssignedToUser(t, currentUser));
    }

    return result;
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
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      const canViewAll = isWildcard || explicitPerms.includes('tasks.view.all');
      const canViewMe = explicitPerms.includes('tasks.view.me');

      if (!canViewAll) {
        if (!canViewMe || !this.isAssignedToUser(task, currentUser)) {
          throw new ForbiddenException('Access restricted: You can only view tasks assigned to you.');
        }
      }
    }

    return task;
  }

  async create(accountId: string, data: any, currentUser?: CurrentUserPayload) {
    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      const canCreate = isWildcard || explicitPerms.includes('tasks.create');
      if (!canCreate) {
        throw new ForbiddenException('You do not have permission to create tasks.');
      }
      const canAssign = isWildcard || explicitPerms.includes('tasks.assign');
      if (!canAssign && data.assigneeId && data.assigneeId !== currentUser.id) {
        throw new ForbiddenException('You do not have permission to assign tasks to other members.');
      }
    }

    let id = data.id;
    if (!id) {
      const count = await this.taskRepo.count({ where: { accountId } });
      id = `BK-${1100 + count}`;
    }

    const effectiveListId = (data.listId || data.targetCycle || '').trim();
    if (!effectiveListId) {
      throw new BadRequestException('A task cannot exist outside of a list. Please select a valid target list.');
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
      targetCycle = effectiveListId,
      dueDate = '',
      startDate,
      completedAt,
      gitBranch = '',
      replicationHash = '0x' + Math.random().toString(16).substring(2, 8),
      timeInStage = 'Just now',
      linkedCrmDeal,
      activity = [],
      isRecurring = false,
      recurrenceRule,
      customLinks = {},
    } = data;

    const resolvedAssigneeId = assigneeId || (assignee ? assignee.id : null);
    const resolvedStartDate = startDate || null;
    const resolvedCompletedAt = completedAt || (status === 'Done' ? new Date().toISOString() : null);

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
      targetCycle: effectiveListId,
      listId: data.listId || effectiveListId,
      dueDate,
      startDate: resolvedStartDate,
      completedAt: resolvedCompletedAt,
      gitBranch,
      replicationHash,
      timeInStage,
      linkedCrmDeal,
      activity,
      isRecurring: Boolean(isRecurring),
      recurrenceRule: recurrenceRule || undefined,
      customLinks: customLinks || {},
      accountId,
    });

    await this.taskRepo.save(task);
    return this.findOne(accountId, id, currentUser);
  }

  async update(accountId: string, id: string, data: any, currentUser?: CurrentUserPayload) {
    const task = await this.findOne(accountId, id, currentUser);

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      const canEditAll = isWildcard || explicitPerms.includes('tasks.edit.all') || explicitPerms.includes('tasks.edit');
      const canEditMe = explicitPerms.includes('tasks.edit.me');

      if (!canEditAll) {
        if (!canEditMe || !this.isAssignedToUser(task, currentUser)) {
          throw new ForbiddenException('Access restricted: You can only edit tasks assigned to you.');
        }
      }

      if (data.status !== undefined && data.status !== task.status) {
        const canStatusAll = isWildcard || explicitPerms.includes('tasks.status.all') || canEditAll;
        const canStatusMe = explicitPerms.includes('tasks.status.me') || canEditMe;
        if (!canStatusAll) {
          if (!canStatusMe || !this.isAssignedToUser(task, currentUser)) {
            throw new ForbiddenException('Access restricted: You can only change status for tasks assigned to you.');
          }
        }
      }

      if (
        (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) ||
        (data.assignee !== undefined && data.assignee?.id !== task.assigneeId)
      ) {
        const canAssign = isWildcard || explicitPerms.includes('tasks.assign');
        if (!canAssign) {
          throw new ForbiddenException('You do not have permission to reassign tasks.');
        }
      }
    }

    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.specMarkdown !== undefined) task.specMarkdown = data.specMarkdown;
    if (data.priority !== undefined) task.priority = data.priority;
    if (data.assigneeId !== undefined) task.assigneeId = data.assigneeId;
    if (data.assignee !== undefined) task.assigneeId = data.assignee?.id || null;
    if (data.tags !== undefined) task.tags = data.tags;
    if (data.subtasks !== undefined) task.subtasks = data.subtasks;
    if (data.estimation !== undefined) task.estimation = data.estimation;
    if (data.targetCycle !== undefined) task.targetCycle = data.targetCycle;
    if (data.listId !== undefined) task.listId = data.listId;
    if (data.dueDate !== undefined) task.dueDate = data.dueDate;
    if (data.startDate !== undefined) task.startDate = data.startDate;
    if (data.completedAt !== undefined) task.completedAt = data.completedAt;
    if (data.status !== undefined) {
      task.status = data.status;
      if (data.status === 'Done' && !task.completedAt) {
        task.completedAt = new Date().toISOString();
      } else if (data.status !== 'Done' && data.completedAt === undefined) {
        task.completedAt = null as any;
      }
    }
    if (data.gitBranch !== undefined) task.gitBranch = data.gitBranch;
    if (data.replicationHash !== undefined) task.replicationHash = data.replicationHash;
    if (data.timeInStage !== undefined) task.timeInStage = data.timeInStage;
    if (data.linkedCrmDeal !== undefined) task.linkedCrmDeal = data.linkedCrmDeal;
    if (data.activity !== undefined) task.activity = data.activity;
    if (data.isRecurring !== undefined) task.isRecurring = Boolean(data.isRecurring);
    if (data.recurrenceRule !== undefined) task.recurrenceRule = data.recurrenceRule;
    if (data.customLinks !== undefined) task.customLinks = data.customLinks;

    await this.taskRepo.save(task);
    return this.findOne(accountId, id, currentUser);
  }

  async remove(accountId: string, id: string, currentUser?: CurrentUserPayload) {
    const task = await this.findOne(accountId, id, currentUser);

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      const canDeleteAll = isWildcard || explicitPerms.includes('tasks.delete.all') || explicitPerms.includes('tasks.delete');
      const canDeleteMe = explicitPerms.includes('tasks.delete.me');

      if (!canDeleteAll) {
        if (!canDeleteMe || !this.isAssignedToUser(task, currentUser)) {
          throw new ForbiddenException('Access restricted: You can only delete tasks assigned to you.');
        }
      }
    }

    await this.taskRepo.remove(task);
    return { id };
  }
}
