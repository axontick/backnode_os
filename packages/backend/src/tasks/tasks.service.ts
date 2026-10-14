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

  async getCountsByList(accountId: string): Promise<Record<string, number>> {
    const raw = await this.taskRepo
      .createQueryBuilder('task')
      .select('task.list_id', 'list_id')
      .addSelect('COUNT(task.id)', 'count')
      .where('task.accountId = :accountId', { accountId })
      .andWhere('task.list_id IS NOT NULL')
      .groupBy('task.list_id')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of raw) {
      if (row.list_id) {
        counts[row.list_id] = parseInt(row.count, 10) || 0;
      }
    }
    return counts;
  }

  async findAll(
    accountId: string,
    query?: {
      list_id?: string;
      status?: string;
      priority?: string;
      assigneeId?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
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

    const qb = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.accountId = :accountId', { accountId });

    if (query?.list_id) {
      qb.andWhere('task.list_id = :list_id', { list_id: query.list_id });
    }

    if (query?.status) {
      qb.andWhere('task.status = :status', { status: query.status });
    }

    if (query?.priority) {
      qb.andWhere('task.priority = :priority', { priority: query.priority });
    }

    if (query?.assigneeId) {
      qb.andWhere('task.assigneeId = :assigneeId', { assigneeId: query.assigneeId });
    }

    if (query?.search) {
      const searchLower = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(task.title) LIKE :search OR LOWER(task.id) LIKE :search OR LOWER(task.description) LIKE :search)',
        { search: searchLower },
      );
    }

    qb.orderBy('task.createdAt', 'ASC');

    if (query?.limit !== undefined && !isNaN(query.limit)) {
      qb.take(Math.max(1, query.limit));
      if (query?.offset !== undefined && !isNaN(query.offset)) {
        qb.skip(Math.max(0, query.offset));
      }
    }

    let tasks = await qb.getMany();

    if (currentUser && !canViewAll && canViewMe) {
      tasks = tasks.filter((t) => this.isAssignedToUser(t, currentUser));
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
      list_id,
      listId,
      targetCycle,
      dueDate = '',
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
    const resolvedListId = list_id || listId || targetCycle || 'sprint-14';

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
      list_id: resolvedListId,
      dueDate,
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
    if (data.status !== undefined) task.status = data.status;
    if (data.priority !== undefined) task.priority = data.priority;
    if (data.assigneeId !== undefined) task.assigneeId = data.assigneeId;
    if (data.assignee !== undefined) task.assigneeId = data.assignee?.id || null;
    if (data.tags !== undefined) task.tags = data.tags;
    if (data.subtasks !== undefined) task.subtasks = data.subtasks;
    if (data.estimation !== undefined) task.estimation = data.estimation;
    if (data.list_id !== undefined) task.list_id = data.list_id;
    else if (data.listId !== undefined) task.list_id = data.listId;
    else if (data.targetCycle !== undefined) task.list_id = data.targetCycle;
    if (data.dueDate !== undefined) task.dueDate = data.dueDate;
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
