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
        return 'bg-[#fbd7ff] text-[#670085] border-[#9900c2]/30';
      case 'ADMIN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'VIEWER':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'MEMBER':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafc] overflow-y-auto custom-scrollbar select-none">
      {/* 1. Header Toolbar */}
      <div className="px-8 pt-8 pb-6 border-b border-[#d4c0d5]/30 bg-white shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9900c2] to-[#670085] flex items-center justify-center text-white shadow-sm shadow-[#9900c2]/20">
                <span className="material-symbols-outlined text-[18px]">shield_person</span>
              </div>
              <h1 className="text-xl font-bold text-[#1a1b22] tracking-tight">
                Team &amp; Access Control
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#f4f2fd] text-[#9900c2] border border-[#d4c0d5]/40">
                {activeUserSpace?.name || 'Current Space'}
              </span>
            </div>
            <p className="text-xs text-[#504252] pl-10.5">
              Manage operators, grant role-based permissions, and invite collaborators into this workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyInviteLink}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#d4c0d5]/50 hover:bg-[#f4f2fd] text-[#1a1b22] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Copy shareable workspace join link"
            >
              <span className="material-symbols-outlined text-[16px] text-[#9900c2]">link</span>
              <span>Copy Invite Link</span>
            </button>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Invite Team Member</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3.5 rounded-xl bg-[#fafafc] border border-[#d4c0d5]/30 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-[#837284] uppercase tracking-wider">
              Total Roster
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1a1b22] font-mono">{totalCount}</span>
              <span className="text-[11px] text-[#504252]">operators</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#fafafc] border border-[#d4c0d5]/30 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-[#837284] uppercase tracking-wider">
              Owners &amp; Admins
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#9900c2] font-mono">{adminCount}</span>
              <span className="text-[11px] text-[#504252]">with elevated roles</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#fafafc] border border-[#d4c0d5]/30 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-[#837284] uppercase tracking-wider">
              Active Operators
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 font-mono">{activeCount}</span>
              <span className="text-[11px] text-[#504252]">authorized</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#fafafc] border border-[#d4c0d5]/30 flex flex-col gap-1">
            <span className="text-[11px] font-mono text-[#837284] uppercase tracking-wider">
              Pending Invites
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 font-mono">{invitedCount}</span>
              <span className="text-[11px] text-[#504252]">awaiting sign-on</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Body Content */}
      <div className="p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto">
        {/* Search & Filters Filter Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#d4c0d5]/30 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#837284]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name, email, or title..."
              className="w-full bg-[#f4f2fd]/50 border border-[#d4c0d5]/40 rounded-xl pl-9 pr-4 py-2 text-xs text-[#1a1b22] placeholder-[#837284] focus:outline-none focus:border-[#9900c2]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Role Filter Tabs */}
            <div className="flex items-center p-0.5 rounded-xl bg-[#f4f2fd]/70 border border-[#d4c0d5]/40 text-xs font-medium shrink-0">
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
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedRoleFilter === tab.key
                      ? 'bg-white text-[#9900c2] font-semibold shadow-xs'
                      : 'text-[#504252] hover:text-[#1a1b22]'
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
              className="bg-white border border-[#d4c0d5]/40 rounded-xl px-3 py-1.5 text-xs text-[#1a1b22] focus:outline-none focus:border-[#9900c2] font-medium"
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
        <div className="bg-white rounded-2xl border border-[#d4c0d5]/30 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d4c0d5]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#1a1b22]">Workspace Members</span>
              <span className="font-mono text-xs text-[#837284]">({filteredMembers.length})</span>
            </div>
            <span className="text-[11px] font-mono text-[#837284]">
              Click on any role badge to modify member access
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#d4c0d5]/25 bg-[#fafafc]/70 text-[#837284] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-6">Member / Operator</th>
                  <th className="py-3 px-4">Role &amp; Access Level</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Workload</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4c0d5]/20">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#837284]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-[#837284]/50">
                          group_off
                        </span>
                        <p className="font-medium text-xs">No team members match your filters</p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedRoleFilter('ALL');
                            setSelectedDeptFilter('ALL');
                          }}
                          className="text-xs text-[#9900c2] font-semibold hover:underline"
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
                        className="hover:bg-[#f4f2fd]/30 transition-colors group"
                      >
                        {/* Member / Operator */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs text-white shrink-0"
                              style={{ backgroundColor: member.avatarBg || '#9900c2' }}
                            >
                              {member.initials || member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-[#1a1b22] text-xs truncate">
                                {member.name}
                              </span>
                              <span className="text-[11px] text-[#71677c] font-mono truncate">
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
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all hover:scale-105 ${getAccessBadgeStyle(
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
                                className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-[#d4c0d5]/70 rounded-2xl shadow-2xl z-50 p-2 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="px-2 py-1 text-[10px] font-mono uppercase text-[#837284] font-bold">
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
                                    className={`flex flex-col text-left p-2 rounded-xl transition-colors ${
                                      accessLevel === r.lvl
                                        ? 'bg-[#f4f2fd] border border-[#9900c2]/30'
                                        : 'hover:bg-[#fafafc] border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-xs text-[#1a1b22]">
                                        {r.title}
                                      </span>
                                      {accessLevel === r.lvl && (
                                        <span className="material-symbols-outlined text-[14px] text-[#9900c2]">
                                          check
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[#837284]">{r.desc}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#504252]">
                          {member.department}
                        </td>

                        {/* Workload */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#1a1b22]">
                              {member.activeTasks}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                member.capacityStatus === 'Overloaded'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : member.capacityStatus === 'Near capacity'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {member.capacityStatus || 'Available'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {member.status === 'Invited' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Invited</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
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
                                className="px-2 py-1 rounded-lg border border-[#d4c0d5]/40 hover:bg-[#f4f2fd] text-[#9900c2] text-[11px] font-medium transition-colors"
                                title="Resend invitation email"
                              >
                                Resend
                              </button>
                            )}
                            <button
                              onClick={() => setMemberToRemove(member)}
                              className="w-7 h-7 rounded-lg hover:bg-rose-50 text-[#837284] hover:text-rose-600 flex items-center justify-center transition-colors"
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
        <div className="bg-white rounded-2xl border border-[#d4c0d5]/30 p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#9900c2]">
              admin_panel_settings
            </span>
            <h2 className="font-semibold text-sm text-[#1a1b22]">
              Workspace Role Permissions Matrix
            </h2>
          </div>
          <p className="text-xs text-[#504252]">
            Backnode OS implements strict multi-tenant role enforcement. The capabilities below detail the authorization level granted to each operator role.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#d4c0d5]/30 text-[#837284] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Permission Area</th>
                  <th className="py-2.5 px-4 text-center">Owner</th>
                  <th className="py-2.5 px-4 text-center">Admin</th>
                  <th className="py-2.5 px-4 text-center">Member</th>
                  <th className="py-2.5 px-4 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4c0d5]/20 text-[11px]">
                <tr>
                  <td className="py-2.5 px-4 font-medium text-[#1a1b22]">
                    Workspace Ownership &amp; Billing Control
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-zinc-300">—</td>
                  <td className="py-2.5 px-4 text-center text-zinc-300">—</td>
                  <td className="py-2.5 px-4 text-center text-zinc-300">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-[#1a1b22]">
                    Invite, Re-assign &amp; Revoke Member Access
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-zinc-300">—</td>
                  <td className="py-2.5 px-4 text-center text-zinc-300">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-[#1a1b22]">
                    Configure Task Spaces, Folders &amp; CRM Stages
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-zinc-300">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-[#1a1b22]">
                    Create, Triage &amp; Update Tasks &amp; CRM Deals
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-zinc-300">—</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-[#1a1b22]">
                    Read-Only Kanban Boards, Calendar &amp; Reports
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                  <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Invite Team Member Modal */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#d4c0d5]/60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[#d4c0d5]/30 flex items-center justify-between bg-[#fafafc]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#9900c2] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#1a1b22]">Invite Team Member</h3>
                  <p className="text-[11px] text-[#71677c]">
                    Add an operator to {activeUserSpace?.name || 'this workspace'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#eeedf7] text-[#837284]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-[#837284] uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#d4c0d5]/60 rounded-xl focus:outline-none focus:border-[#9900c2]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#837284] uppercase tracking-wider mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="jordan@company.com"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#d4c0d5]/60 rounded-xl focus:outline-none focus:border-[#9900c2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-[#837284] uppercase tracking-wider mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    placeholder="e.g. Staff Backend Engineer"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#d4c0d5]/60 rounded-xl focus:outline-none focus:border-[#9900c2]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#837284] uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#d4c0d5]/60 rounded-xl focus:outline-none focus:border-[#9900c2]"
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
                <label className="block text-[11px] font-mono text-[#837284] uppercase tracking-wider mb-1.5">
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
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        inviteAccessLevel === r.lvl
                          ? 'border-[#9900c2] bg-[#f4f2fd]/60 ring-1 ring-[#9900c2]/30'
                          : 'border-[#d4c0d5]/40 hover:bg-[#fafafc]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#1a1b22]">
                          {r.title}
                        </span>
                        {inviteAccessLevel === r.lvl && (
                          <span className="w-2 h-2 rounded-full bg-[#9900c2]"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#837284] mt-0.5">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#d4c0d5]/30">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#d4c0d5]/50 text-xs font-semibold text-[#504252] hover:bg-[#fafafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setMemberToRemove(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">person_remove</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#1a1b22]">
                Revoke Operator Access?
              </h3>
              <p className="text-xs text-[#504252] mt-1">
                Are you sure you want to remove <strong>{memberToRemove.name}</strong> from {activeUserSpace?.name || 'this workspace'}? They will immediately lose access to task boards and pipelines.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#d4c0d5]/50 text-xs font-semibold text-[#504252] hover:bg-[#fafafc]"
              >
                Keep Member
              </button>
              <button
                onClick={confirmRemove}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
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
