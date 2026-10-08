import React from 'react';
import { TeamMember } from '../types';

interface ContactsViewProps {
  members: TeamMember[];
}

export const ContactsView: React.FC<ContactsViewProps> = ({ members }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#09090b] select-none text-zinc-100">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-orange-950/40 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-[6px] font-semibold">
                OPERATOR DIRECTORY
              </span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-[11px] text-zinc-400">{members.length} Seats Allocated</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mt-1 font-headline">
              Contacts &amp; Engineering Operators
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live capacity monitoring, public peer keys, and assigned task workloads.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex items-start justify-between hover:border-orange-500/50 transition-all shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-sm"
                  style={{
                    backgroundColor: member.avatarBg && member.avatarBg !== '#9900c2' ? member.avatarBg : '#27272a',
                    color: member.avatarColor || '#f4f4f5',
                  }}
                >
                  {member.initials}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-zinc-100">{member.name}</span>
                    <span className="font-mono text-[9px] bg-[#18181b] border border-[#27272a] px-1 rounded-[4px] text-zinc-400">
                      {member.department}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 mt-0.5">{member.role}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[10px] text-zinc-400">
                      {member.activeTasks} active tasks
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-[4px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                      {member.capacityStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
