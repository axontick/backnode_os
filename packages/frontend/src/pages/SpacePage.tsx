import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { SpaceFolder, FolderChildItem } from '../types';
import { getAllItemsFromFolder } from '../utils/treeUtils';

export const SpacePage: React.FC = () => {
  const { spaceId, folderId, subFolderId } = useParams<{ spaceId?: string; folderId?: string; subFolderId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    activeUserSpaceId,
    userSpaces,
    folders,
    tasks,
    handleUpdateFolder,
    handleOpenAddListToFolder,
    handleOpenAddSubFolder,
    showToast,
    listSettings,
    handleUpdateListSettings,
    statuses,
    handleUpdateStatuses,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${currentSpaceId}`;

  // Find the target folder/space
  const targetFolderId = folderId || (spaceId && folders.some((f) => f.id === spaceId) ? spaceId : folders[0]?.id);
  const folder: SpaceFolder | undefined =
    folders.find((f) => f.id === targetFolderId) || folders[0];

  // Route-driven tab: /spaces/:folderId/settings or /customize -> 'customize'
  const isSettingsRoute = location.pathname.endsWith('/settings') || location.pathname.endsWith('/customize');
  const activeTab: 'overview' | 'customize' = isSettingsRoute ? 'customize' : 'overview';

  // Space Customization Form State
  const [name, setName] = useState(folder?.name || '');
  const [icon, setIcon] = useState(folder?.icon || 'folder_open');
  const [color, setColor] = useState(folder?.color || '#ea580c');
  const [description, setDescription] = useState(folder?.description || '');
  const [defaultView, setDefaultView] = useState<'board' | 'table' | 'list' | 'timeline' | 'calendar' | 'docs'>(
    'board'
  );

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setIcon(folder.icon || 'folder_open');
      setColor(folder.color || '#ea580c');
      setDescription(folder.description || '');
    }
  }, [folder?.id, folder?.name, folder?.icon, folder?.color, folder?.description]);

  if (!folder) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#09090b] text-zinc-400 select-none">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-zinc-600">folder_off</span>
          <p className="text-sm">No Space found matching this identifier.</p>
          <Link
            to={`${spacePrefix}/spaces`}
            className="px-3 py-1.5 rounded-[6px] bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors"
          >
            Back to Task Spaces
          </Link>
        </div>
      </div>
    );
  }

  // Calculate metrics for this space
  const allChildLists: FolderChildItem[] = getAllItemsFromFolder(folder);
  const childListIds = new Set(allChildLists.map((i) => i.id));
  const spaceTasks = tasks.filter(
    (t) =>
      childListIds.has(t.targetCycle) ||
      t.targetCycle.toLowerCase().includes(folder.name.toLowerCase()) ||
      allChildLists.some((cl) => t.targetCycle.toLowerCase().includes(cl.name.toLowerCase()))
  );

  const totalTasks = spaceTasks.length || allChildLists.reduce((sum, cl) => sum + cl.taskCount, 0);
  const doneTasks = spaceTasks.filter((t) => t.status === 'Done').length;
  const inProgressTasks = spaceTasks.filter((t) => t.status === 'In Progress').length;
  const urgentTasks = spaceTasks.filter((t) => t.priority === 'Urgent').length;
  const totalPoints = spaceTasks.reduce((sum, t) => sum + (t.estimation?.points || 0), 0);

  const handleSaveSpaceCustomizations = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    handleUpdateFolder({
      ...folder,
      name: name.trim(),
      icon,
      color,
      description: description.trim(),
    });

    handleUpdateListSettings({
      ...listSettings,
      defaultView: defaultView === 'table' ? 'Spreadsheet' : defaultView === 'list' ? 'Standard List' : 'Board',
    });

    showToast(`Space "${name}" customization saved!`);
    navigate(`${spacePrefix}/spaces/${folder.id}`);
  };

  const currentSubFolder = subFolderId ? folder.subFolders?.find((sf) => sf.id === subFolderId) : undefined;
  const displayedLists: FolderChildItem[] = currentSubFolder
    ? currentSubFolder.items || []
    : folder.items;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] text-zinc-100 overflow-y-auto select-none font-sans">
      {/* Space Hero & Header */}
      <div className="px-6 py-5 bg-[#121214] border-b border-[#27272a] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[6px] flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: folder.color || '#ea580c' }}
            >
              <span className="material-symbols-outlined text-[22px]">
                {folder.icon || 'folder_open'}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight font-headline">
                  {folder.name}
                </h1>
                <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-semibold bg-orange-950/40 text-orange-400 border border-orange-500/30 uppercase">
                  Space Hub
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {folder.id}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1 max-w-xl">
                {folder.description || 'Dedicated space for engineering cycles, sprint backlogs, and workflows.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenAddListToFolder(folder)}
              className="px-3 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">playlist_add</span>
              <span>+ New List</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddSubFolder(folder)}
              className="px-3 py-1.5 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-[#27272a] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">create_new_folder</span>
              <span>+ Sub-Folder</span>
            </button>
          </div>
        </div>

        {/* Tab Controls: Overview vs Customize Space */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-[#27272a]/60">
          <button
            type="button"
            onClick={() => navigate(subFolderId ? `${spacePrefix}/spaces/${folder.id}/folders/${subFolderId}` : `${spacePrefix}/spaces/${folder.id}`)}
            className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">dashboard</span>
            <span>Space Overview & Lists</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${spacePrefix}/spaces/${folder.id}/settings`)}
            className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'customize'
                ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>Customize Space Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 flex-1 flex flex-col gap-6">
        {activeTab === 'overview' ? (
          <>
            {/* Bento Grid: Space KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tile 1: Total Lists */}
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 shadow-sm hover:border-orange-500/50 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider">Child Lists</span>
                  <span className="material-symbols-outlined text-[18px] text-zinc-500">format_list_bulleted</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-zinc-100">{allChildLists.length}</span>
                  <span className="text-xs text-zinc-500">active lists</span>
                </div>
              </div>

              {/* Tile 2: Total Tasks */}
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 shadow-sm hover:border-orange-500/50 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider">Volume & Velocity</span>
                  <span className="material-symbols-outlined text-[18px] text-orange-400">task_alt</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-zinc-100">{totalTasks}</span>
                  <span className="text-xs text-zinc-500">tasks total</span>
                </div>
              </div>

              {/* Tile 3: Execution Progress */}
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 shadow-sm hover:border-orange-500/50 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider">In Progress</span>
                  <span className="material-symbols-outlined text-[18px] text-amber-400">timelapse</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-amber-400">{inProgressTasks}</span>
                  <span className="text-xs text-zinc-500">in execution</span>
                </div>
              </div>

              {/* Tile 4: Story Points */}
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 shadow-sm hover:border-orange-500/50 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider">Story Points</span>
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">bolt</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-emerald-400">{totalPoints}</span>
                  <span className="text-xs text-zinc-500">estimated pts</span>
                </div>
              </div>
            </div>

            {/* Sub-Folder Scoped Filter Notice if active */}
            {currentSubFolder && (
              <div className="bg-orange-950/20 border border-orange-500/30 rounded-[6px] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-orange-400 text-[18px]">folder_open</span>
                  <span className="text-zinc-300 font-medium">Viewing sub-folder scope:</span>
                  <span className="text-orange-400 font-semibold bg-orange-950/60 px-2 py-0.5 rounded-[6px] border border-orange-500/20 font-mono">
                    {currentSubFolder.name}
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">
                    ({displayedLists.length} lists)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`${spacePrefix}/spaces/${folder.id}`)}
                  className="px-2.5 py-1 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-[#27272a] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  <span>Clear Filter</span>
                </button>
              </div>
            )}

            {/* Lists in this Space Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-[18px]">view_list</span>
                  <h2 className="text-sm font-semibold text-zinc-100 font-headline">
                    Lists Inside {currentSubFolder ? `${folder.name} / ${currentSubFolder.name}` : folder.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono bg-zinc-800 text-zinc-400">
                    {displayedLists.length} Lists
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddListToFolder(folder, currentSubFolder?.id)}
                  className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Add List</span>
                </button>
              </div>

              {displayedLists.length === 0 ? (
                <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-8 text-center text-zinc-400 text-xs">
                  No lists found in this Space scope. Click "+ New List" above to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedLists.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col justify-between hover:border-orange-500/50 transition-all group"
                    >
                      <div
                        onClick={() => navigate(currentSubFolder ? `${spacePrefix}/spaces/${folder.id}/folders/${currentSubFolder.id}/lists/${item.id}/board` : `${spacePrefix}/spaces/${folder.id}/lists/${item.id}/board`)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`material-symbols-outlined text-[18px] shrink-0 ${item.color ? '' : 'text-orange-400'}`}
                              style={item.color ? { color: item.color } : undefined}
                            >
                              {item.icon || 'format_list_bulleted'}
                            </span>
                            <span className="text-xs font-semibold text-zinc-100 font-headline group-hover:text-orange-400 transition-colors">
                              {item.name}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono bg-zinc-800 text-zinc-400">
                            {item.taskCount} tasks
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mb-3">
                          Status: <span className="text-zinc-200 font-medium">{item.status || 'Active'}</span>
                        </p>
                      </div>

                      {/* View Routing Buttons */}
                      <div className="pt-3 border-t border-[#27272a] flex items-center justify-between gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => navigate(currentSubFolder ? `${spacePrefix}/spaces/${folder.id}/folders/${currentSubFolder.id}/lists/${item.id}/board` : `${spacePrefix}/spaces/${folder.id}/lists/${item.id}/board`)}
                          className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-orange-950/40 hover:text-orange-400 hover:border-orange-500/30 border border-[#27272a] text-zinc-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">view_kanban</span>
                          <span>Board</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(currentSubFolder ? `${spacePrefix}/spaces/${folder.id}/folders/${currentSubFolder.id}/lists/${item.id}/table` : `${spacePrefix}/spaces/${folder.id}/lists/${item.id}/table`)}
                          className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-orange-950/40 hover:text-orange-400 hover:border-orange-500/30 border border-[#27272a] text-zinc-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">table_chart</span>
                          <span>Table</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(currentSubFolder ? `${spacePrefix}/spaces/${folder.id}/folders/${currentSubFolder.id}/lists/${item.id}/list` : `${spacePrefix}/spaces/${folder.id}/lists/${item.id}/list`)}
                          className="px-2 py-1 rounded-[6px] bg-[#18181b] hover:bg-orange-950/40 hover:text-orange-400 hover:border-orange-500/30 border border-[#27272a] text-zinc-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">list</span>
                          <span>List</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-Folders Section */}
            {folder.subFolders && folder.subFolders.length > 0 && !currentSubFolder && (
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-zinc-400 text-[18px]">folder_copy</span>
                  <h2 className="text-sm font-semibold text-zinc-100 font-headline">
                    Sub-Folders in {folder.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {folder.subFolders.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-[#121214] border border-[#27272a] rounded-[6px] p-4 flex flex-col gap-3"
                    >
                      <div
                        onClick={() => navigate(`${spacePrefix}/spaces/${folder.id}/folders/${sub.id}`)}
                        className="flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ color: sub.color || '#ea580c' }}
                          >
                            {sub.icon || 'folder_open'}
                          </span>
                          <span className="text-xs font-semibold text-zinc-100 font-headline group-hover:text-orange-400 transition-colors">
                            {sub.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-orange-400 transition-colors">
                          {sub.items?.length || 0} lists →
                        </span>
                      </div>

                      {sub.items && sub.items.length > 0 ? (
                        <div className="flex flex-col gap-1.5 pl-2 border-l border-[#27272a]">
                          {sub.items.map((subItem) => (
                            <div
                              key={subItem.id}
                              onClick={() => navigate(`${spacePrefix}/spaces/${folder.id}/lists/${subItem.id}/board`)}
                              className="flex items-center justify-between py-1.5 px-2 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-xs text-zinc-200 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-2 truncate">
                                  <span
                                    className={`material-symbols-outlined text-[14px] shrink-0 ${subItem.color ? '' : 'text-zinc-500'}`}
                                    style={subItem.color ? { color: subItem.color } : undefined}
                                  >
                                    {subItem.icon || 'checklist'}
                                  </span>
                                  <span className="truncate">{subItem.name}</span>
                                </div>
                              <span className="text-[10px] font-mono text-orange-400 font-semibold">
                                {subItem.taskCount} tasks
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">No lists in this sub-folder</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Customize Space Settings & Workflows Tab */
          <div className="max-w-2xl bg-[#121214] border border-[#27272a] rounded-[6px] p-6 shadow-sm">
            <div className="border-b border-[#27272a] pb-4 mb-6">
              <h2 className="text-base font-bold text-zinc-100 font-headline">
                Customize Space: {folder.name}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Configure visual metadata, default views, and workflow rules for this space.
              </p>
            </div>

            <form onSubmit={handleSaveSpaceCustomizations} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Space Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="e.g. Engineering & Core Protocol"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Purpose and goals of this space..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Icon (Material Symbol)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-orange-400">
                      {icon || 'folder_open'}
                    </span>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs font-mono focus:outline-none focus:border-orange-500"
                      placeholder="deployed_code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-[6px] border border-[#27272a] shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs font-mono focus:outline-none focus:border-orange-500"
                      placeholder="#ea580c"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Default View for Lists in this Space
                </label>
                <select
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-zinc-100 text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="board">Kanban Board View</option>
                  <option value="table">Deliverables Table View</option>
                  <option value="list">Structured List View</option>
                  <option value="timeline">Gantt Timeline View</option>
                  <option value="calendar">Monthly Calendar View</option>
                  <option value="docs">Documentation Canvas View</option>
                </select>
              </div>

              {/* Status Columns in this Space */}
              <div className="pt-2 border-t border-[#27272a]">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Workflow Statuses ({statuses.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((st) => (
                    <span
                      key={st.id}
                      className="px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium bg-[#18181b] border border-[#27272a] flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                      <span>{st.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#27272a] mt-2">
                <button
                  type="button"
                  onClick={() => navigate(subFolderId ? `${spacePrefix}/spaces/${folder.id}/folders/${subFolderId}` : `${spacePrefix}/spaces/${folder.id}`)}
                  className="px-4 py-2 rounded-[6px] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-[#27272a] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[6px] bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Save Space Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
