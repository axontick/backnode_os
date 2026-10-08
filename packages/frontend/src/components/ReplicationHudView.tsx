import React, { useState } from 'react';

interface ReplicationHudViewProps {
  isEngineActive: boolean;
  onToggleEngine: () => void;
  latencyMs: number;
}

export const ReplicationHudView: React.FC<ReplicationHudViewProps> = ({
  isEngineActive,
  onToggleEngine,
  latencyMs,
}) => {
  const [logEntries, setLogEntries] = useState([
    { id: 1, time: '23:59:12.441', type: 'REPL_TX', hash: '0x3f12...99c', latency: '0.11ms', status: 'COMMITTED' },
    { id: 2, time: '23:59:13.018', type: 'RAFT_HEARTBEAT', hash: 'peer-node-02', latency: '1.4ms', status: 'ACK' },
    { id: 3, time: '23:59:14.220', type: 'WAL_CHECKPOINT', hash: 'pages 412..590', latency: '0.42ms', status: 'FLUSHED' },
    { id: 4, time: '23:59:15.890', type: 'VECTOR_MERGE', hash: 'epoch 4481', latency: '0.08ms', status: 'SYNCED' },
  ]);

  const handleSimulateWrite = () => {
    const newEntry = {
      id: Date.now(),
      time: new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900),
      type: 'REPL_TX',
      hash: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 5)}`,
      latency: `${(Math.random() * 0.4 + 0.05).toFixed(2)}ms`,
      status: 'COMMITTED',
    };
    setLogEntries([newEntry, ...logEntries]);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#09090b] select-none text-zinc-100">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-orange-950/40 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-[6px] font-semibold">
                LOCAL-FIRST REPLICATION ENGINE
              </span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-[11px] text-zinc-400">SQLite VFS Mesh v2.4.12</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mt-1 font-headline">
              Replication HUD &amp; Sync Telemetry
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deterministic vector clock consensus, peer-to-peer write logs, and sub-millisecond local latency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateWrite}
              className="h-8 px-3.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-[#27272a] flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-orange-400">bolt</span>
              <span>Simulate WAL Commit</span>
            </button>
            <button
              onClick={onToggleEngine}
              className={`h-8 px-3.5 rounded-[6px] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                isEngineActive ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>{isEngineActive ? 'Sync Mesh Online' : 'Reconnect Peer Mesh'}</span>
            </button>
          </div>
        </div>

        {/* Node Topology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col justify-between hover:border-orange-500/50 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-zinc-100">Peer Node 01 (Local Master)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="mt-3 space-y-1 font-mono text-xs text-zinc-400">
              <div>Region: <span className="text-zinc-200 font-semibold">US-East-1</span></div>
              <div>Memory B-Tree: <span className="text-zinc-200 font-semibold">2.4 MB</span></div>
              <div>WAL Buffer: <span className="text-zinc-200 font-semibold">0 uncommitted</span></div>
              <div>VFS Read Latency: <span className="text-emerald-400 font-semibold">{latencyMs}ms</span></div>
            </div>
          </div>

          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col justify-between hover:border-orange-500/50 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-zinc-100">Peer Node 02 (EU Replica)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="mt-3 space-y-1 font-mono text-xs text-zinc-400">
              <div>Region: <span className="text-zinc-200 font-semibold">EU-West-1 (Frankfurt)</span></div>
              <div>Sync Protocol: <span className="text-zinc-200 font-semibold">WebRTC DataChannel</span></div>
              <div>Round-trip Ping: <span className="text-zinc-200 font-semibold">14.2ms</span></div>
              <div>Status: <span className="text-emerald-400 font-semibold">In Sync</span></div>
            </div>
          </div>

          <div className="p-4 rounded-[6px] bg-[#121214] border border-[#27272a] flex flex-col justify-between hover:border-orange-500/50 transition-all shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-zinc-100">Peer Node 03 (AP Replica)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="mt-3 space-y-1 font-mono text-xs text-zinc-400">
              <div>Region: <span className="text-zinc-200 font-semibold">AP-East-1 (Tokyo)</span></div>
              <div>Vector Clock Lag: <span className="text-zinc-200 font-semibold">0 epochs</span></div>
              <div>Round-trip Ping: <span className="text-zinc-200 font-semibold">38.4ms</span></div>
              <div>Status: <span className="text-emerald-400 font-semibold">In Sync</span></div>
            </div>
          </div>
        </div>

        {/* Real-time WAL Stream */}
        <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-2">
            <h3 className="font-semibold text-xs text-zinc-100 flex items-center gap-2 font-headline">
              <span className="material-symbols-outlined text-[16px] text-orange-400">terminal</span>
              Deterministic Write Log Stream
            </h3>
            <span className="font-mono text-[10px] text-zinc-400">Live Stream • SQLite VFS</span>
          </div>

          <div className="font-mono text-xs divide-y divide-[#27272a]">
            {logEntries.map((log) => (
              <div key={log.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">{log.time}</span>
                  <span className="text-orange-400 font-bold">{log.type}</span>
                  <span className="text-zinc-200">{log.hash}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400">{log.latency}</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
