import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { PrimarySidebar } from '../components/PrimarySidebar';
import { InnerSidebar } from '../components/InnerSidebar';
import { TopNavBar } from '../components/TopNavBar';
import { OverviewPage } from '../pages/OverviewPage';
import { TaskSpacesPage } from '../pages/TaskSpacesPage';
import { CrmPage } from '../pages/CrmPage';
import { ContactsPage } from '../pages/ContactsPage';
import { TeamAccessPage } from '../pages/TeamAccessPage';
import { ReplicationPage } from '../pages/ReplicationPage';
import { UniversalAddEditModal } from '../components/UniversalAddEditModal';
import { NewFolderModal } from '../components/NewFolderModal';
import { NewPipelineModal } from '../components/NewPipelineModal';
import { NewContactModal } from '../components/NewContactModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { CommandPalette } from '../components/CommandPalette';

export const DashboardLayout: React.FC = () => {
  const {
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
    handleCreateFolder,
    folderToEdit,
    setFolderToEdit,
    handleUpdateFolder,
    isNewPipelineModalOpen,
    setIsNewPipelineModalOpen,
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
    taskToDelete,
    setTaskToDelete,
    handleConfirmDeleteTask,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    toastMessage,
  } = useWorkspace();

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
        currentHub={currentHub}
        onSelectHub={(hub) => {
          setCurrentHub(hub);
          if (hub === 'settings') {
            setCurrentHub('task-spaces');
            setCurrentView('settings');
          } else if (hub === 'task-spaces') {
            setSelectedTaskId(null);
            setCurrentView('dashboard');
          } else if (hub === 'crm') {
            setSelectedDealId(null);
            setCrmView('dashboard');
          }
        }}
        onOpenNewItem={() => {
          setNewItemType(currentHub === 'crm' ? 'deal' : 'task');
          setNewItemDefaultStatus('Backlog');
          setIsNewItemModalOpen(true);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isCollapsed={isPrimarySidebarCollapsed}
        onToggleCollapse={handleTogglePrimarySidebar}
      />

      {/* 2. Inner Sub-Navigation Sidebar (240px expanded, 28px collapsed ribbon) */}
      {(currentHub === 'task-spaces' || currentHub === 'crm') && (
        <InnerSidebar
          currentHub={currentHub}
          isCollapsed={isInnerSidebarCollapsed}
          onToggleCollapse={handleToggleInnerSidebar}
          folders={folders}
          activeSpace={activeSpace}
          currentView={currentView}
          onSelectSpace={handleSelectSpace}
          onSelectDashboard={() => {
            setCurrentHub('task-spaces');
            setSelectedTaskId(null);
            setCurrentView('dashboard');
          }}
          onOpenAddFolder={() => setIsNewFolderModalOpen(true)}
          onEditFolder={(folder) => {
            setFolderToEdit(folder);
            setIsNewFolderModalOpen(true);
          }}
          onDeleteFolder={(folder) => setItemToDelete({ type: 'folder', item: folder })}
          pipelines={pipelines}
          activePipelineId={activePipelineId}
          crmView={crmView}
          onSelectPipeline={(pipeId) => {
            setCurrentHub('crm');
            setActivePipelineId(pipeId);
            setSelectedDealId(null);
            setCrmView('board');
          }}
          onSelectCrmDashboard={() => {
            setCurrentHub('crm');
            setSelectedDealId(null);
            setCrmView('dashboard');
          }}
          onSelectCrmBoard={() => {
            setCurrentHub('crm');
            setSelectedDealId(null);
            setCrmView('board');
          }}
          onSelectPipelineView={(pipeId, view) => {
            setCurrentHub('crm');
            setActivePipelineId(pipeId);
            setSelectedDealId(null);
            setCrmView(view);
          }}
          onOpenAddPipeline={() => setIsNewPipelineModalOpen(true)}
          onEditPipeline={(pipe) => {
            setPipelineToEdit(pipe);
            setIsNewPipelineModalOpen(true);
          }}
          onDeletePipeline={(pipe) => setItemToDelete({ type: 'pipeline', item: pipe })}
        />
      )}

      {/* 3. Main Canvas Viewport (fluid flex-1 min-w-0) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <TopNavBar
          currentHub={currentHub}
          currentView={currentView}
          crmView={crmView}
          syncStatus={syncStatus}
          activePipelineName={activePipeline?.name || 'Enterprise Pipeline'}
          onSelectView={handleSelectView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateTask={() => {
            if (currentHub === 'crm') {
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
            setCurrentHub('task-spaces');
            setCurrentView('board');
          }}
          onSelectDeal={(deal) => {
            setSelectedDealId(deal.id);
            setCurrentHub('crm');
            setCrmView('board');
          }}
        />

        {/* Modular Viewport Hub Switching */}
        <div className="flex-1 flex overflow-hidden relative">
          {currentHub === 'overview' && <OverviewPage />}
          {currentHub === 'task-spaces' && <TaskSpacesPage />}
          {currentHub === 'crm' && <CrmPage />}
          {currentHub === 'contacts' && <ContactsPage />}
          {currentHub === 'team' && <TeamAccessPage />}
          {currentHub === 'replication' && <ReplicationPage />}
        </div>
      </div>


      {/* Global Universal Add/Edit Modal */}
      <UniversalAddEditModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        members={members}
        onAddTask={handleCreateTask}
        onAddDeal={handleCreateDeal}
        defaultStatus={newItemDefaultStatus}
        initialType={newItemType}
        defaultDealStage={newItemDefaultDealStage}
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

      {/* Add Contact Modal */}
      <NewContactModal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        onCreateContact={handleCreateContact}
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
          setCurrentHub('task-spaces');
          setCurrentView('board');
        }}
        onSelectView={(v) => {
          setCurrentHub('task-spaces');
          setCurrentView(v);
        }}
        onSelectHub={(h) => setCurrentHub(h)}
        onOpenCreateTask={() => {
          setNewItemDefaultStatus('In Progress');
          setNewItemType('task');
          setIsNewItemModalOpen(true);
        }}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1b22] text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-white/10 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
};
