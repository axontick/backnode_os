import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ExecutiveCockpitView } from '../components/ExecutiveCockpitView';
import { OverviewView } from '../components/OverviewView';

export const OverviewPage: React.FC = () => {
  const {
    tasks,
    deals,
    overviewMode,
    setSelectedTaskId,
    setCurrentHub,
    setCurrentView,
    setSelectedDealId,
    setCrmView,
    setNewItemDefaultStatus,
    setNewItemType,
    setIsNewItemModalOpen,
    handleUpdateTask,
  } = useWorkspace();

  if (overviewMode === 'cockpit') {
    return (
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
        onUpdateTask={handleUpdateTask}
      />
    );
  }

  return (
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
  );
};
