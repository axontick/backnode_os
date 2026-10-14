import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { SecurityPolicy } from '../utils/security';
import { PrimarySidebar } from '../components/PrimarySidebar';
import { InnerSidebar } from '../components/InnerSidebar';
import { TopNavBar } from '../components/TopNavBar';
import { UniversalAddEditModal } from '../components/UniversalAddEditModal';
import { NewFolderModal } from '../components/NewFolderModal';
import { NewSubFolderModal } from '../components/NewSubFolderModal';
import { NewListModal } from '../components/NewListModal';
import { NewPipelineModal } from '../components/NewPipelineModal';
import { NewPipelineSubFolderModal } from '../components/NewPipelineSubFolderModal';
import { NewContactModal } from '../components/NewContactModal';
import { NewWorkspaceModal } from '../components/NewWorkspaceModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { SpaceImportModal } from '../components/SpaceImportModal';
import { SpaceExportModal } from '../components/SpaceExportModal';
import { CommandPalette } from '../components/CommandPalette';
import { findFolderByListId } from '../utils/treeUtils';
import { mapDefaultViewToSlug } from '../utils/taskSpaceSettingsUtils';

export const DashboardLayout: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const {
    listSettings,
    activeUserSpaceId,
    setActiveUserSpaceId,
    userSpaces,
    currentHub,
    setCurrentHub,
    activeSpace,
    handleSelectSpace,
    currentView,
    setCurrentView,
    handleSelectView,
    crmView,
    setCrmView,
    syncStatus,
    pipelines,
    activePipeline,
    activePipelineId,
    setActivePipelineId,
    activePipelineSubFolderId,
    setActivePipelineSubFolderId,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    filterAssignee,
    setFilterAssignee,
    crmFilterStage,
    setCrmFilterStage,
    crmFilterOwner,
    setCrmFilterOwner,
    handleClearAllFilters,
    tasks,
    deals,
    filteredTasks,
    filteredDeals,
    setSelectedTaskId,
    setSelectedDealId,
    handleOpenAddDealToStage,
    members,
    isNewItemModalOpen,
    setIsNewItemModalOpen,
    taskToEdit,
    setTaskToEdit,
    dealToEdit,
    setDealToEdit,
    handleUpdateTask,
    handleUpdateDeal,
    newItemDefaultStatus,
    setNewItemDefaultStatus,
    newItemType,
    setNewItemType,
    newItemDefaultDealStage,
    handleCreateTask,
    handleCreateDeal,
    folders,
    isNewFolderModalOpen,
    setIsNewFolderModalOpen,
    isNewSubFolderModalOpen,
    setIsNewSubFolderModalOpen,
    targetFolderForNewSubFolder,
    setTargetFolderForNewSubFolder,
    targetParentSubFolderIdForNewSubFolder,
    setTargetParentSubFolderIdForNewSubFolder,
    handleOpenAddSubFolder,
    subFolderToEdit,
    setSubFolderToEdit,
    handleCreateSubFolder,
    handleUpdateSubFolder,
    isNewListModalOpen,
    setIsNewListModalOpen,
    effectivePermissions,
    targetFolderForNewList,
    setTargetFolderForNewList,
    targetSubFolderIdForNewList,
    setTargetSubFolderIdForNewList,
    handleAddListToFolder,
    handleOpenAddListToFolder,
    handleCreateFolder,
    folderToEdit,
    setFolderToEdit,
    handleUpdateFolder,
    isNewPipelineModalOpen,
    setIsNewPipelineModalOpen,
    isNewPipelineSubFolderModalOpen,
    setIsNewPipelineSubFolderModalOpen,
    targetPipelineForNewSubFolder,
    setTargetPipelineForNewSubFolder,
    targetParentPipelineSubFolderId,
    setTargetParentPipelineSubFolderId,
    handleOpenAddPipelineSubFolder,
    pipelineSubFolderToEdit,
    setPipelineSubFolderToEdit,
    handleCreatePipelineSubFolder,
    handleUpdatePipelineSubFolder,
    handleCreatePipeline,
    pipelineToEdit,
    setPipelineToEdit,
    handleUpdatePipeline,
    itemToDelete,
    setItemToDelete,
    handleConfirmDeleteItem,
    isNewContactModalOpen,
    setIsNewContactModalOpen,
    handleCreateContact,
    isNewWorkspaceModalOpen,
    setIsNewWorkspaceModalOpen,
    handleCreateUserSpace,
    taskToDelete,
    setTaskToDelete,
    handleConfirmDeleteTask,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isSpaceImportModalOpen,
    setIsSpaceImportModalOpen,
    isSpaceExportModalOpen,
    setIsSpaceExportModalOpen,
    targetSpaceForImportExport,
    targetListIdForExport,
    toastMessage,
  } = useWorkspace();

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const effectiveSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${effectiveSpaceId}`;

  // Keep activeUserSpaceId in sync with route parameter and redirect invalid placeholder space-main
  useEffect(() => {
    const realSpaceId = user?.account?.id || user?.accountId || userSpaces.find(s => s.id && s.id !== 'space-main')?.id;
    if (spaceId === 'space-main' && realSpaceId && realSpaceId !== 'space-main') {
      navigate(location.pathname.replace('/space/space-main', `/space/${realSpaceId}`), { replace: true });
      return;
    }
    if (spaceId && spaceId !== activeUserSpaceId && spaceId !== 'space-main') {
      setActiveUserSpaceId(spaceId);
      try {
        localStorage.setItem('backnode_active_user_space_id', spaceId);
      } catch {}
    }
  }, [spaceId, activeUserSpaceId, setActiveUserSpaceId, user?.account?.id, user?.accountId, userSpaces, location.pathname, navigate]);

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
  } else if (normalizedPath.startsWith('/team') || normalizedPath.startsWith('/users') || normalizedPath.startsWith('/roles')) {
    effectiveHub = 'team';
  } else if (normalizedPath.startsWith('/settings')) {
    effectiveHub = 'settings';
  }

  const showInnerSidebar = effectiveHub === 'task-spaces' || effectiveHub === 'crm';

  const currentMember = members.find(
    (m) =>
      (user?.email && m.email?.toLowerCase() === user.email.toLowerCase()) ||
      m.id === user?.id
  );
  const hasPageClearance = SecurityPolicy.canAccessPage(user, currentMember, effectiveHub, effectivePermissions);

  const [isPrimarySidebarCollapsed, setIsPrimarySidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('backnode_primary_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isInnerSidebarCollapsed, setIsInnerSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('backnode_inner_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePrimarySidebar = () => {
    setIsPrimarySidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('backnode_primary_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleToggleInnerSidebar = () => {
    setIsInnerSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('backnode_inner_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut listener (⌘K, Esc, ⌘[, ⌘])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsNewItemModalOpen(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        handleTogglePrimarySidebar();
      } else if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        handleToggleInnerSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, setIsNewItemModalOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans antialiased">
      {/* 1. Primary Sidebar (220px expanded, 60px collapsed icon rail) */}
      <PrimarySidebar
        currentHub={effectiveHub}
        onSelectHub={(hub) => {
          setCurrentHub(hub);
          if (hub === 'task-spaces') {
            setSelectedTaskId(null);
            setCurrentView('dashboard');
          } else if (hub === 'crm') {
            setSelectedDealId(null);
            setCrmView('dashboard');
          }
        }}
        onOpenNewItem={() => {
          setNewItemType(effectiveHub === 'crm' ? 'deal' : 'task');
          setNewItemDefaultStatus('Backlog');
          setIsNewItemModalOpen(true);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isCollapsed={isPrimarySidebarCollapsed}
        onToggleCollapse={handleTogglePrimarySidebar}
      />

      {/* 2. Inner Sub-Navigation Sidebar (240px expanded, 28px collapsed ribbon) */}
      {showInnerSidebar && (
        <InnerSidebar
          currentHub={effectiveHub}
          isCollapsed={isInnerSidebarCollapsed}
          onToggleCollapse={handleToggleInnerSidebar}
          folders={folders}
          activeSpace={activeSpace}
          currentView={currentView}
          onSelectSpace={(spaceId) => {
            handleSelectSpace(spaceId);
            const parentFolder = findFolderByListId(folders, spaceId);
            const parentId = parentFolder?.id || folders[0]?.id;
            const defaultSlug = mapDefaultViewToSlug(listSettings?.defaultView);
            if (parentId && spaceId) {
              navigate(`${spacePrefix}/spaces/${parentId}/lists/${spaceId}/${defaultSlug}`);
            } else {
              navigate(`${spacePrefix}/spaces`);
            }
          }}
          onSelectDashboard={() => {
            navigate(`${spacePrefix}/spaces`);
          }}
          onOpenAddFolder={() => setIsNewFolderModalOpen(true)}
          onOpenAddListToFolder={handleOpenAddListToFolder}
          onEditFolder={(folder) => {
            setFolderToEdit(folder);
            setIsNewFolderModalOpen(true);
          }}
          onDeleteFolder={(folder) => setItemToDelete({ type: 'folder', item: folder })}
          onOpenAddSubFolder={handleOpenAddSubFolder}
          onEditSubFolder={(folder, sub) => {
            setSubFolderToEdit({ folder, subFolder: sub });
            setIsNewSubFolderModalOpen(true);
          }}
          onDeleteSubFolder={(folder, sub) =>
            setItemToDelete({ type: 'subfolder', item: sub, folderId: folder.id })
          }
          onOpenAddListToSubFolder={(folder, sub) =>
            handleOpenAddListToFolder(folder, sub.id)
          }
          pipelines={pipelines}
          activePipelineId={activePipelineId}
          activePipelineSubFolderId={activePipelineSubFolderId}
          crmView={crmView}
          onSelectPipeline={(pipeId) => {
            setActivePipelineId(pipeId);
            setActivePipelineSubFolderId(null);
            setSelectedDealId(null);
            navigate(`${spacePrefix}/crm/pipelines/${pipeId}/board`);
          }}
          onSelectPipelineSubFolder={(pipeId, subId) => {
            setActivePipelineId(pipeId);
            setActivePipelineSubFolderId(activePipelineSubFolderId === subId ? null : subId);
            setSelectedDealId(null);
            navigate(`${spacePrefix}/crm/pipelines/${pipeId}/folders/${subId}/board`);
          }}
          onSelectCrmDashboard={() => {
            setSelectedDealId(null);
            navigate(`${spacePrefix}/crm`);
          }}
          onSelectCrmBoard={() => {
            setSelectedDealId(null);
            const pipeId = activePipelineId || pipelines[0]?.id || 'pipe-enterprise';
            navigate(`${spacePrefix}/crm/pipelines/${pipeId}/board`);
          }}
          onSelectPipelineView={(pipeId, view) => {
            setActivePipelineId(pipeId);
            setSelectedDealId(null);
            navigate(`${spacePrefix}/crm/pipelines/${pipeId}/${view}`);
          }}
          onOpenAddPipeline={() => setIsNewPipelineModalOpen(true)}
          onEditPipeline={(pipe) => {
            setPipelineToEdit(pipe);
            setIsNewPipelineModalOpen(true);
          }}
          onDeletePipeline={(pipe) => setItemToDelete({ type: 'pipeline', item: pipe })}
          onOpenAddPipelineSubFolder={handleOpenAddPipelineSubFolder}
          onEditPipelineSubFolder={(pipe, sub) => {
            setPipelineSubFolderToEdit({ pipeline: pipe, subFolder: sub });
            setIsNewPipelineSubFolderModalOpen(true);
          }}
          onDeletePipelineSubFolder={(pipe, sub) =>
            setItemToDelete({ type: 'pipeline-subfolder', item: sub, pipelineId: pipe.id })
          }
        />
      )}

      {/* 3. Main Canvas Viewport (fluid flex-1 min-w-0) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <TopNavBar
          currentHub={effectiveHub}
          currentView={currentView}
          crmView={crmView}
          syncStatus={syncStatus}
          activePipelineName={activePipeline?.name || 'Enterprise Pipeline'}
          onSelectView={handleSelectView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateTask={() => {
            if (effectiveHub === 'crm') {
              handleOpenAddDealToStage();
            } else {
              setNewItemDefaultStatus('In Progress');
              setNewItemType('task');
              setIsNewItemModalOpen(true);
            }
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          taskCount={filteredTasks.length}
          filterPriority={filterPriority}
          onSelectFilterPriority={setFilterPriority}
          filterStatus={filterStatus}
          onSelectFilterStatus={setFilterStatus}
          filterAssignee={filterAssignee}
          onSelectFilterAssignee={setFilterAssignee}
          filterCrmStage={crmFilterStage}
          onSelectFilterCrmStage={setCrmFilterStage}
          filterCrmOwner={crmFilterOwner}
          onSelectFilterCrmOwner={setCrmFilterOwner}
          onClearFilters={handleClearAllFilters}
          tasks={filteredTasks}
          deals={filteredDeals}
          onSelectTask={(task) => {
            setSelectedTaskId(task.id);
            const parentFolder = findFolderByListId(folders, task.targetCycle);
            const parentId = parentFolder?.id || folders[0]?.id;
            if (parentId && task.targetCycle) {
              navigate(`${spacePrefix}/spaces/${parentId}/lists/${task.targetCycle}/board`);
            } else {
              navigate(`${spacePrefix}/spaces`);
            }
          }}
          onSelectDeal={(deal) => {
            setSelectedDealId(deal.id);
            const pipeId = deal.pipelineId || activePipeline?.id || 'pipe-enterprise';
            navigate(`${spacePrefix}/crm/pipelines/${pipeId}/board`);
          }}
        />

        {/* Modular Viewport Hub Outlet or Access Restricted Screen */}
        <div className="flex-1 flex overflow-hidden relative">
          {hasPageClearance ? (
            <Outlet />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#09090b] text-zinc-100">
              <div className="bg-[#121214] border border-[#27272a] rounded-[6px] p-8 max-w-lg w-full flex flex-col items-center gap-4 text-center shadow-lg">
                <div className="w-14 h-14 rounded-[6px] bg-amber-950/40 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[28px]">shield_lock</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-base font-bold text-zinc-100 font-headline">
                    Access Restricted — Clearance Required
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your operator account does not currently possess authorization to access the{' '}
                    <strong className="text-zinc-200 capitalize">{effectiveHub.replace('-', ' ')}</strong> module under active workspace ABAC policies.
                  </p>
                </div>
                <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-[6px] w-full text-left text-xs font-mono flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Operator:</span>
                    <span className="text-zinc-200">{user?.name || 'Current User'}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Security Tier:</span>
                    <span className="text-orange-400">{currentMember?.accessLevel || user?.role || 'MEMBER'}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Module Gated:</span>
                    <span className="text-zinc-200 uppercase">{effectiveHub}</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentHub('overview');
                      navigate(`${spacePrefix}/dashboard`);
                    }}
                    className="h-8 px-4 rounded-[6px] bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">dashboard</span>
                    <span>Return to Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Global Universal Add/Edit Modal */}
      <UniversalAddEditModal
        isOpen={isNewItemModalOpen}
        onClose={() => {
          setIsNewItemModalOpen(false);
          setTaskToEdit(null);
          setDealToEdit(null);
        }}
        members={members}
        onAddTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        taskToEdit={taskToEdit}
        onAddDeal={handleCreateDeal}
        onUpdateDeal={handleUpdateDeal}
        dealToEdit={dealToEdit}
        defaultStatus={newItemDefaultStatus}
        initialType={newItemType}
        defaultDealStage={newItemDefaultDealStage}
        folders={folders}
        activeSpace={activeSpace}
      />

      {/* Add Folder Modal */}
      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => {
          setIsNewFolderModalOpen(false);
          setFolderToEdit(null);
        }}
        onCreateFolder={handleCreateFolder}
        folderToEdit={folderToEdit}
        onUpdateFolder={handleUpdateFolder}
      />

      {/* Add Sub-Folder Modal */}
      <NewSubFolderModal
        isOpen={isNewSubFolderModalOpen}
        onClose={() => {
          setIsNewSubFolderModalOpen(false);
          setTargetFolderForNewSubFolder(null);
          setTargetParentSubFolderIdForNewSubFolder(null);
          setSubFolderToEdit(null);
        }}
        folders={folders}
        defaultFolder={targetFolderForNewSubFolder}
        defaultParentId={targetParentSubFolderIdForNewSubFolder}
        subFolderToEdit={subFolderToEdit}
        onCreateSubFolder={handleCreateSubFolder}
        onUpdateSubFolder={handleUpdateSubFolder}
      />

      {/* Add List Under Folder Modal */}
      <NewListModal
        isOpen={isNewListModalOpen}
        onClose={() => {
          setIsNewListModalOpen(false);
          setTargetFolderForNewList(null);
          setTargetSubFolderIdForNewList(null);
        }}
        folders={folders}
        defaultFolder={targetFolderForNewList}
        defaultSubFolderId={targetSubFolderIdForNewList || undefined}
        onCreateList={handleAddListToFolder}
      />

      {/* Add Pipeline Modal */}
      <NewPipelineModal
        isOpen={isNewPipelineModalOpen}
        onClose={() => {
          setIsNewPipelineModalOpen(false);
          setPipelineToEdit(null);
        }}
        onCreatePipeline={handleCreatePipeline}
        pipelineToEdit={pipelineToEdit}
        onUpdatePipeline={handleUpdatePipeline}
      />

      {/* Add Pipeline Sub-Folder Modal */}
      <NewPipelineSubFolderModal
        isOpen={isNewPipelineSubFolderModalOpen}
        onClose={() => {
          setIsNewPipelineSubFolderModalOpen(false);
          setTargetPipelineForNewSubFolder(null);
          setTargetParentPipelineSubFolderId(null);
          setPipelineSubFolderToEdit(null);
        }}
        pipelines={pipelines}
        defaultPipeline={targetPipelineForNewSubFolder}
        defaultParentId={targetParentPipelineSubFolderId}
        subFolderToEdit={pipelineSubFolderToEdit}
        onCreateSubFolder={handleCreatePipelineSubFolder}
        onUpdateSubFolder={handleUpdatePipelineSubFolder}
      />

      {/* Add Contact Modal */}
      <NewContactModal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        onCreateContact={handleCreateContact}
      />

      {/* Add Workspace Modal */}
      <NewWorkspaceModal
        isOpen={isNewWorkspaceModalOpen}
        onClose={() => setIsNewWorkspaceModalOpen(false)}
        onCreateWorkspace={async (spaceData) => {
          const created = await handleCreateUserSpace(spaceData);
          if (created?.id) {
            navigate(`/space/${created.id}/dashboard`);
          }
        }}
      />

      {/* Delete Confirmation Modal Dialog */}
      <DeleteConfirmationModal
        isOpen={Boolean(itemToDelete || taskToDelete)}
        target={itemToDelete || (taskToDelete ? { type: 'task', item: taskToDelete } : null)}
        task={taskToDelete}
        onClose={() => {
          setItemToDelete(null);
          setTaskToDelete(null);
        }}
        onConfirmDeleteTarget={() => {
          if (itemToDelete) {
            handleConfirmDeleteItem();
          } else if (taskToDelete) {
            handleConfirmDeleteTask();
          }
        }}
        onConfirmDelete={handleConfirmDeleteTask}
      />

      {/* Space Import Modal */}
      {isSpaceImportModalOpen && (
        <SpaceImportModal
          isOpen={isSpaceImportModalOpen}
          onClose={() => setIsSpaceImportModalOpen(false)}
          defaultSpace={targetSpaceForImportExport}
        />
      )}

      {/* Space Export Modal */}
      {isSpaceExportModalOpen && (
        <SpaceExportModal
          isOpen={isSpaceExportModalOpen}
          onClose={() => setIsSpaceExportModalOpen(false)}
          defaultSpace={targetSpaceForImportExport}
          defaultListId={targetListIdForExport}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        onSelectTask={(t) => {
          setSelectedTaskId(t.id);
          const parentFolder = findFolderByListId(folders, t.targetCycle);
          const parentId = parentFolder?.id || folders[0]?.id;
          if (parentId && t.targetCycle) {
            navigate(`${spacePrefix}/spaces/${parentId}/lists/${t.targetCycle}/board`);
          } else {
            navigate(`${spacePrefix}/spaces`);
          }
        }}
        onSelectView={(v) => {
          const parentFolder = findFolderByListId(folders, activeSpace);
          const parentId = parentFolder?.id || folders[0]?.id;
          if (parentId && activeSpace) {
            navigate(`${spacePrefix}/spaces/${parentId}/lists/${activeSpace}/${v}`);
          } else {
            navigate(`${spacePrefix}/spaces`);
          }
        }}
        onSelectHub={(h) => {
          if (h === 'crm') navigate(`${spacePrefix}/crm`);
          else if (h === 'settings') navigate(`${spacePrefix}/settings`);
          else if (h === 'task-spaces') navigate(`${spacePrefix}/spaces`);
          else if (h === 'overview') navigate(`${spacePrefix}/dashboard`);
        }}
        onOpenCreateTask={() => {
          setNewItemDefaultStatus('In Progress');
          setNewItemType('task');
          setIsNewItemModalOpen(true);
        }}
        onOpenCreateWorkspace={() => setIsNewWorkspaceModalOpen(true)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121214] text-zinc-100 text-xs px-4 py-2.5 rounded-[6px] shadow-xl border border-[#27272a] flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
};
