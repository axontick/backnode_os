import React, { useState } from 'react';
import { TaskItem } from '../types';

interface MonthlyCalendarViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onOpenCreateTask: () => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
}

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateTask,
  onNavigateToView,
}) => {
  const [showOct14Preview, setShowOct14Preview] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(14);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbf8ff] overflow-hidden select-none text-xs">
      {/* Calendar Controls & Month Switcher Bar */}
      <div className="px-6 py-2 bg-white/80 border-b border-[#d4c0d5]/30 flex items-center justify-between shrink-0 h-11">
        {/* Left: View Title & Record Count */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1a1b22] text-xs">Milestones &amp; Calendar Schedule</span>
          <span className="font-mono text-[10px] bg-[#eeedf7] text-[#504252] px-2 py-0.5 rounded-full">
            34 deliverables
          </span>
        </div>

        {/* Right: Month Controls & Action */}
        <div className="flex items-center gap-3">
          {/* Month Navigation Capsule */}
          <div className="flex items-center bg-white border border-[#d4c0d5]/40 rounded-full px-2 py-0.5 shadow-sm">
            <button className="p-1 hover:bg-[#eeedf7] text-[#504252] hover:text-[#1a1b22] rounded-full transition-colors flex items-center">
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="font-bold px-2.5 tracking-tight text-[#1a1b22] font-mono text-[11px]">
              October 2026
            </span>
            <button className="p-1 hover:bg-[#eeedf7] text-[#504252] hover:text-[#1a1b22] rounded-full transition-colors flex items-center">
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedDay(14)}
            className="px-2.5 py-1 text-xs font-medium border border-[#d4c0d5]/40 bg-white hover:bg-[#eeedf7] rounded-full shadow-sm text-[#1a1b22] transition-colors"
          >
            Today
          </button>

          <div className="h-4 w-px bg-[#d4c0d5]/40"></div>

          {/* Filter Dropdowns */}
          <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-[#d4c0d5]/40 bg-white hover:bg-[#eeedf7] rounded-full shadow-sm text-[#504252] transition-colors">
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span>Assignee: <strong className="text-[#1a1b22] font-semibold">All</strong></span>
            <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-[#d4c0d5]/40 bg-white hover:bg-[#eeedf7] rounded-full shadow-sm text-[#504252] transition-colors">
            <span>Type: <strong className="text-[#1a1b22] font-semibold">Tasks &amp; Milestones</strong></span>
            <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 bg-[#9900c2] hover:bg-[#b731e0] text-white font-medium text-xs px-3.5 py-1.5 rounded-full shadow-sm active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Sub-header Day Columns Legend */}
      <div className="grid grid-cols-7 border-b border-[#d4c0d5]/30 bg-white text-center font-mono text-[10px] font-semibold tracking-wider text-[#5f5e61] py-2 shrink-0">
        <div>MON</div>
        <div>TUE</div>
        <div>WED</div>
        <div>THU</div>
        <div>FRI</div>
        <div className="text-[#837284]">SAT</div>
        <div className="text-[#837284]">SUN</div>
      </div>

      {/* 2. Monthly Calendar Grid (5 Weeks x 7 Columns) */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-[#d4c0d5]/30 p-px overflow-hidden relative">
        {/* WEEK 1: Sep 28 - Oct 4 */}
        <div className="bg-[#f4f2fd]/40 p-2 flex flex-col justify-between opacity-50">
          <span className="font-mono text-[11px] text-[#5f5e61]">28</span>
        </div>
        <div className="bg-[#f4f2fd]/40 p-2 flex flex-col justify-between opacity-50">
          <span className="font-mono text-[11px] text-[#5f5e61]">29</span>
        </div>
        <div className="bg-[#f4f2fd]/40 p-2 flex flex-col justify-between opacity-50">
          <span className="font-mono text-[11px] text-[#5f5e61]">30</span>
        </div>
        {/* Thu Oct 1 */}
        <div className="bg-white p-2 flex flex-col gap-1.5 group hover:bg-[#f4f2fd]/20 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">01</span>
            <span className="text-[10px] font-mono text-[#5f5e61] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              + Add
            </span>
          </div>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="truncate font-medium text-[#1a1b22]">Sprint 14 Planning</span>
          </div>
        </div>
        {/* Fri Oct 2 */}
        <div className="bg-white p-2 flex flex-col gap-1.5 group hover:bg-[#f4f2fd]/20 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">02</span>
          </div>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9900c2]"></span>
            <span className="truncate font-medium text-[#1a1b22]">BN-99: Local WAL Setup</span>
          </div>
        </div>
        {/* Sat Oct 3 & Sun Oct 4 */}
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">03</span>
        </div>
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">04</span>
        </div>

        {/* WEEK 2: Oct 5 - Oct 11 */}
        {/* Mon Oct 5 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">05</span>
          <div className="px-2 py-1 rounded bg-amber-50/80 border border-amber-200 text-[11px] text-[#835000] flex items-center gap-1.5 cursor-pointer">
            <span>💰</span>
            <span className="truncate font-medium">Venture Capital Demo</span>
          </div>
        </div>
        {/* Tue Oct 6 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">06</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="truncate font-medium text-[#1a1b22]">BN-102: Token Refresh</span>
          </div>
        </div>
        {/* Wed Oct 7 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">07</span>
        </div>
        {/* Thu Oct 8 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">08</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span className="truncate font-medium text-[#1a1b22]">BN-112: OAuth2 Migration</span>
          </div>
        </div>
        {/* Fri Oct 9 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">09</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="truncate font-medium text-[#1a1b22]">BN-104: Stripe Webhook</span>
          </div>
          <div className="px-1.5 py-0.5 rounded bg-[#eeedf7] text-[10px] text-[#5f5e61] font-mono w-fit">
            +1 more
          </div>
        </div>
        {/* Sat Oct 10 & Sun Oct 11 */}
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">10</span>
        </div>
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">11</span>
        </div>

        {/* WEEK 3: Oct 12 - Oct 18 (Includes TODAY Oct 14) */}
        {/* Mon Oct 12 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">12</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="truncate font-medium text-[#1a1b22]">BN-106: Schema Sync</span>
          </div>
        </div>
        {/* Tue Oct 13 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">13</span>
          <div className="px-2 py-1 rounded bg-amber-50/80 border border-amber-200 text-[11px] text-[#835000] flex items-center gap-1 cursor-pointer">
            <span>📞</span>
            <span className="truncate font-medium">GlobalBank Security Review</span>
          </div>
        </div>

        {/* Wed Oct 14: TODAY CELL (Highlighted with Electric Violet glow + preview card) */}
        <div
          onClick={() => setShowOct14Preview(!showOct14Preview)}
          className="bg-white p-2 flex flex-col gap-1.5 relative ring-2 ring-[#9900c2] ring-offset-1 z-10 rounded shadow-md cursor-pointer"
        >
          {/* Date Header with Violet Today Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[12px] font-bold text-[#9900c2]">14</span>
              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#9900c2] text-white">
                TODAY
              </span>
            </div>
            <span className="material-symbols-outlined text-[15px] text-[#9900c2]">flag</span>
          </div>

          {/* Deliverables inside Oct 14 */}
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2] cursor-pointer shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9900c2]"></span>
            <span className="truncate font-semibold text-[#1a1b22]">BN-99: Local WAL Setup</span>
          </div>
          <div className="px-2 py-1 rounded bg-amber-100/90 border border-amber-300 text-[11px] text-[#2b1700] font-semibold flex items-center gap-1 cursor-pointer shadow-xs">
            <span>💰</span>
            <span className="truncate">Acme Corp $180k Close Target</span>
          </div>
          <div className="px-1.5 py-0.5 rounded bg-[#e8e7f1] text-[10px] text-[#504252] font-mono w-fit font-medium">
            +3 more tasks
          </div>

          {/* INTERACTIVE DETAIL HOVER PREVIEW CARD FLOATING OVER OCT 14 */}
          {showOct14Preview && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute left-6 top-12 w-[340px] bg-white border border-[#d4c0d5]/50 rounded-xl shadow-2xl p-4 z-40 pointer-events-auto animate-in fade-in zoom-in-95"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between pb-2 border-b border-[#d4c0d5]/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#9900c2] bg-[#fbd7ff]/40 px-2 py-0.5 rounded font-semibold">
                      BN-108
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="font-mono text-[10px] text-[#5f5e61]">In Execution</span>
                  </div>
                  <h4 className="text-[14px] font-bold text-[#1a1b22] mt-1">
                    Multi-tenant RBAC Policy Enforcement
                  </h4>
                </div>
                <button
                  onClick={() => setShowOct14Preview(false)}
                  className="text-[#5f5e61] hover:text-[#1a1b22]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Assignees & Progress */}
              <div className="py-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#504252]">Assignees</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#9900c2] text-white font-mono text-[9px] flex items-center justify-center font-bold">
                        AW
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#2f3038] text-white font-mono text-[9px] flex items-center justify-center font-bold">
                        SJ
                      </div>
                    </div>
                    <span className="text-[12px] text-[#1a1b22] font-medium">Alex W., Sarah J.</span>
                  </div>
                </div>

                {/* Subtask progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#504252]">Subtasks completed</span>
                    <span className="text-[#1a1b22] font-semibold">3 / 4 (75%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#eeedf7] rounded-full overflow-hidden">
                    <div className="h-full bg-[#9900c2] w-3/4 rounded-full"></div>
                  </div>
                </div>

                {/* Linked Deal */}
                <div className="p-2 rounded-lg bg-[#f4f2fd] border border-[#d4c0d5]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-700 text-[18px]">
                      verified
                    </span>
                    <div>
                      <div className="text-[11px] text-[#504252]">Linked CRM Milestone</div>
                      <div className="text-[12px] font-bold text-[#1a1b22]">Acme Corp ($180k)</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-amber-900 font-bold bg-amber-200/60 px-2 py-0.5 rounded">
                    P0 Stage
                  </span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 border-t border-[#d4c0d5]/20 flex items-center gap-2">
                <button
                  onClick={() => alert('Deliverable BN-108 marked as complete!')}
                  className="flex-1 py-1 px-2.5 rounded bg-[#9900c2] text-white text-xs font-medium hover:bg-[#b731e0] text-center transition-colors"
                >
                  Complete
                </button>
                <button
                  onClick={() => alert('Rescheduling tool opened for Oct 14 milestone.')}
                  className="py-1 px-2.5 rounded border border-[#d4c0d5]/40 bg-white hover:bg-[#eeedf7] text-[#1a1b22] text-xs transition-colors"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => {
                    const t = tasks.find((item) => item.id.includes('108') || item.id === 'ENG-094');
                    if (t) onSelectTask(t);
                  }}
                  className="p-1 rounded border border-[#d4c0d5]/40 bg-white hover:bg-[#eeedf7] text-[#504252] hover:text-[#1a1b22] transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Thu Oct 15 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">15</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="truncate font-medium text-[#1a1b22]">BN-115: Index Profiling</span>
          </div>
        </div>

        {/* Fri Oct 16 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">16</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5f5e61]"></span>
            <span className="truncate font-medium text-[#1a1b22]">Sprint 14 Retro</span>
          </div>
        </div>

        {/* Sat Oct 17 & Sun Oct 18 */}
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">17</span>
        </div>
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">18</span>
        </div>

        {/* WEEK 4: Oct 19 - Oct 25 (Multi-day continuous bar: Oct 19 to Oct 22) */}
        <div className="bg-white p-2 flex flex-col justify-between relative">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">19</span>
          <div className="h-6"></div>
        </div>
        <div className="bg-white p-2 flex flex-col justify-between relative">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">20</span>
          <div className="h-6"></div>
        </div>
        <div className="bg-white p-2 flex flex-col justify-between relative">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">21</span>
          <div className="h-6"></div>
        </div>
        <div className="bg-white p-2 flex flex-col justify-between relative">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">22</span>
          <div className="h-6"></div>
        </div>

        {/* Multi-Day Span Deliverable Overlay across Oct 19 - 22 (columns 1 to 4 in row 4) */}
        <div
          style={{
            background:
              'repeating-linear-gradient(-45deg, rgba(183, 49, 224, 0.12), rgba(183, 49, 224, 0.12) 8px, rgba(183, 49, 224, 0.22) 8px, rgba(183, 49, 224, 0.22) 16px)',
          }}
          className="absolute left-1 right-[calc(42.85%+4px)] bottom-[calc(20%+14px)] h-8 border border-[#9900c2]/40 rounded-lg flex items-center justify-between px-3 shadow-xs pointer-events-auto z-20 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#b731e0]"></span>
            <span className="text-xs font-bold text-[#1a1b22]">
              Sprint 14 Code Freeze &amp; Automated QA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#9900c2] font-semibold bg-white/80 px-2 py-0.5 rounded">
              CRITICAL MILESTONE
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#9900c2]">flag</span>
          </div>
        </div>

        {/* Fri Oct 23 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">23</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="truncate font-medium text-[#1a1b22]">BN-120: v2.5 Release Tag</span>
          </div>
        </div>
        {/* Sat Oct 24 & Sun Oct 25 */}
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">24</span>
        </div>
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">25</span>
        </div>

        {/* WEEK 5: Oct 26 - Nov 1 */}
        {/* Mon Oct 26 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">26</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="truncate font-medium text-[#1a1b22]">Sprint 15 Kickoff</span>
          </div>
        </div>
        {/* Tue Oct 27 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">27</span>
        </div>
        {/* Wed Oct 28 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">28</span>
          <div className="px-2 py-1 rounded bg-amber-50/80 border border-amber-200 text-[11px] text-[#835000] flex items-center gap-1 cursor-pointer">
            <span>🤝</span>
            <span className="truncate font-medium">Partner Integration Review</span>
          </div>
        </div>
        {/* Thu Oct 29 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">29</span>
        </div>
        {/* Fri Oct 30 */}
        <div className="bg-white p-2 flex flex-col gap-1 group hover:bg-[#f4f2fd]/20 transition-colors">
          <span className="font-mono text-[11px] font-semibold text-[#1a1b22]">30</span>
          <div className="px-2 py-1 rounded bg-[#fbf8ff] border border-[#d4c0d5]/30 text-[11px] flex items-center gap-1.5 hover:border-[#9900c2]/40 cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9900c2]"></span>
            <span className="truncate font-medium text-[#1a1b22]">BN-99: Local WAL Setup</span>
          </div>
        </div>
        {/* Sat Oct 31 & Sun Nov 1 */}
        <div className="bg-white/80 p-2 flex flex-col justify-between">
          <span className="font-mono text-[11px] text-[#837284]">31</span>
        </div>
        <div className="bg-[#f4f2fd]/40 p-2 flex flex-col justify-between opacity-50">
          <span className="font-mono text-[11px] text-[#5f5e61]">01</span>
        </div>
      </div>

      {/* 3. Bottom Status & Velocity Ribbon (KPIs + Shortcuts) */}
      <footer className="h-11 bg-white border-t border-[#d4c0d5]/30 px-6 flex items-center justify-between shrink-0 font-mono text-[11px] z-20">
        {/* Metrics Cluster */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#b731e0]"></span>
            <span className="text-[#1a1b22] font-semibold">34 Deliverables Scheduled</span>
          </div>
          <div className="h-3 w-px bg-[#d4c0d5]/40"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-800 font-semibold">8 CRM Milestones</span>
          </div>
          <div className="h-3 w-px bg-[#d4c0d5]/40"></div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span className="text-rose-700 font-semibold">4 P0 Due This Week</span>
          </div>
          <div className="h-3 w-px bg-[#d4c0d5]/40"></div>
          <div className="flex items-center gap-2 text-[#5f5e61]">
            <span className="material-symbols-outlined text-[13px] text-emerald-600">bolt</span>
            <span>Local Sync: <strong className="text-[#1a1b22]">Instantaneous</strong></span>
            <span className="text-[#d4c0d5]">|</span>
            <span>Query Engine: <strong className="text-[#1a1b22] font-mono">0.12ms</strong> latency</span>
          </div>
        </div>

        {/* Keyboard shortcuts hints */}
        <div className="flex items-center gap-4 text-[#504252] font-mono text-[11px]">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#eeedf7] text-[#1a1b22] border border-[#d4c0d5]/30 shadow-xs">
              T
            </kbd>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#eeedf7] text-[#1a1b22] border border-[#d4c0d5]/30 shadow-xs">
              M
            </kbd>
            <span>Month</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#eeedf7] text-[#1a1b22] border border-[#d4c0d5]/30 shadow-xs">
              W
            </kbd>
            <span>Week</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#eeedf7] text-[#1a1b22] border border-[#d4c0d5]/30 shadow-xs">
              C
            </kbd>
            <span>New Event</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
