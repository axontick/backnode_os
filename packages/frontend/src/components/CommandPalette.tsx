import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskItem } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onSelectView: (view: 'board' | 'list' | 'settings') => void;
  onSelectHub: (hub: string) => void;
  onOpenCreateTask: () => void;
  onOpenCreateWorkspace?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onSelectView,
  onSelectHub,
  onOpenCreateTask,
  onOpenCreateWorkspace,
}) => {
  const navigate = useNavigate();
  const { activeUserSpaceId, activeUserSpace } = useWorkspace();
  const spacePrefix = `/space/${activeUserSpaceId || activeUserSpace?.id || 'space-main'}`;
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
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-start justify-center pt-24 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[580px] bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-3.5 border-b border-[#27272a] flex items-center gap-2.5 bg-[#121214]">
          <span className="material-symbols-outlined text-[20px] text-orange-400">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, operators, views, commands... (Esc to dismiss)"
            className="w-full text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none bg-transparent"
          />
          <kbd className="font-mono text-[10px] text-zinc-400 bg-[#18181b] px-1.5 py-0.5 rounded-[6px] border border-[#27272a]">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[380px] overflow-y-auto p-2 custom-scrollbar flex flex-col gap-1 text-xs bg-[#121214]">
          {/* Quick Actions Group */}
          <div className="px-2 py-1 font-mono text-[10px] text-zinc-400 uppercase font-semibold">
            Workspace Actions
          </div>

          <button
            onClick={() => {
              onOpenCreateTask();
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 hover:text-orange-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-orange-400">add_circle</span>
            <span className="font-medium">Create New Task</span>
            <kbd className="ml-auto font-mono text-[10px] text-zinc-500">N</kbd>
          </button>

          {onOpenCreateWorkspace && (
            <button
              onClick={() => {
                onOpenCreateWorkspace();
                onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 hover:text-orange-400 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-orange-400">domain_add</span>
              <span className="font-medium">Create New Workspace</span>
              <kbd className="ml-auto font-mono text-[10px] text-zinc-500">W</kbd>
            </button>
          )}

          <button
            onClick={() => {
              onSelectView('board');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 hover:text-orange-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-orange-400">view_kanban</span>
            <span className="font-medium">Switch to Kanban Board</span>
            <kbd className="ml-auto font-mono text-[10px] text-zinc-500">1</kbd>
          </button>

          <button
            onClick={() => {
              onSelectView('list');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 hover:text-orange-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-orange-400">format_list_bulleted</span>
            <span className="font-medium">Switch to List View</span>
            <kbd className="ml-auto font-mono text-[10px] text-zinc-500">2</kbd>
          </button>

          <button
            onClick={() => {
              onSelectView('settings');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 hover:text-orange-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-orange-400">tune</span>
            <span className="font-medium">Open Task Space Settings</span>
            <kbd className="ml-auto font-mono text-[10px] text-zinc-500">S</kbd>
          </button>

          <button
            onClick={() => {
              onSelectHub('settings');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 hover:text-orange-400 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-orange-400">settings</span>
            <span className="font-medium">Open Workspace Settings</span>
            <kbd className="ml-auto font-mono text-[10px] text-zinc-500">⌘,</kbd>
          </button>

          <button
            onClick={() => {
              navigate(`${spacePrefix}/settings/departments`);
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 hover:text-orange-400 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-orange-400">domain</span>
            <span className="font-medium">Manage Workspace Departments</span>
            <kbd className="ml-auto font-mono text-[10px] text-zinc-500">D</kbd>
          </button>

          <button
            onClick={() => {
              onSelectHub('crm');
              onClose();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 hover:text-orange-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-orange-400">leaderboard</span>
            <span className="font-medium">Open Pipeline CRM Deals</span>
            <kbd className="ml-auto font-mono text-[10px] text-zinc-500">3</kbd>
          </button>

          {/* Tasks Group */}
          <div className="px-2 py-1 mt-2 font-mono text-[10px] text-zinc-400 uppercase font-semibold">
            Matching Tasks ({filteredTasks.length})
          </div>

          {filteredTasks.slice(0, 6).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelectTask(t);
                onClose();
              }}
              className="flex items-center justify-between px-3 py-2 rounded-[6px] hover:bg-[#18181b] text-left text-zinc-200 group transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] text-orange-400 font-semibold shrink-0">
                  {t.id}
                </span>
                <span className="truncate group-hover:text-orange-400">{t.title}</span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 shrink-0 ml-2">
                {t.status}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#0c0a09] border-t border-[#27272a] flex items-center justify-between text-[11px] text-zinc-400">
          <span>Tip: Press ⌘K anywhere in Backnode OS</span>
          <span className="font-mono text-zinc-500">Navigation Engine v2.4</span>
        </div>
      </div>
    </div>
  );
};
