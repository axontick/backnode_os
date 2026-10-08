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
