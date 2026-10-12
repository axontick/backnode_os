import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocItem, DocFolder } from '../entities';
import { RolesService } from '../roles/roles.service';
import { CurrentUserPayload } from '../auth/current-user.decorator';

@Injectable()
export class DocsService {
  constructor(
    @InjectRepository(DocItem)
    private readonly docRepo: Repository<DocItem>,
    @InjectRepository(DocFolder)
    private readonly folderRepo: Repository<DocFolder>,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
  ) {}

  private isDocAuthor(doc: DocItem, user?: CurrentUserPayload): boolean {
    if (!user) return true;
    if (user.role === 'OWNER') return true;
    if (user.name && doc.authorName && doc.authorName.toLowerCase().trim() === user.name.toLowerCase().trim()) return true;
    if (user.email && doc.authorName && doc.authorName.toLowerCase().trim() === user.email.toLowerCase().trim()) return true;
    return false;
  }

  async findAll(
    accountId: string,
    query?: { listId?: string; folderId?: string },
    currentUser?: CurrentUserPayload,
  ) {
    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      if (!explicitPerms.includes('*') && !explicitPerms.includes('docs.view.all') && !explicitPerms.includes('docs.view.me')) {
        return [];
      }
    }

    const where: any = { accountId };
    if (query?.listId) where.listId = query.listId;
    if (query?.folderId) where.folderId = query.folderId;

    const docs = await this.docRepo.find({
      where,
      order: { updatedAt: 'DESC' },
    });

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      if (!explicitPerms.includes('*') && !explicitPerms.includes('docs.view.all') && explicitPerms.includes('docs.view.me')) {
        return docs.filter((d) => this.isDocAuthor(d, currentUser));
      }
    }

    return docs;
  }

  async findOne(accountId: string, id: string, currentUser?: CurrentUserPayload) {
    const doc = await this.docRepo.findOne({
      where: { id, accountId },
    });
    if (!doc) {
      throw new NotFoundException(`Doc with ID ${id} not found in this account`);
    }

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const canViewAll = explicitPerms.includes('*') || explicitPerms.includes('docs.view.all');
      const canViewMe = explicitPerms.includes('docs.view.me');

      if (!canViewAll && !canViewMe) {
        throw new ForbiddenException('You do not have permission to view documents.');
      }
      if (!canViewAll && canViewMe && !this.isDocAuthor(doc, currentUser)) {
        throw new ForbiddenException('Access restricted: You can only view documents you authored.');
      }
    }

    return doc;
  }

  async create(accountId: string, data: any, currentUser?: CurrentUserPayload) {
    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      if (!explicitPerms.includes('*') && !explicitPerms.includes('docs.create')) {
        throw new ForbiddenException('You do not have permission to create documents.');
      }
    }

    const id = data.id || `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const authorName = currentUser?.name || data.authorName || 'Operator';
    const authorInitials = authorName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const doc = this.docRepo.create({
      id,
      title: data.title || 'Untitled Document',
      content: data.content || '',
      classification: data.classification || 'Internal',
      folderId: data.folderId || null,
      subFolderId: data.subFolderId || null,
      listId: data.listId || null,
      tags: data.tags || [],
      authorName,
      authorInitials,
      authorDepartment: data.authorDepartment || null,
      customLinks: data.customLinks || {},
      accountId,
    });

    return this.docRepo.save(doc);
  }

  async update(accountId: string, id: string, data: any, currentUser?: CurrentUserPayload) {
    const doc = await this.findOne(accountId, id, currentUser);

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const canUpdateAll = explicitPerms.includes('*') || explicitPerms.includes('docs.update.all');
      const canUpdateMe = explicitPerms.includes('docs.update.me');

      if (!canUpdateAll && !canUpdateMe) {
        throw new ForbiddenException('You do not have permission to edit documents.');
      }
      if (!canUpdateAll && canUpdateMe && !this.isDocAuthor(doc, currentUser)) {
        throw new ForbiddenException('Access restricted: You can only edit documents you authored.');
      }
    }

    if (data.title !== undefined) doc.title = data.title;
    if (data.content !== undefined) doc.content = data.content;
    if (data.classification !== undefined) doc.classification = data.classification;
    if (data.folderId !== undefined) doc.folderId = data.folderId;
    if (data.subFolderId !== undefined) doc.subFolderId = data.subFolderId;
    if (data.listId !== undefined) doc.listId = data.listId;
    if (data.tags !== undefined) doc.tags = data.tags;
    if (data.customLinks !== undefined) doc.customLinks = data.customLinks;

    return this.docRepo.save(doc);
  }

  async remove(accountId: string, id: string, currentUser?: CurrentUserPayload) {
    const doc = await this.findOne(accountId, id, currentUser);

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const canDeleteAll = explicitPerms.includes('*') || explicitPerms.includes('docs.delete.all');

      if (!canDeleteAll) {
        throw new ForbiddenException('You do not have permission to delete documents.');
      }
    }

    await this.docRepo.remove(doc);
    return { id, success: true };
  }

  async findFolders(accountId: string) {
    return this.folderRepo.find({
      where: { accountId },
      order: { name: 'ASC' },
    });
  }

  async createFolder(accountId: string, data: any) {
    const id = data.id || `doc-fld-${Date.now().toString(36)}`;
    const folder = this.folderRepo.create({
      id,
      name: data.name || 'New Docs Folder',
      icon: data.icon || 'folder',
      color: data.color || '#ea580c',
      parentId: data.parentId || null,
      description: data.description || '',
      accountId,
    });
    return this.folderRepo.save(folder);
  }
}
