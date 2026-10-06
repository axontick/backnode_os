import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import {
  Account,
  User,
  TeamMember,
  StatusDefinition,
  ListSettings,
  SpaceFolder,
  CrmPipeline,
  CrmStageDefinition,
  CrmPipelineSettings,
  CrmDeal,
  TaskItem,
  DirectoryContact,
} from '../entities';
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

const DEFAULT_ACCOUNT_ID = 'acc-default';

async function seed() {
  console.log('🌱 Starting TypeORM database seeding for Backnode OS...');
  await AppDataSource.initialize();
  console.log('📦 Connected to PostgreSQL database.');
  console.log('🔄 Recreating public schema and synchronizing TypeORM entities...');
  await AppDataSource.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await AppDataSource.synchronize();
  console.log('✨ Fresh schema created successfully.');

  const accountRepo = AppDataSource.getRepository(Account);
  const userRepo = AppDataSource.getRepository(User);
  const memberRepo = AppDataSource.getRepository(TeamMember);
  const statusRepo = AppDataSource.getRepository(StatusDefinition);
  const listSettingsRepo = AppDataSource.getRepository(ListSettings);
  const folderRepo = AppDataSource.getRepository(SpaceFolder);
  const pipelineRepo = AppDataSource.getRepository(CrmPipeline);
  const stageRepo = AppDataSource.getRepository(CrmStageDefinition);
  const pipelineSettingsRepo = AppDataSource.getRepository(CrmPipelineSettings);
  const dealRepo = AppDataSource.getRepository(CrmDeal);
  const taskRepo = AppDataSource.getRepository(TaskItem);
  const contactRepo = AppDataSource.getRepository(DirectoryContact);

  // 1. Seed Default Account
  console.log('🏢 Seeding default account...');
  let defaultAccount = await accountRepo.findOne({ where: { id: DEFAULT_ACCOUNT_ID } });
  if (!defaultAccount) {
    defaultAccount = accountRepo.create({
      id: DEFAULT_ACCOUNT_ID,
      name: 'Backnode Core',
      slug: 'backnode-core',
    });
    await accountRepo.save(defaultAccount);
  }

  // 2. Seed Default Demo User (Alex Wong)
  console.log('👤 Seeding default demo user (alex@backnode.io)...');
  let demoUser = await userRepo.findOne({ where: { email: 'alex@backnode.io' } });
  const passwordHash = await bcrypt.hash('Password123!', 10);
  if (!demoUser) {
    demoUser = userRepo.create({
      id: 'user-alex',
      email: 'alex@backnode.io',
      name: 'Alex Wong',
      role: 'OWNER',
      passwordHash,
      accountId: DEFAULT_ACCOUNT_ID,
    });
    await userRepo.save(demoUser);
  } else {
    demoUser.passwordHash = passwordHash;
    demoUser.accountId = DEFAULT_ACCOUNT_ID;
    await userRepo.save(demoUser);
  }

  // 3. Team Members
  console.log(`Seeding ${initialTeamMembers.length} team members...`);
  for (const m of initialTeamMembers) {
    await memberRepo.save({
      id: m.id,
      name: m.name,
      initials: m.initials,
      role: m.role,
      department: m.department,
      activeTasks: m.activeTasks,
      capacityStatus: m.capacityStatus,
      avatarBg: m.avatarBg,
      avatarColor: m.avatarColor,
      accountId: DEFAULT_ACCOUNT_ID,
    });
  }

  // 4. Status Definitions
  console.log(`Seeding ${initialStatuses.length} status definitions...`);
  for (const s of initialStatuses) {
    await statusRepo.save({
      id: s.id,
      order: s.order,
      name: s.name,
      description: s.description || '',
      color: s.color,
      stageMapping: s.stageMapping || '',
      activeVolume: s.activeVolume || 0,
      isDefault: s.isDefault ?? false,
      isClosed: s.isClosed ?? false,
      wipLimit: s.wipLimit,
      requirePrReview: s.requirePrReview ?? false,
      accountId: DEFAULT_ACCOUNT_ID,
    });
  }

  // 5. List Settings
  console.log('Seeding list settings...');
  await listSettingsRepo.save({
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
    accountId: DEFAULT_ACCOUNT_ID,
  });

  // 6. Space Folders
  console.log(`Seeding ${initialFolders.length} space folders...`);
  for (const f of initialFolders) {
    await folderRepo.save({
      id: f.id,
      name: f.name,
      icon: f.icon,
      color: f.color,
      description: f.description || '',
      items: f.items,
      accountId: DEFAULT_ACCOUNT_ID,
    });
  }

  // 7. CRM Pipelines
  console.log(`Seeding ${initialCrmPipelines.length} CRM pipelines...`);
  for (const p of initialCrmPipelines) {
    await pipelineRepo.save({
      id: p.id,
      name: p.name,
      description: p.description || '',
      icon: p.icon || 'building',
      color: p.color || '#9900c2',
      dealCount: p.dealCount,
      totalValue: p.totalValue,
      accountId: DEFAULT_ACCOUNT_ID,
    });
  }

  // 8. CRM Stages
  console.log(`Seeding ${initialCrmStages.length} CRM stage definitions...`);
  for (const st of initialCrmStages) {
    await stageRepo.save({
      id: st.id,
      order: st.order,
      name: st.name,
      description: st.description || '',
      color: st.color,
      winProbability: st.winProbability,
      daysLimit: st.daysLimit,
      activeDealsCount: st.activeDealsCount,
      pipelineArr: st.pipelineArr,
      isTerminal: st.isTerminal ?? false,
      isHighlighted: st.isHighlighted ?? false,
      requiredGates: st.requiredGates,
      webhookEnabled: st.webhookEnabled,
      webhookThreshold: st.webhookThreshold,
      accountId: DEFAULT_ACCOUNT_ID,
    });
  }

  // 9. CRM Pipeline Settings
  console.log('Seeding CRM pipeline settings...');
  await pipelineSettingsRepo.save({
    id: 'default-crm-settings',
    code: initialCrmPipelineSettings.code,
    name: initialCrmPipelineSettings.name,
    description: initialCrmPipelineSettings.description || '',
    accentColor: initialCrmPipelineSettings.accentColor,
    icon: initialCrmPipelineSettings.icon,
    currency: initialCrmPipelineSettings.currency,
    formatNotation: initialCrmPipelineSettings.formatNotation,
    defaultCloseCycleDays: initialCrmPipelineSettings.defaultCloseCycleDays,
    winProbabilityAlgorithm: initialCrmPipelineSettings.winProbabilityAlgorithm,
    targetQuarterlyRevenue: initialCrmPipelineSettings.targetQuarterlyRevenue,
    minDealValueGate: initialCrmPipelineSettings.minDealValueGate,
    defaultView: initialCrmPipelineSettings.defaultView,
    cardProps: initialCrmPipelineSettings.cardProps,
    governance: initialCrmPipelineSettings.governance,
    accountId: DEFAULT_ACCOUNT_ID,
  });

  // 10. CRM Deals
  console.log(`Seeding ${initialCrmDeals.length} CRM deals...`);
  for (const d of initialCrmDeals) {
    await dealRepo.save({
      id: d.id,
      title: d.title,
      company: d.company,
      value: d.value,
      formattedValue: d.formattedValue,
      stage: d.stage,
      probability: d.probability,
      targetCloseDate: d.targetCloseDate,
      contact: d.contact,
      owner: d.owner,
      ownerInitials: d.ownerInitials,
      tags: d.tags,
      nextStep: d.nextStep || null,
      linkedTasks: d.linkedTasks,
      history: d.history,
      pipelineId: 'pipe-enterprise',
      accountId: DEFAULT_ACCOUNT_ID,
    });
  }

  // 11. Tasks
  console.log(`Seeding ${initialTasks.length} tasks...`);
  for (const t of initialTasks) {
    await taskRepo.save({
      id: t.id,
      title: t.title,
      description: t.description || '',
      specMarkdown: t.specMarkdown || '',
      status: t.status,
      priority: t.priority,
      assigneeId: t.assignee?.id || null,
      tags: t.tags,
      subtasks: t.subtasks,
      estimation: t.estimation,
      targetCycle: t.targetCycle || null,
      dueDate: t.dueDate || null,
      gitBranch: t.gitBranch || null,
      replicationHash: t.replicationHash || null,
      timeInStage: t.timeInStage || null,
      linkedCrmDeal: t.linkedCrmDeal || null,
      activity: t.activity,
      accountId: DEFAULT_ACCOUNT_ID,
    });
  }

  // 12. Directory Contacts
  console.log(`Seeding ${initialDirectoryContacts.length} directory contacts...`);
  for (const c of initialDirectoryContacts) {
    await contactRepo.save({
      id: c.id,
      name: c.name,
      initials: c.initials,
      role: c.role,
      tag: c.tag,
      tagColor: c.tagColor,
      company: c.company,
      companyColor: c.companyColor,
      arr: c.arr,
      email: c.email,
      phone: c.phone,
      dealName: c.dealName,
      deliverablesCount: c.deliverablesCount,
      lastActivity: c.lastActivity,
      lastActivityTime: c.lastActivityTime,
      healthScore: c.healthScore,
      healthCategory: c.healthCategory,
      accountDescription: c.accountDescription || '',
      renewalDate: c.renewalDate,
      storageKey: c.storageKey,
      replicationHash: c.replicationHash,
      accountId: DEFAULT_ACCOUNT_ID,
    });
  }

  console.log('✅ TypeORM database seeding completed successfully!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
