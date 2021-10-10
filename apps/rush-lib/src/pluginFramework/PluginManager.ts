// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { InternalError, JsonObject, Terminal } from '@rushstack/node-core-library';
import { uniqBy } from 'lodash';

import { RushConfiguration } from '../api/RushConfiguration';
import { IRushPluginConfiguration } from '../api/RushPluginsConfiguration';
import { Autoinstaller } from '../logic/Autoinstaller';
import { IRushPlugin } from './IRushPlugin';
import { PluginLoader } from './PluginLoader';
import { RushSession } from './RushSession';

export interface IPluginManagerOptions {
  terminal: Terminal;
  rushConfiguration: RushConfiguration;
  rushSession: RushSession;
}

export interface IPluginConfig {
  /**
   * plugin specifier, e.g. @company/plugin-name
   */
  plugin: string;
  /**
   * Semver of the plugin. target version will be installed
   */
  pluginVersion: string;
  options?: JsonObject;
}

export class PluginManager {
  private _terminal: Terminal;
  private _rushConfiguration: RushConfiguration;
  private _rushSession: RushSession;
  private _pluginLoaders: PluginLoader[];

  public constructor(options: IPluginManagerOptions) {
    this._terminal = options.terminal;
    this._rushConfiguration = options.rushConfiguration;
    this._rushSession = options.rushSession;

    this._pluginLoaders = this._rushConfiguration.rushPluginsConfiguration.configuration.plugins.map(
      (pluginConfiguration) => {
        return new PluginLoader({
          pluginConfiguration,
          rushConfiguration: this._rushConfiguration,
          terminal: this._terminal,
        });
      }
    );
  }

  public async initializePluginsAsync(): Promise<void> {

    const uniqAutoinstallers: Autoinstaller[] = uniqBy(this._pluginLoaders.map(pluginLoader => pluginLoader.autoinstaller), autoinstaller => autoinstaller.name);

    for (const autoInstaller of uniqAutoinstallers) {
      await autoInstaller.prepareAsync();
    }

    for (const pluginLoader of this._pluginLoaders) {
      const plugin: IRushPlugin = pluginLoader.load();
      this._applyPlugin(plugin, pluginLoader.configuration);
    }

  }

  private _applyPlugin(plugin: IRushPlugin, rushPluginConfiguration: IRushPluginConfiguration): void {
    try {
      plugin.apply(this._rushSession, this._rushConfiguration);
    } catch (e) {
      throw new InternalError(`Error applying "${rushPluginConfiguration.pluginName}": ${e}`);
    }
  }

}
