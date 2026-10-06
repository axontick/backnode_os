import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceFolder, StatusDefinition, ListSettings } from '../entities';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(SpaceFolder)
    private readonly folderRepo: Repository<SpaceFolder>,
    @InjectRepository(StatusDefinition)
    private readonly statusRepo: Repository<StatusDefinition>,
    @InjectRepository(ListSettings)
    private readonly listSettingsRepo: Repository<ListSettings>,
  ) {}

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
        color: '#9900c2',
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
    }
    return settings;
  }

  async updateListSettings(accountId: string, data: any) {
    const settings = await this.getListSettings(accountId);

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
}
