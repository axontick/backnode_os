import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { CrmDashboardView } from '../components/CrmDashboardView';

export const CrmPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId?: string }>();
  const navigate = useNavigate();
  const {
    activeUserSpaceId,
    userSpaces,
    filteredDeals,
    setSelectedDealId,
    handleOpenAddDealToStage,
    setCrmSettingsInitialTab,
    setIsNewPipelineModalOpen,
    activePipeline,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${currentSpaceId}`;
  const activePipelineId = activePipeline?.id || 'pipe-enterprise';

  return (
    <div className="flex-1 flex overflow-hidden relative font-sans">
      <CrmDashboardView
        deals={filteredDeals}
        onSelectDeal={(deal) => {
          setSelectedDealId(deal.id);
          const pipeId = deal.pipelineId || activePipelineId;
          navigate(`${spacePrefix}/crm/pipelines/${pipeId}/board`);
        }}
        onOpenNewDeal={handleOpenAddDealToStage}
        onNavigateToBoard={() => {
          setSelectedDealId(null);
          navigate(`${spacePrefix}/crm/pipelines/${activePipelineId}/board`);
        }}
        onNavigateToSettings={(tab) => {
          setCrmSettingsInitialTab(tab || 'general');
          navigate(`${spacePrefix}/crm/pipelines/${activePipelineId}/settings`);
        }}
        onOpenAddPipeline={() => setIsNewPipelineModalOpen(true)}
      />
    </div>
  );
};
