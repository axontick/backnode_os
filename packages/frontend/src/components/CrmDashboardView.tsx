import React from 'react';
import { CrmDeal } from '../types';

interface CrmDashboardViewProps {
  deals: CrmDeal[];
  onSelectDeal: (deal: CrmDeal) => void;
  onOpenNewDeal: (stage?: CrmDeal['stage']) => void;
  onNavigateToBoard: () => void;
  onNavigateToSettings?: (tab?: 'general' | 'stages') => void;
  onOpenAddPipeline?: () => void;
}

export const CrmDashboardView: React.FC<CrmDashboardViewProps> = ({
  deals,
  onSelectDeal,
  onOpenNewDeal,
  onNavigateToBoard,
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
      badgeBg: 'bg-zinc-800 text-zinc-300',
      barColor: 'bg-zinc-400',
      prob: 20,
    },
    {
      name: 'Discovery & Demo',
      title: 'Discovery & Demo',
      dotColor: 'bg-blue-500',
      badgeBg: 'bg-blue-950/40 text-blue-400 border border-blue-500/30',
      barColor: 'bg-blue-500',
      prob: 40,
    },
    {
      name: 'Proposal Submitted',
      title: 'Proposal Submitted',
      dotColor: 'bg-orange-500',
      badgeBg: 'bg-orange-950/40 text-orange-400 border border-orange-500/30',
      barColor: 'bg-orange-500',
      prob: 70,
    },
    {
      name: 'Contract & Legal',
      title: 'Contract & Legal',
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-950/40 text-amber-400 border border-amber-500/30',
      barColor: 'bg-amber-500',
      prob: 85,
    },
    {
      name: 'Closed Won',
      title: 'Closed Won',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30',
      barColor: 'bg-emerald-500',
      prob: 100,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#09090b] text-zinc-100 select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* 1. Header Banner (Consistent with Task Spaces & Overview) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#27272a] pb-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-[6px] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                DATABASE: SYNCHRONIZED
              </span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-[11px] text-zinc-400">Local SQLite Mirror</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight font-headline">
              Pipeline CRM &amp; Revenue Operations
            </h1>
            <p className="text-xs text-zinc-400 font-body">
              Real-time deal forecasting, conversion attribution, sales velocity metrics, and enterprise pipeline execution.
            </p>
          </div>

          {/* Action Controls Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAddPipeline && (
              <button
                type="button"
                onClick={onOpenAddPipeline}
                className="px-3.5 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Create new sales pipeline"
              >
                <span className="material-symbols-outlined text-[16px] text-orange-400">add</span>
                <span>New Pipeline</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenNewDeal('Proposal Submitted')}
              className="px-3.5 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Deal</span>
            </button>
          </div>
        </div>

        {/* 2. Bento Financial KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pipeline Value */}
          <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Total Pipeline Value
              </span>
              <span className="w-6 h-6 rounded-[6px] bg-orange-950/40 text-orange-400 flex items-center justify-center border border-orange-500/20">
                <span className="material-symbols-outlined text-[15px]">payments</span>
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">
                ${(totalPipeline / 1000).toFixed(0)}k ARR
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">north_east</span>
                  +18.4% MoM
                </span>
                <span>•</span>
                <span>{deals.length} opportunities</span>
              </div>
            </div>
          </div>

          {/* Card 2: Weighted Forecast */}
          <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Weighted ARR Forecast
              </span>
              <span className="w-6 h-6 rounded-[6px] bg-blue-950/40 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <span className="material-symbols-outlined text-[15px]">auto_graph</span>
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">
                ${(weightedForecast / 1000).toFixed(0)}k ARR
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                <span className="text-blue-400 font-semibold">Probability adjusted</span>
                <span>•</span>
                <span>Q4 Target</span>
              </div>
            </div>
          </div>

          {/* Card 3: Win Rate */}
          <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Win Rate Conversion
              </span>
              <span className="w-6 h-6 rounded-[6px] bg-emerald-950/40 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-[15px]">verified</span>
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">
                {winRate}%
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                <span className="text-emerald-400 font-semibold">{closedWonDeals.length} Won</span>
                <span>•</span>
                <span>Historical Closed</span>
              </div>
            </div>
          </div>

          {/* Card 4: Sales Velocity */}
          <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Avg Deal Cycle
              </span>
              <span className="w-6 h-6 rounded-[6px] bg-amber-950/40 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <span className="material-symbols-outlined text-[15px]">timer</span>
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl md:text-3xl font-bold text-zinc-100 font-mono">18.4 Days</div>
              <div className="text-[11px] text-zinc-400 mt-1">Qualified to Closed Won velocity</div>
            </div>
          </div>
        </div>

        {/* 3. Stage-by-Stage Funnel Breakdown */}
        <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400 text-[18px]">filter_alt</span>
              <h2 className="font-bold text-sm text-zinc-100 font-headline">Pipeline Funnel &amp; Stage Velocity</h2>
            </div>
            <button
              onClick={onNavigateToBoard}
              className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:underline cursor-pointer"
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
                  className="p-3.5 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:border-orange-500/50 hover:bg-zinc-800/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 font-semibold text-xs text-zinc-200">
                        <span className={`w-2 h-2 rounded-full ${st.dotColor}`}></span>
                        <span className="truncate">{st.title}</span>
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {stageDeals.length}
                      </span>
                    </div>

                    <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
                      ${(stageTotal / 1000).toFixed(0)}k
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-1">
                      <span>{percentage}% total</span>
                      <span>{st.prob}% prob</span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-3">
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
        <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-200 font-headline">
                High-Value Strategic Opportunities (ARR Rank)
              </h3>
            </div>
            <button
              onClick={onNavigateToBoard}
              className="text-xs font-semibold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>See all {deals.length} deals</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {deals.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#27272a] rounded-[6px] bg-[#18181b] flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-zinc-600">payments</span>
              <p className="text-xs font-semibold text-zinc-300 mt-2">No deals in pipeline</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Click New Deal above to begin tracking sales opportunities.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deals.slice(0, 5).map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className="flex items-center justify-between p-3 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:border-orange-500/50 hover:bg-zinc-800/40 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 text-orange-400 flex items-center justify-center font-bold text-xs font-mono shrink-0 border border-orange-500/20">
                      {deal.company?.slice(0, 2).toUpperCase() || 'DL'}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-100 group-hover:text-orange-400 transition-colors truncate">
                          {deal.title}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">({deal.id})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span>{deal.company}</span>
                        <span>•</span>
                        <span className="text-zinc-400">Stakeholder: {deal.contact?.name || deal.owner || 'Contact'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <span className="font-bold text-zinc-100 text-sm">${(deal.value / 1000).toFixed(0)}k ARR</span>
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-orange-950/40 text-orange-400 border border-orange-500/30">
                      {deal.stage}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="text-[11px] text-emerald-400 font-semibold">{deal.probability}%</span>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-zinc-500 group-hover:text-orange-400 transition-colors">
                      chevron_right
                    </span>
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
