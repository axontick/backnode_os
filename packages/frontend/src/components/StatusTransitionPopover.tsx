import React, { useState } from 'react';
import { TaskStatus } from '../types';

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
  const [selectedTarget, setSelectedTarget] = useState<TaskStatus>(currentStatus);
  const [gate1, setGate1] = useState(true); // acceptance criteria validated
  const [gate2, setGate2] = useState(false); // peer code review approved
  const [gate3, setGate3] = useState(true); // automated tests passing

  const stages: {
    name: TaskStatus;
    label: string;
    subtitle: string;
    badge: string;
    dotColor: string;
    ringColor: string;
  }[] = [
    {
      name: 'Backlog',
      label: 'Backlog',
      subtitle: 'Tasks waiting for sprint triage',
      badge: 'Stage 1',
      dotColor: 'bg-zinc-400',
      ringColor: 'ring-zinc-200',
    },
    {
      name: 'In Progress',
      label: 'In Progress',
      subtitle: 'Active implementation in branch',
      badge: 'Active Now',
      dotColor: 'bg-[#9900c2]',
      ringColor: 'ring-[#fbd7ff]',
    },
    {
      name: 'In Review',
      label: 'In Review',
      subtitle: 'Requires 1 technical review sign-off',
      badge: 'Target',
      dotColor: 'bg-amber-500',
      ringColor: 'ring-amber-200',
    },
    {
      name: 'Blocked',
      label: 'Blocked',
      subtitle: 'Dependencies or external blocker',
      badge: 'Gate',
      dotColor: 'bg-rose-500',
      ringColor: 'ring-rose-200',
    },
    {
      name: 'Done',
      label: 'Done / Deployed',
      subtitle: 'Closed and delivered',
      badge: 'Terminal',
      dotColor: 'bg-emerald-500',
      ringColor: 'ring-emerald-200',
    },
  ];

  const readyGatesCount = (gate1 ? 1 : 0) + (gate2 ? 1 : 0) + (gate3 ? 1 : 0);

  const handleApply = () => {
    onSelectStatus(selectedTarget);
    onClose();
  };

  return (
    <div
      className="absolute top-[170px] left-[16px] w-[370px] bg-white border border-[#d4c0d5]/60 shadow-2xl z-50 overflow-hidden rounded-lg animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Header: Current Active State & Stage Timer */}
      <div className="p-3 bg-[#f4f2fd] border-b border-[#d4c0d5]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9900c2] ring-4 ring-[#9900c2]/20"></span>
          <div>
            <div className="font-mono text-[10px] text-[#837284] uppercase font-semibold">
              Active Lifecycle State
            </div>
            <div className="text-sm font-bold text-[#9900c2] leading-tight">
              {currentStatus}
            </div>
          </div>
        </div>

        {/* Purple highlight pill with stage timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#fbd7ff] text-[#330043] border border-[#9900c2]/20 font-mono text-[10px] font-semibold rounded">
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            timer
          </span>
          <span>{timeInStage}</span>
        </div>
      </div>

      {/* Workflow Stage Pipeline Options */}
      <div className="p-2 space-y-1">
        <div className="px-2 py-1 font-mono text-[10px] text-[#837284] font-semibold uppercase tracking-wider">
          Select Workflow Target
        </div>

        {stages.map((stage) => {
          const isCurrent = stage.name === currentStatus;
          const isSelectedTarget = stage.name === selectedTarget;

          return (
            <div
              key={stage.name}
              onClick={() => setSelectedTarget(stage.name)}
              className={`flex items-start gap-2.5 p-2 rounded transition-colors cursor-pointer group ${
                isSelectedTarget
                  ? 'bg-[#f4f2fd] border border-[#9900c2]/40'
                  : 'hover:bg-[#eeedf7]'
              }`}
            >
              <div className="mt-1">
                <span
                  className={`w-3 h-3 rounded-full block ring-2 ${stage.dotColor} ${stage.ringColor}`}
                ></span>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isSelectedTarget
                        ? 'text-[#9900c2]'
                        : 'text-[#1a1b22] group-hover:text-[#9900c2]'
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      isCurrent
                        ? 'bg-[#fbd7ff] text-[#330043]'
                        : isSelectedTarget
                        ? 'bg-[#9900c2]/10 text-[#9900c2]'
                        : 'text-[#837284]'
                    }`}
                  >
                    {isCurrent ? 'Active Now' : stage.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[#837284]">{stage.subtitle}</p>
              </div>

              {isSelectedTarget && (
                <span className="material-symbols-outlined text-[#9900c2] text-[16px] mt-0.5">
                  check
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Transition Gates Checklist Box */}
      <div className="m-2 p-2.5 bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 space-y-2 rounded">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold text-[#1a1b22] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-[#9900c2]">verified</span>
            Transition Gates Checklist
          </span>
          <span className="font-mono text-[10px] bg-[#fbd7ff] text-[#330043] px-1.5 py-0.2 rounded font-medium">
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
              className="w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2] border-[#837284] cursor-pointer"
            />
            <span
              className={`text-xs ${
                gate1 ? 'text-[#837284] line-through' : 'text-[#1a1b22]'
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
              className="w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2] border-[#837284] cursor-pointer"
            />
            <span className="text-xs text-[#1a1b22] font-medium">
              Peer code review approved
            </span>
            {!gate2 && (
              <span className="font-mono text-[9px] text-[#835000] ml-auto bg-[#ffddba] px-1 rounded">
                Required
              </span>
            )}
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gate3}
              onChange={(e) => setGate3(e.target.checked)}
              className="w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2] border-[#837284] cursor-pointer"
            />
            <span
              className={`text-xs ${
                gate3 ? 'text-[#837284] line-through' : 'text-[#1a1b22]'
              }`}
            >
              Automated tests passing
            </span>
          </label>
        </div>
      </div>

      {/* Popover Actions & Commit Execution */}
      <div className="p-2.5 bg-white border-t border-[#d4c0d5]/30 flex flex-col gap-1.5">
        <button
          onClick={handleApply}
          className="w-full h-8 bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] rounded"
        >
          <span>Update Status &amp; Notify Sprint</span>
          <span className="font-mono text-[10px] opacity-80 font-normal bg-black/15 px-1.5 py-0.5 rounded">
            ⌘Enter
          </span>
        </button>

        <div className="flex items-center justify-between px-1 text-[#837284] text-[11px]">
          <span>
            Press <kbd className="font-mono bg-[#f4f2fd] px-1 rounded">Esc</kbd> to dismiss
          </span>
          <button
            onClick={() => alert('Lifecycle policy: Stages require verified gates or lead override.')}
            className="text-[#9900c2] hover:underline font-medium"
          >
            Lifecycle rules
          </button>
        </div>
      </div>
    </div>
  );
};
