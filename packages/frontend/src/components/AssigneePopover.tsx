import React, { useState } from 'react';
import { TeamMember } from '../types';

interface AssigneePopoverProps {
  currentAssigneeId: string;
  members: TeamMember[];
  onSelectMember: (member: TeamMember) => void;
  onClose: () => void;
}

export const AssigneePopover: React.FC<AssigneePopoverProps> = ({
  currentAssigneeId,
  members,
  onSelectMember,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'All' | 'Engineering' | 'Product' | 'Design'>('All');

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'All' || member.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const getCapacityBadge = (status: TeamMember['capacityStatus']) => {
    switch (status) {
      case 'Optimal':
        return (
          <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
            Optimal
          </span>
        );
      case 'Available':
        return (
          <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
            Available
          </span>
        );
      case 'Near capacity':
        return (
          <span className="font-mono text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
            Near capacity
          </span>
        );
      case 'Overloaded':
        return (
          <span className="font-mono text-[9px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-semibold">
            Overloaded
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusDotColor = (status: TeamMember['capacityStatus']) => {
    switch (status) {
      case 'Optimal':
      case 'Available':
        return 'bg-emerald-500';
      case 'Near capacity':
        return 'bg-amber-500';
      case 'Overloaded':
        return 'bg-rose-500';
      default:
        return 'bg-zinc-400';
    }
  };

  return (
    <div
      className="absolute top-[170px] left-[16px] w-[380px] bg-white border border-[#d4c0d5]/60 shadow-2xl z-50 flex flex-col overflow-hidden rounded-lg animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Pointer Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#9900c2] via-[#b731e0] to-[#f1afff]"></div>

      {/* Popover Top: Search Input with shortcut hint */}
      <div className="p-3 border-b border-[#d4c0d5]/30 bg-white">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-[#9900c2]">
            search
          </span>
          <input
            autoFocus
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search operators by name or role..."
            className="w-full pl-8 pr-12 py-1.5 bg-[#f4f2fd]/60 border border-[#9900c2]/30 text-xs text-[#1a1b22] placeholder:text-[#837284] focus:outline-none focus:border-[#9900c2] focus:ring-2 focus:ring-[#9900c2]/20 transition-all rounded font-sans"
          />
          <div className="absolute right-2 flex items-center">
            <kbd className="font-mono text-[10px] text-[#837284] bg-white px-1.5 py-0.5 rounded border border-[#d4c0d5]/50">
              ESC
            </kbd>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {(['All', 'Engineering', 'Product', 'Design'] as const).map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                departmentFilter === dept
                  ? 'bg-[#9900c2] text-white font-semibold'
                  : 'bg-[#eeedf7] hover:bg-[#e8e7f1] text-[#504252]'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Popover Center: Member Workload & Capacity List */}
      <div className="max-h-[290px] overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar bg-white">
        {filteredMembers.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#837284]">
            No operators match &ldquo;{searchTerm}&rdquo;
          </div>
        ) : (
          filteredMembers.map((member) => {
            const isSelected = member.id === currentAssigneeId;
            return (
              <div
                key={member.id}
                onClick={() => {
                  onSelectMember(member);
                  onClose();
                }}
                className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer group ${
                  isSelected
                    ? 'bg-[#f4f2fd] border border-[#9900c2]/30'
                    : 'hover:bg-[#eeedf7]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-bold"
                      style={{
                        backgroundColor: member.avatarBg || '#e4e1e6',
                        color: member.avatarColor || '#1b1b1e',
                      }}
                    >
                      {member.initials}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${getStatusDotColor(
                        member.capacityStatus
                      )} ring-2 ring-white`}
                    ></span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-[#1a1b22] truncate group-hover:text-[#9900c2] transition-colors">
                        {member.name}
                      </span>
                      {isSelected && (
                        <span className="font-mono text-[10px] text-[#9900c2] bg-[#9900c2]/10 px-1 py-0.2 rounded font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#837284] truncate">
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[10px] text-[#837284]">
                      {member.activeTasks} active tasks
                    </span>
                    {getCapacityBadge(member.capacityStatus)}
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded bg-[#9900c2] text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#837284] transition-opacity">
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Popover Bottom Action Toolbar */}
      <div className="p-2.5 bg-[#f4f2fd]/60 border-t border-[#d4c0d5]/30 flex items-center justify-between">
        <button
          onClick={() => {
            alert('Collaborator invite link generated and copied to clipboard.');
            onClose();
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[#9900c2] hover:bg-[#eeedf7] text-xs font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>Invite collaborator</span>
        </button>
        <button
          onClick={() => {
            alert('Reassignment telemetry notifications dispatched to sync nodes.');
            onClose();
          }}
          className="flex items-center gap-1 px-2 py-1 rounded text-[#504252] text-[11px] font-mono hover:text-[#1a1b22] hover:bg-[#eeedf7] transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">send</span>
          <span>Reassign &amp; notify</span>
        </button>
      </div>
    </div>
  );
};
