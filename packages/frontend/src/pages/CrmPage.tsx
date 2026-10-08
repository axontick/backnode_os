import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { CrmDashboardView } from '../components/CrmDashboardView';
import { PipelineCrmView } from '../components/PipelineCrmView';
import { DealInspector } from '../components/DealInspector';
import { CrmDeal } from '../types';

export const CrmPage: React.FC = () => {
  const {
    crmView,
    setCrmView,
    deals,
    setSelectedDealId,
    handleOpenAddDealToStage,
    setCrmSettingsInitialTab,
    setIsNewPipelineModalOpen,
    activePipeline,
    pipelines,
    setActivePipelineId,
    activePipelineSubFolderId,
    setActivePipelineSubFolderId,
    selectedDealId,
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

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {crmView === 'dashboard' ? (
        <CrmDashboardView
          deals={deals}
          onSelectDeal={(deal) => {
            setSelectedDealId(deal.id);
            setCrmView('board');
          }}
          onOpenNewDeal={handleOpenAddDealToStage}
          onNavigateToBoard={() => {
            setSelectedDealId(null);
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
            setActivePipelineSubFolderId(null);
            setSelectedDealId(null);
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
            setSelectedDealId(null);
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
          activePipelineSubFolderId={activePipelineSubFolderId}
          onClearSubFolderFilter={() => setActivePipelineSubFolderId(null)}
        />
      )}

      {/* Deal Inspector Slide-Over */}
      {selectedDeal && crmView !== 'dashboard' && (
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
