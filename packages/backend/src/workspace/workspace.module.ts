import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpaceFolder, StatusDefinition, ListSettings, Account, TeamMember, Department } from '../entities';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpaceFolder,
      StatusDefinition,
      ListSettings,
      Account,
      TeamMember,
      Department,
    ]),
  ],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
