import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrmPipeline, CrmStageDefinition, CrmPipelineSettings } from '../entities';

@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(CrmPipeline)
    private readonly pipelineRepo: Repository<CrmPipeline>,
    @InjectRepository(CrmStageDefinition)
    private readonly stageRepo: Repository<CrmStageDefinition>,
    @InjectRepository(CrmPipelineSettings)
    private readonly pipelineSettingsRepo: Repository<CrmPipelineSettings>,
  ) {}

  async findAll(accountId: string) {
    return this.pipelineRepo.find({
      where: { accountId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(accountId: string, id: string) {
    const pipeline = await this.pipelineRepo.findOne({
      where: { id, accountId },
      relations: { deals: true },
    });
    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${id} not found in this account`);
    }
    return pipeline;
  }

  async create(accountId: string, data: any) {
    let id = data.id;
    if (!id) {
      id = `pipe-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }
    const pipeline = this.pipelineRepo.create({
      id,
      name: data.name,
      description: data.description || '',
      icon: data.icon || 'building',
      color: data.color || '#9900c2',
      dealCount: data.dealCount || 0,
      totalValue: data.totalValue || 0,
      accountId,
    });
    return this.pipelineRepo.save(pipeline);
  }

  async update(accountId: string, id: string, data: any) {
    const pipeline = await this.pipelineRepo.findOne({ where: { id, accountId } });
    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${id} not found in this account`);
    }

    if (data.name !== undefined) pipeline.name = data.name;
    if (data.description !== undefined) pipeline.description = data.description;
    if (data.icon !== undefined) pipeline.icon = data.icon;
    if (data.color !== undefined) pipeline.color = data.color;
    if (data.totalValue !== undefined) pipeline.totalValue = data.totalValue;

    return this.pipelineRepo.save(pipeline);
  }

  async delete(accountId: string, id: string) {
    const pipeline = await this.pipelineRepo.findOne({ where: { id, accountId } });
    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${id} not found in this account`);
    }
    await this.pipelineRepo.remove(pipeline);
    return { id };
  }

  async getStages(accountId: string) {
    return this.stageRepo.find({
      where: { accountId },
      order: { order: 'ASC' },
    });
  }

  async updateStages(accountId: string, stages: any[]) {
    for (const stage of stages) {
      await this.stageRepo.save({
        id: stage.id,
        order: stage.order,
        name: stage.name,
        description: stage.description || '',
        color: stage.color,
        winProbability: stage.winProbability,
        daysLimit: stage.daysLimit,
        activeDealsCount: stage.activeDealsCount || 0,
        pipelineArr: stage.pipelineArr || 0,
        isTerminal: stage.isTerminal || false,
        isHighlighted: stage.isHighlighted || false,
        requiredGates: stage.requiredGates || [],
        webhookEnabled: stage.webhookEnabled || false,
        webhookThreshold: stage.webhookThreshold || 0,
        accountId,
      });
    }
    return this.getStages(accountId);
  }

  async getSettings(accountId: string) {
    let settings = await this.pipelineSettingsRepo.findOne({ where: { accountId } });
    if (!settings) {
      settings = this.pipelineSettingsRepo.create({
        id: `crm-settings-${accountId.slice(0, 8)}`,
        code: `PIPE-${accountId.slice(0, 4).toUpperCase()}`,
        name: 'Enterprise Land & Expand Pipeline',
        description: 'High-touch strategic expansion motion for Tier-1 engineering organizations.',
        accentColor: '#9900c2',
        icon: 'building',
        currency: 'USD',
        formatNotation: 'Compact',
        defaultCloseCycleDays: 60,
        winProbabilityAlgorithm: 'Standard Stage Weighting',
        targetQuarterlyRevenue: 500000,
        minDealValueGate: 10000,
        defaultView: 'Kanban Board',
        cardProps: {
          displayDealAge: true,
          primaryContactAvatar: true,
          nextMilestonePill: true,
        },
        governance: {
          strictForwardMotion: false,
          stalledDealAlert: true,
          autoLinkDeliverables: true,
        },
        accountId,
      });
      await this.pipelineSettingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(accountId: string, data: any) {
    const settings = await this.getSettings(accountId);

    if (data.code !== undefined) settings.code = data.code;
    if (data.name !== undefined) settings.name = data.name;
    if (data.description !== undefined) settings.description = data.description;
    if (data.accentColor !== undefined) settings.accentColor = data.accentColor;
    if (data.icon !== undefined) settings.icon = data.icon;
    if (data.currency !== undefined) settings.currency = data.currency;
    if (data.formatNotation !== undefined) settings.formatNotation = data.formatNotation;
    if (data.defaultCloseCycleDays !== undefined) settings.defaultCloseCycleDays = data.defaultCloseCycleDays;
    if (data.winProbabilityAlgorithm !== undefined) settings.winProbabilityAlgorithm = data.winProbabilityAlgorithm;
    if (data.targetQuarterlyRevenue !== undefined) settings.targetQuarterlyRevenue = data.targetQuarterlyRevenue;
    if (data.minDealValueGate !== undefined) settings.minDealValueGate = data.minDealValueGate;
    if (data.defaultView !== undefined) settings.defaultView = data.defaultView;
    if (data.cardProps !== undefined) settings.cardProps = data.cardProps;
    if (data.governance !== undefined) settings.governance = data.governance;

    return this.pipelineSettingsRepo.save(settings);
  }
}
