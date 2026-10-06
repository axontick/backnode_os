import React, { useState } from 'react';
import { TaskItem, CrmDeal } from '../types';

interface ExecutiveCockpitViewProps {
  tasks: TaskItem[];
  deals: CrmDeal[];
  onSelectTask: (task: TaskItem) => void;
  onSelectDeal: (deal: CrmDeal) => void;
  onNavigateToDeals: () => void;
  onOpenCreateTask: () => void;
}

export const ExecutiveCockpitView: React.FC<ExecutiveCockpitViewProps> = ({
  tasks,
  deals,
  onSelectTask,
  onSelectDeal,
  onNavigateToDeals,
  onOpenCreateTask,
}) => {
  const [actionTasks, setActionTasks] = useState([
    {
      id: 'at-1',
      title: 'Deliver customized SOC-2 compliance SLA',
      due: 'Due Tomorrow 5:00 PM · Subtasks: 2/4',
      priority: 'Urgent',
      tags: ['Legal / Ops', 'Acme Corp'],
      assignee: 'AW',
      done: false,
    },
    {
      id: 'at-2',
      title: 'Schedule technical review with Acme Corp',
      due: 'Due Oct 24 · Architecture sync agenda',
      priority: 'High',
      tags: ['Engineering'],
      assignee: 'SJ',
      done: false,
    },
    {
      id: 'at-3',
      title: 'Perform IndexedDB sync benchmark',
      due: 'Due Oct 26 · Load test with 500k rows',
      priority: 'High',
      tags: ['Core Engine'],
      assignee: 'KR',
      done: false,
    },
  ]);

  const handleToggleActionTask = (id: string) => {
    setActionTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafc] select-none text-xs">
      {/* Top KPI Executive Metric Ribbon */}
      <section className="px-6 py-3.5 bg-white border-b border-[#d4c0d5]/30 grid grid-cols-4 gap-6 shrink-0">
        {/* Metric 1: Total Pipeline ARR */}
        <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-[#f4f2fd]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Total Pipeline ARR
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              +14% QoQ
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-2xl font-bold text-[#1a1b22] tracking-tight">
              $540,000
            </span>
            <span className="font-mono text-[11px] text-[#837284]">weighted</span>
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
              18 deals
            </span>
            <span className="text-xs text-[#837284]">Across 5 pipeline stages</span>
          </div>
        </div>

        {/* Metric 3: Sprint Execution Velocity */}
        <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-[#f4f2fd]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Sprint Execution Velocity
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#9900c2]">
              Target 80%
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="font-mono text-2xl font-bold text-[#1a1b22] tracking-tight">
              84%
            </span>
            <div className="w-32 bg-[#eeedf7] rounded-full h-2 overflow-hidden">
              <div className="bg-[#9900c2] h-full rounded-full" style={{ width: '84%' }}></div>
            </div>
          </div>
        </div>

        {/* Metric 4: Critical Deadlines */}
        <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-[#f4f2fd]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Critical Deadlines
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              Due this week
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-mono text-2xl font-bold text-amber-600 tracking-tight">
              9 tasks
            </span>
            <span className="text-xs text-[#837284]">3 require exec review</span>
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
                  Weighted conversion metrics across qualified high-intent contracts
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[#1a1b22] bg-[#f4f2fd] px-2.5 py-1 rounded-lg border border-[#d4c0d5]/30">
                <span className="text-[#837284]">Volume:</span>
                <span>$540,000</span>
              </div>
            </div>

            {/* Composite Multi-Stage Velocity Bar */}
            <div className="w-full flex flex-col gap-2">
              <div className="h-4 w-full bg-[#eeedf7] flex overflow-hidden p-0.5 gap-0.5 border border-[#d4c0d5]/30 rounded">
                <div
                  className="bg-slate-400 h-full rounded-sm transition-all hover:opacity-90"
                  style={{ width: '15.7%' }}
                  title="Qualified Lead: $85k (15.7%)"
                ></div>
                <div
                  className="bg-sky-400 h-full rounded-sm transition-all hover:opacity-90"
                  style={{ width: '26.8%' }}
                  title="Discovery & Demo: $145k (26.8%)"
                ></div>
                <div
                  className="bg-[#9900c2] h-full rounded-sm transition-all hover:opacity-90 ring-1 ring-[#9900c2]"
                  style={{ width: '29.6%' }}
                  title="Proposal Submitted: $160k (29.6%)"
                ></div>
                <div
                  className="bg-indigo-500 h-full rounded-sm transition-all hover:opacity-90"
                  style={{ width: '20.3%' }}
                  title="Contract & Legal: $110k (20.3%)"
                ></div>
                <div
                  className="bg-emerald-500 h-full rounded-sm transition-all hover:opacity-90"
                  style={{ width: '7.4%' }}
                  title="Closed Won: $40k (7.4%)"
                ></div>
              </div>

              {/* Stage Breakout Legend */}
              <div className="grid grid-cols-5 gap-2 pt-1">
                <div className="flex flex-col p-2 rounded border border-[#d4c0d5]/30 bg-white">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="text-[11px] text-[#837284] truncate">Qualified Lead</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1a1b22] mt-1">$85,000</span>
                  <span className="font-mono text-[10px] text-[#837284]">15.7% · 5 deals</span>
                </div>

                <div className="flex flex-col p-2 rounded border border-[#d4c0d5]/30 bg-white">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span className="text-[11px] text-[#837284] truncate">Discovery</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1a1b22] mt-1">$145,000</span>
                  <span className="font-mono text-[10px] text-[#837284]">26.8% · 4 deals</span>
                </div>

                <div className="flex flex-col p-2 rounded border border-[#9900c2]/40 bg-[#f4f2fd] ring-1 ring-[#9900c2]/20 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#9900c2]"></span>
                    <span className="text-[11px] font-semibold text-[#9900c2] truncate">Proposal</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1a1b22] mt-1">$160,000</span>
                  <span className="font-mono text-[10px] text-[#9900c2] font-semibold">29.6% · 4 deals</span>
                </div>

                <div className="flex flex-col p-2 rounded border border-[#d4c0d5]/30 bg-white">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-[11px] text-[#837284] truncate">Contract &amp; Legal</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1a1b22] mt-1">$110,000</span>
                  <span className="font-mono text-[10px] text-[#837284]">20.3% · 3 deals</span>
                </div>

                <div className="flex flex-col p-2 rounded border border-[#d4c0d5]/30 bg-white">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-[#837284] truncate">Closed Won</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1a1b22] mt-1">$40,000</span>
                  <span className="font-mono text-[10px] text-[#837284]">7.4% · 2 deals</span>
                </div>
              </div>
            </div>

            {/* Bottom Stage Performance Metadata */}
            <div className="flex items-center justify-between pt-2 border-t border-[#d4c0d5]/20 font-mono text-[11px]">
              <div className="flex items-center gap-4 text-[#837284]">
                <span>
                  Avg Cycle: <strong className="text-[#1a1b22]">16.4 days</strong>
                </span>
                <span>•</span>
                <span>
                  Win Rate: <strong className="text-emerald-700">41.2%</strong>
                </span>
                <span>•</span>
                <span>
                  Speed to Demo: <strong className="text-[#1a1b22]">24 hrs</strong>
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
                  Active Matrix
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

            {/* Structured Account Rows */}
            <div className="flex flex-col divide-y divide-[#d4c0d5]/20">
              {deals.slice(0, 4).map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className="py-3 flex items-center justify-between hover:bg-[#f4f2fd]/50 px-2 rounded-lg transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#eeedf7] border border-[#d4c0d5]/40 flex items-center justify-center font-mono text-xs font-bold text-[#1a1b22]">
                      {deal.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1a1b22] group-hover:text-[#9900c2] transition-colors">
                          {deal.company}
                        </span>
                        <span className="text-[11px] text-[#837284]">
                          — {deal.title.replace(`${deal.company} — `, '')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#837284] mt-0.5">
                        <span>
                          Touchpoint: <strong className="text-[#1a1b22]">{deal.targetCloseDate.split(',')[0]} ({deal.contact.name})</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-[#837284]">description</span>
                          <span>{deal.linkedTasks.length} Deliverables linked</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#fbd7ff]/40 text-[#9900c2] border border-[#9900c2]/20 font-semibold">
                      {deal.stage}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1a1b22] w-20 text-right">
                      {deal.formattedValue}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[#837284] opacity-0 group-hover:opacity-100 transition-opacity">
                      arrow_forward
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                  3 Urgent / High
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

            <div className="flex flex-col gap-2.5">
              {actionTasks.map((at) => (
                <div
                  key={at.id}
                  className={`p-3 rounded-lg border transition-all flex flex-col gap-2 ${
                    at.done
                      ? 'bg-[#f4f2fd]/40 border-[#d4c0d5]/20'
                      : 'border-[#d4c0d5]/40 hover:border-[#9900c2]/40 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={at.done}
                        onChange={() => handleToggleActionTask(at.id)}
                        className="mt-0.5 h-4 w-4 rounded text-[#9900c2] focus:ring-[#9900c2] cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span
                          className={`text-xs font-semibold leading-tight ${
                            at.done ? 'line-through text-[#837284]' : 'text-[#1a1b22]'
                          }`}
                        >
                          {at.title}
                        </span>
                        <span className="text-[11px] text-[#837284] mt-0.5">{at.due}</span>
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[9px] px-2 py-0.5 rounded font-semibold uppercase ${
                        at.priority === 'Urgent'
                          ? 'bg-[#ffdad6] text-[#93000a]'
                          : 'bg-[#eeedf7] text-[#1a1b22]'
                      }`}
                    >
                      {at.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#d4c0d5]/20 text-xs">
                    <div className="flex items-center gap-1.5">
                      {at.tags.map((tg) => (
                        <span
                          key={tg}
                          className="px-2 py-0.5 rounded bg-[#eeedf7] font-mono text-[10px] text-[#504252]"
                        >
                          {tg}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[#1a1b22]">
                      <div className="w-5 h-5 rounded-full bg-[#9900c2] text-white flex items-center justify-center text-[9px] font-bold">
                        {at.assignee}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 4: System Audit & Real-Time Local Activity Feed */}
          <div className="bg-white rounded-xl border border-[#d4c0d5]/30 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-[#1a1b22] tracking-tight">
                  System Audit &amp; Real-Time Feed
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-[#837284]">
                <span>Sync Latency:</span>
                <span className="text-emerald-600 font-semibold">0.14ms</span>
              </div>
            </div>

            <div className="relative pl-4 border-l border-[#d4c0d5]/40 flex flex-col gap-3 py-1 text-xs">
              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#9900c2] ring-4 ring-white"></span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a1b22]">Contract Revision Dispatched</span>
                  <span className="font-mono text-[10px] text-[#837284]">2:15 PM</span>
                </div>
                <p className="text-[#504252] text-[11px]">
                  Sent revised SLA draft to Sarah Jenkins (Acme Corp attached).
                </p>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a1b22]">WAL Checkpoint Completed</span>
                  <span className="font-mono text-[10px] text-[#837284]">1:40 PM</span>
                </div>
                <p className="text-[#504252] text-[11px]">
                  42 pages committed to local embedded storage. Delta log clean.
                </p>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white"></span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a1b22]">
                    Touchpoint Logged: Architecture Sync
                  </span>
                  <span className="font-mono text-[10px] text-[#837284]">11:20 AM</span>
                </div>
                <p className="text-[#504252] text-[11px]">
                  Discovery call logged (45m) with CTO regarding multi-region tenant requirements.
                </p>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a1b22]">
                    Vector Clock Reconciliation
                  </span>
                  <span className="font-mono text-[10px] text-[#837284]">09:15 AM</span>
                </div>
                <p className="text-[#504252] text-[11px]">
                  Synced states with 2 peer replication instances. Zero conflicts detected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
