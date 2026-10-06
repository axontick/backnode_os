import React, { useState } from 'react';

interface DocsCanvasViewProps {
  onNavigateToTasks: () => void;
  onOpenCreateTask: () => void;
}

export const DocsCanvasView: React.FC<DocsCanvasViewProps> = ({
  onNavigateToTasks,
  onOpenCreateTask,
}) => {
  const [activeSection, setActiveSection] = useState('summary');
  const [tasks, setTasks] = useState([
    {
      id: 'dt-1',
      title: 'Finalize database schema migration scripts',
      done: true,
      status: 'Completed',
      assignee: 'AW',
      priority: 'Normal',
      due: 'Yesterday',
    },
    {
      id: 'dt-2',
      title: 'Perform cold-boot latency benchmark (<10ms)',
      done: false,
      status: 'In Progress',
      assignee: 'AR',
      priority: 'Urgent',
      due: 'Due Tomorrow',
    },
    {
      id: 'dt-3',
      title: 'Generate PDF export templates for client deliverables',
      done: false,
      status: 'Pending',
      assignee: 'TC',
      priority: 'Medium',
      due: 'Due Oct 20',
    },
  ]);

  const [activeRightPanel, setActiveRightPanel] = useState<'contacts' | 'activity' | 'versions' | 'comments' | null>(null);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#fafafc] select-none text-xs">
      {/* 1. Left Table of Contents / Outline Rail (230px fixed) */}
      <aside className="w-[230px] shrink-0 border-r border-[#d4c0d5]/30 p-5 bg-white/80 backdrop-blur-sm overflow-y-auto custom-scrollbar flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#837284] font-semibold">
              Document Outline
            </span>
            <span className="font-mono text-[10px] text-[#837284]">5 sections</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'summary', title: '1. Executive Summary' },
              { id: 'directives', title: '2. Architecture Directives' },
              { id: 'tasks', title: '3. Embedded Task Matrix', count: tasks.length },
              { id: 'sla', title: '4. Enterprise SLA Tiers' },
              { id: 'security', title: '5. Local Security' },
            ].map((sec) => {
              const isActive = activeSection === sec.id;

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    isActive
                      ? 'bg-[#f4f2fd] text-[#9900c2] font-semibold border-l-2 border-[#9900c2]'
                      : 'text-[#504252] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
                  }`}
                >
                  <span className="truncate">{sec.title}</span>
                  {sec.count && (
                    <span className="font-mono text-[10px] bg-[#eeedf7] px-1 rounded text-[#837284]">
                      {sec.count}
                    </span>
                  )}
                  {isActive && !sec.count && (
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Document Analytics Micro Capsule */}
        <div className="p-3 bg-[#f4f2fd]/70 rounded-xl border border-[#d4c0d5]/30 space-y-2 mt-6">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-[#837284]">Engine Footprint</span>
            <span className="font-semibold text-[#1a1b22]">142 KB</span>
          </div>
          <div className="w-full bg-[#d4c0d5]/30 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#9900c2] h-full rounded-full" style={{ width: '24%' }}></div>
          </div>
          <p className="font-mono text-[10px] text-[#837284] leading-tight">
            Local storage synchronized across 2 peering nodes
          </p>
        </div>
      </aside>

      {/* 2. Central Editorial Reading & Writing Canvas */}
      <section className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 flex justify-center bg-[#fafafc]">
        <article className="max-w-[860px] w-full bg-white border border-[#d4c0d5]/30 rounded-2xl p-10 shadow-sm space-y-8 my-auto">
          {/* Document Header */}
          <div className="border-b border-[#d4c0d5]/30 pb-6 space-y-3.5">
            {/* Badges Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Status: Approved
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-[#eeedf7] text-[#504252] border border-[#d4c0d5]/30">
                  <span className="material-symbols-outlined text-[13px]">security</span>
                  SOC2 Compliant Local Spec
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#837284]">
                <button
                  onClick={() => alert('Document bookmarked.')}
                  className="p-1 rounded hover:bg-[#eeedf7] hover:text-[#1a1b22]"
                >
                  <span className="material-symbols-outlined text-[18px]">bookmark</span>
                </button>
                <button
                  onClick={() => alert('Doc export options.')}
                  className="p-1 rounded hover:bg-[#eeedf7] hover:text-[#1a1b22]"
                >
                  <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                </button>
              </div>
            </div>

            {/* Document Title */}
            <h1 className="text-2xl font-bold text-[#1a1b22] tracking-tight">
              Q4 Enterprise Deliverables &amp; SLA Blueprint
            </h1>

            {/* Meta Row */}
            <div className="flex items-center gap-3 text-xs text-[#837284] flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#1a1b22] text-white text-[9px] font-mono flex items-center justify-center font-bold">
                  AR
                </div>
                <span className="font-semibold text-[#1a1b22]">Alex Rivera (Lead Architect)</span>
              </div>
              <span>·</span>
              <span>Oct 05, 2026</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                <span>4 min read</span>
              </span>
              <span>·</span>
              <span className="font-mono text-[10px] bg-[#f4f2fd] text-[#9900c2] px-2 py-0.5 rounded border border-[#d4c0d5]/40 font-semibold">
                Cloud Node: node-eu-fra-01
              </span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1a1b22]">1. Executive Summary</h2>
            <p className="text-xs text-[#504252] leading-relaxed">
              This document defines the high-availability commitment and core execution milestones for Backnode&apos;s Q4 Enterprise Cluster rollouts. Designed explicitly for zero-latency, local-first workflow execution, our nodes maintain state synchronization via distributed WAL (Write-Ahead Logging) protocols without blocking user thread execution.
            </p>
            <p className="text-xs text-[#504252] leading-relaxed">
              Client-side state remains immutable and verified by cryptographic hashes prior to replication upstream. All mission-critical queries—including pipeline forecasting, real-time board mutations, and rich documentation indexing—execute directly against in-memory local caches with guaranteed sub-10 millisecond read boundaries.
            </p>
          </section>

          {/* Section 2: Architecture Directive Callout Box */}
          <section>
            <div className="bg-[#f4f2fd] border-l-4 border-[#9900c2] p-4 rounded-r-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[#9900c2] font-semibold text-xs">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Zero Cloud Dependency Mandate</span>
              </div>
              <p className="text-xs text-[#1a1b22] leading-relaxed">
                All customer records, sales deals, and sprint tasks remain strictly local on device in high-performance local storage with instantaneous zero-latency reads. Network connectivity failures must never pause, degrade, or prompt the operator for confirmation.
              </p>
            </div>
          </section>

          {/* Section 3: Live Embedded Task Block */}
          <section className="space-y-3.5">
            <div className="border border-[#d4c0d5]/30 rounded-xl p-5 bg-white shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-[#d4c0d5]/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#9900c2] text-[20px]">
                    check_circle
                  </span>
                  <h3 className="font-semibold text-xs text-[#1a1b22]">
                    Linked Action Items ({tasks.length})
                  </h3>
                  <span className="font-mono text-[10px] bg-[#eeedf7] px-2 py-0.5 rounded text-[#504252]">
                    Sprint 14
                  </span>
                </div>
                <button
                  onClick={onOpenCreateTask}
                  className="bg-[#9900c2]/10 hover:bg-[#9900c2]/20 text-[#9900c2] px-3 py-1 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>+ Add Task</span>
                </button>
              </div>

              {/* Task Checklist Items */}
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      task.done
                        ? 'bg-[#f4f2fd]/60 border-[#d4c0d5]/20'
                        : 'bg-white border-[#d4c0d5]/30 hover:border-[#9900c2]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-4 h-4 rounded text-[#9900c2] focus:ring-[#9900c2] border-[#837284] cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          task.done ? 'line-through text-[#837284]' : 'font-medium text-[#1a1b22]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      {task.done ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Completed
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            task.priority === 'Urgent'
                              ? 'bg-[#fbd7ff] text-[#330043] border-[#9900c2]/20 font-semibold'
                              : 'bg-[#ffddba] text-[#835000] border-[#a56600]/20'
                          }`}
                        >
                          Priority: {task.priority}
                        </span>
                      )}
                      <span className="text-[#837284]">{task.due}</span>
                      <div className="w-5 h-5 rounded-full bg-[#eeedf7] text-[#1b1b1e] text-[9px] flex items-center justify-center font-bold">
                        {task.assignee}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: SLA Matrix Table */}
          <section className="space-y-3">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-[#1a1b22]">4. Enterprise SLA Tiers</h2>
              <p className="text-xs text-[#837284]">
                Contractual uptime obligations and failover escalation channels.
              </p>
            </div>

            <div className="border border-[#d4c0d5]/30 rounded-xl overflow-hidden bg-white text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f4f2fd] border-b border-[#d4c0d5]/30 font-mono text-[10px] text-[#837284] uppercase">
                    <th className="py-2.5 px-3.5 font-semibold">Tier Classification</th>
                    <th className="py-2.5 px-3.5 font-semibold">Uptime Target</th>
                    <th className="py-2.5 px-3.5 font-semibold">Support Response</th>
                    <th className="py-2.5 px-3.5 font-semibold">Engine Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d4c0d5]/20">
                  <tr className="hover:bg-[#f4f2fd]/40">
                    <td className="py-2.5 px-3.5 font-medium text-[#1a1b22] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#9900c2]"></span>
                      Tier 1 Mission Critical
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-[#1a1b22]">99.999%</td>
                    <td className="py-2.5 px-3.5 font-mono text-emerald-700 bg-emerald-50/50">&lt; 15 min</td>
                    <td className="py-2.5 px-3.5 text-[#504252]">Active-Active Local Sync</td>
                  </tr>
                  <tr className="hover:bg-[#f4f2fd]/40">
                    <td className="py-2.5 px-3.5 font-medium text-[#1a1b22] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#5f5e61]"></span>
                      Tier 2 Standard
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-[#1a1b22]">99.95%</td>
                    <td className="py-2.5 px-3.5 font-mono text-[#504252]">&lt; 2 hr</td>
                    <td className="py-2.5 px-3.5 text-[#504252]">Asynchronous Edge Replica</td>
                  </tr>
                  <tr className="hover:bg-[#f4f2fd]/40">
                    <td className="py-2.5 px-3.5 font-medium text-[#1a1b22] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#d4c0d5]"></span>
                      Tier 3 Batch Sync
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-[#1a1b22]">99.5%</td>
                    <td className="py-2.5 px-3.5 font-mono text-[#504252]">&lt; 12 hr</td>
                    <td className="py-2.5 px-3.5 text-[#504252]">Interval Backup WAL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Document Footer */}
          <footer className="pt-4 border-t border-[#d4c0d5]/30 flex items-center justify-between text-xs text-[#837284]">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span>Word count: 1,420 words · Revision #14 · Encrypted on disk (AES-256-GCM)</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Deterministic Peer Hash: 9f8e...3b12</span>
            </div>
          </footer>
        </article>
      </section>

      {/* 3. Right Quick Context Shelf (72px collapsed) */}
      <aside className="w-[72px] shrink-0 border-l border-[#d4c0d5]/30 bg-white flex flex-col items-center py-4 space-y-3">
        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'contacts' ? null : 'contacts')}
          className={`p-2 rounded-lg transition-colors ${
            activeRightPanel === 'contacts'
              ? 'bg-[#f4f2fd] text-[#9900c2]'
              : 'text-[#837284] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
          }`}
          title="Linked CRM Contacts"
        >
          <span className="material-symbols-outlined text-[20px]">contacts</span>
        </button>

        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'activity' ? null : 'activity')}
          className={`p-2 rounded-lg transition-colors ${
            activeRightPanel === 'activity'
              ? 'bg-[#f4f2fd] text-[#9900c2]'
              : 'text-[#837284] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
          }`}
          title="Activity Logs"
        >
          <span className="material-symbols-outlined text-[20px]">dataset</span>
        </button>

        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'versions' ? null : 'versions')}
          className={`p-2 rounded-lg transition-colors ${
            activeRightPanel === 'versions'
              ? 'bg-[#f4f2fd] text-[#9900c2]'
              : 'text-[#837284] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
          }`}
          title="Versions & Diffs"
        >
          <span className="material-symbols-outlined text-[20px]">difference</span>
        </button>

        <div className="w-6 h-px bg-[#d4c0d5]/40"></div>

        <button
          onClick={() => setActiveRightPanel(activeRightPanel === 'comments' ? null : 'comments')}
          className={`p-2 rounded-lg transition-colors ${
            activeRightPanel === 'comments'
              ? 'bg-[#f4f2fd] text-[#9900c2]'
              : 'text-[#837284] hover:text-[#1a1b22] hover:bg-[#eeedf7]'
          }`}
          title="Comments"
        >
          <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
        </button>

        <div className="flex-1"></div>

        <div className="flex flex-col items-center gap-1 font-mono text-[9px] text-[#837284]">
          <span className="w-2 h-2 rounded-full bg-[#9900c2] animate-pulse"></span>
          <span>SYNC</span>
        </div>
      </aside>
    </div>
  );
};
