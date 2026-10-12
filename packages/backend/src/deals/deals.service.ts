import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmDeal } from '../entities';
import { RolesService } from '../roles/roles.service';
import { CurrentUserPayload } from '../auth/current-user.decorator';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(CrmDeal)
    private readonly dealRepo: Repository<CrmDeal>,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
  ) {}

  private isDealOwner(deal: CrmDeal, user?: CurrentUserPayload): boolean {
    if (!user) return true;
    if (user.role === 'OWNER') return true;
    if (user.name && deal.owner && deal.owner.toLowerCase().trim() === user.name.toLowerCase().trim()) return true;
    if (user.email && deal.contact?.email && deal.contact.email.toLowerCase().trim() === user.email.toLowerCase().trim()) return true;
    const userInitials = (user.name || '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    if (userInitials && deal.ownerInitials && deal.ownerInitials.toUpperCase() === userInitials) return true;
    return false;
  }

  async findAll(accountId: string, pipelineId?: string, currentUser?: CurrentUserPayload) {
    let canViewAll = true;
    let canViewMe = false;

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      canViewAll = isWildcard || explicitPerms.includes('deals.view.all');
      canViewMe = explicitPerms.includes('deals.view.me');

      if (!canViewAll && !canViewMe) {
        const perms = await this.rolesService.getEffectivePermissions(accountId, currentUser);
        if (perms?.deals?.view === 'none') {
          return [];
        }
        if (perms?.deals?.view === 'assigned') {
          canViewMe = true;
        }
      }
    }

    const where: any = { accountId };
    if (pipelineId) where.pipelineId = pipelineId;

    const deals = await this.dealRepo.find({
      where,
      order: {
        createdAt: 'ASC',
      },
    });

    if (currentUser && !canViewAll && canViewMe) {
      return deals.filter((d) => this.isDealOwner(d, currentUser));
    }

    return deals;
  }

  async findOne(accountId: string, id: string, currentUser?: CurrentUserPayload) {
    const deal = await this.dealRepo.findOne({
      where: { id, accountId },
      relations: { pipeline: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found in this account`);
    }

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      const canViewAll = isWildcard || explicitPerms.includes('deals.view.all');
      const canViewMe = explicitPerms.includes('deals.view.me');

      if (!canViewAll) {
        if (!canViewMe || !this.isDealOwner(deal, currentUser)) {
          throw new ForbiddenException('Access restricted: You can only view deals where you are the designated owner.');
        }
      }
    }

    return deal;
  }

  async create(accountId: string, data: any, currentUser?: CurrentUserPayload) {
    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      const canCreate = isWildcard || explicitPerms.includes('deals.create');
      if (!canCreate) {
        throw new ForbiddenException('You do not have permission to create CRM deals.');
      }
      const canAssign = isWildcard || explicitPerms.includes('deals.assign');
      if (!canAssign && data.owner && data.owner !== currentUser.name) {
        throw new ForbiddenException('You do not have permission to assign deals to other operators.');
      }
    }

    let id = data.id;
    if (!id) {
      const count = await this.dealRepo.count({ where: { accountId } });
      id = `crm-${count + 1}`;
    }

    const defaultOwner = currentUser?.name || 'Operator';
    const defaultInitials = (defaultOwner || 'OP')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const {
      title,
      company = '',
      value = 0,
      formattedValue = `$${Number(value).toLocaleString()}`,
      stage = 'Qualified Lead',
      probability = 20,
      targetCloseDate = '',
      contact = {},
      owner = defaultOwner,
      ownerInitials = defaultInitials,
      tags = [],
      nextStep = '',
      linkedTasks = [],
      history = [],
      isArchived = false,
      pipelineId = 'pipe-enterprise',
      subFolderId = null,
      competitor = null,
      lossReason = null,
      wonReason = null,
      cycleDays = 0,
      closedAt = null,
      customLinks = {},
    } = data;

    const deal = this.dealRepo.create({
      id,
      title,
      company,
      value: Number(value),
      formattedValue,
      stage,
      probability: Number(probability),
      targetCloseDate,
      contact,
      owner,
      ownerInitials,
      tags,
      nextStep,
      competitor: competitor || undefined,
      lossReason: lossReason || undefined,
      wonReason: wonReason || undefined,
      cycleDays: Number(cycleDays) || 0,
      closedAt: closedAt || undefined,
      linkedTasks,
      history,
      isArchived: Boolean(isArchived),
      pipelineId,
      subFolderId: subFolderId || undefined,
      customLinks: customLinks || {},
      accountId,
    });

    return this.dealRepo.save(deal);
  }

  async update(accountId: string, id: string, data: any, currentUser?: CurrentUserPayload) {
    const deal = await this.findOne(accountId, id, currentUser);

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      const canEditAll = isWildcard || explicitPerms.includes('deals.edit.all') || explicitPerms.includes('deals.edit');
      const canEditMe = explicitPerms.includes('deals.edit.me');

      if (!canEditAll) {
        if (!canEditMe || !this.isDealOwner(deal, currentUser)) {
          throw new ForbiddenException('Access restricted: You can only edit deals where you are the designated owner.');
        }
      }

      if (data.stage !== undefined && data.stage !== deal.stage) {
        const canStageAll = isWildcard || explicitPerms.includes('deals.stage.all') || explicitPerms.includes('deals.change_stage.all') || canEditAll;
        const canStageMe = explicitPerms.includes('deals.stage.me') || explicitPerms.includes('deals.change_stage.me') || canEditMe;
        if (!canStageAll) {
          if (!canStageMe || !this.isDealOwner(deal, currentUser)) {
            throw new ForbiddenException('Access restricted: You can only advance stages for deals assigned to you.');
          }
        }
      }

      if (data.owner !== undefined && data.owner !== deal.owner) {
        const canAssign = isWildcard || explicitPerms.includes('deals.assign');
        if (!canAssign) {
          throw new ForbiddenException('You do not have permission to reassign deal ownership.');
        }
      }
    }

    if (data.title !== undefined) deal.title = data.title;
    if (data.company !== undefined) deal.company = data.company;
    if (data.value !== undefined) {
      deal.value = Number(data.value);
      if (!data.formattedValue) {
        deal.formattedValue = `$${Number(data.value).toLocaleString()}`;
      }
    }
    if (data.formattedValue !== undefined) deal.formattedValue = data.formattedValue;
    if (data.stage !== undefined) deal.stage = data.stage;
    if (data.probability !== undefined) deal.probability = Number(data.probability);
    if (data.targetCloseDate !== undefined) deal.targetCloseDate = data.targetCloseDate;
    if (data.contact !== undefined) deal.contact = data.contact;
    if (data.owner !== undefined) deal.owner = data.owner;
    if (data.ownerInitials !== undefined) deal.ownerInitials = data.ownerInitials;
    if (data.tags !== undefined) deal.tags = data.tags;
    if (data.nextStep !== undefined) deal.nextStep = data.nextStep;
    if (data.competitor !== undefined) deal.competitor = data.competitor;
    if (data.lossReason !== undefined) deal.lossReason = data.lossReason;
    if (data.wonReason !== undefined) deal.wonReason = data.wonReason;
    if (data.cycleDays !== undefined) deal.cycleDays = Number(data.cycleDays) || 0;
    if (data.closedAt !== undefined) deal.closedAt = data.closedAt;
    if (data.linkedTasks !== undefined) deal.linkedTasks = data.linkedTasks;
    if (data.history !== undefined) deal.history = data.history;
    if (data.isArchived !== undefined) deal.isArchived = Boolean(data.isArchived);
    if (data.pipelineId !== undefined) deal.pipelineId = data.pipelineId;
    if (data.subFolderId !== undefined) deal.subFolderId = data.subFolderId;
    if (data.customLinks !== undefined) deal.customLinks = data.customLinks;

    return this.dealRepo.save(deal);
  }

  async remove(accountId: string, id: string, currentUser?: CurrentUserPayload) {
    const deal = await this.findOne(accountId, id, currentUser);

    if (currentUser) {
      const explicitPerms = await this.rolesService.getExplicitPermissionsList(accountId, currentUser);
      const isWildcard = explicitPerms.includes('*');
      const canDeleteAll = isWildcard || explicitPerms.includes('deals.delete.all') || explicitPerms.includes('deals.delete');
      const canDeleteMe = explicitPerms.includes('deals.delete.me');

      if (!canDeleteAll) {
        if (!canDeleteMe || !this.isDealOwner(deal, currentUser)) {
          throw new ForbiddenException('Access restricted: You can only delete deals where you are the designated owner.');
        }
      }
    }

    await this.dealRepo.remove(deal);
    return { id };
  }
}
