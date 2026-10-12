export * from './types';
export * from './mockData';
export * from './plugins/linkageEngine';

import permissionsData from './permissions.json';
import { ExplicitPermissionCategory, ExplicitPermissionDefinition, WorkspaceRole, SYSTEM_ROLE_EXPLICIT_PERMISSIONS } from './types';

export const PERMISSIONS_DICTIONARY: Record<string, ExplicitPermissionDefinition> = Object.fromEntries(
  Object.entries(permissionsData).map(([key, val]: [string, any]) => [
    key,
    {
      id: key,
      key,
      name: val.label || val.name || key,
      label: val.label || val.name || key,
      description: val.description || '',
      module: val.module || 'core',
      category: val.category || 'General',
    },
  ])
);

export function buildPermissionsCatalog(data: Record<string, any>): ExplicitPermissionCategory[] {
  const categoryMap = new Map<string, ExplicitPermissionCategory>();

  for (const [key, val] of Object.entries(data)) {
    const catName = val.category || 'General';
    const mod = val.module || 'core';
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, {
        category: catName,
        module: mod,
        permissions: [],
      });
    }
    categoryMap.get(catName)!.permissions.push({
      id: key,
      key,
      name: val.label || val.name || key,
      label: val.label || val.name || key,
      description: val.description || '',
      module: mod,
      category: catName,
    });
  }

  return Array.from(categoryMap.values());
}

const catalogArray = buildPermissionsCatalog(permissionsData);

// Support both array operations (.map, .filter, .length) and key-based dictionary lookups
export const PERMISSIONS_CATALOG: ExplicitPermissionCategory[] & Record<string, any> = Object.assign(
  catalogArray,
  permissionsData
);

export function getPermissionsCatalog(): ExplicitPermissionCategory[] {
  return catalogArray;
}

export function getPermissionsDictionary(): Record<string, ExplicitPermissionDefinition> {
  return PERMISSIONS_DICTIONARY;
}

export function matchPermissionsQuery(
  grantedPermissions: string[],
  query: string,
  catalogMap: Record<string, ExplicitPermissionDefinition> = PERMISSIONS_DICTIONARY
): { matches: boolean; matchedKeys: string[]; matchedLabels: string[] } {
  const q = query.toLowerCase().trim();
  if (!q) {
    return { matches: true, matchedKeys: [], matchedLabels: [] };
  }

  const isWildcard = Array.isArray(grantedPermissions) && grantedPermissions.includes('*');

  // If wildcard: check if query matches ANY permission in the catalog or wildcard indicators
  if (isWildcard) {
    if (q === '*' || q.includes('wildcard') || q.includes('all')) {
      return { matches: true, matchedKeys: ['*'], matchedLabels: ['Universal Wildcard (*)'] };
    }
    const matchedKeys: string[] = [];
    const matchedLabels: string[] = [];
    for (const [key, def] of Object.entries(catalogMap)) {
      if (
        key.toLowerCase().includes(q) ||
        (def.name && def.name.toLowerCase().includes(q)) ||
        (def.description && def.description.toLowerCase().includes(q)) ||
        (def.module && def.module.toLowerCase().includes(q))
      ) {
        matchedKeys.push(key);
        matchedLabels.push(def.name || key);
        if (matchedKeys.length >= 3) break;
      }
    }
    if (matchedKeys.length > 0) {
      return { matches: true, matchedKeys, matchedLabels };
    }
    return { matches: false, matchedKeys: [], matchedLabels: [] };
  }

  if (!Array.isArray(grantedPermissions)) {
    return { matches: false, matchedKeys: [], matchedLabels: [] };
  }

  const matchedKeys: string[] = [];
  const matchedLabels: string[] = [];

  for (const permKey of grantedPermissions) {
    const normalizedKey = permKey.toLowerCase();
    const def = catalogMap[permKey];
    const defName = def?.name?.toLowerCase() || '';
    const defDesc = def?.description?.toLowerCase() || '';
    const defMod = def?.module?.toLowerCase() || '';

    if (
      normalizedKey.includes(q) ||
      defName.includes(q) ||
      defDesc.includes(q) ||
      defMod.includes(q)
    ) {
      matchedKeys.push(permKey);
      matchedLabels.push(def?.name || permKey);
    }
  }

  return {
    matches: matchedKeys.length > 0,
    matchedKeys,
    matchedLabels,
  };
}

export function getUserExplicitPermissions(
  member: { role?: string; roleId?: string; accessLevel?: string },
  roles: WorkspaceRole[] = []
): string[] {
  if (
    member.accessLevel === 'OWNER' ||
    member.role?.toLowerCase() === 'workspace owner' ||
    member.role?.toLowerCase() === 'owner'
  ) {
    return ['*'];
  }

  const assignedRole = roles.find(
    (r) =>
      r.id === member.roleId ||
      r.name.toLowerCase() === (member.role || '').toLowerCase() ||
      (r.key && r.key.toLowerCase() === (member.accessLevel || '').toLowerCase())
  );

  if (assignedRole) {
    if (Array.isArray(assignedRole.permissions)) {
      return assignedRole.permissions;
    }
    if (assignedRole.key && SYSTEM_ROLE_EXPLICIT_PERMISSIONS[assignedRole.key]) {
      return SYSTEM_ROLE_EXPLICIT_PERMISSIONS[assignedRole.key];
    }
  }

  const lvlKey = (member.accessLevel || 'member').toLowerCase();
  return SYSTEM_ROLE_EXPLICIT_PERMISSIONS[lvlKey] || SYSTEM_ROLE_EXPLICIT_PERMISSIONS.member || [];
}
