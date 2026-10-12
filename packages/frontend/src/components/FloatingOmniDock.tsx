import React from 'react';

interface FloatingOmniDockProps {
  isEngineActive: boolean;
  onToggleEngine: () => void;
  latencyMs: number;
  onOpenCommandPalette: () => void;
}

export const FloatingOmniDock: React.FC<FloatingOmniDockProps> = ({
  isEngineActive,
  onToggleEngine,
  latencyMs,
  onOpenCommandPalette,
}) => {
  return (
    <div className="fixed bottom-4 left-[300px] z-30">
      <div className="bg-[#121214]/95 backdrop-blur-md border border-[#27272a] rounded-[6px] px-4 py-2 flex items-center gap-3.5 shadow-2xl text-xs text-zinc-300">
        <button
          onClick={onToggleEngine}
          className="flex items-center gap-2 text-zinc-200 font-medium hover:text-orange-400 transition-colors"
          title="Click to simulate SQLite cluster state change"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isEngineActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          ></span>
          <span>{isEngineActive ? 'SQLite Sync Mesh Active' : 'Offline / Standalone Node'}</span>
        </button>

        <span className="text-zinc-700">|</span>

        <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
          <span className="material-symbols-outlined text-[14px] text-orange-400">bolt</span>
          <span>Latency:</span>
          <span className="text-zinc-200 font-semibold">{latencyMs}ms</span>
        </div>

        <span className="text-zinc-700">|</span>

        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1 text-orange-400 font-semibold hover:text-orange-300 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">keyboard</span>
          <span>Shortcuts (⌘K)</span>
        </button>
      </div>
    </div>
  );
};
