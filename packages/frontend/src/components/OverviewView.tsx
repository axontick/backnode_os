import React from 'react';
import { TaskItem, CrmDeal } from '../types';
import { useAuth } from '../context/AuthContext';

interface OverviewViewProps {
  tasks?: TaskItem[];
  deals?: CrmDeal[];
  onSelectTask: (task: TaskItem) => void;
  onSelectDeal?: (deal: CrmDeal) => void;
  onNavigateToBoard: () => void;
  onNavigateToDeals?: () => void;
  onOpenCreateTask?: () => void;
  onUpdateTask?: (task: TaskItem) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  tasks = [],
  deals = [],
  onSelectTask,
  onSelectDeal,
  onNavigateToBoard,
  onNavigateToDeals,
  onOpenCreateTask,
  onUpdateTask,
}) => {
  const { user, effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';

  // Task execution computations
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const reviewCount = tasks.filter((t) => t.status === 'In Review').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent').length;

  // Pipeline revenue computations (strictly active, unarchived deals)
  const activeDeals = deals.filter((d) => !d.isArchived);
  const archivedDeals = deals.filter((d) => d.isArchived);
  const totalPipelineArr = activeDeals.reduce((acc, d) => acc + (d.value || 0), 0);
  const formattedPipeline = `$${totalPipelineArr.toLocaleString()}`;

  // Stage distribution definition
  const stageDefs: { name: CrmDeal['stage']; label: string; color: string }[] = [
    { name: 'Qualified Lead', label: 'Qualified Lead', color: 'bg-zinc-400' },
    { name: 'Discovery & Demo', label: 'Discovery', color: 'bg-sky-500' },
    { name: 'Proposal Submitted', label: 'Proposal', color: 'bg-orange-500' },
    { name: 'Contract & Legal', label: 'Contract & Legal', color: 'bg-amber-500' },
    { name: 'Closed Won', label: 'Closed Won', color: 'bg-emerald-500' },
  ];

  const stageMetrics = stageDefs.map((def) => {
    const stageDeals = activeDeals.filter((d) => d.stage === def.name);
    const sumVal = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);
    const pct = totalPipelineArr > 0 ? (sumVal / totalPipelineArr) * 100 : 0;
    return {
      ...def,
      deals: stageDeals,
      count: stageDeals.length,
      sumVal,
      pct,
    };
  });

  // Triage list: sort by priority and non-done
  const triageTasks = [...tasks]
    .sort((a, b) => {
      const pMap: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      const pDiff = (pMap[a.priority] ?? 2) - (pMap[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      if (a.status === 'Done' && b.status !== 'Done') return 1;
      if (a.status !== 'Done' && b.status === 'Done') return -1;
      return 0;
    })
    .slice(0, 6);

  const handleToggleDone = (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateTask) return;
    const isDone = task.status === 'Done';
    onUpdateTask({
      ...task,
      status: isDone ? 'In Progress' : 'Done',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#09090b] text-zinc-100">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Overall Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#27272a] pb-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-[6px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SYSTEM HEALTH: NOMINAL
              </span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-[11px] text-zinc-400">PostgreSQL Synced</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight font-headline">
              {user?.account?.name ? `${user.account.name} Overall Dashboard` : 'Executive Workspace Overview'}
            </h1>
            <p className="text-xs text-zinc-400 font-body">
              Active workspace for {user?.name || 'Operator'} • Real-time engineering cadence, CRM pipeline velocity, and telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCreateTask && (
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="px-3.5 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>New Task</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToBoard}
              className="px-3 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Kanban Board</span>
              <span className="material-symbols-outlined text-[15px] text-orange-400">arrow_forward</span>
            </button>
            {onNavigateToDeals && (
              <button
                type="button"
                onClick={onNavigateToDeals}
                className="px-3 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>CRM Pipelines</span>
                <span className="material-symbols-outlined text-[15px] text-orange-400">trending_up</span>
              </button>
            )}
          </div>
        </div>

        {/* Bento Grid Matrix (7 Modules) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Module 1: Sprint Velocity KPI (1x1) */}
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Sprint Execution
              </span>
              <span className="font-mono text-[11px] text-orange-400 bg-orange-950/40 border border-orange-500/30 px-2 py-0.5 rounded-[6px] font-bold">
                Velocity
              </span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-zinc-100 font-mono tracking-tight">{completionPct}%</span>
              <span className="text-xs text-zinc-400">{doneCount} of {totalCount} closed</span>
            </div>
            <div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                ></div>
              </div>
              <span className="block font-mono text-[11px] text-zinc-400 mt-2">
                Active sprint cadence
              </span>
            </div>
          </div>

          {/* Module 2: Active Deliverables & Blockers (1x1) */}
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Triage Workload
              </span>
              {urgentCount > 0 ? (
                <span className="font-mono text-[11px] text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded-[6px] font-bold animate-pulse">
                  {urgentCount} Urgent
                </span>
              ) : (
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-[6px] font-bold">
                  Nominal
                </span>
              )}
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-zinc-100 font-mono tracking-tight">{inProgressCount}</span>
              <span className="text-xs text-orange-400 font-medium">In Progress items</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1.5 border-t border-[#1f1f23]">
              <span>In Review: {reviewCount}</span>
              <span>Backlog: {tasks.filter((t) => t.status === 'Backlog').length}</span>
            </div>
          </div>

          {/* Module 3: CRM Pipeline ARR (1x1) */}
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Pipeline ARR
              </span>
              <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-[6px] font-semibold">
                Active Value
              </span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
                {formattedPipeline}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1.5 border-t border-[#1f1f23]">
              <span>{activeDeals.length} active deals</span>
              {archivedDeals.length > 0 ? (
                <span className="text-zinc-500 font-medium">({archivedDeals.length} archived)</span>
              ) : (
                <span className="text-emerald-400 font-medium">Weighted 72%</span>
              )}
            </div>
          </div>

          {/* Module 4: Data Engine Status (1x1) */}
          <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Database Engine
              </span>
              <span className="font-mono text-[11px] text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded-[6px] font-semibold">
                PostgreSQL
              </span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-400 font-mono tracking-tight">100%</span>
              <span className="text-xs text-zinc-400">Multi-Tenant Isolation</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1.5 border-t border-[#1f1f23]">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Connected (4ms)
              </span>
              <span>Primary DB</span>
            </div>
          </div>

          {/* Module 5: Major Widget - Deliverables Triage Stream (2x2) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-[#121214] border border-[#27272a] rounded-[6px] p-5 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-orange-500">bolt</span>
                <h3 className="font-bold text-base text-zinc-100 font-headline">
                  Active High-Priority Deliverables
                </h3>
              </div>
              <button
                type="button"
                onClick={onNavigateToBoard}
                className="text-xs text-zinc-400 hover:text-orange-400 transition-colors flex items-center gap-1 cursor-pointer font-mono"
              >
                <span>View Board</span>
                <span>→</span>
              </button>
            </div>

            {triageTasks.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#27272a] rounded-[6px] bg-[#18181b]/50 flex flex-col items-center justify-center my-auto">
                <span className="material-symbols-outlined text-[32px] text-zinc-600">inbox</span>
                <p className="text-sm font-semibold text-zinc-300 mt-2">No active deliverables</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Create a deliverable task to start sprint tracking.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[#1f1f23] my-auto">
                {triageTasks.map((t) => {
                  const isDone = t.status === 'Done';
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="py-3 px-2 flex items-center justify-between hover:bg-zinc-800/40 rounded-[6px] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={(e) => {
                            if (isReadOnly) return;
                            handleToggleDone(t, e);
                          }}
                          className={`w-4 h-4 rounded-[6px] border flex items-center justify-center transition-colors shrink-0 ${
                            isReadOnly ? 'cursor-default opacity-60' : 'cursor-pointer'
                          } ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-zinc-700 hover:border-orange-500 bg-[#18181b]'
                          }`}
                          title={isReadOnly ? 'Read-only view' : isDone ? 'Mark In Progress' : 'Mark Done'}
                        >
                          {isDone && <span className="material-symbols-outlined text-[13px]">check</span>}
                        </button>
                        <span className="font-mono text-xs text-orange-400 font-bold shrink-0">
                          {t.id}
                        </span>
                        <span
                          className={`text-[13px] font-medium truncate ${
                            isDone ? 'line-through text-zinc-500' : 'text-zinc-100 group-hover:text-orange-400'
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-[6px] font-semibold ${
                            t.priority === 'Urgent'
                              ? 'bg-red-950/50 text-red-400 border border-red-500/30'
                              : t.priority === 'High'
                              ? 'bg-orange-950/50 text-orange-400 border border-orange-500/30'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-200">
                          {t.status}
                        </span>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0"
                          title={t.assignee?.name || 'Operator'}
                        >
                          {t.assignee?.initials || 'OP'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Module 6: Major Widget - CRM Pipeline & Stage Velocity (2x2) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-[#121214] border border-[#27272a] rounded-[6px] p-5 flex flex-col justify-between shadow-sm hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-orange-500">leaderboard</span>
                <h3 className="font-bold text-base text-zinc-100 font-headline">
                  Stage Velocity &amp; Conversion
                </h3>
              </div>
              {onNavigateToDeals && (
                <button
                  type="button"
                  onClick={onNavigateToDeals}
                  className="text-xs text-zinc-400 hover:text-orange-400 transition-colors flex items-center gap-1 cursor-pointer font-mono"
                >
                  <span>Open CRM</span>
                  <span>→</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3.5 my-auto">
              {stageMetrics.map((stg) => (
                <div key={stg.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stg.color}`}></span>
                      <span className="font-semibold text-zinc-200">{stg.label}</span>
                      <span className="font-mono text-xs text-zinc-400">({stg.count} deals)</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-zinc-100">
                      ${stg.sumVal.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${stg.color}`}
                      style={{ width: `${Math.max(stg.pct, stg.count > 0 ? 4 : 0)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-3 border-t border-[#1f1f23] mt-2">
              <span>Weighted Win Rate: 42%</span>
              <span className="text-zinc-500">
                {archivedDeals.length > 0
                  ? `5 Stages Active (${archivedDeals.length} archived)`
                  : '5 Pipeline Stages Active'}
              </span>
            </div>
          </div>

          {/* Module 7: Full-Width Global System Health Strip (4x1) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-[#121214] border border-[#27272a] rounded-[6px] px-5 py-3.5 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-300 gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-zinc-200 font-semibold">PostgreSQL Engine:</span>
              <span className="text-emerald-400">Connected (4ms latency)</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-zinc-500">•</div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Multi-Tenant Partition:</span>
              <span className="text-orange-400 font-semibold">100% Isolated</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-zinc-500">•</div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Workspace Status:</span>
              <span className="text-emerald-400 font-semibold">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
