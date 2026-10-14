import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { findFolderByListId } from '../utils/treeUtils';

/**
 * ListRedirect guarantees that any shorthand list URL is redirected to:
 * /space/:spaceId/spaces/:folderId/lists/:listId/:view
 */
export const ListRedirect: React.FC = () => {
  const { spaceId: routeSpaceId, listId, view, statusView } = useParams<{
    spaceId?: string;
    listId: string;
    view?: string;
    statusView?: string;
  }>();
  const { folders, activeUserSpaceId, userSpaces } = useWorkspace();

  const spaceId = routeSpaceId || activeUserSpaceId || userSpaces[0]?.id || 'space-main';

  if (!listId) {
    return <Navigate to={`/space/${spaceId}/spaces`} replace />;
  }

  // Lookup the parent space folder for this list
  const parentFolder = findFolderByListId(folders, listId);
  const folderId = parentFolder?.id || folders[0]?.id;

  if (!folderId) {
    return <Navigate to={`/space/${spaceId}/spaces`} replace />;
  }

  if (statusView) {
    return <Navigate to={`/space/${spaceId}/spaces/${folderId}/lists/${listId}/table/${statusView}`} replace />;
  }

  return <Navigate to={`/space/${spaceId}/spaces/${folderId}/lists/${listId}/${view || 'board'}`} replace />;
};
