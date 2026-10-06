import React, { useState } from 'react';
import { CrmDeal, CrmPipeline } from '../types';

interface PipelineWinLossViewProps {
  pipeline: CrmPipeline;
  deals: CrmDeal[];
  onBackToBoard: () => void;
  onOpenNewDeal: () => void;
  onSelectDeal: (deal: CrmDeal) => void;
}

export const PipelineWinLossView: React.FC<PipelineWinLossViewProps> = ({
  pipeline,
  deals,
  onBackToBoard,
  onOpenNewDeal,
  onSelectDeal,
}) => {
  const [filterQuarter, setFilterQuarter] = useState<'Q4 2026' | 'Q3 2026' | 'All Time'>('Q4 2026');

  // Closed Won Deals
  const wonDeals = deals.filter((d) => d.stage === 'Closed Won');
  const wonArr = wonDeals.reduce((sum, d) => sum + d.value, 0) || 125000;
  
  // Simulated Closed Lost deals for rich retrospective matrix
  const lostDeals = [
    {
      id: 'DEAL-L01',
      title: 'Global Telemetry Sync Engine',
      company: 'OmniVanguard Inc.',
      value: 85000,
      stage: 'Closed Lost' as const,
      competitor: 'Salesforce CRM Enterprise',
      primaryReason: 'Incumbent contract lock-in through 2027',
      owner: 'Sarah Jenkins',
      cycleDays: 24,
      date: 'Oct 02, 2026',
    },
    {
      id: 'DEAL-L02',
      title: 'Local-First POS Terminal Migration',
      company: 'RetailHub Systems',
      value: 40000,
      stage: 'Closed Lost' as const,
      competitor: 'HubSpot Sales Hub',
      primaryReason: 'Required custom hardware peripheral driver',
      owner: 'Alex Wong',
      cycleDays: 14,
      date: 'Sep 27, 2026',
    },
    {
      id: 'DEAL-L03',
      title: 'Cloud Compliance Gateway',
      company: 'AeroDefense Labs',
      value: 65000,
      stage: 'Closed Lost' as const,
      competitor: 'Internal In-House Tool',
      primaryReason: 'Security team delayed third-party audit clearance',
      owner: 'Ken Ray',
      cycleDays: 31,
      date: 'Sep 18, 2026',
    },
  ];

  const lostArr = lostDeals.reduce((sum, d) => sum + d.value, 0);
  const totalClosed = wonArr + lostArr;
  const winRate = totalClosed > 0 ? Math.round((wonArr / totalClosed) * 100) : 68;

  const competitors = [
    { name: 'Salesforce Enterprise', won: 4, lost: 1, winRate: 80 },
    { name: 'HubSpot Sales Hub', won: 5, lost: 1, winRate: 83 },
    { name: 'Linear / Jira CRM', won: 3, lost: 0, winRate: 100 },
    { name: 'Internal DIY Stack', won: 2, lost: 1, winRate: 67 },
  ];

  const lossReasons = [
    { reason: 'Budget & Procurement Freeze', pct: 40, count: 4, color: 'bg-rose-500' },
    { reason: 'Legacy Contract Multi-year Lock-in', pct: 30, count: 3, color: 'bg-amber-500' },
    { reason: 'Hardware / Legacy Driver Gap', pct: 20, count: 2, color: 'bg-blue-500' },
    { reason: 'Extended Security Audit Timeline', pct: 10, count: 1, color: 'bg-zinc-400' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafc] overflow-y-auto select-none p-6 text-xs custom-scrollbar">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${pipeline.color || '#9900c2'}15`,
                color: pipeline.color || '#9900c2',
                borderColor: `${pipeline.color || '#9900c2'}30`,
              }}
            >
              {pipeline.name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px] text-[#5f5e61]">Pipeline Win/Loss Analytics</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a1b22] tracking-tight">
            Win/Loss Velocity &amp; Attribution
          </h1>
          <p className="text-xs text-[#504252] mt-1 max-w-2xl leading-relaxed">
            Win conversion attribution, lost deal retrospectives, competitor head-to-head benchmarks, and drop-off stage analysis for {pipeline.name}.
          </p>
        </div>

        {/* Action Controls Cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center rounded-xl border border-[#d4c0d5]/50 bg-white p-1 shadow-xs">
            {(['Q4 2026', 'Q3 2026', 'All Time'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setFilterQuarter(q)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterQuarter === q
                    ? 'bg-[#9900c2] text-white shadow-xs'
                    : 'text-[#504252] hover:text-[#1a1b22]'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={onBackToBoard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#d4c0d5]/50 bg-white hover:bg-[#f4f2fd] hover:border-[#9900c2]/40 text-[#1a1b22] font-semibold text-xs transition-all active:scale-[0.98] shadow-xs"
          >
            <span className="material-symbols-outlined text-[17px] text-[#9900c2]">view_kanban</span>
            <span>Pipeline Board</span>
          </button>

          <button
            onClick={onOpenNewDeal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-sm shadow-[#9900c2]/25"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            <span>+ New Deal</span>
          </button>
        </div>
      </div>

      {/* 2. Bento KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Win Rate */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Win Rate Percentage
            </span>
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              ★
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">{winRate}% Won</div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#504252]">
              <span className="text-emerald-700 font-semibold">+4.2% QoQ Target</span>
              <span>•</span>
              <span>Industry benchmark 45%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Won Revenue ARR */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Closed Won Revenue
            </span>
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-[#9900c2] flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">verified</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">
              ${(wonArr / 1000).toFixed(0)}k ARR
            </div>
            <div className="text-[11px] text-[#504252] mt-1">
              {wonDeals.length} won contracts in {pipeline.name}
            </div>
          </div>
        </div>

        {/* Card 3: Lost Revenue ARR */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Closed Lost Volume
            </span>
            <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">cancel</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">
              ${(lostArr / 1000).toFixed(0)}k ARR
            </div>
            <div className="text-[11px] text-rose-600 mt-1 font-medium">
              3 deals lost to competitive lock-in
            </div>
          </div>
        </div>

        {/* Card 4: Sales Cycle Days */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Average Cycle to Win
            </span>
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">pace</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">16.2 Days</div>
            <div className="text-[11px] text-[#504252] mt-1">2.4 days faster than Q3 average</div>
          </div>
        </div>
      </div>

      {/* 3. Competitor Head-to-Head & Primary Loss Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Competitor Head-to-Head Win Rates */}
        <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#d4c0d5]/20 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9900c2] text-[18px]">swords</span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#1a1b22]">
                  Competitor Head-to-Head Win Rates
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#837284]">Multi-bid deals</span>
            </div>

            <div className="space-y-3">
              {competitors.map((comp) => (
                <div key={comp.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1a1b22]">{comp.name}</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-700">
                      {comp.winRate}% Win ({comp.won}W / {comp.lost}L)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#eeedf7] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                      style={{ width: `${comp.winRate}%` }}
                    ></div>
                    <div
                      className="h-full bg-rose-400 rounded-r-full transition-all duration-500"
                      style={{ width: `${100 - comp.winRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#d4c0d5]/20 flex items-center justify-between text-[11px] text-[#504252]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Won against competitor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Lost against competitor
            </span>
          </div>
        </div>

        {/* Right: Primary Loss Reasons Retrospective */}
        <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#d4c0d5]/20 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-[18px]">pie_chart</span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#1a1b22]">
                  Primary Loss Attribution Reasons
                </h3>
              </div>
              <span className="font-mono text-[10px] text-rose-600 font-semibold">100% Audited</span>
            </div>

            <div className="space-y-3">
              {lossReasons.map((lr) => (
                <div key={lr.reason} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#1a1b22] font-medium">{lr.reason}</span>
                    <span className="font-mono text-[11px] font-bold text-[#504252]">
                      {lr.pct}% ({lr.count} deals)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#eeedf7] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${lr.color} rounded-full transition-all duration-500`}
                      style={{ width: `${lr.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#d4c0d5]/20 text-[11px] text-[#504252] flex items-center justify-between">
            <span>Action item: Address EU compliance certification in Q1 roadmap</span>
            <span className="font-mono font-semibold text-[#9900c2]">View Spec</span>
          </div>
        </div>
      </div>

      {/* 4. Closed Deals Retrospectives Table (Won & Lost) */}
      <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#d4c0d5]/20 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#9900c2] animate-pulse"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#1a1b22]">
              Closed Deals Post-Mortem &amp; Win Retrospective Table
            </h3>
          </div>
          <span className="font-mono text-[11px] text-[#837284]">
            {wonDeals.length + lostDeals.length} completed transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#d4c0d5]/30 text-[10px] font-mono uppercase text-[#837284]">
                <th className="pb-2 font-semibold">Deal / Company</th>
                <th className="pb-2 font-semibold">Outcome</th>
                <th className="pb-2 font-semibold">Value ARR</th>
                <th className="pb-2 font-semibold">Competitor</th>
                <th className="pb-2 font-semibold">Primary Factor / Reason</th>
                <th className="pb-2 font-semibold">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4c0d5]/20">
              {/* Won Deals */}
              {wonDeals.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className="hover:bg-[#f4f2fd]/50 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5">
                    <div className="font-semibold text-[#1a1b22] group-hover:text-[#9900c2] transition-colors">
                      {deal.title}
                    </div>
                    <div className="text-[11px] text-[#504252]">{deal.company}</div>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Closed Won
                    </span>
                  </td>
                  <td className="py-2.5 font-mono font-bold text-[#1a1b22]">
                    ${(deal.value / 1000).toFixed(0)}k ARR
                  </td>
                  <td className="py-2.5 text-[#504252]">Salesforce</td>
                  <td className="py-2.5 text-[#504252]">Local-first SQLite VFS speed &amp; data privacy</td>
                  <td className="py-2.5 font-mono text-[#504252]">{deal.ownerInitials || 'AW'}</td>
                </tr>
              ))}

              {/* Lost Deals */}
              {lostDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-rose-50/40 transition-colors">
                  <td className="py-2.5">
                    <div className="font-semibold text-[#1a1b22]">{deal.title}</div>
                    <div className="text-[11px] text-[#504252]">{deal.company}</div>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Closed Lost
                    </span>
                  </td>
                  <td className="py-2.5 font-mono font-bold text-[#1a1b22]">
                    ${(deal.value / 1000).toFixed(0)}k ARR
                  </td>
                  <td className="py-2.5 text-[#504252]">{deal.competitor}</td>
                  <td className="py-2.5 text-rose-600 font-medium">{deal.primaryReason}</td>
                  <td className="py-2.5 font-mono text-[#504252]">{deal.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
