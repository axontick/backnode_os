import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import {
  WorkspaceRole,
  RolePermissions,
  PermissionScope,
  DEFAULT_ROLE_PERMISSIONS,
} from '../types';
import { WORKSPACE_PAGES, SecurityPolicy } from '../utils/security';

export const RolesPage: React.FC = () => {
  const { spaceId, roleId } = useParams<{ spaceId?: string; roleId?: string }>();
  const navigate = useNavigate();
  const { user, effectiveRole, effectiveDepartment } = useAuth();
  const {
    roles,
    members,
    activeUserSpace,
    activeUserSpaceId,
    handleCreateRole,
    handleUpdateRole,
    handleDeleteRole,
    handleDuplicateRole,
    showToast,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpaceId || activeUserSpace?.id || 'default';

  const canManageRoles = useMemo(() => {
    return SecurityPolicy.canManageTeam({
      id: user?.id || 'usr-operator',
      name: user?.name || 'Operator',
      email: user?.email || '',
      role: effectiveRole,
      department: effectiveDepartment,
    });
  }, [user, effectiveRole, effectiveDepartment]);

  // Selected role state
  const [selectedRoleId, setSelectedRoleId] = useState<string>(() => {
    if (roleId && roles.some((r) => r.id === roleId)) return roleId;
    return roles[0]?.id || 'role-member';
  });

  useEffect(() => {
    if (roleId && roles.some((r) => r.id === roleId)) {
      setSelectedRoleId(roleId);
    }
  }, [roleId, roles]);

  const activeRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  // Local draft of edited permissions for active role
  const [draftPermissions, setDraftPermissions] = useState<RolePermissions | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftColor, setDraftColor] = useState('#ea580c');
  const [draftIcon, setDraftIcon] = useState('shield_person');
  const [draftIsDefault, setDraftIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New role modal state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#ea580c');
  const [newRoleIcon, setNewRoleIcon] = useState('badge');
  const [newRoleTemplate, setNewRoleTemplate] = useState<string>('member');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Delete modal state
  const [roleToDelete, setRoleToDelete] = useState<WorkspaceRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Synchronize draft when activeRole changes
  useEffect(() => {
    if (activeRole) {
      setDraftName(activeRole.name);
      setDraftDescription(activeRole.description || '');
      setDraftColor(activeRole.color || '#ea580c');
      setDraftIcon(activeRole.icon || 'shield_person');
      setDraftIsDefault(Boolean(activeRole.isDefault));
      setDraftPermissions(JSON.parse(JSON.stringify(activeRole.permissions)));
    }
  }, [activeRole?.id]);

  // Filtered roles list
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const q = roleSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.key && r.key.toLowerCase().includes(q))
      );
    });
  }, [roles, roleSearch]);

  // Stats
  const totalRoles = roles.length;
  const systemRolesCount = roles.filter((r) => r.isSystem).length;
  const customRolesCount = roles.filter((r) => !r.isSystem).length;
  const scopedRolesCount = roles.filter(
    (r) =>
      r.permissions.tasks.view === 'assigned' ||
      r.permissions.tasks.update === 'assigned' ||
      r.permissions.deals.view === 'assigned'
  ).length;

  const getMemberCountForRole = (r: WorkspaceRole) => {
    return members.filter((m) => {
      if (m.roleId === r.id) return true;
      if (!m.roleId) {
        if (r.key === 'owner' && (m.accessLevel === 'OWNER' || m.role === 'Workspace Owner')) return true;
        if (r.key === 'admin' && m.accessLevel === 'ADMIN') return true;
        if (r.key === 'viewer' && m.accessLevel === 'VIEWER') return true;
        if (r.key === 'member' && (m.accessLevel === 'MEMBER' || !m.accessLevel)) return true;
        if (m.role && m.role.toLowerCase() === r.name.toLowerCase()) return true;
      }
      return false;
    }).length;
  };

  const handleSaveActiveRole = async () => {
    if (!activeRole || !draftPermissions) return;
    if (!canManageRoles) {
      showToast('Administrative privileges required to modify roles.');
      return;
    }

    setIsSaving(true);
    try {
      await handleUpdateRole(activeRole.id, {
        name: draftName.trim() || activeRole.name,
        description: draftDescription.trim(),
        color: draftColor,
        icon: draftIcon,
        isDefault: draftIsDefault,
        permissions: draftPermissions,
      });
      showToast(`Role "${draftName}" updated successfully`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      showToast('Role name is required.');
      return;
    }

    setIsCreatingRole(true);
    try {
      const templatePerms =
        DEFAULT_ROLE_PERMISSIONS[newRoleTemplate] || DEFAULT_ROLE_PERMISSIONS.member;

      const created = await handleCreateRole({
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        color: newRoleColor,
        icon: newRoleIcon,
        permissions: JSON.parse(JSON.stringify(templatePerms)),
      });

      setIsCreateModalOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRoleColor('#ea580c');
      setSelectedRoleId(created.id);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create role');
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await handleDeleteRole(roleToDelete.id);
      setRoleToDelete(null);
      if (selectedRoleId === roleToDelete.id) {
        setSelectedRoleId(roles[0]?.id || 'role-member');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper setters for draft permissions
  const updateTaskScope = (field: 'view' | 'update' | 'delete' | 'change_status', scope: PermissionScope) => {
    if (!draftPermissions) return;
    setDraftPermissions({
      ...draftPermissions,
      tasks: {
        ...draftPermissions.tasks,
        [field]: scope,
      },
    });
  };

  const updateTaskBool = (field: 'create' | 'assign', val: boolean) => {
    if (!draftPermissions) return;
    setDraftPermissions({
      ...draftPermissions,
      tasks: {
        ...draftPermissions.tasks,
        [field]: val,
      },
    });
  };

  const updateDealScope = (field: 'view' | 'update' | 'delete' | 'change_stage', scope: PermissionScope) => {
    if (!draftPermissions) return;
    setDraftPermissions({
      ...draftPermissions,
      deals: {
        ...draftPermissions.deals,
        [field]: scope,
      },
    });
  };

  const updateDealBool = (field: 'create' | 'assign', val: boolean) => {
    if (!draftPermissions) return;
    setDraftPermissions({
      ...draftPermissions,
      deals: {
        ...draftPermissions.deals,
        [field]: val,
      },
    });
  };

  const updateCrud = (domain: 'contacts' | 'spaces' | 'pipelines' | 'docs', action: 'view' | 'create' | 'update' | 'delete', val: boolean) => {
    if (!draftPermissions) return;
    setDraftPermissions({
      ...draftPermissions,
      [domain]: {
        ...draftPermissions[domain],
        [action]: val,
      },
    });
  };

  const updateTeam = (action: 'manage_members' | 'manage_roles' | 'manage_settings', val: boolean) => {
    if (!draftPermissions) return;
    setDraftPermissions({
      ...draftPermissions,
      team: {
        ...draftPermissions.team,
        [action]: val,
      },
    });
  };

  const togglePage = (pageId: string) => {
    if (!draftPermissions) return;
    const current = draftPermissions.allowedPages || [];
    if (current.includes(pageId)) {
      setDraftPermissions({
        ...draftPermissions,
        allowedPages: current.filter((p) => p !== pageId),
      });
    } else {
      setDraftPermissions({
        ...draftPermissions,
        allowedPages: [...current, pageId],
      });
    }
  };

  const isOwnerRole = activeRole?.key === 'owner';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto custom-scrollbar select-none text-zinc-100">
      {/* 1. Header Toolbar */}
      <div className="px-8 pt-8 pb-6 border-b border-[#27272a] bg-[#0c0a09] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-600/20">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight font-headline">
                Roles &amp; Permissions Matrix
              </h1>
              <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono font-semibold bg-orange-950/40 text-orange-400 border border-orange-500/30">
                {activeUserSpace?.name || 'Workspace'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 pl-10.5">
              Define workspace role templates, customize complete RBAC permission matrices, and enforce ABAC scopes (limiting actions to Assigned Items vs All Items).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Tab Link to Team Roster */}
            <button
              onClick={() => navigate(`/space/${currentSpaceId}/team`)}
              className="h-8 px-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-zinc-400">group</span>
              <span>Operator Roster</span>
            </button>

            {/* Create Custom Role CTA */}
            <button
              disabled={!canManageRoles}
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_moderator</span>
              <span>New Role</span>
            </button>
          </div>
        </div>

        {/* Bento KPI Summary Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Total Roles
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">{totalRoles}</span>
              <span className="text-[11px] text-zinc-400">profiles</span>
            </div>
          </div>

          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Custom Workspace Roles
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-orange-400 font-mono">{customRolesCount}</span>
              <span className="text-[11px] text-zinc-400">custom templates</span>
            </div>
          </div>

          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Assigned-Only Scoped
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-amber-400 font-mono">{scopedRolesCount}</span>
              <span className="text-[11px] text-zinc-400">ABAC constrained</span>
            </div>
          </div>

          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              System Roles
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-zinc-300 font-mono">{systemRolesCount}</span>
              <span className="text-[11px] text-zinc-400">built-in protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Page Layout (Master / Detail Bento Grid) */}
      <div className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Role Directory (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-100 font-headline uppercase tracking-wider">
                  Roles Directory
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {filteredRoles.length} Available
                </span>
              </div>

              {/* Role Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-zinc-500">
                  search
                </span>
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Filter roles..."
                  className="w-full h-8 pl-8 pr-2.5 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Roles List */}
              <div className="flex flex-col gap-2 pt-1 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredRoles.map((r) => {
                  const isSelected = r.id === selectedRoleId;
                  const memberCount = getMemberCountForRole(r);
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRoleId(r.id)}
                      className={`p-3 rounded-[6px] border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-950/20 shadow-xs ring-1 ring-orange-500/30'
                          : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-[6px] flex items-center justify-center text-white shrink-0 text-[13px]"
                            style={{ backgroundColor: r.color || '#ea580c' }}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {r.icon || 'shield_person'}
                            </span>
                          </div>
                          <span className="font-semibold text-xs text-zinc-100 truncate">
                            {r.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {r.isDefault && (
                            <span className="px-1.5 py-0.2 rounded-[3px] text-[9px] font-mono font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                              DEFAULT
                            </span>
                          )}
                          {r.isSystem ? (
                            <span className="px-1.5 py-0.2 rounded-[3px] text-[9px] font-mono font-semibold bg-zinc-900 text-zinc-400 border border-zinc-700">
                              SYSTEM
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-[3px] text-[9px] font-mono font-semibold bg-orange-950/40 text-orange-400 border border-orange-500/30">
                              CUSTOM
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {r.description || 'No description configured for this role template.'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-[#27272a]/60 text-[10.5px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">group</span>
                          <span>{memberCount} assigned {memberCount === 1 ? 'operator' : 'operators'}</span>
                        </span>
                        {r.permissions.tasks.view === 'assigned' && (
                          <span className="text-amber-400 text-[10px] font-bold">Assigned Only</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Complete Permissions Matrix Editor (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {activeRole && draftPermissions && (
              <>
                {/* Role Header Banner Card */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-5 shadow-xs flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[6px] flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: draftColor }}
                      >
                        <span className="material-symbols-outlined text-[20px]">{draftIcon}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-zinc-100 font-headline">
                            {draftName}
                          </h2>
                          {activeRole.isSystem && (
                            <span className="px-1.5 py-0.2 rounded-[6px] text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                              System Protected
                            </span>
                          )}
                          {draftIsDefault && (
                            <span className="px-1.5 py-0.2 rounded-[6px] text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                              Default Role
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">
                          ID: {activeRole.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Duplicate Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          const dup = await handleDuplicateRole(activeRole.id);
                          setSelectedRoleId(dup.id);
                        }}
                        className="h-8 px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Duplicate this role as a new custom template"
                      >
                        <span className="material-symbols-outlined text-[15px]">content_copy</span>
                        <span>Duplicate</span>
                      </button>

                      {/* Delete Custom Role Button */}
                      {!activeRole.isSystem && (
                        <button
                          type="button"
                          disabled={!canManageRoles}
                          onClick={() => setRoleToDelete(activeRole)}
                          className="h-8 px-3 rounded-[6px] border border-rose-900/50 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                          title="Delete this custom role"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                          <span>Delete</span>
                        </button>
                      )}

                      {/* Save Changes CTA */}
                      <button
                        type="button"
                        disabled={isSaving || !canManageRoles}
                        onClick={handleSaveActiveRole}
                        className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>{isSaving ? 'Saving...' : 'Save Matrix'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Role Metadata Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    <div className="sm:col-span-6">
                      <label className="block text-[10.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                        Role Title *
                      </label>
                      <input
                        type="text"
                        disabled={!canManageRoles || isOwnerRole}
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                        Badge Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          disabled={!canManageRoles}
                          value={draftColor}
                          onChange={(e) => setDraftColor(e.target.value)}
                          className="w-8 h-8 rounded-[6px] bg-[#18181b] border border-[#27272a] cursor-pointer p-0.5"
                        />
                        <span className="text-xs font-mono text-zinc-400 uppercase">{draftColor}</span>
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-2">
                        <input
                          type="checkbox"
                          disabled={!canManageRoles || isOwnerRole}
                          checked={draftIsDefault}
                          onChange={(e) => setDraftIsDefault(e.target.checked)}
                          className="accent-orange-600 rounded-[3px] w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs text-zinc-300 font-medium">Default New Member Role</span>
                      </label>
                    </div>

                    <div className="sm:col-span-12">
                      <label className="block text-[10.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                        Description &amp; Operational Scope
                      </label>
                      <textarea
                        rows={2}
                        disabled={!canManageRoles}
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        placeholder="Describe the operational responsibilities and clearance tier of this role..."
                        className="w-full p-2.5 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* 1. Tasks Management Matrix Card */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-orange-400">task_alt</span>
                      <div>
                        <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                          Tasks &amp; Execution Deliverables Matrix
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Govern task visibility, backlog triage, ticket updates, deletion, status progression, and assignment.
                        </p>
                      </div>
                    </div>
                    {draftPermissions.tasks.view === 'assigned' && (
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-amber-950/40 text-amber-400 border border-amber-500/30">
                        ABAC: ASSIGNED ITEMS ONLY
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#27272a] text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Capability / Operation</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Clearance / Scope Setting</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a] text-xs">
                        {/* Tasks View Scope */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">View Tasks</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Determine which tasks the operator can view across boards, lists, and calendar.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ScopeSelector
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.tasks.view}
                              onChange={(val) => updateTaskScope('view', val)}
                            />
                          </td>
                        </tr>

                        {/* Tasks Create */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Create Tasks</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Authorize operator to draft new tasks, bugs, deliverables, and specs.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.tasks.create}
                              onChange={(val) => updateTaskBool('create', val)}
                            />
                          </td>
                        </tr>

                        {/* Tasks Update Scope */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Edit / Update Tasks</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Modify task description, title, markdown specification, tags, and estimation.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ScopeSelector
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.tasks.update}
                              onChange={(val) => updateTaskScope('update', val)}
                            />
                          </td>
                        </tr>

                        {/* Tasks Change Status Scope */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Change Status</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Move tasks across workflow lifecycle (Backlog → In Progress → Review → Done).
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ScopeSelector
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.tasks.change_status}
                              onChange={(val) => updateTaskScope('change_status', val)}
                            />
                          </td>
                        </tr>

                        {/* Tasks Assign */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Assign / Reassign</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Change task assignee to other team operators or claim tasks.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.tasks.assign}
                              onChange={(val) => updateTaskBool('assign', val)}
                            />
                          </td>
                        </tr>

                        {/* Tasks Delete Scope */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Delete Tasks</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Permanently remove or archive deliverables from the workspace.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ScopeSelector
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.tasks.delete}
                              onChange={(val) => updateTaskScope('delete', val)}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. CRM Pipelines & Deals Matrix Card */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-orange-400">leaderboard</span>
                      <div>
                        <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                          CRM Deals &amp; Revenue Pipelines Matrix
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Govern deal visibility, stage transitions, opportunity modifications, deletion, and owner assignment.
                        </p>
                      </div>
                    </div>
                    {draftPermissions.deals.view === 'assigned' && (
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-amber-950/40 text-amber-400 border border-amber-500/30">
                        ABAC: ASSIGNED ITEMS ONLY
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#27272a] text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Capability / Operation</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Clearance / Scope Setting</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a] text-xs">
                        {/* Deals View Scope */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">View Deals</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Determine which deals and pipeline revenue funnels this operator can inspect.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ScopeSelector
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.deals.view}
                              onChange={(val) => updateDealScope('view', val)}
                            />
                          </td>
                        </tr>

                        {/* Deals Create */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Create Deals</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Allow operator to initialize new commercial deals and enterprise opportunities.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.deals.create}
                              onChange={(val) => updateDealBool('create', val)}
                            />
                          </td>
                        </tr>

                        {/* Deals Update Scope */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Edit / Update Deals</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Modify deal valuation, contact details, company information, and notes.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ScopeSelector
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.deals.update}
                              onChange={(val) => updateDealScope('update', val)}
                            />
                          </td>
                        </tr>

                        {/* Deals Change Stage Scope */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Advance / Move Stages</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Progress deals across pipeline gates (Lead → Demo → Proposal → Won/Lost).
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ScopeSelector
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.deals.change_stage}
                              onChange={(val) => updateDealScope('change_stage', val)}
                            />
                          </td>
                        </tr>

                        {/* Deals Assign Owner */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Assign Deal Owner</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Reassign commercial opportunity ownership to other team operators.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.deals.assign}
                              onChange={(val) => updateDealBool('assign', val)}
                            />
                          </td>
                        </tr>

                        {/* Deals Delete Scope */}
                        <tr>
                          <td className="py-3 px-3 font-semibold text-zinc-200">Delete Deals</td>
                          <td className="py-3 px-3 text-zinc-400 text-[11px]">
                            Permanently delete commercial deal opportunities from the database.
                          </td>
                          <td className="py-3 px-3 text-right">
                            <ScopeSelector
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.deals.delete}
                              onChange={(val) => updateDealScope('delete', val)}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Resources CRUD (Contacts, Spaces, Pipelines, Docs) */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-orange-400">database</span>
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                        Entity Resources CRUD Matrix
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Configure baseline View, Create, Edit, and Delete authorization across other workspace entities.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto pt-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#27272a] text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Resource Domain</th>
                          <th className="py-2.5 px-3 text-center">View</th>
                          <th className="py-2.5 px-3 text-center">Create</th>
                          <th className="py-2.5 px-3 text-center">Edit / Update</th>
                          <th className="py-2.5 px-3 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a] text-xs">
                        {/* Contacts */}
                        <tr>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-zinc-400">contacts</span>
                              <span className="font-semibold text-zinc-200">Contacts Directory</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.contacts.view}
                              onChange={(val) => updateCrud('contacts', 'view', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.contacts.create}
                              onChange={(val) => updateCrud('contacts', 'create', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.contacts.update}
                              onChange={(val) => updateCrud('contacts', 'update', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.contacts.delete}
                              onChange={(val) => updateCrud('contacts', 'delete', val)}
                            />
                          </td>
                        </tr>

                        {/* Spaces & Folders */}
                        <tr>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-zinc-400">folder_open</span>
                              <span className="font-semibold text-zinc-200">Task Spaces &amp; Folders</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.spaces.view}
                              onChange={(val) => updateCrud('spaces', 'view', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.spaces.create}
                              onChange={(val) => updateCrud('spaces', 'create', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.spaces.update}
                              onChange={(val) => updateCrud('spaces', 'update', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.spaces.delete}
                              onChange={(val) => updateCrud('spaces', 'delete', val)}
                            />
                          </td>
                        </tr>

                        {/* CRM Pipelines */}
                        <tr>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-zinc-400">view_timeline</span>
                              <span className="font-semibold text-zinc-200">Pipelines &amp; Stages</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.pipelines.view}
                              onChange={(val) => updateCrud('pipelines', 'view', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.pipelines.create}
                              onChange={(val) => updateCrud('pipelines', 'create', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.pipelines.update}
                              onChange={(val) => updateCrud('pipelines', 'update', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.pipelines.delete}
                              onChange={(val) => updateCrud('pipelines', 'delete', val)}
                            />
                          </td>
                        </tr>

                        {/* Architecture RFCs & Docs */}
                        <tr>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-zinc-400">description</span>
                              <span className="font-semibold text-zinc-200">Architecture RFCs &amp; Docs</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.docs.view}
                              onChange={(val) => updateCrud('docs', 'view', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.docs.create}
                              onChange={(val) => updateCrud('docs', 'create', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.docs.update}
                              onChange={(val) => updateCrud('docs', 'update', val)}
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <BooleanToggle
                              disabled={!canManageRoles || isOwnerRole}
                              value={draftPermissions.docs.delete}
                              onChange={(val) => updateCrud('docs', 'delete', val)}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Administration & Governance Matrix Card */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-orange-400">admin_panel_settings</span>
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                        Workspace Administration &amp; Access Controls
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Elevated governance permissions controlling user onboarding, role configurations, and system settings.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-zinc-200">Manage Team</span>
                        <span className="text-[10px] text-zinc-400">Invite &amp; remove operators</span>
                      </div>
                      <BooleanToggle
                        disabled={!canManageRoles || isOwnerRole}
                        value={draftPermissions.team.manage_members}
                        onChange={(val) => updateTeam('manage_members', val)}
                      />
                    </div>

                    <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-zinc-200">Manage Roles</span>
                        <span className="text-[10px] text-zinc-400">Edit RBAC matrix &amp; roles</span>
                      </div>
                      <BooleanToggle
                        disabled={!canManageRoles || isOwnerRole}
                        value={draftPermissions.team.manage_roles}
                        onChange={(val) => updateTeam('manage_roles', val)}
                      />
                    </div>

                    <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-zinc-200">Workspace Settings</span>
                        <span className="text-[10px] text-zinc-400">Configure global parameters</span>
                      </div>
                      <BooleanToggle
                        disabled={!canManageRoles || isOwnerRole}
                        value={draftPermissions.team.manage_settings}
                        onChange={(val) => updateTeam('manage_settings', val)}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. ABAC Authorized Pages Clearance Card */}
                <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                        Authorized Workspace Pages (ABAC Clearance)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Define which hubs and pages operators with this role have clearance to access.
                      </p>
                    </div>

                    {!isOwnerRole && canManageRoles && (
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftPermissions({
                              ...draftPermissions,
                              allowedPages: WORKSPACE_PAGES.map((p) => p.id),
                            })
                          }
                          className="text-orange-400 hover:text-orange-300 cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-zinc-600">|</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftPermissions({
                              ...draftPermissions,
                              allowedPages: ['overview', 'tasks', 'crm', 'contacts', 'docs'],
                            })
                          }
                          className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                          Standard Preset
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {WORKSPACE_PAGES.map((page) => {
                      const isChecked = isOwnerRole || (draftPermissions.allowedPages || []).includes(page.id);
                      return (
                        <div
                          key={page.id}
                          onClick={() => {
                            if (!isOwnerRole && canManageRoles) {
                              togglePage(page.id);
                            }
                          }}
                          className={`p-3 rounded-[6px] border flex items-start gap-3 transition-colors ${
                            isOwnerRole
                              ? 'border-orange-500/30 bg-orange-950/10 cursor-not-allowed'
                              : isChecked
                              ? 'border-orange-500/50 bg-orange-950/20 cursor-pointer'
                              : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isOwnerRole || !canManageRoles}
                            checked={isChecked}
                            onChange={() => {}}
                            className="accent-orange-600 rounded-[3px] w-4 h-4 mt-0.5 cursor-pointer"
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-zinc-400">
                                {page.icon}
                              </span>
                              <span className="text-xs font-semibold text-zinc-200">{page.label}</span>
                            </div>
                            <span className="text-[10.5px] text-zinc-400 mt-0.5">{page.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Sticky Save Bar */}
                <div className="p-4 bg-[#121214] border border-[#27272a] rounded-[6px] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="material-symbols-outlined text-[16px] text-orange-400">info</span>
                    <span>
                      Modifications to this role template will apply to all operators assigned to this role.
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isSaving || !canManageRoles}
                      onClick={handleSaveActiveRole}
                      className="h-8 px-5 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>{isSaving ? 'Saving Changes...' : 'Save Role Matrix'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Custom Role Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#121214] rounded-[6px] shadow-2xl border border-[#27272a] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#18181b] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">add_moderator</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                    Create Custom Role
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Define a new role template with customizable RBAC and ABAC controls.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Sales Representative, Project Lead, External Auditor"
                  className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Summarize the operational scope of this role..."
                  className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Initial Template Baseline
                  </label>
                  <select
                    value={newRoleTemplate}
                    onChange={(e) => setNewRoleTemplate(e.target.value)}
                    className="w-full h-[34px] px-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-[13px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    <option value="member">Standard Member (Full Operations)</option>
                    <option value="restricted">Restricted Operator (Assigned Items Only)</option>
                    <option value="viewer">Read-Only Viewer (Auditing)</option>
                    <option value="admin">Administrator (Management)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newRoleColor}
                      onChange={(e) => setNewRoleColor(e.target.value)}
                      className="w-[34px] h-[34px] rounded-[6px] bg-[#18181b] border border-[#27272a] cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-zinc-400 uppercase">{newRoleColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-8 px-3.5 rounded-[6px] border border-[#27272a] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole || !newRoleName.trim()}
                  className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isCreatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Modal */}
      {roleToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setRoleToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-[#121214] rounded-[6px] shadow-2xl border border-rose-900/50 overflow-hidden p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-[6px] bg-rose-950/40 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <span className="material-symbols-outlined text-[22px]">delete</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                Delete Role "{roleToDelete.name}"?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Any operators assigned to this role will be automatically reassigned to the default Standard Contributor role. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="h-8 px-3.5 rounded-[6px] border border-[#27272a] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-8 px-3.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Segmented scope selector for 'all' | 'assigned' | 'none'
 */
interface ScopeSelectorProps {
  value: PermissionScope;
  onChange: (val: PermissionScope) => void;
  disabled?: boolean;
}

const ScopeSelector: React.FC<ScopeSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="inline-flex items-center bg-[#18181b] border border-[#27272a] rounded-[6px] p-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('all')}
        className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          value === 'all'
            ? 'bg-orange-600 text-white shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        All Items
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('assigned')}
        className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          value === 'assigned'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        title="Restricts control strictly to items assigned to this operator"
      >
        Assigned Only
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('none')}
        className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          value === 'none'
            ? 'bg-zinc-800 text-rose-400 shadow-xs'
            : 'text-zinc-500 hover:text-zinc-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        Denied
      </button>
    </div>
  );
};

/**
 * Clean 2-state toggle for Boolean permissions
 */
interface BooleanToggleProps {
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

const BooleanToggle: React.FC<BooleanToggleProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="inline-flex items-center bg-[#18181b] border border-[#27272a] rounded-[6px] p-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          value
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-zinc-500 hover:text-zinc-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        Granted
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          !value
            ? 'bg-zinc-800 text-zinc-400 shadow-xs'
            : 'text-zinc-500 hover:text-zinc-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        Denied
      </button>
    </div>
  );
};
