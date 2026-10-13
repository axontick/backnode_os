import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { TeamMember } from '../types';
import {
  WorkspaceRole,
  UserPermissionOverrides,
  PermissionScope,
  OverrideScope,
  OverrideBoolean,
  RolePermissions,
  resolveEffectivePermissions,
  TaskPermissions,
  DealPermissions,
  matchPermissionsQuery,
  getUserExplicitPermissions,
} from '@backnode/shared';
import {
  SecurityPolicy,
  WORKSPACE_PAGES,
  WORKSPACE_ACTIONS,
  WorkspacePageKey,
  WorkspaceActionKey,
} from '../utils/security';
import { RolesPage } from './RolesPage';

export interface TeamAccessPageProps {
  defaultTab?: 'users' | 'roles';
}

export const TeamAccessPage: React.FC<TeamAccessPageProps> = ({ defaultTab }) => {
  const { spaceId, memberId, roleId } = useParams<{ spaceId?: string; memberId?: string; roleId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, effectiveRole, effectiveDepartment } = useAuth();
  const {
    members,
    departments,
    roles,
    handleInviteMember,
    handleUpdateMemberAccess,
    handleRemoveMember,
    handleChangePassword,
    handleToggleLogin,
    showToast,
    activeUserSpace,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpace?.id || 'default';

  const isRolesPath = location.pathname.includes('/roles');
  const queryTab = searchParams.get('tab') as 'users' | 'roles' | null;
  const initialTab: 'users' | 'roles' = isRolesPath ? 'roles' : (defaultTab || queryTab || 'users');

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>(initialTab);

  useEffect(() => {
    if (isRolesPath) {
      setActiveTab('roles');
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (queryTab && (queryTab === 'users' || queryTab === 'roles')) {
      setActiveTab(queryTab);
    }
  }, [isRolesPath, defaultTab, queryTab]);

  const canManage = useMemo(() => {
    return SecurityPolicy.canManageTeam({
      id: user?.id || 'usr-operator',
      name: user?.name || 'Operator',
      email: user?.email || '',
      role: effectiveRole,
      department: effectiveDepartment,
    });
  }, [user, effectiveRole, effectiveDepartment]);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const nextParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      nextParams.set('q', val);
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleTabChange = (tab: 'users' | 'roles') => {
    setActiveTab(tab);
    const qParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
    if (tab === 'roles') {
      navigate(`/space/${currentSpaceId}/roles${qParam}`);
    } else {
      navigate(`/space/${currentSpaceId}/team${qParam}`);
    }
  };

  // Quick Change Password Modal state
  const [passwordTargetMember, setPasswordTargetMember] = useState<TeamMember | null>(null);
  const [modalNewPassword, setModalNewPassword] = useState('');
  const [modalConfirmPassword, setModalConfirmPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [isSavingModalPassword, setIsSavingModalPassword] = useState(false);

  // Form state for adding/inviting new member
  const defaultDeptName = useMemo(() => {
    return departments.find((d) => d.isDefault)?.name || departments[0]?.name || 'Engineering';
  }, [departments]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Product Engineer');
  const [inviteAccessLevel, setInviteAccessLevel] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviteRoleId, setInviteRoleId] = useState<string>('');
  const [inviteDept, setInviteDept] = useState<string>(defaultDeptName);

  useEffect(() => {
    if (roles && roles.length > 0 && !inviteRoleId) {
      const defaultRole = roles.find((r) => r.isDefault || r.key === 'member') || roles[0];
      if (defaultRole) {
        setInviteRoleId(defaultRole.id);
        const lvl = (defaultRole.key || 'MEMBER').toUpperCase();
        if (lvl === 'ADMIN' || lvl === 'MEMBER' || lvl === 'VIEWER') {
          setInviteAccessLevel(lvl as any);
        }
      }
    }
  }, [roles, inviteRoleId]);

  useEffect(() => {
    if (defaultDeptName && (!inviteDept || !departments.some((d) => d.name === inviteDept))) {
      setInviteDept(defaultDeptName);
    }
  }, [defaultDeptName, departments]);
  const [inviteCanLogin, setInviteCanLogin] = useState(true);
  const [invitePassword, setInvitePassword] = useState('Backnode@2026');
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [inviteAllowedPages, setInviteAllowedPages] = useState<string[]>([
    'overview',
    'tasks',
    'crm',
    'contacts',
    'docs',
  ]);
  const [inviteAllowedActions, setInviteAllowedActions] = useState<string[]>([
    'read',
    'write',
    'delete',
    'publish',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-attribute filtering: Name, Description, Role, and Explicit Permissions
  const { filteredMembers, memberMatchDetails } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const detailsMap: Record<string, string[]> = {};

    const filtered = members.filter((m) => {
      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        (selectedRoleFilter === 'INVITED'
          ? m.status === 'Invited'
          : (m.accessLevel || 'MEMBER').toUpperCase() === selectedRoleFilter);

      const matchesDept =
        selectedDeptFilter === 'ALL' || m.department === selectedDeptFilter;

      if (!matchesRole || !matchesDept) {
        return false;
      }

      if (!q) return true;

      // 1. Name match
      if (m.name.toLowerCase().includes(q)) return true;

      // 2. Email match
      if (m.email && m.email.toLowerCase().includes(q)) return true;

      // 3. Department match
      if (m.department && m.department.toLowerCase().includes(q)) return true;

      // 4. Role title match
      if (m.role && m.role.toLowerCase().includes(q)) return true;

      // 5. Member description / Role description match
      const assignedRole = roles.find(
        (r) =>
          r.id === m.roleId ||
          r.name.toLowerCase() === (m.role || '').toLowerCase() ||
          (r.key && r.key.toLowerCase() === (m.accessLevel || '').toLowerCase())
      );
      if (assignedRole?.description && assignedRole.description.toLowerCase().includes(q)) {
        return true;
      }
      if ((m as any).description && (m as any).description.toLowerCase().includes(q)) {
        return true;
      }

      // 6. Explicit Permission Value match (e.g. tasks.view.all, deals.create, plugins.manage, etc.)
      const userPermissions = getUserExplicitPermissions(m, roles);
      const permMatch = matchPermissionsQuery(userPermissions, q);
      if (permMatch.matches) {
        detailsMap[m.id] = permMatch.matchedKeys.length > 0 ? permMatch.matchedKeys : ['All Permissions (*)'];
        return true;
      }

      return false;
    });

    return { filteredMembers: filtered, memberMatchDetails: detailsMap };
  }, [members, roles, searchQuery, selectedRoleFilter, selectedDeptFilter]);

  // Summary Metrics
  const totalCount = members.length;
  const adminCount = members.filter((m) => {
    const lvl = (m.accessLevel || '').toUpperCase();
    return (
      lvl === 'OWNER' ||
      lvl === 'ADMIN' ||
      m.role.toLowerCase().includes('lead') ||
      m.role.toLowerCase().includes('architect')
    );
  }).length;
  const activeCount = members.filter((m) => m.canLogin !== false && m.status !== 'Disabled').length;
  const disabledCount = members.filter((m) => m.canLogin === false || m.status === 'Disabled').length;

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join?space=${encodeURIComponent(
      activeUserSpace?.slug || 'workspace'
    )}`;
    navigator.clipboard?.writeText(inviteUrl);
    showToast('Workspace invite link copied to clipboard!');
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Please provide both name and email');
      return;
    }

    if (inviteCanLogin && invitePassword && invitePassword.length < 6) {
      showToast('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleInviteMember({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole.trim() || 'Collaborator',
        accessLevel: inviteAccessLevel,
        roleId: inviteRoleId || undefined,
        department: inviteDept,
        capacityStatus: 'Available',
        canLogin: inviteCanLogin,
        password: inviteCanLogin ? invitePassword.trim() : undefined,
        allowedPages: inviteAllowedPages,
        allowedActions: inviteAllowedActions,
      });
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Product Engineer');
      setInviteAccessLevel('MEMBER');
      setInvitePassword('Backnode@2026');
      setInviteCanLogin(true);
      setInviteAllowedPages(['overview', 'tasks', 'crm', 'contacts', 'docs']);
      setInviteAllowedActions(['read', 'write', 'delete', 'publish']);
      setIsInviteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQuickPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetMember) return;
    if (modalNewPassword.length < 6) {
      showToast('Password must be at least 6 characters long.');
      return;
    }
    if (modalNewPassword !== modalConfirmPassword) {
      showToast('Passwords do not match.');
      return;
    }

    setIsSavingModalPassword(true);
    try {
      await handleChangePassword(passwordTargetMember.id, modalNewPassword);
      setPasswordTargetMember(null);
      setModalNewPassword('');
      setModalConfirmPassword('');
    } catch (err) {
      // toast shown in context
    } finally {
      setIsSavingModalPassword(false);
    }
  };

  const handleQuickToggleLogin = async (member: TeamMember) => {
    if (member.accessLevel === 'OWNER') {
      showToast('Workspace Owner login access cannot be disabled.');
      return;
    }
    await handleToggleLogin(member.id);
  };

  const confirmRemove = async () => {
    if (memberToRemove) {
      await handleRemoveMember(memberToRemove.id);
      setMemberToRemove(null);
    }
  };

  const getAccessBadgeStyle = (level?: string) => {
    switch ((level || 'MEMBER').toUpperCase()) {
      case 'OWNER':
        return 'bg-orange-950/40 text-orange-400 border-orange-500/30';
      case 'ADMIN':
        return 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30';
      case 'VIEWER':
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';
      case 'MEMBER':
      default:
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
    }
  };

  // Find member being edited if memberId param is present
  const editingMember = useMemo(() => {
    if (!memberId) return null;
    return members.find((m) => m.id === memberId) || null;
  }, [memberId, members]);

  // If a memberId is in the URL, render the dedicated separate edit page
  if (memberId) {
    if (!editingMember) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#09090b] text-zinc-100 p-8">
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-8 max-w-md w-full flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-[6px] bg-zinc-800 text-zinc-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">person_off</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 font-headline">Operator Not Found</h2>
              <p className="text-xs text-zinc-400 mt-1">
                The requested team member does not exist in this workspace or may have been removed.
              </p>
            </div>
            <button
              onClick={() => navigate(`/space/${currentSpaceId}/team`)}
              className="px-4 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Team Roster</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <EditMemberView
        member={editingMember}
        onBack={() => navigate(`/space/${currentSpaceId}/team`)}
        canManage={canManage}
        onSave={handleUpdateMemberAccess}
        onChangePassword={handleChangePassword}
        onToggleLogin={handleToggleLogin}
        onDeleteMember={handleRemoveMember}
        showToast={showToast}
        activeUserSpaceName={activeUserSpace?.name || 'Workspace'}
      />
    );
  }

  // Otherwise, render the primary Team & Access Roster view
  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] text-zinc-100 overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="px-8 pt-6 pb-0 border-b border-[#27272a] bg-[#0c0a09] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-600/20">
                <span className="material-symbols-outlined text-[18px]">shield_person</span>
              </div>
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight font-headline">
                Team &amp; Roles
              </h1>
              <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono font-semibold bg-orange-950/40 text-orange-400 border border-orange-500/30">
                {activeUserSpace?.name || 'Current Space'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 pl-10.5">
              Manage operators, grant role-based permissions (RBAC), configure page clearance (ABAC), and control login credentials.
            </p>
            {!canManage && (
              <div className="mt-2 pl-10.5 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-[6px] bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold">
                  CONTROLLED ACCESS: Active role is {effectiveRole} ({effectiveDepartment}) — Admin or Owner clearance required to modify permissions
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyInviteLink}
              className="h-8 px-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Copy shareable workspace join link"
            >
              <span className="material-symbols-outlined text-[16px] text-orange-400">link</span>
              <span>Copy Invite Link</span>
            </button>

            {activeTab === 'users' ? (
              <button
                disabled={!canManage}
                onClick={() => setIsInviteModalOpen(true)}
                className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                title={canManage ? 'Add new operator or invite member' : 'Requires Admin or Owner permissions'}
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Add User</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Navigation Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('users')}
              className={`pb-3 px-3 text-xs font-semibold font-headline border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>Users &amp; Operators</span>
              <span
                className={`px-1.5 py-0.2 rounded-[6px] text-[10px] font-mono ${
                  activeTab === 'users'
                    ? 'bg-orange-950/40 border border-orange-500/30 text-orange-400'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {members.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('roles')}
              className={`pb-3 px-3 text-xs font-semibold font-headline border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Roles &amp; Permissions Matrix</span>
              <span
                className={`px-1.5 py-0.2 rounded-[6px] text-[10px] font-mono ${
                  activeTab === 'roles'
                    ? 'bg-orange-950/40 border border-orange-500/30 text-orange-400'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {roles.length}
              </span>
            </button>
          </div>

          <div className="pb-2.5 sm:pb-3 w-full sm:w-96">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-zinc-500 pointer-events-none select-none flex items-center justify-center">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, description, permission (e.g. tasks.view.all)..."
                className="w-full h-8 pl-8 pr-8 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors font-body"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer flex items-center justify-center"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-[15px] leading-none select-none">close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'roles' ? (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <RolesPage
            isEmbedded
            initialRoleId={roleId}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Quick KPI Stat Strip */}
          <div className="px-8 pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-7xl mx-auto">
              <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Total Roster
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">{totalCount}</span>
                  <span className="text-[11px] text-zinc-400">members</span>
                </div>
              </div>

              <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Owners &amp; Admins
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-orange-400 font-mono">{adminCount}</span>
                  <span className="text-[11px] text-zinc-400">with elevated roles</span>
                </div>
              </div>

              <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Login Authorized
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-emerald-400 font-mono">{activeCount}</span>
                  <span className="text-[11px] text-zinc-400">active sign-in</span>
                </div>
              </div>

              <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Login Disabled
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-zinc-400 font-mono">{disabledCount}</span>
                  <span className="text-[11px] text-zinc-400">credentials locked</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Main Body Content */}
          <div className="p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
            {/* Search & Filters Filter Bar */}
            <div className="bg-[#121214] p-3 rounded-[6px] border border-[#27272a] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                {searchQuery ? (
                  <span>
                    Showing <strong className="text-zinc-100">{filteredMembers.length}</strong> operators matching <span className="text-orange-400 font-mono font-medium">"{searchQuery}"</span>
                  </span>
                ) : (
                  <span>Total operators: <strong className="text-zinc-100">{filteredMembers.length}</strong></span>
                )}
                {(searchQuery || selectedRoleFilter !== 'ALL' || selectedDeptFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSearchChange('');
                      setSelectedRoleFilter('ALL');
                      setSelectedDeptFilter('ALL');
                    }}
                    className="text-[11px] text-orange-400 hover:text-orange-300 underline underline-offset-2 ml-1 cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Role Filter Pills */}
                <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-[6px] border border-[#27272a]">
                  {['ALL', 'OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRoleFilter(role)}
                      className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[6px] transition-colors cursor-pointer ${
                        selectedRoleFilter === role
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

            {/* Department Filter Dropdown */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="h-8 px-2.5 bg-[#18181b] border border-[#27272a] rounded-[6px] text-xs text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Team Members Table */}
        <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b] text-zinc-400 font-mono uppercase text-[10.5px] tracking-wider">
                  <th className="py-3 px-6 font-semibold">Operator</th>
                  <th className="py-3 px-4 font-semibold">Assigned Role &amp; Matrix</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Login Access</th>
                  <th className="py-3 px-4 font-semibold">Clearance</th>
                  <th className="py-3 px-4 font-semibold">Workload</th>
                  <th className="py-3 px-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[32px] text-zinc-600">
                          group_off
                        </span>
                        <p className="text-xs font-medium text-zinc-400">
                          No team operators match your active search or filters.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedRoleFilter('ALL');
                            setSelectedDeptFilter('ALL');
                          }}
                          className="mt-1 text-xs text-orange-400 hover:text-orange-300 underline underline-offset-4 cursor-pointer"
                        >
                          Reset filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const accessLevel = (member.accessLevel || 'MEMBER').toUpperCase() as
                      | 'OWNER'
                      | 'ADMIN'
                      | 'MEMBER'
                      | 'VIEWER';
                    const isOwner = accessLevel === 'OWNER' || member.role === 'Workspace Owner';
                    const isLoginEnabled = member.canLogin !== false && member.status !== 'Disabled';

                    const pageCount = (
                      member.allowedPages || ['overview', 'tasks', 'crm', 'contacts', 'docs']
                    ).length;

                    return (
                      <tr
                        key={member.id}
                        className="hover:bg-zinc-800/40 transition-colors group"
                      >
                        {/* Member / Operator */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs text-white shrink-0"
                              style={{
                                backgroundColor:
                                  member.avatarBg && member.avatarBg !== '#9900c2'
                                    ? member.avatarBg
                                    : '#ea580c',
                              }}
                            >
                              {member.initials || member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-100 text-xs truncate">
                                  {member.name}
                                </span>
                                {isOwner && (
                                  <span className="px-1.5 py-0.2 rounded-[6px] text-[9.5px] font-mono font-bold bg-orange-950/60 text-orange-400 border border-orange-500/40">
                                    OWNER {user && (member.email === user.email || member.id === user.id) ? '(YOU)' : ''}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400 font-mono truncate">
                                {member.email || `${member.name.toLowerCase().replace(/\s+/g, '.')}@backnode.io`}
                              </span>
                              {memberMatchDetails[member.id] && memberMatchDetails[member.id].length > 0 && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span
                                    className="text-[9.5px] font-mono text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1.5 py-0.5 rounded-[4px] truncate max-w-[220px]"
                                    title={memberMatchDetails[member.id].join(', ')}
                                  >
                                    Matched Perm: {memberMatchDetails[member.id][0]}
                                    {memberMatchDetails[member.id].length > 1 ? ` (+${memberMatchDetails[member.id].length - 1})` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Assigned Role & Overrides Badge — Clicking opens separate edit page */}
                        <td className="py-3.5 px-4">
                          {(() => {
                            const assignedRole =
                              roles.find((r) => r.id === member.roleId) ||
                              roles.find((r) => r.key === (member.accessLevel || '').toLowerCase()) ||
                              roles.find((r) => r.name.toLowerCase() === (member.role || '').toLowerCase());
                            const roleName = isOwner ? 'Workspace Owner' : assignedRole?.name || accessLevel;

                            let overridesCount = 0;
                            if (member.permissionOverrides) {
                              if (member.permissionOverrides.tasks) {
                                Object.values(member.permissionOverrides.tasks).forEach((v) => {
                                  if (v && v !== 'inherit') overridesCount++;
                                });
                              }
                              if (member.permissionOverrides.deals) {
                                Object.values(member.permissionOverrides.deals).forEach((v) => {
                                  if (v && v !== 'inherit') overridesCount++;
                                });
                              }
                              (['contacts', 'spaces', 'pipelines', 'docs'] as const).forEach((d) => {
                                const obj = member.permissionOverrides?.[d] as any;
                                if (obj) {
                                  Object.values(obj).forEach((v) => {
                                    if (v && v !== 'inherit') overridesCount++;
                                  });
                                }
                              });
                              if (member.permissionOverrides.team) {
                                Object.values(member.permissionOverrides.team).forEach((v) => {
                                  if (v && v !== 'inherit') overridesCount++;
                                });
                              }
                              if (member.permissionOverrides.pages) {
                                Object.values(member.permissionOverrides.pages).forEach((v) => {
                                  if (v && v !== 'inherit') overridesCount++;
                                });
                              }
                            }

                            const isTaskScoped =
                              member.permissionOverrides?.tasks?.view === 'assigned' ||
                              (!member.permissionOverrides?.tasks?.view &&
                                assignedRole?.permissions?.tasks?.view === 'assigned');

                            return (
                              <div className="flex flex-col gap-1 items-start">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/space/${currentSpaceId}/team/members/${member.id}/edit`)
                                  }
                                  className={`px-2.5 py-1 rounded-[6px] border text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 transition-all hover:border-orange-500/60 cursor-pointer ${
                                    isOwner
                                      ? 'bg-orange-950/40 text-orange-400 border-orange-500/30 shadow-xs'
                                      : getAccessBadgeStyle(accessLevel)
                                  }`}
                                  title={
                                    isOwner
                                      ? 'Workspace Owner — Click to edit profile and role'
                                      : 'Click to open dedicated role and overrides editor'
                                  }
                                >
                                  {isOwner ? (
                                    <span className="material-symbols-outlined text-[13px]">shield_person</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-[13px] text-zinc-400">
                                      verified_user
                                    </span>
                                  )}
                                  <span className="truncate max-w-[140px]">{roleName}</span>
                                  <span className="material-symbols-outlined text-[12px] opacity-70">
                                    edit
                                  </span>
                                </button>

                                <div className="flex items-center gap-1 flex-wrap">
                                  {overridesCount > 0 && !isOwner && (
                                    <span
                                      className="px-1.5 py-0.2 rounded-[4px] text-[9.5px] font-mono font-bold bg-orange-950/40 text-orange-400 border border-orange-500/30 flex items-center gap-1"
                                      title={`${overridesCount} custom explicit permission overrides active`}
                                    >
                                      <span>⚡ {overridesCount} overrides</span>
                                    </span>
                                  )}
                                  {isTaskScoped && !isOwner && (
                                    <span
                                      className="px-1.5 py-0.2 rounded-[4px] text-[9.5px] font-mono font-semibold bg-amber-950/40 text-amber-400 border border-amber-500/30"
                                      title="ABAC constrained: Can only access items assigned to them"
                                    >
                                      Assigned Only
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                          {member.department}
                        </td>

                        {/* Login Access Toggle Badge */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            disabled={isOwner || !canManage}
                            onClick={() => handleQuickToggleLogin(member)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-semibold border transition-all ${
                              isLoginEnabled
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                            } ${isOwner ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            title={
                              isOwner
                                ? 'Workspace Owner login cannot be disabled'
                                : isLoginEnabled
                                ? 'Login is enabled (Click to disable operator sign-in)'
                                : 'Login is disabled (Click to enable operator sign-in)'
                            }
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isLoginEnabled ? 'bg-emerald-400' : 'bg-zinc-500'
                              }`}
                            />
                            <span>{isLoginEnabled ? 'Enabled' : 'Disabled'}</span>
                          </button>
                        </td>

                        {/* Page & Action Clearance */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[10.5px] text-zinc-300">
                              {isOwner ? '7/7 Pages (Root)' : `${pageCount}/7 Pages`}
                            </span>
                            <div className="flex items-center gap-1 font-mono text-[9px]">
                              {['read', 'write', 'delete', 'publish', 'admin'].map((act) => {
                                const isAllowed =
                                  isOwner || accessLevel === 'ADMIN'
                                    ? true
                                    : (member.allowedActions || ['read', 'write', 'delete', 'publish']).includes(
                                        act
                                      );
                                return (
                                  <span
                                    key={act}
                                    className={`px-1 py-0.2 rounded-[3px] border ${
                                      isAllowed
                                        ? 'bg-orange-950/40 text-orange-400 border-orange-500/30'
                                        : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                                    }`}
                                    title={`${act.toUpperCase()}: ${isAllowed ? 'Allowed' : 'Restricted'}`}
                                  >
                                    {act[0].toUpperCase()}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Workload */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-zinc-200">
                              {member.activeTasks}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-[6px] text-[10px] font-mono ${
                                member.capacityStatus === 'Overloaded'
                                  ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
                                  : member.capacityStatus === 'Near capacity'
                                  ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {member.capacityStatus || 'Available'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Change Password Button */}
                            <button
                              disabled={!canManage}
                              onClick={() => {
                                setPasswordTargetMember(member);
                                setModalNewPassword('');
                                setModalConfirmPassword('');
                              }}
                              className="p-1.5 rounded-[6px] border border-[#27272a] hover:border-orange-500/40 bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Change operator password"
                            >
                              <span className="material-symbols-outlined text-[15px]">key</span>
                            </button>

                            {/* Edit Role & Access Page Button */}
                            <button
                              onClick={() =>
                                navigate(`/space/${currentSpaceId}/team/members/${member.id}/edit`)
                              }
                              className="px-2 py-1 rounded-[6px] border border-[#27272a] hover:border-orange-500/40 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title={isOwner ? 'Edit Workspace Owner Profile & Role' : 'Edit Role & Clearance'}
                            >
                              <span className="material-symbols-outlined text-[14px]">tune</span>
                              <span>Edit</span>
                            </button>

                            {/* Delete User Button */}
                            {isOwner ? (
                              <div
                                className="w-7 h-7 rounded-[6px] text-zinc-600 flex items-center justify-center cursor-not-allowed"
                                title="Workspace Owner cannot be deleted"
                              >
                                <span className="material-symbols-outlined text-[16px]">lock</span>
                              </div>
                            ) : (
                              <button
                                disabled={!canManage}
                                onClick={() => setMemberToRemove(member)}
                                className="w-7 h-7 rounded-[6px] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Delete user and revoke credentials"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  person_remove
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Role-Based Permissions Matrix Guide */}
        <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-orange-400">
              admin_panel_settings
            </span>
            <h2 className="font-semibold text-sm text-zinc-100 font-headline">
              Workspace Role Permissions Matrix
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Backnode OS implements strict multi-tenant role enforcement. The capabilities below detail the authorization level granted to each operator role.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#27272a] text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Permission Area</th>
                  <th className="py-2.5 px-4 text-center">Owner</th>
                  <th className="py-2.5 px-4 text-center">Admin</th>
                  <th className="py-2.5 px-4 text-center">Member</th>
                  <th className="py-2.5 px-4 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-[11px]">
                <tr>
                  <td className="py-2.5 px-4 font-medium text-zinc-200">
                    Workspace Ownership &amp; Billing Control
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-2.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-2.5 px-4 text-center text-zinc-600">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-zinc-200">
                    Add, Delete Users &amp; Reset Passwords
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-zinc-600">—</td>
                  <td className="py-2.5 px-4 text-center text-zinc-600">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-zinc-200">
                    Configure Task Spaces, Folders &amp; CRM Stages
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-zinc-600">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-zinc-200">
                    Create, Triage &amp; Update Tasks &amp; CRM Deals
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-zinc-600">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* 5. Comprehensive Add / Invite User Modal */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] bg-[#121214] rounded-[6px] shadow-2xl border border-[#27272a] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#18181b] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 font-headline">Add New Operator / User</h3>
                  <p className="text-[11px] text-zinc-400">
                    Provision login credentials and clearance for {activeUserSpace?.name || 'this workspace'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jordan@company.com"
                    className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Department & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Department
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInviteModalOpen(false);
                        navigate(`/space/${currentSpaceId}/settings/departments`);
                      }}
                      className="text-[10px] text-orange-400 hover:text-orange-300 hover:underline font-mono cursor-pointer"
                    >
                      Configure →
                    </button>
                  </div>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    placeholder="e.g. Systems Engineer"
                    className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Assigned Workspace Role */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Assigned Workspace Role (Template)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      navigate(`/space/${currentSpaceId}/roles`);
                    }}
                    className="text-[10px] text-orange-400 hover:text-orange-300 hover:underline font-mono cursor-pointer"
                  >
                    View Roles Matrix →
                  </button>
                </div>
                <select
                  value={inviteRoleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setInviteRoleId(id);
                    const found = roles.find((r) => r.id === id);
                    if (found) {
                      const lvl = (found.key || 'MEMBER').toUpperCase();
                      if (lvl === 'ADMIN' || lvl === 'MEMBER' || lvl === 'VIEWER') {
                        setInviteAccessLevel(lvl as any);
                      }
                      if (found.permissions?.allowedPages) {
                        setInviteAllowedPages(found.permissions.allowedPages);
                      }
                    }
                  }}
                  className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isSystem ? '(System)' : '(Custom)'} {r.permissions?.tasks?.view === 'assigned' ? '• Tasks: Assigned Only' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Access Tier */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Access Level Tier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      lvl: 'ADMIN',
                      title: 'Admin',
                      desc: 'Full config, invites & roles',
                    },
                    {
                      lvl: 'MEMBER',
                      title: 'Member',
                      desc: 'Full task & CRM deals authoring',
                    },
                    {
                      lvl: 'VIEWER',
                      title: 'Viewer',
                      desc: 'Read-only visibility across boards',
                    },
                  ].map((r) => (
                    <div
                      key={r.lvl}
                      onClick={() => {
                        const nextLvl = r.lvl as 'ADMIN' | 'MEMBER' | 'VIEWER';
                        setInviteAccessLevel(nextLvl);
                        if (nextLvl === 'VIEWER') {
                          setInviteAllowedActions(['read']);
                        } else if (nextLvl === 'ADMIN') {
                          setInviteAllowedActions(['read', 'write', 'delete', 'publish', 'admin']);
                          setInviteAllowedPages(['overview', 'tasks', 'crm', 'contacts', 'docs', 'team', 'settings']);
                        } else {
                          setInviteAllowedActions(['read', 'write', 'delete', 'publish']);
                        }
                      }}
                      className={`p-2.5 rounded-[6px] border cursor-pointer transition-all ${
                        inviteAccessLevel === r.lvl
                          ? 'border-orange-500 bg-orange-950/40 ring-1 ring-orange-500/30'
                          : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold text-xs ${
                            inviteAccessLevel === r.lvl ? 'text-orange-400' : 'text-zinc-200'
                          }`}
                        >
                          {r.title}
                        </span>
                        {inviteAccessLevel === r.lvl && (
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication Credentials & Password */}
              <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-[6px] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-orange-400">vpn_key</span>
                    <span className="text-xs font-semibold text-zinc-100 font-headline">Operator Login &amp; Password</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[11px] text-zinc-300 font-medium">Enable Login</span>
                    <input
                      type="checkbox"
                      checked={inviteCanLogin}
                      onChange={(e) => setInviteCanLogin(e.target.checked)}
                      className="accent-orange-600 rounded-[3px] w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                {inviteCanLogin && (
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Initial Password
                    </label>
                    <div className="relative">
                      <input
                        type={showInvitePassword ? 'text' : 'password'}
                        value={invitePassword}
                        onChange={(e) => setInvitePassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full h-[34px] pl-3 pr-20 text-[13px] bg-[#121214] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                      />
                      <div className="absolute right-1 top-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowInvitePassword(!showInvitePassword)}
                          className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                          {showInvitePassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      The operator will use this password to sign in immediately.
                    </span>
                  </div>
                )}
              </div>

              {/* Page Clearance Matrix (ABAC) */}
              <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-[6px] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-100 font-headline">
                    Authorized Pages (ABAC Clearance)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (inviteAllowedPages.length === WORKSPACE_PAGES.length) {
                        setInviteAllowedPages(['overview']);
                      } else {
                        setInviteAllowedPages(WORKSPACE_PAGES.map((p) => p.id));
                      }
                    }}
                    className="text-[10px] font-mono text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    {inviteAllowedPages.length === WORKSPACE_PAGES.length ? 'Clear All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WORKSPACE_PAGES.map((page) => {
                    const isChecked = inviteAllowedPages.includes(page.id);
                    return (
                      <label
                        key={page.id}
                        className={`p-2 rounded-[6px] border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-orange-950/20 border-orange-500/40 text-zinc-200'
                            : 'bg-[#121214] border-[#27272a] text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInviteAllowedPages([...inviteAllowedPages, page.id]);
                            } else {
                              setInviteAllowedPages(inviteAllowedPages.filter((p) => p !== page.id));
                            }
                          }}
                          className="accent-orange-600 rounded-[3px] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">{page.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Permissions Matrix (RBAC) */}
              <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-[6px] flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-zinc-100 font-headline">
                  Action Capabilities (RBAC Permissions)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WORKSPACE_ACTIONS.map((action) => {
                    const isChecked = inviteAllowedActions.includes(action.id);
                    return (
                      <label
                        key={action.id}
                        className={`p-2 rounded-[6px] border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-orange-950/20 border-orange-500/40 text-zinc-200'
                            : 'bg-[#121214] border-[#27272a] text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setInviteAllowedActions([...inviteAllowedActions, action.id]);
                            } else {
                              setInviteAllowedActions(inviteAllowedActions.filter((a) => a !== action.id));
                            }
                          }}
                          className="accent-orange-600 rounded-[3px] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">{action.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="h-8 px-4 rounded-[6px] border border-[#27272a] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-8 px-5 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>{isSubmitting ? 'Creating User...' : 'Add Operator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Quick Change Password Modal */}
      {passwordTargetMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPasswordTargetMember(null)}
        >
          <div
            className="w-full max-w-md bg-[#121214] rounded-[6px] shadow-2xl border border-[#27272a] overflow-hidden p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">vpn_key</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                  Change Password: {passwordTargetMember.name}
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {passwordTargetMember.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveQuickPassword} className="flex flex-col gap-3.5 pt-2">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={modalNewPassword}
                    onChange={(e) => setModalNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-[34px] pl-3 pr-16 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-2 top-2 text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
                  >
                    {showModalPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showModalPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={modalConfirmPassword}
                  onChange={(e) => setModalConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setPasswordTargetMember(null)}
                  className="h-8 px-3.5 rounded-[6px] border border-[#27272a] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingModalPassword}
                  className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingModalPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Revoke / Remove Confirmation Modal */}
      {memberToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setMemberToRemove(null)}
        >
          <div
            className="w-full max-w-sm bg-[#121214] rounded-[6px] shadow-2xl border border-rose-900/50 overflow-hidden p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-[6px] bg-rose-950/40 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <span className="material-symbols-outlined text-[22px]">person_remove</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                Delete Operator &amp; Revoke Access?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Are you sure you want to remove <strong className="text-zinc-200">{memberToRemove.name}</strong> from{' '}
                {activeUserSpace?.name || 'this workspace'}? Their login credentials and all access privileges will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                onClick={() => setMemberToRemove(null)}
                className="h-8 px-3.5 rounded-[6px] border border-[#27272a] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Keep Member
              </button>
              <button
                onClick={confirmRemove}
                className="h-8 px-3.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Dedicated Separate Edit Page View for Editing Team Roles & Access Controls
 * Conforms strictly to design.md (Obsidian #09090b / #121214, Electric Orange #ea580c, 6px radii)
 */
/**
 * Dedicated Separate Edit Page View for Editing Team Roles & Access Controls
 * Conforms strictly to design.md (Obsidian #09090b / #121214, Electric Orange #ea580c, 6px radii)
 */
interface EditMemberViewProps {
  member: TeamMember;
  onBack: () => void;
  canManage: boolean;
  onSave: (id: string, updates: Partial<TeamMember>) => Promise<void>;
  onChangePassword: (id: string, password: string) => Promise<void>;
  onToggleLogin: (id: string, canLogin?: boolean) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  showToast: (msg: string) => void;
  activeUserSpaceName: string;
}

const EditMemberView: React.FC<EditMemberViewProps> = ({
  member,
  onBack,
  canManage,
  onSave,
  onChangePassword,
  onToggleLogin,
  onDeleteMember,
  showToast,
  activeUserSpaceName,
}) => {
  const navigate = useNavigate();
  const { departments, roles, activeUserSpaceId, activeUserSpace } = useWorkspace();
  const currentSpaceId = activeUserSpaceId || activeUserSpace?.id || 'default';
  const defaultDeptName = departments.find((d) => d.isDefault)?.name || departments[0]?.name || 'Engineering';

  const isOwner =
    (member.accessLevel || '').toUpperCase() === 'OWNER' ||
    member.role === 'Workspace Owner';

  // Find currently assigned role or matching fallback
  const initialRole = useMemo(() => {
    if (member.roleId) {
      const byId = roles.find((r) => r.id === member.roleId);
      if (byId) return byId;
    }
    const accessKey = (member.accessLevel || 'MEMBER').toLowerCase();
    const byKey = roles.find((r) => r.key === accessKey);
    if (byKey) return byKey;
    const byName = roles.find((r) => r.name.toLowerCase() === (member.role || '').toLowerCase());
    if (byName) return byName;
    return roles.find((r) => r.isDefault || r.key === 'member') || roles[0];
  }, [member, roles]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRole?.id || '');
  const [role, setRole] = useState(member.role || initialRole?.name || 'Member');
  const [department, setDepartment] = useState<string>(member.department || defaultDeptName);
  const [canLogin, setCanLogin] = useState<boolean>(
    member.canLogin !== undefined ? member.canLogin : member.status !== 'Disabled'
  );

  // Granular Explicit Overrides State
  const [overrides, setOverrides] = useState<UserPermissionOverrides>(() => {
    return member.permissionOverrides ? JSON.parse(JSON.stringify(member.permissionOverrides)) : {};
  });

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || initialRole || null;
  }, [roles, selectedRoleId, initialRole]);

  // Live Effective clearance calculation
  const liveEffective = useMemo(() => {
    return resolveEffectivePermissions(selectedRole, overrides, isOwner);
  }, [selectedRole, overrides, isOwner]);

  // Count active overrides
  const activeOverridesCount = useMemo(() => {
    if (!overrides) return 0;
    let count = 0;
    if (overrides.tasks) {
      Object.values(overrides.tasks).forEach((v) => {
        if (v && v !== 'inherit') count++;
      });
    }
    if (overrides.deals) {
      Object.values(overrides.deals).forEach((v) => {
        if (v && v !== 'inherit') count++;
      });
    }
    (['contacts', 'spaces', 'pipelines', 'docs'] as const).forEach((d) => {
      const obj = overrides[d] as any;
      if (obj) {
        Object.values(obj).forEach((v) => {
          if (v && v !== 'inherit') count++;
        });
      }
    });
    if (overrides.team) {
      Object.values(overrides.team).forEach((v) => {
        if (v && v !== 'inherit') count++;
      });
    }
    if (overrides.pages) {
      Object.values(overrides.pages).forEach((v) => {
        if (v && v !== 'inherit') count++;
      });
    }
    return count;
  }, [overrides]);

  // Override mutation helpers
  const setTaskScopeOverride = (key: keyof TaskPermissions, val: OverrideScope) => {
    setOverrides((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [key]: val,
      },
    }));
  };

  const setTaskBoolOverride = (key: 'create' | 'assign', val: OverrideBoolean) => {
    setOverrides((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [key]: val,
      },
    }));
  };

  const setDealScopeOverride = (key: keyof DealPermissions, val: OverrideScope) => {
    setOverrides((prev) => ({
      ...prev,
      deals: {
        ...prev.deals,
        [key]: val,
      },
    }));
  };

  const setDealBoolOverride = (key: 'create' | 'assign', val: OverrideBoolean) => {
    setOverrides((prev) => ({
      ...prev,
      deals: {
        ...prev.deals,
        [key]: val,
      },
    }));
  };

  const setCrudOverride = (
    domain: 'contacts' | 'spaces' | 'pipelines' | 'docs',
    action: 'view' | 'create' | 'update' | 'delete',
    val: OverrideBoolean
  ) => {
    setOverrides((prev) => ({
      ...prev,
      [domain]: {
        ...(prev[domain] as any),
        [action]: val,
      },
    }));
  };

  const setTeamOverride = (action: 'manage_members' | 'manage_roles' | 'manage_settings', val: OverrideBoolean) => {
    setOverrides((prev) => ({
      ...prev,
      team: {
        ...prev.team,
        [action]: val,
      },
    }));
  };

  const setPageOverride = (pageId: string, val: OverrideBoolean) => {
    setOverrides((prev) => {
      const prevPages = prev.pages || {};
      return {
        ...prev,
        pages: {
          ...prevPages,
          [pageId]: val,
        },
      };
    });
  };

  const resetAllOverrides = () => {
    setOverrides({});
    showToast('All explicit overrides cleared. Inheriting directly from assigned role.');
  };

  // Password reset inside Edit view
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canManage) {
      showToast('You do not have administrative clearance to update team roles.');
      return;
    }

    setIsSaving(true);
    try {
      const effectiveAccessLevel = isOwner
        ? 'OWNER'
        : ((selectedRole?.key || 'MEMBER').toUpperCase() as any);
      const effectiveCanLogin = isOwner ? true : canLogin;

      await onSave(member.id, {
        roleId: selectedRoleId,
        permissionOverrides: overrides,
        accessLevel: effectiveAccessLevel,
        role: role.trim() || (isOwner ? 'Workspace Owner' : selectedRole?.name || 'Collaborator'),
        department: department as any,
        canLogin: effectiveCanLogin,
        allowedPages: isOwner
          ? ['overview', 'tasks', 'crm', 'contacts', 'docs', 'team', 'roles', 'settings']
          : liveEffective.allowedPages,
        allowedActions: isOwner
          ? ['read', 'write', 'delete', 'publish', 'admin']
          : liveEffective.tasks.create || liveEffective.deals.create
          ? ['read', 'write', 'delete', 'publish']
          : ['read'],
        status: 'Active',
      });
      showToast(`Access and permissions updated for ${member.name}`);
      onBack();
    } catch (err) {
      console.error(err);
      showToast('Failed to update member access');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await onChangePassword(member.id, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showToast(`Password successfully updated for ${member.name}`);
    } catch (err) {
      // handled
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggleLoginAction = async () => {
    if (isOwner) {
      showToast('Workspace Owner login access cannot be disabled.');
      return;
    }
    const nextVal = !canLogin;
    setCanLogin(nextVal);
    await onToggleLogin(member.id, nextVal);
  };

  const handleDeleteUser = async () => {
    if (isOwner) {
      showToast('Workspace Owner cannot be deleted.');
      return;
    }
    setIsDeleting(true);
    try {
      await onDeleteMember(member.id);
      showToast(`Operator "${member.name}" deleted`);
      onBack();
    } catch (err) {
      showToast('Failed to delete member');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const isTaskScopeConstrained = liveEffective.tasks.view === 'assigned';
  const isDealScopeConstrained = liveEffective.deals.view === 'assigned';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto custom-scrollbar text-zinc-100">
      {/* 1. Header Toolbar & Breadcrumbs */}
      <div className="px-8 pt-6 pb-6 border-b border-[#27272a] bg-[#0c0a09] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <button
              onClick={onBack}
              className="hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Team &amp; Access</span>
            </button>
            <span className="text-zinc-600">/</span>
            <span>Operators</span>
            <span className="text-zinc-600">/</span>
            <span className="text-orange-400 font-mono font-medium">
              Edit Permissions: {member.name}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-orange-600 text-white flex items-center justify-center shadow-sm shadow-orange-600/30">
                <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg md:text-xl font-bold text-zinc-100 tracking-tight font-headline">
                    Operator Permissions &amp; Matrix Editor
                  </h1>
                  <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-orange-950/40 text-orange-400 border border-orange-500/30">
                    {member.id}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Assign a base workspace role and configure granular explicit overrides (ABAC scopes &amp; RBAC actions).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                className="h-8 px-3.5 rounded-[6px] border border-[#27272a] bg-[#121214] hover:bg-[#18181b] text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving || !canManage}
                className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>{isSaving ? 'Saving...' : 'Save Role & Access'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Page Body (Bento Grid) */}
      <div className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Workspace Owner Permanent Role Callout Banner */}
        {isOwner && (
          <div className="bg-[#121214] border border-orange-500/40 rounded-[6px] p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-[6px] bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <span className="material-symbols-outlined text-2xl">shield_person</span>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                  Workspace Creator &amp; Root Owner
                </h3>
                <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-orange-950/60 text-orange-400 border border-orange-500/40 uppercase">
                  ROOT AUTHORITY
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This operator is the primary creator and owner of <strong className="text-zinc-200">{activeUserSpaceName}</strong>.
                As Workspace Owner, root access tier and all actions across all scopes are unconditionally granted.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Role Selector & Granular Overrides Matrix (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Operator Identity & Sign-In Control Card */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-xs shrink-0"
                  style={{
                    backgroundColor:
                      member.avatarBg && member.avatarBg !== '#9900c2'
                        ? member.avatarBg
                        : '#ea580c',
                  }}
                >
                  {member.initials || member.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-100 font-headline">
                      {member.name}
                    </span>
                    {canLogin ? (
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Login Enabled</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono bg-rose-950/40 text-rose-400 border border-rose-500/30 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        <span>Login Disabled</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    {member.email || `${member.name.toLowerCase().replace(/\s+/g, '.')}@backnode.io`}
                  </span>
                </div>
              </div>

              {/* Toggle Login Switch */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isOwner || !canManage}
                  onClick={handleToggleLoginAction}
                  className={`h-8 px-3.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    canLogin
                      ? 'bg-rose-950/30 border-rose-800/40 text-rose-300 hover:bg-rose-900/40'
                      : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/40'
                  } ${isOwner ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  title={isOwner ? 'Workspace Owner login cannot be disabled' : undefined}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {canLogin ? 'block' : 'check_circle'}
                  </span>
                  <span>{canLogin ? 'Disable Sign-In' : 'Enable Sign-In'}</span>
                </button>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 flex flex-col gap-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-orange-400">vpn_key</span>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                    Change Password &amp; Credentials
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Update the bcrypt-hashed sign-in credentials for this operator.
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full h-[34px] pl-3 pr-14 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-500">
                    Passwords are encrypted with bcrypt on the backend.
                  </span>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !newPassword || newPassword.length < 6}
                    className="h-8 px-4 rounded-[6px] bg-[#18181b] border border-orange-500/40 text-orange-400 hover:bg-orange-600 hover:text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* 1. Assigned Base Role Template Card */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-orange-400">verified_user</span>
                    <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                      Assigned Base Role (Template)
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Select a base role grouping common permissions. All settings below default to this role unless explicitly overridden.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/space/${currentSpaceId}/roles`)}
                  className="text-xs font-mono text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage Roles</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              {/* Roles Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {roles.map((r) => {
                  const isSelected = selectedRoleId === r.id;
                  const isRoleOwner = r.key === 'owner';
                  const isLocked = isOwner && !isRoleOwner;

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (isOwner || !canManage) return;
                        setSelectedRoleId(r.id);
                      }}
                      className={`p-3.5 rounded-[6px] border flex flex-col gap-2 transition-all ${
                        isLocked
                          ? 'opacity-40 cursor-not-allowed border-[#27272a] bg-[#18181b]'
                          : isSelected
                          ? 'border-orange-500 bg-orange-950/20 ring-1 ring-orange-500/40 cursor-pointer shadow-xs'
                          : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ color: r.color || '#ea580c' }}
                          >
                            {r.icon || 'shield'}
                          </span>
                          <span className="font-semibold text-xs text-zinc-100 truncate">
                            {r.name}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded-[4px] font-mono text-[9.5px] uppercase font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                          {r.key || (r.isSystem ? 'SYSTEM' : 'CUSTOM')}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[#27272a]/60">
                        {r.permissions?.tasks?.view === 'assigned' && (
                          <span className="px-1.5 py-0.2 rounded-[4px] text-[9px] font-mono bg-amber-950/40 text-amber-400 border border-amber-500/30">
                            Tasks: Assigned Only
                          </span>
                        )}
                        {r.permissions?.deals?.view === 'assigned' && (
                          <span className="px-1.5 py-0.2 rounded-[4px] text-[9px] font-mono bg-amber-950/40 text-amber-400 border border-amber-500/30">
                            Deals: Assigned Only
                          </span>
                        )}
                        {r.isDefault && (
                          <span className="px-1.5 py-0.2 rounded-[4px] text-[9px] font-mono bg-zinc-800 text-zinc-400">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Granular Permissions Matrix with Explicit Overrides */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-6 flex flex-col gap-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272a]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                        Explicit Permissions Matrix &amp; Overrides
                      </h3>
                      {activeOverridesCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-orange-950/50 text-orange-400 border border-orange-500/30">
                          {activeOverridesCount} EXPLICIT OVERRIDES ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700">
                          PURE ROLE CLEARANCE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Assign explicit permissions to this operator even with a role assigned. Use 'Inherit' to follow role updates.
                    </p>
                  </div>
                </div>

                {!isOwner && activeOverridesCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAllOverrides}
                    className="h-7 px-3 rounded-[6px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer self-start sm:self-auto"
                    title="Clear all overrides back to pure role inheritance"
                  >
                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                    <span>Reset to Role Defaults</span>
                  </button>
                )}
              </div>

              {/* SECTION A: Tasks Management Matrix (ABAC & RBAC) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-orange-400">task_alt</span>
                    <h4 className="font-semibold text-xs text-zinc-200 font-headline uppercase tracking-wider">
                      Tasks Execution &amp; Scope Matrix
                    </h4>
                  </div>
                  {liveEffective.tasks.view === 'assigned' && (
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-amber-950/40 text-amber-400 border border-amber-500/30">
                      ABAC: ASSIGNED TASKS ONLY
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#27272a] text-zinc-500 font-mono uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-3">Capability</th>
                        <th className="py-2 px-3">Operational Scope</th>
                        <th className="py-2 px-3 text-right">Clearance Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {/* View Tasks */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">View Tasks</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Visibility across sprint boards, lists, and calendar.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideScopeSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.tasks?.view}
                            roleDefault={selectedRole?.permissions?.tasks?.view || 'all'}
                            onChange={(val) => setTaskScopeOverride('view', val)}
                          />
                        </td>
                      </tr>

                      {/* Create Tasks */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Create Tasks</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Create and manage tasks, deliverables, and specs.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideBooleanSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.tasks?.create}
                            roleDefault={selectedRole?.permissions?.tasks?.create ?? true}
                            onChange={(val) => setTaskBoolOverride('create', val)}
                          />
                        </td>
                      </tr>

                      {/* Edit Tasks */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Edit / Update Tasks</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Modify task description, markdown, and estimations.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideScopeSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.tasks?.update}
                            roleDefault={selectedRole?.permissions?.tasks?.update || 'all'}
                            onChange={(val) => setTaskScopeOverride('update', val)}
                          />
                        </td>
                      </tr>

                      {/* Change Status */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Change Status</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Transition lifecycle status (Backlog → In Progress → Review → Done).
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideScopeSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.tasks?.change_status}
                            roleDefault={selectedRole?.permissions?.tasks?.change_status || 'all'}
                            onChange={(val) => setTaskScopeOverride('change_status', val)}
                          />
                        </td>
                      </tr>

                      {/* Assign Tasks */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Assign / Reassign</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Reassign deliverables to other operators or claim tasks.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideBooleanSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.tasks?.assign}
                            roleDefault={selectedRole?.permissions?.tasks?.assign ?? true}
                            onChange={(val) => setTaskBoolOverride('assign', val)}
                          />
                        </td>
                      </tr>

                      {/* Delete Tasks */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Delete Tasks</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Permanently delete or archive deliverables.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideScopeSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.tasks?.delete}
                            roleDefault={selectedRole?.permissions?.tasks?.delete || 'all'}
                            onChange={(val) => setTaskScopeOverride('delete', val)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION B: CRM Deals & Revenue Pipelines Matrix (ABAC & RBAC) */}
              <div className="flex flex-col gap-3 pt-3 border-t border-[#27272a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-orange-400">leaderboard</span>
                    <h4 className="font-semibold text-xs text-zinc-200 font-headline uppercase tracking-wider">
                      CRM Deals &amp; Revenue Pipeline Matrix
                    </h4>
                  </div>
                  {liveEffective.deals.view === 'assigned' && (
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-amber-950/40 text-amber-400 border border-amber-500/30">
                      ABAC: ASSIGNED DEALS ONLY
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#27272a] text-zinc-500 font-mono uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-3">Capability</th>
                        <th className="py-2 px-3">Operational Scope</th>
                        <th className="py-2 px-3 text-right">Clearance Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {/* View Deals */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">View Deals</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Visibility across sales funnels and stage boards.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideScopeSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.deals?.view}
                            roleDefault={selectedRole?.permissions?.deals?.view || 'all'}
                            onChange={(val) => setDealScopeOverride('view', val)}
                          />
                        </td>
                      </tr>

                      {/* Create Deals */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Create Deals</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Create and manage opportunities and accounts.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideBooleanSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.deals?.create}
                            roleDefault={selectedRole?.permissions?.deals?.create ?? true}
                            onChange={(val) => setDealBoolOverride('create', val)}
                          />
                        </td>
                      </tr>

                      {/* Edit Deals */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Edit / Update Deals</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Modify deal value, probability, notes, and contacts.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideScopeSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.deals?.update}
                            roleDefault={selectedRole?.permissions?.deals?.update || 'all'}
                            onChange={(val) => setDealScopeOverride('update', val)}
                          />
                        </td>
                      </tr>

                      {/* Change Stage */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Change Stage</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Advance deal stages (Lead → Qualified → Proposal → Won/Lost).
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideScopeSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.deals?.change_stage}
                            roleDefault={selectedRole?.permissions?.deals?.change_stage || 'all'}
                            onChange={(val) => setDealScopeOverride('change_stage', val)}
                          />
                        </td>
                      </tr>

                      {/* Assign Deals */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Assign / Reassign Owner</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Change lead/deal ownership among sales operators.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideBooleanSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.deals?.assign}
                            roleDefault={selectedRole?.permissions?.deals?.assign ?? true}
                            onChange={(val) => setDealBoolOverride('assign', val)}
                          />
                        </td>
                      </tr>

                      {/* Delete Deals */}
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Delete Deals</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Permanently remove opportunities from pipeline.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideScopeSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.deals?.delete}
                            roleDefault={selectedRole?.permissions?.deals?.delete || 'all'}
                            onChange={(val) => setDealScopeOverride('delete', val)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION C: Contacts, Spaces, Pipelines, & Docs (CRUD) */}
              <div className="flex flex-col gap-4 pt-3 border-t border-[#27272a]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-orange-400">category</span>
                  <h4 className="font-semibold text-xs text-zinc-200 font-headline uppercase tracking-wider">
                    Contacts, Spaces, Pipelines &amp; Architecture Matrix
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contacts */}
                  <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-100">Contacts Directory</span>
                      <span className="text-[10px] font-mono text-zinc-400">directory</span>
                    </div>
                    {(['view', 'create', 'update', 'delete'] as const).map((act) => (
                      <div key={act} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 uppercase text-[10px] font-mono">{act}</span>
                        <OverrideBooleanSelector
                          disabled={!canManage || isOwner}
                          overrideValue={overrides.contacts?.[act]}
                          roleDefault={selectedRole?.permissions?.contacts?.[act] ?? (act !== 'delete')}
                          onChange={(val) => setCrudOverride('contacts', act, val)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Spaces */}
                  <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-100">Task Spaces &amp; Lists</span>
                      <span className="text-[10px] font-mono text-zinc-400">spaces</span>
                    </div>
                    {(['view', 'create', 'update', 'delete'] as const).map((act) => (
                      <div key={act} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 uppercase text-[10px] font-mono">{act}</span>
                        <OverrideBooleanSelector
                          disabled={!canManage || isOwner}
                          overrideValue={overrides.spaces?.[act]}
                          roleDefault={selectedRole?.permissions?.spaces?.[act] ?? (act !== 'delete')}
                          onChange={(val) => setCrudOverride('spaces', act, val)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pipelines */}
                  <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-100">CRM Pipelines Config</span>
                      <span className="text-[10px] font-mono text-zinc-400">pipelines</span>
                    </div>
                    {(['view', 'create', 'update', 'delete'] as const).map((act) => (
                      <div key={act} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 uppercase text-[10px] font-mono">{act}</span>
                        <OverrideBooleanSelector
                          disabled={!canManage || isOwner}
                          overrideValue={overrides.pipelines?.[act]}
                          roleDefault={selectedRole?.permissions?.pipelines?.[act] ?? (act !== 'delete')}
                          onChange={(val) => setCrudOverride('pipelines', act, val)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Docs */}
                  <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-100">Architecture Specs &amp; RFCs</span>
                      <span className="text-[10px] font-mono text-zinc-400">documentation</span>
                    </div>
                    {(['view', 'create', 'update', 'delete'] as const).map((act) => (
                      <div key={act} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 uppercase text-[10px] font-mono">{act}</span>
                        <OverrideBooleanSelector
                          disabled={!canManage || isOwner}
                          overrideValue={overrides.docs?.[act]}
                          roleDefault={selectedRole?.permissions?.docs?.[act] ?? (act !== 'delete')}
                          onChange={(val) => setCrudOverride('docs', act, val)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION D: Team & Workspace Administration */}
              <div className="flex flex-col gap-3 pt-3 border-t border-[#27272a]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-orange-400">admin_panel_settings</span>
                  <h4 className="font-semibold text-xs text-zinc-200 font-headline uppercase tracking-wider">
                    Team &amp; Workspace Administration
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <tbody className="divide-y divide-[#27272a]">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Manage Members &amp; Passwords</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Invite, edit credentials, and remove team operators.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideBooleanSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.team?.manage_members}
                            roleDefault={selectedRole?.permissions?.team?.manage_members ?? false}
                            onChange={(val) => setTeamOverride('manage_members', val)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Manage Roles &amp; Matrix</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Create, duplicate, and modify workspace role definitions.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideBooleanSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.team?.manage_roles}
                            roleDefault={selectedRole?.permissions?.team?.manage_roles ?? false}
                            onChange={(val) => setTeamOverride('manage_roles', val)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-200">Manage Global Workspace Settings</td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          Configure branding, custom departments, integrations, and telemetry.
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OverrideBooleanSelector
                            disabled={!canManage || isOwner}
                            overrideValue={overrides.team?.manage_settings}
                            roleDefault={selectedRole?.permissions?.team?.manage_settings ?? false}
                            onChange={(val) => setTeamOverride('manage_settings', val)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION E: Authorized Workspace Pages (ABAC Clearance) */}
              <div className="flex flex-col gap-3 pt-3 border-t border-[#27272a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-orange-400">shield</span>
                    <h4 className="font-semibold text-xs text-zinc-200 font-headline uppercase tracking-wider">
                      Authorized Workspace Pages (ABAC Clearance)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {liveEffective.allowedPages.length}/8 Pages Authorized
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {WORKSPACE_PAGES.map((page) => {
                    const roleDefaultHasPage = Boolean(
                      selectedRole?.permissions?.allowedPages?.includes(page.id)
                    );
                    const pageOverride = overrides.pages?.[page.id];

                    return (
                      <div
                        key={page.id}
                        className="p-3 rounded-[6px] border border-[#27272a] bg-[#18181b] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-zinc-400">
                            {page.icon}
                          </span>
                          <span className="text-xs font-semibold text-zinc-200 truncate">
                            {page.label}
                          </span>
                        </div>

                        <OverrideBooleanSelector
                          disabled={!canManage || isOwner}
                          overrideValue={pageOverride}
                          roleDefault={roleDefaultHasPage}
                          onChange={(val) => setPageOverride(page.id, val)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Department & Functional Title Card */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                Department &amp; Functional Title
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Assigned Department
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate(`/space/${currentSpaceId}/settings/departments`)}
                      className="text-[10px] text-orange-400 hover:text-orange-300 hover:underline font-mono cursor-pointer"
                    >
                      Configure →
                    </button>
                  </div>
                  <select
                    disabled={!canManage}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-[34px] px-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-[13px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                    {department && !departments.some((d) => d.name.toLowerCase() === department.toLowerCase()) && (
                      <option value={department}>{department}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Functional Title / Role
                  </label>
                  <input
                    type="text"
                    disabled={!canManage}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Core Systems Architect"
                    className="w-full h-[34px] px-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body"
                  />
                  {isOwner && (
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Customize your functional title displayed across spaces and boards.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Danger Zone: Delete User (Hidden for Owner) */}
            {!isOwner && (
              <div className="bg-[#121214] border border-rose-900/50 rounded-[6px] p-6 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-rose-400">warning</span>
                  <h3 className="font-semibold text-sm text-rose-300 font-headline">
                    Danger Zone: Delete Operator
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Permanently delete <strong className="text-zinc-200">{member.name}</strong> from the workspace. This will immediately terminate all active sessions and permanently delete their login credentials.
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">This action cannot be undone.</span>
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="h-8 px-4 rounded-[6px] bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[15px]">person_remove</span>
                    <span>Delete User</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Effective Permissions Matrix (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5 sticky top-6">
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-orange-400">
                    fact_check
                  </span>
                  <h4 className="font-semibold text-xs text-zinc-100 font-headline uppercase tracking-wider">
                    Live Effective Clearance
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-[4px] font-mono text-[10px] bg-orange-950/40 text-orange-400 border border-orange-500/30 font-semibold">
                  LIVE
                </span>
              </div>

              {/* Active Base Role Badge */}
              <div className="p-3 rounded-[6px] bg-[#18181b] border border-[#27272a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-orange-400">
                    {selectedRole?.icon || 'verified_user'}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-zinc-200">
                      {isOwner ? 'Workspace Owner' : selectedRole?.name || 'Standard Member'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Base Template • {activeOverridesCount} override{activeOverridesCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* ABAC Scope Limitation Callout if Active */}
              {(isTaskScopeConstrained || isDealScopeConstrained) && !isOwner && (
                <div className="p-3 rounded-[6px] bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-400 text-[18px] shrink-0 mt-0.5">
                    lock_clock
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[10.5px] font-bold text-amber-300 uppercase tracking-wide">
                      ABAC Scope Enforced
                    </span>
                    <span className="text-[11px] text-zinc-300 leading-snug">
                      Operator is constrained to{' '}
                      <strong>Assigned Items Only</strong> for{' '}
                      {[
                        isTaskScopeConstrained && 'Tasks',
                        isDealScopeConstrained && 'CRM Deals',
                      ].filter(Boolean).join(' and ')}.
                    </span>
                  </div>
                </div>
              )}

              {/* Live Effective Metrics Breakdown */}
              <div className="flex flex-col divide-y divide-[#27272a] text-xs pt-1">
                {/* 1. Auth */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 text-[11px]">Login &amp; Auth</span>
                    <span className="text-[9.5px] text-zinc-500 font-mono">
                      {canLogin ? 'Sign-in enabled' : 'Account locked'}
                    </span>
                  </div>
                  {canLogin ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold shrink-0">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 font-semibold shrink-0">
                      <span className="material-symbols-outlined text-[14px]">block</span>
                      <span>Disabled</span>
                    </span>
                  )}
                </div>

                {/* 2. Tasks View Scope */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 text-[11px]">Tasks View Scope</span>
                    <span className="text-[9.5px] text-zinc-500 font-mono">Board &amp; list visibility</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] font-bold uppercase ${
                    liveEffective.tasks.view === 'all'
                      ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                      : liveEffective.tasks.view === 'assigned'
                      ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {liveEffective.tasks.view === 'all' ? 'All Tasks' : liveEffective.tasks.view === 'assigned' ? 'Assigned' : 'None'}
                  </span>
                </div>

                {/* 3. Tasks Lifecycle & Mutation */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 text-[11px]">Tasks Status &amp; Update</span>
                    <span className="text-[9.5px] text-zinc-500 font-mono">Status: {liveEffective.tasks.change_status} • Edit: {liveEffective.tasks.update}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-300 font-medium">
                    {liveEffective.tasks.create ? 'Can Create' : 'Read-only'}
                  </span>
                </div>

                {/* 4. CRM Deals View Scope */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 text-[11px]">Deals View Scope</span>
                    <span className="text-[9.5px] text-zinc-500 font-mono">Pipeline visibility</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] font-bold uppercase ${
                    liveEffective.deals.view === 'all'
                      ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                      : liveEffective.deals.view === 'assigned'
                      ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {liveEffective.deals.view === 'all' ? 'All Deals' : liveEffective.deals.view === 'assigned' ? 'Assigned' : 'None'}
                  </span>
                </div>

                {/* 5. Team Admin */}
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-zinc-300 text-[11px]">Team Admin</span>
                    <span className="text-[9.5px] text-zinc-500 font-mono">Manage members &amp; roles</span>
                  </div>
                  {liveEffective.team.manage_members || isOwner ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold shrink-0">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Granted</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 shrink-0">
                      <span className="material-symbols-outlined text-[14px]">block</span>
                      <span>Denied</span>
                    </span>
                  )}
                </div>

                {/* 6. Authorized Pages */}
                <div className="py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 text-[11px]">Authorized Pages</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {liveEffective.allowedPages.length}/8
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {WORKSPACE_PAGES.map((p) => {
                      const hasPage = liveEffective.allowedPages.includes(p.id);
                      return (
                        <span
                          key={p.id}
                          className={`px-1.5 py-0.2 rounded-[3px] text-[9.5px] font-mono ${
                            hasPage
                              ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                              : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                          }`}
                        >
                          {p.id}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Security Policy Information */}
              <div className="pt-3 border-t border-[#27272a] flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="material-symbols-outlined text-[16px]">security</span>
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                    Backend Enforcement
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed">
                  Permissions are enforced across NestJS REST endpoints, JWT authentication payloads, and real-time database queries.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Sticky Action Bar */}
        <div className="p-4 bg-[#121214] border border-[#27272a] rounded-[6px] flex items-center justify-between gap-4 mt-2">
          <button
            type="button"
            onClick={onBack}
            className="h-8 px-4 rounded-[6px] border border-[#27272a] hover:bg-[#18181b] text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Return to Team Roster</span>
          </button>

          <div className="flex items-center gap-2.5">
            {isOwner && (
              <span className="text-[11px] font-mono text-orange-400 hidden sm:inline">
                Workspace Owner root authority is permanent
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving || !canManage}
              className="h-8 px-5 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{isSaving ? 'Saving Changes...' : 'Save Role & Access'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete User Modal inside Edit View */}
      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#121214] rounded-[6px] shadow-2xl border border-rose-900/50 overflow-hidden p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-[6px] bg-rose-950/40 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <span className="material-symbols-outlined text-[22px]">person_remove</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                Delete Operator "{member.name}"?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                This will permanently delete this operator and revoke all login credentials.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="h-8 px-3.5 rounded-[6px] border border-[#27272a] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteUser}
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
 * Segmented scope selector for 'inherit' | 'all' | 'assigned' | 'none'
 */
interface OverrideScopeSelectorProps {
  overrideValue: OverrideScope | undefined;
  roleDefault: PermissionScope;
  onChange: (val: OverrideScope) => void;
  disabled?: boolean;
}

const OverrideScopeSelector: React.FC<OverrideScopeSelectorProps> = ({
  overrideValue = 'inherit',
  roleDefault,
  onChange,
  disabled,
}) => {
  const defaultLabel = roleDefault === 'all' ? 'All' : roleDefault === 'assigned' ? 'Assigned' : 'Denied';

  return (
    <div className="inline-flex items-center bg-[#18181b] border border-[#27272a] rounded-[6px] p-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('inherit')}
        className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          overrideValue === 'inherit'
            ? 'bg-zinc-800 text-zinc-300 shadow-xs'
            : 'text-zinc-500 hover:text-zinc-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        title={`Inherit from assigned role (Current role default: ${defaultLabel})`}
      >
        Inherit ({defaultLabel})
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('all')}
        className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          overrideValue === 'all'
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
        className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          overrideValue === 'assigned'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        title="Restrict control strictly to items assigned to this operator"
      >
        Assigned Only
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('none')}
        className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          overrideValue === 'none'
            ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-xs'
            : 'text-zinc-500 hover:text-zinc-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        Denied
      </button>
    </div>
  );
};

/**
 * Segmented boolean selector for 'inherit' | 'granted' | 'denied'
 */
interface OverrideBooleanSelectorProps {
  overrideValue: OverrideBoolean | undefined;
  roleDefault: boolean;
  onChange: (val: OverrideBoolean) => void;
  disabled?: boolean;
}

const OverrideBooleanSelector: React.FC<OverrideBooleanSelectorProps> = ({
  overrideValue = 'inherit',
  roleDefault,
  onChange,
  disabled,
}) => {
  const defaultLabel = roleDefault ? 'Granted' : 'Denied';

  return (
    <div className="inline-flex items-center bg-[#18181b] border border-[#27272a] rounded-[6px] p-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('inherit')}
        className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          overrideValue === 'inherit'
            ? 'bg-zinc-800 text-zinc-300 shadow-xs'
            : 'text-zinc-500 hover:text-zinc-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        title={`Inherit from assigned role (Current role default: ${defaultLabel})`}
      >
        Inherit ({defaultLabel})
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('granted')}
        className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          overrideValue === 'granted'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        Granted
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('denied')}
        className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-[4px] transition-colors ${
          overrideValue === 'denied'
            ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-xs'
            : 'text-zinc-500 hover:text-zinc-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        Denied
      </button>
    </div>
  );
};
