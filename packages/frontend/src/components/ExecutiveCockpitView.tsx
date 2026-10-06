import React from 'react';
import { TaskItem, CrmDeal } from '../types';

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
    { name: 'Qualified Lead', label: 'Qualified Lead', color: 'bg-slate-400', ringColor: 'ring-slate-400' },
    { name: 'Discovery & Demo', label: 'Discovery', color: 'bg-sky-400', ringColor: 'ring-sky-400' },
    { name: 'Proposal Submitted', label: 'Proposal', color: 'bg-[#9900c2]', ringColor: 'ring-[#9900c2]' },
    { name: 'Contract & Legal', label: 'Contract & Legal', color: 'bg-indigo-500', ringColor: 'ring-indigo-500' },
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafc] select-none text-xs">
      {/* Top KPI Executive Metric Ribbon */}
      <section className="px-6 py-3.5 bg-white border-b border-[#d4c0d5]/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {/* Metric 1: Total Pipeline ARR */}
        <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-[#f4f2fd]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Total Pipeline ARR
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              PostgreSQL
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-2xl font-bold text-[#1a1b22] tracking-tight">
              {formattedPipeline}
            </span>
            <span className="font-mono text-[11px] text-[#837284]">active value</span>
          </div>
        </div>

        {/* Metric 2: Active Deals */}
        <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-[#f4f2fd]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Active Deals
            </span>
            <span className="material-symbols-outlined text-[#9900c2] text-[18px]">
              trending_up
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-2xl font-bold text-[#1a1b22] tracking-tight">
              {activeDealsCount} {activeDealsCount === 1 ? 'deal' : 'deals'}
            </span>
            <span className="text-xs text-[#837284]">Across {stageDefs.length} pipeline stages</span>
          </div>
        </div>

        {/* Metric 3: Sprint Execution Velocity */}
        <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-[#f4f2fd]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Sprint Execution Velocity
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#9900c2]">
              {completedTasks.length}/{tasks.length} Done
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="font-mono text-2xl font-bold text-[#1a1b22] tracking-tight">
              {velocityPct}%
            </span>
            <div className="w-32 bg-[#eeedf7] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#9900c2] h-full rounded-full transition-all duration-500"
                style={{ width: `${velocityPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Metric 4: Critical Deadlines */}
        <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-[#f4f2fd]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Critical Tasks
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              {urgentCount} Urgent
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-2xl font-bold text-amber-600 tracking-tight">
              {criticalDeadlinesCount} {criticalDeadlinesCount === 1 ? 'task' : 'tasks'}
            </span>
            <span className="text-xs text-[#837284]">High &amp; Urgent Priority</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Canvas Content */}
      <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto custom-scrollbar">
        {/* ===================================================================== */}
        {/* LEFT COLUMN: Pipeline Stage Velocity & Enterprise Opportunities (7 col) */}
        {/* ===================================================================== */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {/* Panel 1: Pipeline Stage Velocity & Revenue Distribution */}
          <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-[#1a1b22] tracking-tight">
                  Pipeline Stage Velocity &amp; Revenue Distribution
                </span>
                <span className="text-[11px] text-[#837284] mt-0.5">
                  Dynamic conversion metrics across deals stored in your account
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[#1a1b22] bg-[#f4f2fd] px-2.5 py-1 rounded-lg border border-[#d4c0d5]/30">
                <span className="text-[#837284]">Volume:</span>
                <span>{formattedPipeline}</span>
              </div>
            </div>

            {/* Composite Multi-Stage Velocity Bar */}
            <div className="w-full flex flex-col gap-2">
              {totalPipelineArr === 0 ? (
                <div className="h-4 w-full bg-[#eeedf7] flex items-center justify-center p-0.5 border border-[#d4c0d5]/30 rounded text-[10px] font-mono text-[#837284]">
                  No deals in pipeline
                </div>
              ) : (
                <div className="h-4 w-full bg-[#eeedf7] flex overflow-hidden p-0.5 gap-0.5 border border-[#d4c0d5]/30 rounded">
                  {stageMetrics.map((sm) =>
                    sm.pct > 0 ? (
                      <div
                        key={sm.name}
                        className={`${sm.color} h-full rounded-sm transition-all hover:opacity-90`}
                        style={{ width: `${Math.max(sm.pct, 4)}%` }}
                        title={`${sm.label}: $${sm.sumVal.toLocaleString()} (${sm.pct.toFixed(1)}%)`}
                      ></div>
                    ) : null
                  )}
                </div>
              )}

              {/* Stage Breakout Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {stageMetrics.map((sm) => (
                  <div
                    key={sm.name}
                    className={`flex flex-col p-2 rounded border ${
                      sm.name === 'Proposal Submitted'
                        ? 'border-[#9900c2]/40 bg-[#f4f2fd] ring-1 ring-[#9900c2]/20 shadow-xs'
                        : 'border-[#d4c0d5]/30 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${sm.color}`}></span>
                      <span
                        className={`text-[11px] truncate ${
                          sm.name === 'Proposal Submitted'
                            ? 'font-semibold text-[#9900c2]'
                            : 'text-[#837284]'
                        }`}
                      >
                        {sm.label}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#1a1b22] mt-1">
                      ${sm.sumVal.toLocaleString()}
                    </span>
                    <span
                      className={`font-mono text-[10px] ${
                        sm.name === 'Proposal Submitted'
                          ? 'text-[#9900c2] font-semibold'
                          : 'text-[#837284]'
                      }`}
                    >
                      {sm.pct.toFixed(1)}% · {sm.count} {sm.count === 1 ? 'deal' : 'deals'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Stage Performance Metadata */}
            <div className="flex items-center justify-between pt-2 border-t border-[#d4c0d5]/20 font-mono text-[11px]">
              <div className="flex items-center gap-4 text-[#837284]">
                <span>
                  Active Deals: <strong className="text-[#1a1b22]">{deals.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Total Tasks: <strong className="text-[#1a1b22]">{tasks.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Closed Won: <strong className="text-emerald-700">{deals.filter(d => d.stage === 'Closed Won').length}</strong>
                </span>
              </div>
              <button
                onClick={onNavigateToDeals}
                className="text-[#9900c2] hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>Pipeline Health Audit</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Panel 2: High-Value Enterprise Opportunities */}
          <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-[#1a1b22] tracking-tight">
                  High-Value Enterprise Opportunities
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#eeedf7] font-semibold text-[#1a1b22]">
                  {deals.length} Stored in DB
                </span>
              </div>
              <button
                onClick={onNavigateToDeals}
                className="text-xs text-[#9900c2] font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>View All Deals ({deals.length})</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Structured Account Rows or Empty State */}
            {deals.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#d4c0d5]/60 rounded-xl bg-[#fafafc] flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-[#837284]/60">payments</span>
                <p className="text-xs font-semibold text-[#1a1b22] mt-2">No active opportunities yet</p>
                <p className="text-[11px] text-[#837284] mt-0.5">
                  Create a deal in your sales pipeline to track revenue forecasts.
                </p>
                <button
                  onClick={onNavigateToDeals}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#9900c2] hover:bg-[#b731e0] text-white text-xs font-semibold shadow-xs transition-all"
                >
                  Go to Deals Board
                </button>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[#d4c0d5]/20">
                {deals.slice(0, 4).map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => onSelectDeal(deal)}
                    className="py-3 flex items-center justify-between hover:bg-[#f4f2fd]/50 px-2 rounded-lg transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#eeedf7] border border-[#d4c0d5]/40 flex items-center justify-center font-mono text-xs font-bold text-[#1a1b22] shrink-0">
                        {deal.company?.slice(0, 2).toUpperCase() || 'DL'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-xs text-[#1a1b22] group-hover:text-[#9900c2] transition-colors truncate">
                            {deal.company}
                          </span>
                          <span className="text-[11px] text-[#837284] truncate">
                            — {deal.title.replace(`${deal.company} — `, '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#837284] mt-0.5">
                          <span>
                            Touchpoint: <strong className="text-[#1a1b22]">{deal.targetCloseDate?.split(',')[0]} ({deal.contact?.name || deal.owner || 'Contact'})</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-[#837284]">description</span>
                            <span>{deal.linkedTasks?.length || 0} Deliverables</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#fbd7ff]/40 text-[#9900c2] border border-[#9900c2]/20 font-semibold">
                        {deal.stage}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#1a1b22] w-20 text-right">
                        {deal.formattedValue || `$${deal.value.toLocaleString()}`}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-[#837284] opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT COLUMN: Priority Action Items & System Feed (5 col)             */}
        {/* ===================================================================== */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          {/* Panel 3: Priority Action Items */}
          <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-[#1a1b22] tracking-tight">
                  Priority Action Items
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  {criticalDeadlinesCount} Priority
                </span>
              </div>
              <button
                onClick={onOpenCreateTask}
                className="text-xs text-[#9900c2] hover:underline font-semibold flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Add Task</span>
              </button>
            </div>

            {actionItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#d4c0d5]/60 rounded-xl bg-[#fafafc] flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-[#837284]/60">task_alt</span>
                <p className="text-xs font-semibold text-[#1a1b22] mt-2">No deliverables yet</p>
                <p className="text-[11px] text-[#837284] mt-0.5">
                  Create your first task to start tracking velocity and sprints.
                </p>
                <button
                  onClick={onOpenCreateTask}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-[#9900c2] text-white font-medium text-xs shadow-xs hover:bg-[#b731e0] transition-all"
                >
                  + Add Task
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {actionItems.map((task) => {
                  const isDone = task.status === 'Done';
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border transition-all flex flex-col gap-2 ${
                        isDone
                          ? 'bg-[#f4f2fd]/40 border-[#d4c0d5]/20'
                          : 'border-[#d4c0d5]/40 hover:border-[#9900c2]/40 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTask(task)}
                            className="mt-0.5 h-4 w-4 rounded text-[#9900c2] focus:ring-[#9900c2] cursor-pointer"
                          />
                          <div
                            className="flex flex-col min-w-0 cursor-pointer"
                            onClick={() => onSelectTask(task)}
                          >
                            <span
                              className={`text-xs font-semibold leading-tight hover:text-[#9900c2] transition-colors truncate ${
                                isDone ? 'line-through text-[#837284]' : 'text-[#1a1b22]'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span className="text-[11px] text-[#837284] mt-0.5 truncate">
                              {task.id} · {task.dueDate ? `Due ${task.dueDate}` : task.status} · Subtasks: {task.subtasks?.filter(s => s.done).length || 0}/{task.subtasks?.length || 0}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-[9px] px-2 py-0.5 rounded font-semibold uppercase shrink-0 ${
                            task.priority === 'Urgent'
                              ? 'bg-[#ffdad6] text-[#93000a]'
                              : task.priority === 'High'
                              ? 'bg-[#ffe4b0] text-[#7c4d00]'
                              : 'bg-[#eeedf7] text-[#1a1b22]'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#d4c0d5]/20 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {task.tags?.map((tg) => (
                            <span
                              key={tg}
                              className="px-2 py-0.5 rounded bg-[#eeedf7] font-mono text-[10px] text-[#504252]"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[#1a1b22]">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{
                              backgroundColor: task.assignee?.avatarBg || '#9900c2',
                              color: task.assignee?.avatarColor || '#ffffff',
                            }}
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
