import React from 'react';
import { CrmDeal } from '../types';

interface CrmDashboardViewProps {
  deals: CrmDeal[];
  onSelectDeal: (deal: CrmDeal) => void;
  onOpenNewDeal: (stage?: CrmDeal['stage']) => void;
  onNavigateToBoard: () => void;
  onNavigateToSettings: (tab?: 'general' | 'stages') => void;
  onOpenAddPipeline?: () => void;
}

export const CrmDashboardView: React.FC<CrmDashboardViewProps> = ({
  deals,
  onSelectDeal,
  onOpenNewDeal,
  onNavigateToBoard,
  onNavigateToSettings,
  onOpenAddPipeline,
}) => {
  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedForecast = Math.round(
    deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0)
  );

  const closedWonDeals = deals.filter((d) => d.stage === 'Closed Won');
  const winRate = deals.length > 0 ? Math.round((closedWonDeals.length / deals.length) * 100) : 0;

  const stages: {
    name: CrmDeal['stage'];
    title: string;
    dotColor: string;
    badgeBg: string;
    barColor: string;
    prob: number;
  }[] = [
    {
      name: 'Qualified Lead',
      title: 'Qualified Lead',
      dotColor: 'bg-zinc-400',
      badgeBg: 'bg-zinc-100 text-zinc-700',
      barColor: 'bg-zinc-400',
      prob: 20,
    },
    {
      name: 'Discovery & Demo',
      title: 'Discovery & Demo',
      dotColor: 'bg-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700',
      barColor: 'bg-blue-500',
      prob: 40,
    },
    {
      name: 'Proposal Submitted',
      title: 'Proposal Submitted',
      dotColor: 'bg-[#9900c2]',
      badgeBg: 'bg-purple-50 text-[#9900c2]',
      barColor: 'bg-[#9900c2]',
      prob: 70,
    },
    {
      name: 'Contract & Legal',
      title: 'Contract & Legal',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700',
      barColor: 'bg-amber-500',
      prob: 85,
    },
    {
      name: 'Closed Won',
      title: 'Closed Won',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700',
      barColor: 'bg-emerald-500',
      prob: 100,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafc] overflow-y-auto select-none p-6 text-xs custom-scrollbar">
      {/* 1. Header Hero Banner */}
      <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#9900c2] bg-[#fbd7ff]/40 px-2 py-0.5 rounded-full border border-[#9900c2]/20">
              Pipeline Intelligence
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px] text-[#5f5e61]">Q4 ARR Forecasting Engine</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1a1b22] tracking-tight">
            Pipeline CRM &amp; Revenue Operations
          </h1>
          <p className="text-xs text-[#504252] mt-1 max-w-2xl leading-relaxed">
            Real-time deal forecasting, conversion attribution, sales velocity metrics, and enterprise pipeline execution.
          </p>
        </div>

        {/* Action Controls Cluster with Smooth Transitions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenAddPipeline && (
            <button
              onClick={onOpenAddPipeline}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#9900c2]/30 bg-[#f4f2fd] hover:bg-[#eeedf7] text-[#9900c2] font-semibold text-xs transition-all active:scale-[0.98] shadow-xs"
              title="Create new sales pipeline"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>+ New Pipeline</span>
            </button>
          )}

          <button
            onClick={() => onOpenNewDeal('Proposal Submitted')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9900c2] hover:bg-[#b731e0] active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-sm shadow-[#9900c2]/25"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            <span>+ New Deal</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Pipeline Value */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Total Pipeline Value
            </span>
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-[#9900c2] flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">payments</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">
              ${(totalPipeline / 1000).toFixed(0)}k ARR
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#504252]">
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                +18.4% MoM
              </span>
              <span>•</span>
              <span>{deals.length} active opportunities</span>
            </div>
          </div>
        </div>

        {/* Card 2: Weighted Forecast */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Weighted ARR Forecast
            </span>
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">auto_graph</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">
              ${(weightedForecast / 1000).toFixed(0)}k ARR
            </div>
            <div className="text-[11px] text-[#504252] mt-1">
              High confidence (85% closed won target)
            </div>
          </div>
        </div>

        {/* Card 3: Win Rate & Velocity */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Conversion Win Rate
            </span>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
              {winRate}%
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">{winRate}% Won</div>
            <div className="w-full h-1.5 bg-[#eeedf7] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${winRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 4: Sales Cycle Velocity */}
        <div className="bg-white p-4 rounded-xl border border-[#d4c0d5]/40 shadow-xs flex flex-col justify-between hover:border-[#9900c2]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#837284] uppercase tracking-wider font-semibold">
              Average Deal Cycle
            </span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[15px]">timer</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#1a1b22] font-mono">18.4 Days</div>
            <div className="text-[11px] text-[#504252] mt-1">Qualified to Closed Won velocity</div>
          </div>
        </div>
      </div>

      {/* 3. Stage-by-Stage Funnel Breakdown */}
      <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-5 mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#d4c0d5]/20 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9900c2] text-[18px]">filter_alt</span>
            <h2 className="font-bold text-sm text-[#1a1b22]">Pipeline Funnel &amp; Stage Velocity</h2>
          </div>
          <button
            onClick={onNavigateToBoard}
            className="flex items-center gap-1 text-xs font-semibold text-[#9900c2] hover:underline"
          >
            <span>View Board Columns</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((st) => {
            const stageDeals = deals.filter((d) => d.stage === st.name);
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
            const percentage = totalPipeline > 0 ? Math.round((stageTotal / totalPipeline) * 100) : 0;

            return (
              <div
                key={st.name}
                onClick={onNavigateToBoard}
                className="p-3.5 rounded-xl border border-[#d4c0d5]/30 bg-[#fafafc] hover:bg-[#f4f2fd]/50 hover:border-[#9900c2]/40 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 font-semibold text-xs text-[#1a1b22]">
                      <span className={`w-2 h-2 rounded-full ${st.dotColor}`}></span>
                      <span className="truncate">{st.title}</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#837284]">
                      {stageDeals.length}
                    </span>
                  </div>

                  <div className="text-lg font-bold font-mono text-[#1a1b22] mt-1">
                    ${(stageTotal / 1000).toFixed(0)}k
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#504252] mt-1">
                    <span>{percentage}% total</span>
                    <span>{st.prob}% prob</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-[#eeedf7] rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full ${st.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(percentage, 8)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Top Strategic Opportunities Leaderboard */}
      <div className="bg-white rounded-2xl border border-[#d4c0d5]/40 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#d4c0d5]/20 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#9900c2] animate-pulse"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#1a1b22]">
              High-Value Strategic Opportunities (ARR Rank)
            </h3>
          </div>
          <button
            onClick={onNavigateToBoard}
            className="text-xs font-semibold text-[#9900c2] hover:underline flex items-center gap-1"
          >
            <span>See all {deals.length} deals</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {deals.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#d4c0d5]/60 rounded-xl bg-[#fafafc] flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-[#837284]/60">payments</span>
            <p className="text-xs font-semibold text-[#1a1b22] mt-2">No deals in pipeline</p>
            <p className="text-[11px] text-[#837284] mt-0.5">Click + New Deal above to begin tracking sales opportunities.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deals.slice(0, 5).map((deal) => (
              <div
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                className="flex items-center justify-between p-3 rounded-xl border border-[#d4c0d5]/30 hover:border-[#9900c2]/50 hover:bg-[#f4f2fd]/40 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-[#9900c2]/10 text-[#9900c2] flex items-center justify-center font-bold text-xs font-mono shrink-0">
                    {deal.company?.slice(0, 2).toUpperCase() || 'DL'}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1a1b22] group-hover:text-[#9900c2] transition-colors truncate">
                        {deal.title}
                      </span>
                      <span className="font-mono text-[10px] text-[#837284]">({deal.id})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#504252] mt-0.5">
                      <span>{deal.company}</span>
                      <span>•</span>
                      <span className="text-zinc-600">Stakeholder: {deal.contact?.name || deal.owner || 'Contact'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                  <span className="font-bold text-[#1a1b22] text-sm">${(deal.value / 1000).toFixed(0)}k ARR</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#9900c2] border border-purple-200">
                    {deal.stage}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-emerald-700 font-semibold">{deal.probability}%</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-[#837284] group-hover:text-[#9900c2] transition-colors">
                    chevron_right
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
