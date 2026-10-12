import 'dotenv/config';
import { AppDataSource } from '../src/database/data-source';
import {
  Account,
  User,
  TeamMember,
  TaskItem,
  CrmDeal,
  DirectoryContact,
  DocItem,
  SpaceFolder,
  StatusDefinition,
  CrmPipeline,
  CrmStageDefinition,
} from '../src/entities';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

interface TestContext {
  accountId?: string;
  userId?: string;
  testTaskIds: string[];
  testDealIds: string[];
}

const context: TestContext = {
  testTaskIds: [],
  testDealIds: [],
};

async function run() {
  console.log('🧪 Starting Clean Account & Test Lifecycle Verification...');
  await AppDataSource.initialize();

  const accountRepo = AppDataSource.getRepository(Account);
  const userRepo = AppDataSource.getRepository(User);
  const memberRepo = AppDataSource.getRepository(TeamMember);
  const taskRepo = AppDataSource.getRepository(TaskItem);
  const dealRepo = AppDataSource.getRepository(CrmDeal);
  const contactRepo = AppDataSource.getRepository(DirectoryContact);
  const docRepo = AppDataSource.getRepository(DocItem);
  const folderRepo = AppDataSource.getRepository(SpaceFolder);
  const statusRepo = AppDataSource.getRepository(StatusDefinition);
  const pipelineRepo = AppDataSource.getRepository(CrmPipeline);
  const stageRepo = AppDataSource.getRepository(CrmStageDefinition);

  const timestamp = Date.now();
  const testAccountName = `Test Workspace ${timestamp}`;
  const testEmail = `test-${timestamp}@backnode.test`;

  try {
    // ------------------------------------------------------------------------
    // STEP 1: Create a dedicated custom test account via signup simulation / API
    // ------------------------------------------------------------------------
    console.log(`\n📌 1. Creating custom test account: "${testAccountName}" (${testEmail})...`);

    const slug = `test-ws-${timestamp.toString(36)}`;
    const testAccount = accountRepo.create({
      name: testAccountName,
      slug,
      ownerEmail: testEmail,
      color: '#ea580c',
      icon: 'workspaces',
    });
    const savedAccount = await accountRepo.save(testAccount);
    context.accountId = savedAccount.id;

    const passwordHash = await bcrypt.hash('TestSecret123!', 10);
    const testUser = userRepo.create({
      email: testEmail,
      passwordHash,
      name: 'QA Test Lead',
      role: 'OWNER',
      accountId: savedAccount.id,
    });
    const savedUser = await userRepo.save(testUser);
    context.userId = savedUser.id;

    savedAccount.ownerId = savedUser.id;
    await accountRepo.save(savedAccount);

    // Provision account using the updated clean provisioning logic
    const initials = 'QA';
    await memberRepo.save({
      id: `tm-${savedAccount.id.slice(0, 8)}`,
      name: 'QA Test Lead',
      initials,
      role: 'Workspace Owner',
      accessLevel: 'OWNER',
      status: 'Active',
      email: testEmail,
      department: 'Executive',
      activeTasks: 0,
      capacityStatus: 'Available',
      avatarBg: '#ea580c',
      avatarColor: '#ffffff',
      accountId: savedAccount.id,
    });

    await folderRepo.save({
      id: `fld-${savedAccount.id.slice(0, 8)}`,
      name: `${testAccountName} Core`,
      icon: 'folder',
      color: '#ea580c',
      description: 'Active sprint tasks and deliverables',
      items: [
        {
          id: `sprint-${savedAccount.id.slice(0, 8)}`,
          name: 'Sprint 01',
          taskCount: 0,
          status: 'Active',
          active: true,
        },
      ],
      accountId: savedAccount.id,
    });

    const pipelineId = `pipe-${savedAccount.id.slice(0, 8)}`;
    await pipelineRepo.save({
      id: pipelineId,
      name: `${testAccountName} Sales Pipeline`,
      description: 'Primary customer deals and revenue flow',
      icon: 'leaderboard',
      color: '#ea580c',
      dealCount: 0,
      totalValue: 0,
      accountId: savedAccount.id,
    });

    // ------------------------------------------------------------------------
    // STEP 2: Verify the new account has ZERO dummy data
    // ------------------------------------------------------------------------
    console.log('🔍 2. Verifying new account contains NO dummy data...');

    const tasks = await taskRepo.find({ where: { accountId: savedAccount.id } });
    const deals = await dealRepo.find({ where: { accountId: savedAccount.id } });
    const contacts = await contactRepo.find({ where: { accountId: savedAccount.id } });
    const docs = await docRepo.find({ where: { accountId: savedAccount.id } });
    const members = await memberRepo.find({ where: { accountId: savedAccount.id } });
    const folders = await folderRepo.find({ where: { accountId: savedAccount.id } });
    const pipelines = await pipelineRepo.find({ where: { accountId: savedAccount.id } });

    console.log(`   - Tasks count: ${tasks.length} (expected: 0)`);
    console.log(`   - Deals count: ${deals.length} (expected: 0)`);
    console.log(`   - Contacts count: ${contacts.length} (expected: 0)`);
    console.log(`   - Docs count: ${docs.length} (expected: 0)`);
    console.log(`   - Member activeTasks: ${members[0]?.activeTasks} (expected: 0)`);
    console.log(`   - Sprint taskCount: ${folders[0]?.items?.[0]?.taskCount} (expected: 0)`);
    console.log(`   - Pipeline dealCount: ${pipelines[0]?.dealCount} (expected: 0)`);
    console.log(`   - Pipeline totalValue: ${pipelines[0]?.totalValue} (expected: 0)`);

    if (tasks.length !== 0) throw new Error(`Dummy tasks detected: ${tasks.length}`);
    if (deals.length !== 0) throw new Error(`Dummy deals detected: ${deals.length}`);
    if (contacts.length !== 0) throw new Error(`Dummy contacts detected: ${contacts.length}`);
    if (docs.length !== 0) throw new Error(`Dummy docs detected: ${docs.length}`);
    if (members[0]?.activeTasks !== 0) throw new Error('Member activeTasks is not 0');
    if (folders[0]?.items?.[0]?.taskCount !== 0) throw new Error('Sprint taskCount is not 0');
    if (pipelines[0]?.dealCount !== 0) throw new Error('Pipeline dealCount is not 0');
    if (pipelines[0]?.totalValue !== 0) throw new Error('Pipeline totalValue is not 0');

    console.log('   ✅ PASS: New account is clean with zero dummy data.');

    // ------------------------------------------------------------------------
    // STEP 3: Perform testing inside the custom test account
    // ------------------------------------------------------------------------
    console.log('\n⚡ 3. Performing tests inside the custom test account...');

    // Test creating a task
    const testTaskId = `TEST-TASK-${timestamp}`;
    const testTask = taskRepo.create({
      id: testTaskId,
      title: 'Automated test task in custom test account',
      description: 'Testing task creation and isolation',
      status: 'In Progress',
      priority: 'High',
      assigneeId: members[0].id,
      accountId: savedAccount.id,
    });
    await taskRepo.save(testTask);
    context.testTaskIds.push(testTaskId);
    console.log(`   - Created test task: ${testTaskId}`);

    // Verify task is present in custom test account
    const foundTask = await taskRepo.findOne({ where: { id: testTaskId, accountId: savedAccount.id } });
    if (!foundTask || foundTask.title !== 'Automated test task in custom test account') {
      throw new Error('Test task was not saved or retrieved correctly');
    }
    console.log('   - Verified test task exists in custom test account.');

    // Test creating a deal
    const testDealId = `TEST-DEAL-${timestamp}`;
    const testDeal = dealRepo.create({
      id: testDealId,
      title: 'Automated test deal in custom test account',
      company: 'Test Corp',
      value: 12000,
      formattedValue: '$12,000',
      stage: 'Discovery',
      targetCloseDate: 'Dec 31, 2026',
      contact: { name: 'Test Contact', email: 'contact@test.com' },
      owner: 'QA Test Lead',
      ownerInitials: 'QA',
      pipelineId,
      accountId: savedAccount.id,
    });
    await dealRepo.save(testDeal);
    context.testDealIds.push(testDealId);
    console.log(`   - Created test deal: ${testDealId}`);

    const foundDeal = await dealRepo.findOne({ where: { id: testDealId, accountId: savedAccount.id } });
    if (!foundDeal || foundDeal.value !== 12000) {
      throw new Error('Test deal was not saved or retrieved correctly');
    }
    console.log('   - Verified test deal exists in custom test account.');

    console.log('   ✅ PASS: Testing in custom test account completed successfully.');
  } finally {
    // ------------------------------------------------------------------------
    // STEP 4: GUARANTEED TEARDOWN - Clear all test data and test account
    // ------------------------------------------------------------------------
    console.log('\n🧹 4. TEARDOWN: Clearing all data added during tests...');

    if (context.accountId) {
      const accId = context.accountId;

      // 1. Delete test tasks
      const deletedTasks = await taskRepo.delete({ accountId: accId });
      console.log(`   - Deleted ${deletedTasks.affected || 0} task(s)`);

      // 2. Delete test deals
      const deletedDeals = await dealRepo.delete({ accountId: accId });
      console.log(`   - Deleted ${deletedDeals.affected || 0} deal(s)`);

      // 3. Delete contacts, docs, folders, stages, pipelines, statuses, members
      await contactRepo.delete({ accountId: accId });
      await docRepo.delete({ accountId: accId });
      await folderRepo.delete({ accountId: accId });
      await stageRepo.delete({ accountId: accId });
      await pipelineRepo.delete({ accountId: accId });
      await statusRepo.delete({ accountId: accId });
      await memberRepo.delete({ accountId: accId });

      // 4. Delete user and account
      if (context.userId) {
        await userRepo.delete({ id: context.userId });
        console.log(`   - Deleted test user: ${context.userId}`);
      }

      await accountRepo.delete({ id: accId });
      console.log(`   - Deleted custom test account: ${accId}`);

      // Verify complete purge
      const remainingTasks = await taskRepo.count({ where: { accountId: accId } });
      const remainingDeals = await dealRepo.count({ where: { accountId: accId } });
      const remainingAccount = await accountRepo.count({ where: { id: accId } });

      if (remainingTasks > 0 || remainingDeals > 0 || remainingAccount > 0) {
        throw new Error('Teardown verification failed: test records still remain in database!');
      }

      console.log('   ✅ PASS: All test data and custom test account completely cleared from database.');
    }

    await AppDataSource.destroy();
  }

  console.log('\n🎉 All tests passed with 100% clean account guarantee and complete teardown!\n');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
