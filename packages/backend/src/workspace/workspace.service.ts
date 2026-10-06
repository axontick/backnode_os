import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  // Space Folders
  async getFolders() {
    return this.prisma.spaceFolder.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createFolder(data: any) {
    let id = data.id;
    if (!id) {
      id = `folder-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }

    return this.prisma.spaceFolder.create({
      data: {
        id,
        name: data.name,
        icon: data.icon || 'folder',
        color: data.color || '#64748B',
        description: data.description || '',
        items: data.items || [],
      },
    });
  }

  async updateFolder(id: string, data: any) {
    const folder = await this.prisma.spaceFolder.findUnique({ where: { id } });
    if (!folder) {
      throw new NotFoundException(`Folder ${id} not found`);
    }

    return this.prisma.spaceFolder.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : folder.name,
        icon: data.icon !== undefined ? data.icon : folder.icon,
        color: data.color !== undefined ? data.color : folder.color,
        description: data.description !== undefined ? data.description : folder.description,
        items: data.items !== undefined ? data.items : folder.items,
      },
    });
  }

  async deleteFolder(id: string) {
    return this.prisma.spaceFolder.delete({
      where: { id },
    });
  }

  // Status Definitions
  async getStatuses() {
    return this.prisma.statusDefinition.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async updateStatuses(statuses: any[]) {
    for (const status of statuses) {
      await this.prisma.statusDefinition.upsert({
        where: { id: status.id },
        create: {
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
        },
        update: {
          order: status.order,
          name: status.name,
          description: status.description,
          color: status.color,
          stageMapping: status.stageMapping,
          activeVolume: status.activeVolume,
          isDefault: status.isDefault,
          isClosed: status.isClosed,
          wipLimit: status.wipLimit,
          requirePrReview: status.requirePrReview,
        },
      });
    }
    return this.getStatuses();
  }

  // List Settings
  async getListSettings() {
    let settings = await this.prisma.listSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.listSettings.create({
        data: {
          id: 'default-list-settings',
          listId: 'sprint-14',
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
        },
      });
    }
    return settings;
  }

  async updateListSettings(data: any) {
    const settings = await this.getListSettings();
    return this.prisma.listSettings.update({
      where: { id: settings.id },
      data: {
        name: data.name !== undefined ? data.name : settings.name,
        description: data.description !== undefined ? data.description : settings.description,
        color: data.color !== undefined ? data.color : settings.color,
        icon: data.icon !== undefined ? data.icon : settings.icon,
        defaultView: data.defaultView !== undefined ? data.defaultView : settings.defaultView,
        defaultPriority: data.defaultPriority !== undefined ? data.defaultPriority : settings.defaultPriority,
        estimationUnit: data.estimationUnit !== undefined ? data.estimationUnit : settings.estimationUnit,
        distributedWriteLogging: data.distributedWriteLogging !== undefined ? data.distributedWriteLogging : settings.distributedWriteLogging,
        autoArchiveDays: data.autoArchiveDays !== undefined ? data.autoArchiveDays : settings.autoArchiveDays,
        strictForwardProgress: data.strictForwardProgress !== undefined ? data.strictForwardProgress : settings.strictForwardProgress,
        autoArchiveDone: data.autoArchiveDone !== undefined ? data.autoArchiveDone : settings.autoArchiveDone,
      },
    });
  }
}
