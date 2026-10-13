import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SpaceFolder, SpaceSubFolder, CrmPipeline, CrmPipelineSubFolder, FolderChildItem } from '../types';
import { ActionContextMenu } from './ActionContextMenu';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { SecurityPolicy } from '../utils/security';
import { MoveListModal } from './MoveListModal';
import { MovePipelineSubFolderModal } from './MovePipelineSubFolderModal';

export interface InnerSidebarProps {
  currentHub: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;

  // Task Spaces props
  folders?: SpaceFolder[];
  activeSpace?: string;
  currentView?: string;
  onSelectSpace?: (spaceId: string) => void;
  onSelectDashboard?: () => void;
  onOpenAddFolder?: () => void;
  onOpenAddListToFolder?: (folder: SpaceFolder) => void;
  onEditFolder?: (folder: SpaceFolder) => void;
  onDeleteFolder?: (folder: SpaceFolder) => void;
  onOpenAddSubFolder?: (folder: SpaceFolder, parentSubFolderId?: string) => void;
  onEditSubFolder?: (folder: SpaceFolder, subFolder: SpaceSubFolder) => void;
  onDeleteSubFolder?: (folder: SpaceFolder, subFolder: SpaceSubFolder) => void;
  onOpenAddListToSubFolder?: (folder: SpaceFolder, subFolder: SpaceSubFolder) => void;

  // CRM props
  pipelines?: CrmPipeline[];
  activePipelineId?: string;
  activePipelineSubFolderId?: string | null;
  crmView?: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings' | 'archived';
  onSelectPipeline?: (pipelineId: string) => void;
  onSelectPipelineSubFolder?: (pipelineId: string, subFolderId: string) => void;
  onSelectCrmDashboard?: () => void;
  onSelectCrmBoard?: () => void;
  onSelectPipelineView?: (pipelineId: string, view: 'board' | 'analytics' | 'settings' | 'archived') => void;
  onOpenAddPipeline?: () => void;
  onEditPipeline?: (pipeline: CrmPipeline) => void;
  onDeletePipeline?: (pipeline: CrmPipeline) => void;
  onOpenAddPipelineSubFolder?: (pipeline: CrmPipeline, parentSubFolderId?: string) => void;
  onEditPipelineSubFolder?: (pipeline: CrmPipeline, subFolder: CrmPipelineSubFolder) => void;
  onDeletePipelineSubFolder?: (pipeline: CrmPipeline, subFolder: CrmPipelineSubFolder) => void;
}

interface RecursiveSubFolderNodeProps {
  folder: SpaceFolder;
  subFolder: SpaceSubFolder;
  depth: number;
  expandedSubFolderIds: Record<string, boolean>;
  toggleSubFolder: (id: string, e?: React.MouseEvent) => void;
  activeSpace?: string;
  currentView?: string;
  onSelectSpace?: (spaceId: string) => void;
  onOpenAddListToSubFolder?: (folder: SpaceFolder, subFolder: SpaceSubFolder) => void;
  onOpenAddSubFolder?: (folder: SpaceFolder, parentSubFolderId?: string) => void;
  onEditSubFolder?: (folder: SpaceFolder, subFolder: SpaceSubFolder) => void;
  onDeleteSubFolder?: (folder: SpaceFolder, subFolder: SpaceSubFolder) => void;
  onOpenMoveList?: (list: FolderChildItem, folderId: string, subFolderId?: string) => void;
  onDeleteList?: (list: FolderChildItem, folderId: string) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  filterText: string;
  isReadOnly?: boolean;
}

const RecursiveSubFolderNode: React.FC<RecursiveSubFolderNodeProps> = ({
  folder,
  subFolder,
  depth,
  expandedSubFolderIds,
  toggleSubFolder,
  activeSpace,
  currentView,
  onSelectSpace,
  onOpenAddListToSubFolder,
  onOpenAddSubFolder,
  onEditSubFolder,
  onDeleteSubFolder,
  onOpenMoveList,
  onDeleteList,
  activeMenuId,
  setActiveMenuId,
  filterText,
  isReadOnly = false,
}) => {
  const navigate = useNavigate();
  const { spaceId } = useParams<{ spaceId?: string }>();
  const { listSettings, tasks } = useWorkspace();
  const spacePrefix = spaceId ? `/space/${spaceId}` : '';
  const isExpanded = !!expandedSubFolderIds[subFolder.id] || Boolean(filterText);
  const hasItems = subFolder.items && subFolder.items.length > 0;
  const hasSubFolders = subFolder.subFolders && subFolder.subFolders.length > 0;

  return (
    <div className="flex flex-col mt-0.5">
      {/* Sub-Folder Header */}
      <div
        onClick={() => toggleSubFolder(subFolder.id)}
        className="flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all cursor-pointer group/sub select-none"
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          <button
            type="button"
            onClick={(e) => toggleSubFolder(subFolder.id, e)}
            className="w-3.5 h-3.5 flex items-center justify-center text-zinc-500 group-hover/sub:text-orange-400 transition-all cursor-pointer shrink-0"
          >
            <span
              className={`material-symbols-outlined text-[13px] transition-transform duration-200 ${
                isExpanded ? 'rotate-90 text-orange-400' : 'rotate-0'
              }`}
            >
              chevron_right
            </span>
          </button>
          <span
            className="material-symbols-outlined text-[14px] shrink-0"
            style={{ color: subFolder.color && subFolder.color !== '#9900c2' ? subFolder.color : '#ea580c' }}
          >
            {!subFolder.icon || subFolder.icon === 'building' ? 'folder_open' : subFolder.icon}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${spacePrefix}/spaces/${folder.id}/folders/${subFolder.id}`);
            }}
            className="truncate text-[11.5px] font-medium text-zinc-300 hover:text-orange-400 transition-colors cursor-pointer"
            title={`View sub-folder: ${subFolder.name}`}
          >
            {subFolder.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
            {subFolder.items?.length || 0}
          </span>

          <div className="flex items-center gap-1.5">
            {!isReadOnly && onOpenAddListToSubFolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddListToSubFolder(folder, subFolder);
                }}
                className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all opacity-0 group-hover/sub:opacity-100 cursor-pointer"
                title="Add list under this sub-folder"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
              </button>
            )}

            {!isReadOnly && (
              <div className="relative shrink-0 flex items-center">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === `subfld-${subFolder.id}` ? null : `subfld-${subFolder.id}`);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={activeMenuId === `subfld-${subFolder.id}`}
                  className={`w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none ${
                    activeMenuId === `subfld-${subFolder.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover/sub:opacity-100'
                  }`}
                  title="Sub-folder actions"
                >
                  <span className="material-symbols-outlined text-[14px]">more_vert</span>
                </button>
                <ActionContextMenu
                  isOpen={activeMenuId === `subfld-${subFolder.id}`}
                  onClose={() => setActiveMenuId(null)}
                  onEdit={() => onEditSubFolder?.(folder, subFolder)}
                  onDelete={() => onDeleteSubFolder?.(folder, subFolder)}
                  onAddChild={onOpenAddListToSubFolder ? () => onOpenAddListToSubFolder(folder, subFolder) : undefined}
                  onAddSubFolder={onOpenAddSubFolder ? () => onOpenAddSubFolder(folder, subFolder.id) : undefined}
                  addChildLabel="Add List"
                  addChildIcon="playlist_add"
                  addSubFolderLabel="Add Sub-folder"
                  addSubFolderIcon="create_new_folder"
                  editLabel="Edit Sub-folder"
                  deleteLabel="Delete Sub-folder"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Folder Children (lists + nested subfolders) */}
      {isExpanded && (
        <div className="flex flex-col gap-0.5 pl-3 ml-2.5 my-0.5 border-l border-[#27272a]/80">
          {/* Direct Lists */}
          {hasItems &&
            subFolder.items!
              .filter((subItem) => {
                if (!filterText.trim()) return true;
                const q = filterText.toLowerCase();
                return subItem.name.toLowerCase().includes(q) || subFolder.name.toLowerCase().includes(q);
              })
              .map((subItem) => {
                const isActive = activeSpace === subItem.id && currentView !== 'dashboard';
                const isMatchingListSettings = listSettings && (subItem.id === listSettings.listId || (isActive && (listSettings.icon || listSettings.color)));
                const lower = (subItem.name + ' ' + subItem.id).toLowerCase();
                const spaceIcon = (subItem as any).icon || (isMatchingListSettings && listSettings?.icon ? listSettings.icon : null) || (lower.includes('infra') || lower.includes('devops')
                  ? 'terminal'
                  : lower.includes('client') || lower.includes('deliverable')
                  ? 'inventory_2'
                  : lower.includes('bug') || lower.includes('triage')
                  ? 'bug_report'
                  : lower.includes('design') || lower.includes('ui')
                  ? 'palette'
                  : lower.includes('sprint') || lower.includes('backlog')
                  ? 'checklist'
                  : 'format_list_bulleted');
                const spaceColor = (subItem as any).color || (isMatchingListSettings && listSettings?.color ? listSettings.color : null);

                return (
                  <div
                    key={subItem.id}
                    className={`flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-[11px] transition-all group/item ${
                      isActive
                        ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSpace?.(subItem.id)}
                      className="flex items-center gap-1.5 truncate flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-[13px] shrink-0 transition-colors ${
                          spaceColor ? '' : (isActive ? 'text-orange-400' : 'text-zinc-500 group-hover/item:text-zinc-300')
                        }`}
                        style={spaceColor ? { color: spaceColor } : undefined}
                      >
                        {spaceIcon}
                      </span>
                      <span className="truncate">{subItem.name}</span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-1.5">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-[6px] shrink-0 font-semibold ${
                          isActive
                            ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30'
                            : 'bg-zinc-800/80 text-zinc-400'
                        }`}
                      >
                        {tasks.filter((t) => t.listId === subItem.id).length}
                      </span>

                      {!isReadOnly && (
                        <div className="relative shrink-0 flex items-center">
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === `sublist-${subItem.id}` ? null : `sublist-${subItem.id}`);
                            }}
                            aria-haspopup="menu"
                            aria-expanded={activeMenuId === `sublist-${subItem.id}`}
                            className={`w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none ${
                              activeMenuId === `sublist-${subItem.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover/item:opacity-100'
                            }`}
                            title="List actions"
                          >
                            <span className="material-symbols-outlined text-[14px]">more_vert</span>
                          </button>
                          <ActionContextMenu
                            isOpen={activeMenuId === `sublist-${subItem.id}`}
                            onClose={() => setActiveMenuId(null)}
                            items={[
                              {
                                label: 'List Settings',
                                icon: 'tune',
                                iconColor: 'text-orange-400',
                                onClick: () => {
                                  navigate(`${spacePrefix}/spaces/${folder.id}/folders/${subFolder.id}/lists/${subItem.id}/settings`);
                                },
                              },
                              {
                                label: 'Move to Folder',
                                icon: 'drive_file_move',
                                iconColor: 'text-zinc-300',
                                onClick: () => {
                                  onOpenMoveList?.(subItem, folder.id, subFolder.id);
                                },
                              },
                              {
                                label: 'Delete List',
                                icon: 'delete',
                                danger: true,
                                onClick: () => {
                                  onDeleteList?.(subItem, folder.id);
                                },
                              },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

          {/* Nested Sub-Folders Recursively */}
          {hasSubFolders &&
            subFolder.subFolders!
              .filter((childSub) => {
                if (!filterText.trim()) return true;
                const q = filterText.toLowerCase();
                const matchesChild = (cs: SpaceSubFolder): boolean => {
                  if (cs.name.toLowerCase().includes(q)) return true;
                  if (cs.items?.some((i) => i.name.toLowerCase().includes(q))) return true;
                  if (cs.subFolders?.some(matchesChild)) return true;
                  return false;
                };
                return matchesChild(childSub) || subFolder.name.toLowerCase().includes(q);
              })
              .map((childSub) => (
                <RecursiveSubFolderNode
                  key={childSub.id}
                  folder={folder}
                  subFolder={childSub}
                  depth={depth + 1}
                  expandedSubFolderIds={expandedSubFolderIds}
                  toggleSubFolder={toggleSubFolder}
                  activeSpace={activeSpace}
                  currentView={currentView}
                  onSelectSpace={onSelectSpace}
                  onOpenAddListToSubFolder={onOpenAddListToSubFolder}
                  onOpenAddSubFolder={onOpenAddSubFolder}
                  onEditSubFolder={onEditSubFolder}
                  onDeleteSubFolder={onDeleteSubFolder}
                  onOpenMoveList={onOpenMoveList}
                  onDeleteList={onDeleteList}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  filterText={filterText}
                  isReadOnly={isReadOnly}
                />
              ))}

          {!hasItems && !hasSubFolders && (
            <div className="py-0.5 px-2 text-[10px] text-zinc-500 italic">Empty sub-folder</div>
          )}
        </div>
      )}
    </div>
  );
};

interface RecursivePipelineSubFolderNodeProps {
  pipe: CrmPipeline;
  subFolder: CrmPipelineSubFolder;
  depth: number;
  expandedSubFolderIds: Record<string, boolean>;
  toggleSubFolder: (id: string, e?: React.MouseEvent) => void;
  activePipelineSubFolderId?: string | null;
  onSelectPipelineSubFolder?: (pipelineId: string, subFolderId: string) => void;
  onOpenAddPipelineSubFolder?: (pipeline: CrmPipeline, parentSubFolderId?: string) => void;
  onEditPipelineSubFolder?: (pipeline: CrmPipeline, subFolder: CrmPipelineSubFolder) => void;
  onDeletePipelineSubFolder?: (pipeline: CrmPipeline, subFolder: CrmPipelineSubFolder) => void;
  onOpenMovePipelineSubFolder?: (subFolder: CrmPipelineSubFolder, pipelineId: string) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  filterText: string;
  isReadOnly?: boolean;
}

const RecursivePipelineSubFolderNode: React.FC<RecursivePipelineSubFolderNodeProps> = ({
  pipe,
  subFolder,
  depth,
  expandedSubFolderIds,
  toggleSubFolder,
  activePipelineSubFolderId,
  onSelectPipelineSubFolder,
  onOpenAddPipelineSubFolder,
  onEditPipelineSubFolder,
  onDeletePipelineSubFolder,
  onOpenMovePipelineSubFolder,
  activeMenuId,
  setActiveMenuId,
  filterText,
  isReadOnly = false,
}) => {
  const isSubActive = activePipelineSubFolderId === subFolder.id;
  const isExpanded = !!expandedSubFolderIds[`pipe-${subFolder.id}`] || Boolean(filterText);
  const hasChildSubFolders = subFolder.subFolders && subFolder.subFolders.length > 0;

  return (
    <div className="flex flex-col mt-0.5">
      <div
        className={`group/sub flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
          isSubActive
            ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
        }`}
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {hasChildSubFolders ? (
            <button
              type="button"
              onClick={(e) => toggleSubFolder(`pipe-${subFolder.id}`, e)}
              className="w-3.5 h-3.5 flex items-center justify-center text-zinc-500 group-hover/sub:text-orange-400 transition-all cursor-pointer shrink-0"
            >
              <span
                className={`material-symbols-outlined text-[13px] transition-transform duration-200 ${
                  isExpanded ? 'rotate-90 text-orange-400' : 'rotate-0'
                }`}
              >
                chevron_right
              </span>
            </button>
          ) : (
            <span className="w-1.5" />
          )}

          <button
            type="button"
            onClick={() => onSelectPipelineSubFolder?.(pipe.id, subFolder.id)}
            className="flex items-center gap-1.5 truncate flex-1 min-w-0 text-left cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[13px] shrink-0"
              style={{ color: subFolder.color && subFolder.color !== '#9900c2' ? subFolder.color : '#ea580c' }}
            >
              {!subFolder.icon || subFolder.icon === 'building' ? 'folder' : subFolder.icon}
            </span>
            <span className="truncate">{subFolder.name}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
            {subFolder.dealCount ?? 0}
          </span>
          <div className="flex items-center gap-1.5">
            {!isReadOnly && onOpenAddPipelineSubFolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddPipelineSubFolder(pipe, subFolder.id);
                }}
                className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all opacity-0 group-hover/sub:opacity-100 cursor-pointer"
                title="Add child sub-folder"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
              </button>
            )}

            {!isReadOnly && (
              <div className="relative shrink-0 flex items-center">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === `pipe-sub-${subFolder.id}` ? null : `pipe-sub-${subFolder.id}`);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={activeMenuId === `pipe-sub-${subFolder.id}`}
                  className={`w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none ${
                    activeMenuId === `pipe-sub-${subFolder.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover/sub:opacity-100'
                  }`}
                  title="Sub-folder actions"
                >
                  <span className="material-symbols-outlined text-[14px]">more_vert</span>
                </button>
                <ActionContextMenu
                  isOpen={activeMenuId === `pipe-sub-${subFolder.id}`}
                  onClose={() => setActiveMenuId(null)}
                  items={[
                    ...(onOpenAddPipelineSubFolder
                      ? [
                          {
                            label: 'Add Sub-folder',
                            icon: 'create_new_folder',
                            iconColor: 'text-orange-400',
                            onClick: () => onOpenAddPipelineSubFolder(pipe, subFolder.id),
                          },
                        ]
                      : []),
                    {
                      label: 'Move to Pipeline',
                      icon: 'drive_file_move',
                      iconColor: 'text-zinc-300',
                      onClick: () => {
                        onOpenMovePipelineSubFolder?.(subFolder, pipe.id);
                      },
                    },
                    ...(onEditPipelineSubFolder
                      ? [
                          {
                            label: 'Edit Sub-folder',
                            icon: 'edit',
                            onClick: () => onEditPipelineSubFolder(pipe, subFolder),
                          },
                        ]
                      : []),
                    ...(onDeletePipelineSubFolder
                      ? [
                          {
                            label: 'Delete Sub-folder',
                            icon: 'delete',
                            danger: true,
                            onClick: () => onDeletePipelineSubFolder(pipe, subFolder),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children Subfolders */}
      {(isExpanded || isSubActive) && hasChildSubFolders && (
        <div className="flex flex-col gap-0.5 pl-3 ml-2.5 my-0.5 border-l border-[#27272a]/80">
          {subFolder.subFolders!
            .filter((childSub) => {
              if (!filterText.trim()) return true;
              const q = filterText.toLowerCase();
              const matchesPipeChild = (cs: CrmPipelineSubFolder): boolean => {
                if (cs.name.toLowerCase().includes(q)) return true;
                if (cs.subFolders?.some(matchesPipeChild)) return true;
                return false;
              };
              return matchesPipeChild(childSub) || subFolder.name.toLowerCase().includes(q);
            })
            .map((childSub) => (
              <RecursivePipelineSubFolderNode
                key={childSub.id}
                pipe={pipe}
                subFolder={childSub}
                depth={depth + 1}
                expandedSubFolderIds={expandedSubFolderIds}
                toggleSubFolder={toggleSubFolder}
                activePipelineSubFolderId={activePipelineSubFolderId}
                onSelectPipelineSubFolder={onSelectPipelineSubFolder}
                onOpenAddPipelineSubFolder={onOpenAddPipelineSubFolder}
                onEditPipelineSubFolder={onEditPipelineSubFolder}
                onDeletePipelineSubFolder={onDeletePipelineSubFolder}
                onOpenMovePipelineSubFolder={onOpenMovePipelineSubFolder}
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
                filterText={filterText}
                isReadOnly={isReadOnly}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const InnerSidebar: React.FC<InnerSidebarProps> = ({
  currentHub,
  isCollapsed,
  onToggleCollapse,

  // Task Spaces
  folders = [],
  activeSpace,
  currentView,
  onSelectSpace,
  onSelectDashboard,
  onOpenAddFolder,
  onOpenAddListToFolder,
  onEditFolder,
  onDeleteFolder,
  onOpenAddSubFolder,
  onEditSubFolder,
  onDeleteSubFolder,
  onOpenAddListToSubFolder,

  // CRM
  pipelines = [],
  activePipelineId,
  activePipelineSubFolderId,
  crmView = 'dashboard',
  onSelectPipeline,
  onSelectPipelineSubFolder,
  onSelectCrmDashboard,
  onSelectCrmBoard,
  onSelectPipelineView,
  onOpenAddPipeline,
  onEditPipeline,
  onDeletePipeline,
  onOpenAddPipelineSubFolder,
  onEditPipelineSubFolder,
  onDeletePipelineSubFolder,
}) => {
  const navigate = useNavigate();
  const { effectiveRole } = useAuth();
  const { listSettings, crmSettings, filteredDeals: deals, setItemToDelete, tasks } = useWorkspace();
  const isReadOnly = SecurityPolicy.isReadOnly(effectiveRole);
  const { spaceId } = useParams<{ spaceId?: string }>();
  const spacePrefix = spaceId ? `/space/${spaceId}` : '';
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [listToMove, setListToMove] = useState<{ list: FolderChildItem; folderId: string; subFolderId?: string } | null>(null);
  const [pipeSubFolderToMove, setPipeSubFolderToMove] = useState<{ subFolder: CrmPipelineSubFolder; pipelineId: string } | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({
    'fld-engineering': true,
    'fld-client-deliverables': true,
  });
  const [expandedSubFolderIds, setExpandedSubFolderIds] = useState<Record<string, boolean>>({
    'sub-platform-core': true,
    'sub-enterprise-poc': true,
  });

  const toggleFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const toggleSubFolder = (subFolderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSubFolderIds((prev) => ({
      ...prev,
      [subFolderId]: !prev[subFolderId],
    }));
  };

  // If collapsed, display the slim 28px vertical ribbon
  if (isCollapsed) {
    const hubTitle = currentHub === 'crm' ? 'CRM PIPELINES' : 'TASK SPACES';
    return (
      <aside
        className="shrink-0 h-screen w-7 border-r border-[#27272a] bg-[#121214] text-zinc-100 flex flex-col items-center py-3 select-none z-20 transition-all duration-200"
        title={`Expand sub-navigation (⌘])`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-colors cursor-pointer"
          title="Expand sub-navigation (⌘])"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>

        <div
          onClick={onToggleCollapse}
          className="mt-6 [writing-mode:vertical-lr] text-[10px] font-mono font-bold tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer select-none uppercase"
        >
          {hubTitle}
        </div>
      </aside>
    );
  }

  // Recursive matching helper for space subfolders
  const matchesSubFolder = (sf: SpaceSubFolder, q: string): boolean => {
    if (sf.name.toLowerCase().includes(q)) return true;
    if (sf.items?.some((i) => i.name.toLowerCase().includes(q))) return true;
    if (sf.subFolders?.some((child) => matchesSubFolder(child, q))) return true;
    return false;
  };

  // Recursive matching helper for pipeline subfolders
  const matchesPipeSubFolder = (sf: CrmPipelineSubFolder, q: string): boolean => {
    if (sf.name.toLowerCase().includes(q)) return true;
    if (sf.subFolders?.some((child) => matchesPipeSubFolder(child, q))) return true;
    return false;
  };

  // Filtered Task Space Folders
  const filteredFolders = folders.filter((folder) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const matchFolderName = folder.name.toLowerCase().includes(q);
    const matchSubItem = folder.items?.some((i) => i.name.toLowerCase().includes(q));
    const matchSubFolder = folder.subFolders?.some((sf) => matchesSubFolder(sf, q));
    return matchFolderName || matchSubItem || matchSubFolder;
  });

  // Filtered CRM Pipelines
  const filteredPipelines = pipelines.filter((pipe) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const matchPipeName = pipe.name.toLowerCase().includes(q);
    const matchSubFolder = pipe.subFolders?.some((sf) => matchesPipeSubFolder(sf, q));
    return matchPipeName || matchSubFolder;
  });

  return (
    <aside className="shrink-0 h-screen w-[240px] border-r border-[#27272a] bg-[#121214] text-zinc-100 flex flex-col justify-between p-3 select-none z-20 transition-all duration-200">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="shrink-0 pb-2.5 border-b border-[#27272a] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider truncate">
                {currentHub === 'crm' ? 'CRM Pipelines' : 'Task Spaces'}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.2 rounded-[6px] bg-zinc-800/80 font-semibold shrink-0">
                {currentHub === 'crm' ? pipelines.length : folders.length}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!isReadOnly && currentHub === 'task-spaces' && onOpenAddFolder && (
                <button
                  type="button"
                  onClick={onOpenAddFolder}
                  className="w-5 h-5 rounded-[6px] hover:bg-orange-950/40 text-orange-400 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                  title="Add Folder"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                </button>
              )}

              {!isReadOnly && currentHub === 'crm' && onOpenAddPipeline && (
                <button
                  type="button"
                  onClick={onOpenAddPipeline}
                  className="w-5 h-5 rounded-[6px] hover:bg-orange-950/40 text-orange-400 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                  title="Add Pipeline"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                </button>
              )}

              {/* Collapse inner sidebar toggle */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Collapse sub-navigation (⌘])"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Search Input */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-zinc-500">
              search
            </span>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={currentHub === 'crm' ? 'Filter pipelines...' : 'Filter spaces...'}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-[6px] pl-6 pr-6 py-1 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer p-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Tree and Views Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 flex flex-col gap-1.5">
          {/* TASK SPACES TREE */}
          {currentHub === 'task-spaces' && (
            <div className="flex flex-col gap-1">
              {/* 1. Spaces Dashboard Link */}
              <button
                type="button"
                onClick={() => {
                  if (onSelectDashboard) onSelectDashboard();
                }}
                className={`flex items-center justify-between py-1.5 px-2 rounded-[6px] text-left text-xs transition-all cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-orange-400">
                    space_dashboard
                  </span>
                  <span className="truncate font-medium">Spaces Dashboard</span>
                </div>
                <span className="font-mono text-[9px] uppercase px-1 rounded-[6px] bg-orange-950/50 text-orange-400 font-bold border border-orange-500/20">
                  Hub
                </span>
              </button>

              <div className="h-px bg-[#27272a] my-1" />

              {/* Folders List */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
                  <span>Folders ({filteredFolders.length})</span>
                </div>

                {filteredFolders.length === 0 ? (
                  <div className="py-8 px-2 text-center flex flex-col items-center justify-center text-zinc-500 text-xs">
                    <span className="material-symbols-outlined text-[20px] mb-1.5 text-zinc-600">search_off</span>
                    <span className="font-medium text-zinc-400">No spaces found</span>
                    <span className="text-[11px] text-zinc-600 mt-0.5">Matching &ldquo;{filterText}&rdquo;</span>
                  </div>
                ) : (
                  filteredFolders.map((folder) => {
                    const hasItems = folder.items && folder.items.length > 0;
                    const isExpanded = !!expandedFolderIds[folder.id] || Boolean(filterText);

                    return (
                      <div key={folder.id} className="flex flex-col">
                        {/* Folder Item Header */}
                        <div
                          onClick={() => toggleFolder(folder.id)}
                          className="flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all cursor-pointer group select-none"
                        >
                          <div className="flex items-center gap-1.5 truncate min-w-0">
                            <button
                              type="button"
                              onClick={(e) => toggleFolder(folder.id, e)}
                              className="w-3.5 h-3.5 flex items-center justify-center text-zinc-400 group-hover:text-orange-400 transition-all cursor-pointer shrink-0"
                            >
                              <span
                                className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${
                                  isExpanded ? 'rotate-90 text-orange-400' : 'rotate-0'
                                }`}
                              >
                                chevron_right
                              </span>
                            </button>

                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`${spacePrefix}/spaces/${folder.id}`);
                              }}
                              className="flex items-center gap-1.5 truncate flex-1 hover:text-orange-400 cursor-pointer transition-colors"
                              title={`Customize & view space: ${folder.name}`}
                            >
                              <span
                                className="material-symbols-outlined text-[14px] shrink-0"
                                style={{ color: folder.color && folder.color !== '#9900c2' ? folder.color : '#ea580c' }}
                              >
                                {folder.icon || 'folder'}
                              </span>
                              <span className="truncate font-medium">{folder.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                              {folder.items?.length || 0}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {!isReadOnly && onOpenAddListToFolder && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenAddListToFolder(folder);
                                  }}
                                  className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Add list under this folder"
                                >
                                  <span className="material-symbols-outlined text-[14px]">add</span>
                                </button>
                              )}

                              {!isReadOnly && (
                                <div className="relative shrink-0 flex items-center">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === `fld-${folder.id}` ? null : `fld-${folder.id}`);
                                    }}
                                    aria-haspopup="menu"
                                    aria-expanded={activeMenuId === `fld-${folder.id}`}
                                    className={`w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none ${
                                      activeMenuId === `fld-${folder.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                    title="Folder actions"
                                  >
                                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">more_vert</span>
                                  </button>
                                  <ActionContextMenu
                                    isOpen={activeMenuId === `fld-${folder.id}`}
                                    onClose={() => setActiveMenuId(null)}
                                    onEdit={() => onEditFolder?.(folder)}
                                    onDelete={() => onDeleteFolder?.(folder)}
                                    onAddChild={onOpenAddListToFolder ? () => onOpenAddListToFolder(folder) : undefined}
                                    onAddSubFolder={onOpenAddSubFolder ? () => onOpenAddSubFolder(folder) : undefined}
                                    addChildLabel="Add List"
                                    addChildIcon="playlist_add"
                                    addSubFolderLabel="Add Sub-folder"
                                    addSubFolderIcon="create_new_folder"
                                    editLabel="Edit Folder"
                                    deleteLabel="Delete Folder"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Folder Child Items & Sub-folders */}
                        {isExpanded && (
                          <div className="flex flex-col gap-0.5 pl-3 ml-2 my-0.5 border-l border-[#27272a]">
                            {/* Direct Lists */}
                            {hasItems &&
                              folder.items!
                                .filter((subItem) => {
                                  if (!filterText.trim()) return true;
                                  const q = filterText.toLowerCase();
                                  return subItem.name.toLowerCase().includes(q) || folder.name.toLowerCase().includes(q);
                                })
                                .map((subItem) => {
                                  const isActive = activeSpace === subItem.id && currentView !== 'dashboard';
                                  const isMatchingListSettings = listSettings && (subItem.id === listSettings.listId || (isActive && (listSettings.icon || listSettings.color)));
                                  const lower = (subItem.name + ' ' + subItem.id).toLowerCase();
                                  const spaceIcon = (subItem as any).icon || (isMatchingListSettings && listSettings?.icon ? listSettings.icon : null) || (lower.includes('infra') || lower.includes('devops')
                                    ? 'terminal'
                                    : lower.includes('client') || lower.includes('deliverable')
                                    ? 'inventory_2'
                                    : lower.includes('bug') || lower.includes('triage')
                                    ? 'bug_report'
                                    : lower.includes('design') || lower.includes('ui')
                                    ? 'palette'
                                    : lower.includes('sprint') || lower.includes('backlog')
                                    ? 'checklist'
                                    : 'format_list_bulleted');
                                  const spaceColor = (subItem as any).color || (isMatchingListSettings && listSettings?.color ? listSettings.color : null);

                                  return (
                                    <div
                                      key={subItem.id}
                                      className={`flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-[11px] transition-all group/item ${
                                        isActive
                                          ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => onSelectSpace?.(subItem.id)}
                                        className="flex items-center gap-1.5 truncate flex-1 min-w-0 text-left cursor-pointer"
                                      >
                                        <span
                                          className={`material-symbols-outlined text-[13px] shrink-0 transition-colors ${
                                            spaceColor ? '' : (isActive ? 'text-orange-400' : 'text-zinc-500 group-hover/item:text-zinc-300')
                                          }`}
                                          style={spaceColor ? { color: spaceColor } : undefined}
                                        >
                                          {spaceIcon}
                                        </span>
                                        <span className="truncate">{subItem.name}</span>
                                      </button>

                                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                        <span
                                          className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-[6px] shrink-0 font-semibold ${
                                            isActive
                                              ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30'
                                              : 'bg-zinc-800/80 text-zinc-400'
                                          }`}
                                        >
                                          {tasks.filter((t) => t.listId === subItem.id).length}
                                        </span>

                                        {!isReadOnly && (
                                          <div className="relative shrink-0 flex items-center">
                                            <button
                                              type="button"
                                              onMouseDown={(e) => e.stopPropagation()}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === `list-${subItem.id}` ? null : `list-${subItem.id}`);
                                              }}
                                              aria-haspopup="menu"
                                              aria-expanded={activeMenuId === `list-${subItem.id}`}
                                              className={`w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none ${
                                                activeMenuId === `list-${subItem.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover/item:opacity-100'
                                              }`}
                                              title="List actions"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">more_vert</span>
                                            </button>
                                            <ActionContextMenu
                                              isOpen={activeMenuId === `list-${subItem.id}`}
                                              onClose={() => setActiveMenuId(null)}
                                              items={[
                                                {
                                                  label: 'List Settings',
                                                  icon: 'tune',
                                                  iconColor: 'text-orange-400',
                                                  onClick: () => {
                                                    navigate(`${spacePrefix}/spaces/${folder.id}/lists/${subItem.id}/settings`);
                                                  },
                                                },
                                                {
                                                  label: 'Move to Folder',
                                                  icon: 'drive_file_move',
                                                  iconColor: 'text-zinc-300',
                                                  onClick: () => {
                                                    setListToMove({ list: subItem, folderId: folder.id });
                                                  },
                                                },
                                                {
                                                  label: 'Delete List',
                                                  icon: 'delete',
                                                  danger: true,
                                                  onClick: () => {
                                                    setItemToDelete({ type: 'list', item: subItem, folderId: folder.id });
                                                  },
                                                },
                                              ]}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                            {/* Sub-Folders (Recursive Tree) */}
                            {folder.subFolders && folder.subFolders.length > 0 &&
                              folder.subFolders
                                .filter((subFolder) => {
                                  if (!filterText.trim()) return true;
                                  const q = filterText.toLowerCase();
                                  return matchesSubFolder(subFolder, q) || folder.name.toLowerCase().includes(q);
                                })
                                .map((subFolder) => (
                                  <RecursiveSubFolderNode
                                    key={subFolder.id}
                                    folder={folder}
                                    subFolder={subFolder}
                                    depth={1}
                                    expandedSubFolderIds={expandedSubFolderIds}
                                    toggleSubFolder={toggleSubFolder}
                                    activeSpace={activeSpace}
                                    currentView={currentView}
                                    onSelectSpace={onSelectSpace}
                                    onOpenAddListToSubFolder={onOpenAddListToSubFolder}
                                    onOpenAddSubFolder={onOpenAddSubFolder}
                                    onEditSubFolder={onEditSubFolder}
                                    onDeleteSubFolder={onDeleteSubFolder}
                                    onOpenMoveList={(list, folderId, subFolderId) => setListToMove({ list, folderId, subFolderId })}
                                    onDeleteList={(list, folderId) => setItemToDelete({ type: 'list', item: list, folderId })}
                                    activeMenuId={activeMenuId}
                                    setActiveMenuId={setActiveMenuId}
                                    filterText={filterText}
                                    isReadOnly={isReadOnly}
                                  />
                                ))}

                            {!hasItems && (!folder.subFolders || folder.subFolders.length === 0) && (
                              <div className="py-1 px-2 text-[10px] text-zinc-500 italic">No lists yet</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* CRM PIPELINES TREE */}
          {currentHub === 'crm' && (
            <div className="flex flex-col gap-1">
              {/* 1. CRM Dashboard Link */}
              <button
                type="button"
                onClick={() => {
                  if (onSelectCrmDashboard) onSelectCrmDashboard();
                }}
                className={`flex items-center justify-between py-1.5 px-2 rounded-[6px] text-left text-xs transition-all cursor-pointer ${
                  crmView === 'dashboard'
                    ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-orange-400">
                    space_dashboard
                  </span>
                  <span className="truncate font-medium">CRM Dashboard</span>
                </div>
                <span className="font-mono text-[9px] uppercase px-1 rounded-[6px] bg-orange-950/50 text-orange-400 font-bold border border-orange-500/20">
                  Hub
                </span>
              </button>

              <div className="h-px bg-[#27272a] my-1" />

              {/* Pipelines List */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
                  <span>Pipelines ({filteredPipelines.length})</span>
                </div>

                {filteredPipelines.length === 0 ? (
                  <div className="py-8 px-2 text-center flex flex-col items-center justify-center text-zinc-500 text-xs">
                    <span className="material-symbols-outlined text-[20px] mb-1.5 text-zinc-600">search_off</span>
                    <span className="font-medium text-zinc-400">No pipelines found</span>
                    <span className="text-[11px] text-zinc-600 mt-0.5">Matching &ldquo;{filterText}&rdquo;</span>
                  </div>
                ) : (
                  filteredPipelines.map((pipe) => {
                    const isSelected = activePipelineId === pipe.id && crmView !== 'dashboard';

                    return (
                      <div key={pipe.id} className="flex flex-col">
                        <div
                          className={`group flex items-center justify-between py-1 px-1.5 rounded-[6px] text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-orange-950/40 text-orange-400 font-semibold'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectPipeline) onSelectPipeline(pipe.id);
                            }}
                            className="flex items-center gap-1.5 truncate flex-1 min-w-0 text-left cursor-pointer"
                          >
                            <span
                              className="material-symbols-outlined text-[14px] shrink-0"
                              style={{
                                color:
                                  (pipe.id === activePipelineId && crmSettings?.accentColor) ||
                                  (pipe.color && pipe.color !== '#9900c2' ? pipe.color : '#ea580c'),
                              }}
                            >
                              {(pipe.id === activePipelineId && crmSettings?.icon) ||
                                (!pipe.icon || pipe.icon === 'building' ? 'leaderboard' : pipe.icon)}
                            </span>
                            <span className="truncate font-medium">
                              {(pipe.id === activePipelineId && crmSettings?.name) || pipe.name}
                            </span>
                          </button>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                              {pipe.dealCount}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {!isReadOnly && onOpenAddPipelineSubFolder && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenAddPipelineSubFolder(pipe);
                                  }}
                                  className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title="Add sub-folder"
                                >
                                  <span className="material-symbols-outlined text-[14px]">add</span>
                                </button>
                              )}

                              {!isReadOnly && (
                                <div className="relative shrink-0 flex items-center">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === `pipe-${pipe.id}` ? null : `pipe-${pipe.id}`);
                                    }}
                                    aria-haspopup="menu"
                                    aria-expanded={activeMenuId === `pipe-${pipe.id}`}
                                    className={`w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all focus:outline-none ${
                                      activeMenuId === `pipe-${pipe.id}` ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                    title="Pipeline actions"
                                  >
                                    <span className="material-symbols-outlined text-[15px]" aria-hidden="true">more_vert</span>
                                  </button>
                                  <ActionContextMenu
                                    isOpen={activeMenuId === `pipe-${pipe.id}`}
                                    onClose={() => setActiveMenuId(null)}
                                    items={[
                                      {
                                        label: 'Pipeline Settings',
                                        icon: 'tune',
                                        iconColor: 'text-orange-400',
                                        onClick: () => {
                                          if (onSelectPipelineView) {
                                            onSelectPipeline?.(pipe.id);
                                            onSelectPipelineView(pipe.id, 'settings');
                                          } else {
                                            navigate(`${spacePrefix}/crm/pipelines/${pipe.id}/settings`);
                                          }
                                        },
                                      },
                                      ...(onOpenAddPipelineSubFolder
                                        ? [
                                            {
                                              label: 'Add Sub-folder',
                                              icon: 'create_new_folder',
                                              iconColor: 'text-orange-400',
                                              onClick: () => onOpenAddPipelineSubFolder(pipe),
                                            },
                                          ]
                                        : []),
                                      ...(onEditPipeline
                                        ? [
                                            {
                                              label: 'Edit Pipeline',
                                              icon: 'edit',
                                              onClick: () => onEditPipeline(pipe),
                                            },
                                          ]
                                        : []),
                                      ...(onDeletePipeline
                                        ? [
                                            {
                                              label: 'Delete Pipeline',
                                              icon: 'delete',
                                              danger: true,
                                              onClick: () => onDeletePipeline(pipe),
                                            },
                                          ]
                                        : []),
                                    ]}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sub-views for selected pipeline */}
                        {isSelected && (
                          <div className="flex flex-col gap-0.5 pl-4 ml-1.5 my-0.5 border-l border-[#27272a]">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'board');
                                else if (onSelectCrmBoard) onSelectCrmBoard();
                              }}
                              className={`flex items-center justify-between py-1 px-2 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
                                crmView === 'board' && !activePipelineSubFolderId
                                  ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="material-symbols-outlined text-[13px]">view_kanban</span>
                                <span className="truncate">Active Deals (Board)</span>
                              </div>
                            </button>

                            {(() => {
                              const pipeDeals = (deals || []).filter(
                                (d) =>
                                  (d.pipelineId === pipe.id || (!d.pipelineId && pipe.id === 'pipe-enterprise')) &&
                                  !d.isArchived
                              );
                              const hasData = pipeDeals.length > 0;
                              let winRatePct: number | null = null;
                              if (hasData) {
                                const wonCount = pipeDeals.filter(
                                  (d) => d.stage === 'Closed Won' || d.stage?.toLowerCase().includes('won')
                                ).length;
                                const lostCount = pipeDeals.filter(
                                  (d) => d.stage === 'Closed Lost' || d.stage?.toLowerCase().includes('lost')
                                ).length;
                                const closedCount = wonCount + lostCount;
                                winRatePct = closedCount > 0
                                  ? Math.round((wonCount / closedCount) * 100)
                                  : Math.round((wonCount / pipeDeals.length) * 100);
                              }

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'analytics');
                                  }}
                                  className={`flex items-center justify-between py-1 px-2 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
                                    crmView === 'analytics'
                                      ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="material-symbols-outlined text-[13px] text-emerald-400">leaderboard</span>
                                    <span className="truncate">Win/Loss Analytics</span>
                                  </div>
                                  {winRatePct !== null && (
                                    <span
                                      className={`text-[9.5px] font-mono font-semibold ${
                                        winRatePct > 0 ? 'text-emerald-400' : 'text-zinc-500'
                                      }`}
                                    >
                                      {winRatePct}%
                                    </span>
                                  )}
                                </button>
                              );
                            })()}

                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'settings');
                              }}
                              className={`flex items-center justify-between py-1 px-2 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
                                crmView === 'settings'
                                  ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="material-symbols-outlined text-[13px]">tune</span>
                                <span className="truncate">Pipeline Settings</span>
                              </div>
                              <span className="text-[9px] font-mono uppercase px-1 rounded-[6px] bg-orange-950/50 text-orange-400 font-bold border border-orange-500/20">
                                Edit
                              </span>
                            </button>

                            {/* Archived Deals Sub-view */}
                            {(() => {
                              const pipeArchivedCount = (deals || []).filter(
                                (d) =>
                                  (d.pipelineId === pipe.id || (!d.pipelineId && pipe.id === 'pipe-enterprise')) &&
                                  Boolean(d.isArchived)
                              ).length;
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSelectPipelineView) onSelectPipelineView(pipe.id, 'archived');
                                  }}
                                  className={`flex items-center justify-between py-1 px-2 rounded-[6px] text-left text-[11px] transition-all cursor-pointer ${
                                    crmView === 'archived' && !activePipelineSubFolderId
                                      ? 'bg-orange-950/40 text-orange-400 font-semibold border-l-2 border-orange-500'
                                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="material-symbols-outlined text-[13px]">archive</span>
                                    <span className="truncate">Archived Deals</span>
                                  </div>
                                  {pipeArchivedCount > 0 && (
                                    <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-[6px] bg-[#18181b] border border-[#27272a] text-orange-400 font-bold">
                                      {pipeArchivedCount}
                                    </span>
                                  )}
                                </button>
                              );
                            })()}

                            {/* Sub-Folders Section */}
                            <div className="mt-2 pt-2 border-t border-[#27272a] flex flex-col gap-1">
                              <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
                                <span>Sub-folders ({pipe.subFolders?.length || 0})</span>
                                {!isReadOnly && onOpenAddPipelineSubFolder && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenAddPipelineSubFolder(pipe)}
                                    className="w-5 h-5 rounded-[6px] hover:bg-zinc-800 text-zinc-400 hover:text-orange-400 flex items-center justify-center transition-all cursor-pointer"
                                    title="Add sub-folder"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                  </button>
                                )}
                              </div>

                              {pipe.subFolders && pipe.subFolders.length > 0 ? (
                                pipe.subFolders
                                  .filter((subFolder) => {
                                    if (!filterText.trim()) return true;
                                    const q = filterText.toLowerCase();
                                    return matchesPipeSubFolder(subFolder, q) || pipe.name.toLowerCase().includes(q);
                                  })
                                  .map((subFolder) => (
                                    <RecursivePipelineSubFolderNode
                                      key={subFolder.id}
                                      pipe={pipe}
                                      subFolder={subFolder}
                                      depth={1}
                                      expandedSubFolderIds={expandedSubFolderIds}
                                      toggleSubFolder={toggleSubFolder}
                                      activePipelineSubFolderId={activePipelineSubFolderId}
                                      onSelectPipelineSubFolder={onSelectPipelineSubFolder}
                                      onOpenAddPipelineSubFolder={onOpenAddPipelineSubFolder}
                                      onEditPipelineSubFolder={onEditPipelineSubFolder}
                                      onDeletePipelineSubFolder={onDeletePipelineSubFolder}
                                      onOpenMovePipelineSubFolder={(subFolder, pipelineId) => setPipeSubFolderToMove({ subFolder, pipelineId })}
                                      activeMenuId={activeMenuId}
                                      setActiveMenuId={setActiveMenuId}
                                      filterText={filterText}
                                      isReadOnly={isReadOnly}
                                    />
                                  ))
                              ) : (
                                <div className="py-1 px-1 text-[10px] text-zinc-500 italic">No sub-folders</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {listToMove && (
        <MoveListModal
          isOpen={!!listToMove}
          onClose={() => setListToMove(null)}
          list={listToMove.list}
          currentFolderId={listToMove.folderId}
          currentSubFolderId={listToMove.subFolderId}
        />
      )}

      {pipeSubFolderToMove && (
        <MovePipelineSubFolderModal
          isOpen={!!pipeSubFolderToMove}
          onClose={() => setPipeSubFolderToMove(null)}
          subFolder={pipeSubFolderToMove.subFolder}
          currentPipelineId={pipeSubFolderToMove.pipelineId}
        />
      )}
    </aside>
  );
};
