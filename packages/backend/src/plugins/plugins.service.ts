import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities';
import { getAllModules, getModuleConfig, ModuleDefinition } from '@backnode/shared';

export interface PluginStatusResponse extends ModuleDefinition {
  enabled: boolean;
  activeLinksCount: number;
}

export interface PluginsListResult {
  plugins: PluginStatusResponse[];
  modules: PluginStatusResponse[];
  enabledPlugins: Record<string, boolean>;
}

export interface TogglePluginResult {
  success: boolean;
  enabledPlugins: Record<string, boolean>;
  plugin: PluginStatusResponse;
}

@Injectable()
export class PluginsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async getPlugins(accountId: string): Promise<PluginsListResult> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } });
    const enabledPluginsList = account?.enabledPlugins || ['tasks', 'crm', 'contacts', 'docs'];

    const allModules = getAllModules();

    const modulesWithStatus = allModules.map((mod) => {
      const isEnabled = enabledPluginsList.includes(mod.id);
      const activeLinksCount = mod.fieldLinks.filter((l) => enabledPluginsList.includes(l.targetModule)).length;

      return {
        ...mod,
        enabled: isEnabled,
        activeLinksCount,
      };
    });

    const enabledMap: Record<string, boolean> = {};
    for (const mod of allModules) {
      enabledMap[mod.id] = enabledPluginsList.includes(mod.id);
    }

    return {
      plugins: modulesWithStatus,
      modules: modulesWithStatus,
      enabledPlugins: enabledMap,
    };
  }

  async togglePlugin(
    accountId: string,
    pluginId: string,
    explicitState?: boolean,
  ): Promise<TogglePluginResult> {
    const mod = getModuleConfig(pluginId);
    if (!mod) {
      throw new NotFoundException(`Plugin ${pluginId} not found in modules catalog.`);
    }

    const account = await this.accountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found.`);
    }

    let enabledPlugins = account.enabledPlugins || ['tasks', 'crm', 'contacts', 'docs'];
    const currentlyEnabled = enabledPlugins.includes(pluginId);
    const shouldEnable = explicitState !== undefined ? explicitState : !currentlyEnabled;

    if (shouldEnable && !currentlyEnabled) {
      enabledPlugins = [...enabledPlugins, pluginId];
    } else if (!shouldEnable && currentlyEnabled) {
      enabledPlugins = enabledPlugins.filter((id) => id !== pluginId);
    }

    account.enabledPlugins = enabledPlugins;
    await this.accountRepo.save(account);

    const isEnabled = enabledPlugins.includes(pluginId);
    const activeLinksCount = mod.fieldLinks.filter((l) => enabledPlugins.includes(l.targetModule)).length;

    const allModules = getAllModules();
    const enabledMap: Record<string, boolean> = {};
    for (const m of allModules) {
      enabledMap[m.id] = enabledPlugins.includes(m.id);
    }

    return {
      success: true,
      enabledPlugins: enabledMap,
      plugin: {
        ...mod,
        enabled: isEnabled,
        activeLinksCount,
      },
    };
  }

  async getEnabledPluginIds(accountId: string): Promise<string[]> {
    const account = await this.accountRepo.findOne({ where: { id: accountId } });
    return account?.enabledPlugins || ['tasks', 'crm', 'contacts', 'docs'];
  }
}
