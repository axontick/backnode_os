import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import {
  WorkspaceRole,
  PERMISSIONS_CATALOG,
  SYSTEM_ROLE_EXPLICIT_PERMISSIONS,
  ExplicitPermissionCategory,
  ExplicitPermissionDefinition,
  matchPermissionsQuery,
} from '@backnode/shared';
import { SecurityPolicy } from '../utils/security';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Plus,
  Copy,
  Trash2,
  Save,
  Search,
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FolderOpen,
  LineChart,
  Users,
  BookOpen,
  Settings,
  X,
} from 'lucide-react';

export interface RolesPageProps {
  initialRoleId?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isEmbedded?: boolean;
}

export const RolesPage: React.FC<RolesPageProps> = ({
  initialRoleId,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  isEmbedded = false,
}) => {
  const { spaceId, roleId: paramRoleId } = useParams<{ spaceId?: string; roleId?: string }>();
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
  const effectiveRoleId = initialRoleId || paramRoleId;

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
    if (effectiveRoleId && roles.some((r) => r.id === effectiveRoleId)) return effectiveRoleId;
    return roles[0]?.id || 'role-member';
  });

  useEffect(() => {
    if (effectiveRoleId && roles.some((r) => r.id === effectiveRoleId)) {
      setSelectedRoleId(effectiveRoleId);
    }
  }, [effectiveRoleId, roles]);

  const activeRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  // Edited permissions for active role
  const [draftExplicitPermissions, setDraftExplicitPermissions] = useState<string[]>([]);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftColor, setDraftColor] = useState('#ea580c');
  const [draftIcon, setDraftIcon] = useState('shield_person');
  const [draftIsDefault, setDraftIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [internalRoleSearch, setInternalRoleSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const roleSearch = externalSearchQuery !== undefined ? externalSearchQuery : internalRoleSearch;
  const setRoleSearch = (val: string) => {
    setInternalRoleSearch(val);
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    }
  };

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

      if (Array.isArray(activeRole.permissions)) {
        setDraftExplicitPermissions([...activeRole.permissions]);
      } else if (activeRole.key && SYSTEM_ROLE_EXPLICIT_PERMISSIONS[activeRole.key]) {
        setDraftExplicitPermissions([...SYSTEM_ROLE_EXPLICIT_PERMISSIONS[activeRole.key]]);
      } else {
        setDraftExplicitPermissions([...SYSTEM_ROLE_EXPLICIT_PERMISSIONS.member]);
      }
    }
  }, [activeRole?.id]);

  // Filtered roles list matching name, description, key, or permission value
  const { filteredRoles, roleMatchDetails } = useMemo(() => {
    const q = roleSearch.toLowerCase().trim();
    if (!q) {
      return { filteredRoles: roles, roleMatchDetails: {} as Record<string, string[]> };
    }

    const details: Record<string, string[]> = {};

    const list = roles.filter((r) => {
      const nameMatch = r.name.toLowerCase().includes(q);
      const descMatch = (r.description || '').toLowerCase().includes(q);
      const keyMatch = (r.key || '').toLowerCase().includes(q);

      // Check permission value
      const rolePerms = Array.isArray(r.permissions)
        ? r.permissions
        : (r.key && SYSTEM_ROLE_EXPLICIT_PERMISSIONS[r.key]) || [];

      const permResult = matchPermissionsQuery(rolePerms, q);
      if (permResult.matches && permResult.matchedLabels.length > 0) {
        details[r.id] = permResult.matchedLabels;
      }

      return nameMatch || descMatch || keyMatch || permResult.matches;
    });

    return { filteredRoles: list, roleMatchDetails: details };
  }, [roles, roleSearch]);

  const isOwnerRole = activeRole?.key === 'owner' || activeRole?.name.toLowerCase() === 'workspace owner';
  const isWildcard = draftExplicitPermissions.includes('*');

  const permissionCategories: ExplicitPermissionCategory[] = useMemo(() => {
    if (Array.isArray(PERMISSIONS_CATALOG)) {
      return PERMISSIONS_CATALOG;
    }
    if (PERMISSIONS_CATALOG && typeof PERMISSIONS_CATALOG === 'object') {
      const categoryMap = new Map<string, ExplicitPermissionCategory>();
      for (const [key, val] of Object.entries(PERMISSIONS_CATALOG)) {
        if (!val || typeof val !== 'object') continue;
        const catName = (val as any).category || 'General';
        const mod = (val as any).module || 'core';
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { category: catName, module: mod, permissions: [] });
        }
        categoryMap.get(catName)!.permissions.push({
          id: key,
          name: (val as any).label || (val as any).name || key,
          description: (val as any).description || '',
          module: mod,
          category: catName,
        });
      }
      return Array.from(categoryMap.values());
    }
    return [];
  }, []);

  // Filtered categories and permissions based on roleSearch (permission value, key, label, description)
  const displayCategories = useMemo(() => {
    const q = roleSearch.toLowerCase().trim();
    if (!q) return permissionCategories;

    return permissionCategories
      .map((cat) => {
        const matchingPermissions = cat.permissions.filter((p) => {
          return (
            p.id.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            cat.category.toLowerCase().includes(q)
          );
        });

        return {
          ...cat,
          permissions: matchingPermissions,
        };
      })
      .filter((cat) => cat.permissions.length > 0);
  }, [permissionCategories, roleSearch]);

  const hasPermission = (permId: string) => {
    if (isWildcard) return true;
    return draftExplicitPermissions.includes(permId);
  };

  const handleTogglePermission = (permId: string) => {
    if (isOwnerRole || !canManageRoles) return;

    setDraftExplicitPermissions((prev) => {
      let next = [...prev];

      // Handle mutually exclusive scope pairs (.all vs .me)
      if (permId.endsWith('.all')) {
        const meVariant = permId.replace('.all', '.me');
        next = next.filter((p) => p !== meVariant);
      } else if (permId.endsWith('.me')) {
        const allVariant = permId.replace('.me', '.all');
        next = next.filter((p) => p !== allVariant);
      }

      if (next.includes(permId)) {
        return next.filter((p) => p !== permId);
      } else {
        return [...next, permId];
      }
    });
  };

  const handleGrantCategory = (cat: ExplicitPermissionCategory) => {
    if (isOwnerRole || !canManageRoles) return;
    setDraftExplicitPermissions((prev) => {
      const catPermIds = cat.permissions.map((p) => p.id);
      // Remove any .me variants if adding all
      const cleanPrev = prev.filter(
        (p) => !catPermIds.some((cid) => cid.replace('.all', '.me') === p)
      );
      // Prefer .all permissions
      const allOrGeneral = catPermIds.filter((p) => !p.endsWith('.me'));
      const combined = new Set([...cleanPrev, ...allOrGeneral]);
      return Array.from(combined);
    });
  };

  const handleRevokeCategory = (cat: ExplicitPermissionCategory) => {
    if (isOwnerRole || !canManageRoles) return;
    setDraftExplicitPermissions((prev) => {
      const catPermIds = new Set(cat.permissions.map((p) => p.id));
      return prev.filter((p) => !catPermIds.has(p));
    });
  };

  const handleSaveActiveRole = async () => {
    if (!activeRole) return;
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
        permissions: draftExplicitPermissions,
      });
      showToast(`Role "${draftName}" permissions matrix saved!`);
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
        SYSTEM_ROLE_EXPLICIT_PERMISSIONS[newRoleTemplate] ||
        SYSTEM_ROLE_EXPLICIT_PERMISSIONS.member;

      const created = await handleCreateRole({
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        color: newRoleColor,
        icon: newRoleIcon,
        permissions: [...templatePerms],
      });

      setIsCreateModalOpen(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setNewRoleColor('#ea580c');
      setSelectedRoleId(created.id);
      if (!isEmbedded) {
        navigate(`/space/${currentSpaceId}/roles/${created.id}`);
      }
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

  const getCategoryIcon = (moduleId: string) => {
    switch (moduleId) {
      case 'tasks':
        return <FolderOpen className="w-5 h-5 text-orange-500" />;
      case 'crm':
        return <LineChart className="w-5 h-5 text-orange-500" />;
      case 'contacts':
        return <Users className="w-5 h-5 text-orange-500" />;
      case 'docs':
        return <BookOpen className="w-5 h-5 text-orange-500" />;
      default:
        return <Settings className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090b] text-zinc-100 min-h-0">
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR: ROLES DIRECTORY (260px)                 */}
      {/* ========================================================= */}
      <aside className="w-[260px] bg-[#121214] border-r border-[#27272a] flex flex-col shrink-0">
        <div className="h-[48px] px-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-headline">
              Roles Directory
            </span>
            <span className="font-mono text-[10px] text-zinc-400 bg-[#18181b] border border-[#27272a] px-1.5 py-0.2 rounded-[4px]">
              {filteredRoles.length}
            </span>
          </div>
          {canManageRoles && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 rounded-[6px] text-zinc-400 hover:text-orange-400 hover:bg-[#18181b] transition-colors cursor-pointer"
              title="New Role"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Roles Search (if standalone or not externally controlled) */}
        {externalSearchQuery === undefined && (
          <div className="p-2.5 border-b border-[#27272a]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, description, permission..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-7 text-xs rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {roleSearch && (
                <button
                  type="button"
                  onClick={() => setRoleSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer flex items-center justify-center"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Roles List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredRoles.map((role) => {
            const isSelected = selectedRoleId === role.id;
            const matchTokens = roleMatchDetails[role.id];

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRoleId(role.id);
                  if (!isEmbedded) {
                    navigate(`/space/${currentSpaceId}/roles/${role.id}`);
                  }
                }}
                className={`w-full flex flex-col p-2 rounded-[6px] text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-orange-950/40 text-orange-400 font-semibold border border-orange-500/30'
                    : 'text-zinc-300 hover:bg-[#18181b] hover:text-zinc-100 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: role.color || '#ea580c' }}
                    />
                    <div className="truncate">
                      <span className="text-xs truncate block">{role.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono truncate block">
                        {role.isSystem ? 'System' : 'Custom'}
                        {role.isDefault ? ' • Default' : ''}
                      </span>
                    </div>
                  </div>

                  {role.key === 'owner' && (
                    <span className="font-mono text-[9px] text-orange-400 bg-orange-950/50 px-1 py-0.5 rounded-[4px] border border-orange-500/30 shrink-0">
                      OWNER
                    </span>
                  )}
                </div>

                {/* Show match badge if matched via permission value */}
                {matchTokens && matchTokens.length > 0 && (
                  <div className="mt-1 pl-4.5">
                    <span className="text-[9px] font-mono text-orange-400/90 bg-orange-950/40 border border-orange-500/20 px-1.5 py-0.5 rounded-[3px] truncate block max-w-full">
                      Perm: {matchTokens[0]}
                    </span>
                  </div>
                )}
              </button>
            );
          })}

          {filteredRoles.length === 0 && (
            <div className="p-4 text-center text-xs text-zinc-500 italic">
              No roles match "{roleSearch}"
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. RIGHT MAIN CANVAS: EXPLICIT PERMISSION MATRIX          */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 md:p-8">
        {activeRole ? (
          <div className="space-y-6 max-w-5xl mx-auto w-full">
            {/* Role Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[6px] bg-[#121214] border border-[#27272a]">
              <div>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeRole.color || '#ea580c' }}
                  />
                  <h2 className="text-xl font-bold font-headline text-zinc-100">
                    {activeRole.name}
                  </h2>
                  {activeRole.isSystem && (
                    <span className="font-mono text-[10px] text-zinc-400 bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded-[4px]">
                      SYSTEM ROLE
                    </span>
                  )}
                  {activeRole.isDefault && (
                    <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/30 px-2 py-0.5 rounded-[4px]">
                      DEFAULT MEMBER
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {activeRole.description || 'Configures explicit permissions across Backnode OS modules.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const dup = await handleDuplicateRole(activeRole.id);
                    setSelectedRoleId(dup.id);
                  }}
                  className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>

                {!activeRole.isSystem && canManageRoles && (
                  <button
                    type="button"
                    onClick={() => setRoleToDelete(activeRole)}
                    className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-red-950/30 border border-red-500/30 text-red-400 hover:bg-red-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                {canManageRoles && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveActiveRole}
                    className="px-4 py-1.5 rounded-[6px] text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Matrix'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editable Role Metadata (for custom roles or title edit) */}
            {!activeRole.isSystem && canManageRoles && (
              <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    ROLE NAME
                  </label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    DESCRIPTION
                  </label>
                  <input
                    type="text"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    BADGE COLOR
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftColor}
                      onChange={(e) => setDraftColor(e.target.value)}
                      className="w-8 h-8 rounded-[6px] bg-transparent border border-[#27272a] cursor-pointer"
                    />
                    <span className="font-mono text-xs text-zinc-400 uppercase">
                      {draftColor}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Wildcard Alert */}
            {isWildcard && (
              <div className="p-4 rounded-[6px] bg-orange-950/30 border border-orange-500/30 flex items-center gap-3">
                <Key className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-orange-400 uppercase font-mono tracking-wider">
                    Universal Wildcard Granted (*)
                  </h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    This role holds universal superuser clearance across all modules, resources, and administrative functions.
                  </p>
                </div>
              </div>
            )}

            {/* Search Match Notice */}
            {roleSearch && (
              <div className="flex items-center justify-between px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-xs">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-zinc-300">
                    Filtered by query: <span className="font-mono text-orange-400">"{roleSearch}"</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleSearch('')}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* PERMISSIONS BENTO GRID MATRIX */}
            <div className="space-y-5">
              {displayCategories.map((cat) => {
                const grantedInCat = cat.permissions.filter((p) => hasPermission(p.id)).length;
                const totalInCat = cat.permissions.length;

                return (
                  <div
                    key={cat.category}
                    className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-sm space-y-4"
                  >
                    {/* Category Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#27272a] gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-center">
                          {getCategoryIcon(cat.module)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold font-headline text-zinc-100">
                            {cat.category}
                          </h3>
                          <span className="font-mono text-[10px] text-zinc-400">
                            Module: {cat.module} • {grantedInCat} of {totalInCat} granted
                          </span>
                        </div>
                      </div>

                      {!isWildcard && !isOwnerRole && canManageRoles && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleGrantCategory(cat)}
                            className="px-2 py-1 text-[11px] font-medium rounded-[4px] bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-orange-400 hover:border-orange-500/50 transition-colors cursor-pointer"
                          >
                            Grant All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeCategory(cat)}
                            className="px-2 py-1 text-[11px] font-medium rounded-[4px] bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            Revoke All
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Permissions Rows */}
                    <div className="divide-y divide-[#27272a]">
                      {cat.permissions.map((perm) => {
                        const isGranted = hasPermission(perm.id);
                        const isScopeMe = perm.id.endsWith('.me');
                        const isScopeAll = perm.id.endsWith('.all');

                        return (
                          <div
                            key={perm.id}
                            className="py-3 flex items-start sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-zinc-200">
                                  {perm.name}
                                </span>
                                <span className="font-mono text-[10px] text-zinc-400 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded-[4px]">
                                  {perm.id}
                                </span>
                                {isScopeAll && (
                                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded-[4px] bg-blue-950/40 text-blue-400 border border-blue-500/30 font-semibold">
                                    All Items Scope
                                  </span>
                                )}
                                {isScopeMe && (
                                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded-[4px] bg-amber-950/40 text-amber-400 border border-amber-500/30 font-semibold">
                                    Assigned Only Scope
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400">
                                {perm.description}
                              </p>
                            </div>

                            {/* Toggle */}
                            <button
                              type="button"
                              disabled={isWildcard || isOwnerRole || !canManageRoles}
                              onClick={() => handleTogglePermission(perm.id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                isGranted ? 'bg-orange-600' : 'bg-zinc-800'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  isGranted ? 'translate-x-4' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {displayCategories.length === 0 && (
                <div className="p-8 text-center bg-[#121214] border border-[#27272a] rounded-[6px] my-4">
                  <span className="material-symbols-outlined text-3xl text-zinc-500 mb-2">search_off</span>
                  <h4 className="text-sm font-semibold text-zinc-200">No Permissions Found</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    No permission keys or descriptions match <span className="text-orange-400 font-mono">"{roleSearch}"</span> in this role matrix.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRoleSearch('')}
                    className="mt-3 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Select a role from the left sidebar to inspect and configure permissions.
          </div>
        )}
      </main>

      {/* Create Role Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold font-headline text-zinc-100">
                  Create Custom Role
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead QA Engineer"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full test execution and triage permissions"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Base Template
                </label>
                <select
                  value={newRoleTemplate}
                  onChange={(e) => setNewRoleTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 focus:border-orange-500 focus:outline-none"
                >
                  <option value="member">Standard Member Template</option>
                  <option value="admin">Administrator Template</option>
                  <option value="restricted">Restricted Scope Template</option>
                  <option value="viewer">Viewer / Read-Only Template</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    className="w-8 h-8 rounded-[6px] bg-transparent border border-[#27272a] cursor-pointer"
                  />
                  <span className="font-mono text-zinc-400 uppercase">
                    {newRoleColor}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] font-semibold bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="px-4 py-2 rounded-[6px] font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold font-headline text-zinc-100">
                Delete Role
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete role <span className="text-orange-400 font-semibold font-mono">"{roleToDelete.name}"</span>? Any operators assigned to this role will fallback to the default workspace member role.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-3.5 py-1.5 rounded-[6px] text-xs font-semibold bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-[6px] text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50"
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

export const RolesView = RolesPage;
