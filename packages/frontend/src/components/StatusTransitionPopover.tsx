import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TaskStatus } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

interface StatusTransitionPopoverProps {
  currentStatus: TaskStatus;
  timeInStage: string;
  onSelectStatus: (status: TaskStatus) => void;
  onClose: () => void;
}

export const StatusTransitionPopover: React.FC<StatusTransitionPopoverProps> = ({
  currentStatus,
  timeInStage,
  onSelectStatus,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { statuses } = useWorkspace();
  const [selectedTarget, setSelectedTarget] = useState<TaskStatus>(currentStatus);
  const [gate1, setGate1] = useState(true); // acceptance criteria validated
  const [gate2, setGate2] = useState(false); // peer code review approved
  const [gate3, setGate3] = useState(true); // automated tests passing
  const [showRules, setShowRules] = useState(false);

  // Close when clicking outside or pressing Escape or focus lost
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

  const stages = useMemo(() => {
    if (statuses && statuses.length > 0) {
      return [...statuses]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((st, idx) => ({
          name: st.name as TaskStatus,
          label: st.name,
          subtitle: st.description || `Stage ${idx + 1} workflow state`,
          badge: st.isClosed ? 'Terminal' : st.isDefault ? 'Default' : `Stage ${idx + 1}`,
          color: st.color || '#ea580c',
        }));
    }
    return [
      {
        name: 'Backlog' as TaskStatus,
        label: 'Backlog',
        subtitle: 'Tasks waiting for sprint triage',
        badge: 'Stage 1',
        color: '#71717a',
      },
      {
        name: 'In Progress' as TaskStatus,
        label: 'In Progress',
        subtitle: 'Active implementation in branch',
        badge: 'Active Now',
        color: '#ea580c',
      },
      {
        name: 'In Review' as TaskStatus,
        label: 'In Review',
        subtitle: 'Requires 1 technical review sign-off',
        badge: 'Target',
        color: '#f59e0b',
      },
      {
        name: 'Blocked' as TaskStatus,
        label: 'Blocked',
        subtitle: 'Dependencies or external blocker',
        badge: 'Gate',
        color: '#ef4444',
      },
      {
        name: 'Done' as TaskStatus,
        label: 'Done / Deployed',
        subtitle: 'Closed and delivered',
        badge: 'Terminal',
        color: '#10b981',
      },
    ];
  }, [statuses]);

  const readyGatesCount = (gate1 ? 1 : 0) + (gate2 ? 1 : 0) + (gate3 ? 1 : 0);

  const handleApply = (statusToApply?: TaskStatus) => {
    onSelectStatus(statusToApply || selectedTarget);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      tabIndex={-1}
      className="absolute top-[170px] left-[16px] w-[370px] bg-[#121214] border border-[#27272a] shadow-2xl z-50 overflow-hidden rounded-[6px] text-zinc-100 animate-in fade-in zoom-in-95 duration-150 outline-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Header: Current Active State & Stage Timer */}
      <div className="p-3 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-500/20"></span>
          <div>
            <div className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">
              Active Lifecycle State
            </div>
            <div className="text-sm font-bold text-orange-400 leading-tight font-headline">
              {currentStatus}
            </div>
          </div>
        </div>

        {/* Orange highlight pill with stage timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-950/40 text-orange-400 border border-orange-500/30 font-mono text-[10px] font-semibold rounded-[6px]">
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            timer
          </span>
          <span>{timeInStage}</span>
        </div>
      </div>

      {/* Workflow Stage Pipeline Options */}
      <div className="p-2 space-y-1 bg-[#121214]">
        <div className="px-2 py-1 font-mono text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
          Select Workflow Target
        </div>

        {stages.map((stage) => {
          const isCurrent = stage.name === currentStatus;
          const isSelectedTarget = stage.name === selectedTarget;

          return (
            <div
              key={stage.name}
              onClick={() => {
                setSelectedTarget(stage.name);
                handleApply(stage.name);
              }}
              className={`flex items-start gap-2.5 p-2 rounded-[6px] transition-colors cursor-pointer group ${
                isSelectedTarget
                  ? 'bg-orange-950/40 border border-orange-500/40'
                  : 'hover:bg-[#18181b]'
              }`}
            >
              <div className="mt-1">
                <span
                  className="w-3 h-3 rounded-full block ring-2 ring-white/10"
                  style={{ backgroundColor: stage.color }}
                ></span>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isSelectedTarget
                        ? 'text-orange-400'
                        : 'text-zinc-100 group-hover:text-orange-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[6px] font-medium ${
                      isCurrent
                        ? 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
                        : isSelectedTarget
                        ? 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
                        : 'text-zinc-400 bg-[#18181b] border border-[#27272a]'
                    }`}
                  >
                    {isCurrent ? 'Active Now' : stage.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">{stage.subtitle}</p>
              </div>

              {isSelectedTarget && (
                <span className="material-symbols-outlined text-orange-400 text-[16px] mt-0.5">
                  check
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Transition Gates Checklist Box */}
      <div className="m-2 p-2.5 bg-[#18181b] border border-[#27272a] space-y-2 rounded-[6px]">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-orange-400">verified</span>
            Transition Gates Checklist
          </span>
          <span className="font-mono text-[10px] bg-orange-950/40 text-orange-400 border border-orange-500/20 px-1.5 py-0.2 rounded-[6px] font-medium">
            {readyGatesCount} of 3 Ready
          </span>
        </div>

        {/* Gate Items */}
        <div className="space-y-1.5 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gate1}
              onChange={(e) => setGate1(e.target.checked)}
              className="w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
            />
            <span
              className={`text-xs ${
                gate1 ? 'text-zinc-500 line-through' : 'text-zinc-200'
              }`}
            >
              All 5 acceptance criteria validated
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gate2}
              onChange={(e) => setGate2(e.target.checked)}
              className="w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
            />
            <span className="text-xs text-zinc-200 font-medium">
              Peer code review approved
            </span>
            {!gate2 && (
              <span className="font-mono text-[9px] text-amber-400 ml-auto bg-amber-950/40 border border-amber-500/20 px-1 rounded-[6px]">
                Required
              </span>
            )}
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gate3}
              onChange={(e) => setGate3(e.target.checked)}
              className="w-4 h-4 rounded-[6px] accent-orange-500 cursor-pointer"
            />
            <span
              className={`text-xs ${
                gate3 ? 'text-zinc-500 line-through' : 'text-zinc-200'
              }`}
            >
              Automated tests passing
            </span>
          </label>
        </div>

        {showRules && (
          <div className="p-2 bg-[#121214] border border-orange-500/30 rounded-[6px] text-[11px] text-zinc-300 font-mono space-y-1 mt-2">
            <div className="text-orange-400 font-semibold">Lifecycle Policy:</div>
            <div>Transitions to &apos;In Review&apos; and &apos;Done&apos; require verified gates or lead override.</div>
          </div>
        )}
      </div>

      {/* Popover Actions & Commit Execution */}
      <div className="p-2.5 bg-[#121214] border-t border-[#27272a] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => handleApply()}
          className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] rounded-[6px] cursor-pointer"
        >
          <span>Update Status &amp; Notify Sprint</span>
          <span className="font-mono text-[10px] opacity-80 font-normal bg-black/20 px-1.5 py-0.5 rounded-[6px]">
            ⌘Enter
          </span>
        </button>

        <div className="flex items-center justify-between px-1 text-zinc-400 text-[11px]">
          <span>
            Press <kbd className="font-mono bg-[#18181b] border border-[#27272a] px-1 rounded-[6px] text-zinc-300">Esc</kbd> to dismiss
          </span>
          <button
            type="button"
            onClick={() => setShowRules(!showRules)}
            className="text-orange-400 hover:underline font-medium cursor-pointer"
          >
            {showRules ? 'Hide rules' : 'Lifecycle rules'}
          </button>
        </div>
      </div>
    </div>
  );
};
