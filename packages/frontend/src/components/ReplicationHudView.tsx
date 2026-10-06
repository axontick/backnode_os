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
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white select-none">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-[#fbd7ff] text-[#330043] px-2 py-0.5 rounded font-semibold">
                LOCAL-FIRST REPLICATION ENGINE
              </span>
              <span className="text-[#d4c0d5]">•</span>
              <span className="font-mono text-[11px] text-[#837284]">SQLite VFS Mesh v2.4.12</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1a1b22] tracking-tight mt-1">
              Replication HUD &amp; Sync Telemetry
            </h1>
            <p className="text-xs text-[#504252] mt-0.5">
              Deterministic vector clock consensus, peer-to-peer write logs, and sub-millisecond local latency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateWrite}
              className="px-3.5 py-1.5 rounded-lg bg-[#eeedf7] hover:bg-[#e8e7f1] text-[#1a1b22] text-xs font-semibold border border-[#d4c0d5]/40 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-[#9900c2]">bolt</span>
              <span>Simulate WAL Commit</span>
            </button>
            <button
              onClick={onToggleEngine}
              className={`px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                isEngineActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>{isEngineActive ? 'Sync Mesh Online' : 'Reconnect Peer Mesh'}</span>
            </button>
          </div>
        </div>

        {/* Node Topology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#1a1b22]">Peer Node 01 (Local Master)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="mt-3 space-y-1 font-mono text-xs text-[#504252]">
              <div>Region: <span className="text-[#1a1b22] font-semibold">US-East-1</span></div>
              <div>Memory B-Tree: <span className="text-[#1a1b22] font-semibold">2.4 MB</span></div>
              <div>WAL Buffer: <span className="text-[#1a1b22] font-semibold">0 uncommitted</span></div>
              <div>VFS Read Latency: <span className="text-emerald-600 font-semibold">{latencyMs}ms</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#1a1b22]">Peer Node 02 (EU Replica)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-3 space-y-1 font-mono text-xs text-[#504252]">
              <div>Region: <span className="text-[#1a1b22] font-semibold">EU-West-1 (Frankfurt)</span></div>
              <div>Sync Protocol: <span className="text-[#1a1b22] font-semibold">WebRTC DataChannel</span></div>
              <div>Round-trip Ping: <span className="text-[#1a1b22] font-semibold">14.2ms</span></div>
              <div>Status: <span className="text-emerald-600 font-semibold">In Sync</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#1a1b22]">Peer Node 03 (AP Replica)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="mt-3 space-y-1 font-mono text-xs text-[#504252]">
              <div>Region: <span className="text-[#1a1b22] font-semibold">AP-East-1 (Tokyo)</span></div>
              <div>Vector Clock Lag: <span className="text-[#1a1b22] font-semibold">0 epochs</span></div>
              <div>Round-trip Ping: <span className="text-[#1a1b22] font-semibold">38.4ms</span></div>
              <div>Status: <span className="text-emerald-600 font-semibold">In Sync</span></div>
            </div>
          </div>
        </div>

        {/* Real-time WAL Stream */}
        <div className="bg-white border border-[#d4c0d5]/30 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#d4c0d5]/20 pb-2">
            <h3 className="font-semibold text-xs text-[#1a1b22] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#9900c2]">terminal</span>
              Deterministic Write Log Stream
            </h3>
            <span className="font-mono text-[10px] text-[#837284]">Live Stream • SQLite VFS</span>
          </div>

          <div className="font-mono text-xs divide-y divide-[#d4c0d5]/20">
            {logEntries.map((log) => (
              <div key={log.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[#837284]">{log.time}</span>
                  <span className="text-[#9900c2] font-bold">{log.type}</span>
                  <span className="text-[#1a1b22]">{log.hash}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-600">{log.latency}</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
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
