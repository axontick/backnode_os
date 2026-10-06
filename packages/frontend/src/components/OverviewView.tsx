import React from 'react';
import { TaskItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface OverviewViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onNavigateToBoard: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  tasks = [],
  onSelectTask,
  onNavigateToBoard,
}) => {
  const { user } = useAuth();
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const reviewCount = tasks.filter((t) => t.status === 'In Review').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white select-none">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-[#fbd7ff] text-[#330043] px-2 py-0.5 rounded font-semibold">
                SYSTEM HEALTH: NOMINAL
              </span>
              <span className="text-[#d4c0d5]">•</span>
              <span className="font-mono text-[11px] text-[#837284]">PostgreSQL Synced</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1a1b22] tracking-tight mt-1">
              {user?.account?.name ? `${user.account.name} Overview` : 'Executive Workspace Overview'}
            </h1>
            <p className="text-xs text-[#504252] mt-0.5">
              Active workspace for {user?.name || 'Operator'} • Delivery cadence and engineering velocity.
            </p>
          </div>

          <button
            onClick={onNavigateToBoard}
            className="px-3.5 py-1.5 rounded-lg bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Jump to Kanban Board</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-xl p-4 flex flex-col justify-between">
            <span className="font-mono text-[11px] text-[#837284]">SPRINT PROGRESS</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#9900c2] font-mono">{completionPct}%</span>
              <span className="text-xs text-[#504252]">{doneCount} of {totalCount} closed</span>
            </div>
            <div className="w-full bg-[#eeedf7] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#9900c2] h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }}></div>
            </div>
          </div>

          <div className="bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-xl p-4 flex flex-col justify-between">
            <span className="font-mono text-[11px] text-[#837284]">ACTIVE DELIVERABLES</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#1a1b22] font-mono">{inProgressCount}</span>
              <span className="text-xs text-[#835000]">In Progress items</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-600 mt-2">Active in current sprint</span>
          </div>

          <div className="bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-xl p-4 flex flex-col justify-between">
            <span className="font-mono text-[11px] text-[#837284]">PENDING REVIEWS</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#835000] font-mono">{reviewCount}</span>
              <span className="text-xs text-[#504252]">Quality gates waiting</span>
            </div>
            <span className="font-mono text-[10px] text-[#837284] mt-2">Ready for review</span>
          </div>

          <div className="bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-xl p-4 flex flex-col justify-between">
            <span className="font-mono text-[11px] text-[#837284]">DATABASE INTEGRITY</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600 font-mono">100%</span>
              <span className="text-xs text-[#504252]">PostgreSQL Isolation</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-600 mt-2">Tenant partition active</span>
          </div>
        </div>

        {/* Deliverables Triage Stream */}
        <div className="bg-white border border-[#d4c0d5]/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#d4c0d5]/20 pb-2">
            <h3 className="font-semibold text-xs text-[#1a1b22] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#9900c2]">bolt</span>
              Active High-Priority Deliverables
            </h3>
            <span className="font-mono text-[10px] text-[#837284]">Click to inspect</span>
          </div>

          {tasks.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#d4c0d5]/60 rounded-xl bg-[#fafafc] flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[28px] text-[#837284]/60">inbox</span>
              <p className="text-xs font-semibold text-[#1a1b22] mt-1.5">No active deliverables</p>
              <p className="text-[11px] text-[#837284] mt-0.5">
                Create your first task to start tracking execution.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#d4c0d5]/20">
              {tasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="py-2.5 flex items-center justify-between hover:bg-[#f4f2fd]/50 px-2 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-[#9900c2] font-semibold shrink-0">
                      {t.id}
                    </span>
                    <span className="text-xs font-medium text-[#1a1b22] truncate group-hover:text-[#9900c2]">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#eeedf7] text-[#504252]">
                      {t.status}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#837284]">{t.assignee?.name || 'Operator'}</span>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold"
                        style={{
                          backgroundColor: t.assignee?.avatarBg || '#e4e1e6',
                          color: t.assignee?.avatarColor || '#1b1b1e',
                        }}
                      >
                        {t.assignee?.initials || 'OP'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
