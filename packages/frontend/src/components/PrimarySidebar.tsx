import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export interface PrimarySidebarProps {
  currentHub: string;
  onSelectHub: (hub: string) => void;
  onOpenNewItem: () => void;
  onOpenCommandPalette: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
  currentHub,
  onSelectHub,
  onOpenNewItem,
  onOpenCommandPalette,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  const {
    userSpaces,
    activeUserSpace,
    handleSelectUserSpace,
    handleCreateUserSpace,
    members,
  } = useWorkspace();

  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceColor, setNewSpaceColor] = useState('#ea580c');
  const spaceDropdownRef = useRef<HTMLDivElement>(null);

  // Close workspace dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (spaceDropdownRef.current && !spaceDropdownRef.current.contains(e.target as Node)) {
        setIsSpaceDropdownOpen(false);
        setIsCreatingSpace(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const initialLetter = activeUserSpace?.name ? activeUserSpace.name.charAt(0).toUpperCase() : 'B';
  const accountName = user?.account?.name || 'Backnode Operations';
  const operatorName = user?.name ? user.name.split(' ')[0] : 'Operator';

  const hubs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', description: 'System Overview & KPIs' },
    { id: 'task-spaces', label: 'Task Spaces', icon: 'folder_open', description: 'Execution Workspaces' },
    { id: 'crm', label: 'CRM Pipelines', icon: 'view_kanban', description: 'Deals & Revenue Pipeline' },
    { id: 'contacts', label: 'Contacts', icon: 'group', description: 'Client & Partner Directory' },
    { id: 'team', label: 'Team & Access', icon: 'shield_person', description: 'Access Controls & Roles', count: members.length },
    { id: 'replication', label: 'Telemetry', icon: 'sync_saved_locally', description: 'Replication Telemetry' },
  ];

  return (
    <aside
      className={`shrink-0 h-screen border-r border-[#27272a] bg-[#0c0a09] text-zinc-100 flex flex-col justify-between transition-all duration-200 select-none z-30 ${
        isCollapsed ? 'w-[60px] p-2 items-center' : 'w-[220px] p-3'
      }`}
    >
      {/* Top Header & Workspace Switcher */}
      <div className={`shrink-0 flex flex-col gap-2.5 relative w-full ${isCollapsed ? 'items-center' : ''}`}>
        {/* Workspace Brand Header & Space Dropdown */}
        <div ref={spaceDropdownRef} className="relative w-full">
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsSpaceDropdownOpen((prev) => !prev)}
              className="w-10 h-10 rounded-[6px] flex items-center justify-center text-white font-semibold text-sm shadow-sm transition-transform hover:scale-105 cursor-pointer mx-auto group relative"
              style={{ backgroundColor: activeUserSpace?.color || '#ea580c' }}
              title={`${activeUserSpace?.name || accountName} (Switch workspace)`}
            >
              <span>{initialLetter}</span>
              <span className="sr-only">Switch Workspace</span>
            </button>
          ) : (
            <div
              onClick={() => setIsSpaceDropdownOpen((prev) => !prev)}
              className="flex items-center justify-between p-1.5 rounded-[6px] hover:bg-zinc-800/40 transition-colors cursor-pointer group border border-transparent hover:border-[#27272a]"
              title="Switch or create workspace"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-white font-semibold text-xs shadow-sm shrink-0 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: activeUserSpace?.color || '#ea580c' }}
                >
                  {initialLetter}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs text-zinc-100 tracking-tight leading-tight truncate font-headline">
                    {activeUserSpace?.name || accountName}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 truncate">
                    {operatorName} • {activeUserSpace?.role || 'Owner'}
                  </span>
                </div>
              </div>
              <span
                className={`material-symbols-outlined text-zinc-400 text-[16px] transition-transform duration-200 ${
                  isSpaceDropdownOpen ? 'rotate-180 text-orange-400' : 'opacity-70 group-hover:opacity-100'
                }`}
              >
                unfold_more
              </span>
            </div>
          )}

          {/* User Spaces Dropdown */}
          {isSpaceDropdownOpen && (
            <div
              className={`absolute mt-2 bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl z-50 p-2.5 flex flex-col gap-2 text-xs animate-in fade-in zoom-in-95 duration-150 ${
                isCollapsed
                  ? 'left-full top-0 ml-2 w-64'
                  : 'top-full left-0 right-0 w-full'
              }`}
            >
              <div className="px-1.5 py-1 flex items-center justify-between border-b border-[#27272a]">
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Workspaces ({userSpaces.length})
                </span>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950/40 border border-orange-500/30 px-1.5 py-0.5 rounded-[6px] font-semibold">
                  Active
                </span>
              </div>

              {/* Spaces List */}
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto custom-scrollbar">
                {userSpaces.map((space) => {
                  const isActive = space.id === activeUserSpace?.id;
                  return (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => {
                        handleSelectUserSpace(space.id);
                        setIsSpaceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-[6px] text-left transition-all ${
                        isActive
                          ? 'bg-orange-950/40 border border-orange-500/30 text-orange-400'
                          : 'hover:bg-zinc-800/40 border border-transparent text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-6 h-6 rounded-[6px] flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs"
                          style={{ backgroundColor: space.color || '#ea580c' }}
                        >
                          {space.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-xs font-semibold truncate ${isActive ? 'text-orange-400' : 'text-zinc-200'}`}>
                            {space.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono truncate">
                            {space.role || 'Owner'} • {space.memberCount || 1} members
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <span className="material-symbols-outlined text-[15px] text-orange-400 shrink-0 ml-1">
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-[#27272a] my-0.5"></div>

              {/* Create New Space Area */}
              {!isCreatingSpace ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingSpace(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-orange-400 border border-dashed border-orange-500/40 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  <span>Create Workspace</span>
                </button>
              ) : (
                <div className="p-2 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-200">New Workspace</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingSpace(false)}
                      className="text-zinc-400 hover:text-zinc-100 text-xs font-bold px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Workspace Name"
                    className="w-full px-2 py-1 text-xs bg-[#121214] border border-[#27272a] rounded-[6px] text-zinc-100 focus:outline-none focus:border-orange-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSpaceName.trim()) {
                        handleCreateUserSpace({ name: newSpaceName, color: newSpaceColor });
                        setNewSpaceName('');
                        setIsCreatingSpace(false);
                        setIsSpaceDropdownOpen(false);
                      }
                    }}
                  />
                  <div className="flex items-center justify-between px-0.5 pt-0.5">
                    {['#ea580c', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#6366f1'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewSpaceColor(c)}
                        className={`w-4 h-4 rounded-[6px] transition-transform ${
                          newSpaceColor === c ? 'scale-125 ring-2 ring-orange-500' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (newSpaceName.trim()) {
                          handleCreateUserSpace({ name: newSpaceName, color: newSpaceColor });
                          setNewSpaceName('');
                          setIsCreatingSpace(false);
                          setIsSpaceDropdownOpen(false);
                        }
                      }}
                      className="px-2 py-1 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingSpace(false)}
                      className="px-2 py-1 rounded-[6px] bg-[#121214] border border-[#27272a] text-zinc-400 hover:bg-zinc-800 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary CTA */}
        {isCollapsed ? (
          <button
            type="button"
            onClick={onOpenNewItem}
            className="w-10 h-10 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-[6px] flex items-center justify-center transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            title="Create New Item"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenNewItem}
            className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs py-2 px-3 rounded-[6px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Item</span>
          </button>
        )}
      </div>

      {/* Major Hub Navigation List */}
      <div className={`flex-1 flex flex-col gap-1 my-3 overflow-y-auto custom-scrollbar w-full ${isCollapsed ? 'items-center' : ''}`}>
        <div className={`px-2 py-1 text-[10px] font-mono uppercase text-zinc-500 tracking-wider font-semibold ${isCollapsed ? 'sr-only' : 'block'}`}>
          Hubs
        </div>

        {hubs.map((hub) => {
          const isActive = currentHub === hub.id;

          if (isCollapsed) {
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => onSelectHub(hub.id)}
                title={`${hub.label}: ${hub.description}`}
                className={`w-10 h-10 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer relative group ${
                  isActive
                    ? 'text-orange-400 bg-orange-950/40 border border-orange-500/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[19px]"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {hub.icon}
                </span>

                {/* Hub Badge Dot if count or active */}
                {hub.count !== undefined && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500"></span>
                )}
              </button>
            );
          }

          return (
            <button
              key={hub.id}
              type="button"
              onClick={() => onSelectHub(hub.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-[6px] text-left transition-colors cursor-pointer ${
                isActive
                  ? 'text-orange-400 bg-orange-950/40 border border-orange-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="material-symbols-outlined text-[18px] shrink-0"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {hub.icon}
                </span>
                <span className="truncate">{hub.label}</span>
              </div>

              {hub.count !== undefined ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[6px] bg-zinc-800/80 text-zinc-400 font-semibold">
                  {hub.count}
                </span>
              ) : isActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Bottom Rail Actions */}
      <div className={`shrink-0 flex flex-col gap-1 pt-2 border-t border-[#27272a] w-full ${isCollapsed ? 'items-center' : ''}`}>
        {/* Settings */}
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => onSelectHub('settings')}
            title="Workspace Settings"
            className="w-10 h-10 rounded-[6px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">settings</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelectHub('settings')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-[6px] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </button>
        )}

        {/* Command Palette / Quick Actions */}
        {isCollapsed ? (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Quick Actions (⌘K)"
            className="w-10 h-10 rounded-[6px] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-colors cursor-pointer font-mono"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 rounded-[6px] transition-colors font-mono cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px]">bolt</span>
              <span>Quick Actions</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-[10px] text-zinc-400">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Rail Collapse / Expand Toggle */}
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand primary sidebar (⌘[)"
            className="w-10 h-10 rounded-[6px] flex items-center justify-center text-zinc-400 hover:text-orange-400 hover:bg-zinc-800/40 transition-colors cursor-pointer mt-1"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-400 hover:text-orange-400 hover:bg-zinc-800/40 rounded-[6px] transition-colors cursor-pointer mt-1"
            title="Collapse primary sidebar (⌘[)"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              <span>Collapse</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded-[6px] bg-[#18181b] border border-[#27272a] text-[10px] text-zinc-500 font-mono">
              ⌘[
            </kbd>
          </button>
        )}
      </div>
    </aside>
  );
};
