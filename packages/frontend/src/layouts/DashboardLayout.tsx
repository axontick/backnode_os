import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
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
import { CommandPalette } from '../components/CommandPalette';
import { findFolderByListId } from '../utils/treeUtils';

export const DashboardLayout: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const {
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
    toastMessage,
  } = useWorkspace();

  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const effectiveSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${effectiveSpaceId}`;

  // Keep activeUserSpaceId in sync with route parameter
  useEffect(() => {
    if (spaceId && spaceId !== activeUserSpaceId) {
      setActiveUserSpaceId(spaceId);
      try {
        localStorage.setItem('backnode_active_user_space_id', spaceId);
      } catch {}
    }
  }, [spaceId, activeUserSpaceId, setActiveUserSpaceId]);

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
  } else if (normalizedPath.startsWith('/replication') || normalizedPath.startsWith('/telemetry')) {
    effectiveHub = 'replication';
  } else if (normalizedPath.startsWith('/settings')) {
    effectiveHub = 'settings';
  }

  const showInnerSidebar = effectiveHub === 'task-spaces' || effectiveHub === 'crm';

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans antialiased select-none">
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
            const parentId = parentFolder?.id || folders[0]?.id || 'fld-engineering';
            navigate(`${spacePrefix}/spaces/${parentId}/lists/${spaceId}/board`);
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
          tasks={tasks}
          deals={deals}
          onSelectTask={(task) => {
            setSelectedTaskId(task.id);
            const parentFolder = findFolderByListId(folders, task.targetCycle);
            const parentId = parentFolder?.id || folders[0]?.id || 'fld-engineering';
            navigate(`${spacePrefix}/spaces/${parentId}/lists/${task.targetCycle || 'sprint-14'}/board`);
          }}
          onSelectDeal={(deal) => {
            setSelectedDealId(deal.id);
            const pipeId = deal.pipelineId || activePipeline?.id || 'pipe-enterprise';
            navigate(`${spacePrefix}/crm/pipelines/${pipeId}/board`);
          }}
        />

        {/* Modular Viewport Hub Outlet */}
        <div className="flex-1 flex overflow-hidden relative">
          <Outlet />
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
        onCreateWorkspace={handleCreateUserSpace}
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

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        onSelectTask={(t) => {
          setSelectedTaskId(t.id);
          const parentFolder = findFolderByListId(folders, t.targetCycle);
          const parentId = parentFolder?.id || folders[0]?.id || 'fld-engineering';
          navigate(`${spacePrefix}/spaces/${parentId}/lists/${t.targetCycle || 'sprint-14'}/board`);
        }}
        onSelectView={(v) => {
          const parentFolder = findFolderByListId(folders, activeSpace);
          const parentId = parentFolder?.id || folders[0]?.id || 'fld-engineering';
          navigate(`${spacePrefix}/spaces/${parentId}/lists/${activeSpace}/${v}`);
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
