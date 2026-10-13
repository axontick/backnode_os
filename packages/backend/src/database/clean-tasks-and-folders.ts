import 'dotenv/config';
import { AppDataSource } from './data-source';
import {
  Account,
  Role,
  User,
  TeamMember,
  TaskItem,
  SpaceFolder,
  ListSettings,
} from '../entities';

async function clean() {
  console.log('🔄 Initializing database connection...');
  await AppDataSource.initialize();
  console.log('📦 Connected to PostgreSQL.');

  const accountRepo = AppDataSource.getRepository(Account);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const memberRepo = AppDataSource.getRepository(TeamMember);
  const taskRepo = AppDataSource.getRepository(TaskItem);
  const folderRepo = AppDataSource.getRepository(SpaceFolder);
  const listSettingsRepo = AppDataSource.getRepository(ListSettings);

  // 1. Audit before counts
  const beforeTasks = await taskRepo.count();
  const beforeFolders = await folderRepo.count();
  const beforeListSettings = await listSettingsRepo.count();
  const beforeAccounts = await accountRepo.count();
  const beforeRoles = await roleRepo.count();
  const beforeUsers = await userRepo.count();
  const beforeMembers = await memberRepo.count();

  console.log('\n📊 Current Database State:');
  console.log(` - Tasks (task_items): ${beforeTasks}`);
  console.log(` - Folders & Lists (space_folders): ${beforeFolders}`);
  console.log(` - List Settings (list_settings): ${beforeListSettings}`);
  console.log(` - Accounts (accounts): ${beforeAccounts} [PRESERVE]`);
  console.log(` - Roles (roles): ${beforeRoles} [PRESERVE]`);
  console.log(` - Users (users): ${beforeUsers} [PRESERVE]`);
  console.log(` - Team Members (team_members): ${beforeMembers} [PRESERVE]`);

  // 2. Perform targeted cleanup
  console.log('\n🧹 Cleaning tasks, lists, and folders...');

  // Delete all tasks
  console.log('  Deleting all task_items...');
  await AppDataSource.query('DELETE FROM task_items;');

  // Delete all space folders (which contain lists and subfolders)
  console.log('  Deleting all space_folders...');
  await AppDataSource.query('DELETE FROM space_folders;');

  // Delete all list settings
  console.log('  Deleting all list_settings...');
  await AppDataSource.query('DELETE FROM list_settings;');

  // Reset active_tasks counter on team_members
  console.log('  Resetting active_tasks counter on team_members to 0...');
  await AppDataSource.query('UPDATE team_members SET active_tasks = 0;');

  // 3. Audit after counts
  const afterTasks = await taskRepo.count();
  const afterFolders = await folderRepo.count();
  const afterListSettings = await listSettingsRepo.count();
  const afterAccounts = await accountRepo.count();
  const afterRoles = await roleRepo.count();
  const afterUsers = await userRepo.count();
  const afterMembers = await memberRepo.count();

  console.log('\n✅ Database Cleanup Complete:');
  console.log(` - Tasks remaining: ${afterTasks} (expected: 0)`);
  console.log(` - Folders & Lists remaining: ${afterFolders} (expected: 0)`);
  console.log(` - List Settings remaining: ${afterListSettings} (expected: 0)`);
  console.log(` - Accounts preserved: ${afterAccounts}`);
  console.log(` - Roles preserved: ${afterRoles}`);
  console.log(` - Users preserved: ${afterUsers}`);
  console.log(` - Team Members preserved: ${afterMembers}`);

  await AppDataSource.destroy();
  console.log('\n🔒 Database connection closed cleanly.');
}

clean().catch((err) => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
