// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import NpmConfig from '@npmcli/config';
import { RushConfiguration } from '../api/RushConfiguration';

export class NpmrcManager {
  private _rushConfiguration: RushConfiguration;
  private _npmConfig: NpmConfig;
  private _loadPromise: Promise<void> | null;

  public constructor(rushConfiguration: RushConfiguration) {
    this._rushConfiguration = rushConfiguration;
    this._loadPromise = null;

    const npmConfig: NpmConfig = new NpmConfig({
      npmPath: '',
      definitions: {},

      env: {},
      defaults: {},
      /**
       * mimic --prefix as cli config
       * should use commonRushConfigFolder instead of commonTemp, because npm has not beed setup yet.
       */
      argv: ['', '', `--prefix=${this._rushConfiguration.commonRushConfigFolder}`]
    });
    this._npmConfig = npmConfig;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async get<T = any>(key: string): Promise<T> {
    await this._load();
    return this._npmConfig.get(key, 'project');
  }

  private async _load(): Promise<void> {
    if (!this._loadPromise) {
      this._loadPromise = this._npmConfig.load();
    }
    return this._loadPromise;
  }
}
