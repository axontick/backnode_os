import { UserRole, DocClassification, TaskItem, CrmDeal, DirectoryContact, DocItem, RolePermissions } from '../types';

export type ResourceClassification = DocClassification;

export interface SecurityUserContext {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface SecurityResourceContext {
  id: string;
  type: 'task' | 'deal' | 'contact' | 'doc' | 'folder' | 'pipeline' | 'workspace' | 'member';
  classification?: ResourceClassification;
  department?: string;
  authorId?: string;
  authorName?: string;
  assigneeId?: string;
  assigneeName?: string;
  ownerId?: string;
}

/**
 * RBAC & ABAC Policy Decision Engine
 */
export const SecurityPolicy = {
  /**
   * Determine whether a user can view a given resource based on ABAC attributes
   */
  canView: (user: SecurityUserContext, resource: SecurityResourceContext): boolean => {
    // Owners and Admins have universal visibility across all classifications
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      return true;
    }

    const classification = resource.classification || 'Internal';

    // Public resources are accessible to everyone
    if (classification === 'Public') {
      return true;
    }

    // Internal resources are accessible to all authenticated workspace members (including Viewers)
    if (classification === 'Internal') {
      return true;
    }

    // Confidential resources require matching department or administrative role
    if (classification === 'Confidential') {
      if (resource.department && resource.department.toLowerCase() === user.department.toLowerCase()) {
        return true;
      }
      return false;
    }

    // Restricted resources are strictly limited to the creator or Owner/Admin
    if (classification === 'Restricted') {
      if (resource.authorId && resource.authorId === user.id) {
        return true;
      }
      if (resource.authorName && resource.authorName.toLowerCase() === user.name.toLowerCase()) {
        return true;
      }
      return false;
    }

    return true;
  },

  /**
   * Determine whether a user can create resources of a given type
   */
  canCreate: (user: SecurityUserContext, resourceType: SecurityResourceContext['type']): boolean => {
    // Viewers are strictly read-only
    if (user.role === 'VIEWER') {
      return false;
    }

    // Workspace & Member invitations are restricted to Owner and Admin
    if (resourceType === 'workspace') {
      return user.role === 'OWNER';
    }

    if (resourceType === 'member') {
      return user.role === 'OWNER' || user.role === 'ADMIN';
    }

    // Members, Admins, and Owners can create tasks, deals, contacts, docs, folders, pipelines
    return true;
  },

  /**
   * Determine whether a user can edit/modify a given resource
   */
  canEdit: (user: SecurityUserContext, resource: SecurityResourceContext): boolean => {
    // Viewers are strictly read-only
    if (user.role === 'VIEWER') {
      return false;
    }

    // Owners and Admins have global edit permissions
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      return true;
    }

    // ABAC classification constraints for regular Members
    const classification = resource.classification || 'Internal';

    if (classification === 'Restricted') {
      const isAuthor =
        (resource.authorId && resource.authorId === user.id) ||
        (resource.authorName && resource.authorName.toLowerCase() === user.name.toLowerCase());
      return Boolean(isAuthor);
    }

    if (classification === 'Confidential') {
      const isDept = resource.department && resource.department.toLowerCase() === user.department.toLowerCase();
      const isAuthor =
        (resource.authorId && resource.authorId === user.id) ||
        (resource.authorName && resource.authorName.toLowerCase() === user.name.toLowerCase());
      return Boolean(isDept || isAuthor);
    }

    return true;
  },

  /**
   * Determine whether a user can delete a given resource
   */
  canDelete: (user: SecurityUserContext, resource: SecurityResourceContext): boolean => {
    // Viewers cannot delete
    if (user.role === 'VIEWER') {
      return false;
    }

    // Owners can delete anything
    if (user.role === 'OWNER') {
      return true;
    }

    // Admins can delete resources, but not workspaces or Owner accounts
    if (user.role === 'ADMIN') {
      return resource.type !== 'workspace';
    }

    // Members can only delete resources they personally created
    if (user.role === 'MEMBER') {
      if (resource.type === 'workspace' || resource.type === 'member' || resource.type === 'pipeline') {
        return false;
      }
      const isAuthor =
        (resource.authorId && resource.authorId === user.id) ||
        (resource.authorName && resource.authorName.toLowerCase() === user.name.toLowerCase());
      return Boolean(isAuthor);
    }

    return false;
  },

  /**
   * Check if role allows changing member roles or removing members
   */
  canManageTeam: (user: SecurityUserContext): boolean => {
    return user.role === 'OWNER' || user.role === 'ADMIN';
  },

  /**
   * Check if user is in read-only viewer mode
   */
  isReadOnly: (user: SecurityUserContext | UserRole | string): boolean => {
    if (typeof user === 'string') {
      return user.toUpperCase() === 'VIEWER';
    }
    return user.role === 'VIEWER';
  },

  /**
   * Determine whether a user or team member has clearance to access a specific page
   */
  canAccessPage: (
    user: { role?: string; allowedPages?: string[] } | null | undefined,
    member: { accessLevel?: string; allowedPages?: string[] } | null | undefined,
    pageKey: string,
    effectivePermissions?: RolePermissions | null
  ): boolean => {
    const role = ((member?.accessLevel || user?.role || 'MEMBER') as string).toUpperCase();
    if (role === 'OWNER' || role === 'ADMIN') {
      return true;
    }

    // Normalize page key
    let normalized = pageKey.toLowerCase();
    if (normalized === 'dashboard' || normalized === 'overview') normalized = 'overview';
    else if (normalized === 'spaces' || normalized === 'task-spaces' || normalized === 'lists') normalized = 'tasks';
    else if (normalized === 'crm' || normalized === 'crm-pipelines' || normalized === 'pipelines') normalized = 'crm';
    else if (normalized === 'contacts') normalized = 'contacts';
    else if (normalized === 'docs') normalized = 'docs';
    else if (normalized === 'team') normalized = 'team';
    else if (normalized === 'roles') normalized = 'roles';
    else if (normalized === 'settings') normalized = 'settings';

    // If effectivePermissions is passed, check its page clearance
    if (effectivePermissions?.pages) {
      const pageKeyMap: Record<string, keyof typeof effectivePermissions.pages> = {
        overview: 'overview',
        tasks: 'tasks',
        crm: 'crm',
        contacts: 'contacts',
        docs: 'docs',
        team: 'team',
        roles: 'roles',
        settings: 'settings',
      };
      const mapped = pageKeyMap[normalized];
      if (mapped !== undefined && effectivePermissions.pages[mapped] !== undefined) {
        return Boolean(effectivePermissions.pages[mapped]);
      }
    }

    // If member has allowedPages specified
    const allowed = member?.allowedPages || user?.allowedPages;
    if (Array.isArray(allowed) && allowed.length > 0) {
      return allowed.includes(normalized) || allowed.includes(pageKey);
    }

    // Default policy for regular members & viewers: allow operational pages, restrict team, roles & settings
    if (normalized === 'team' || normalized === 'roles' || normalized === 'settings') {
      return false;
    }
    return true;
  },

  /**
   * Granular Task permission check combining RBAC action and ABAC assignment scope
   */
  canAccessTask: (
    user: SecurityUserContext | null | undefined,
    task: Partial<TaskItem> | null | undefined,
    action: 'view' | 'create' | 'update' | 'change_status' | 'assign' | 'delete',
    effectivePermissions?: RolePermissions | null
  ): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER') return true;

    const isAssigned = (t: Partial<TaskItem>) => {
      if (t.assigneeId && t.assigneeId === user.id) return true;
      if (t.assignee && typeof t.assignee === 'object') {
        if (t.assignee.id === user.id) return true;
        if (user.name && t.assignee.name && t.assignee.name.toLowerCase() === user.name.toLowerCase()) return true;
      }
      if (t.creatorId && t.creatorId === user.id) return true;
      return false;
    };

    if (effectivePermissions?.tasks) {
      const tp = effectivePermissions.tasks;
      if (action === 'view') {
        if (tp.view === 'none') return false;
        if (tp.view === 'assigned') {
          if (!task) return true;
          return isAssigned(task);
        }
        return true;
      }
      if (action === 'create') {
        return Boolean(tp.create);
      }
      if (action === 'update') {
        if (tp.update === 'none') return false;
        if (tp.update === 'assigned') {
          if (!task) return true;
          return isAssigned(task);
        }
        return true;
      }
      if (action === 'change_status') {
        if (tp.change_status === 'none') return false;
        if (tp.change_status === 'assigned') {
          if (!task) return true;
          return isAssigned(task);
        }
        return true;
      }
      if (action === 'assign') {
        return Boolean(tp.assign);
      }
      if (action === 'delete') {
        if (tp.delete === 'none') return false;
        if (tp.delete === 'assigned') {
          if (!task) return true;
          return isAssigned(task);
        }
        return true;
      }
    }

    if (user.role === 'ADMIN') return true;
    if (user.role === 'VIEWER') return action === 'view';
    return true;
  },

  /**
   * Granular Deal permission check combining RBAC action and ABAC assignment scope
   */
  canAccessDeal: (
    user: SecurityUserContext | null | undefined,
    deal: Partial<CrmDeal> | null | undefined,
    action: 'view' | 'create' | 'update' | 'change_stage' | 'assign' | 'delete',
    effectivePermissions?: RolePermissions | null
  ): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER') return true;

    const isAssigned = (d: Partial<CrmDeal>) => {
      if (d.ownerId && d.ownerId === user.id) return true;
      if (user.name && d.owner && d.owner.toLowerCase() === user.name.toLowerCase()) return true;
      if (user.email && d.contact?.email && d.contact.email.toLowerCase() === user.email.toLowerCase()) return true;
      return false;
    };

    if (effectivePermissions?.deals) {
      const dp = effectivePermissions.deals;
      if (action === 'view') {
        if (dp.view === 'none') return false;
        if (dp.view === 'assigned') {
          if (!deal) return true;
          return isAssigned(deal);
        }
        return true;
      }
      if (action === 'create') {
        return Boolean(dp.create);
      }
      if (action === 'update') {
        if (dp.update === 'none') return false;
        if (dp.update === 'assigned') {
          if (!deal) return true;
          return isAssigned(deal);
        }
        return true;
      }
      if (action === 'change_stage') {
        if (dp.change_stage === 'none') return false;
        if (dp.change_stage === 'assigned') {
          if (!deal) return true;
          return isAssigned(deal);
        }
        return true;
      }
      if (action === 'assign') {
        return Boolean(dp.assign);
      }
      if (action === 'delete') {
        if (dp.delete === 'none') return false;
        if (dp.delete === 'assigned') {
          if (!deal) return true;
          return isAssigned(deal);
        }
        return true;
      }
    }

    if (user.role === 'ADMIN') return true;
    if (user.role === 'VIEWER') return action === 'view';
    return true;
  },

  /**
   * Determine whether a user or team member can perform a specific operational action
   */
  canPerformAction: (
    user: { role?: string; allowedActions?: string[] } | null | undefined,
    member: { accessLevel?: string; allowedActions?: string[] } | null | undefined,
    action: WorkspaceActionKey
  ): boolean => {
    const role = ((member?.accessLevel || user?.role || 'MEMBER') as string).toUpperCase();
    if (role === 'OWNER' || role === 'ADMIN') {
      return true;
    }

    if (action === 'read') {
      return true;
    }

    if (role === 'VIEWER') {
      return false;
    }

    const allowed = member?.allowedActions || user?.allowedActions;
    if (Array.isArray(allowed) && allowed.length > 0) {
      return allowed.includes(action);
    }

    // Default policy for regular members: write, delete, and publish allowed, admin restricted
    if (action === 'admin') {
      return false;
    }
    return true;
  },
};

export const WORKSPACE_PAGES = [
  { id: 'overview', label: 'Overview Dashboard', icon: 'dashboard', description: 'System summary, key metrics, and activity stream' },
  { id: 'tasks', label: 'Task Spaces & Boards', icon: 'folder_open', description: 'Workspaces, sprint cycles, folders, and task boards' },
  { id: 'crm', label: 'CRM Pipelines & Deals', icon: 'leaderboard', description: 'Sales funnels, stages, and customer deal pipelines' },
  { id: 'contacts', label: 'Contacts Directory', icon: 'group', description: 'Operator network, partners, and enterprise clients' },
  { id: 'docs', label: 'Architecture & RFCs', icon: 'description', description: 'Technical specifications, documentation, and RFCs' },
  { id: 'team', label: 'Team & Access Control', icon: 'shield_person', description: 'Operator roster, clearance levels, and security policies' },
  { id: 'roles', label: 'Roles & Matrix', icon: 'verified_user', description: 'RBAC role templates and granular permission matrix' },
  { id: 'settings', label: 'Workspace Settings', icon: 'settings', description: 'Global parameters, branding, and workspace configuration' },
] as const;

export type WorkspacePageKey = typeof WORKSPACE_PAGES[number]['id'];

export const WORKSPACE_ACTIONS = [
  { id: 'read', label: 'Read / Inspect', icon: 'visibility', description: 'View boards, pipelines, analytics, and telemetry' },
  { id: 'write', label: 'Create & Edit', icon: 'edit', description: 'Create and update tasks, deals, contacts, lists, and docs' },
  { id: 'delete', label: 'Delete Resources', icon: 'delete', description: 'Remove tasks, deals, contacts, lists, and subfolders' },
  { id: 'publish', label: 'Publish / Export', icon: 'publish', description: 'Publish RFC specs, release documentation, export reports' },
  { id: 'admin', label: 'Workspace Admin', icon: 'admin_panel_settings', description: 'Invite operators, change roles, manage billing & logins' },
] as const;

export type WorkspaceActionKey = typeof WORKSPACE_ACTIONS[number]['id'];
