import React, { useState, useMemo } from 'react';
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

  // Filter deals belonging to this pipeline (excluding archived deals)
  const pipelineDeals = useMemo(() => {
    return deals.filter(
      (d) => (!pipeline?.id || !d.pipelineId || d.pipelineId === pipeline.id) && !d.isArchived
    );
  }, [deals, pipeline?.id]);

  // Quarter-filtered deals
  const quarterDeals = useMemo(() => {
    if (filterQuarter === 'All Time') return pipelineDeals;
    return pipelineDeals.filter((d) => {
      const dateStr = d.closedAt || d.targetCloseDate || d.createdAt || '';
      if (filterQuarter === 'Q4 2026') {
        return (
          dateStr.includes('Oct') ||
          dateStr.includes('Nov') ||
          dateStr.includes('Dec') ||
          dateStr.includes('-10-') ||
          dateStr.includes('-11-') ||
          dateStr.includes('-12-')
        );
      }
      if (filterQuarter === 'Q3 2026') {
        return (
          dateStr.includes('Jul') ||
          dateStr.includes('Aug') ||
          dateStr.includes('Sep') ||
          dateStr.includes('-07-') ||
          dateStr.includes('-08-') ||
          dateStr.includes('-09-')
        );
      }
      return true;
    });
  }, [pipelineDeals, filterQuarter]);

  // Closed Won Deals (calculated from items)
  const wonDeals = useMemo(() => {
    return quarterDeals.filter((d) => d.stage === 'Closed Won' || d.stage?.toLowerCase().includes('won'));
  }, [quarterDeals]);

  // Closed Lost Deals (calculated from items)
  const lostDeals = useMemo(() => {
    return quarterDeals.filter((d) => d.stage === 'Closed Lost' || d.stage?.toLowerCase().includes('lost'));
  }, [quarterDeals]);

  const wonArr = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const lostArr = lostDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const totalClosedCount = wonDeals.length + lostDeals.length;
  const winRate = totalClosedCount > 0 ? Math.round((wonDeals.length / totalClosedCount) * 100) : 0;

  // Average Cycle to Win calculated dynamically from items
  const wonDealsWithCycle = useMemo(() => {
    return wonDeals.filter((d) => {
      if (typeof d.cycleDays === 'number' && d.cycleDays > 0) return true;
      if (d.createdAt && (d.closedAt || d.targetCloseDate)) return true;
      return false;
    });
  }, [wonDeals]);

  const avgCycleDays = useMemo(() => {
    if (wonDealsWithCycle.length === 0) return '0';
    const totalCycle = wonDeals.reduce((acc, d) => {
      if (typeof d.cycleDays === 'number' && d.cycleDays > 0) return acc + d.cycleDays;
      if (d.createdAt && (d.closedAt || d.targetCloseDate)) {
        const diff =
          (new Date(d.closedAt || d.targetCloseDate).getTime() - new Date(d.createdAt).getTime()) /
          (1000 * 3600 * 24);
        if (!isNaN(diff) && diff > 0) return acc + Math.round(diff);
      }
      return acc;
    }, 0);
    return (totalCycle / wonDealsWithCycle.length).toFixed(1);
  }, [wonDeals, wonDealsWithCycle]);

  // Competitor Head-to-Head Win Rates calculated dynamically from items
  const competitors = useMemo(() => {
    const map: Record<string, { name: string; won: number; lost: number }> = {};

    wonDeals.forEach((d) => {
      const comp = d.competitor?.trim();
      if (comp) {
        if (!map[comp]) map[comp] = { name: comp, won: 0, lost: 0 };
        map[comp].won += 1;
      }
    });

    lostDeals.forEach((d) => {
      const comp = d.competitor?.trim();
      if (comp) {
        if (!map[comp]) map[comp] = { name: comp, won: 0, lost: 0 };
        map[comp].lost += 1;
      }
    });

    return Object.values(map)
      .map((c) => {
        const total = c.won + c.lost;
        const rate = total > 0 ? Math.round((c.won / total) * 100) : 0;
        return {
          name: c.name,
          won: c.won,
          lost: c.lost,
          winRate: rate,
        };
      })
      .sort((a, b) => b.won + b.lost - (a.won + a.lost));
  }, [wonDeals, lostDeals]);

  // Primary Loss Attribution Reasons calculated dynamically from items
  const lossReasons = useMemo(() => {
    if (lostDeals.length === 0) return [];
    const map: Record<string, number> = {};
    lostDeals.forEach((d) => {
      const reason = d.lossReason?.trim() || 'Unspecified Reason';
      map[reason] = (map[reason] || 0) + 1;
    });

    const colors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-zinc-500'];
    return Object.entries(map)
      .map(([reason, count], idx) => {
        const pct = Math.round((count / lostDeals.length) * 100);
        return {
          reason,
          count,
          pct,
          color: colors[idx % colors.length],
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [lostDeals]);

  const pipelineColor = pipeline.color && pipeline.color !== '#9900c2' ? pipeline.color : '#ea580c';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-y-auto p-6 text-xs custom-scrollbar text-zinc-100">
      {/* 1. Header Banner */}
      <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-xs p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[6px] border"
              style={{
                backgroundColor: `${pipelineColor}18`,
                color: pipelineColor,
                borderColor: `${pipelineColor}40`,
              }}
            >
              {pipeline.name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px] text-zinc-400">Pipeline Win/Loss Analytics</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight font-headline">
            Win/Loss Velocity &amp; Attribution
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Win conversion attribution, lost deal retrospectives, competitor head-to-head benchmarks, and drop-off stage analysis for {pipeline.name}.
          </p>
        </div>

        {/* Action Controls Cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center rounded-[6px] border border-[#27272a] bg-[#18181b] p-1 shadow-xs">
            {(['Q4 2026', 'Q3 2026', 'All Time'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setFilterQuarter(q)}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                  filterQuarter === q
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            onClick={onBackToBoard}
            className="h-8 flex items-center gap-1.5 px-3.5 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 font-semibold text-xs transition-all active:scale-[0.98] shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-orange-400">view_kanban</span>
            <span>Pipeline Board</span>
          </button>

          <button
            onClick={onOpenNewDeal}
            className="h-8 flex items-center gap-1.5 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-sm shadow-orange-600/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* 2. Bento KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Win Rate */}
        <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Win Rate Percentage
            </span>
            <span className="w-6 h-6 rounded-[6px] bg-emerald-950/40 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
              ★
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-zinc-100 font-mono">{winRate}% Won</div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
              <span className="text-emerald-400 font-semibold">{wonDeals.length} Won</span>
              <span>•</span>
              <span>{totalClosedCount} closed deals</span>
            </div>
          </div>
        </div>

        {/* Card 2: Won Revenue ARR */}
        <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Closed Won Revenue
            </span>
            <span className="w-6 h-6 rounded-[6px] bg-orange-950/40 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <span className="material-symbols-outlined text-[15px]">verified</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-zinc-100 font-mono">
              ${(wonArr / 1000).toFixed(0)}k ARR
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {wonDeals.length} won contract{wonDeals.length === 1 ? '' : 's'} in {pipeline.name}
            </div>
          </div>
        </div>

        {/* Card 3: Lost Revenue ARR */}
        <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Closed Lost Volume
            </span>
            <span className="w-6 h-6 rounded-[6px] bg-rose-950/40 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <span className="material-symbols-outlined text-[15px]">cancel</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-zinc-100 font-mono">
              ${(lostArr / 1000).toFixed(0)}k ARR
            </div>
            <div className="text-[11px] text-rose-400 mt-1 font-medium">
              {lostDeals.length} deal{lostDeals.length === 1 ? '' : 's'} marked lost
            </div>
          </div>
        </div>

        {/* Card 4: Sales Cycle Days */}
        <div className="bg-[#121214] p-4 rounded-[6px] border border-[#27272a] shadow-xs flex flex-col justify-between hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Average Cycle to Win
            </span>
            <span className="w-6 h-6 rounded-[6px] bg-blue-950/40 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <span className="material-symbols-outlined text-[15px]">pace</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-zinc-100 font-mono">{avgCycleDays} Days</div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {wonDealsWithCycle.length > 0
                ? `Calculated from ${wonDealsWithCycle.length} closed won cycles`
                : 'No closed won deal cycles recorded'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Competitor Head-to-Head & Primary Loss Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Competitor Head-to-Head Win Rates */}
        <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-400 text-[18px]">swords</span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-100 font-headline">
                  Competitor Head-to-Head Win Rates
                </h3>
              </div>
              <span className="font-mono text-[10px] text-zinc-400">
                {competitors.length} tracked competitors
              </span>
            </div>

            {competitors.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-[#27272a] rounded-[6px] bg-[#18181b]">
                <span className="material-symbols-outlined text-[28px] text-zinc-600 mb-1">swords</span>
                <p className="text-xs font-semibold text-zinc-300">No competitor battlecards recorded</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs">
                  Specify a competitor on deals to track head-to-head win conversion rates.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {competitors.map((comp) => (
                  <div key={comp.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200">{comp.name}</span>
                      <span className="font-mono text-[11px] font-bold text-emerald-400">
                        {comp.winRate}% Win ({comp.won}W / {comp.lost}L)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                        style={{ width: `${comp.winRate}%` }}
                      ></div>
                      <div
                        className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
                        style={{ width: `${100 - comp.winRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#27272a] flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Won against competitor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Lost against competitor
            </span>
          </div>
        </div>

        {/* Right: Primary Loss Reasons Retrospective */}
        <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-400 text-[18px]">pie_chart</span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-100 font-headline">
                  Primary Loss Attribution Reasons
                </h3>
              </div>
              <span className="font-mono text-[10px] text-rose-400 font-semibold">
                {lostDeals.length > 0 ? `${lostDeals.length} Lost Deals` : '0 Lost Deals'}
              </span>
            </div>

            {lossReasons.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-[#27272a] rounded-[6px] bg-[#18181b]">
                <span className="material-symbols-outlined text-[28px] text-zinc-600 mb-1">pie_chart</span>
                <p className="text-xs font-semibold text-zinc-300">No lost deals recorded</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs">
                  When deals are moved to Closed Lost with a reason, drop-off factors will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lossReasons.map((lr) => (
                  <div key={lr.reason} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-200 font-medium">{lr.reason}</span>
                      <span className="font-mono text-[11px] font-bold text-zinc-400">
                        {lr.pct}% ({lr.count} {lr.count === 1 ? 'deal' : 'deals'})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${lr.color} rounded-full transition-all duration-500`}
                        style={{ width: `${lr.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#27272a] text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Dynamic attribution from actual closed lost deal post-mortems</span>
            <span className="font-mono font-semibold text-orange-400">{pipeline.name}</span>
          </div>
        </div>
      </div>

      {/* 4. Closed Deals Retrospectives Table (Won & Lost from real items) */}
      <div className="bg-[#121214] rounded-[6px] border border-[#27272a] shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-100 font-headline">
              Closed Deals Post-Mortem &amp; Win Retrospective Table
            </h3>
          </div>
          <span className="font-mono text-[11px] text-zinc-400">
            {totalClosedCount} completed transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#27272a] text-[10px] font-mono uppercase text-zinc-400">
                <th className="pb-2 font-semibold">Deal / Company</th>
                <th className="pb-2 font-semibold">Outcome</th>
                <th className="pb-2 font-semibold">Value ARR</th>
                <th className="pb-2 font-semibold">Competitor</th>
                <th className="pb-2 font-semibold">Primary Factor / Reason</th>
                <th className="pb-2 font-semibold">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {totalClosedCount === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-[28px] text-zinc-600 mb-1">inventory_2</span>
                      <p className="text-xs font-semibold text-zinc-300">No closed deals in this pipeline</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Move deals to Closed Won or Closed Lost to view retrospective post-mortems.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {/* Won Deals */}
                  {wonDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal)}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5">
                        <div className="font-semibold text-zinc-100 group-hover:text-orange-400 transition-colors">
                          {deal.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">{deal.company}</div>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                          Closed Won
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold text-zinc-100">
                        ${(deal.value / 1000).toFixed(0)}k ARR
                      </td>
                      <td className="py-2.5 text-zinc-300">{deal.competitor || '—'}</td>
                      <td className="py-2.5 text-zinc-400">
                        {deal.wonReason || 'Closed Won (Standard Conversion)'}
                      </td>
                      <td className="py-2.5 font-mono text-zinc-400">
                        {deal.ownerInitials || deal.owner?.slice(0, 2).toUpperCase() || 'OP'}
                      </td>
                    </tr>
                  ))}

                  {/* Lost Deals */}
                  {lostDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal)}
                      className="hover:bg-rose-950/20 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5">
                        <div className="font-semibold text-zinc-100 group-hover:text-rose-400 transition-colors">
                          {deal.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">{deal.company}</div>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-rose-950/40 text-rose-400 border border-rose-500/30">
                          Closed Lost
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold text-zinc-100">
                        ${(deal.value / 1000).toFixed(0)}k ARR
                      </td>
                      <td className="py-2.5 text-zinc-300">{deal.competitor || '—'}</td>
                      <td className="py-2.5 text-rose-400 font-medium">
                        {deal.lossReason || 'Lost deal'}
                      </td>
                      <td className="py-2.5 font-mono text-zinc-400">
                        {deal.ownerInitials || deal.owner?.slice(0, 2).toUpperCase() || 'OP'}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
