import { useState, useEffect } from 'react';
import {
  initialTasks,
  initialStatuses,
  initialListSettings,
  initialTeamMembers,
  initialCrmDeals,
  initialCrmStages,
  initialCrmPipelineSettings,
  initialDirectoryContacts,
  initialFolders,
  initialCrmPipelines,
} from './mockData';
import {
  TaskItem,
  TaskStatus,
  CrmDeal,
  CrmStageDefinition,
  CrmPipelineSettings as CrmPipelineSettingsType,
  DirectoryContact,
  SpaceFolder,
  CrmPipeline,
} from './types';
import { SideNavBar } from './components/SideNavBar';
import { TopNavBar } from './components/TopNavBar';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { TaskInspector } from './components/TaskInspector';
import { TaskSpaceSettings } from './components/TaskSpaceSettings';
import { OverviewView } from './components/OverviewView';
import { ExecutiveCockpitView } from './components/ExecutiveCockpitView';
import { PipelineCrmView } from './components/PipelineCrmView';
import { DealInspector } from './components/DealInspector';
import { CrmPipelineSettings } from './components/CrmPipelineSettings';
import { ContactsView } from './components/ContactsView';
import { ContactsDirectoryView } from './components/ContactsDirectoryView';
import { DocsCanvasView } from './components/DocsCanvasView';
import { CommandPalette } from './components/CommandPalette';
import { UniversalAddEditModal } from './components/UniversalAddEditModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { DeliverablesTableView } from './components/DeliverablesTableView';
import { GanttTimelineView } from './components/GanttTimelineView';
import { MonthlyCalendarView } from './components/MonthlyCalendarView';
import { TaskSpaceViewsBar } from './components/TaskSpaceViewsBar';
import { TaskSpaceDashboardView } from './components/TaskSpaceDashboardView';
import { NewFolderModal } from './components/NewFolderModal';
import { CrmDashboardView } from './components/CrmDashboardView';
import { NewPipelineModal } from './components/NewPipelineModal';
import { PipelineWinLossView } from './components/PipelineWinLossView';
import { NewContactModal } from './components/NewContactModal';
import {
  tasksApi,
  dealsApi,
  pipelinesApi,
  membersApi,
  contactsApi,
  workspaceApi,
} from './services/api';

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [listSettings, setListSettings] = useState(initialListSettings);
  const [members, setMembers] = useState(initialTeamMembers);
  const [directoryContacts, setDirectoryContacts] = useState<DirectoryContact[]>(initialDirectoryContacts);
  const [folders, setFolders] = useState<SpaceFolder[]>(initialFolders);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  // CRM state: kept hidden by default when opening a pipeline
  const [pipelines, setPipelines] = useState<CrmPipeline[]>(initialCrmPipelines);
  const [activePipelineId, setActivePipelineId] = useState<string>('pipe-enterprise');
  const [isNewPipelineModalOpen, setIsNewPipelineModalOpen] = useState(false);
  const [deals, setDeals] = useState<CrmDeal[]>(initialCrmDeals);
  const [crmStages, setCrmStages] = useState<CrmStageDefinition[]>(initialCrmStages);
  const [crmSettings, setCrmSettings] = useState<CrmPipelineSettingsType>(initialCrmPipelineSettings);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [crmView, setCrmView] = useState<'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings'>('dashboard');
  const [crmSettingsInitialTab, setCrmSettingsInitialTab] = useState<'general' | 'stages'>('general');

  // Navigation state
  const [currentHub, setCurrentHub] = useState<string>('task-spaces');
  const [activeSpace, setActiveSpace] = useState<string>('sprint-14');
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs'
  >('dashboard');
  const [overviewMode, setOverviewMode] = useState<'cockpit' | 'summary'>('cockpit');

  // Inspector state: kept hidden by default when opening a list
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [taskGroupBy, setTaskGroupBy] = useState<'status' | 'priority' | 'assignee'>('status');
  const [crmFilterStage, setCrmFilterStage] = useState<string | null>(null);
  const [crmFilterOwner, setCrmFilterOwner] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setFilterPriority(null);
    setFilterStatus(null);
    setFilterAssignee(null);
    setQuickFilter(null);
    setCrmFilterStage(null);
    setCrmFilterOwner(null);
  };

  // Modals state
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<'task' | 'deal'>('task');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [newItemDefaultStatus, setNewItemDefaultStatus] = useState<TaskStatus>('Backlog');
  const [newItemDefaultDealStage, setNewItemDefaultDealStage] = useState<CrmDeal['stage']>('Proposal Submitted');

  // Keyboard shortcut listener (⌘K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsNewItemModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter tasks based on search, priority, status, assignee, and quickFilter
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = filterPriority === null || t.priority === filterPriority;
    const matchesStatus = filterStatus === null || t.status === filterStatus;
    const matchesAssignee = filterAssignee === null || t.assignee.name === filterAssignee;

    let matchesQuick = true;
    if (quickFilter === 'my-tasks') {
      matchesQuick = t.assignee.name === 'Alex Wong';
    } else if (quickFilter === 'due-soon') {
      matchesQuick = Boolean(t.dueDate && (t.dueDate.includes('Oct') || t.dueDate.includes('Today')));
    } else if (quickFilter === 'urgent') {
      matchesQuick = t.priority === 'Urgent';
    } else if (quickFilter === 'in-progress') {
      matchesQuick = t.status === 'In Progress';
    } else if (quickFilter === 'needs-review') {
      matchesQuick = t.status === 'In Review';
    }

    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee && matchesQuick;
  });

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const selectedDeal = deals.find((d) => d.id === selectedDealId) || null;
  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];

  // Fetch initial data from PostgreSQL NestJS backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setSyncStatus('syncing');
        const [
          fetchedTasks,
          fetchedDeals,
          fetchedPipelines,
          fetchedStages,
          fetchedCrmSettings,
          fetchedMembers,
          fetchedContacts,
          fetchedFolders,
          fetchedStatuses,
          fetchedListSettings,
        ] = await Promise.all([
          tasksApi.getAll(),
          dealsApi.getAll(),
          pipelinesApi.getAll(),
          pipelinesApi.getStages(),
          pipelinesApi.getSettings(),
          membersApi.getAll(),
          contactsApi.getAll(),
          workspaceApi.getFolders(),
          workspaceApi.getStatuses(),
          workspaceApi.getListSettings(),
        ]);

        if (isMounted) {
          if (fetchedTasks && fetchedTasks.length > 0) setTasks(fetchedTasks);
          if (fetchedDeals && fetchedDeals.length > 0) setDeals(fetchedDeals);
          if (fetchedPipelines && fetchedPipelines.length > 0) setPipelines(fetchedPipelines);
          if (fetchedStages && fetchedStages.length > 0) setCrmStages(fetchedStages);
          if (fetchedCrmSettings) setCrmSettings(fetchedCrmSettings);
          if (fetchedMembers && fetchedMembers.length > 0) setMembers(fetchedMembers);
          if (fetchedContacts && fetchedContacts.length > 0) setDirectoryContacts(fetchedContacts);
          if (fetchedFolders && fetchedFolders.length > 0) setFolders(fetchedFolders);
          if (fetchedStatuses && fetchedStatuses.length > 0) setStatuses(fetchedStatuses);
          if (fetchedListSettings) setListSettings(fetchedListSettings);
          setSyncStatus('connected');
        }
      } catch (err) {
        console.warn('Backend not reachable or error fetching data, using initial cache:', err);
        if (isMounted) setSyncStatus('offline');
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateTask = (updatedTask: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    tasksApi.update(updatedTask.id, updatedTask).catch((err) => {
      console.error('Failed to update task in DB:', err);
    });
  };

  const handleAddTask = (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);
    setSelectedTaskId(newTask.id);
    showToast(`Task ${newTask.id} created successfully!`);
    tasksApi.create(newTask).catch((err) => {
      console.error('Failed to persist task to DB:', err);
    });
  };

  const handleConfirmDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
    setTaskToDelete(null);
    showToast(`Task ${taskId} removed.`);
    tasksApi.delete(taskId).catch((err) => {
      console.error('Failed to delete task from DB:', err);
    });
  };

  const handleUpdateDeal = (updatedDeal: CrmDeal) => {
    setDeals((prev) => prev.map((d) => (d.id === updatedDeal.id ? updatedDeal : d)));
    dealsApi.update(updatedDeal.id, updatedDeal).catch((err) => {
      console.error('Failed to update deal in DB:', err);
    });
  };

  const handleAddDeal = (newDeal: CrmDeal) => {
    setDeals((prev) => [newDeal, ...prev]);
    setSelectedDealId(newDeal.id);
    showToast(`Deal "${newDeal.title}" created!`);
    dealsApi.create(newDeal).catch((err) => {
      console.error('Failed to persist deal to DB:', err);
    });
  };

  const handleAdvanceDealStage = () => {
    if (!selectedDeal) return;
    const stages: CrmDeal['stage'][] = [
      'Qualified Lead',
      'Discovery & Demo',
      'Proposal Submitted',
      'Contract & Legal',
      'Closed Won',
    ];
    const currentIndex = stages.indexOf(selectedDeal.stage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      const updated = {
        ...selectedDeal,
        stage: nextStage,
        probability: nextStage === 'Closed Won' ? 100 : nextStage === 'Contract & Legal' ? 85 : 70,
        history: [
          {
            id: `hist-${Date.now()}`,
            type: 'note' as const,
            title: `Advanced stage to ${nextStage}`,
            date: 'Just now',
          },
          ...selectedDeal.history,
        ],
      };
      handleUpdateDeal(updated);
      showToast(`Deal ${selectedDeal.title} advanced to "${nextStage}"!`);
    }
  };

  const handleMoveTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    tasksApi.update(taskId, { status: newStatus }).catch((err) => {
      console.error('Failed to update task status in DB:', err);
    });
  };

  const handleUpdateListSettings = (newSettings: any) => {
    setListSettings(newSettings);
    workspaceApi.updateListSettings(newSettings).catch((err) => {
      console.error('Failed to update list settings in DB:', err);
    });
  };

  const handleUpdateStatuses = (newStatuses: any) => {
    setStatuses(newStatuses);
    workspaceApi.updateStatuses(newStatuses).catch((err) => {
      console.error('Failed to update statuses in DB:', err);
    });
  };

  const handleUpdateCrmSettings = (newSettings: any) => {
    setCrmSettings(newSettings);
    pipelinesApi.updateSettings(newSettings).catch((err) => {
      console.error('Failed to update CRM settings in DB:', err);
    });
  };

  const handleUpdateCrmStages = (newStages: any) => {
    setCrmStages(newStages);
    pipelinesApi.updateStages(newStages).catch((err) => {
      console.error('Failed to update CRM stages in DB:', err);
    });
  };

  const handleOpenAddTaskToColumn = (status: TaskStatus) => {
    setNewItemDefaultStatus(status);
    setNewItemType('task');
    setIsNewItemModalOpen(true);
  };

  const handleOpenAddDealToStage = (stage?: CrmDeal['stage']) => {
    if (stage) setNewItemDefaultDealStage(stage);
    setNewItemType('deal');
    setIsNewItemModalOpen(true);
  };

  const handleTogglePriorityFilter = () => {
    if (!filterPriority) {
      setFilterPriority('Urgent');
    } else if (filterPriority === 'Urgent') {
      setFilterPriority('High');
    } else if (filterPriority === 'High') {
      setFilterPriority('Medium');
    } else {
      setFilterPriority(null);
    }
  };

  const handleSelectSpace = (spaceId: string) => {
    setActiveSpace(spaceId);
    setCurrentHub('task-spaces');
    setSelectedTaskId(null); // When opening a list the right side detail drawer should be kept hidden!
    setCurrentView('list');
  };

  const handleSelectView = (
    view: 'dashboard' | 'board' | 'list' | 'settings' | 'table' | 'timeline' | 'calendar' | 'docs'
  ) => {
    if (view === 'list' || view === 'dashboard') {
      setSelectedTaskId(null); // When opening a list or dashboard the right side detail drawer should be kept hidden!
    }
    setCurrentView(view);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbf8ff] text-[#1a1b22] font-sans antialiased select-none">
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
            setSelectedDealId(null); // When opening pipeline don't open the deal details drawer!
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
        currentView={currentView}
        onSelectDashboard={() => {
          setCurrentHub('task-spaces');
          setSelectedTaskId(null);
          setCurrentView('dashboard');
        }}
        crmView={crmView}
        onSelectCrmDashboard={() => {
          setCurrentHub('crm');
          setSelectedDealId(null); // When opening pipeline don't open the deal details drawer!
          setCrmView('dashboard');
        }}
        onSelectCrmBoard={() => {
          setCurrentHub('crm');
          setSelectedDealId(null); // When opening pipeline don't open the deal details drawer!
          setCrmView('board');
        }}
        pipelines={pipelines}
        activePipelineId={activePipelineId}
        onSelectPipeline={(pipeId) => {
          setCurrentHub('crm');
          setActivePipelineId(pipeId);
          setSelectedDealId(null); // When opening pipeline don't open the deal details drawer!
          setCrmView('board');
        }}
        onOpenAddPipeline={() => setIsNewPipelineModalOpen(true)}
        onSelectPipelineView={(pipeId, view) => {
          setCurrentHub('crm');
          setActivePipelineId(pipeId);
          setSelectedDealId(null); // When opening pipeline don't open the deal details drawer!
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
          activePipelineName={activePipeline.name}
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
            if (deal.pipelineId) setActivePipelineId(deal.pipelineId);
            setCurrentHub('crm');
            setCrmView('board');
          }}
        />

        {/* When task space / task list is open, show view switcher bar under top bar in content space (not on dashboard) */}
        {currentHub === 'task-spaces' && currentView !== 'dashboard' && (
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

        {/* Viewport Content Switching */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Executive Overview & Command Cockpit */}
          {currentHub === 'overview' && (
            overviewMode === 'cockpit' ? (
              <ExecutiveCockpitView
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
                onNavigateToDeals={() => {
                  setSelectedDealId(null);
                  setCurrentHub('crm');
                  setCrmView('dashboard');
                }}
                onOpenCreateTask={() => {
                  setNewItemDefaultStatus('In Progress');
                  setNewItemType('task');
                  setIsNewItemModalOpen(true);
                }}
              />
            ) : (
              <OverviewView
                tasks={tasks}
                onSelectTask={(task) => {
                  setSelectedTaskId(task.id);
                  setCurrentHub('task-spaces');
                  setCurrentView('board');
                }}
                onNavigateToBoard={() => {
                  setCurrentHub('task-spaces');
                  setCurrentView('board');
                }}
              />
            )
          )}

          {/* CRM Deals Dashboard, Kanban Board & Inspector */}
          {currentHub === 'crm' && (
            <>
              {crmView === 'dashboard' ? (
                <CrmDashboardView
                  deals={deals}
                  onSelectDeal={(deal) => {
                    setSelectedDealId(deal.id);
                    setCrmView('board');
                  }}
                  onOpenNewDeal={handleOpenAddDealToStage}
                  onNavigateToBoard={() => {
                    setSelectedDealId(null); // When opening pipeline don't open the deal details drawer!
                    setCrmView('board');
                  }}
                  onNavigateToSettings={(tab) => {
                    setCrmSettingsInitialTab(tab || 'general');
                    setCrmView('settings');
                  }}
                  onOpenAddPipeline={() => setIsNewPipelineModalOpen(true)}
                />
              ) : (
                <PipelineCrmView
                  deals={deals}
                  pipeline={activePipeline}
                  pipelines={pipelines}
                  onSelectPipeline={(pipeId) => {
                    setActivePipelineId(pipeId);
                    setSelectedDealId(null); // When opening pipeline don't open the deal details drawer!
                    setCrmView('board');
                  }}
                  onOpenAddPipeline={() => setIsNewPipelineModalOpen(true)}
                  selectedDealId={selectedDealId}
                  onSelectDeal={(deal) => setSelectedDealId(deal.id)}
                  onOpenNewDeal={handleOpenAddDealToStage}
                  onOpenSettings={(tab) => {
                    setCrmSettingsInitialTab(tab || 'general');
                    setCrmView('settings');
                  }}
                  currentView={crmView}
                  onSelectView={(v) => {
                    setSelectedDealId(null); // Keep deal details drawer closed when switching views!
                    setCrmView(v);
                  }}
                  crmSettings={crmSettings}
                  crmStages={crmStages}
                  onUpdateCrmSettings={handleUpdateCrmSettings}
                  onUpdateCrmStages={handleUpdateCrmStages}
                  settingsInitialTab={crmSettingsInitialTab}
                  globalSearchQuery={searchQuery}
                  globalStageFilter={crmFilterStage}
                  globalOwnerFilter={crmFilterOwner}
                  onClearGlobalFilters={handleClearAllFilters}
                />
              )}

              {/* Deal Inspector Slide-Over (only shown when explicitly inspecting a deal and NOT on dashboard) */}
              {selectedDeal && crmView !== 'dashboard' && (
                <DealInspector
                  deal={selectedDeal}
                  onClose={() => setSelectedDealId(null)}
                  onUpdateDeal={handleUpdateDeal}
                  onAdvanceStage={handleAdvanceDealStage}
                />
              )}
            </>
          )}

          {/* Contacts & Account Directory */}
          {currentHub === 'contacts' && (
            <ContactsDirectoryView
              contacts={directoryContacts}
              onOpenAddContact={() => setIsNewContactModalOpen(true)}
            />
          )}

          {/* 0. Custom Task Spaces Dashboard & Engineering Overview */}
          {currentHub === 'task-spaces' && currentView === 'dashboard' && (
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

          {currentHub === 'task-spaces' && currentView === 'settings' && (
            <TaskSpaceSettings
              settings={listSettings}
              statuses={statuses}
              onUpdateSettings={handleUpdateListSettings}
              onUpdateStatuses={handleUpdateStatuses}
              onBackToBoard={() => setCurrentView('board')}
            />
          )}

          {currentHub === 'task-spaces' && currentView === 'board' && (
            <KanbanBoard
              tasks={filteredTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={(t) => setSelectedTaskId(t.id)}
              onAddTaskToColumn={handleOpenAddTaskToColumn}
              onMoveTaskStatus={handleMoveTaskStatus}
            />
          )}

          {/* 1. Hierarchical List & Checklist Tree View */}
          {currentHub === 'task-spaces' && currentView === 'list' && (
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

          {/* 2. Deliverables Spreadsheet & Table View */}
          {currentHub === 'task-spaces' && currentView === 'table' && (
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

          {/* 3. Roadmap & Gantt Timeline View */}
          {currentHub === 'task-spaces' && currentView === 'timeline' && (
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

          {/* 4. Monthly Deliverables & Milestones Calendar View */}
          {currentHub === 'task-spaces' && currentView === 'calendar' && (
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

          {/* Workspace Docs & Knowledge Canvas View */}
          {currentHub === 'task-spaces' && currentView === 'docs' && (
            <DocsCanvasView
              onNavigateToTasks={() => setCurrentView('board')}
              onOpenCreateTask={() => {
                setNewItemDefaultStatus('In Progress');
                setNewItemType('task');
                setIsNewItemModalOpen(true);
              }}
            />
          )}

          {/* Right Slide-Over Task Detail Inspector (kept hidden on dashboard and list open) */}
          {currentHub === 'task-spaces' && selectedTask && currentView !== 'settings' && currentView !== 'docs' && currentView !== 'dashboard' && (
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

      {/* Global Universal Add/Edit Modal (Matching HTML 2) */}
      <UniversalAddEditModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        members={members}
        onAddTask={handleAddTask}
        onAddDeal={handleAddDeal}
        defaultStatus={newItemDefaultStatus}
        initialType={newItemType}
        defaultDealStage={newItemDefaultDealStage}
      />

      {/* Add Folder Modal with Icon and Color Selection */}
      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onCreateFolder={(newFolder) => {
          setFolders((prev) => [newFolder, ...prev]);
          workspaceApi.createFolder(newFolder).catch((err) => {
            console.error('Failed to create folder in DB:', err);
          });
        }}
      />

      {/* Add Pipeline Modal */}
      <NewPipelineModal
        isOpen={isNewPipelineModalOpen}
        onClose={() => setIsNewPipelineModalOpen(false)}
        onCreatePipeline={(newPipeline) => {
          setPipelines((prev) => [...prev, newPipeline]);
          setActivePipelineId(newPipeline.id);
          setSelectedDealId(null);
          setCrmView('board');
          setIsNewPipelineModalOpen(false);
          pipelinesApi.create(newPipeline).catch((err) => {
            console.error('Failed to create pipeline in DB:', err);
          });
        }}
      />

      {/* Add Contact Modal */}
      <NewContactModal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        onCreateContact={(newContact) => {
          setDirectoryContacts((prev) => [newContact, ...prev]);
          showToast(`Contact "${newContact.name}" added to directory!`);
          contactsApi.create(newContact).catch((err) => {
            console.error('Failed to create contact in DB:', err);
          });
        }}
      />

      {/* Delete Confirmation Modal Dialog (Matching HTML 1) */}
      <DeleteConfirmationModal
        isOpen={!!taskToDelete}
        task={taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirmDelete={handleConfirmDeleteTask}
      />

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
    </div>
  );
}


