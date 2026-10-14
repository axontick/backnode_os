import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { TaskSpaceDashboardView } from '../components/TaskSpaceDashboardView';
import { findFolderByListId } from '../utils/treeUtils';
import { mapDefaultViewToSlug } from '../utils/taskSpaceSettingsUtils';

export const TaskSpacesPage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId?: string }>();
  const navigate = useNavigate();
  const {
    activeUserSpaceId,
    userSpaces,
    filteredTasks,
    folders,
    listSettings,
    setIsNewFolderModalOpen,
    setFolderToEdit,
    setItemToDelete,
    handleOpenAddTaskToColumn,
    handleOpenAddListToFolder,
  } = useWorkspace();

  const currentSpaceId = spaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const spacePrefix = `/space/${currentSpaceId}`;

  const handleSelectSpaceOrList = (spaceOrListId: string) => {
    // Check if it's a folder
    const isFolder = folders.some((f) => f.id === spaceOrListId);
    if (isFolder) {
      navigate(`${spacePrefix}/spaces/${spaceOrListId}`);
      return;
    }

    // It's a list: find the parent folder
    const parentFolder = findFolderByListId(folders, spaceOrListId);
    const parentId = parentFolder?.id || folders[0]?.id;
    if (parentId) {
      const defaultSlug = mapDefaultViewToSlug(listSettings?.defaultView);
      navigate(`${spacePrefix}/spaces/${parentId}/lists/${spaceOrListId}/${defaultSlug}`);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative font-sans">
      <TaskSpaceDashboardView
        folders={folders}
        tasks={filteredTasks}
        onSelectSpace={handleSelectSpaceOrList}
        onOpenAddFolder={() => setIsNewFolderModalOpen(true)}
        onOpenAddListToFolder={handleOpenAddListToFolder}
        onOpenCreateTask={() => handleOpenAddTaskToColumn('In Progress')}
        onNavigateToView={(view) => {
          const firstFolder = folders[0];
          const firstList = firstFolder?.items[0]?.id;
          if (firstFolder?.id && firstList) {
            navigate(`${spacePrefix}/spaces/${firstFolder.id}/lists/${firstList}/${view}`);
          }
        }}
        onEditFolder={(folder) => {
          setFolderToEdit(folder);
          setIsNewFolderModalOpen(true);
        }}
        onDeleteFolder={(folder) => {
          setItemToDelete({ type: 'folder', item: folder });
        }}
      />
    </div>
  );
};
