import React, { useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SideNavBar } from '../components/SideNavBar';
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

  // Keyboard shortcut listener (⌘K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsNewItemModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, setIsNewItemModalOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans antialiased select-none">
      {/* 1. Left Fixed Sidebar (280px) */}
      <SideNavBar
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
        activeSpace={activeSpace}
        onSelectSpace={handleSelectSpace}
        onOpenNewItem={() => {
          setNewItemType(currentHub === 'crm' ? 'deal' : 'task');
          setNewItemDefaultStatus('Backlog');
          setIsNewItemModalOpen(true);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        folders={folders}
        onOpenAddFolder={() => setIsNewFolderModalOpen(true)}
        onEditFolder={(folder) => {
          setFolderToEdit(folder);
          setIsNewFolderModalOpen(true);
        }}
        onDeleteFolder={(folder) => setItemToDelete({ type: 'folder', item: folder })}
        currentView={currentView}
        onSelectDashboard={() => {
          setCurrentHub('task-spaces');
          setSelectedTaskId(null);
          setCurrentView('dashboard');
        }}
        crmView={crmView}
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
        pipelines={pipelines}
        activePipelineId={activePipelineId}
        onSelectPipeline={(pipeId) => {
          setCurrentHub('crm');
          setActivePipelineId(pipeId);
          setSelectedDealId(null);
          setCrmView('board');
        }}
        onOpenAddPipeline={() => setIsNewPipelineModalOpen(true)}
        onEditPipeline={(pipe) => {
          setPipelineToEdit(pipe);
          setIsNewPipelineModalOpen(true);
        }}
        onDeletePipeline={(pipe) => setItemToDelete({ type: 'pipeline', item: pipe })}
        onSelectPipelineView={(pipeId, view) => {
          setCurrentHub('crm');
          setActivePipelineId(pipeId);
          setSelectedDealId(null);
          setCrmView(view);
        }}
      />

      {/* 2. Main Canvas Viewport (offset 280px left rail) */}
      <div className="ml-[280px] w-[calc(100vw-280px)] flex-1 flex flex-col h-screen overflow-hidden relative">
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
