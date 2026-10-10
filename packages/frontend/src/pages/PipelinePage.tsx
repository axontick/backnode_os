import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { PipelineCrmView } from '../components/PipelineCrmView';
import { DealInspector } from '../components/DealInspector';
import { CrmDeal } from '../types';

export const PipelinePage: React.FC = () => {
  const { spaceId, pipelineId, view = 'board', subFolderId } = useParams<{
    spaceId?: string;
    pipelineId?: string;
    view?: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings' | 'archived';
    subFolderId?: string;
  }>();

  const navigate = useNavigate();

  const {
    activeUserSpaceId,
    userSpaces,
    pipelines,
    activePipelineId,
    setActivePipelineId,
    crmView,
    setCrmView,
    filteredDeals,
    selectedDealId,
    setSelectedDealId,
    handleOpenAddDealToStage,
    setCrmSettingsInitialTab,
    setIsNewPipelineModalOpen,
    activePipelineSubFolderId,
    setActivePipelineSubFolderId,
    crmSettings,
    crmStages,
    handleUpdateCrmSettings,
    handleUpdateCrmStages,
    crmSettingsInitialTab,
    searchQuery,
    crmFilterStage,
    crmFilterOwner,
    handleClearAllFilters,
    selectedDeal,
    handleUpdateDeal,
    handleAdvanceDealStage,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${currentSpaceId}`;

  // Find target pipeline or fallback to first
  const targetPipeline =
    pipelines.find((p) => p.id === pipelineId) || pipelines[0];

  useEffect(() => {
    if (pipelineId && activePipelineId !== pipelineId) {
      setActivePipelineId(pipelineId);
    }
  }, [pipelineId, activePipelineId, setActivePipelineId]);

  useEffect(() => {
    if (view && crmView !== view) {
      setCrmView(view);
    }
  }, [view, crmView, setCrmView]);

  useEffect(() => {
    if (subFolderId && activePipelineSubFolderId !== subFolderId) {
      setActivePipelineSubFolderId(subFolderId);
    }
  }, [subFolderId, activePipelineSubFolderId, setActivePipelineSubFolderId]);

  const handleSelectView = (
    nextView: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings' | 'archived'
  ) => {
    if (nextView === 'dashboard') {
      navigate(`${spacePrefix}/crm`);
    } else {
      const pipeId = pipelineId || targetPipeline?.id || 'pipe-enterprise';
      if (subFolderId) {
        navigate(`${spacePrefix}/crm/pipelines/${pipeId}/folders/${subFolderId}/${nextView}`);
      } else {
        navigate(`${spacePrefix}/crm/pipelines/${pipeId}/${nextView}`);
      }
    }
  };

  const handleSelectPipeline = (newPipeId: string) => {
    navigate(`${spacePrefix}/crm/pipelines/${newPipeId}/board`);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative font-sans">
      <PipelineCrmView
        deals={filteredDeals}
        pipeline={targetPipeline}
        pipelines={pipelines}
        onSelectPipeline={handleSelectPipeline}
        onOpenAddPipeline={() => setIsNewPipelineModalOpen(true)}
        selectedDealId={selectedDealId}
        onSelectDeal={(deal) => setSelectedDealId(deal.id)}
        onOpenNewDeal={handleOpenAddDealToStage}
        onOpenSettings={(tab) => {
          setCrmSettingsInitialTab(tab || 'general');
          handleSelectView('settings');
        }}
        currentView={view || 'board'}
        onSelectView={handleSelectView}
        crmSettings={crmSettings}
        crmStages={crmStages}
        onUpdateCrmSettings={handleUpdateCrmSettings}
        onUpdateCrmStages={handleUpdateCrmStages}
        settingsInitialTab={crmSettingsInitialTab}
        globalSearchQuery={searchQuery}
        globalStageFilter={crmFilterStage}
        globalOwnerFilter={crmFilterOwner}
        onClearGlobalFilters={handleClearAllFilters}
        activePipelineSubFolderId={subFolderId || activePipelineSubFolderId}
        onClearSubFolderFilter={() => {
          setActivePipelineSubFolderId(null);
          const pipeId = pipelineId || targetPipeline?.id || 'pipe-enterprise';
          navigate(`${spacePrefix}/crm/pipelines/${pipeId}/${view || 'board'}`);
        }}
        onAdvanceDealStage={handleAdvanceDealStage}
        onUpdateDeal={handleUpdateDeal}
      />

      {/* Deal Inspector Slide-Over */}
      {selectedDeal && (
        <DealInspector
          deal={selectedDeal}
          onClose={() => setSelectedDealId(null)}
          onUpdateDeal={handleUpdateDeal}
          onAdvanceStage={() => {
            const stages: CrmDeal['stage'][] = [
              'Qualified Lead',
              'Discovery & Demo',
              'Proposal Submitted',
              'Contract & Legal',
              'Closed Won',
            ];
            const currentIdx = stages.indexOf(selectedDeal.stage);
            if (currentIdx < stages.length - 1) {
              handleAdvanceDealStage(selectedDeal.id, stages[currentIdx + 1]);
            }
          }}
        />
      )}
    </div>
  );
};
