import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { DealsModule } from './deals/deals.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { MembersModule } from './members/members.module';
import { ContactsModule } from './contacts/contacts.module';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    PrismaModule,
    TasksModule,
    DealsModule,
    PipelinesModule,
    MembersModule,
    ContactsModule,
    WorkspaceModule,
  ],
})
export class AppModule {}
