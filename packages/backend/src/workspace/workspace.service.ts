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
} from '../entities';
import { CurrentUserPayload } from '../auth/current-user.decorator';

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

  async deleteFolder(accountId: string, id: string) {
    const folder = await this.folderRepo.findOne({ where: { id, accountId } });
    if (!folder) {
      throw new NotFoundException(`Folder ${id} not found in this account`);
    }
    await this.folderRepo.remove(folder);
    return { id };
  }

  // Status Definitions
  async getStatuses(accountId: string) {
    return this.statusRepo.find({
      where: { accountId },
      order: { order: 'ASC' },
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
