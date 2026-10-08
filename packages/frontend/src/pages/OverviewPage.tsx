import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { ExecutiveCockpitView } from '../components/ExecutiveCockpitView';
import { OverviewView } from '../components/OverviewView';
import { findFolderByListId } from '../utils/treeUtils';

export const OverviewPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId?: string }>();
  const navigate = useNavigate();
  const {
    activeUserSpaceId,
    userSpaces,
    tasks,
    deals,
    overviewMode,
    setSelectedTaskId,
    setSelectedDealId,
    handleOpenCreateTask,
    handleUpdateTask,
    folders,
    activePipeline,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${currentSpaceId}`;

  const handleSelectTask = (task: any) => {
    setSelectedTaskId(task.id);
    const targetListId = task.targetCycle || 'sprint-14';
    const parentFolder = findFolderByListId(folders, targetListId);
    const parentId = parentFolder?.id || folders[0]?.id || 'fld-engineering';
    navigate(`${spacePrefix}/spaces/${parentId}/lists/${targetListId}/board`);
  };

  const handleSelectDeal = (deal: any) => {
    setSelectedDealId(deal.id);
    const pipeId = deal.pipelineId || activePipeline?.id || 'pipe-enterprise';
    navigate(`${spacePrefix}/crm/pipelines/${pipeId}/board`);
  };

  if (overviewMode === 'cockpit') {
    return (
      <div className="flex-1 flex overflow-hidden relative font-sans">
        <ExecutiveCockpitView
          tasks={tasks}
          deals={deals}
          onSelectTask={handleSelectTask}
          onSelectDeal={handleSelectDeal}
          onNavigateToDeals={() => {
            setSelectedDealId(null);
            navigate(`${spacePrefix}/crm`);
          }}
          onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
          onUpdateTask={handleUpdateTask}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden relative font-sans">
      <OverviewView
        tasks={tasks}
        deals={deals}
        onSelectTask={handleSelectTask}
        onSelectDeal={handleSelectDeal}
        onNavigateToBoard={() => {
          const firstFolder = folders[0];
          const firstList = firstFolder?.items[0]?.id || 'sprint-14';
          navigate(`${spacePrefix}/spaces/${firstFolder?.id || 'fld-engineering'}/lists/${firstList}/board`);
        }}
        onNavigateToDeals={() => {
          setSelectedDealId(null);
          navigate(`${spacePrefix}/crm`);
        }}
        onOpenCreateTask={() => handleOpenCreateTask('In Progress')}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
};
