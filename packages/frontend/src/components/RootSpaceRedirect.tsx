import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { findFolderByListId } from '../utils/treeUtils';

/**
 * RootSpaceRedirect intercepts any URL accessed without the /space/<id>/ prefix
 * (e.g. /dashboard, /spaces, /crm, /contacts, /team, /settings, /lists/:id)
 * and normalizes it to /space/:spaceId/<route>.
 */
export const RootSpaceRedirect: React.FC = () => {
  const location = useLocation();
  const { activeUserSpaceId, userSpaces, folders } = useWorkspace();

  const spaceId = activeUserSpaceId || userSpaces[0]?.id || 'space-main';
  const pathname = location.pathname;

  if (pathname === '/' || pathname === '') {
    return <Navigate to={`/space/${spaceId}/dashboard`} replace />;
  }

  // If someone accessed /lists/:listId direct shorthand
  if (pathname.startsWith('/lists/')) {
    const parts = pathname.replace('/lists/', '').split('/');
    const listId = parts[0];
    const view = parts[1] || 'board';
    const folder = findFolderByListId(folders, listId);
    const folderId = folder?.id || folders[0]?.id || 'fld-engineering';
    return <Navigate to={`/space/${spaceId}/spaces/${folderId}/lists/${listId}/${view}`} replace />;
  }

  return <Navigate to={`/space/${spaceId}${pathname}${location.search}`} replace />;
};
