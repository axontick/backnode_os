import { PrismaClient } from '@prisma/client';
import {
  initialTeamMembers,
  initialStatuses,
  initialListSettings,
  initialFolders,
  initialCrmPipelines,
  initialCrmStages,
  initialCrmPipelineSettings,
  initialCrmDeals,
  initialTasks,
  initialDirectoryContacts,
} from '@backnode/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Backnode OS...');

  // 1. Team Members
  console.log(`Seeding ${initialTeamMembers.length} team members...`);
  for (const member of initialTeamMembers) {
    await prisma.teamMember.upsert({
      where: { id: member.id },
      create: {
        id: member.id,
        name: member.name,
        initials: member.initials,
        role: member.role,
        department: member.department,
        activeTasks: member.activeTasks,
        capacityStatus: member.capacityStatus,
        avatarBg: member.avatarBg,
        avatarColor: member.avatarColor,
      },
      update: {
        name: member.name,
        initials: member.initials,
        role: member.role,
        department: member.department,
        activeTasks: member.activeTasks,
        capacityStatus: member.capacityStatus,
        avatarBg: member.avatarBg,
        avatarColor: member.avatarColor,
      },
    });
  }

  // 2. Status Definitions
  console.log(`Seeding ${initialStatuses.length} status definitions...`);
  for (const status of initialStatuses) {
    await prisma.statusDefinition.upsert({
      where: { id: status.id },
      create: {
        id: status.id,
        order: status.order,
        name: status.name,
        description: status.description || '',
        color: status.color,
        stageMapping: status.stageMapping || '',
        activeVolume: status.activeVolume || 0,
        isDefault: status.isDefault ?? false,
        isClosed: status.isClosed ?? false,
        wipLimit: status.wipLimit,
        requirePrReview: status.requirePrReview ?? false,
      },
      update: {
        order: status.order,
        name: status.name,
        description: status.description || '',
        color: status.color,
        stageMapping: status.stageMapping || '',
        activeVolume: status.activeVolume || 0,
        isDefault: status.isDefault ?? false,
        isClosed: status.isClosed ?? false,
        wipLimit: status.wipLimit,
        requirePrReview: status.requirePrReview ?? false,
      },
    });
  }

  // 3. List Settings
  console.log('Seeding list settings...');
  await prisma.listSettings.upsert({
    where: { listId: initialListSettings.listId },
    create: {
      id: 'default-list-settings',
      listId: initialListSettings.listId,
      name: initialListSettings.name,
      description: initialListSettings.description || '',
      color: initialListSettings.color,
      icon: initialListSettings.icon,
      defaultView: initialListSettings.defaultView,
      defaultPriority: initialListSettings.defaultPriority,
      estimationUnit: initialListSettings.estimationUnit,
      distributedWriteLogging: initialListSettings.distributedWriteLogging,
      autoArchiveDays: initialListSettings.autoArchiveDays,
      strictForwardProgress: initialListSettings.strictForwardProgress,
      autoArchiveDone: initialListSettings.autoArchiveDone,
    },
    update: {
      name: initialListSettings.name,
      description: initialListSettings.description || '',
      color: initialListSettings.color,
      icon: initialListSettings.icon,
      defaultView: initialListSettings.defaultView,
      defaultPriority: initialListSettings.defaultPriority,
      estimationUnit: initialListSettings.estimationUnit,
      distributedWriteLogging: initialListSettings.distributedWriteLogging,
      autoArchiveDays: initialListSettings.autoArchiveDays,
      strictForwardProgress: initialListSettings.strictForwardProgress,
      autoArchiveDone: initialListSettings.autoArchiveDone,
    },
  });

  // 4. Space Folders
  console.log(`Seeding ${initialFolders.length} folders...`);
  for (const folder of initialFolders) {
    await prisma.spaceFolder.upsert({
      where: { id: folder.id },
      create: {
        id: folder.id,
        name: folder.name,
        icon: folder.icon,
        color: folder.color,
        description: folder.description || '',
        items: folder.items as any,
      },
      update: {
        name: folder.name,
        icon: folder.icon,
        color: folder.color,
        description: folder.description || '',
        items: folder.items as any,
      },
    });
  }

  // 5. CRM Pipelines
  console.log(`Seeding ${initialCrmPipelines.length} CRM pipelines...`);
  for (const pipeline of initialCrmPipelines) {
    await prisma.crmPipeline.upsert({
      where: { id: pipeline.id },
      create: {
        id: pipeline.id,
        name: pipeline.name,
        description: pipeline.description || '',
        icon: pipeline.icon,
        color: pipeline.color,
        dealCount: pipeline.dealCount,
        totalValue: pipeline.totalValue,
      },
      update: {
        name: pipeline.name,
        description: pipeline.description || '',
        icon: pipeline.icon,
        color: pipeline.color,
        dealCount: pipeline.dealCount,
        totalValue: pipeline.totalValue,
      },
    });
  }

  // 6. CRM Stages
  console.log(`Seeding ${initialCrmStages.length} CRM stages...`);
  for (const stage of initialCrmStages) {
    await prisma.crmStageDefinition.upsert({
      where: { id: stage.id },
      create: {
        id: stage.id,
        order: stage.order,
        name: stage.name,
        description: stage.description || '',
        color: stage.color,
        winProbability: stage.winProbability,
        daysLimit: stage.daysLimit,
        activeDealsCount: stage.activeDealsCount,
        pipelineArr: stage.pipelineArr,
        isTerminal: stage.isTerminal ?? false,
        isHighlighted: stage.isHighlighted ?? false,
        requiredGates: stage.requiredGates as any,
        webhookEnabled: stage.webhookEnabled ?? false,
        webhookThreshold: stage.webhookThreshold ?? 0,
      },
      update: {
        order: stage.order,
        name: stage.name,
        description: stage.description || '',
        color: stage.color,
        winProbability: stage.winProbability,
        daysLimit: stage.daysLimit,
        activeDealsCount: stage.activeDealsCount,
        pipelineArr: stage.pipelineArr,
        isTerminal: stage.isTerminal ?? false,
        isHighlighted: stage.isHighlighted ?? false,
        requiredGates: stage.requiredGates as any,
        webhookEnabled: stage.webhookEnabled ?? false,
        webhookThreshold: stage.webhookThreshold ?? 0,
      },
    });
  }

  // 7. CRM Settings
  console.log('Seeding CRM settings...');
  await prisma.crmPipelineSettings.upsert({
    where: { code: initialCrmPipelineSettings.code },
    create: {
      id: 'default-crm-settings',
      code: initialCrmPipelineSettings.code,
      name: initialCrmPipelineSettings.name,
      description: initialCrmPipelineSettings.description,
      accentColor: initialCrmPipelineSettings.accentColor,
      icon: initialCrmPipelineSettings.icon,
      currency: initialCrmPipelineSettings.currency,
      formatNotation: initialCrmPipelineSettings.formatNotation,
      defaultCloseCycleDays: initialCrmPipelineSettings.defaultCloseCycleDays,
      winProbabilityAlgorithm: initialCrmPipelineSettings.winProbabilityAlgorithm,
      targetQuarterlyRevenue: initialCrmPipelineSettings.targetQuarterlyRevenue,
      minDealValueGate: initialCrmPipelineSettings.minDealValueGate,
      defaultView: initialCrmPipelineSettings.defaultView,
      cardProps: initialCrmPipelineSettings.cardProps as any,
      governance: initialCrmPipelineSettings.governance as any,
    },
    update: {
      name: initialCrmPipelineSettings.name,
      description: initialCrmPipelineSettings.description,
      accentColor: initialCrmPipelineSettings.accentColor,
      icon: initialCrmPipelineSettings.icon,
      currency: initialCrmPipelineSettings.currency,
      formatNotation: initialCrmPipelineSettings.formatNotation,
      defaultCloseCycleDays: initialCrmPipelineSettings.defaultCloseCycleDays,
      winProbabilityAlgorithm: initialCrmPipelineSettings.winProbabilityAlgorithm,
      targetQuarterlyRevenue: initialCrmPipelineSettings.targetQuarterlyRevenue,
      minDealValueGate: initialCrmPipelineSettings.minDealValueGate,
      defaultView: initialCrmPipelineSettings.defaultView,
      cardProps: initialCrmPipelineSettings.cardProps as any,
      governance: initialCrmPipelineSettings.governance as any,
    },
  });

  // 8. CRM Deals
  console.log(`Seeding ${initialCrmDeals.length} CRM deals...`);
  for (const deal of initialCrmDeals) {
    await prisma.crmDeal.upsert({
      where: { id: deal.id },
      create: {
        id: deal.id,
        title: deal.title,
        company: deal.company,
        value: deal.value,
        formattedValue: deal.formattedValue,
        stage: deal.stage,
        probability: deal.probability,
        targetCloseDate: deal.targetCloseDate,
        contact: deal.contact as any,
        owner: deal.owner,
        ownerInitials: deal.ownerInitials,
        tags: deal.tags,
        nextStep: deal.nextStep,
        linkedTasks: deal.linkedTasks as any,
        history: deal.history as any,
        pipelineId: 'pipe-enterprise',
      },
      update: {
        title: deal.title,
        company: deal.company,
        value: deal.value,
        formattedValue: deal.formattedValue,
        stage: deal.stage,
        probability: deal.probability,
        targetCloseDate: deal.targetCloseDate,
        contact: deal.contact as any,
        owner: deal.owner,
        ownerInitials: deal.ownerInitials,
        tags: deal.tags,
        nextStep: deal.nextStep,
        linkedTasks: deal.linkedTasks as any,
        history: deal.history as any,
        pipelineId: 'pipe-enterprise',
      },
    });
  }

  // 9. Task Items
  console.log(`Seeding ${initialTasks.length} tasks...`);
  for (const task of initialTasks) {
    await prisma.taskItem.upsert({
      where: { id: task.id },
      create: {
        id: task.id,
        title: task.title,
        description: task.description,
        specMarkdown: task.specMarkdown,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee?.id,
        tags: task.tags,
        subtasks: task.subtasks as any,
        estimation: task.estimation as any,
        targetCycle: task.targetCycle,
        listId: (task as any).listId || null,
        dueDate: task.dueDate,
        gitBranch: task.gitBranch,
        replicationHash: task.replicationHash,
        timeInStage: task.timeInStage,
        linkedCrmDeal: task.linkedCrmDeal as any,
        activity: task.activity as any,
      },
      update: {
        title: task.title,
        description: task.description,
        specMarkdown: task.specMarkdown,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee?.id,
        tags: task.tags,
        subtasks: task.subtasks as any,
        estimation: task.estimation as any,
        targetCycle: task.targetCycle,
        listId: (task as any).listId || null,
        dueDate: task.dueDate,
        gitBranch: task.gitBranch,
        replicationHash: task.replicationHash,
        timeInStage: task.timeInStage,
        linkedCrmDeal: task.linkedCrmDeal as any,
        activity: task.activity as any,
      },
    });
  }

  // 10. Directory Contacts
  console.log(`Seeding ${initialDirectoryContacts.length} directory contacts...`);
  for (const contact of initialDirectoryContacts) {
    await prisma.directoryContact.upsert({
      where: { id: contact.id },
      create: {
        id: contact.id,
        name: contact.name,
        initials: contact.initials,
        role: contact.role,
        tag: contact.tag,
        tagColor: contact.tagColor,
        company: contact.company,
        companyColor: contact.companyColor,
        arr: contact.arr,
        email: contact.email,
        phone: contact.phone,
        dealName: contact.dealName,
        deliverablesCount: contact.deliverablesCount,
        lastActivity: contact.lastActivity,
        lastActivityTime: contact.lastActivityTime,
        healthScore: contact.healthScore,
        healthCategory: contact.healthCategory,
        accountDescription: contact.accountDescription,
        renewalDate: contact.renewalDate,
        storageKey: contact.storageKey,
        replicationHash: contact.replicationHash,
      },
      update: {
        name: contact.name,
        initials: contact.initials,
        role: contact.role,
        tag: contact.tag,
        tagColor: contact.tagColor,
        company: contact.company,
        companyColor: contact.companyColor,
        arr: contact.arr,
        email: contact.email,
        phone: contact.phone,
        dealName: contact.dealName,
        deliverablesCount: contact.deliverablesCount,
        lastActivity: contact.lastActivity,
        lastActivityTime: contact.lastActivityTime,
        healthScore: contact.healthScore,
        healthCategory: contact.healthCategory,
        accountDescription: contact.accountDescription,
        renewalDate: contact.renewalDate,
        storageKey: contact.storageKey,
        replicationHash: contact.replicationHash,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
