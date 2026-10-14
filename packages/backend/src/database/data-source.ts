import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';
import * as entities from '../entities';

const dbUrl = (process.env.DATABASE_URL || 'postgresql://postgres:asimwattoo123@localhost:5432/backnode_os').replace(
  /\?schema=.*$/,
  '',
);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: Object.values(entities),
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}').replace(/\\/g, '/')],
  synchronize: false,
  logging: false,
});

