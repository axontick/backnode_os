import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Account,
  RefreshToken,
  PasswordResetToken,
  SpaceFolder,
  StatusDefinition,
  ListSettings,
  CrmPipeline,
  CrmStageDefinition,
  CrmPipelineSettings,
  TeamMember,
  TaskItem,
  CrmDeal,
  DirectoryContact,
} from '../entities';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard, StrictJwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Account,
      RefreshToken,
      PasswordResetToken,
      SpaceFolder,
      StatusDefinition,
      ListSettings,
      CrmPipeline,
      CrmStageDefinition,
      CrmPipelineSettings,
      TeamMember,
      TaskItem,
      CrmDeal,
      DirectoryContact,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'backnode-os-super-secret-jwt-key-2026',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, StrictJwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, StrictJwtAuthGuard, PassportModule, JwtModule],
})
export class AuthModule {}
