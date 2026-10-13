import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ListSettings } from '../types';
import { useAuth } from '../context/AuthContext';
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
    searchQuery,
    filterPriority,
    setFilterPriority,
    filterStatus,
    setFilterStatus,
    filterAssignee,
    quickFilter,
    setQuickFilter,
    taskGroupBy,
    setTaskGroupBy,
    visibleColumns,
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
  const { user } = useAuth();

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

  // Reset filters when switching between lists
  useEffect(() => {
    handleClearAllFilters();
  }, [listId]);

  // 1. Strictly scope all tasks to this list only
  const allListTasks = useMemo(() => {
    if (!listId) return tasks;
    return tasks.filter((t) => t.listId === listId);
  }, [tasks, listId]);

  // 2. Apply filters strictly within this list's tasks
  const scopedFilteredTasks = useMemo(() => {
    return allListTasks.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assignee?.name && t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = filterPriority === null || t.priority === filterPriority;
      const matchesStatus = filterStatus === null || t.status === filterStatus;
      const matchesAssignee = filterAssignee === null || (t.assignee?.name && t.assignee.name === filterAssignee);

      let matchesQuick = true;
      if (quickFilter === 'my-tasks') {
        matchesQuick = Boolean(user && t.assignee?.name?.toLowerCase() === user.name?.toLowerCase());
      } else if (quickFilter === 'due-soon') {
        matchesQuick = Boolean(t.dueDate && (t.dueDate.includes('Oct') || t.dueDate.includes('Today')));
      } else if (quickFilter === 'urgent') {
        matchesQuick = t.priority === 'Urgent';
      }

      return matchesSearch && matchesPriority && matchesStatus && matchesAssignee && matchesQuick;
    });
  }, [allListTasks, searchQuery, filterPriority, filterStatus, filterAssignee, quickFilter, user]);

  const displayTasks = scopedFilteredTasks;

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
        totalCount={allListTasks.length}
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
        {effectiveView === 'board' && (
          <KanbanBoard
            tasks={displayTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onAddTaskToColumn={handleOpenAddTaskToColumn}
            onMoveTaskStatus={handleMoveTaskStatus}
            onEditTask={handleOpenEditTask}
          />
        )}

        {effectiveView === 'list' && (
          <ListView
            tasks={displayTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onQuickStatusChange={(taskId, status) => handleMoveTaskStatus(taskId, status)}
            onMoveTaskStatus={handleMoveTaskStatus}
            onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
            groupBy={taskGroupBy}
            visibleColumns={visibleColumns}
          />
        )}

        {effectiveView === 'table' && (
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

        {effectiveView === 'timeline' && (
          <GanttTimelineView
            tasks={displayTasks}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
            onNavigateToView={(v) => handleSelectView(v)}
            onUpdateTask={handleUpdateTask}
          />
        )}

        {effectiveView === 'calendar' && (
          <MonthlyCalendarView
            tasks={displayTasks}
            onSelectTask={(t) => setSelectedTaskId(t.id)}
            onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
            onNavigateToView={(v) => handleSelectView(v)}
            onUpdateTask={handleUpdateTask}
          />
        )}

        {effectiveView === 'docs' && (
          <DocsCanvasView
            onNavigateToTasks={() => handleSelectView('board')}
          />
        )}

        {effectiveView === 'settings' && (
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
        {selectedTask && effectiveView !== 'settings' && effectiveView !== 'docs' && (
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
