import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pipelineId?: string) {
    const where: any = {};
    if (pipelineId) where.pipelineId = pipelineId;

    return this.prisma.crmDeal.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.crmDeal.findUnique({
      where: { id },
      include: {
        pipeline: true,
      },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }
    return deal;
  }

  async create(data: any) {
    let id = data.id;
    if (!id) {
      const count = await this.prisma.crmDeal.count();
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
    } = data;

    return this.prisma.crmDeal.create({
      data: {
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
        linkedTasks,
        history,
        pipelineId,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.value !== undefined) {
      updateData.value = Number(data.value);
      if (!data.formattedValue) {
        updateData.formattedValue = `$${Number(data.value).toLocaleString()}`;
      }
    }
    if (data.formattedValue !== undefined) updateData.formattedValue = data.formattedValue;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.probability !== undefined) updateData.probability = Number(data.probability);
    if (data.targetCloseDate !== undefined) updateData.targetCloseDate = data.targetCloseDate;
    if (data.contact !== undefined) updateData.contact = data.contact;
    if (data.owner !== undefined) updateData.owner = data.owner;
    if (data.ownerInitials !== undefined) updateData.ownerInitials = data.ownerInitials;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.nextStep !== undefined) updateData.nextStep = data.nextStep;
    if (data.linkedTasks !== undefined) updateData.linkedTasks = data.linkedTasks;
    if (data.history !== undefined) updateData.history = data.history;
    if (data.pipelineId !== undefined) updateData.pipelineId = data.pipelineId;

    return this.prisma.crmDeal.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.crmDeal.delete({
      where: { id },
    });
  }
}
