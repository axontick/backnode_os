import React from 'react';
import { TeamMember } from '../types';

interface ContactsViewProps {
  members: TeamMember[];
}

export const ContactsView: React.FC<ContactsViewProps> = ({ members }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white select-none">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[#d4c0d5]/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] bg-[#fbd7ff] text-[#330043] px-2 py-0.5 rounded font-semibold">
                OPERATOR DIRECTORY
              </span>
              <span className="text-[#d4c0d5]">•</span>
              <span className="font-mono text-[11px] text-[#837284]">{members.length} Seats Allocated</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1a1b22] tracking-tight mt-1">
              Contacts &amp; Engineering Operators
            </h1>
            <p className="text-xs text-[#504252] mt-0.5">
              Live capacity monitoring, public peer keys, and assigned task workloads.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-[#f4f2fd]/60 border border-[#d4c0d5]/40 rounded-xl p-4 flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-sm"
                  style={{
                    backgroundColor: member.avatarBg || '#e4e1e6',
                    color: member.avatarColor || '#1b1b1e',
                  }}
                >
                  {member.initials}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-[#1a1b22]">{member.name}</span>
                    <span className="font-mono text-[9px] bg-[#eeedf7] px-1 rounded text-[#504252]">
                      {member.department}
                    </span>
                  </div>
                  <span className="text-xs text-[#837284] mt-0.5">{member.role}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[10px] text-[#504252]">
                      {member.activeTasks} active tasks
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
