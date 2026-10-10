import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmDeal } from '../entities';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(CrmDeal)
    private readonly dealRepo: Repository<CrmDeal>,
  ) {}

  async findAll(accountId: string, pipelineId?: string) {
    const where: any = { accountId };
    if (pipelineId) where.pipelineId = pipelineId;

    return this.dealRepo.find({
      where,
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findOne(accountId: string, id: string) {
    const deal = await this.dealRepo.findOne({
      where: { id, accountId },
      relations: { pipeline: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found in this account`);
    }
    return deal;
  }

  async create(accountId: string, data: any) {
    let id = data.id;
    if (!id) {
      const count = await this.dealRepo.count({ where: { accountId } });
      id = `crm-${count + 1}`;
    }

    const {
      title,
      company = '',
      value = 0,
      formattedValue = `$${Number(value).toLocaleString()}`,
      stage = 'Qualified Lead',
      probability = 20,
      targetCloseDate = '',
      contact = {},
      owner = 'Alex Wong',
      ownerInitials = 'AW',
      tags = [],
      nextStep = '',
      linkedTasks = [],
      history = [],
      pipelineId = 'pipe-enterprise',
      subFolderId = null,
      competitor = null,
      lossReason = null,
      wonReason = null,
      cycleDays = 0,
      closedAt = null,
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
      pipelineId,
      subFolderId: subFolderId || undefined,
      accountId,
    });

    return this.dealRepo.save(deal);
  }

  async update(accountId: string, id: string, data: any) {
    const deal = await this.findOne(accountId, id);

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
    if (data.pipelineId !== undefined) deal.pipelineId = data.pipelineId;
    if (data.subFolderId !== undefined) deal.subFolderId = data.subFolderId;

    return this.dealRepo.save(deal);
  }

  async remove(accountId: string, id: string) {
    const deal = await this.findOne(accountId, id);
    await this.dealRepo.remove(deal);
    return { id };
  }
}
