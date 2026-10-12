import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { Department, TeamMember } from '../types';

export const DepartmentSettingsView: React.FC = () => {
  const navigate = useNavigate();
  const {
    departments,
    members,
    handleCreateDepartment,
    handleUpdateDepartment,
    handleDeleteDepartment,
    activeUserSpaceId,
    activeUserSpace,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-members' | 'default'>('all');

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptColor, setDeptColor] = useState('#ea580c');
  const [deptIcon, setDeptIcon] = useState('terminal');
  const [deptHeadId, setDeptHeadId] = useState<string>('');
  const [deptIsDefault, setDeptIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [reassignDeptName, setReassignDeptName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const spacePrefix = `/space/${activeUserSpaceId || activeUserSpace?.id || 'space-main'}`;

  // Curated color swatches adhering to design.md (zero purple)
  const colorOptions = [
    { hex: '#ea580c', label: 'Electric Orange' },
    { hex: '#0284c7', label: 'Sky Blue' },
    { hex: '#10b981', label: 'Emerald Green' },
    { hex: '#f59e0b', label: 'Amber Gold' },
    { hex: '#ec4899', label: 'Rose Pink' },
    { hex: '#6366f1', label: 'Indigo' },
    { hex: '#64748b', label: 'Slate Gray' },
  ];

  // Material symbols icons for departments
  const iconOptions = [
    { id: 'terminal', label: 'Terminal / Code' },
    { id: 'inventory_2', label: 'Product Box' },
    { id: 'palette', label: 'Palette / UI' },
    { id: 'settings_suggest', label: 'Operations' },
    { id: 'trending_up', label: 'Sales / Growth' },
    { id: 'corporate_fare', label: 'Executive' },
    { id: 'shield', label: 'Security' },
    { id: 'headset_mic', label: 'Support' },
    { id: 'campaign', label: 'Marketing' },
    { id: 'gavel', label: 'Legal' },
    { id: 'science', label: 'Research' },
    { id: 'hub', label: 'Platform Hub' },
  ];

  // Calculate member count for each department
  const memberCountsByDept = useMemo(() => {
    const counts: Record<string, TeamMember[]> = {};
    for (const d of departments) {
      counts[d.name.toLowerCase()] = [];
    }
    for (const m of members) {
      const key = (m.department || '').toLowerCase();
      if (!counts[key]) counts[key] = [];
      counts[key].push(m);
    }
    return counts;
  }, [departments, members]);

  // Overall statistics
  const totalAssignedOperators = useMemo(() => {
    return members.filter((m) =>
      departments.some((d) => d.name.toLowerCase() === (m.department || '').toLowerCase())
    ).length;
  }, [members, departments]);

  const defaultDept = useMemo(() => {
    return departments.find((d) => d.isDefault) || departments[0];
  }, [departments]);

  // Filtered department list
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const memberList = memberCountsByDept[d.name.toLowerCase()] || [];
      if (filterType === 'with-members') return memberList.length > 0;
      if (filterType === 'default') return !!d.isDefault;
      return true;
    });
  }, [departments, searchQuery, filterType, memberCountsByDept]);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptDescription('');
    setDeptColor('#ea580c');
    setDeptIcon('domain');
    setDeptHeadId('');
    setDeptIsDefault(departments.length === 0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code || dept.name.slice(0, 4).toUpperCase());
    setDeptDescription(dept.description || '');
    setDeptColor(dept.color || '#ea580c');
    setDeptIcon(dept.icon || 'domain');
    setDeptHeadId(dept.headMemberId || '');
    setDeptIsDefault(!!dept.isDefault);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Department> = {
        name: deptName.trim(),
        code: (deptCode || deptName.slice(0, 4)).trim().toUpperCase(),
        description: deptDescription.trim(),
        color: deptColor,
        icon: deptIcon,
        headMemberId: deptHeadId || undefined,
        isDefault: deptIsDefault,
      };

      if (editingDept) {
        await handleUpdateDepartment(editingDept.id, payload);
      } else {
        await handleCreateDepartment(payload);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (dept: Department) => {
    if (dept.isDefault) return;
    await handleUpdateDepartment(dept.id, { isDefault: true });
  };

  const handleOpenDeleteModal = (dept: Department) => {
    setDeptToDelete(dept);
    const otherDepts = departments.filter((d) => d.id !== dept.id);
    setReassignDeptName(otherDepts[0]?.name || '');
  };

  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      await handleDeleteDepartment(deptToDelete.id, reassignDeptName || undefined);
      setDeptToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] text-zinc-100">
      {/* Top Banner / Header */}
      <div className="border-b border-[#27272a] bg-[#0c0a09] px-8 py-5 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[6px] bg-orange-600/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
              <span className="material-symbols-outlined text-[22px]">domain</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                  SYSTEM CONFIGURATION // DEPARTMENTS DIRECTORY
                </span>
                <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800/80 border border-zinc-700/50 px-1.5 py-0.2 rounded-[6px] font-semibold">
                  RBAC & ABAC BOUNDARIES
                </span>
              </div>
              <h1 className="text-xl font-bold text-zinc-100 font-headline leading-tight mt-0.5">
                Workspace Departments
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Department</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Bento Telemetry Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 bg-[#121214] border border-[#27272a] rounded-[6px] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Active Departments</span>
              <span className="material-symbols-outlined text-[16px] text-orange-400">domain</span>
            </div>
            <div className="mt-2.5">
              <span className="font-mono text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
                {departments.length}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">Configured units</span>
            </div>
          </div>

          <div className="p-4 bg-[#121214] border border-[#27272a] rounded-[6px] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Assigned Operators</span>
              <span className="material-symbols-outlined text-[16px] text-emerald-400">group</span>
            </div>
            <div className="mt-2.5">
              <span className="font-mono text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
                {totalAssignedOperators}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">Across {members.length} team members</span>
            </div>
          </div>

          <div className="p-4 bg-[#121214] border border-[#27272a] rounded-[6px] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Default Invite Domain</span>
              <span className="material-symbols-outlined text-[16px] text-amber-400">star</span>
            </div>
            <div className="mt-2.5">
              <span className="font-mono text-lg md:text-xl font-bold text-orange-400 tracking-tight truncate block">
                {defaultDept?.name || 'Engineering'}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">Assigned to new operators</span>
            </div>
          </div>

          <div className="p-4 bg-[#121214] border border-[#27272a] rounded-[6px] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Security Clearance</span>
              <span className="material-symbols-outlined text-[16px] text-sky-400">verified_user</span>
            </div>
            <div className="mt-2.5">
              <span className="font-mono text-lg md:text-xl font-bold text-zinc-100 tracking-tight">
                ABAC Enforced
              </span>
              <span className="text-[11px] text-emerald-400 block mt-0.5 font-mono">100% Boundary Isolation</span>
            </div>
          </div>
        </section>

        {/* Search, Filter & Quick Actions Bar */}
        <section className="bg-[#121214] border border-[#27272a] rounded-[6px] p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-zinc-500 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search departments by name, code or description..."
              className="w-full h-[34px] pl-9 pr-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-500 text-xs focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-[6px] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-orange-950/50 text-orange-400 font-semibold border border-orange-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({departments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('with-members')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                  filterType === 'with-members'
                    ? 'bg-orange-950/50 text-orange-400 font-semibold border border-orange-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                With Operators
              </button>
              <button
                type="button"
                onClick={() => setFilterType('default')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
                  filterType === 'default'
                    ? 'bg-orange-950/50 text-orange-400 font-semibold border border-orange-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Default
              </button>
            </div>
          </div>
        </section>

        {/* Departments Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-0.5">
            <span className="font-mono text-[10.5px] uppercase font-bold tracking-wider">
              Configured Department Domains ({filteredDepartments.length})
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              Ordered by jurisdiction index
            </span>
          </div>

          {filteredDepartments.length === 0 ? (
            <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-[6px] bg-zinc-800 text-zinc-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">domain_disabled</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-200">No departments match your search</h3>
                <p className="text-xs text-zinc-500">
                  {searchQuery
                    ? `No department domain found matching "${searchQuery}".`
                    : 'No departments currently match the selected filter.'}
                </p>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDepartments.map((dept) => {
                const assignedMembers = memberCountsByDept[dept.name.toLowerCase()] || [];
                const headMember = members.find((m) => m.id === dept.headMemberId);

                return (
                  <div
                    key={dept.id}
                    className="bg-[#121214] border border-[#27272a] rounded-[6px] p-5 shadow-sm hover:border-orange-500/40 transition-all flex flex-col justify-between gap-4 group"
                  >
                    {/* Card Top: Icon, Titles, Badges, and Action Triggers */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className="w-10 h-10 rounded-[6px] flex items-center justify-center text-white font-bold shrink-0 shadow-sm transition-transform group-hover:scale-105"
                          style={{ backgroundColor: dept.color || '#ea580c' }}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {dept.icon || 'domain'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[15px] font-bold text-zinc-100 font-headline truncate">
                              {dept.name}
                            </h3>
                            <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[6px] bg-orange-950/40 border border-orange-500/30 text-orange-400">
                              {dept.code || dept.name.slice(0, 4).toUpperCase()}
                            </span>
                            {dept.isDefault && (
                              <span className="font-mono text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded-[6px] bg-amber-950/40 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">star</span>
                                DEFAULT FOR INVITES
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {dept.description || 'No operational mandate description recorded.'}
                          </p>
                        </div>
                      </div>

                      {/* Top Action Triggers */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        {!dept.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(dept)}
                            title="Set as Default Invite Department"
                            className="p-1.5 rounded-[6px] text-zinc-500 hover:text-amber-400 hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">star_border</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(dept)}
                          title="Edit Department"
                          className="p-1.5 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          type="button"
                          disabled={departments.length <= 1}
                          onClick={() => handleOpenDeleteModal(dept)}
                          title={
                            departments.length <= 1
                              ? 'Cannot delete the only remaining department'
                              : 'Delete Department'
                          }
                          className="p-1.5 rounded-[6px] text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Bottom: Department Lead & Assigned Operators Roster */}
                    <div className="pt-3 border-t border-[#27272a]/60 flex items-center justify-between gap-3 text-xs">
                      {/* Department Lead */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">
                          Lead:
                        </span>
                        {headMember ? (
                          <div className="flex items-center gap-1.5 truncate">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: headMember.avatarBg || '#ea580c' }}
                            >
                              {headMember.initials}
                            </div>
                            <span className="text-zinc-200 text-xs font-medium truncate font-headline">
                              {headMember.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-xs italic">Unassigned</span>
                        )}
                      </div>

                      {/* Assigned Operators Pill & Link to Team Directory */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`${spacePrefix}/team`)}
                          title={`View ${assignedMembers.length} operators in Team Directory`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#18181b] hover:bg-orange-950/30 hover:border-orange-500/30 border border-[#27272a] text-zinc-300 hover:text-orange-400 transition-colors cursor-pointer font-mono text-[11px]"
                        >
                          <span className="font-semibold text-zinc-100">{assignedMembers.length}</span>
                          <span className="text-zinc-400">
                            {assignedMembers.length === 1 ? 'Operator' : 'Operators'}
                          </span>
                          <span className="material-symbols-outlined text-[13px] text-zinc-500 group-hover:text-orange-400 ml-0.5">
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit Department Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-all animate-in fade-in"
          onClick={() => !isSubmitting && setIsModalOpen(false)}
        >
          <div
            className="w-[520px] max-w-full bg-[#121214] rounded-[6px] border border-[#27272a] shadow-2xl p-6 flex flex-col gap-5 text-zinc-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#27272a] pb-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[6px] flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: deptColor }}
                >
                  <span className="material-symbols-outlined text-[22px]">{deptIcon}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                    {editingDept ? 'DOMAIN CONFIGURATION // EDIT' : 'DOMAIN CONFIGURATION // PROVISION'}
                  </span>
                  <h3 className="text-base font-bold text-zinc-100 font-headline leading-tight mt-0.5">
                    {editingDept ? `Edit "${editingDept.name}"` : 'Create New Department'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 p-1 rounded-[6px] hover:bg-[#18181b] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              {/* Department Name and Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-mono text-[10.5px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                    <span>Department Name</span>
                    <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deptName}
                    onChange={(e) => {
                      setDeptName(e.target.value);
                      if (!editingDept && !deptCode) {
                        setDeptCode(e.target.value.slice(0, 4).toUpperCase());
                      }
                    }}
                    placeholder="e.g. Quality Engineering, Marketing"
                    className="w-full h-[34px] px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 text-[13px] font-medium focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[10.5px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
                    <span>Code / Tag</span>
                    <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QE"
                    className="w-full h-[34px] px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 text-[13px] font-mono uppercase focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Department Description */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10.5px] uppercase font-semibold text-zinc-400">
                  Operational Scope & Mandate
                </label>
                <textarea
                  rows={2}
                  value={deptDescription}
                  onChange={(e) => setDeptDescription(e.target.value)}
                  placeholder="Describe the operational mandate, deliverables focus, and access jurisdiction..."
                  className="w-full p-2.5 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 text-[13px] focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Department Lead Selector */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10.5px] uppercase font-semibold text-zinc-400">
                  Assigned Department Lead
                </label>
                <select
                  value={deptHeadId}
                  onChange={(e) => setDeptHeadId(e.target.value)}
                  className="w-full h-[34px] px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-[13px] focus:border-orange-500 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">No Lead Designated (Unassigned)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role || m.accessLevel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Icon Selector Grid */}
              <div className="space-y-1.5 pt-1">
                <label className="font-mono text-[10.5px] uppercase font-semibold text-zinc-400">
                  Domain Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setDeptIcon(ic.id)}
                      className={`h-9 rounded-[6px] border flex items-center justify-center transition-all cursor-pointer ${
                        deptIcon === ic.id
                          ? 'border-orange-500 bg-orange-950/40 text-orange-400 shadow-xs ring-1 ring-orange-500/30'
                          : 'border-[#27272a] bg-[#18181b] text-zinc-400 hover:text-zinc-100 hover:border-zinc-700'
                      }`}
                      title={ic.label}
                    >
                      <span className="material-symbols-outlined text-[18px]">{ic.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Swatches */}
              <div className="space-y-1.5 pt-1">
                <label className="font-mono text-[10.5px] uppercase font-semibold text-zinc-400">
                  Domain Accent Color
                </label>
                <div className="flex items-center gap-2.5">
                  {colorOptions.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setDeptColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-[6px] transition-transform cursor-pointer ${
                        deptColor === c.hex
                          ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#121214] scale-105 shadow-sm'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                  <span className="text-zinc-500 font-mono text-[11px] ml-2">
                    {colorOptions.find((c) => c.hex === deptColor)?.label || deptColor}
                  </span>
                </div>
              </div>

              {/* Make Default Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deptIsDefault}
                    onChange={(e) => setDeptIsDefault(e.target.checked)}
                    className="mt-0.5 rounded-[4px] border-[#27272a] bg-[#18181b] text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-zinc-200 font-medium block">
                      Default Department for New Operators
                    </span>
                    <span className="text-[11px] text-zinc-500 block leading-normal">
                      Automatically select this department when inviting new members or registering accounts.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-[6px] text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-[#27272a] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !deptName.trim()}
                  className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{isSubmitting ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Department Confirmation Modal */}
      {deptToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-all animate-in fade-in"
          onClick={() => !isDeleting && setDeptToDelete(null)}
        >
          <div
            className="w-[480px] max-w-full bg-[#121214] rounded-[6px] border border-rose-900/60 shadow-2xl p-6 flex flex-col gap-4 text-zinc-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-[6px] bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                  DESTRUCTIVE PURGE
                </span>
                <h3 className="text-[16px] font-bold text-zinc-100 font-headline leading-tight">
                  Delete "{deptToDelete.name}"?
                </h3>
              </div>
            </div>

            <div className="p-3 rounded-[6px] bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs leading-relaxed space-y-1.5">
              <p>
                This will permanently delete the <strong>{deptToDelete.name}</strong> department domain from this workspace.
              </p>
              {(() => {
                const assigned = memberCountsByDept[deptToDelete.name.toLowerCase()] || [];
                if (assigned.length > 0) {
                  return (
                    <p className="text-[11px] text-zinc-300 font-mono">
                      There are currently <strong>{assigned.length} operator(s)</strong> assigned to this department.
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            {/* Reassign members dropdown if members exist */}
            {(() => {
              const assigned = memberCountsByDept[deptToDelete.name.toLowerCase()] || [];
              const otherDepts = departments.filter((d) => d.id !== deptToDelete.id);
              if (assigned.length > 0 && otherDepts.length > 0) {
                return (
                  <div className="space-y-1.5 text-xs">
                    <label className="font-mono text-[10.5px] uppercase font-semibold text-zinc-400 block">
                      Reassign existing {assigned.length} operator(s) to:
                    </label>
                    <select
                      value={reassignDeptName}
                      onChange={(e) => setReassignDeptName(e.target.value)}
                      className="w-full h-[34px] px-3 rounded-[6px] border border-[#27272a] bg-[#18181b] text-zinc-100 text-xs focus:border-orange-500 focus:outline-none transition-colors cursor-pointer"
                    >
                      {otherDepts.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-[6px] text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-[#27272a] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-[6px] bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>{isDeleting ? 'Deleting...' : 'Delete Department'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
