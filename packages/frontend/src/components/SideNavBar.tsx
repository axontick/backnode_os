import React, { useState } from 'react';
import { SpaceFolder, CrmPipeline } from '../types';
import { PrimarySidebar } from './PrimarySidebar';
import { InnerSidebar } from './InnerSidebar';

export { PrimarySidebar } from './PrimarySidebar';
export { InnerSidebar } from './InnerSidebar';

export interface SideNavBarProps {
  currentHub: string;
  onSelectHub: (hub: string) => void;
  activeSpace: string;
  onSelectSpace: (space: string) => void;
  onOpenNewItem: () => void;
  onOpenCommandPalette: () => void;
  folders?: SpaceFolder[];
  onOpenAddFolder?: () => void;
  onEditFolder?: (folder: SpaceFolder) => void;
  onDeleteFolder?: (folder: SpaceFolder) => void;
  currentView?: string;
  onSelectDashboard?: () => void;
  crmView?: 'dashboard' | 'board' | 'list' | 'table' | 'analytics' | 'settings' | 'archived';
  onSelectCrmDashboard?: () => void;
  onSelectCrmBoard?: () => void;
  pipelines?: CrmPipeline[];
  activePipelineId?: string;
  onSelectPipeline?: (pipelineId: string) => void;
  onOpenAddPipeline?: () => void;
  onEditPipeline?: (pipeline: CrmPipeline) => void;
  onDeletePipeline?: (pipeline: CrmPipeline) => void;
  onSelectPipelineView?: (pipelineId: string, view: 'board' | 'analytics' | 'settings') => void;
  isEngineActive?: boolean;
  onToggleEngine?: () => void;
  latencyMs?: number;
}

/**
 * Backward-compatible dual sidebar wrapper.
 */
export const SideNavBar: React.FC<SideNavBarProps> = (props) => {
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(false);
  const [isInnerCollapsed, setIsInnerCollapsed] = useState(false);

  const hasInnerSidebar = props.currentHub === 'task-spaces' || props.currentHub === 'crm';

  return (
    <div className="flex shrink-0 h-screen select-none">
      <PrimarySidebar
        currentHub={props.currentHub}
        onSelectHub={props.onSelectHub}
        onOpenNewItem={props.onOpenNewItem}
        onOpenCommandPalette={props.onOpenCommandPalette}
        isCollapsed={isPrimaryCollapsed}
        onToggleCollapse={() => setIsPrimaryCollapsed((prev) => !prev)}
      />

      {hasInnerSidebar && (
        <InnerSidebar
          currentHub={props.currentHub}
          isCollapsed={isInnerCollapsed}
          onToggleCollapse={() => setIsInnerCollapsed((prev) => !prev)}
          folders={props.folders}
          activeSpace={props.activeSpace}
          currentView={props.currentView}
          onSelectSpace={props.onSelectSpace}
          onSelectDashboard={props.onSelectDashboard}
          onOpenAddFolder={props.onOpenAddFolder}
          onEditFolder={props.onEditFolder}
          onDeleteFolder={props.onDeleteFolder}
          pipelines={props.pipelines}
          activePipelineId={props.activePipelineId}
          crmView={props.crmView}
          onSelectPipeline={props.onSelectPipeline}
          onSelectCrmDashboard={props.onSelectCrmDashboard}
          onSelectCrmBoard={props.onSelectCrmBoard}
          onSelectPipelineView={props.onSelectPipelineView}
          onOpenAddPipeline={props.onOpenAddPipeline}
          onEditPipeline={props.onEditPipeline}
          onDeletePipeline={props.onDeletePipeline}
        />
      )}
    </div>
  );
};
