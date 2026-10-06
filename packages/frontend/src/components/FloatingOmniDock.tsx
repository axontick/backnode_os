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
    <div className="fixed bottom-4 left-[300px] z-30 select-none">
      <div className="bg-white/90 backdrop-blur-md border border-[#d4c0d5]/50 rounded-full px-4 py-2 flex items-center gap-3.5 shadow-xl text-xs text-[#504252]">
        <button
          onClick={onToggleEngine}
          className="flex items-center gap-2 text-[#1a1b22] font-medium hover:text-[#9900c2] transition-colors"
          title="Click to simulate SQLite cluster state change"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isEngineActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          ></span>
          <span>{isEngineActive ? 'SQLite Sync Mesh Active' : 'Offline / Standalone Node'}</span>
        </button>

        <span className="text-[#d4c0d5]">|</span>

        <div className="flex items-center gap-1 font-mono text-[11px] text-[#504252]">
          <span className="material-symbols-outlined text-[14px] text-[#9900c2]">bolt</span>
          <span>Latency:</span>
          <span className="text-[#1a1b22] font-semibold">{latencyMs}ms</span>
        </div>

        <span className="text-[#d4c0d5]">|</span>

        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1 text-[#9900c2] font-semibold hover:underline"
        >
          <span className="material-symbols-outlined text-[14px]">keyboard</span>
          <span>Shortcuts Active (⌘K)</span>
        </button>
      </div>
    </div>
  );
};
