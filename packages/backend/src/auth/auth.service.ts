import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Response } from 'express';
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
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  initialStatuses,
  initialListSettings,
  initialCrmStages,
  initialCrmPipelineSettings,
} from '@backnode/shared';

const REFRESH_COOKIE_NAME = 'backnode_refresh_token';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    @InjectRepository(SpaceFolder)
    private readonly folderRepo: Repository<SpaceFolder>,
    @InjectRepository(StatusDefinition)
    private readonly statusRepo: Repository<StatusDefinition>,
    @InjectRepository(ListSettings)
    private readonly listSettingsRepo: Repository<ListSettings>,
    @InjectRepository(CrmPipeline)
    private readonly pipelineRepo: Repository<CrmPipeline>,
    @InjectRepository(CrmStageDefinition)
    private readonly stageRepo: Repository<CrmStageDefinition>,
    @InjectRepository(CrmPipelineSettings)
    private readonly pipelineSettingsRepo: Repository<CrmPipelineSettings>,
    @InjectRepository(TeamMember)
    private readonly memberRepo: Repository<TeamMember>,
    @InjectRepository(TaskItem)
    private readonly taskRepo: Repository<TaskItem>,
    @InjectRepository(CrmDeal)
    private readonly dealRepo: Repository<CrmDeal>,
    @InjectRepository(DirectoryContact)
    private readonly contactRepo: Repository<DirectoryContact>,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  private async generateTokens(user: User, res: Response): Promise<{ accessToken: string }> {
    // 15-minute access token
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        accountId: user.accountId,
        role: user.role,
      },
      {
        expiresIn: '15m',
      },
    );

    // 7-day cryptographically secure refresh token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const refreshTokenEntity = this.refreshTokenRepo.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });
    await this.refreshTokenRepo.save(refreshTokenEntity);

    this.setRefreshCookie(res, rawRefreshToken);

    return { accessToken };
  }

  async signup(dto: SignupDto, res: Response) {
    const existingUser = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    // Generate unique slug for the account
    const baseSlug = dto.accountName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const slug = `${baseSlug}-${randomSuffix}`;

    // Create Account
    const account = this.accountRepo.create({
      name: dto.accountName.trim(),
      slug,
      ownerEmail: dto.email.toLowerCase().trim(),
    });
    await this.accountRepo.save(account);

    // Hash password & create Owner User
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      name: dto.name.trim(),
      role: 'OWNER',
      accountId: account.id,
    });
    await this.userRepo.save(user);

    account.ownerId = user.id;
    await this.accountRepo.save(account);

    // Provision default starter template data for the new account
    await this.provisionDefaultAccountData(account.id, dto.name.trim(), account.name, dto.email.toLowerCase().trim());

    // Generate tokens & set cookie
    const { accessToken } = await this.generateTokens(user, res);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: account.id,
        account: {
          id: account.id,
          name: account.name,
          slug: account.slug,
        },
      },
      accessToken,
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
      relations: { account: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.canLogin === false || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account login access has been disabled by workspace administration.');
    }

    const member = await this.memberRepo.findOne({
      where: { email: user.email.toLowerCase().trim(), accountId: user.accountId },
    });
    if (member && (member.canLogin === false || member.status === 'Disabled')) {
      throw new UnauthorizedException('Your operator login access has been disabled by workspace administration.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { accessToken } = await this.generateTokens(user, res);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        canLogin: user.canLogin,
        allowedPages: member?.allowedPages || ['overview', 'task-spaces', 'crm-pipelines', 'contacts', 'docs', 'team', 'settings'],
        allowedActions: member?.allowedActions || (user.role === 'VIEWER' ? ['read'] : ['read', 'write', 'delete', 'publish', 'admin']),
        accountId: user.accountId,
        account: user.account
          ? {
              id: user.account.id,
              name: user.account.name,
              slug: user.account.slug,
            }
          : undefined,
      },
      accessToken,
    };
  }

  async refresh(rawToken: string | undefined, res: Response) {
    if (!rawToken) {
      throw new UnauthorizedException('No refresh token provided.');
    }

    const tokenHash = this.hashToken(rawToken);
    const existingToken = await this.refreshTokenRepo.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: { account: true } },
    });

    if (!existingToken || !existingToken.user) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // Revoke used token (token rotation)
    existingToken.revokedAt = new Date();
    await this.refreshTokenRepo.save(existingToken);

    // Issue fresh tokens
    const { accessToken } = await this.generateTokens(existingToken.user, res);

    return {
      user: {
        id: existingToken.user.id,
        email: existingToken.user.email,
        name: existingToken.user.name,
        role: existingToken.user.role,
        accountId: existingToken.user.accountId,
        account: existingToken.user.account
          ? {
              id: existingToken.user.account.id,
              name: existingToken.user.account.name,
              slug: existingToken.user.account.slug,
            }
          : undefined,
      },
      accessToken,
    };
  }

  async logout(rawToken: string | undefined, res: Response) {
    if (rawToken) {
      const tokenHash = this.hashToken(rawToken);
      await this.refreshTokenRepo.update(
        { tokenHash, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
    }
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user) {
      // Do not reveal email existence to prevent user enumeration
      return {
        message: 'If an account exists with this email, a password reset link has been generated.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const resetToken = this.resetTokenRepo.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });
    await this.resetTokenRepo.save(resetToken);

    console.log(`\n🔑 [PASSWORD RESET] Token generated for ${user.email}:`);
    console.log(`Token: ${rawToken}`);
    console.log(`Direct link: http://localhost:3000?resetToken=${rawToken}\n`);

    return {
      message: 'If an account exists with this email, a password reset link has been generated.',
      devToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.resetTokenRepo.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true },
    });

    if (!resetToken || !resetToken.user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    // Update user password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    resetToken.user.passwordHash = passwordHash;
    await this.userRepo.save(resetToken.user);

    // Mark token as used
    resetToken.usedAt = new Date();
    await this.resetTokenRepo.save(resetToken);

    // Revoke all active refresh tokens for security
    await this.refreshTokenRepo.update(
      { userId: resetToken.user.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return { message: 'Password has been successfully reset. You may now log in.' };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { account: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (user.canLogin === false || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account login access has been disabled by workspace administration.');
    }

    const member = await this.memberRepo.findOne({
      where: { email: user.email.toLowerCase().trim(), accountId: user.accountId },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        canLogin: user.canLogin,
        allowedPages: member?.allowedPages || ['overview', 'task-spaces', 'crm-pipelines', 'contacts', 'docs', 'team', 'settings'],
        allowedActions: member?.allowedActions || (user.role === 'VIEWER' ? ['read'] : ['read', 'write', 'delete', 'publish', 'admin']),
        accountId: user.accountId,
        account: user.account
          ? {
              id: user.account.id,
              name: user.account.name,
              slug: user.account.slug,
            }
          : undefined,
      },
    };
  }

  private async provisionDefaultAccountData(
    accountId: string,
    ownerName: string,
    accountName: string = 'Workspace',
    userEmail: string = '',
  ) {
    // 1. Initial Member profile
    const initials =
      ownerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'OW';

    await this.memberRepo.save({
      id: `tm-${accountId.slice(0, 8)}`,
      name: ownerName,
      initials,
      role: 'Workspace Owner',
      accessLevel: 'OWNER',
      status: 'Active',
      email: userEmail,
      department: 'Executive',
      activeTasks: 0,
      capacityStatus: 'Available',
      avatarBg: '#ea580c',
      avatarColor: '#ffffff',
      accountId,
    });

    // 2. Default Status Definitions (clean setup for Kanban/List views)
    for (const s of initialStatuses) {
      await this.statusRepo.save({
        id: `${s.id}-${accountId.slice(0, 8)}`,
        order: s.order,
        name: s.name,
        description: s.description || '',
        color: s.color,
        stageMapping: s.stageMapping || '',
        activeVolume: 0,
        isDefault: s.isDefault ?? false,
        isClosed: s.isClosed ?? false,
        wipLimit: s.wipLimit,
        requirePrReview: s.requirePrReview ?? false,
        accountId,
      });
    }

    // 3. Default List Settings
    await this.listSettingsRepo.save({
      id: `list-settings-${accountId.slice(0, 8)}`,
      listId: `sprint-${accountId.slice(0, 8)}`,
      name: `${accountName} Sprint Cycle`,
      description: `Active engineering deliverables and sprint backlog for ${accountName}`,
      color: initialListSettings.color,
      icon: initialListSettings.icon,
      defaultView: initialListSettings.defaultView,
      defaultPriority: initialListSettings.defaultPriority,
      estimationUnit: initialListSettings.estimationUnit,
      distributedWriteLogging: initialListSettings.distributedWriteLogging,
      autoArchiveDays: initialListSettings.autoArchiveDays,
      strictForwardProgress: initialListSettings.strictForwardProgress,
      autoArchiveDone: initialListSettings.autoArchiveDone,
      accountId,
    });

    // 4. Starter Space Folder
    await this.folderRepo.save({
      id: `fld-sprint-${accountId.slice(0, 8)}`,
      name: `${accountName} Core`,
      icon: 'folder',
      color: '#ea580c',
      description: 'Active sprint tasks and deliverables',
      items: [
        {
          id: `sprint-${accountId.slice(0, 8)}`,
          name: 'Sprint 01',
          taskCount: 0,
          status: 'Active',
          active: true,
        },
      ],
      accountId,
    });

    // 5. Default CRM Pipeline
    const pipelineId = `pipe-${accountId.slice(0, 8)}`;
    await this.pipelineRepo.save({
      id: pipelineId,
      name: `${accountName} Sales Pipeline`,
      description: 'Primary customer deals and revenue flow',
      icon: 'leaderboard',
      color: '#ea580c',
      dealCount: 0,
      totalValue: 0,
      accountId,
    });

    // 6. Default CRM Stages
    for (const st of initialCrmStages) {
      await this.stageRepo.save({
        id: `${st.id}-${accountId.slice(0, 8)}`,
        order: st.order,
        name: st.name,
        description: st.description || '',
        color: st.color,
        winProbability: st.winProbability,
        daysLimit: st.daysLimit,
        activeDealsCount: 0,
        pipelineArr: 0,
        isTerminal: st.isTerminal ?? false,
        isHighlighted: st.isHighlighted ?? false,
        requiredGates: st.requiredGates,
        webhookEnabled: st.webhookEnabled,
        webhookThreshold: st.webhookThreshold,
        accountId,
      });
    }

    // 7. Default CRM Pipeline Settings
    await this.pipelineSettingsRepo.save({
      id: `crm-settings-${accountId.slice(0, 8)}`,
      code: `PIPE-${accountId.slice(0, 4).toUpperCase()}`,
      name: `${accountName} Pipeline Settings`,
      description: `Sales operations and stage settings for ${accountName}`,
      accentColor: initialCrmPipelineSettings.accentColor,
      icon: initialCrmPipelineSettings.icon,
      currency: initialCrmPipelineSettings.currency,
      formatNotation: initialCrmPipelineSettings.formatNotation,
      defaultCloseCycleDays: initialCrmPipelineSettings.defaultCloseCycleDays,
      winProbabilityAlgorithm: initialCrmPipelineSettings.winProbabilityAlgorithm,
      targetQuarterlyRevenue: 0,
      minDealValueGate: initialCrmPipelineSettings.minDealValueGate,
      defaultView: initialCrmPipelineSettings.defaultView,
      cardProps: initialCrmPipelineSettings.cardProps,
      governance: initialCrmPipelineSettings.governance,
      accountId,
    });
  }
}
