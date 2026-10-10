import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { SecurityPolicy } from '../utils/security';

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
  const location = useLocation();
  const navigate = useNavigate();
  const { spaceId } = useParams<{ spaceId?: string }>();

  const {
    userSpaces,
    activeUserSpace,
    activeUserSpaceId,
    handleSelectUserSpace,
    members,
    setIsNewWorkspaceModalOpen,
  } = useWorkspace();

  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const spaceDropdownRef = useRef<HTMLDivElement>(null);

  // Close workspace dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (spaceDropdownRef.current && !spaceDropdownRef.current.contains(e.target as Node)) {
        setIsSpaceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const initialLetter = activeUserSpace?.name ? activeUserSpace.name.charAt(0).toUpperCase() : 'B';
  const accountName = user?.account?.name || 'Backnode Operations';
  const operatorName = user?.name ? user.name.split(' ')[0] : 'Operator';

  const currentMember = members.find(
    (m) =>
      (user?.email && m.email?.toLowerCase() === user.email.toLowerCase()) ||
      m.id === user?.id
  );
  const canWrite = SecurityPolicy.canPerformAction(user, currentMember, 'write');

  // Derive active space prefix
  const effectiveSpaceId = spaceId || activeUserSpaceId || activeUserSpace?.id || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${effectiveSpaceId}`;

  // Derive active hub from current route pathname
  const pathname = location.pathname;
  const normalizedPath = pathname.replace(/^\/space\/[^/]+/, '');
  let effectiveHub = currentHub;
  if (normalizedPath === '' || normalizedPath === '/' || normalizedPath.startsWith('/dashboard') || normalizedPath.startsWith('/overview')) {
    effectiveHub = 'overview';
  } else if (normalizedPath.startsWith('/spaces') || normalizedPath.startsWith('/lists')) {
    effectiveHub = 'task-spaces';
  } else if (normalizedPath.startsWith('/crm')) {
    effectiveHub = 'crm';
  } else if (normalizedPath.startsWith('/contacts')) {
    effectiveHub = 'contacts';
  } else if (normalizedPath.startsWith('/team')) {
    effectiveHub = 'team';
  } else if (normalizedPath.startsWith('/settings')) {
    effectiveHub = 'settings';
  }

  const hubs = [
    { id: 'overview', path: `${spacePrefix}/dashboard`, label: 'Overview', icon: 'dashboard', description: 'System Overview & KPIs' },
    { id: 'task-spaces', path: `${spacePrefix}/spaces`, label: 'Task Spaces', icon: 'folder_open', description: 'Execution Workspaces' },
    { id: 'crm', path: `${spacePrefix}/crm`, label: 'CRM Pipelines', icon: 'leaderboard', description: 'Deals & Revenue Pipeline' },
    { id: 'contacts', path: `${spacePrefix}/contacts`, label: 'Contacts', icon: 'group', description: 'Client & Partner Directory' },
    { id: 'team', path: `${spacePrefix}/team`, label: 'Team & Access', icon: 'shield_person', description: 'Access Controls & Roles', count: members.length },
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
              {activeUserSpace?.icon ? (
                <span className="material-symbols-outlined text-[20px]">{activeUserSpace.icon}</span>
              ) : (
                <span>{initialLetter}</span>
              )}
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
                  {activeUserSpace?.icon ? (
                    <span className="material-symbols-outlined text-[16px]">{activeUserSpace.icon}</span>
                  ) : (
                    initialLetter
                  )}
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
                        const subRoute = location.pathname.replace(/^\/space\/[^/]+/, '') || '/dashboard';
                        navigate(`/space/${space.id}${subRoute}`);
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
                          {space.icon ? (
                            <span className="material-symbols-outlined text-[14px]">{space.icon}</span>
                          ) : (
                            space.name.charAt(0).toUpperCase()
                          )}
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

              {/* Trigger External New Workspace Modal */}
              <button
                type="button"
                onClick={() => {
                  setIsSpaceDropdownOpen(false);
                  setIsNewWorkspaceModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[6px] bg-[#18181b] hover:bg-orange-950/40 text-orange-400 hover:text-orange-300 border border-dashed border-orange-500/40 hover:border-orange-500 font-semibold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Create Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        {isCollapsed ? (
          <button
            type="button"
            disabled={!canWrite}
            onClick={onOpenNewItem}
            className={`w-10 h-10 rounded-[6px] flex items-center justify-center transition-all shadow-sm active:scale-[0.98] ${
              canWrite
                ? 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white cursor-pointer'
                : 'bg-zinc-800/50 text-zinc-600 border border-[#27272a] cursor-not-allowed opacity-50'
            }`}
            title={canWrite ? 'Create New Item' : 'Write / Authoring clearance required'}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={!canWrite}
            onClick={onOpenNewItem}
            className={`w-full font-semibold text-xs py-2 px-3 rounded-[6px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] ${
              canWrite
                ? 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white cursor-pointer'
                : 'bg-zinc-800/50 text-zinc-600 border border-[#27272a] cursor-not-allowed opacity-50'
            }`}
            title={canWrite ? 'Create New Item' : 'Write / Authoring clearance required'}
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
          const isActive = effectiveHub === hub.id;
          const isAuthorized = SecurityPolicy.canAccessPage(user, currentMember, hub.id);

          if (isCollapsed) {
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => {
                  onSelectHub(hub.id);
                  navigate(hub.path);
                }}
                title={`${hub.label}: ${hub.description}${!isAuthorized ? ' (Clearance Required)' : ''}`}
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

                {!isAuthorized ? (
                  <span className="absolute top-1 right-1 material-symbols-outlined text-[11px] text-zinc-500">
                    lock
                  </span>
                ) : hub.count !== undefined ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500"></span>
                ) : null}
              </button>
            );
          }

          return (
            <button
              key={hub.id}
              type="button"
              onClick={() => {
                onSelectHub(hub.id);
                navigate(hub.path);
              }}
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

              {!isAuthorized ? (
                <span className="material-symbols-outlined text-[14px] text-zinc-500 shrink-0" title="Restricted clearance required">
                  lock
                </span>
              ) : hub.count !== undefined ? (
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
        {(() => {
          const isSettingsAuthorized = SecurityPolicy.canAccessPage(user, currentMember, 'settings');

          if (isCollapsed) {
            return (
              <button
                type="button"
                onClick={() => {
                  onSelectHub('settings');
                  navigate(`${spacePrefix}/settings`);
                }}
                title={`Workspace Settings${!isSettingsAuthorized ? ' (Clearance Required)' : ''}`}
                className={`w-10 h-10 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer relative ${
                  effectiveHub === 'settings'
                    ? 'text-orange-400 bg-orange-950/40 border border-orange-500/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[19px]"
                  style={{
                    fontVariationSettings: effectiveHub === 'settings' ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  settings
                </span>
                {!isSettingsAuthorized && (
                  <span className="absolute top-1 right-1 material-symbols-outlined text-[11px] text-zinc-500">
                    lock
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={() => {
                onSelectHub('settings');
                navigate(`${spacePrefix}/settings`);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-[6px] transition-colors cursor-pointer ${
                effectiveHub === 'settings'
                  ? 'text-orange-400 bg-orange-950/40 border border-orange-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{
                    fontVariationSettings: effectiveHub === 'settings' ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  settings
                </span>
                <span>Settings</span>
              </div>
              {!isSettingsAuthorized && (
                <span className="material-symbols-outlined text-[14px] text-zinc-500 shrink-0" title="Restricted clearance required">
                  lock
                </span>
              )}
            </button>
          );
        })()}

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
