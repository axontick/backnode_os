import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { TeamMember } from '../types';
import {
  SecurityPolicy,
  WORKSPACE_PAGES,
  WORKSPACE_ACTIONS,
  WorkspacePageKey,
  WorkspaceActionKey,
} from '../utils/security';

export const TeamAccessPage: React.FC = () => {
  const { spaceId, memberId } = useParams<{ spaceId?: string; memberId?: string }>();
  const navigate = useNavigate();

  const { user, effectiveRole, effectiveDepartment } = useAuth();
  const {
    members,
    handleInviteMember,
    handleUpdateMemberAccess,
    handleRemoveMember,
    handleChangePassword,
    handleToggleLogin,
    showToast,
    activeUserSpace,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpace?.id || 'default';

  const canManage = useMemo(() => {
    return SecurityPolicy.canManageTeam({
      id: user?.id || 'usr-operator',
      name: user?.name || 'Operator',
      email: user?.email || '',
      role: effectiveRole,
      department: effectiveDepartment,
    });
  }, [user, effectiveRole, effectiveDepartment]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  // Quick Change Password Modal state
  const [passwordTargetMember, setPasswordTargetMember] = useState<TeamMember | null>(null);
  const [modalNewPassword, setModalNewPassword] = useState('');
  const [modalConfirmPassword, setModalConfirmPassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [isSavingModalPassword, setIsSavingModalPassword] = useState(false);

  // Form state for adding/inviting new member
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Product Engineer');
  const [inviteAccessLevel, setInviteAccessLevel] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviteDept, setInviteDept] = useState<'Engineering' | 'Product' | 'Design' | 'Operations' | 'Sales'>('Engineering');
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

  // Filtering
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        m.role.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q);

      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        (selectedRoleFilter === 'INVITED'
          ? m.status === 'Invited'
          : (m.accessLevel || 'MEMBER').toUpperCase() === selectedRoleFilter);

      const matchesDept =
        selectedDeptFilter === 'ALL' || m.department === selectedDeptFilter;

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [members, searchQuery, selectedRoleFilter, selectedDeptFilter]);

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
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#09090b] text-zinc-100 p-8 select-none">
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
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto custom-scrollbar select-none text-zinc-100">
      {/* 1. Header Toolbar */}
      <div className="px-8 pt-8 pb-6 border-b border-[#27272a] bg-[#0c0a09] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-600/20">
                <span className="material-symbols-outlined text-[18px]">shield_person</span>
              </div>
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight font-headline">
                Team &amp; Access Control
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

            <button
              disabled={!canManage}
              onClick={() => setIsInviteModalOpen(true)}
              className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              title={canManage ? 'Add new operator or invite member' : 'Requires Admin or Owner permissions'}
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
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
        <div className="bg-[#121214] p-3.5 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-500">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, email..."
              className="w-full h-8 pl-9 pr-3 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors font-body"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
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
                  <th className="py-3 px-4 font-semibold">Access Level</th>
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
                                    OWNER
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400 font-mono truncate">
                                {member.email || `${member.name.toLowerCase().replace(/\s+/g, '.')}@backnode.io`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Access Level Badge — Clicking opens separate edit page */}
                        <td className="py-3.5 px-4">
                          {isOwner ? (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-[11px] font-mono font-semibold bg-orange-950/40 text-orange-400 border-orange-500/30 shadow-xs"
                              title="Workspace Owner (Permanent / Immutable)"
                            >
                              <span className="material-symbols-outlined text-[13px]">lock</span>
                              <span>OWNER</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/space/${currentSpaceId}/team/members/${member.id}/edit`)
                              }
                              className={`px-2.5 py-1 rounded-[6px] border text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 transition-all hover:border-orange-500/60 cursor-pointer ${getAccessBadgeStyle(
                                accessLevel
                              )}`}
                              title="Click to open dedicated role edit page"
                            >
                              <span>{accessLevel}</span>
                              <span className="material-symbols-outlined text-[12px] opacity-70">
                                edit
                              </span>
                            </button>
                          )}
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
                              title={isOwner ? 'View Workspace Owner Details' : 'Edit Role & Clearance'}
                            >
                              <span className="material-symbols-outlined text-[14px]">tune</span>
                              <span>{isOwner ? 'View' : 'Edit'}</span>
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
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value as any)}
                    className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales</option>
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
  const isOwner =
    (member.accessLevel || '').toUpperCase() === 'OWNER' ||
    member.role === 'Workspace Owner';

  const [accessLevel, setAccessLevel] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>(
    ((member.accessLevel || 'MEMBER').toUpperCase() as any)
  );
  const [role, setRole] = useState(member.role || 'Member');
  const [department, setDepartment] = useState<'Engineering' | 'Product' | 'Design' | 'Operations' | 'Sales' | 'Executive' | string>(
    member.department || 'Engineering'
  );
  const [canLogin, setCanLogin] = useState<boolean>(
    member.canLogin !== undefined ? member.canLogin : member.status !== 'Disabled'
  );

  const [allowedPages, setAllowedPages] = useState<string[]>(
    member.allowedPages || ['overview', 'tasks', 'crm', 'contacts', 'docs']
  );
  const [allowedActions, setAllowedActions] = useState<string[]>(
    member.allowedActions || (member.accessLevel === 'VIEWER' ? ['read'] : ['read', 'write', 'delete', 'publish'])
  );

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
    if (isOwner) {
      showToast('Workspace Owner role cannot be modified or demoted.');
      return;
    }
    if (!canManage) {
      showToast('You do not have administrative clearance to update team roles.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(member.id, {
        accessLevel,
        role: role.trim() || 'Collaborator',
        department: department as any,
        canLogin,
        allowedPages,
        allowedActions,
        status: canLogin ? 'Active' : 'Disabled',
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto custom-scrollbar select-none text-zinc-100">
      {/* 1. Header Toolbar & Breadcrumbs */}
      <div className="px-8 pt-6 pb-6 border-b border-[#27272a] bg-[#0c0a09] shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
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
              Edit Role: {member.name}
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
                    Edit Operator Access &amp; Permissions
                  </h1>
                  <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-orange-950/40 text-orange-400 border border-orange-500/30">
                    {member.id}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Configure operational security tier, login credentials, ABAC page clearance, and RBAC actions.
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

              {!isOwner && (
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving || !canManage}
                  className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{isSaving ? 'Saving...' : 'Save Role & Access'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Page Body (Bento Grid) */}
      <div className="p-8 max-w-6xl w-full mx-auto flex flex-col gap-6">
        {/* Workspace Owner Permanent Role Callout Banner */}
        {isOwner && (
          <div className="bg-[#121214] border border-orange-500/40 rounded-[6px] p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-[6px] bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <span className="material-symbols-outlined text-2xl">shield_person</span>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                  Workspace Creator &amp; Immutable Owner
                </h3>
                <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-orange-950/60 text-orange-400 border border-orange-500/40 uppercase">
                  ROOT LOCKED
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This operator is the primary creator and owner of <strong className="text-zinc-200">{activeUserSpaceName}</strong>.
                In accordance with enterprise security policies, the Workspace Owner role and login access are permanent and cannot be modified,
                disabled, or demoted. Root ownership guarantees universal clearance across all workspace pages and action capabilities.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Operator Identity, Credentials & Roles (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
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
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-6 flex flex-col gap-4 shadow-sm">
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
                    Passwords are encrypted with bcrypt cost-factor 10 on the backend.
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

            {/* Role & Access Tier Selection Bento */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                    Access Level &amp; Security Clearance Tier
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select the operational security tier governing access boundaries.
                  </p>
                </div>
                {isOwner && (
                  <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold bg-orange-950/40 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    <span>Role Locked</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* 1. ADMIN CARD */}
                <div
                  onClick={() => {
                    if (!isOwner && canManage) {
                      setAccessLevel('ADMIN');
                      setAllowedActions(['read', 'write', 'delete', 'publish', 'admin']);
                      setAllowedPages(['overview', 'tasks', 'crm', 'contacts', 'docs', 'team', 'settings']);
                    }
                  }}
                  className={`p-4 rounded-[6px] border flex flex-col gap-2 transition-all ${
                    isOwner
                      ? 'opacity-40 cursor-not-allowed border-[#27272a] bg-[#18181b]'
                      : accessLevel === 'ADMIN'
                      ? 'border-orange-500 bg-orange-950/20 ring-1 ring-orange-500/40 cursor-pointer'
                      : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-indigo-400">
                        admin_panel_settings
                      </span>
                      <span className="font-semibold text-xs text-zinc-100">Administrator</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] font-mono text-[10px] bg-indigo-950/40 text-indigo-400 border border-indigo-500/30">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Full workspace administration. Can add/delete operators, manage login passwords, configure spaces &amp; lists, and edit CRM pipelines.
                  </p>
                </div>

                {/* 2. MEMBER CARD */}
                <div
                  onClick={() => {
                    if (!isOwner && canManage) {
                      setAccessLevel('MEMBER');
                      setAllowedActions(['read', 'write', 'delete', 'publish']);
                    }
                  }}
                  className={`p-4 rounded-[6px] border flex flex-col gap-2 transition-all ${
                    isOwner
                      ? 'opacity-40 cursor-not-allowed border-[#27272a] bg-[#18181b]'
                      : accessLevel === 'MEMBER'
                      ? 'border-orange-500 bg-orange-950/20 ring-1 ring-orange-500/40 cursor-pointer'
                      : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-emerald-400">
                        engineering
                      </span>
                      <span className="font-semibold text-xs text-zinc-100">Standard Member</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] font-mono text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                      MEMBER
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Standard team contributor. Full access to create deliverables, update CRM deals, add contacts, and author docs.
                  </p>
                </div>

                {/* 3. VIEWER CARD */}
                <div
                  onClick={() => {
                    if (!isOwner && canManage) {
                      setAccessLevel('VIEWER');
                      setAllowedActions(['read']);
                    }
                  }}
                  className={`p-4 rounded-[6px] border flex flex-col gap-2 transition-all ${
                    isOwner
                      ? 'opacity-40 cursor-not-allowed border-[#27272a] bg-[#18181b]'
                      : accessLevel === 'VIEWER'
                      ? 'border-orange-500 bg-orange-950/20 ring-1 ring-orange-500/40 cursor-pointer'
                      : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-zinc-400">
                        visibility
                      </span>
                      <span className="font-semibold text-xs text-zinc-100">Read-Only Viewer</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] font-mono text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-700">
                      VIEWER
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Observational access across boards, calendar views, and CRM pipelines without authoring, publishing, or deletion privileges.
                  </p>
                </div>

                {/* 4. OWNER CARD (Reserved / Locked) */}
                <div
                  className={`p-4 rounded-[6px] border flex flex-col gap-2 transition-all ${
                    isOwner
                      ? 'border-orange-500 bg-orange-950/30 ring-1 ring-orange-500/50'
                      : 'opacity-40 cursor-not-allowed border-[#27272a] bg-[#18181b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-orange-400">
                        shield
                      </span>
                      <span className="font-semibold text-xs text-zinc-100">Workspace Owner</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] font-mono text-[10px] bg-orange-950/50 text-orange-400 border border-orange-500/40 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">lock</span>
                      <span>OWNER</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {isOwner
                      ? 'Permanent root authority for this workspace creator. Role is non-demotable.'
                      : 'Reserved exclusively for workspace creator. Ownership cannot be assigned manually.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Authorized Workspace Pages (ABAC Clearance Matrix) Card */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                    Authorized Workspace Pages (ABAC Clearance)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Explicitly configure which hub views and screens this operator has access to.
                  </p>
                </div>
                {!isOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllowedPages(WORKSPACE_PAGES.map((p) => p.id))}
                      className="text-[11px] font-mono text-orange-400 hover:text-orange-300 cursor-pointer"
                    >
                      Grant All
                    </button>
                    <span className="text-zinc-600">|</span>
                    <button
                      type="button"
                      onClick={() => setAllowedPages(['overview', 'tasks', 'crm', 'contacts', 'docs'])}
                      className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Member Preset
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {WORKSPACE_PAGES.map((page) => {
                  const isChecked = isOwner || allowedPages.includes(page.id);
                  return (
                    <div
                      key={page.id}
                      onClick={() => {
                        if (isOwner || !canManage) return;
                        if (allowedPages.includes(page.id)) {
                          setAllowedPages(allowedPages.filter((p) => p !== page.id));
                        } else {
                          setAllowedPages([...allowedPages, page.id]);
                        }
                      }}
                      className={`p-3 rounded-[6px] border flex items-start gap-3 transition-colors ${
                        isOwner
                          ? 'border-orange-500/30 bg-orange-950/10 cursor-not-allowed'
                          : isChecked
                          ? 'border-orange-500/50 bg-orange-950/20 cursor-pointer'
                          : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isOwner || !canManage}
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

            {/* Action Capabilities (RBAC Matrix) Card */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                    Action Capabilities (RBAC Matrix)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure granular permissions for creating, editing, publishing, and deleting items.
                  </p>
                </div>
                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      if (allowedActions.length === WORKSPACE_ACTIONS.length) {
                        setAllowedActions(['read']);
                      } else {
                        setAllowedActions(WORKSPACE_ACTIONS.map((a) => a.id));
                      }
                    }}
                    className="text-[11px] font-mono text-orange-400 hover:text-orange-300 cursor-pointer"
                  >
                    {allowedActions.length === WORKSPACE_ACTIONS.length ? 'Read-Only' : 'All Actions'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {WORKSPACE_ACTIONS.map((action) => {
                  const isChecked = isOwner || allowedActions.includes(action.id);
                  const isViewerLocked = accessLevel === 'VIEWER' && action.id !== 'read';

                  return (
                    <div
                      key={action.id}
                      onClick={() => {
                        if (isOwner || isViewerLocked || !canManage) return;
                        if (allowedActions.includes(action.id)) {
                          if (action.id === 'read') return; // Cannot uncheck read
                          setAllowedActions(allowedActions.filter((a) => a !== action.id));
                        } else {
                          setAllowedActions([...allowedActions, action.id]);
                        }
                      }}
                      className={`p-3 rounded-[6px] border flex items-start gap-3 transition-colors ${
                        isOwner
                          ? 'border-orange-500/30 bg-orange-950/10 cursor-not-allowed'
                          : isViewerLocked
                          ? 'opacity-40 cursor-not-allowed border-[#27272a] bg-[#18181b]'
                          : isChecked
                          ? 'border-orange-500/50 bg-orange-950/20 cursor-pointer'
                          : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isOwner || isViewerLocked || !canManage || action.id === 'read'}
                        checked={isChecked}
                        onChange={() => {}}
                        className="accent-orange-600 rounded-[3px] w-4 h-4 mt-0.5 cursor-pointer"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-zinc-400">
                            {action.icon}
                          </span>
                          <span className="text-xs font-semibold text-zinc-200">{action.label}</span>
                        </div>
                        <span className="text-[10.5px] text-zinc-400 mt-0.5">{action.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department & Functional Title Card */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="font-semibold text-sm text-zinc-100 font-headline">
                Department &amp; Functional Title
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Assigned Department
                  </label>
                  <select
                    disabled={isOwner || !canManage}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-[34px] px-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-[13px] text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                    Functional Title / Role
                  </label>
                  <input
                    type="text"
                    disabled={isOwner || !canManage}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Core Systems Architect"
                    className="w-full h-[34px] px-3 bg-[#18181b] border border-[#27272a] rounded-[6px] text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body"
                  />
                  {isOwner && (
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Workspace Owner title is permanent.
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
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Effective Permissions Matrix */}
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 flex flex-col gap-3.5 shadow-sm sticky top-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-orange-400">
                  fact_check
                </span>
                <h4 className="font-semibold text-xs text-zinc-100 font-headline uppercase tracking-wider">
                  Live Effective Clearance
                </h4>
              </div>
              <p className="text-[11px] text-zinc-400">
                Summary profile for <span className="text-zinc-200 font-medium">{member.name}</span>:
              </p>

              <div className="flex flex-col divide-y divide-[#27272a] text-xs pt-1">
                {[
                  {
                    title: 'Login & Authentication',
                    granted: canLogin,
                    note: canLogin ? 'Sign-in enabled' : 'Account locked',
                  },
                  {
                    title: 'Workspace Ownership',
                    granted: isOwner,
                    note: 'Owner exclusive',
                  },
                  {
                    title: 'Manage Team & Passwords',
                    granted: isOwner || accessLevel === 'ADMIN' || allowedActions.includes('admin'),
                    note: 'Admin clearance',
                  },
                  {
                    title: 'Task Spaces & Sprint Boards',
                    granted: isOwner || allowedPages.includes('tasks'),
                    note: 'Tasks hub clearance',
                  },
                  {
                    title: 'CRM Deals & Pipelines',
                    granted: isOwner || allowedPages.includes('crm'),
                    note: 'CRM hub clearance',
                  },
                  {
                    title: 'Author RFCs & Docs',
                    granted: isOwner || (allowedPages.includes('docs') && allowedActions.includes('write')),
                    note: 'Docs + Write capability',
                  },
                  {
                    title: 'Delete Resources',
                    granted: isOwner || allowedActions.includes('delete'),
                    note: 'Delete action permission',
                  },
                ].map((perm, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-zinc-300 text-[11px]">{perm.title}</span>
                      <span className="text-[9.5px] text-zinc-500 font-mono">{perm.note}</span>
                    </div>
                    {perm.granted ? (
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
                ))}
              </div>

              {/* Security Policy Information */}
              <div className="pt-3 border-t border-[#27272a] flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <span className="material-symbols-outlined text-[16px]">security</span>
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                    ABAC / RBAC Policy
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed">
                  Modifications made here take effect immediately on backend services and propagate across all active sessions.
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
            {isOwner ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-orange-400">
                  Workspace Owner role is immutable
                </span>
                <button
                  type="button"
                  disabled
                  className="h-8 px-4 rounded-[6px] bg-zinc-800 text-zinc-500 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[15px]">lock</span>
                  <span>Locked</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving || !canManage}
                className="h-8 px-5 rounded-[6px] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{isSaving ? 'Saving Changes...' : 'Save Role & Access'}</span>
              </button>
            )}
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
