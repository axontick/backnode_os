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

const dbUrl = (process.env.DATABASE_URL || 'postgresql://postgres:asimwattoo123@localhost:5432/backnode_os').replace(
  /\?schema=.*$/,
  '',
);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: dbUrl,
      entities: Object.values(entities),
      synchronize: true, // Schema auto-sync in development
      autoLoadEntities: true,
    }),
    AuthModule,
    TasksModule,
    DealsModule,
    PipelinesModule,
    MembersModule,
    ContactsModule,
    WorkspaceModule,
  ],
})
export class AppModule {}
