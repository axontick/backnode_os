import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.crmPipeline.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const pipeline = await this.prisma.crmPipeline.findUnique({
      where: { id },
      include: { deals: true },
    });
    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${id} not found`);
    }
    return pipeline;
  }

  async create(data: any) {
    let id = data.id;
    if (!id) {
      id = `pipe-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }
    return this.prisma.crmPipeline.create({
      data: {
        id,
        name: data.name,
        description: data.description || '',
        icon: data.icon || 'building',
        color: data.color || '#9900c2',
        dealCount: data.dealCount || 0,
        totalValue: data.totalValue || 0,
      },
    });
  }

  async getStages() {
    return this.prisma.crmStageDefinition.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async updateStages(stages: any[]) {
    // Upsert or replace stages
    for (const stage of stages) {
      await this.prisma.crmStageDefinition.upsert({
        where: { id: stage.id },
        create: {
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
        },
        update: {
          order: stage.order,
          name: stage.name,
          description: stage.description,
          color: stage.color,
          winProbability: stage.winProbability,
          daysLimit: stage.daysLimit,
          activeDealsCount: stage.activeDealsCount,
          pipelineArr: stage.pipelineArr,
          isTerminal: stage.isTerminal,
          isHighlighted: stage.isHighlighted,
          requiredGates: stage.requiredGates,
          webhookEnabled: stage.webhookEnabled,
          webhookThreshold: stage.webhookThreshold,
        },
      });
    }
    return this.getStages();
  }

  async getSettings() {
    let settings = await this.prisma.crmPipelineSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.crmPipelineSettings.create({
        data: {
          id: 'default-crm-settings',
          code: 'PIPE-ENT',
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
        },
      });
    }
    return settings;
  }

  async updateSettings(data: any) {
    const settings = await this.getSettings();
    return this.prisma.crmPipelineSettings.update({
      where: { id: settings.id },
      data: {
        code: data.code !== undefined ? data.code : settings.code,
        name: data.name !== undefined ? data.name : settings.name,
        description: data.description !== undefined ? data.description : settings.description,
        accentColor: data.accentColor !== undefined ? data.accentColor : settings.accentColor,
        icon: data.icon !== undefined ? data.icon : settings.icon,
        currency: data.currency !== undefined ? data.currency : settings.currency,
        formatNotation: data.formatNotation !== undefined ? data.formatNotation : settings.formatNotation,
        defaultCloseCycleDays: data.defaultCloseCycleDays !== undefined ? data.defaultCloseCycleDays : settings.defaultCloseCycleDays,
        winProbabilityAlgorithm: data.winProbabilityAlgorithm !== undefined ? data.winProbabilityAlgorithm : settings.winProbabilityAlgorithm,
        targetQuarterlyRevenue: data.targetQuarterlyRevenue !== undefined ? data.targetQuarterlyRevenue : settings.targetQuarterlyRevenue,
        minDealValueGate: data.minDealValueGate !== undefined ? data.minDealValueGate : settings.minDealValueGate,
        defaultView: data.defaultView !== undefined ? data.defaultView : settings.defaultView,
        cardProps: data.cardProps !== undefined ? data.cardProps : settings.cardProps,
        governance: data.governance !== undefined ? data.governance : settings.governance,
      },
    });
  }
}
