import { SpaceFolder, SpaceSubFolder, FolderChildItem, CrmPipeline, CrmPipelineSubFolder } from '../types';

/**
 * Recursively collects all child items (lists) from a SpaceSubFolder and its nested subfolders.
 */
export function getAllItemsFromSubFolder(sub: SpaceSubFolder): FolderChildItem[] {
  const items: FolderChildItem[] = [...(sub.items || [])];
  if (sub.subFolders && sub.subFolders.length > 0) {
    for (const child of sub.subFolders) {
      items.push(...getAllItemsFromSubFolder(child));
    }
  }
  return items;
}

/**
 * Recursively collects all child items (lists) from a SpaceFolder and its nested subfolders.
 */
export function getAllItemsFromFolder(folder: SpaceFolder): FolderChildItem[] {
  const items: FolderChildItem[] = [...(folder.items || [])];
  if (folder.subFolders && folder.subFolders.length > 0) {
    for (const sub of folder.subFolders) {
      items.push(...getAllItemsFromSubFolder(sub));
    }
  }
  return items;
}

/**
 * Recursively collects all subfolders from a SpaceSubFolder tree into a flat array.
 */
export function flattenSubFolders(
  subFolders: SpaceSubFolder[] | undefined,
  depth: number = 0,
  prefix: string = ''
): { subFolder: SpaceSubFolder; depth: number; pathName: string }[] {
  if (!subFolders || subFolders.length === 0) return [];
  const result: { subFolder: SpaceSubFolder; depth: number; pathName: string }[] = [];
  for (const sf of subFolders) {
    const currentPath = prefix ? `${prefix} / ${sf.name}` : sf.name;
    result.push({ subFolder: sf, depth, pathName: currentPath });
    if (sf.subFolders && sf.subFolders.length > 0) {
      result.push(...flattenSubFolders(sf.subFolders, depth + 1, currentPath));
    }
  }
  return result;
}

/**
 * Flattens all folders and their nested subfolders for selection dropdowns.
 */
export interface FlattenedFolderOption {
  id: string;
  name: string;
  depth: number;
  isFolder: boolean;
  rootFolderId: string;
  itemCount: number;
}

export function getFlattenedFolderTree(folders: SpaceFolder[]): FlattenedFolderOption[] {
  const options: FlattenedFolderOption[] = [];
  for (const f of folders) {
    options.push({
      id: f.id,
      name: f.name,
      depth: 0,
      isFolder: true,
      rootFolderId: f.id,
      itemCount: f.items?.length || 0,
    });
    const flatSubs = flattenSubFolders(f.subFolders, 1, '');
    for (const s of flatSubs) {
      options.push({
        id: s.subFolder.id,
        name: s.subFolder.name,
        depth: s.depth,
        isFolder: false,
        rootFolderId: f.id,
        itemCount: s.subFolder.items?.length || 0,
      });
    }
  }
  return options;
}

/**
 * Recursively adds a new subfolder into the tree at the target parent ID.
 * If targetParentId is found on a subfolder, newSubFolder is added to its subFolders.
 * Returns { updated: SpaceSubFolder[], added: boolean }
 */
export function addSubFolderRecursively(
  subFolders: SpaceSubFolder[] | undefined,
  targetParentId: string,
  newSubFolder: SpaceSubFolder
): { updated: SpaceSubFolder[]; added: boolean } {
  if (!subFolders) return { updated: [], added: false };
  let added = false;
  const updated = subFolders.map((sf) => {
    if (sf.id === targetParentId) {
      added = true;
      return {
        ...sf,
        subFolders: [...(sf.subFolders || []), newSubFolder],
      };
    }
    if (sf.subFolders && sf.subFolders.length > 0) {
      const childRes = addSubFolderRecursively(sf.subFolders, targetParentId, newSubFolder);
      if (childRes.added) {
        added = true;
        return {
          ...sf,
          subFolders: childRes.updated,
        };
      }
    }
    return sf;
  });
  return { updated, added };
}

/**
 * Recursively updates an existing subfolder in the tree.
 */
export function updateSubFolderRecursively(
  subFolders: SpaceSubFolder[] | undefined,
  updatedSubFolder: SpaceSubFolder
): SpaceSubFolder[] {
  if (!subFolders) return [];
  return subFolders.map((sf) => {
    if (sf.id === updatedSubFolder.id) {
      return {
        ...sf,
        ...updatedSubFolder,
        subFolders: updatedSubFolder.subFolders ?? sf.subFolders,
      };
    }
    if (sf.subFolders && sf.subFolders.length > 0) {
      return {
        ...sf,
        subFolders: updateSubFolderRecursively(sf.subFolders, updatedSubFolder),
      };
    }
    return sf;
  });
}

/**
 * Recursively deletes a subfolder by ID and collects the deleted subfolder (including its items).
 */
export function deleteSubFolderRecursively(
  subFolders: SpaceSubFolder[] | undefined,
  subFolderId: string
): { updated: SpaceSubFolder[]; deleted?: SpaceSubFolder } {
  if (!subFolders) return { updated: [] };
  let deleted: SpaceSubFolder | undefined;
  const filtered: SpaceSubFolder[] = [];

  for (const sf of subFolders) {
    if (sf.id === subFolderId) {
      deleted = sf;
      continue;
    }
    if (sf.subFolders && sf.subFolders.length > 0) {
      const childRes = deleteSubFolderRecursively(sf.subFolders, subFolderId);
      if (childRes.deleted) {
        deleted = childRes.deleted;
        filtered.push({
          ...sf,
          subFolders: childRes.updated,
        });
        continue;
      }
    }
    filtered.push(sf);
  }
  return { updated: filtered, deleted };
}

/**
 * Recursively adds a list item into a target subfolder.
 */
export function addListToSubFolderRecursively(
  subFolders: SpaceSubFolder[] | undefined,
  targetSubFolderId: string,
  newItem: FolderChildItem
): { updated: SpaceSubFolder[]; added: boolean } {
  if (!subFolders) return { updated: [], added: false };
  let added = false;
  const updated = subFolders.map((sf) => {
    if (sf.id === targetSubFolderId) {
      added = true;
      return {
        ...sf,
        items: [...(sf.items || []), newItem],
      };
    }
    if (sf.subFolders && sf.subFolders.length > 0) {
      const childRes = addListToSubFolderRecursively(sf.subFolders, targetSubFolderId, newItem);
      if (childRes.added) {
        added = true;
        return {
          ...sf,
          subFolders: childRes.updated,
        };
      }
    }
    return sf;
  });
  return { updated, added };
}

/**
 * Recursively deletes a list item from nested subfolders.
 */
export function deleteListItemFromSubFoldersRecursively(
  subFolders: SpaceSubFolder[] | undefined,
  listId: string
): { updated: SpaceSubFolder[]; deleted?: FolderChildItem } {
  if (!subFolders) return { updated: [], deleted: undefined };
  let deleted: FolderChildItem | undefined;
  const updated = subFolders.map((sf) => {
    let sfChanged = false;
    let items = sf.items;
    if (items && items.some((item) => item.id === listId)) {
      deleted = items.find((item) => item.id === listId);
      items = items.filter((item) => item.id !== listId);
      sfChanged = true;
    }
    let nestedSubFolders = sf.subFolders;
    if (nestedSubFolders && nestedSubFolders.length > 0) {
      const childRes = deleteListItemFromSubFoldersRecursively(nestedSubFolders, listId);
      if (childRes.deleted) {
        deleted = childRes.deleted;
        nestedSubFolders = childRes.updated;
        sfChanged = true;
      }
    }
    if (sfChanged) {
      return {
        ...sf,
        items,
        subFolders: nestedSubFolders,
      };
    }
    return sf;
  });
  return { updated, deleted };
}

/**
 * Recursively moves a list item from its existing location in `folders`
 * into a target folder (or target subfolder).
 */
export function moveListToFolder(
  folders: SpaceFolder[],
  listId: string,
  targetFolderId: string,
  targetSubFolderId?: string
): {
  updatedFolders: SpaceFolder[];
  success: boolean;
  movedItem?: FolderChildItem;
  targetName?: string;
  sourceName?: string;
} {
  let movedItem: FolderChildItem | undefined;
  let sourceName = '';
  let targetName = '';

  // 1. Remove the list item from its current folder / subfolder
  const foldersWithoutItem = folders.map((f) => {
    let changed = false;
    let items = f.items ? [...f.items] : [];
    const directIdx = items.findIndex((i) => i.id === listId);
    if (directIdx !== -1) {
      movedItem = items[directIdx];
      sourceName = f.name;
      items.splice(directIdx, 1);
      changed = true;
    }

    let subFolders = f.subFolders;
    if (!movedItem && subFolders && subFolders.length > 0) {
      const res = deleteListItemFromSubFoldersRecursively(subFolders, listId);
      if (res.deleted) {
        movedItem = res.deleted;
        sourceName = f.name;
        subFolders = res.updated;
        changed = true;
      }
    }

    if (changed) {
      return {
        ...f,
        items,
        subFolders,
      };
    }
    return f;
  });

  if (!movedItem) {
    return { updatedFolders: folders, success: false };
  }

  // 2. Add the list item to the destination
  let added = false;
  const finalFolders = foldersWithoutItem.map((f) => {
    if (f.id === targetFolderId) {
      if (!targetSubFolderId) {
        // Adding directly to root folder
        targetName = f.name;
        added = true;
        return {
          ...f,
          items: [...(f.items || []), movedItem!],
        };
      } else {
        // Adding to a subfolder within this folder
        const addRes = addListToSubFolderRecursively(f.subFolders, targetSubFolderId, movedItem!);
        if (addRes.added) {
          added = true;
          const flat = flattenSubFolders(f.subFolders);
          const foundSub = flat.find((s) => s.subFolder.id === targetSubFolderId);
          targetName = foundSub ? `${f.name} / ${foundSub.subFolder.name}` : f.name;
          return {
            ...f,
            subFolders: addRes.updated,
          };
        }
      }
    }
    return f;
  });

  return {
    updatedFolders: finalFolders,
    success: added,
    movedItem,
    targetName,
    sourceName,
  };
}

/**
 * Recursively moves a pipeline sub-folder from its existing location in `pipelines`
 * into a target pipeline (or target parent sub-folder).
 */
export function movePipelineSubFolder(
  pipelines: CrmPipeline[],
  subFolderId: string,
  targetPipelineId: string,
  targetParentSubFolderId?: string
): {
  updatedPipelines: CrmPipeline[];
  success: boolean;
  movedSubFolder?: CrmPipelineSubFolder;
  targetName?: string;
} {
  let movedSubFolder: CrmPipelineSubFolder | undefined;
  let targetName = '';

  // 1. Remove subfolder from its current pipeline / parent
  const pipesWithoutSub = pipelines.map((p) => {
    if (!p.subFolders || p.subFolders.length === 0) return p;
    const res = deletePipelineSubFolderRecursively(p.subFolders, subFolderId);
    if (res.deleted) {
      movedSubFolder = res.deleted;
      return {
        ...p,
        subFolders: res.updated,
      };
    }
    return p;
  });

  if (!movedSubFolder) {
    return { updatedPipelines: pipelines, success: false };
  }

  // 2. Add subfolder to destination pipeline / parent subfolder
  let added = false;
  const finalPipelines = pipesWithoutSub.map((p) => {
    if (p.id === targetPipelineId) {
      if (!targetParentSubFolderId) {
        // Add to top level of pipeline
        targetName = p.name;
        added = true;
        const updatedItem = {
          ...movedSubFolder!,
          pipelineId: p.id,
          parentId: undefined,
        };
        return {
          ...p,
          subFolders: [...(p.subFolders || []), updatedItem],
        };
      } else {
        // Add as child of target parent subfolder
        const updatedItem = {
          ...movedSubFolder!,
          pipelineId: p.id,
          parentId: targetParentSubFolderId,
        };
        const addRes = addPipelineSubFolderRecursively(
          p.subFolders,
          targetParentSubFolderId,
          updatedItem
        );
        if (addRes.added) {
          added = true;
          const flat = flattenPipelineSubFolders(p.subFolders);
          const found = flat.find((s) => s.subFolder.id === targetParentSubFolderId);
          targetName = found ? `${p.name} / ${found.subFolder.name}` : p.name;
          return {
            ...p,
            subFolders: addRes.updated,
          };
        }
      }
    }
    return p;
  });

  return {
    updatedPipelines: finalPipelines,
    success: added,
    movedSubFolder,
    targetName,
  };
}

/**
 * Find the breadcrumb trail for an active space ID across folders and nested subfolders.
 */
export function findSpaceBreadcrumbs(
  folders: SpaceFolder[],
  targetSpaceId: string
): { folderName: string; subFolderNames: string[]; spaceName: string } | null {
  for (const folder of folders) {
    const directItem = folder.items?.find((i) => i.id === targetSpaceId);
    if (directItem) {
      return {
        folderName: folder.name,
        subFolderNames: [],
        spaceName: directItem.name,
      };
    }

    function searchInSub(
      sub: SpaceSubFolder,
      path: string[]
    ): { folderName: string; subFolderNames: string[]; spaceName: string } | null {
      const foundItem = sub.items?.find((i) => i.id === targetSpaceId);
      if (foundItem) {
        return {
          folderName: folder.name,
          subFolderNames: [...path, sub.name],
          spaceName: foundItem.name,
        };
      }
      if (sub.subFolders) {
        for (const child of sub.subFolders) {
          const res = searchInSub(child, [...path, sub.name]);
          if (res) return res;
        }
      }
      return null;
    }

    if (folder.subFolders) {
      for (const sf of folder.subFolders) {
        const found = searchInSub(sf, []);
        if (found) return found;
      }
    }
  }
  return null;
}

// ----------------- CRM PIPELINE HELPERS -----------------

export function flattenPipelineSubFolders(
  subFolders: CrmPipelineSubFolder[] | undefined,
  depth: number = 0,
  prefix: string = ''
): { subFolder: CrmPipelineSubFolder; depth: number; pathName: string }[] {
  if (!subFolders || subFolders.length === 0) return [];
  const result: { subFolder: CrmPipelineSubFolder; depth: number; pathName: string }[] = [];
  for (const sf of subFolders) {
    const currentPath = prefix ? `${prefix} / ${sf.name}` : sf.name;
    result.push({ subFolder: sf, depth, pathName: currentPath });
    if (sf.subFolders && sf.subFolders.length > 0) {
      result.push(...flattenPipelineSubFolders(sf.subFolders, depth + 1, currentPath));
    }
  }
  return result;
}

export function getFlattenedPipelineTree(pipelines: CrmPipeline[]): {
  id: string;
  name: string;
  depth: number;
  isPipeline: boolean;
  pipelineId: string;
}[] {
  const options: {
    id: string;
    name: string;
    depth: number;
    isPipeline: boolean;
    pipelineId: string;
  }[] = [];
  for (const p of pipelines) {
    options.push({
      id: p.id,
      name: p.name,
      depth: 0,
      isPipeline: true,
      pipelineId: p.id,
    });
    const flatSubs = flattenPipelineSubFolders(p.subFolders, 1, '');
    for (const s of flatSubs) {
      options.push({
        id: s.subFolder.id,
        name: s.subFolder.name,
        depth: s.depth,
        isPipeline: false,
        pipelineId: p.id,
      });
    }
  }
  return options;
}

export function addPipelineSubFolderRecursively(
  subFolders: CrmPipelineSubFolder[] | undefined,
  targetParentId: string,
  newSubFolder: CrmPipelineSubFolder
): { updated: CrmPipelineSubFolder[]; added: boolean } {
  if (!subFolders) return { updated: [], added: false };
  let added = false;
  const updated = subFolders.map((sf) => {
    if (sf.id === targetParentId) {
      added = true;
      return {
        ...sf,
        subFolders: [...(sf.subFolders || []), newSubFolder],
      };
    }
    if (sf.subFolders && sf.subFolders.length > 0) {
      const childRes = addPipelineSubFolderRecursively(sf.subFolders, targetParentId, newSubFolder);
      if (childRes.added) {
        added = true;
        return {
          ...sf,
          subFolders: childRes.updated,
        };
      }
    }
    return sf;
  });
  return { updated, added };
}

export function updatePipelineSubFolderRecursively(
  subFolders: CrmPipelineSubFolder[] | undefined,
  updatedSubFolder: CrmPipelineSubFolder
): CrmPipelineSubFolder[] {
  if (!subFolders) return [];
  return subFolders.map((sf) => {
    if (sf.id === updatedSubFolder.id) {
      return {
        ...sf,
        ...updatedSubFolder,
        subFolders: updatedSubFolder.subFolders ?? sf.subFolders,
      };
    }
    if (sf.subFolders && sf.subFolders.length > 0) {
      return {
        ...sf,
        subFolders: updatePipelineSubFolderRecursively(sf.subFolders, updatedSubFolder),
      };
    }
    return sf;
  });
}

export function deletePipelineSubFolderRecursively(
  subFolders: CrmPipelineSubFolder[] | undefined,
  subFolderId: string
): { updated: CrmPipelineSubFolder[]; deleted?: CrmPipelineSubFolder } {
  if (!subFolders) return { updated: [] };
  let deleted: CrmPipelineSubFolder | undefined;
  const filtered: CrmPipelineSubFolder[] = [];

  for (const sf of subFolders) {
    if (sf.id === subFolderId) {
      deleted = sf;
      continue;
    }
    if (sf.subFolders && sf.subFolders.length > 0) {
      const childRes = deletePipelineSubFolderRecursively(sf.subFolders, subFolderId);
      if (childRes.deleted) {
        deleted = childRes.deleted;
        filtered.push({
          ...sf,
          subFolders: childRes.updated,
        });
        continue;
      }
    }
    filtered.push(sf);
  }
  return { updated: filtered, deleted };
}

export function findPipelineSubFolder(
  subFolders: CrmPipelineSubFolder[] | undefined,
  id: string | null
): CrmPipelineSubFolder | undefined {
  if (!subFolders || !id) return undefined;
  for (const sf of subFolders) {
    if (sf.id === id) return sf;
    if (sf.subFolders) {
      const found = findPipelineSubFolder(sf.subFolders, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function findPipelineSubFolderPath(
  subFolders: CrmPipelineSubFolder[] | undefined,
  targetId: string,
  path: string[] = []
): string[] | null {
  if (!subFolders) return null;
  for (const sf of subFolders) {
    if (sf.id === targetId) {
      return [...path, sf.name];
    }
    if (sf.subFolders) {
      const found = findPipelineSubFolderPath(sf.subFolders, targetId, [...path, sf.name]);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Finds the parent SpaceFolder that contains a specific listId (either directly or in a subfolder).
 */
export function findFolderByListId(folders: SpaceFolder[], listId: string): SpaceFolder | undefined {
  if (!folders || !listId) return undefined;
  for (const folder of folders) {
    if (folder.items?.some((item) => item.id === listId)) {
      return folder;
    }
    const allItems = getAllItemsFromFolder(folder);
    if (allItems.some((item) => item.id === listId)) {
      return folder;
    }
  }
  return undefined;
}

/**
 * Finds a specific FolderChildItem (list) by its id across all folders.
 */
export function findListItemById(folders: SpaceFolder[], listId: string): FolderChildItem | undefined {
  if (!folders || !listId) return undefined;
  for (const folder of folders) {
    const allItems = getAllItemsFromFolder(folder);
    const found = allItems.find((item) => item.id === listId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Unambiguously checks if a task belongs to a list identified by listId and/or listName.
 * Handles targetCycle matching listId, listName, normalized strings, or slugs.
 */
export function isTaskInList(
  task: { list_id?: string; targetCycle?: string },
  listId: string,
  listName?: string
): boolean {
  if (!task) return false;
  const lId = task.list_id || task.targetCycle;
  if (!lId) return false;
  const trimmed = lId.trim();
  if (!trimmed) return false;

  if (listId && trimmed === listId) return true;
  if (listName && trimmed === listName) return true;
  if (listId && trimmed.toLowerCase() === listId.toLowerCase()) return true;
  if (listName && trimmed.toLowerCase() === listName.toLowerCase()) return true;

  return false;
}

/**
 * Finds a folder or subfolder by id.
 */
export function findFolderById(folders: SpaceFolder[], folderId: string): SpaceFolder | undefined {
  if (!folders || !folderId) return undefined;
  return folders.find((f) => f.id === folderId);
}

/**
 * Recursively updates a list item by its id across all nested subfolders.
 */
export function updateListItemInSubFoldersRecursively(
  subFolders: SpaceSubFolder[] | undefined,
  listId: string,
  updates: Partial<FolderChildItem>
): { updated: SpaceSubFolder[]; found: boolean } {
  if (!subFolders || subFolders.length === 0) return { updated: [], found: false };
  let found = false;
  const updated = subFolders.map((sf) => {
    let sfChanged = false;
    const updatedItems = sf.items?.map((item) => {
      if (item.id === listId) {
        found = true;
        sfChanged = true;
        return {
          ...item,
          name: updates.name || item.name,
          icon: updates.icon || (item as any).icon,
          color: updates.color || (item as any).color,
        };
      }
      return item;
    });

    let childUpdated = sf.subFolders;
    if (sf.subFolders && sf.subFolders.length > 0) {
      const childRes = updateListItemInSubFoldersRecursively(sf.subFolders, listId, updates);
      if (childRes.found) {
        found = true;
        sfChanged = true;
        childUpdated = childRes.updated;
      }
    }

    if (sfChanged) {
      return {
        ...sf,
        items: updatedItems,
        subFolders: childUpdated,
      };
    }
    return sf;
  });
  return { updated, found };
}
