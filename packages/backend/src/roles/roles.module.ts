import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role, TeamMember, User } from '../entities';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, TeamMember, User])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
