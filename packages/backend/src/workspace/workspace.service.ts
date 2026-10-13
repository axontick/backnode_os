import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import {
  SpaceFolder,
  StatusDefinition,
  ListSettings,
  Account,
  TeamMember,
  TaskItem,
  CrmDeal,
  CrmPipeline,
  CrmStageDefinition,
  CrmPipelineSettings,
  DirectoryContact,
  User,
  Department,
  Role,
  DocItem,
  DocFolder,
} from '../entities';
import { CurrentUserPayload } from '../auth/current-user.decorator';
import { initialStatuses, initialListSettings } from '@backnode/shared';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(SpaceFolder)
    private readonly folderRepo: Repository<SpaceFolder>,
    @InjectRepository(StatusDefinition)
    private readonly statusRepo: Repository<StatusDefinition>,
    @InjectRepository(ListSettings)
    private readonly listSettingsRepo: Repository<ListSettings>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(TeamMember)
    private readonly memberRepo: Repository<TeamMember>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(TaskItem)
    private readonly taskRepo: Repository<TaskItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  // Workspaces / Accounts
  async getWorkspaces(user: CurrentUserPayload) {
    const accountIds = new Set<string>();
    if (user?.accountId) {
      accountIds.add(user.accountId);
    }

    if (user?.email) {
      const memberships = await this.memberRepo.find({
        where: { email: user.email },
      });
      for (const m of memberships) {
        if (m.accountId) accountIds.add(m.accountId);
      }
    }

    const idList = Array.from(accountIds);
    if (idList.length === 0) return [];

    const accounts = await this.accountRepo.find({
      where: { id: In(idList) },
    });

    const results = [];
    for (const acc of accounts) {
      const memberCount = await this.memberRepo.count({ where: { accountId: acc.id } });
      const membership = user.email
        ? await this.memberRepo.findOne({ where: { accountId: acc.id, email: user.email } })
        : null;
      results.push({
        id: acc.id,
        name: acc.name,
        slug: acc.slug,
        role:
          acc.id === user.accountId
            ? user.role || 'OWNER'
            : membership?.accessLevel === 'ADMIN'
              ? 'OWNER'
              : membership?.role || 'MEMBER',
        memberCount: memberCount || 1,
        color: acc.color || '#ea580c',
        icon: acc.icon || 'workspaces',
      });
    }

    return results;
  }

  async createWorkspace(user: CurrentUserPayload, data: { name: string; color?: string; icon?: string }) {
    const baseSlug =
      data.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-') || 'workspace';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const account = this.accountRepo.create({
      name: data.name.trim(),
      slug,
      color: data.color || '#ea580c',
      icon: data.icon || 'workspaces',
      ownerEmail: user.email,
      ownerId: user.id,
    });
    const saved = await this.accountRepo.save(account);

    const member = this.memberRepo.create({
      id: `mem-${Date.now()}`,
      name: user.name || 'Owner',
      email: user.email,
      initials: (user.name || 'OW')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      role: 'Workspace Owner',
      accessLevel: 'OWNER',
      status: 'Active',
      department: 'Executive',
      capacityStatus: 'Available',
      avatarBg: data.color || '#ea580c',
      avatarColor: '#ffffff',
      accountId: saved.id,
    });
    await this.memberRepo.save(member);

    // Provision clean default structure (statuses, list settings, starter folder) - NO dummy data
    for (const s of initialStatuses) {
      await this.statusRepo.save({
        id: `${s.id}-${saved.id.slice(0, 8)}`,
        order: s.order,
        name: s.name,
        description: s.description || '',
        color: s.color,
        stageMapping: s.stageMapping || '',
        activeVolume: 0,
        isDefault: s.isDefault ?? false,
        isClosed: s.isClosed ?? false,
        wipLimit: s.wipLimit,
        requirePrReview: s.requirePrReview ?? false,
        accountId: saved.id,
      });
    }

    await this.listSettingsRepo.save({
      id: `list-settings-${saved.id.slice(0, 8)}`,
      listId: `sprint-${saved.id.slice(0, 8)}`,
      name: `${saved.name} Sprint Cycle`,
      description: `Active engineering deliverables and sprint backlog for ${saved.name}`,
      color: initialListSettings.color,
      icon: initialListSettings.icon,
      defaultView: initialListSettings.defaultView,
      defaultPriority: initialListSettings.defaultPriority,
      estimationUnit: initialListSettings.estimationUnit,
      distributedWriteLogging: initialListSettings.distributedWriteLogging,
      autoArchiveDays: initialListSettings.autoArchiveDays,
      strictForwardProgress: initialListSettings.strictForwardProgress,
      autoArchiveDone: initialListSettings.autoArchiveDone,
      accountId: saved.id,
    });

    await this.folderRepo.save({
      id: `fld-sprint-${saved.id.slice(0, 8)}`,
      name: `${saved.name} Core`,
      icon: 'folder',
      color: '#ea580c',
      description: 'Active sprint tasks and deliverables',
      items: [
        {
          id: `sprint-${saved.id.slice(0, 8)}`,
          name: 'Sprint 01',
          taskCount: 0,
          status: 'Active',
          active: true,
        },
      ],
      accountId: saved.id,
    });

    return {
      id: saved.id,
      name: saved.name,
      slug: saved.slug,
      role: 'OWNER',
      memberCount: 1,
      color: saved.color || data.color || '#ea580c',
      icon: saved.icon || data.icon || 'workspaces',
    };
  }

  async updateWorkspace(
    user: CurrentUserPayload,
    id: string,
    data: { name?: string; color?: string; icon?: string },
  ) {
    const account = await this.accountRepo.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    if (data.name !== undefined) account.name = data.name.trim();
    if (data.color !== undefined) account.color = data.color;
    if (data.icon !== undefined) account.icon = data.icon;

    const saved = await this.accountRepo.save(account);
    const memberCount = await this.memberRepo.count({ where: { accountId: id } });

    return {
      id: saved.id,
      name: saved.name,
      slug: saved.slug,
      role: 'OWNER',
      memberCount: memberCount || 1,
      color: saved.color || '#ea580c',
      icon: saved.icon || 'workspaces',
    };
  }

  async deleteWorkspace(user: CurrentUserPayload, id: string) {
    const account = await this.accountRepo.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Workspace ${id} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      // 1. Delete associated data
      await manager.delete(TaskItem, { accountId: id });
      await manager.delete(CrmDeal, { accountId: id });
      await manager.delete(CrmPipeline, { accountId: id });
      await manager.delete(CrmStageDefinition, { accountId: id });
      await manager.delete(CrmPipelineSettings, { accountId: id });
      await manager.delete(DirectoryContact, { accountId: id });
      await manager.delete(DocItem, { accountId: id });
      await manager.delete(DocFolder, { accountId: id });
      await manager.delete(Department, { accountId: id });
      await manager.delete(SpaceFolder, { accountId: id });
      await manager.delete(StatusDefinition, { accountId: id });
      await manager.delete(ListSettings, { accountId: id });
      await manager.delete(TeamMember, { accountId: id });
      await manager.delete(Role, { accountId: id });

      // 2. Reassign users if their primary account is being deleted
      const usersWithAccount = await manager.find(User, { where: { accountId: id } });
      for (const u of usersWithAccount) {
        const otherMember = await manager.findOne(TeamMember, {
          where: { email: u.email },
        });
        if (otherMember && otherMember.accountId && otherMember.accountId !== id) {
          u.accountId = otherMember.accountId;
          await manager.save(User, u);
        } else {
          const fallback = manager.create(Account, {
            name: 'Personal Workspace',
            slug: `personal-${Date.now().toString(36)}`,
            color: '#ea580c',
            icon: 'workspaces',
          });
          const savedFallback = await manager.save(Account, fallback);
          u.accountId = savedFallback.id;
          await manager.save(User, u);

          const fallbackMember = manager.create(TeamMember, {
            id: `mem-${Date.now()}`,
            name: u.name || 'Owner',
            email: u.email,
            initials: (u.name || 'OW').slice(0, 2).toUpperCase(),
            role: 'Workspace Owner',
            accessLevel: 'OWNER',
            status: 'Active',
            department: 'Executive',
            capacityStatus: 'Available',
            avatarBg: '#ea580c',
            avatarColor: '#ffffff',
            accountId: savedFallback.id,
          });
          await manager.save(TeamMember, fallbackMember);
        }
      }

      // 3. Delete account
      await manager.delete(Account, { id });
    });

    return { id, success: true };
  }

  // Space Folders
  async getFolders(accountId: string) {
    return this.folderRepo.find({
      where: { accountId },
      order: { createdAt: 'ASC' },
    });
  }

  async createFolder(accountId: string, data: any) {
    let id = data.id;
    if (!id) {
      id = `folder-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }

    const folder = this.folderRepo.create({
      id,
      name: data.name,
      icon: data.icon || 'folder',
      color: data.color || '#64748B',
      description: data.description || '',
      items: data.items || [],
      subFolders: data.subFolders || [],
      accountId,
    });

    return this.folderRepo.save(folder);
  }

  async updateFolder(accountId: string, id: string, data: any) {
    const folder = await this.folderRepo.findOne({ where: { id, accountId } });
    if (!folder) {
      throw new NotFoundException(`Folder ${id} not found in this account`);
    }

    if (data.name !== undefined) folder.name = data.name;
    if (data.icon !== undefined) folder.icon = data.icon;
    if (data.color !== undefined) folder.color = data.color;
    if (data.description !== undefined) folder.description = data.description;
    if (data.items !== undefined) folder.items = data.items;
    if (data.subFolders !== undefined) folder.subFolders = data.subFolders;

    return this.folderRepo.save(folder);
  }

  async cascadeDeleteList(accountId: string, listId: string, listName?: string) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Find all space folders in this account and remove this list item from items or subFolders
      const folders = await manager.find(SpaceFolder, { where: { accountId } });
      let deletedName = listName || '';

      const removeItemRecursively = (items: any[]): any[] => {
        if (!Array.isArray(items)) return [];
        return items.filter((it) => {
          if (it.id === listId) {
            if (!deletedName && it.name) deletedName = it.name;
            return false;
          }
          return true;
        });
      };

      const cleanSubFoldersRecursively = (subFolders: any[]): any[] => {
        if (!Array.isArray(subFolders)) return [];
        return subFolders.map((sf) => ({
          ...sf,
          items: removeItemRecursively(sf.items || []),
          subFolders: cleanSubFoldersRecursively(sf.subFolders || []),
        }));
      };

      for (const folder of folders) {
        let changed = false;
        const newItems = removeItemRecursively(folder.items || []);
        if (newItems.length !== (folder.items || []).length) changed = true;
        const newSubFolders = cleanSubFoldersRecursively(folder.subFolders || []);
        if (changed || JSON.stringify(newSubFolders) !== JSON.stringify(folder.subFolders || [])) {
          folder.items = newItems;
          folder.subFolders = newSubFolders;
          await manager.save(SpaceFolder, folder);
        }
      }

      // 2. Cascade delete tasks belonging to this list
      const taskQuery = manager
        .createQueryBuilder()
        .delete()
        .from(TaskItem)
        .where('account_id = :accountId', { accountId })
        .andWhere(
          '(list_id = :listId OR target_cycle = :listId OR LOWER(target_cycle) = :lowerListId' +
            (deletedName ? ' OR LOWER(target_cycle) = :lowerName' : '') +
            ')',
          {
            listId,
            lowerListId: listId.toLowerCase(),
            lowerName: deletedName ? deletedName.toLowerCase() : '',
          }
        );
      await taskQuery.execute();

      // 3. Cascade delete docs belonging to this list
      await manager.delete(DocItem, { accountId, listId });

      // 4. Cascade delete list settings for this list
      await manager.delete(ListSettings, { accountId, listId });

      return { id: listId, success: true };
    });
  }

  async deleteFolder(accountId: string, id: string) {
    const folder = await this.folderRepo.findOne({ where: { id, accountId } });
    if (!folder) {
      throw new NotFoundException(`Folder ${id} not found in this account`);
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Collect all child list IDs and names
      const listIds: string[] = [];
      const listNames: string[] = [];

      const collectLists = (items: any[], subFolders: any[]) => {
        if (Array.isArray(items)) {
          for (const it of items) {
            if (it?.id) listIds.push(it.id);
            if (it?.name) listNames.push(it.name.toLowerCase());
          }
        }
        if (Array.isArray(subFolders)) {
          for (const sf of subFolders) {
            collectLists(sf?.items, sf?.subFolders);
          }
        }
      };

      collectLists(folder.items, folder.subFolders);

      // 2. Cascade delete all tasks belonging to child lists
      if (listIds.length > 0) {
        const query = manager
          .createQueryBuilder()
          .delete()
          .from(TaskItem)
          .where('account_id = :accountId', { accountId })
          .andWhere(
            '(list_id IN (:...listIds) OR target_cycle IN (:...listIds)' +
              (listNames.length > 0 ? ' OR LOWER(target_cycle) IN (:...listNames)' : '') +
              ')',
            { listIds, listNames: listNames.length > 0 ? listNames : ['__dummy__'] }
          );
        await query.execute();

        // 3. Cascade delete docs belonging to these lists
        await manager
          .createQueryBuilder()
          .delete()
          .from(DocItem)
          .where('account_id = :accountId', { accountId })
          .andWhere('list_id IN (:...listIds)', { listIds })
          .execute();

        // 4. Cascade delete list settings for these lists
        await manager
          .createQueryBuilder()
          .delete()
          .from(ListSettings)
          .where('account_id = :accountId', { accountId })
          .andWhere('list_id IN (:...listIds)', { listIds })
          .execute();
      }

      // 5. Cascade delete docs belonging directly to this folder
      await manager.delete(DocItem, { accountId, folderId: id });

      // 6. Delete folder record
      await manager.delete(SpaceFolder, { id, accountId });

      return { id, success: true };
    });
  }

  // Space Import & Export
  async exportSpace(accountId: string, spaceId: string, filterListId?: string) {
    const space = await this.folderRepo.findOne({ where: { id: spaceId, accountId } });
    if (!space) {
      throw new NotFoundException(`Space Folder ${spaceId} not found in this account`);
    }

    const statuses = await this.getStatuses(accountId);
    const listSettings = await this.getListSettings(accountId);

    // Collect child list names and IDs
    const childListNames = new Set<string>();
    const childListIds = new Set<string>();

    const collectListItems = (items: any[]) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (item?.id) childListIds.add(String(item.id).toLowerCase());
          if (item?.name) childListNames.add(String(item.name).toLowerCase());
        });
      }
    };

    collectListItems(space.items);
    if (Array.isArray(space.subFolders)) {
      space.subFolders.forEach((sf: any) => {
        collectListItems(sf.items);
      });
    }

    const allTasks = await this.taskRepo.find({
      where: { accountId },
      relations: { assignee: true },
      order: { createdAt: 'ASC' },
    });

    let matchedTasks = allTasks.filter((t) => {
      const tc = (t.targetCycle || '').toLowerCase();
      return childListNames.has(tc) || childListIds.has(tc) || tc.includes(space.name.toLowerCase());
    });

    if (filterListId) {
      matchedTasks = matchedTasks.filter((t) => {
        const tc = (t.targetCycle || '').toLowerCase();
        return tc === filterListId.toLowerCase();
      });
    }

    return {
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        spaceId: space.id,
        spaceName: space.name,
        spaceColor: space.color,
        spaceIcon: space.icon,
        spaceDescription: space.description,
        totalTasks: matchedTasks.length,
        totalLists: filterListId ? 1 : (space.items?.length || 0),
      },
      space,
      statuses,
      listSettings,
      tasks: matchedTasks,
    };
  }

  async importSpace(accountId: string, spaceId: string, payload: {
    tasks: any[];
    newLists?: { id: string; name: string }[];
    newStatuses?: any[];
  }) {
    const space = await this.folderRepo.findOne({ where: { id: spaceId, accountId } });
    if (!space) {
      throw new NotFoundException(`Space Folder ${spaceId} not found in this account`);
    }

    // 1. Create any new lists if specified
    if (Array.isArray(payload.newLists) && payload.newLists.length > 0) {
      const currentItems = Array.isArray(space.items) ? [...space.items] : [];
      payload.newLists.forEach((nl) => {
        const exists = currentItems.some(
          (item) => item.id === nl.id || item.name.toLowerCase() === nl.name.toLowerCase()
        );
        if (!exists) {
          currentItems.push({
            id: nl.id,
            name: nl.name,
            taskCount: 0,
            status: 'Active',
            active: true,
            icon: 'folder',
            color: '#ea580c',
          });
        }
      });
      space.items = currentItems;
      await this.folderRepo.save(space);
    }

    // 2. Create any new statuses if specified
    if (Array.isArray(payload.newStatuses) && payload.newStatuses.length > 0) {
      const existingStatuses = await this.getStatuses(accountId);
      let highestOrder = existingStatuses.reduce((max, s) => Math.max(max, s.order || 0), 0);

      for (const ns of payload.newStatuses) {
        const exists = existingStatuses.some(
          (s) => s.name.toLowerCase() === (ns.name || ns).toLowerCase()
        );
        if (!exists) {
          highestOrder++;
          const statusName = typeof ns === 'string' ? ns : ns.name;
          await this.statusRepo.save({
            id: `status-${Date.now()}-${highestOrder}`,
            order: highestOrder,
            name: statusName,
            description: ns.description || 'Imported status',
            color: ns.color || '#ea580c',
            stageMapping: ns.stageMapping || '',
            activeVolume: 0,
            isDefault: false,
            isClosed: Boolean(ns.isClosed),
            accountId,
          });
        }
      }
    }

    // 3. Save tasks
    const savedTasks: TaskItem[] = [];
    if (Array.isArray(payload.tasks) && payload.tasks.length > 0) {
      for (const t of payload.tasks) {
        const taskEntity = this.taskRepo.create({
          ...t,
          accountId,
          assigneeId: t.assigneeId || (t.assignee ? t.assignee.id : null),
        });
        const saved = await this.taskRepo.save(taskEntity as any);
        savedTasks.push(saved as TaskItem);
      }
    }

    // 4. Update list task counts on space
    if (Array.isArray(space.items)) {
      const updatedItems = space.items.map((item: any) => {
        const count = savedTasks.filter(
          (st) => st.targetCycle === item.name || st.targetCycle === item.id
        ).length;
        return {
          ...item,
          taskCount: (item.taskCount || 0) + count,
        };
      });
      space.items = updatedItems;
      await this.folderRepo.save(space);
    }

    return {
      success: true,
      totalImported: savedTasks.length,
      space,
      tasks: savedTasks,
    };
  }


  // Status Definitions
  async getStatuses(accountId: string) {
    const list = await this.statusRepo.find({
      where: { accountId },
      order: { order: 'ASC' },
    });
    const seen = new Set<string>();
    return list.filter((s) => {
      const key = (s.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async updateStatuses(accountId: string, statuses: any[]) {
    for (const status of statuses) {
      await this.statusRepo.save({
        id: status.id,
        order: status.order,
        name: status.name,
        description: status.description || '',
        color: status.color,
        stageMapping: status.stageMapping || '',
        activeVolume: status.activeVolume || 0,
        isDefault: status.isDefault || false,
        isClosed: status.isClosed || false,
        wipLimit: status.wipLimit,
        requirePrReview: status.requirePrReview,
        accountId,
      });
    }
    return this.getStatuses(accountId);
  }

  // List Settings
  async getListSettings(accountId: string) {
    let settings = await this.listSettingsRepo.findOne({ where: { accountId } });
    if (!settings) {
      settings = this.listSettingsRepo.create({
        id: `list-settings-${accountId.slice(0, 8)}`,
        listId: `sprint-${accountId.slice(0, 8)}`,
        name: 'Sprint 14 - Q4 Infra & Engine Triage',
        description: 'High-throughput transactional queue for Backnode core engine, replication runtime, and 0.5px hairline visual tokens.',
        color: '#ea580c',
        icon: 'layers',
        defaultView: 'Board',
        defaultPriority: 'P2 - Medium (Normal)',
        estimationUnit: 'Story Points',
        distributedWriteLogging: true,
        autoArchiveDays: '14',
        strictForwardProgress: false,
        autoArchiveDone: false,
        accountId,
      });
      await this.listSettingsRepo.save(settings);
    } else if (settings.color === '#9900c2') {
      settings.color = '#ea580c';
      await this.listSettingsRepo.save(settings);
    }
    return settings;
  }

  async updateListSettings(accountId: string, data: any) {
    const settings = await this.getListSettings(accountId);

    if (data.listId !== undefined) settings.listId = data.listId;
    if (data.name !== undefined) settings.name = data.name;
    if (data.description !== undefined) settings.description = data.description;
    if (data.color !== undefined) settings.color = data.color;
    if (data.icon !== undefined) settings.icon = data.icon;
    if (data.defaultView !== undefined) settings.defaultView = data.defaultView;
    if (data.defaultPriority !== undefined) settings.defaultPriority = data.defaultPriority;
    if (data.estimationUnit !== undefined) settings.estimationUnit = data.estimationUnit;
    if (data.distributedWriteLogging !== undefined) settings.distributedWriteLogging = data.distributedWriteLogging;
    if (data.autoArchiveDays !== undefined) settings.autoArchiveDays = data.autoArchiveDays;
    if (data.strictForwardProgress !== undefined) settings.strictForwardProgress = data.strictForwardProgress;
    if (data.autoArchiveDone !== undefined) settings.autoArchiveDone = data.autoArchiveDone;

    return this.listSettingsRepo.save(settings);
  }

  // Departments Management
  async getDepartments(accountId: string) {
    let depts = await this.departmentRepo.find({
      where: { accountId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    if (depts.length === 0) {
      const defaults = [
        {
          id: `dept-eng-${accountId.slice(0, 6)}`,
          name: 'Engineering',
          code: 'ENG',
          color: '#ea580c',
          icon: 'terminal',
          description: 'Core software architecture, platform infrastructure, and distributed replication engines.',
          isDefault: true,
          order: 1,
          accountId,
        },
        {
          id: `dept-prod-${accountId.slice(0, 6)}`,
          name: 'Product',
          code: 'PROD',
          color: '#0284c7',
          icon: 'inventory_2',
          description: 'Product lifecycle, roadmapping, functional specifications, and sprint triage.',
          isDefault: false,
          order: 2,
          accountId,
        },
        {
          id: `dept-design-${accountId.slice(0, 6)}`,
          name: 'Design',
          code: 'DSGN',
          color: '#ec4899',
          icon: 'palette',
          description: 'User experience ergonomics, visual tokens, interface layout, and motion systems.',
          isDefault: false,
          order: 3,
          accountId,
        },
        {
          id: `dept-ops-${accountId.slice(0, 6)}`,
          name: 'Operations',
          code: 'OPS',
          color: '#10b981',
          icon: 'settings_suggest',
          description: 'Cloud reliability, automated deployment telemetry, compliance, and workspace workflows.',
          isDefault: false,
          order: 4,
          accountId,
        },
        {
          id: `dept-sales-${accountId.slice(0, 6)}`,
          name: 'Sales',
          code: 'SALES',
          color: '#f59e0b',
          icon: 'trending_up',
          description: 'Enterprise revenue pipelines, deal negotiations, commercial contracts, and CRM accounts.',
          isDefault: false,
          order: 5,
          accountId,
        },
        {
          id: `dept-exec-${accountId.slice(0, 6)}`,
          name: 'Executive',
          code: 'EXEC',
          color: '#6366f1',
          icon: 'corporate_fare',
          description: 'Strategic governance, corporate jurisdiction, board oversight, and executive management.',
          isDefault: false,
          order: 6,
          accountId,
        },
      ];

      for (const d of defaults) {
        const item = this.departmentRepo.create(d);
        await this.departmentRepo.save(item);
      }

      depts = await this.departmentRepo.find({
        where: { accountId },
        order: { order: 'ASC', createdAt: 'ASC' },
      });
    }

    return depts;
  }

  async createDepartment(accountId: string, data: any) {
    const code = (data.code || data.name.slice(0, 4)).trim().toUpperCase();
    const count = await this.departmentRepo.count({ where: { accountId } });

    if (data.isDefault) {
      await this.departmentRepo.update({ accountId }, { isDefault: false });
    }

    const dept = this.departmentRepo.create({
      id: data.id || `dept-${Date.now().toString(36)}`,
      name: data.name.trim(),
      code,
      description: data.description || '',
      color: data.color || '#ea580c',
      icon: data.icon || 'domain',
      headMemberId: data.headMemberId || null,
      isDefault: !!data.isDefault,
      order: data.order ?? count + 1,
      accountId,
    });

    return this.departmentRepo.save(dept);
  }

  async updateDepartment(accountId: string, id: string, data: any) {
    const dept = await this.departmentRepo.findOne({ where: { id, accountId } });
    if (!dept) {
      throw new NotFoundException(`Department ${id} not found in this account`);
    }

    const oldName = dept.name;

    if (data.name !== undefined) dept.name = data.name.trim();
    if (data.code !== undefined) dept.code = data.code.trim().toUpperCase();
    if (data.description !== undefined) dept.description = data.description;
    if (data.color !== undefined) dept.color = data.color;
    if (data.icon !== undefined) dept.icon = data.icon;
    if (data.headMemberId !== undefined) dept.headMemberId = data.headMemberId;
    if (data.order !== undefined) dept.order = data.order;
    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        await this.departmentRepo.update({ accountId }, { isDefault: false });
      }
      dept.isDefault = data.isDefault;
    }

    const saved = await this.departmentRepo.save(dept);

    // If department name was renamed, update members assigned to old department name
    if (data.name && oldName !== dept.name) {
      await this.memberRepo.update({ accountId, department: oldName }, { department: dept.name });
    }

    return saved;
  }

  async deleteDepartment(accountId: string, id: string, reassignToDeptName?: string) {
    const dept = await this.departmentRepo.findOne({ where: { id, accountId } });
    if (!dept) {
      throw new NotFoundException(`Department ${id} not found in this account`);
    }

    if (reassignToDeptName) {
      await this.memberRepo.update(
        { accountId, department: dept.name },
        { department: reassignToDeptName },
      );
    }

    await this.departmentRepo.remove(dept);
    return { id, success: true };
  }
}
