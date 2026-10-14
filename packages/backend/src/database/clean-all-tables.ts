import 'dotenv/config';
import { AppDataSource } from './data-source';

async function cleanAll() {
  console.log('🔄 Connecting to database...');
  await AppDataSource.initialize();

  // Safety check: verify database name
  const dbResult = await AppDataSource.query('SELECT current_database() as db_name;');
  const currentDb = dbResult[0]?.db_name;
  console.log(`📌 Connected database: ${currentDb}`);

  if (currentDb !== 'backnode_os') {
    throw new Error(`Safety check failed: Connected to "${currentDb}", but expected "backnode_os"! Aborting.`);
  }

  // Get all tables in public schema
  const tablesResult: { tablename: string }[] = await AppDataSource.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
  );

  const allTables = tablesResult.map((r) => r.tablename);
  console.log(`📋 Found ${allTables.length} tables in public schema:`, allTables);

  // Tables to clean (exclude 'migrations' so schema versioning remains consistent)
  const dataTables = allTables.filter((t) => t !== 'migrations');

  console.log('\n📊 Auditing row counts BEFORE cleanup:');
  for (const table of allTables) {
    const countRes = await AppDataSource.query(`SELECT COUNT(*) as cnt FROM "${table}";`);
    console.log(`  - ${table}: ${countRes[0]?.cnt} rows`);
  }

  if (dataTables.length === 0) {
    console.log('No data tables found to truncate.');
    await AppDataSource.destroy();
    return;
  }

  console.log('\n🧹 Truncating all data tables with CASCADE and RESTART IDENTITY...');
  const tableListStr = dataTables.map((t) => `"${t}"`).join(', ');
  await AppDataSource.query(`TRUNCATE TABLE ${tableListStr} RESTART IDENTITY CASCADE;`);

  console.log('\n📊 Auditing row counts AFTER cleanup:');
  for (const table of allTables) {
    const countRes = await AppDataSource.query(`SELECT COUNT(*) as cnt FROM "${table}";`);
    console.log(`  - ${table}: ${countRes[0]?.cnt} rows`);
  }

  console.log('\n✅ All tables in backnode_os database have been cleaned successfully!');
  await AppDataSource.destroy();
}

cleanAll().catch((err) => {
  console.error('❌ Error cleaning database:', err);
  process.exit(1);
});
