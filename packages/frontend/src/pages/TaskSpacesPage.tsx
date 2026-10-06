import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TaskSpaceViewsBar } from '../components/TaskSpaceViewsBar';
import { TaskSpaceDashboardView } from '../components/TaskSpaceDashboardView';
import { TaskSpaceSettings } from '../components/TaskSpaceSettings';
import { KanbanBoard } from '../components/KanbanBoard';
import { ListView } from '../components/ListView';
import { DeliverablesTableView } from '../components/DeliverablesTableView';
import { GanttTimelineView } from '../components/GanttTimelineView';
import { MonthlyCalendarView } from '../components/MonthlyCalendarView';
import { DocsCanvasView } from '../components/DocsCanvasView';
import { TaskInspector } from '../components/TaskInspector';

export const TaskSpacesPage: React.FC = () => {
  const {
    currentView,
    handleSelectView,
    filteredTasks,
    tasks,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    quickFilter,
    setQuickFilter,
    taskGroupBy,
    setTaskGroupBy,
    handleClearAllFilters,
    setNewItemDefaultStatus,
    setNewItemType,
    setIsNewItemModalOpen,
    folders,
    handleSelectSpace,
    setIsNewFolderModalOpen,
    setCurrentView,
    setSelectedTaskId,
    listSettings,
    statuses,
    handleUpdateListSettings,
    handleUpdateStatuses,
    selectedTaskId,
    handleOpenAddTaskToColumn,
    handleMoveTaskStatus,
    setTaskToDelete,
    selectedTask,
    handleUpdateTask,
    members,
  } = useWorkspace();

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
      {/* Views Bar (Tabs: Board, List, Table, Timeline, Calendar, Docs, Settings) */}
      {currentView !== 'dashboard' && (
        <TaskSpaceViewsBar
          currentView={currentView}
          onSelectView={handleSelectView}
          taskCount={filteredTasks.length}
          totalCount={tasks.length}
          filterPriority={filterPriority}
          onSelectFilterPriority={setFilterPriority}
          filterStatus={filterStatus}
          onSelectFilterStatus={setFilterStatus}
          quickFilter={quickFilter}
          onSelectQuickFilter={setQuickFilter}
          groupBy={taskGroupBy}
          onSelectGroupBy={setTaskGroupBy}
          onClearFilters={handleClearAllFilters}
          onOpenCreateTask={() => {
            setNewItemDefaultStatus('In Progress');
            setNewItemType('task');
            setIsNewItemModalOpen(true);
          }}
        />
      )}

      {/* Viewport switching */}
      <div className="flex-1 flex overflow-hidden relative">
        {currentView === 'dashboard' && (
          <TaskSpaceDashboardView
            folders={folders}
            tasks={filteredTasks}
            onSelectSpace={handleSelectSpace}
            onOpenAddFolder={() => setIsNewFolderModalOpen(true)}
            onOpenCreateTask={() => {
              setNewItemDefaultStatus('In Progress');
              setNewItemType('task');
              setIsNewItemModalOpen(true);
            }}
            onNavigateToView={(v) => {
              setSelectedTaskId(null);
              setCurrentView(v);
            }}
          />
        )}

        {currentView === 'settings' && (
          <TaskSpaceSettings
            settings={listSettings}
            statuses={statuses}
            onUpdateSettings={handleUpdateListSettings}
            onUpdateStatuses={handleUpdateStatuses}
            onBackToBoard={() => setCurrentView('board')}
          />
        )}

        {currentView === 'board' && (
          <KanbanBoard
            tasks={filteredTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onAddTaskToColumn={handleOpenAddTaskToColumn}
            onMoveTaskStatus={handleMoveTaskStatus}
          />
        )}

        {currentView === 'list' && (
          <ListView
            tasks={filteredTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onQuickStatusChange={(taskId, status) => handleMoveTaskStatus(taskId, status)}
            onOpenCreateTask={() => {
              setNewItemDefaultStatus('In Progress');
              setNewItemType('task');
              setIsNewItemModalOpen(true);
            }}
          />
        )}

        {currentView === 'table' && (
          <DeliverablesTableView
            tasks={filteredTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onOpenCreateTask={() => {
              setNewItemDefaultStatus('In Progress');
              setNewItemType('task');
              setIsNewItemModalOpen(true);
            }}
            onRequestDeleteTask={(t) => setTaskToDelete(t)}
            onNavigateToView={(v) => setCurrentView(v)}
          />
        )}

        {currentView === 'timeline' && (
          <GanttTimelineView
            tasks={filteredTasks}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onOpenCreateTask={() => {
              setNewItemDefaultStatus('In Progress');
              setNewItemType('task');
              setIsNewItemModalOpen(true);
            }}
            onNavigateToView={(v) => setCurrentView(v)}
          />
        )}

        {currentView === 'calendar' && (
          <MonthlyCalendarView
            tasks={filteredTasks}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onOpenCreateTask={() => {
              setNewItemDefaultStatus('In Progress');
              setNewItemType('task');
              setIsNewItemModalOpen(true);
            }}
            onNavigateToView={(v) => setCurrentView(v)}
          />
        )}

        {currentView === 'docs' && (
          <DocsCanvasView
            onNavigateToTasks={() => setCurrentView('board')}
            onOpenCreateTask={() => {
              setNewItemDefaultStatus('In Progress');
              setNewItemType('task');
              setIsNewItemModalOpen(true);
            }}
          />
        )}

        {/* Task Inspector Slide-Over */}
        {selectedTask && currentView !== 'settings' && currentView !== 'docs' && currentView !== 'dashboard' && (
          <TaskInspector
            task={selectedTask}
            members={members}
            onClose={() => setSelectedTaskId(null)}
            onUpdateTask={handleUpdateTask}
            onRequestDelete={(t) => setTaskToDelete(t)}
          />
        )}
      </div>
    </div>
  );
};
