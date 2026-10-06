import React, { useState } from 'react';
import { TaskItem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onSelectView: (view: 'board' | 'list' | 'settings') => void;
  onSelectHub: (hub: string) => void;
  onOpenCreateTask: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onSelectView,
  onSelectHub,
  onOpenCreateTask,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.id.toLowerCase().includes(query.toLowerCase()) ||
      t.assignee.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-[#1a1b22]/40 backdrop-blur-[2px] z-50 flex items-start justify-center pt-24 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[580px] bg-white border border-[#d4c0d5]/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-3.5 border-b border-[#d4c0d5]/30 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-[#9900c2]">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, operators, views, commands... (Esc to dismiss)"
            className="w-full text-xs text-[#1a1b22] placeholder:text-[#837284] focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-[#837284] bg-[#eeedf7] px-1.5 py-0.5 rounded border border-[#d4c0d5]/40">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[380px] overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1 text-xs">
          {/* Quick Actions Group */}
          <div className="px-2 py-1 font-mono text-[10px] text-[#837284] uppercase font-semibold">
            Workspace Actions
          </div>

          <button
            onClick={() => {
              onOpenCreateTask();
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#f4f2fd] text-left text-[#1a1b22] hover:text-[#9900c2] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#9900c2]">add_circle</span>
            <span className="font-medium">Create New Task</span>
            <kbd className="ml-auto font-mono text-[10px] text-[#837284]">N</kbd>
          </button>

          <button
            onClick={() => {
              onSelectView('board');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#f4f2fd] text-left text-[#1a1b22] hover:text-[#9900c2] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#9900c2]">view_kanban</span>
            <span className="font-medium">Switch to Kanban Board</span>
            <kbd className="ml-auto font-mono text-[10px] text-[#837284]">1</kbd>
          </button>

          <button
            onClick={() => {
              onSelectView('list');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#f4f2fd] text-left text-[#1a1b22] hover:text-[#9900c2] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#9900c2]">format_list_bulleted</span>
            <span className="font-medium">Switch to List View</span>
            <kbd className="ml-auto font-mono text-[10px] text-[#837284]">2</kbd>
          </button>

          <button
            onClick={() => {
              onSelectView('settings');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#f4f2fd] text-left text-[#1a1b22] hover:text-[#9900c2] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#9900c2]">tune</span>
            <span className="font-medium">Open Task Space Settings</span>
            <kbd className="ml-auto font-mono text-[10px] text-[#837284]">S</kbd>
          </button>

          <button
            onClick={() => {
              onSelectHub('crm');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#f4f2fd] text-left text-[#1a1b22] hover:text-[#9900c2] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#9900c2]">view_kanban</span>
            <span className="font-medium">Open Pipeline CRM Deals</span>
            <kbd className="ml-auto font-mono text-[10px] text-[#837284]">3</kbd>
          </button>

          {/* Tasks Group */}
          <div className="px-2 py-1 mt-2 font-mono text-[10px] text-[#837284] uppercase font-semibold">
            Matching Tasks ({filteredTasks.length})
          </div>

          {filteredTasks.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelectTask(t);
                onClose();
              }}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#f4f2fd] text-left text-[#1a1b22] group transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] text-[#9900c2] font-semibold shrink-0">
                  {t.id}
                </span>
                <span className="truncate group-hover:text-[#9900c2]">{t.title}</span>
              </div>
              <span className="font-mono text-[10px] text-[#837284] shrink-0 ml-2">
                {t.status}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#f4f2fd]/60 border-t border-[#d4c0d5]/30 flex items-center justify-between text-[11px] text-[#837284]">
          <span>Tip: Press ⌘K anywhere in Backnode OS</span>
          <span className="font-mono">Navigation Engine v2.4</span>
        </div>
      </div>
    </div>
  );
};
