import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TeamMember, Account, User } from '../entities';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly memberRepo: Repository<TeamMember>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(accountId: string) {
    const members = await this.memberRepo.find({
      where: { accountId },
      order: { name: 'ASC' },
    });

    // Auto-heal and guarantee workspace creator has OWNER accessLevel
    try {
      const ownerUser = await this.userRepo.findOne({
        where: { accountId, role: 'OWNER' },
      });
      const account = await this.accountRepo.findOne({
        where: { id: accountId },
      });

      for (const member of members) {
        const isOwnerByEmail =
          (ownerUser?.email && member.email?.toLowerCase() === ownerUser.email.toLowerCase()) ||
          (account?.ownerEmail && member.email?.toLowerCase() === account.ownerEmail.toLowerCase());
        const isOwnerByRole = member.role === 'Workspace Owner';
        const isSoleMemberNonDefault = members.length === 1 && accountId !== 'acc-default';

        if (isOwnerByEmail || isOwnerByRole || isSoleMemberNonDefault) {
          let needsUpdate = false;
          if (member.accessLevel !== 'OWNER') {
            member.accessLevel = 'OWNER';
            needsUpdate = true;
          }
          if (member.role !== 'Workspace Owner') {
            member.role = 'Workspace Owner';
            needsUpdate = true;
          }
          if (!member.email && ownerUser?.email) {
            member.email = ownerUser.email;
            needsUpdate = true;
          }
          if (member.canLogin === false) {
            member.canLogin = true;
            needsUpdate = true;
          }
          if (needsUpdate) {
            await this.memberRepo.save(member);
          }
        }
      }
    } catch (err) {
      console.warn('Error verifying workspace owner in findAll:', err);
    }

    return members;
  }

  async findOne(accountId: string, id: string) {
    const member = await this.memberRepo.findOne({
      where: { id, accountId },
    });
    if (!member) {
      throw new NotFoundException(`Member ${id} not found in this account`);
    }
    return member;
  }

  async create(accountId: string, data: any) {
    let id = data.id;
    if (!id) {
      const count = await this.memberRepo.count({ where: { accountId } });
      id = `mem-${count + 1}`;
    }

    const defaultPages = [
      'overview',
      'task-spaces',
      'crm-pipelines',
      'contacts',
      'docs',
      'team',
      'settings',
    ];
    const defaultActions =
      data.accessLevel === 'VIEWER'
        ? ['read']
        : data.accessLevel === 'ADMIN' || data.accessLevel === 'OWNER'
        ? ['read', 'write', 'delete', 'publish', 'admin']
        : ['read', 'write', 'delete', 'publish'];

    const canLogin = data.canLogin !== undefined ? Boolean(data.canLogin) : true;
    const status = data.status || (canLogin ? 'Active' : 'Disabled');
    const email = data.email
      ? data.email.toLowerCase().trim()
      : `${data.name.toLowerCase().replace(/\s+/g, '.')}@backnode.io`;

    const member = this.memberRepo.create({
      id,
      name: data.name,
      email,
      initials:
        data.initials ||
        data.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase(),
      role: data.role || 'Member',
      accessLevel: data.accessLevel || 'MEMBER',
      status,
      canLogin,
      allowedPages: data.allowedPages || defaultPages,
      allowedActions: data.allowedActions || defaultActions,
      department: data.department || 'Engineering',
      activeTasks: data.activeTasks || 0,
      capacityStatus: data.capacityStatus || 'Available',
      avatarBg: data.avatarBg || '#ea580c',
      avatarColor: data.avatarColor || '#ffffff',
      invitedAt: data.invitedAt || new Date().toISOString(),
      accountId,
    });

    const savedMember = await this.memberRepo.save(member);

    // If canLogin is true or password provided, create/update the login User account
    const initialPassword = (data.password && data.password.trim()) || 'Backnode@2026';
    if (canLogin || (data.password && data.password.trim())) {
      const existingUser = await this.userRepo.findOne({ where: { email } });
      const passwordHash = await bcrypt.hash(initialPassword, 10);
      if (existingUser) {
        if (data.password && data.password.trim()) {
          existingUser.passwordHash = passwordHash;
        }
        existingUser.canLogin = canLogin;
        existingUser.status = canLogin ? 'ACTIVE' : 'DISABLED';
        existingUser.role = data.accessLevel || existingUser.role;
        existingUser.allowedPages = data.allowedPages || defaultPages;
        existingUser.allowedActions = data.allowedActions || defaultActions;
        await this.userRepo.save(existingUser);
      } else {
        const newUser = this.userRepo.create({
          email,
          passwordHash,
          name: data.name,
          role: data.accessLevel || 'MEMBER',
          accountId,
          canLogin,
          status: canLogin ? 'ACTIVE' : 'DISABLED',
          allowedPages: data.allowedPages || defaultPages,
          allowedActions: data.allowedActions || defaultActions,
        });
        await this.userRepo.save(newUser);
      }
    }

    return savedMember;
  }

  async update(accountId: string, id: string, data: any) {
    const member = await this.findOne(accountId, id);

    // Workspace owner role is strictly immutable and cannot be updated or demoted
    if (member.accessLevel === 'OWNER') {
      if (data.accessLevel && data.accessLevel !== 'OWNER') {
        throw new BadRequestException('Workspace Owner role cannot be modified or demoted.');
      }
      if (data.role && data.role !== member.role && data.role !== 'Workspace Owner') {
        throw new BadRequestException('Workspace Owner role cannot be modified.');
      }
      delete data.accessLevel;
      delete data.role;
    }

    if (data.canLogin !== undefined) {
      member.canLogin = Boolean(data.canLogin);
      if (!data.status) {
        member.status = member.canLogin ? 'Active' : 'Disabled';
      }
    }

    if (data.allowedPages !== undefined) member.allowedPages = data.allowedPages;
    if (data.allowedActions !== undefined) member.allowedActions = data.allowedActions;
    if (data.status !== undefined) {
      member.status = data.status;
      if (data.status === 'Disabled' || data.status === 'Suspended') {
        member.canLogin = false;
      }
    }
    if (data.name !== undefined) member.name = data.name;
    if (data.email !== undefined) member.email = data.email.toLowerCase().trim();
    if (data.role !== undefined) member.role = data.role;
    if (data.accessLevel !== undefined) member.accessLevel = data.accessLevel;
    if (data.department !== undefined) member.department = data.department;

    const saved = await this.memberRepo.save(member);

    // Sync to User table if present
    if (member.email) {
      try {
        const user = await this.userRepo.findOne({ where: { email: member.email.toLowerCase().trim() } });
        if (user) {
          if (member.canLogin !== undefined) user.canLogin = member.canLogin;
          if (member.status === 'Disabled') user.status = 'DISABLED';
          else if (member.status === 'Active') user.status = 'ACTIVE';
          if (member.accessLevel && member.accessLevel !== 'OWNER') user.role = member.accessLevel;
          if (member.allowedPages) user.allowedPages = member.allowedPages;
          if (member.allowedActions) user.allowedActions = member.allowedActions;
          await this.userRepo.save(user);
        }
      } catch (err) {
        console.warn('Failed to sync member update to user:', err);
      }
    }

    return saved;
  }

  async changePassword(accountId: string, id: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const member = await this.findOne(accountId, id);
    if (!member.email) {
      throw new BadRequestException('Member does not have a registered email address.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    let user = await this.userRepo.findOne({ where: { email: member.email.toLowerCase().trim() } });

    if (user) {
      user.passwordHash = passwordHash;
      user.canLogin = true;
      user.status = 'ACTIVE';
      await this.userRepo.save(user);
    } else {
      user = this.userRepo.create({
        email: member.email.toLowerCase().trim(),
        name: member.name,
        role: member.accessLevel || 'MEMBER',
        accountId,
        passwordHash,
        canLogin: true,
        status: 'ACTIVE',
      });
      await this.userRepo.save(user);
    }

    if (member.canLogin === false || member.status === 'Disabled') {
      member.canLogin = true;
      member.status = 'Active';
      await this.memberRepo.save(member);
    }

    return { success: true, message: `Password for ${member.name} has been updated successfully.` };
  }

  async toggleLogin(accountId: string, id: string, targetCanLogin?: boolean) {
    const member = await this.findOne(accountId, id);
    if (member.accessLevel === 'OWNER' && targetCanLogin === false) {
      throw new BadRequestException('Workspace Owner login access cannot be disabled.');
    }

    const nextCanLogin = targetCanLogin !== undefined ? Boolean(targetCanLogin) : !member.canLogin;
    member.canLogin = nextCanLogin;
    member.status = nextCanLogin ? 'Active' : 'Disabled';
    await this.memberRepo.save(member);

    if (member.email) {
      const user = await this.userRepo.findOne({ where: { email: member.email.toLowerCase().trim() } });
      if (user) {
        user.canLogin = nextCanLogin;
        user.status = nextCanLogin ? 'ACTIVE' : 'DISABLED';
        await this.userRepo.save(user);
      }
    }

    return member;
  }

  async delete(accountId: string, id: string) {
    const member = await this.findOne(accountId, id);
    if (member.accessLevel === 'OWNER') {
      throw new BadRequestException('Workspace Owner cannot be removed from the workspace.');
    }

    if (member.email) {
      try {
        const user = await this.userRepo.findOne({ where: { email: member.email.toLowerCase().trim() } });
        if (user && user.role !== 'OWNER') {
          await this.userRepo.remove(user);
        }
      } catch (err) {
        console.warn('Failed to delete associated user account:', err);
      }
    }

    await this.memberRepo.remove(member);
    return { id, success: true };
  }
}
