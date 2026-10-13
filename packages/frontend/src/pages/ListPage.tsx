import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ListSettings } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { TaskSpaceViewsBar } from '../components/TaskSpaceViewsBar';
import { KanbanBoard } from '../components/KanbanBoard';
import { ListView } from '../components/ListView';
import { DeliverablesTableView } from '../components/DeliverablesTableView';
import { GanttTimelineView } from '../components/GanttTimelineView';
import { MonthlyCalendarView } from '../components/MonthlyCalendarView';
import { DocsCanvasView } from '../components/DocsCanvasView';
import { TaskSpaceSettings } from '../components/TaskSpaceSettings';
import { TaskInspector } from '../components/TaskInspector';
import { findFolderByListId, findListItemById } from '../utils/treeUtils';
import { mapDefaultViewToSlug } from '../utils/taskSpaceSettingsUtils';

export const ListPage: React.FC = () => {
  const { spaceId, folderId, listId, view, statusView, subFolderId } = useParams<{
    spaceId?: string;
    folderId?: string;
    listId?: string;
    view?: 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs';
    statusView?: string;
    subFolderId?: string;
  }>();

  const navigate = useNavigate();

  const {
    activeUserSpaceId,
    userSpaces,
    folders,
    activeSpace,
    setActiveSpace,
    currentView,
    setCurrentView,
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
    selectedTaskId,
    setSelectedTaskId,
    listSettings,
    statuses,
    handleUpdateListSettings,
    handleUpdateStatuses,
    handleDeleteTaskSpace,
    handleRenameStatus,
    handleOpenAddTaskToColumn,
    handleOpenCreateTask,
    handleOpenEditTask,
    handleMoveTaskStatus,
    setTaskToDelete,
    selectedTask,
    handleUpdateTask,
    members,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${currentSpaceId}`;

  // Resolve true parent folder for this list
  const parentFolder = listId ? findFolderByListId(folders, listId) : undefined;
  const effectiveFolderId = folderId || (spaceId && folders.some((f) => f.id === spaceId) ? spaceId : parentFolder?.id || folders[0]?.id || 'fld-engineering');

  const currentListItem = listId ? findListItemById(folders, listId) : undefined;

  const effectiveListSettings: ListSettings = useMemo(() => {
    if (!currentListItem) return listSettings;
    return {
      ...listSettings,
      listId: currentListItem.id,
      name: currentListItem.name || listSettings.name,
      icon: currentListItem.icon || listSettings.icon || 'format_list_bulleted',
      color: currentListItem.color || listSettings.color || '#ea580c',
    };
  }, [listSettings, currentListItem]);

  // Strict space prefix enforcement:
  // 1. If view is not specified in the URL, redirect to default view (configured in list settings)
  useEffect(() => {
    if (listId && !view) {
      const defaultSlug = mapDefaultViewToSlug(effectiveListSettings?.defaultView);
      if (subFolderId) {
        navigate(`${spacePrefix}/spaces/${effectiveFolderId}/folders/${subFolderId}/lists/${listId}/${defaultSlug}`, { replace: true });
      } else {
        navigate(`${spacePrefix}/spaces/${effectiveFolderId}/lists/${listId}/${defaultSlug}`, { replace: true });
      }
    }
  }, [view, listId, effectiveFolderId, subFolderId, spacePrefix, effectiveListSettings?.defaultView, navigate]);

  // 2. If folderId in URL does not match actual parent folder of this list, normalize immediately
  useEffect(() => {
    if (parentFolder && folderId && parentFolder.id !== folderId && listId) {
      const targetView = view || mapDefaultViewToSlug(effectiveListSettings?.defaultView);
      if (statusView) {
        navigate(`${spacePrefix}/spaces/${parentFolder.id}/lists/${listId}/table/${statusView}`, { replace: true });
      } else {
        navigate(`${spacePrefix}/spaces/${parentFolder.id}/lists/${listId}/${targetView}`, { replace: true });
      }
    }
  }, [parentFolder, folderId, listId, view, statusView, spacePrefix, effectiveListSettings?.defaultView, navigate]);

  // Sync activeSpace with listId
  useEffect(() => {
    if (listId && activeSpace !== listId) {
      setActiveSpace(listId);
    }
  }, [listId, activeSpace, setActiveSpace]);

  // Sync currentView
  const effectiveView = view || 'board';
  useEffect(() => {
    if (effectiveView && currentView !== effectiveView) {
      setCurrentView(effectiveView);
    }
  }, [effectiveView, currentView, setCurrentView]);

  // Filter tasks specific to this list
  const listTasks = filteredTasks.filter((t) => {
    if (!listId) return true;
    const matchId = t.targetCycle === listId || t.targetCycle.toLowerCase().includes(listId.toLowerCase());
    const matchName = currentListItem && t.targetCycle.toLowerCase().includes(currentListItem.name.toLowerCase());
    return matchId || matchName;
  });

  const displayTasks = listTasks.length > 0 ? listTasks : filteredTasks;

  const handleSelectView = (
    nextView: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs'
  ) => {
    if (nextView === 'dashboard') {
      // Space dashboard overview
      navigate(`${spacePrefix}/spaces/${effectiveFolderId}`);
    } else if (subFolderId) {
      navigate(`${spacePrefix}/spaces/${effectiveFolderId}/folders/${subFolderId}/lists/${listId || 'sprint-14'}/${nextView}`);
    } else {
      navigate(`${spacePrefix}/spaces/${effectiveFolderId}/lists/${listId || 'sprint-14'}/${nextView}`);
    }
  };

  const handleSelectStatusRoute = (statusSlug: string) => {
    if (subFolderId) {
      navigate(`${spacePrefix}/spaces/${effectiveFolderId}/folders/${subFolderId}/lists/${listId || 'sprint-14'}/table/${statusSlug}`);
    } else {
      navigate(`${spacePrefix}/spaces/${effectiveFolderId}/lists/${listId || 'sprint-14'}/table/${statusSlug}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative font-sans">
      {/* Views Bar (List, Board, Table, Timeline, Calendar, Docs, Settings) */}
      <TaskSpaceViewsBar
        currentView={view || 'board'}
        onSelectView={handleSelectView}
        taskCount={displayTasks.length}
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

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {view === 'board' && (
          <KanbanBoard
            tasks={displayTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onAddTaskToColumn={handleOpenAddTaskToColumn}
            onMoveTaskStatus={handleMoveTaskStatus}
            onEditTask={handleOpenEditTask}
          />
        )}

        {view === 'list' && (
          <ListView
            tasks={displayTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onQuickStatusChange={(taskId, status) => handleMoveTaskStatus(taskId, status)}
            onMoveTaskStatus={handleMoveTaskStatus}
            onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
          />
        )}

        {view === 'table' && (
          <DeliverablesTableView
            tasks={displayTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
            onRequestDeleteTask={(t) => setTaskToDelete(t)}
            onNavigateToView={(v) => handleSelectView(v)}
            onEditTask={handleOpenEditTask}
            onMoveTaskStatus={handleMoveTaskStatus}
            activeStatusRoute={statusView}
            onSelectStatusRoute={handleSelectStatusRoute}
          />
        )}

        {view === 'timeline' && (
          <GanttTimelineView
            tasks={displayTasks}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
            onNavigateToView={(v) => handleSelectView(v)}
            onUpdateTask={handleUpdateTask}
          />
        )}

        {view === 'calendar' && (
          <MonthlyCalendarView
            tasks={displayTasks}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
            onNavigateToView={(v) => handleSelectView(v)}
            onUpdateTask={handleUpdateTask}
          />
        )}

        {view === 'docs' && (
          <DocsCanvasView
            onNavigateToTasks={() => handleSelectView('board')}
          />
        )}

        {view === 'settings' && (
          <TaskSpaceSettings
            settings={effectiveListSettings}
            statuses={statuses}
            onUpdateSettings={handleUpdateListSettings}
            onUpdateStatuses={handleUpdateStatuses}
            onBackToBoard={() =>
              handleSelectView(mapDefaultViewToSlug(effectiveListSettings?.defaultView))
            }
            onDeleteTaskSpace={(deletedListId) => {
              handleDeleteTaskSpace(deletedListId);
              navigate(`${spacePrefix}/spaces/${effectiveFolderId}`);
            }}
            onRenameStatus={handleRenameStatus}
          />
        )}

        {/* Task Inspector Slide-Over */}
        {selectedTask && view !== 'settings' && view !== 'docs' && (
          <TaskInspector
            task={selectedTask}
            members={members}
            onClose={() => setSelectedTaskId(null)}
            onUpdateTask={handleUpdateTask}
            onEditTask={handleOpenEditTask}
            onRequestDelete={(t) => setTaskToDelete(t)}
          />
        )}
      </div>
    </div>
  );
};
