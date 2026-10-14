import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { DealsModule } from './deals/deals.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { MembersModule } from './members/members.module';
import { ContactsModule } from './contacts/contacts.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { RolesModule } from './roles/roles.module';
import { PluginsModule } from './plugins/plugins.module';
import { DocsModule } from './docs/docs.module';

const dbUrl = (process.env.DATABASE_URL || 'postgresql://postgres:asimwattoo123@localhost:5432/backnode_os').replace(
  /\?schema=.*$/,
  '',
);

const useSqlite = process.env.DB_TYPE === 'sqlite' || (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production');

@Module({
  imports: [
    TypeOrmModule.forRoot(
      useSqlite
        ? {
            type: 'better-sqlite3',
            database: 'backnode.sqlite',
            entities: Object.values(entities),
            synchronize: true,
            autoLoadEntities: true,
          }
        : {
            type: 'postgres',
            url: dbUrl,
            entities: Object.values(entities),
            synchronize: true,
            autoLoadEntities: true,
          },
    ),
    AuthModule,
    TasksModule,
    DealsModule,
    PipelinesModule,
    MembersModule,
    ContactsModule,
    WorkspaceModule,
    RolesModule,
    PluginsModule,
    DocsModule,
  ],
})
export class AppModule {}
