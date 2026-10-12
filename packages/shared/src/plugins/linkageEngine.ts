import modulesConfigData from './modules.config.json';

export interface FieldLinkDefinition {
  fieldId: string;
  id?: string;
  label: string;
  targetModule: string;
  targetEntity: string;
  displayField: string;
  placeholder?: string;
  icon?: string;
  description?: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  sidebarIcon?: string;
  description: string;
  category?: string;
  isCore?: boolean;
  features: string[];
  fieldLinks: FieldLinkDefinition[];
}

export type PluginModuleDefinition = ModuleDefinition;

export interface ModulesConfig {
  modules: Record<string, ModuleDefinition>;
}

export const MODULES_CONFIG: ModulesConfig = modulesConfigData as ModulesConfig;

export const MODULES_REGISTRY: ModuleDefinition[] = Object.values(MODULES_CONFIG.modules).map(m => ({
  ...m,
  sidebarIcon: m.icon,
  fieldLinks: (m.fieldLinks || []).map(fl => ({
    ...fl,
    id: fl.fieldId || (fl as any).id
  }))
}));

export function getAllModules(): ModuleDefinition[] {
  return MODULES_REGISTRY;
}

export function getModuleConfig(moduleId: string): ModuleDefinition | undefined {
  return MODULES_REGISTRY.find(m => m.id === moduleId);
}

export function getModuleFieldLinks(moduleId: string): FieldLinkDefinition[] {
  const mod = getModuleConfig(moduleId);
  return mod?.fieldLinks || [];
}

export const getFieldLinksForModule = getModuleFieldLinks;

export function isFieldLinkActive(
  link: FieldLinkDefinition,
  enabledPlugins: string[] | Record<string, boolean>
): boolean {
  if (!link || !link.targetModule) return false;
  if (Array.isArray(enabledPlugins)) {
    return enabledPlugins.includes(link.targetModule);
  }
  if (typeof enabledPlugins === 'object' && enabledPlugins !== null) {
    return enabledPlugins[link.targetModule] !== false;
  }
  return true;
}

export const isLinkActive = isFieldLinkActive;
