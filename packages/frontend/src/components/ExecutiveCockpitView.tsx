import React from 'react';
import { TaskItem, CrmDeal } from '../types';
import { useAuth } from '../context/AuthContext';

interface ExecutiveCockpitViewProps {
  tasks: TaskItem[];
  deals: CrmDeal[];
  onSelectTask: (task: TaskItem) => void;
  onSelectDeal: (deal: CrmDeal) => void;
  onNavigateToDeals: () => void;
  onOpenCreateTask: () => void;
  onUpdateTask?: (task: TaskItem) => void;
}

export const ExecutiveCockpitView: React.FC<ExecutiveCockpitViewProps> = ({
  tasks = [],
  deals = [],
  onSelectTask,
  onSelectDeal,
  onNavigateToDeals,
  onOpenCreateTask,
  onUpdateTask,
}) => {
  const { effectiveRole } = useAuth();
  const isReadOnly = effectiveRole === 'VIEWER';
  // 1. Dynamic Financial & Pipeline KPI computations
  const totalPipelineArr = deals.reduce((acc, d) => acc + (d.value || 0), 0);
  const formattedPipeline = `$${totalPipelineArr.toLocaleString()}`;
  const activeDealsCount = deals.length;

  // 2. Sprint execution velocity computation
  const completedTasks = tasks.filter((t) => t.status === 'Done');
  const velocityPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // 3. Critical deadlines count (Urgent & High)
  const criticalTasks = tasks.filter((t) => t.priority === 'Urgent' || t.priority === 'High');
  const criticalDeadlinesCount = criticalTasks.length;
  const urgentCount = tasks.filter((t) => t.priority === 'Urgent').length;

  // 4. Dynamic Multi-Stage Revenue Distribution
  const stageDefs: { name: CrmDeal['stage']; label: string; color: string; ringColor: string }[] = [
    { name: 'Qualified Lead', label: 'Qualified Lead', color: 'bg-zinc-400', ringColor: 'ring-zinc-400' },
    { name: 'Discovery & Demo', label: 'Discovery', color: 'bg-sky-500', ringColor: 'ring-sky-500' },
    { name: 'Proposal Submitted', label: 'Proposal', color: 'bg-orange-500', ringColor: 'ring-orange-500' },
    { name: 'Contract & Legal', label: 'Contract & Legal', color: 'bg-amber-500', ringColor: 'ring-amber-500' },
    { name: 'Closed Won', label: 'Closed Won', color: 'bg-emerald-500', ringColor: 'ring-emerald-500' },
  ];

  const stageMetrics = stageDefs.map((def) => {
    const stageDeals = deals.filter((d) => d.stage === def.name);
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

  // 5. Dynamic Action Items from PostgreSQL Tasks
  const actionItems = [...tasks]
    .sort((a, b) => {
      const pMap: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      const pDiff = (pMap[a.priority] ?? 2) - (pMap[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      if (a.status === 'Done' && b.status !== 'Done') return 1;
      if (a.status !== 'Done' && b.status === 'Done') return -1;
      return 0;
    })
    .slice(0, 5);

  const handleToggleTask = (task: TaskItem) => {
    if (!onUpdateTask) return;
    const isDone = task.status === 'Done';
    const updated: TaskItem = {
      ...task,
      status: isDone ? 'In Progress' : 'Done',
    };
    onUpdateTask(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] text-zinc-100 select-none">
      {/* Top KPI Executive Metric Ribbon */}
      <section className="px-6 py-4 bg-[#0c0a09] border-b border-[#27272a] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Metric 1: Total Pipeline ARR */}
        <div className="flex flex-col gap-1.5 p-4 bg-[#121214] border border-[#27272a] rounded-[6px] hover:border-orange-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Total Pipeline ARR
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-[6px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-semibold">
              Live Pipeline
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-zinc-100 tracking-tight">
              {formattedPipeline}
            </span>
            <span className="font-mono text-xs text-zinc-400">active value</span>
          </div>
        </div>

        {/* Metric 2: Active Deals */}
        <div className="flex flex-col gap-1.5 p-4 bg-[#121214] border border-[#27272a] rounded-[6px] hover:border-orange-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Active Deals
            </span>
            <span className="material-symbols-outlined text-orange-400 text-[18px]">
              trending_up
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-zinc-100 tracking-tight">
              {activeDealsCount} {activeDealsCount === 1 ? 'deal' : 'deals'}
            </span>
            <span className="text-xs text-zinc-400">Across {stageDefs.length} stages</span>
          </div>
        </div>

        {/* Metric 3: Sprint Execution Velocity */}
        <div className="flex flex-col gap-1.5 p-4 bg-[#121214] border border-[#27272a] rounded-[6px] hover:border-orange-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Sprint Execution Velocity
            </span>
            <span className="font-mono text-[11px] font-semibold text-orange-400">
              {completedTasks.length}/{tasks.length} Done
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-xl font-bold text-zinc-100 tracking-tight">
              {velocityPct}%
            </span>
            <div className="w-28 bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${velocityPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Metric 4: Critical Deadlines */}
        <div className="flex flex-col gap-1.5 p-4 bg-[#121214] border border-[#27272a] rounded-[6px] hover:border-orange-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Critical Tasks
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-[6px] bg-red-950/40 text-red-400 border border-red-500/30 font-semibold">
              {urgentCount} Urgent
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-xl font-bold text-orange-400 tracking-tight">
              {criticalDeadlinesCount} {criticalDeadlinesCount === 1 ? 'task' : 'tasks'}
            </span>
            <span className="text-xs text-zinc-400">High &amp; Urgent Priority</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Canvas Content */}
      <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto custom-scrollbar">
        {/* LEFT COLUMN: Pipeline Stage Velocity & Opportunities (7 col) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {/* Panel 1: Pipeline Stage Velocity & Revenue Distribution */}
          <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex flex-col">
                <span className="font-bold text-base text-zinc-100 tracking-tight font-headline">
                  Pipeline Stage Velocity &amp; Revenue Distribution
                </span>
                <span className="text-xs text-zinc-400 mt-0.5">
                  Dynamic conversion metrics across deals stored in your account
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-200 bg-[#18181b] px-3 py-1 rounded-[6px] border border-[#27272a]">
                <span className="text-zinc-400">Volume:</span>
                <span>{formattedPipeline}</span>
              </div>
            </div>

            {/* Composite Multi-Stage Velocity Bar */}
            <div className="w-full flex flex-col gap-2">
              {totalPipelineArr === 0 ? (
                <div className="h-4 w-full bg-[#18181b] flex items-center justify-center p-0.5 border border-[#27272a] rounded-[6px] text-xs font-mono text-zinc-500">
                  No deals in pipeline
                </div>
              ) : (
                <div className="h-3.5 w-full bg-zinc-800 flex overflow-hidden p-0.5 gap-0.5 border border-[#27272a] rounded-full">
                  {stageMetrics.map((sm) =>
                    sm.pct > 0 ? (
                      <div
                        key={sm.name}
                        className={`${sm.color} h-full rounded-full transition-all hover:opacity-90`}
                        style={{ width: `${Math.max(sm.pct, 4)}%` }}
                        title={`${sm.label}: $${sm.sumVal.toLocaleString()} (${sm.pct.toFixed(1)}%)`}
                      ></div>
                    ) : null
                  )}
                </div>
              )}

              {/* Stage Breakout Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                {stageMetrics.map((sm) => (
                  <div
                    key={sm.name}
                    className={`flex flex-col p-2.5 rounded-[6px] border ${
                      sm.name === 'Proposal Submitted'
                        ? 'border-orange-500/40 bg-orange-950/20'
                        : 'border-[#27272a] bg-[#18181b]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${sm.color}`}></span>
                      <span
                        className={`text-xs truncate ${
                          sm.name === 'Proposal Submitted'
                            ? 'font-semibold text-orange-400'
                            : 'text-zinc-300'
                        }`}
                      >
                        {sm.label}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold text-zinc-100 mt-1.5">
                      ${sm.sumVal.toLocaleString()}
                    </span>
                    <span
                      className={`font-mono text-[11px] mt-0.5 ${
                        sm.name === 'Proposal Submitted'
                          ? 'text-orange-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {sm.pct.toFixed(1)}% · {sm.count} {sm.count === 1 ? 'deal' : 'deals'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Stage Performance Metadata */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#27272a] font-mono text-xs">
              <div className="flex items-center gap-4 text-zinc-400">
                <span>
                  Active Deals: <strong className="text-zinc-200">{deals.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Total Tasks: <strong className="text-zinc-200">{tasks.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Closed Won: <strong className="text-emerald-400">{deals.filter(d => d.stage === 'Closed Won').length}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={onNavigateToDeals}
                className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <span>Pipeline Health Audit</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Panel 2: High-Value Enterprise Opportunities */}
          <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-zinc-100 tracking-tight font-headline">
                  High-Value Enterprise Opportunities
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-[6px] bg-[#18181b] border border-[#27272a] font-semibold text-zinc-300">
                  {deals.length} Stored in DB
                </span>
              </div>
              <button
                type="button"
                onClick={onNavigateToDeals}
                className="text-xs text-orange-400 font-semibold hover:text-orange-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Deals ({deals.length})</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            {deals.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#27272a] rounded-[6px] bg-[#18181b]/40 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-zinc-600">payments</span>
                <p className="text-sm font-semibold text-zinc-200 mt-2">No active opportunities yet</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Create a deal in your sales pipeline to track revenue forecasts.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToDeals}
                  className="mt-3 px-3.5 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Go to Deals Board
                </button>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[#1f1f23]">
                {deals.slice(0, 4).map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => onSelectDeal(deal)}
                    className="py-3 flex items-center justify-between hover:bg-zinc-800/40 px-2 rounded-[6px] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[6px] bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-xs font-bold text-zinc-200 shrink-0">
                        {deal.company?.slice(0, 2).toUpperCase() || 'DL'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-sm text-zinc-100 group-hover:text-orange-400 transition-colors truncate">
                            {deal.company}
                          </span>
                          <span className="text-xs text-zinc-400 truncate">
                            — {deal.title.replace(`${deal.company} — `, '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                          <span>
                            Touchpoint: <strong className="text-zinc-300">{deal.targetCloseDate?.split(',')[0]} ({deal.contact?.name || deal.owner || 'Contact'})</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-zinc-400">description</span>
                            <span>{deal.linkedTasks?.length || 0} Deliverables</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-[6px] bg-orange-950/40 text-orange-400 border border-orange-500/20 font-semibold">
                        {deal.stage}
                      </span>
                      <span className="font-mono text-sm font-bold text-zinc-100 w-24 text-right">
                        {deal.formattedValue || `$${deal.value.toLocaleString()}`}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Priority Action Items (5 col) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#121214] rounded-[6px] border border-[#27272a] p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-zinc-100 tracking-tight font-headline">
                  Priority Action Items
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-[6px] bg-amber-950/40 text-amber-400 border border-amber-500/30 font-semibold">
                  {criticalDeadlinesCount} Priority
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Task</span>
              </button>
            </div>

            {actionItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#27272a] rounded-[6px] bg-[#18181b]/40 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-zinc-600">task_alt</span>
                <p className="text-sm font-semibold text-zinc-200 mt-2">No deliverables yet</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Create your first task to start tracking velocity and sprints.
                </p>
                <button
                  type="button"
                  onClick={onOpenCreateTask}
                  className="mt-3 px-3.5 py-1.5 rounded-[6px] bg-orange-600 text-white font-medium text-xs shadow-sm hover:bg-orange-700 transition-all cursor-pointer"
                >
                  + Add Task
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {actionItems.map((task) => {
                  const isDone = task.status === 'Done';
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-[6px] border transition-all flex flex-col gap-2.5 ${
                        isDone
                          ? 'bg-[#18181b]/50 border-[#27272a]'
                          : 'border-[#27272a] hover:border-orange-500/40 bg-[#18181b]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={isDone}
                            onChange={() => {
                              if (isReadOnly) return;
                              handleToggleTask(task);
                            }}
                            className={`mt-0.5 h-4 w-4 rounded-[6px] border-zinc-700 text-orange-600 focus:ring-orange-500 bg-[#121214] ${
                              isReadOnly ? 'cursor-default opacity-60' : 'cursor-pointer'
                            }`}
                          />
                          <div
                            className="flex flex-col min-w-0 cursor-pointer"
                            onClick={() => onSelectTask(task)}
                          >
                            <span
                              className={`text-[13px] font-semibold leading-snug hover:text-orange-400 transition-colors truncate ${
                                isDone ? 'line-through text-zinc-500' : 'text-zinc-100'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span className="text-xs text-zinc-400 mt-0.5 truncate">
                              {task.id} · {task.dueDate ? `Due ${task.dueDate}` : task.status} · Subtasks: {task.subtasks?.filter(s => s.done).length || 0}/{task.subtasks?.length || 0}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded-[6px] font-semibold uppercase shrink-0 ${
                            task.priority === 'Urgent'
                              ? 'bg-red-950/50 text-red-400 border border-red-500/30'
                              : task.priority === 'High'
                              ? 'bg-orange-950/50 text-orange-400 border border-orange-500/30'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#27272a] text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {task.tags?.map((tg) => (
                            <span
                              key={tg}
                              className="px-2 py-0.5 rounded-[6px] bg-[#121214] border border-[#27272a] font-mono text-[11px] text-zinc-300"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-xs font-semibold text-zinc-200">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-300"
                            title={task.assignee?.name}
                          >
                            {task.assignee?.initials || 'OP'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
