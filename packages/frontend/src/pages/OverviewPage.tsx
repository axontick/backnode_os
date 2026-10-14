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
    filteredTasks,
    filteredDeals,
    overviewMode,
    setSelectedTaskId,
    setSelectedDealId,
    handleOpenCreateTask,
    handleUpdateTask,
    folders,
    pipelines,
    activePipeline,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${currentSpaceId}`;

  const handleSelectTask = (task: any) => {
    setSelectedTaskId(task.id);
    const targetListId = task.targetCycle || task.listId;
    const parentFolder = findFolderByListId(folders, targetListId);
    const parentId = parentFolder?.id || folders[0]?.id;
    if (parentId && targetListId) {
      navigate(`${spacePrefix}/spaces/${parentId}/lists/${targetListId}/board`);
    } else {
      navigate(`${spacePrefix}/spaces`);
    }
  };

  const handleSelectDeal = (deal: any) => {
    setSelectedDealId(deal.id);
    const pipeId = deal.pipelineId || activePipeline?.id || pipelines[0]?.id;
    if (pipeId) {
      navigate(`${spacePrefix}/crm/pipelines/${pipeId}/board`);
    } else {
      navigate(`${spacePrefix}/crm`);
    }
  };

  if (overviewMode === 'cockpit') {
    return (
      <div className="flex-1 flex overflow-hidden relative font-sans">
        <ExecutiveCockpitView
          tasks={filteredTasks}
          deals={filteredDeals}
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
        tasks={filteredTasks}
        deals={filteredDeals}
        onSelectTask={handleSelectTask}
        onSelectDeal={handleSelectDeal}
        onNavigateToBoard={() => {
          const firstFolder = folders[0];
          const firstList = firstFolder?.items[0]?.id;
          if (firstFolder?.id && firstList) {
            navigate(`${spacePrefix}/spaces/${firstFolder.id}/lists/${firstList}/board`);
          } else {
            navigate(`${spacePrefix}/spaces`);
          }
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
