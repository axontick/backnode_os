# Context Menu, Edit, and Delete for Folders and Pipelines

## Overview
This specification details the addition of a three-dots (`...`) context menu for folders and pipelines in Backnode OS. Users will be able to edit metadata (name, icon, color, description, and ARR target for pipelines) or permanently delete a folder or pipeline with a safe confirmation dialog and automatic fallback handling.

---

## Architecture & UI Components

### 1. Three-Dots Context Menu (`ActionMenu`)
- **Trigger Element:**
  - Placed on folder rows and pipeline rows in `SideNavBar.tsx`.
  - Placed on folder cards in `TaskSpaceDashboardView.tsx`.
  - Appears on hover (with `opacity-0 group-hover:opacity-100 transition-opacity`) and stays visible (`opacity-100`) while the menu is open.
  - Clicking the trigger stops event propagation (`e.stopPropagation()`) so parent card clicks, row selections, or tree expansions are not triggered.
- **Menu Dropdown:**
  - Styled with Backnode OS design tokens: white background, rounded-xl, subtle border `#d4c0d5]/60`, elevated shadow-xl, z-index 50.
  - Automatically handles click-outside dismissal and `Escape` key listeners.
  - Menu options:
    1. **Edit** (pencil / `edit` icon, violet highlight).
    2. **Delete** (trash / `delete` icon, rose-600 danger highlight).

### 2. Dual-Mode Modals (Create & Edit)
- **`NewFolderModal.tsx`:**
  - Accepts optional `folderToEdit?: SpaceFolder | null` and `onUpdateFolder?: (updated: SpaceFolder) => void`.
  - When `folderToEdit` is provided:
    - Pre-fills `name`, `description`, `icon`, and `color`.
    - Modal title displays "Edit Task Folder".
    - Submit button reads "Save Changes".
    - Dispatches `onUpdateFolder` on submit.
  - When `folderToEdit` is omitted/null:
    - Preserves exact creation flow ("Add Task Folder").
- **`NewPipelineModal.tsx`:**
  - Accepts optional `pipelineToEdit?: CrmPipeline | null` and `onUpdatePipeline?: (updated: CrmPipeline) => void`.
  - When `pipelineToEdit` is provided:
    - Pre-fills `name`, `description`, `icon`, `color`, and `targetArr` (`totalValue`).
    - Modal title displays "Edit Sales Pipeline".
    - Submit button reads "Save Changes".
    - Dispatches `onUpdatePipeline` on submit.
  - When `pipelineToEdit` is omitted/null:
    - Preserves exact creation flow ("Add Sales Pipeline").

### 3. Generalized Deletion Confirmation Modal
- **`DeleteConfirmationModal.tsx`:**
  - Extended to support polymorphic deletion:
    - Task deletion (existing functionality).
    - Folder deletion: Warns that the folder, its sub-lists, and housed tasks will be removed.
    - Pipeline deletion: Warns that the pipeline will be deleted and associated deals will have their pipeline unassigned.
  - Shows item identifier, name, destructive danger styling, and immediate commit alert badge.

---

## State Management & Backend Integration

### 1. Backend REST API
- **Pipelines Service & Controller (`packages/backend/src/pipelines/`):**
  - Add `PATCH /pipelines/:id`:
    - Validates ownership via `CurrentUser`'s `accountId`.
    - Updates `name`, `description`, `icon`, `color`, and `totalValue`.
  - Add `DELETE /pipelines/:id`:
    - Validates ownership via `CurrentUser`'s `accountId`.
    - Deletes pipeline. Associated deals' `pipeline_id` are set to `NULL` via TypeORM's existing foreign key constraint (`onDelete: 'SET NULL'`).
- **Folders (`packages/backend/src/workspace/`):**
  - Existing endpoints `PATCH /folders/:id` and `DELETE /folders/:id` are leveraged.

### 2. Frontend API Client (`packages/frontend/src/services/api.ts`)
- Update `pipelinesApi`:
  - `update(id: string, pipeline: Partial<CrmPipeline>): Promise<CrmPipeline>`
  - `delete(id: string): Promise<{ id: string }>`

### 3. Workspace Context (`WorkspaceContext.tsx`)
- **New State Variables:**
  - `folderToEdit: SpaceFolder | null`
  - `setFolderToEdit: (f: SpaceFolder | null) => void`
  - `pipelineToEdit: CrmPipeline | null`
  - `setPipelineToEdit: (p: CrmPipeline | null) => void`
  - `itemToDelete: { type: 'task' | 'folder' | 'pipeline'; item: any } | null`
  - `setItemToDelete: (val: { type: 'task' | 'folder' | 'pipeline'; item: any } | null) => void`
- **Mutations:**
  - `handleUpdateFolder(updated: SpaceFolder)`: Optimistically updates `folders` state, persists via `workspaceApi.updateFolder`, displays toast notification.
  - `handleDeleteFolder(folderId: string)`: Optimistically removes folder from state, persists via `workspaceApi.deleteFolder`. If the active space was within the deleted folder, falls back to the next available space.
  - `handleUpdatePipeline(updated: CrmPipeline)`: Optimistically updates `pipelines` state, persists via `pipelinesApi.update`, displays toast notification.
  - `handleDeletePipeline(pipelineId: string)`: Optimistically removes pipeline from state, persists via `pipelinesApi.delete`. If `activePipelineId` was the deleted pipeline, falls back to the next available pipeline.

---

## Error Handling & Resiliency
1. **Network Failure / Offline:** If the API call fails, the client logs the error and preserves the user's state without silent crashes.
2. **Active Item Safety:** Ensures `activeSpace` and `activePipelineId` always resolve to a valid existing item when an active entity is deleted.
3. **Menu Dismissal:** Global click listeners and escape key handlers ensure menus don't remain open or collide.
