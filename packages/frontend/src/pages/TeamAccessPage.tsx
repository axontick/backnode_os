import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TeamMember } from '../types';

export const TeamAccessPage: React.FC = () => {
  const {
    members,
    handleInviteMember,
    handleUpdateMemberAccess,
    handleRemoveMember,
    showToast,
    activeUserSpace,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  // Form state for inviting new member
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Product Engineer');
  const [inviteAccessLevel, setInviteAccessLevel] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviteDept, setInviteDept] = useState<'Engineering' | 'Product' | 'Design' | 'Operations' | 'Sales'>('Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active role editing popover
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null);

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
        (selectedRoleFilter === 'INVITED' ? m.status === 'Invited' : (m.accessLevel || 'MEMBER').toUpperCase() === selectedRoleFilter);

      const matchesDept =
        selectedDeptFilter === 'ALL' || m.department === selectedDeptFilter;

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [members, searchQuery, selectedRoleFilter, selectedDeptFilter]);

  // Summary Metrics
  const totalCount = members.length;
  const adminCount = members.filter((m) => {
    const lvl = (m.accessLevel || '').toUpperCase();
    return lvl === 'OWNER' || lvl === 'ADMIN' || m.role.toLowerCase().includes('lead') || m.role.toLowerCase().includes('architect');
  }).length;
  const activeCount = members.filter((m) => m.status !== 'Invited').length;
  const invitedCount = members.filter((m) => m.status === 'Invited').length;

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join?space=${encodeURIComponent(activeUserSpace?.slug || 'workspace')}`;
    navigator.clipboard?.writeText(inviteUrl);
    showToast('Workspace invite link copied to clipboard!');
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Please provide both name and email');
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
      });
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Product Engineer');
      setInviteAccessLevel('MEMBER');
      setIsInviteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newAccess: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER') => {
    await handleUpdateMemberAccess(memberId, {
      accessLevel: newAccess,
    });
    setOpenRoleDropdownId(null);
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
              Manage operators, grant role-based permissions, and invite collaborators into this workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyInviteLink}
              className="h-8 px-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Copy shareable workspace join link"
            >
              <span className="material-symbols-outlined text-[16px] text-orange-400">link</span>
              <span>Copy Invite Link</span>
            </button>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Invite Team Member</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Ribbon (Bento KPI Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Total Roster
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">{totalCount}</span>
              <span className="text-[11px] text-zinc-400">operators</span>
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
              Active Operators
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-emerald-400 font-mono">{activeCount}</span>
              <span className="text-[11px] text-zinc-400">authorized</span>
            </div>
          </div>

          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Pending Invites
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-amber-400 font-mono">{invitedCount}</span>
              <span className="text-[11px] text-zinc-400">awaiting sign-on</span>
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
              placeholder="Search member by name, email, or title..."
              className="w-full h-[34px] bg-[#18181b] border border-[#27272a] rounded-[6px] pl-9 pr-4 text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Role Filter Tabs */}
            <div className="flex items-center p-0.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-xs font-medium shrink-0">
              {[
                { key: 'ALL', label: 'All Roles' },
                { key: 'OWNER', label: 'Owners' },
                { key: 'ADMIN', label: 'Admins' },
                { key: 'MEMBER', label: 'Members' },
                { key: 'VIEWER', label: 'Viewers' },
                { key: 'INVITED', label: 'Invited' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedRoleFilter(tab.key)}
                  className={`px-3 py-1 rounded-[6px] transition-all text-xs font-medium ${
                    selectedRoleFilter === tab.key
                      ? 'bg-orange-600 text-white font-semibold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="h-[34px] bg-[#18181b] border border-[#27272a] rounded-[6px] px-3 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 font-medium transition-colors"
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
          <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-100">Workspace Members</span>
              <span className="font-mono text-xs text-zinc-400">({filteredMembers.length})</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Click on any role badge to modify member access
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/70 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-6">Member / Operator</th>
                  <th className="py-3 px-4">Role &amp; Access Level</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Workload</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-zinc-600">
                          group_off
                        </span>
                        <p className="font-medium text-xs text-zinc-400">No team members match your filters</p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedRoleFilter('ALL');
                            setSelectedDeptFilter('ALL');
                          }}
                          className="text-xs text-orange-400 font-semibold hover:underline"
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
                    const isDropdownOpen = openRoleDropdownId === member.id;

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
                              style={{ backgroundColor: member.avatarBg && member.avatarBg !== '#9900c2' ? member.avatarBg : '#27272a' }}
                            >
                              {member.initials || member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-zinc-100 text-xs truncate">
                                {member.name}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-mono truncate">
                                {member.email || `${member.name.toLowerCase().replace(/\s+/g, '.')}@backnode.io`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Access Level Selector */}
                        <td className="py-3.5 px-4 relative">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenRoleDropdownId(isDropdownOpen ? null : member.id)
                              }
                              className={`px-2.5 py-1 rounded-[6px] border text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all hover:border-orange-500/50 ${getAccessBadgeStyle(
                                accessLevel
                              )}`}
                              title="Click to change access level"
                            >
                              <span>{accessLevel}</span>
                              <span className="material-symbols-outlined text-[13px] opacity-70">
                                arrow_drop_down
                              </span>
                            </button>

                            {/* Role Dropdown Menu */}
                            {isDropdownOpen && (
                              <div
                                className="absolute left-0 top-full mt-1.5 w-60 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-2 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="px-2 py-1 text-[10px] font-mono uppercase text-zinc-400 font-bold">
                                  Assign Access Role
                                </span>
                                {[
                                  {
                                    lvl: 'OWNER',
                                    title: 'Owner',
                                    desc: 'Full workspace authority & billing',
                                  },
                                  {
                                    lvl: 'ADMIN',
                                    title: 'Admin',
                                    desc: 'Member management & spaces config',
                                  },
                                  {
                                    lvl: 'MEMBER',
                                    title: 'Member',
                                    desc: 'Create & edit tasks, CRM deals',
                                  },
                                  {
                                    lvl: 'VIEWER',
                                    title: 'Viewer',
                                    desc: 'Read-only visibility across boards',
                                  },
                                ].map((r) => (
                                  <button
                                    key={r.lvl}
                                    type="button"
                                    onClick={() => handleRoleChange(member.id, r.lvl as any)}
                                    className={`flex flex-col text-left p-2 rounded-[6px] transition-colors ${
                                      accessLevel === r.lvl
                                        ? 'bg-orange-950/40 border border-orange-500/30'
                                        : 'hover:bg-[#18181b] border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className={`font-semibold text-xs ${accessLevel === r.lvl ? 'text-orange-400' : 'text-zinc-200'}`}>
                                        {r.title}
                                      </span>
                                      {accessLevel === r.lvl && (
                                        <span className="material-symbols-outlined text-[14px] text-orange-400">
                                          check
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-zinc-400">{r.desc}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                          {member.department}
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

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {member.status === 'Invited' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[10.5px] font-mono bg-amber-950/40 text-amber-400 border border-amber-500/30 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>Invited</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[10.5px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {member.status === 'Invited' && (
                              <button
                                onClick={() => {
                                  showToast(`Invite resent to ${member.email || member.name}`);
                                }}
                                className="px-2 py-1 rounded-[6px] border border-[#27272a] hover:bg-zinc-800 text-orange-400 text-[11px] font-medium transition-colors"
                                title="Resend invitation email"
                              >
                                Resend
                              </button>
                            )}
                            <button
                              onClick={() => setMemberToRemove(member)}
                              className="w-7 h-7 rounded-[6px] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                              title="Revoke access & remove operator"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                person_remove
                              </span>
                            </button>
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
                    Invite, Re-assign &amp; Revoke Member Access
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
                <tr>
                  <td className="py-2.5 px-4 font-medium text-zinc-200">
                    Read-Only Kanban Boards, Calendar &amp; Reports
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Invite Team Member Modal */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#121214] rounded-[6px] shadow-2xl border border-[#27272a] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[#27272a] flex items-center justify-between bg-[#18181b]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-orange-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 font-headline">Invite Team Member</h3>
                  <p className="text-[11px] text-zinc-400">
                    Add an operator to {activeUserSpace?.name || 'this workspace'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 flex flex-col gap-4">
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
                    className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    placeholder="e.g. Staff Backend Engineer"
                    className="w-full h-[34px] px-3 text-[13px] bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value as any)}
                    className="w-full h-[34px] px-3 text-xs bg-[#18181b] border border-[#27272a] rounded-[6px] text-zinc-200 focus:outline-none focus:border-orange-500 font-medium transition-colors"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
              </div>

              {/* Role Selection Cards */}
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  Select Access Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      lvl: 'ADMIN',
                      title: 'Admin',
                      desc: 'Full workspace & member config',
                    },
                    {
                      lvl: 'MEMBER',
                      title: 'Member (Standard)',
                      desc: 'Create & edit tasks, triage CRM',
                    },
                    {
                      lvl: 'VIEWER',
                      title: 'Viewer',
                      desc: 'Read-only access to deliverables',
                    },
                    {
                      lvl: 'OWNER',
                      title: 'Co-Owner',
                      desc: 'Full administrative rights',
                    },
                  ].map((r) => (
                    <div
                      key={r.lvl}
                      onClick={() => setInviteAccessLevel(r.lvl as any)}
                      className={`p-2.5 rounded-[6px] border cursor-pointer transition-all ${
                        inviteAccessLevel === r.lvl
                          ? 'border-orange-500 bg-orange-950/40 ring-1 ring-orange-500/30'
                          : 'border-[#27272a] bg-[#18181b] hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-xs ${inviteAccessLevel === r.lvl ? 'text-orange-400' : 'text-zinc-200'}`}>
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

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="h-8 px-4 rounded-[6px] border border-[#27272a] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-8 px-5 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{isSubmitting ? 'Sending...' : 'Send Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Revoke / Remove Confirmation Modal */}
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
                Revoke Operator Access?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Are you sure you want to remove <strong className="text-zinc-200">{memberToRemove.name}</strong> from {activeUserSpace?.name || 'this workspace'}? They will immediately lose access to task boards and pipelines.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                onClick={() => setMemberToRemove(null)}
                className="h-8 px-3.5 rounded-[6px] border border-[#27272a] text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Keep Member
              </button>
              <button
                onClick={confirmRemove}
                className="h-8 px-3.5 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
