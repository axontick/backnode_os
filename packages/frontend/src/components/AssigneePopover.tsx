import React, { useState, useEffect, useRef } from 'react';
import { TeamMember } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

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
  const popoverRef = useRef<HTMLDivElement>(null);
  const { departments } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Close on outside click, blur/focusout, or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (
        popoverRef.current &&
        e.relatedTarget &&
        !popoverRef.current.contains(e.relatedTarget as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    const element = popoverRef.current;
    if (element) {
      element.addEventListener('focusout', handleFocusOut);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      if (element) {
        element.removeEventListener('focusout', handleFocusOut);
      }
    };
  }, [onClose]);

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
          <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 rounded-[6px] font-medium">
            Optimal
          </span>
        );
      case 'Available':
        return (
          <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 rounded-[6px] font-semibold">
            Available
          </span>
        );
      case 'Near capacity':
        return (
          <span className="font-mono text-[9px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.2 rounded-[6px] font-semibold">
            Near capacity
          </span>
        );
      case 'Overloaded':
        return (
          <span className="font-mono text-[9px] text-rose-400 bg-rose-950/40 border border-rose-500/30 px-1.5 py-0.2 rounded-[6px] font-semibold">
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
        return 'bg-zinc-500';
    }
  };

  return (
    <div
      ref={popoverRef}
      tabIndex={-1}
      className="absolute top-[170px] left-[16px] w-[380px] bg-[#121214] border border-[#27272a] shadow-2xl z-50 flex flex-col overflow-hidden rounded-[6px] text-zinc-100 animate-in fade-in zoom-in-95 duration-150 outline-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Pointer Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500"></div>

      {/* Popover Top: Search Input with shortcut hint */}
      <div className="p-3 border-b border-[#27272a] bg-[#121214]">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-orange-400">
            search
          </span>
          <input
            autoFocus
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search operators by name or role..."
            className="w-full pl-8 pr-12 py-1.5 bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 rounded-[6px] font-sans"
          />
          <div className="absolute right-2 flex items-center">
            <kbd className="font-mono text-[10px] text-zinc-400 bg-[#18181b] px-1.5 py-0.5 rounded-[6px] border border-[#27272a]">
              ESC
            </kbd>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto custom-scrollbar pb-1">
          {['All', ...departments.map((d) => d.name)].map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                departmentFilter === dept
                  ? 'bg-orange-600 text-white font-semibold shadow-xs'
                  : 'bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Popover Center: Member Workload & Capacity List */}
      <div className="max-h-[290px] overflow-y-auto p-1.5 flex flex-col gap-1 custom-scrollbar bg-[#121214]">
        {filteredMembers.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">
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
                className={`flex items-center justify-between p-2 rounded-[6px] transition-colors cursor-pointer group ${
                  isSelected
                    ? 'bg-orange-950/40 border border-orange-500/30'
                    : 'hover:bg-[#18181b]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-bold"
                      style={{
                        backgroundColor: member.avatarBg || '#27272a',
                        color: member.avatarColor || '#f4f4f5',
                      }}
                    >
                      {member.initials}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${getStatusDotColor(
                        member.capacityStatus
                      )} ring-2 ring-[#121214]`}
                    ></span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-zinc-100 truncate group-hover:text-orange-400 transition-colors">
                        {member.name}
                      </span>
                      {isSelected && (
                        <span className="font-mono text-[10px] text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1 py-0.2 rounded-[6px] font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 truncate">
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[10px] text-zinc-400">
                      {member.activeTasks} active tasks
                    </span>
                    {getCapacityBadge(member.capacityStatus)}
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-[6px] bg-orange-600 text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-[6px] opacity-0 group-hover:opacity-100 flex items-center justify-center text-zinc-400 transition-opacity">
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
      <div className="p-2.5 bg-[#18181b] border-t border-[#27272a] flex items-center justify-between">
        {actionFeedback ? (
          <div className="w-full text-center text-xs font-mono text-emerald-400 py-0.5">
            {actionFeedback}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.origin + '/join');
                setActionFeedback('Invite link copied!');
                setTimeout(() => onClose(), 800);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-orange-400 hover:bg-[#121214] text-xs font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Invite collaborator</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActionFeedback('Team notified');
                setTimeout(() => onClose(), 800);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-zinc-400 text-[11px] font-mono hover:text-zinc-200 hover:bg-[#121214] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">send</span>
              <span>Reassign &amp; notify</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
