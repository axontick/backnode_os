# Folder & Pipeline Context Menu, Edit, and Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-dots (`...`) context menu for folders and pipelines in the Side Navigation Bar and Task Space Dashboard cards to enable editing metadata and safely deleting entities with confirmation modals and backend persistence.

**Architecture:** Extend NestJS backend with `PATCH /pipelines/:id` and `DELETE /pipelines/:id` endpoints. Enhance frontend `WorkspaceContext` with mutation handlers and editing/deletion state. Create a reusable `ActionContextMenu` component, adapt `NewFolderModal` and `NewPipelineModal` for edit mode, generalize `DeleteConfirmationModal` for polymorphic deletions, and integrate the three-dots triggers into `SideNavBar` and `TaskSpaceDashboardView`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, NestJS 10, TypeORM, PostgreSQL.

---

### Task 1: Backend Endpoints for CRM Pipeline Update & Deletion

**Files:**
- Modify: `packages/backend/src/pipelines/pipelines.service.ts`
- Modify: `packages/backend/src/pipelines/pipelines.controller.ts`

- [ ] **Step 1: Add `update` and `delete` methods to `PipelinesService`**
In `packages/backend/src/pipelines/pipelines.service.ts`, add the following methods:
```typescript
  async update(accountId: string, id: string, data: any) {
    const pipeline = await this.pipelineRepo.findOne({ where: { id, accountId } });
    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${id} not found in this account`);
    }

    if (data.name !== undefined) pipeline.name = data.name;
    if (data.description !== undefined) pipeline.description = data.description;
    if (data.icon !== undefined) pipeline.icon = data.icon;
    if (data.color !== undefined) pipeline.color = data.color;
    if (data.totalValue !== undefined) pipeline.totalValue = data.totalValue;

    return this.pipelineRepo.save(pipeline);
  }

  async delete(accountId: string, id: string) {
    const pipeline = await this.pipelineRepo.findOne({ where: { id, accountId } });
    if (!pipeline) {
      throw new NotFoundException(`Pipeline ${id} not found in this account`);
    }
    await this.pipelineRepo.remove(pipeline);
    return { id };
  }
```

- [ ] **Step 2: Add `PATCH` and `DELETE` endpoints to `PipelinesController`**
In `packages/backend/src/pipelines/pipelines.controller.ts`, import `Patch` and `Delete` from `@nestjs/common`, and add:
```typescript
  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.pipelinesService.update(user.accountId, id, data);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.pipelinesService.delete(user.accountId, id);
  }
```

- [ ] **Step 3: Run backend build to verify compilation**
Run: `yarn workspace @backnode/backend build`
Expected: Done in ~3s with exit code 0.

- [ ] **Step 4: Commit backend changes**
```bash
git add packages/backend/src/pipelines/pipelines.service.ts packages/backend/src/pipelines/pipelines.controller.ts
git commit -m "feat(backend): add update and delete endpoints for pipelines"
```

---

### Task 2: Frontend API Client & WorkspaceContext Mutations

**Files:**
- Modify: `packages/frontend/src/services/api.ts`
- Modify: `packages/frontend/src/context/WorkspaceContext.tsx`

- [ ] **Step 1: Update `pipelinesApi` in `packages/frontend/src/services/api.ts`**
Add `update` and `delete` methods to `pipelinesApi`:
```typescript
  update: async (id: string, pipeline: Partial<CrmPipeline>): Promise<CrmPipeline> => {
    const res = await apiClient.patch<CrmPipeline>(`/pipelines/${id}`, pipeline);
    return res.data;
  },
  delete: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete<{ id: string }>(`/pipelines/${id}`);
    return res.data;
  },
```

- [ ] **Step 2: Add editing and deletion states and handlers to `WorkspaceContext.tsx`**
In `WorkspaceContext.tsx`:
1. Add state types and handlers to `WorkspaceContextType`:
```typescript
  folderToEdit: SpaceFolder | null;
  setFolderToEdit: (folder: SpaceFolder | null) => void;
  pipelineToEdit: CrmPipeline | null;
  setPipelineToEdit: (pipeline: CrmPipeline | null) => void;
  itemToDelete: { type: 'task' | 'folder' | 'pipeline'; item: any } | null;
  setItemToDelete: (target: { type: 'task' | 'folder' | 'pipeline'; item: any } | null) => void;
  handleUpdateFolder: (updatedFolder: SpaceFolder) => void;
  handleDeleteFolder: (folderId: string) => void;
  handleUpdatePipeline: (updatedPipeline: CrmPipeline) => void;
  handleDeletePipeline: (pipelineId: string) => void;
  handleConfirmDeleteItem: () => void;
```

2. Implement state in `WorkspaceProvider`:
```typescript
  const [folderToEdit, setFolderToEdit] = useState<SpaceFolder | null>(null);
  const [pipelineToEdit, setPipelineToEdit] = useState<CrmPipeline | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'task' | 'folder' | 'pipeline'; item: any } | null>(null);
```

3. Implement handlers:
```typescript
  const handleUpdateFolder = (updatedFolder: SpaceFolder) => {
    setFolders((prev) => prev.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)));
    workspaceApi.updateFolder(updatedFolder.id, updatedFolder).catch((err) => {
      console.error('Failed to update folder in DB:', err);
    });
    showToast(`Folder "${updatedFolder.name}" updated`);
    setFolderToEdit(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => {
      const remaining = prev.filter((f) => f.id !== folderId);
      // If active space was in deleted folder, switch to first available item
      const deletedFolder = prev.find((f) => f.id === folderId);
      if (deletedFolder?.items?.some((i) => i.id === activeSpace)) {
        const nextSpace = remaining[0]?.items?.[0]?.id || 'sprint-14';
        setActiveSpace(nextSpace);
      }
      return remaining;
    });
    workspaceApi.deleteFolder(folderId).catch((err) => {
      console.error('Failed to delete folder in DB:', err);
    });
    showToast('Folder deleted');
  };

  const handleUpdatePipeline = (updatedPipeline: CrmPipeline) => {
    setPipelines((prev) => prev.map((p) => (p.id === updatedPipeline.id ? updatedPipeline : p)));
    pipelinesApi.update(updatedPipeline.id, updatedPipeline).catch((err) => {
      console.error('Failed to update pipeline in DB:', err);
    });
    showToast(`Pipeline "${updatedPipeline.name}" updated`);
    setPipelineToEdit(null);
  };

  const handleDeletePipeline = (pipelineId: string) => {
    setPipelines((prev) => {
      const remaining = prev.filter((p) => p.id !== pipelineId);
      if (activePipelineId === pipelineId && remaining.length > 0) {
        setActivePipelineId(remaining[0].id);
      }
      return remaining;
    });
    pipelinesApi.delete(pipelineId).catch((err) => {
      console.error('Failed to delete pipeline in DB:', err);
    });
    showToast('Pipeline deleted');
  };

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'task') {
      handleDeleteTask(itemToDelete.item.id);
    } else if (itemToDelete.type === 'folder') {
      handleDeleteFolder(itemToDelete.item.id);
    } else if (itemToDelete.type === 'pipeline') {
      handleDeletePipeline(itemToDelete.item.id);
    }
    setItemToDelete(null);
  };
```

4. Expose all new state and methods in `WorkspaceContext.Provider value={{ ... }}`.

- [ ] **Step 3: Run frontend lint check to verify type compliance**
Run: `yarn workspace @backnode/frontend lint`
Expected: Done with exit code 0.

- [ ] **Step 4: Commit context updates**
```bash
git add packages/frontend/src/services/api.ts packages/frontend/src/context/WorkspaceContext.tsx
git commit -m "feat(context): add update and delete handlers for folders and pipelines"
```

---

### Task 3: Reusable Action Context Menu Component

**Files:**
- Create: `packages/frontend/src/components/ActionContextMenu.tsx`

- [ ] **Step 1: Implement `ActionContextMenu.tsx`**
Create `packages/frontend/src/components/ActionContextMenu.tsx`:
```tsx
import React, { useEffect, useRef } from 'react';

interface ActionContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  align?: 'left' | 'right';
}

export const ActionContextMenu: React.FC<ActionContextMenuProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  align = 'right',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-full mt-1 ${
        align === 'right' ? 'right-0' : 'left-0'
      } w-36 bg-white border border-[#d4c0d5]/60 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5 text-xs animate-in fade-in zoom-in-95 duration-100 select-none`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#504252] hover:text-[#9900c2] hover:bg-[#f4f2fd] transition-colors text-left font-medium"
      >
        <span className="material-symbols-outlined text-[15px] text-[#837284]">edit</span>
        <span>{editLabel}</span>
      </button>

      <div className="h-px bg-[#d4c0d5]/30 my-0.5" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-left font-medium"
      >
        <span className="material-symbols-outlined text-[15px] text-rose-500">delete</span>
        <span>{deleteLabel}</span>
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Verify compilation**
Run: `yarn workspace @backnode/frontend lint`
Expected: Done with exit code 0.

- [ ] **Step 3: Commit ActionContextMenu**
```bash
git add packages/frontend/src/components/ActionContextMenu.tsx
git commit -m "feat(ui): create ActionContextMenu component"
```

---

### Task 4: Polymorphic Dual-Mode Modals (Folder & Pipeline)

**Files:**
- Modify: `packages/frontend/src/components/NewFolderModal.tsx`
- Modify: `packages/frontend/src/components/NewPipelineModal.tsx`

- [ ] **Step 1: Support edit mode in `NewFolderModal.tsx`**
Update `NewFolderModalProps` and component logic:
```tsx
interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder?: (newFolder: SpaceFolder) => void;
  folderToEdit?: SpaceFolder | null;
  onUpdateFolder?: (updatedFolder: SpaceFolder) => void;
}
```
In `NewFolderModal`:
- Add `useEffect` to initialize `folderName`, `description`, `selectedIcon`, `selectedColor` from `folderToEdit` when provided; otherwise reset to default.
- Header title: `{folderToEdit ? 'Edit Task Folder' : 'Add Task Folder'}`
- Button label: `{folderToEdit ? 'Save Changes' : 'Create Folder'}`
- On submit: If `folderToEdit`, call `onUpdateFolder({ ...folderToEdit, name: folderName.trim(), description: description.trim(), icon: selectedIcon, color: selectedColor })`. If not editing, call `onCreateFolder`.
- Hide the "Initial Sub-List" field when editing an existing folder.

- [ ] **Step 2: Support edit mode in `NewPipelineModal.tsx`**
Update `NewPipelineModalProps` and component logic:
```tsx
interface NewPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePipeline?: (newPipeline: CrmPipeline) => void;
  pipelineToEdit?: CrmPipeline | null;
  onUpdatePipeline?: (updatedPipeline: CrmPipeline) => void;
}
```
In `NewPipelineModal`:
- Add `useEffect` to initialize `pipelineName`, `description`, `selectedIcon`, `selectedColor`, `targetArr` from `pipelineToEdit` when provided.
- Header title: `{pipelineToEdit ? 'Edit Sales Pipeline' : 'Add Sales Pipeline'}`
- Button label: `{pipelineToEdit ? 'Save Changes' : 'Create Pipeline'}`
- On submit: If `pipelineToEdit`, call `onUpdatePipeline({ ...pipelineToEdit, name: pipelineName.trim(), description: description.trim(), icon: selectedIcon, color: selectedColor, totalValue: val })`. If not editing, call `onCreatePipeline`.

- [ ] **Step 3: Verify compilation**
Run: `yarn workspace @backnode/frontend lint`
Expected: Done with exit code 0.

- [ ] **Step 4: Commit dual-mode modal updates**
```bash
git add packages/frontend/src/components/NewFolderModal.tsx packages/frontend/src/components/NewPipelineModal.tsx
git commit -m "feat(ui): support edit mode in NewFolderModal and NewPipelineModal"
```

---

### Task 5: Generalized Deletion Confirmation Modal

**Files:**
- Modify: `packages/frontend/src/components/DeleteConfirmationModal.tsx`

- [ ] **Step 1: Extend `DeleteConfirmationModal.tsx` for tasks, folders, and pipelines**
Update `DeleteConfirmationModalProps`:
```tsx
export type DeletionTarget =
  | { type: 'task'; item: TaskItem }
  | { type: 'folder'; item: SpaceFolder }
  | { type: 'pipeline'; item: CrmPipeline };

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  task?: TaskItem | null;
  target?: DeletionTarget | null;
  onClose: () => void;
  onConfirmDelete?: (taskId: string) => void;
  onConfirmDeleteTarget?: () => void;
}
```
Support backwards-compatibility with `task` and `onConfirmDelete`, while adding support for `target` and `onConfirmDeleteTarget`.
When `target?.type === 'folder'`:
- Title: "Delete Folder Permanently?"
- Content: "Are you sure you want to delete folder **{folder.name}**? This will remove the folder along with its **{folder.items.length} lists**."
When `target?.type === 'pipeline'`:
- Title: "Delete Pipeline Permanently?"
- Content: "Are you sure you want to delete sales pipeline **{pipeline.name}**? Its **{pipeline.dealCount || 0} active deals** will have their pipeline assignment removed."
When `task` or `target?.type === 'task'`:
- Keeps existing deliverable warning and linked CRM deal badge.

- [ ] **Step 2: Verify compilation**
Run: `yarn workspace @backnode/frontend lint`
Expected: Done with exit code 0.

- [ ] **Step 3: Commit DeleteConfirmationModal**
```bash
git add packages/frontend/src/components/DeleteConfirmationModal.tsx
git commit -m "feat(ui): generalize DeleteConfirmationModal for tasks, folders, and pipelines"
```

---

### Task 6: Wire Three Dots Context Menu into SideNavBar

**Files:**
- Modify: `packages/frontend/src/components/SideNavBar.tsx`
- Modify: `packages/frontend/src/layouts/DashboardLayout.tsx`

- [ ] **Step 1: Add context menu trigger to folder and pipeline rows in `SideNavBar.tsx`**
In `SideNavBar.tsx`:
1. Add props for callbacks:
```tsx
  onEditFolder?: (folder: SpaceFolder) => void;
  onDeleteFolder?: (folder: SpaceFolder) => void;
  onEditPipeline?: (pipeline: CrmPipeline) => void;
  onDeletePipeline?: (pipeline: CrmPipeline) => void;
```
2. Track open menu states:
```tsx
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
```
3. In folder row:
Wrap folder row with a 3-dots trigger button:
```tsx
  <div className="relative shrink-0 flex items-center">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === `fld-${folder.id}` ? null : `fld-${folder.id}`);
      }}
      className={`w-5 h-5 rounded hover:bg-[#9900c2]/10 text-[#837284] hover:text-[#9900c2] flex items-center justify-center transition-all ${
        activeMenuId === `fld-${folder.id}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
      title="Folder actions"
    >
      <span className="material-symbols-outlined text-[15px]">more_vert</span>
    </button>
    <ActionContextMenu
      isOpen={activeMenuId === `fld-${folder.id}`}
      onClose={() => setActiveMenuId(null)}
      onEdit={() => onEditFolder?.(folder)}
      onDelete={() => onDeleteFolder?.(folder)}
      editLabel="Edit Folder"
      deleteLabel="Delete Folder"
    />
  </div>
```
4. In pipeline row:
Add the same 3-dots button and `ActionContextMenu`:
```tsx
  <div className="relative shrink-0 flex items-center">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === `pipe-${pipe.id}` ? null : `pipe-${pipe.id}`);
      }}
      className={`w-5 h-5 rounded hover:bg-[#9900c2]/10 text-[#837284] hover:text-[#9900c2] flex items-center justify-center transition-all ${
        activeMenuId === `pipe-${pipe.id}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
      title="Pipeline actions"
    >
      <span className="material-symbols-outlined text-[15px]">more_vert</span>
    </button>
    <ActionContextMenu
      isOpen={activeMenuId === `pipe-${pipe.id}`}
      onClose={() => setActiveMenuId(null)}
      onEdit={() => onEditPipeline?.(pipe)}
      onDelete={() => onDeletePipeline?.(pipe)}
      editLabel="Edit Pipeline"
      deleteLabel="Delete Pipeline"
    />
  </div>
```

- [ ] **Step 2: Connect modals and handlers in `DashboardLayout.tsx`**
In `DashboardLayout.tsx`:
1. Connect `onEditFolder`, `onDeleteFolder`, `onEditPipeline`, `onDeletePipeline` to `SideNavBar`.
2. Connect `folderToEdit`, `pipelineToEdit`, `itemToDelete`, `handleUpdateFolder`, `handleUpdatePipeline`, `handleConfirmDeleteItem`.
3. Pass `folderToEdit` and `onUpdateFolder` to `NewFolderModal`. Open `isNewFolderModalOpen` when `folderToEdit` is set.
4. Pass `pipelineToEdit` and `onUpdatePipeline` to `NewPipelineModal`. Open `isNewPipelineModalOpen` when `pipelineToEdit` is set.
5. Render `DeleteConfirmationModal` with `target={itemToDelete}` and `onConfirmDeleteTarget={handleConfirmDeleteItem}`.

- [ ] **Step 3: Verify compilation**
Run: `yarn workspace @backnode/frontend lint`
Expected: Done with exit code 0.

- [ ] **Step 4: Commit SideNavBar & DashboardLayout wiring**
```bash
git add packages/frontend/src/components/SideNavBar.tsx packages/frontend/src/layouts/DashboardLayout.tsx
git commit -m "feat(ui): wire three dots menu into SideNavBar and connect modals in DashboardLayout"
```

---

### Task 7: Wire Three Dots Context Menu into TaskSpaceDashboardView Folder Cards

**Files:**
- Modify: `packages/frontend/src/components/TaskSpaceDashboardView.tsx`
- Modify: `packages/frontend/src/pages/TaskSpacesPage.tsx`

- [ ] **Step 1: Add context menu trigger to folder cards in `TaskSpaceDashboardView.tsx`**
In `TaskSpaceDashboardView.tsx`:
1. Add props:
```tsx
  onEditFolder?: (folder: SpaceFolder) => void;
  onDeleteFolder?: (folder: SpaceFolder) => void;
```
2. Track `activeMenuId`.
3. In the top-right action area of each folder card (next to the expand button), add the 3-dots trigger button and `ActionContextMenu`:
```tsx
  <div className="relative">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
      }}
      className="w-7 h-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors"
      title="Folder actions"
    >
      <span className="material-symbols-outlined text-[18px]">more_vert</span>
    </button>
    <ActionContextMenu
      isOpen={activeMenuId === folder.id}
      onClose={() => setActiveMenuId(null)}
      onEdit={() => onEditFolder?.(folder)}
      onDelete={() => onDeleteFolder?.(folder)}
      editLabel="Edit Folder"
      deleteLabel="Delete Folder"
    />
  </div>
```

- [ ] **Step 2: Pass handlers from `TaskSpacesPage.tsx`**
In `TaskSpacesPage.tsx`:
Pull `setFolderToEdit`, `setItemToDelete`, `setIsNewFolderModalOpen` from `useWorkspace()` and pass `onEditFolder` and `onDeleteFolder` into `TaskSpaceDashboardView`.

- [ ] **Step 3: Verify compilation**
Run: `yarn workspace @backnode/frontend lint`
Expected: Done with exit code 0.

- [ ] **Step 4: Commit dashboard folder card updates**
```bash
git add packages/frontend/src/components/TaskSpaceDashboardView.tsx packages/frontend/src/pages/TaskSpacesPage.tsx
git commit -m "feat(ui): add three dots context menu to TaskSpaceDashboardView folder cards"
```

---

### Task 8: Full Monorepo Build & Final Verification

**Files:**
- Entire repository

- [ ] **Step 1: Build shared package**
Run: `yarn workspace @backnode/shared build`
Expected: Done with exit code 0.

- [ ] **Step 2: Build backend**
Run: `yarn workspace @backnode/backend build`
Expected: Done with exit code 0.

- [ ] **Step 3: Build frontend**
Run: `yarn workspace @backnode/frontend build`
Expected: Done with exit code 0.

- [ ] **Step 4: Commit any remaining adjustments**
```bash
git add -A
git commit -m "chore: verify full build for folder and pipeline context menu"
```
