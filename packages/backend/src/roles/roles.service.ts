import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, TeamMember, User } from '../entities';
import {
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_SYSTEM_ROLES,
  RolePermissions,
  resolveEffectivePermissions,
  WorkspaceRole,
  PERMISSIONS_CATALOG,
  SYSTEM_ROLE_EXPLICIT_PERMISSIONS,
} from '@backnode/shared';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(TeamMember)
    private readonly memberRepo: Repository<TeamMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(accountId: string): Promise<Role[]> {
    let roles = await this.roleRepo.find({
      where: { accountId },
      order: { createdAt: 'ASC' },
    });

    if (roles.length === 0) {
      // Seed default initial roles for this workspace account
      const prefix = accountId ? accountId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) : 'default';
      for (const def of INITIAL_SYSTEM_ROLES) {
        const item = this.roleRepo.create({
          id: `${def.id}-${prefix}`,
          name: def.name,
          key: def.key,
          description: def.description,
          color: def.color,
          icon: def.icon || 'shield_person',
          isSystem: def.isSystem ?? false,
          isDefault: def.isDefault ?? false,
          permissions: def.permissions,
          accountId,
        });
        await this.roleRepo.save(item);
      }

      roles = await this.roleRepo.find({
        where: { accountId },
        order: { createdAt: 'ASC' },
      });
    }

    return roles;
  }

  async findOne(accountId: string, id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id, accountId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found in this account`);
    }
    return role;
  }

  async create(accountId: string, data: any): Promise<Role> {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Role name is required.');
    }

    const id = data.id || `role-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const permissions: RolePermissions =
      data.permissions || DEFAULT_ROLE_PERMISSIONS.member;

    if (data.isDefault) {
      await this.roleRepo.update({ accountId }, { isDefault: false });
    }

    const role = this.roleRepo.create({
      id,
      name: data.name.trim(),
      key: data.key || undefined,
      description: data.description || '',
      color: data.color || '#ea580c',
      icon: data.icon || 'badge',
      isSystem: false,
      isDefault: Boolean(data.isDefault),
      permissions,
      accountId,
    });

    return this.roleRepo.save(role);
  }

  async update(accountId: string, id: string, data: any): Promise<Role> {
    const role = await this.findOne(accountId, id);

    if (data.name !== undefined) role.name = data.name.trim();
    if (data.description !== undefined) role.description = data.description;
    if (data.color !== undefined) role.color = data.color;
    if (data.icon !== undefined) role.icon = data.icon;
    if (data.permissions !== undefined) role.permissions = data.permissions;

    if (data.isDefault !== undefined) {
      if (data.isDefault) {
        await this.roleRepo.update({ accountId }, { isDefault: false });
      }
      role.isDefault = Boolean(data.isDefault);
    }

    const saved = await this.roleRepo.save(role);

    // Sync updated role name to team members assigned to this role
    if (data.name) {
      await this.memberRepo.update(
        { accountId, roleId: id },
        { role: role.name },
      );
    }

    return saved;
  }

  async delete(accountId: string, id: string): Promise<{ id: string; success: boolean }> {
    const role = await this.findOne(accountId, id);

    if (role.isSystem || role.key === 'owner' || role.key === 'admin') {
      throw new BadRequestException('Built-in system roles cannot be deleted.');
    }

    // Find default role to reassign any members currently assigned to this role
    const defaultRole = await this.roleRepo.findOne({
      where: { accountId, isDefault: true },
    });
    const fallbackRoleId = defaultRole ? defaultRole.id : undefined;
    const fallbackRoleName = defaultRole ? defaultRole.name : 'Standard Contributor';

    await this.memberRepo.update(
      { accountId, roleId: id },
      { roleId: fallbackRoleId, role: fallbackRoleName },
    );

    await this.roleRepo.remove(role);
    return { id, success: true };
  }

  async duplicate(accountId: string, id: string): Promise<Role> {
    const sourceRole = await this.findOne(accountId, id);

    const newId = `role-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated = this.roleRepo.create({
      id: newId,
      name: `${sourceRole.name} (Copy)`,
      description: sourceRole.description ? `Copy of ${sourceRole.name}. ${sourceRole.description}` : '',
      color: sourceRole.color,
      icon: sourceRole.icon,
      isSystem: false,
      isDefault: false,
      permissions: JSON.parse(JSON.stringify(sourceRole.permissions)),
      accountId,
    });

    return this.roleRepo.save(duplicated);
  }

  /**
   * Resolves the live effective permissions matrix for a user or member context
   */
  async getEffectivePermissions(
    accountId: string,
    userContext: {
      id?: string;
      email?: string;
      role?: string;
      roleId?: string;
      permissionOverrides?: any;
    },
  ): Promise<RolePermissions> {
    const isOwner =
      userContext.role === 'OWNER' ||
      userContext.role === 'Workspace Owner';

    if (isOwner) {
      return resolveEffectivePermissions(null, null, true);
    }

    const roles = await this.findAll(accountId);

    let assignedRole: Role | undefined;
    if (userContext.roleId) {
      assignedRole = roles.find((r) => r.id === userContext.roleId);
    }

    if (!assignedRole && userContext.role) {
      const normalized = userContext.role.toLowerCase().trim();
      assignedRole = roles.find(
        (r) =>
          r.name.toLowerCase() === normalized ||
          (r.key && r.key.toLowerCase() === normalized),
      );
    }

    if (!assignedRole) {
      assignedRole = roles.find((r) => r.isDefault) || roles.find((r) => r.key === 'member') || roles[0];
    }

    return resolveEffectivePermissions(
      assignedRole as unknown as WorkspaceRole,
      userContext.permissionOverrides,
      false,
    );
  }

  getPermissionsCatalog() {
    return PERMISSIONS_CATALOG;
  }

  async getExplicitPermissionsList(
    accountId: string,
    userContext: {
      id?: string;
      email?: string;
      role?: string;
      roleId?: string;
      permissionOverrides?: any;
    },
  ): Promise<string[]> {
    const isOwner =
      userContext.role === 'OWNER' ||
      userContext.role === 'Workspace Owner';

    if (isOwner) {
      return ['*'];
    }

    const roles = await this.findAll(accountId);

    let assignedRole: Role | undefined;
    if (userContext.roleId) {
      assignedRole = roles.find((r) => r.id === userContext.roleId);
    }

    if (!assignedRole && userContext.role) {
      const normalized = userContext.role.toLowerCase().trim();
      assignedRole = roles.find(
        (r) =>
          r.name.toLowerCase() === normalized ||
          (r.key && r.key.toLowerCase() === normalized),
      );
    }

    if (!assignedRole) {
      assignedRole = roles.find((r) => r.isDefault) || roles.find((r) => r.key === 'member') || roles[0];
    }

    if (assignedRole) {
      if (Array.isArray(assignedRole.permissions)) {
        return assignedRole.permissions;
      }
      if (assignedRole.key && SYSTEM_ROLE_EXPLICIT_PERMISSIONS[assignedRole.key]) {
        return SYSTEM_ROLE_EXPLICIT_PERMISSIONS[assignedRole.key];
      }
    }

    return SYSTEM_ROLE_EXPLICIT_PERMISSIONS.member;
  }
}
