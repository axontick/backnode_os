import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OverviewPage } from './pages/OverviewPage';
import { TaskSpacesPage } from './pages/TaskSpacesPage';
import { SpacePage } from './pages/SpacePage';
import { ListPage } from './pages/ListPage';
import { CrmPage } from './pages/CrmPage';
import { PipelinePage } from './pages/PipelinePage';
import { ContactsPage } from './pages/ContactsPage';
import { TeamAccessPage } from './pages/TeamAccessPage';
import { RolesPage } from './pages/RolesPage';
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AuthModal } from './components/AuthModal';
import { ListRedirect } from './components/ListRedirect';
import { RootSpaceRedirect } from './components/RootSpaceRedirect';
import { DocsPage } from './modules/docs';
import { PluginsPage } from './modules/plugins';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-[6px] bg-orange-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(234,88,12,0.4)] animate-pulse">
              <span className="material-symbols-outlined text-white text-2xl">token</span>
            </div>
            <div className="absolute inset-0 rounded-[6px] border border-orange-500/30 animate-ping pointer-events-none" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-sm tracking-wider uppercase text-zinc-300 font-semibold font-headline">
              BACKNODE OS
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Restoring secure operator environment...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* Protected Application Routes Strictly Nested Under /space/:spaceId */}
          <Route
            path="/space/:spaceId"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Main Executive Dashboard inside Space */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OverviewPage />} />
            <Route path="overview" element={<Navigate to="dashboard" replace />} />

            {/* Task Spaces Hub */}
            <Route path="spaces" element={<TaskSpacesPage />} />

            {/* Dedicated Space Customization & Overview Pages */}
            <Route path="spaces/:folderId" element={<SpacePage />} />
            <Route path="spaces/:folderId/overview" element={<SpacePage />} />
            <Route path="spaces/:folderId/settings" element={<SpacePage />} />
            <Route path="spaces/:folderId/customize" element={<SpacePage />} />

            {/* Space Sub-Folder Routes */}
            <Route path="spaces/:folderId/folders/:subFolderId" element={<SpacePage />} />

            {/* Dedicated List Page with View Routes */}
            <Route path="spaces/:folderId/lists/:listId" element={<ListPage />} />
            <Route path="spaces/:folderId/lists/:listId/:view" element={<ListPage />} />
            <Route path="spaces/:folderId/lists/:listId/table/:statusView" element={<ListPage />} />

            {/* Sub-Folder Scoped List Routes */}
            <Route path="spaces/:folderId/folders/:subFolderId/lists/:listId" element={<ListPage />} />
            <Route path="spaces/:folderId/folders/:subFolderId/lists/:listId/:view" element={<ListPage />} />
            <Route path="spaces/:folderId/folders/:subFolderId/lists/:listId/table/:statusView" element={<ListPage />} />

            {/* Shorthand / Direct List Routes inside this space */}
            <Route path="lists/:listId" element={<ListRedirect />} />
            <Route path="lists/:listId/:view" element={<ListRedirect />} />
            <Route path="lists/:listId/table/:statusView" element={<ListRedirect />} />

            {/* CRM Pipelines Routes */}
            <Route path="crm" element={<CrmPage />} />
            <Route path="crm/pipelines/:pipelineId" element={<PipelinePage />} />
            <Route path="crm/pipelines/:pipelineId/:view" element={<PipelinePage />} />
            <Route path="crm/pipelines/:pipelineId/folders/:subFolderId" element={<PipelinePage />} />
            <Route path="crm/pipelines/:pipelineId/folders/:subFolderId/:view" element={<PipelinePage />} />

            {/* Contacts Hub */}
            <Route path="contacts" element={<ContactsPage />} />

            {/* Standalone Documentation Hub */}
            <Route path="docs" element={<DocsPage />} />
            <Route path="docs/:docId" element={<DocsPage />} />

            {/* Plugins Registry & Integrations Hub */}
            <Route path="plugins" element={<PluginsPage />} />

            {/* Team & Access Controls (Unified Team & Roles) */}
            <Route path="team" element={<TeamAccessPage defaultTab="users" />} />
            <Route path="team/members/:memberId/edit" element={<TeamAccessPage />} />
            <Route path="roles" element={<TeamAccessPage defaultTab="roles" />} />
            <Route path="roles/:roleId" element={<TeamAccessPage defaultTab="roles" />} />
            <Route path="users" element={<Navigate to="../team" replace />} />
            <Route path="users/*" element={<Navigate to="../team" replace />} />

            {/* Telemetry / Replication HUD - Removed as requested, redirecting to dashboard */}
            <Route path="replication" element={<Navigate to="dashboard" replace />} />
            <Route path="telemetry" element={<Navigate to="dashboard" replace />} />

            {/* Workspace Settings */}
            <Route path="settings" element={<WorkspaceSettingsPage />} />
            <Route path="settings/:tab" element={<WorkspaceSettingsPage />} />

            {/* 404 Catch-All inside this space */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Any URL accessed without /space/:spaceId is intercepted and redirected by RootSpaceRedirect */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <RootSpaceRedirect />
              </ProtectedRoute>
            }
          />
        </Routes>
        <AuthModal />
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
