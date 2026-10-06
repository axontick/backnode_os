import React, { useState } from 'react';
import { TaskItem } from '../types';

interface GanttTimelineViewProps {
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onOpenCreateTask: () => void;
  onNavigateToView: (view: 'board' | 'list' | 'table' | 'timeline' | 'calendar' | 'docs') => void;
}

export const GanttTimelineView: React.FC<GanttTimelineViewProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateTask,
  onNavigateToView,
}) => {
  const [zoomScale, setZoomScale] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [dependenciesOn, setDependenciesOn] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string>('ENG-101');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbf8ff] overflow-hidden select-none text-xs">
      {/* Timeline Controls Toolbar */}
      <div className="h-11 px-6 bg-white/80 border-b border-[#d4c0d5]/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1a1b22] text-xs">Roadmap &amp; Gantt Schedule</span>
          <span className="font-mono text-[10px] bg-[#eeedf7] text-[#504252] px-2 py-0.5 rounded-full">
            Oct 2026 Sprint
          </span>
        </div>

        {/* Right Zoom & Canvas Macro Controls */}
        <div className="flex items-center gap-3">
          {/* Dependencies Switch Pill */}
          <button
            onClick={() => setDependenciesOn(!dependenciesOn)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eeedf7] border border-[#d4c0d5]/30 text-[#1a1b22] transition-colors"
          >
            <span className="material-symbols-outlined text-[#9900c2] text-[15px]">hub</span>
            <span className="text-xs font-medium">Dependencies</span>
            <span className="font-mono text-[10px] text-[#9900c2] font-bold">
              {dependenciesOn ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Zoom Scale Segmented Control */}
          <div className="flex items-center bg-[#eeedf7] rounded-full p-0.5 border border-[#d4c0d5]/30">
            <button
              onClick={() => setZoomScale('days')}
              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] transition-colors ${
                zoomScale === 'days' ? 'bg-white text-[#9900c2] font-bold shadow-xs' : 'text-[#504252]'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setZoomScale('weeks')}
              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] transition-colors ${
                zoomScale === 'weeks' ? 'bg-white text-[#9900c2] font-bold shadow-xs' : 'text-[#504252]'
              }`}
            >
              Weeks
            </button>
            <button
              onClick={() => setZoomScale('months')}
              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] transition-colors ${
                zoomScale === 'months' ? 'bg-white text-[#9900c2] font-bold shadow-xs' : 'text-[#504252]'
              }`}
            >
              Months
            </button>
          </div>

          {/* Quick Jump 'Today' */}
          <button
            onClick={() => {
              const el = document.getElementById('timeline-today-indicator');
              if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }}
            className="px-3 py-1 bg-[#eeedf7] hover:bg-[#e8e7f1] text-[#1a1b22] font-medium rounded-full border border-[#d4c0d5]/30 transition-colors flex items-center gap-1 text-xs"
          >
            <span className="material-symbols-outlined text-[13px]">adjust</span>
            <span>Today</span>
          </button>

          {/* Export Canvas */}
          <button
            onClick={() => alert('Exporting SVG Roadmap snapshot...')}
            className="p-1 rounded-full hover:bg-[#eeedf7] text-[#504252] hover:text-[#1a1b22] transition-colors"
            title="Export Timeline to SVG / PNG"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
          </button>
        </div>
      </div>

      {/* 2. Main Gantt / Roadmap Timeline Canvas */}
      <div className="flex-1 flex flex-row overflow-hidden relative bg-[#fafafc]">
        {/* 2A. Left Task Key & Breakdown Panel (340px width) */}
        <div className="w-[340px] shrink-0 border-r border-[#d4c0d5]/30 bg-white flex flex-col z-10 select-none">
          {/* Panel Header */}
          <div className="h-14 px-4 border-b border-[#d4c0d5]/30 flex items-center justify-between bg-[#f4f2fd]/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#9900c2] text-[18px]">checklist</span>
              <span className="text-xs font-bold text-[#1a1b22]">Tasks &amp; Milestones</span>
              <span className="font-mono text-[10px] bg-[#9900c2]/10 text-[#9900c2] font-bold px-1.5 py-0.2 rounded-full">
                7
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-[#eeedf7] rounded text-[#504252]" title="Sort Order">
                <span className="material-symbols-outlined text-[15px]">swap_vert</span>
              </button>
              <button className="p-1 hover:bg-[#eeedf7] rounded text-[#504252]" title="Collapse All">
                <span className="material-symbols-outlined text-[15px]">unfold_less</span>
              </button>
            </div>
          </div>

          {/* Task Rows Key List (Exact 54px match to Gantt rows) */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#d4c0d5]/20 custom-scrollbar">
            {/* Row 1: ENG-094 */}
            <div
              onClick={() => {
                setSelectedRow('ENG-094');
                const t = tasks.find((item) => item.id === 'ENG-094');
                if (t) onSelectTask(t);
              }}
              className="h-[54px] px-3.5 flex items-center justify-between hover:bg-[#f4f2fd]/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                  check_circle
                </span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold text-[#5f5e61]">ENG-094</span>
                    <span className="font-medium text-[#1a1b22] truncate text-xs">
                      1920x1080 Grid Tokens
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#504252] flex items-center gap-2">
                    <span>Oct 02 - Oct 08</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">Done</span>
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#eeedf7] border border-[#d4c0d5] text-[#1a1b22] font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                AW
              </div>
            </div>

            {/* Row 2: ENG-101 (Active Focus) */}
            <div
              onClick={() => {
                setSelectedRow('ENG-101');
                const t = tasks.find((item) => item.id.includes('101') || item.id === 'ENG-094');
                if (t) onSelectTask(t);
              }}
              className="h-[54px] px-3.5 flex items-center justify-between bg-[#9900c2]/5 border-l-2 border-[#9900c2] hover:bg-[#9900c2]/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-[#9900c2] text-[18px] animate-spin" style={{ animationDuration: '4s' }}>
                  autorenew
                </span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold text-[#9900c2]">ENG-101</span>
                    <span className="font-semibold text-[#1a1b22] truncate text-xs">
                      Implement local IndexedDB sync
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#504252] flex items-center gap-2">
                    <span>Oct 06 - Oct 14</span>
                    <span>•</span>
                    <span className="text-[#9900c2] font-bold">65% Progress</span>
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#fbd7ff] text-[#330043] border border-[#9900c2]/30 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                AW
              </div>
            </div>

            {/* Row 3: ENG-102 */}
            <div
              onClick={() => setSelectedRow('ENG-102')}
              className="h-[54px] px-3.5 flex items-center justify-between hover:bg-[#f4f2fd]/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">
                  visibility
                </span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold text-[#5f5e61]">ENG-102</span>
                    <span className="font-medium text-[#1a1b22] truncate text-xs">
                      Benchmark SQLite latency
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#504252] flex items-center gap-2">
                    <span>Oct 12 - Oct 18</span>
                    <span>•</span>
                    <span className="text-indigo-600 font-medium">In Review</span>
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#eeedf7] border border-[#d4c0d5] text-[#1a1b22] font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                KR
              </div>
            </div>

            {/* Row 4: ENG-104 (CRM Deal Link) */}
            <div
              onClick={() => setSelectedRow('ENG-104')}
              className="h-[54px] px-3.5 flex items-center justify-between hover:bg-[#f4f2fd]/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-amber-700 text-[18px]">
                  monetization_on
                </span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold text-[#5f5e61]">ENG-104</span>
                    <span className="font-medium text-[#1a1b22] truncate text-xs">
                      Customized SOC-2 SLA
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#504252] flex items-center gap-2">
                    <span className="text-[#835000] font-bold">Acme Corp ($75k)</span>
                    <span>•</span>
                    <span>Oct 14 - Oct 22</span>
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#eeedf7] border border-[#d4c0d5] text-[#1a1b22] font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                SJ
              </div>
            </div>

            {/* Row 5: ENG-106 */}
            <div
              onClick={() => setSelectedRow('ENG-106')}
              className="h-[54px] px-3.5 flex items-center justify-between hover:bg-[#f4f2fd]/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-[#5f5e61] text-[18px]">schedule</span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold text-[#5f5e61]">ENG-106</span>
                    <span className="font-medium text-[#1a1b22] truncate text-xs">
                      Deal-task linking hooks
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#504252] flex items-center gap-2">
                    <span>Oct 16 - Oct 24</span>
                    <span>•</span>
                    <span>Upcoming</span>
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#eeedf7] border border-[#d4c0d5] text-[#1a1b22] font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                AW
              </div>
            </div>

            {/* Row 6: ENG-105 */}
            <div
              onClick={() => setSelectedRow('ENG-105')}
              className="h-[54px] px-3.5 flex items-center justify-between hover:bg-[#f4f2fd]/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="material-symbols-outlined text-[#5f5e61] text-[18px]">
                  radio_button_unchecked
                </span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold text-[#5f5e61]">ENG-105</span>
                    <span className="font-medium text-[#1a1b22] truncate text-xs">
                      Audit memory footprint
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#504252] flex items-center gap-2">
                    <span>Oct 20 - Oct 28</span>
                    <span>•</span>
                    <span>Backlog</span>
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#eeedf7] border border-[#d4c0d5] text-[#1a1b22] font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                KR
              </div>
            </div>

            {/* Row 7: Milestone Marker */}
            <div className="h-[54px] px-3.5 flex items-center justify-between bg-[#fbd7ff]/30 hover:bg-[#fbd7ff]/40 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="material-symbols-outlined text-[#9900c2] text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  diamond
                </span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10px] font-bold text-[#9900c2]">MS-04</span>
                    <span className="font-bold text-[#1a1b22] truncate text-xs">
                      Q4 Production Release
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#9900c2] font-semibold flex items-center gap-2">
                    <span>Target: Oct 30</span>
                    <span>•</span>
                    <span className="uppercase tracking-wider">Critical Path</span>
                  </div>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#9900c2] text-white">
                All
              </div>
            </div>
          </div>

          {/* Inline Quick Add Task Action */}
          <button
            onClick={onOpenCreateTask}
            className="h-10 px-4 border-t border-[#d4c0d5]/30 flex items-center gap-2 text-[#504252] hover:text-[#9900c2] hover:bg-[#f4f2fd]/50 transition-colors text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[15px] font-bold">add</span>
            <span>Add Task to Timeline...</span>
          </button>
        </div>

        {/* 2B. Right Gantt Schedule Grid Canvas */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-white">
          {/* Date Header Matrix (Weeks and Days) */}
          <div className="h-14 border-b border-[#d4c0d5]/30 bg-white flex flex-col shrink-0 select-none min-w-[1260px]">
            {/* Top Tier: Weeks 40 to 44 */}
            <div className="h-7 flex border-b border-[#d4c0d5]/20 font-mono text-[10px] text-[#504252] font-medium">
              <div className="w-[315px] border-r border-[#d4c0d5]/20 px-3 flex items-center justify-between bg-[#f4f2fd]/40">
                <span className="font-bold text-[#1a1b22]">Week 40</span>
                <span className="text-[#837284]">Sep 28 - Oct 04</span>
              </div>
              <div className="w-[315px] border-r border-[#d4c0d5]/20 px-3 flex items-center justify-between bg-[#f4f2fd]/40">
                <span className="font-bold text-[#1a1b22]">Week 41</span>
                <span className="text-[#837284]">Oct 05 - Oct 11</span>
              </div>
              <div className="w-[315px] border-r border-[#d4c0d5]/20 px-3 flex items-center justify-between bg-[#9900c2]/5">
                <span className="font-bold text-[#9900c2]">Week 42 (Current)</span>
                <span className="text-[#9900c2] font-semibold">Oct 12 - Oct 18</span>
              </div>
              <div className="w-[315px] border-r border-[#d4c0d5]/20 px-3 flex items-center justify-between bg-[#f4f2fd]/40">
                <span className="font-bold text-[#1a1b22]">Week 43</span>
                <span className="text-[#837284]">Oct 19 - Oct 25</span>
              </div>
              <div className="w-[315px] px-3 flex items-center justify-between bg-[#f4f2fd]/40">
                <span className="font-bold text-[#1a1b22]">Week 44</span>
                <span className="text-[#837284]">Oct 26 - Nov 01</span>
              </div>
            </div>

            {/* Bottom Tier: Daily Day Columns (35 columns, 45px each) */}
            <div className="h-7 flex font-mono text-[10px] text-[#837284]">
              {/* Week 40 */}
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">28</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">29</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">30</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">01</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 font-semibold text-[#1a1b22]">02</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 bg-[#eeedf7]/40">03</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/20 bg-[#eeedf7]/40">04</div>
              {/* Week 41 */}
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">05</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 font-semibold text-[#1a1b22]">06</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">07</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">08</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">09</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 bg-[#eeedf7]/40">10</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/20 bg-[#eeedf7]/40">11</div>
              {/* Week 42 */}
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">12</div>
              {/* Oct 13: TODAY */}
              <div className="w-[45px] text-center py-1 border-r border-[#9900c2]/40 bg-[#9900c2]/10 text-[#9900c2] font-bold">13</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 font-semibold text-[#1a1b22]">14</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">15</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">16</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 bg-[#eeedf7]/40">17</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/20 bg-[#eeedf7]/40">18</div>
              {/* Week 43 */}
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">19</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">20</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">21</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">22</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">23</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 bg-[#eeedf7]/40">24</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/20 bg-[#eeedf7]/40">25</div>
              {/* Week 44 */}
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">26</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">27</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">28</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15">29</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 font-bold text-[#9900c2]">30</div>
              <div className="w-[45px] text-center py-1 border-r border-[#d4c0d5]/15 bg-[#eeedf7]/40">31</div>
              <div className="w-[45px] text-center py-1 bg-[#eeedf7]/40">01</div>
            </div>
          </div>

          {/* Schedule Canvas Body */}
          <div className="flex-1 relative overflow-hidden min-w-[1260px] h-[378px]">
            {/* Background Vertical Guidelines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-[45px] h-full border-r ${
                    i === 15
                      ? 'border-[#9900c2]/30 bg-[#9900c2]/[0.03]'
                      : i % 7 === 5 || i % 7 === 6
                      ? 'border-[#d4c0d5]/15 bg-[#eeedf7]/20'
                      : 'border-[#d4c0d5]/15'
                  }`}
                />
              ))}
            </div>

            {/* Horizontal Row Dividers (54px intervals) */}
            <div className="absolute inset-0 flex flex-col pointer-events-none divide-y divide-[#d4c0d5]/15">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-[54px] w-full" />
              ))}
            </div>

            {/* SVG DEPENDENCY CONNECTOR ARROWS */}
            {dependenciesOn && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <marker id="arrow-violet" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#9900c2" />
                  </marker>
                  <marker id="arrow-gray" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="6" refY="5" viewBox="0 0 10 10">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#837284" />
                  </marker>
                </defs>
                {/* Connector 1: ENG-094 (Row 1) -> ENG-101 (Row 2) */}
                <path d="M 495 27 C 520 27, 360 81, 380 81" fill="none" markerEnd="url(#arrow-violet)" opacity="0.85" stroke="#9900c2" strokeDasharray="3,3" strokeWidth="1.75" />
                {/* Connector 2: ENG-101 (Row 2) -> ENG-102 (Row 3) */}
                <path d="M 690 81 C 710 81, 630 135, 650 135" fill="none" markerEnd="url(#arrow-violet)" stroke="#9900c2" strokeWidth="1.75" />
                {/* Connector 3: ENG-102 (Row 3) -> ENG-106 (Row 5) */}
                <path d="M 830 135 C 860 135, 710 243, 735 243" fill="none" markerEnd="url(#arrow-gray)" opacity="0.75" stroke="#837284" strokeDasharray="4,3" strokeWidth="1.5" />
              </svg>
            )}

            {/* TODAY VERTICAL INDICATOR LINE */}
            <div
              id="timeline-today-indicator"
              className="absolute top-0 bottom-0 left-[698px] w-[2px] bg-[#9900c2] z-20 pointer-events-none flex flex-col items-center"
            >
              <div className="-mt-1.5 px-2 py-0.5 rounded-full bg-[#9900c2] text-white font-mono text-[9px] font-bold shadow-md shadow-[#9900c2]/30 flex items-center gap-1 scale-90">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                TODAY
              </div>
              <div className="w-full h-full bg-[#9900c2]/20"></div>
            </div>

            {/* GANTT BARS CONTAINER */}
            <div className="relative w-full h-full z-10">
              {/* Task 1: ENG-094 (Oct 02 - Oct 08) */}
              <div
                onClick={() => {
                  const t = tasks.find((item) => item.id === 'ENG-094');
                  if (t) onSelectTask(t);
                }}
                className="absolute top-[9px] left-[180px] w-[315px] h-[36px] bg-emerald-50 border border-emerald-300 rounded-lg shadow-xs flex items-center justify-between px-3 group hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-emerald-700 text-[16px]">check_circle</span>
                  <span className="font-semibold text-emerald-900 truncate text-xs">
                    ENG-094 • Complete
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  100%
                </span>
              </div>

              {/* Task 2: ENG-101 (Oct 06 - Oct 14) - Active Focus Electric Violet */}
              <div
                onClick={() => {
                  const t = tasks.find((item) => item.id.includes('101') || item.id === 'ENG-094');
                  if (t) onSelectTask(t);
                }}
                className="absolute top-[63px] left-[380px] w-[315px] h-[36px] bg-gradient-to-r from-[#b731e0] to-[#9900c2] rounded-lg shadow-sm border border-[#9900c2] text-white flex items-center justify-between px-3 group hover:brightness-105 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-y-0 left-0 w-[65%] bg-white/20 rounded-l-lg pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[15px] text-white">tune</span>
                  <span className="font-bold text-white truncate text-xs">
                    ENG-101 • IndexedDB Sync
                  </span>
                </div>
                <div className="relative z-10 flex items-center gap-1.5">
                  <span className="font-mono text-[10px] bg-white/25 text-white font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                    65% Active
                  </span>
                  <span className="font-mono text-[10px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.5 rounded shadow-xs">
                    Due Tom.
                  </span>
                </div>
              </div>

              {/* Task 3: ENG-102 (Oct 12 - Oct 18) */}
              <div
                className="absolute top-[117px] left-[650px] w-[225px] h-[36px] bg-indigo-50 border border-indigo-200 rounded-lg shadow-xs flex items-center justify-between px-3 group hover:border-indigo-400 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-indigo-700 text-[15px]">speed</span>
                  <span className="font-semibold text-indigo-950 truncate text-xs">
                    ENG-102 • SQLite Latency
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 font-medium px-1.5 py-0.5 rounded">
                  In Review
                </span>
              </div>

              {/* Task 4: ENG-104 (Oct 14 - Oct 22) - CRM Link */}
              <div
                className="absolute top-[171px] left-[740px] w-[290px] h-[36px] bg-amber-50 border border-amber-300 rounded-lg shadow-xs flex items-center justify-between px-3 group hover:border-amber-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-amber-700 text-[15px]">link</span>
                  <span className="font-semibold text-amber-950 truncate text-xs">
                    Acme Corp ($75k Deal Link)
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded">
                  SLA
                </span>
              </div>

              {/* Task 5: ENG-106 (Oct 16 - Oct 24) */}
              <div
                className="absolute top-[225px] left-[830px] w-[270px] h-[36px] bg-[#eeedf7] border border-[#d4c0d5]/50 rounded-lg shadow-xs flex items-center justify-between px-3 group hover:border-[#837284] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate text-[#1a1b22]">
                  <span className="material-symbols-outlined text-[#5f5e61] text-[15px]">alt_route</span>
                  <span className="font-medium truncate text-xs">ENG-106 • Deal-task linking</span>
                </div>
                <span className="font-mono text-[10px] text-[#5f5e61] bg-white px-1.5 py-0.5 rounded font-medium border border-[#d4c0d5]/40">
                  Upcoming
                </span>
              </div>

              {/* Task 6: ENG-105 (Oct 20 - Oct 28) */}
              <div
                className="absolute top-[279px] left-[965px] w-[245px] h-[36px] bg-[#f4f2fd]/60 border border-dashed border-[#d4c0d5] rounded-lg flex items-center justify-between px-3 text-[#504252] group hover:border-[#504252] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px]">memory</span>
                  <span className="truncate text-xs">ENG-105 • Memory Footprint</span>
                </div>
                <span className="font-mono text-[10px] bg-[#eeedf7] px-1.5 py-0.5 rounded">
                  Backlog
                </span>
              </div>

              {/* Milestone Marker: MS-04 Q4 Production Release (Oct 30) */}
              <div
                onClick={() => alert('Milestone: Q4 Production Release (Target Oct 30, All Teams)')}
                className="absolute top-[333px] left-[1200px] flex items-center gap-2 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#b731e0] text-white flex items-center justify-center transform rotate-45 shadow-md shadow-[#9900c2]/30 group-hover:scale-110 transition-transform">
                  <span
                    className="material-symbols-outlined text-[16px] transform -rotate-45"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    diamond
                  </span>
                </div>
                <div className="bg-white border border-[#9900c2]/40 rounded-md px-2.5 py-1 shadow-sm whitespace-nowrap">
                  <div className="font-mono text-[11px] font-bold text-[#9900c2]">
                    Oct 30 • Target Launch
                  </div>
                  <div className="font-mono text-[10px] text-[#504252]">
                    Q4 Production Release (v3.0)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom System Status & Telemetry Bar */}
      <footer className="h-9 px-6 bg-white border-t border-[#d4c0d5]/30 flex items-center justify-between shrink-0 font-mono text-[11px] text-[#504252]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#1a1b22] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>IndexedDB Cache: Synchronized</span>
          </div>
          <span className="text-[#d4c0d5]">•</span>
          <span className="text-[#5f5e61]">E2E Encryption: AES-256-GCM</span>
          <span className="text-[#d4c0d5]">•</span>
          <span>7 tasks on timeline</span>
          <span className="text-[#d4c0d5]">•</span>
          <span className="text-[#9900c2] font-semibold">2 active dependencies</span>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#9900c2]/10 text-[#9900c2] border border-[#9900c2]/20 font-semibold">
          <span className="material-symbols-outlined text-[13px]">flag</span>
          <span>Critical Path: Active (Zero Slacks)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 bg-[#eeedf7] rounded border border-[#d4c0d5]/40 text-[#1a1b22] font-bold">
              T
            </kbd>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 bg-[#eeedf7] rounded border border-[#d4c0d5]/40 text-[#1a1b22] font-bold">
              W
            </kbd>
            <span>Week</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 bg-[#eeedf7] rounded border border-[#d4c0d5]/40 text-[#1a1b22] font-bold">
              D
            </kbd>
            <span>Dependency</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
