// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { ConsoleTerminalProvider, Colors, Terminal } from '@rushstack/node-core-library';
import { BaseRushAction } from './BaseRushAction';
import { RushCommandLineParser } from '../RushCommandLineParser';
import { UpgradeRushSelf } from '../../logic/UpgradeRushSelf';
import { RushConstants } from '../../logic/RushConstants';
import { BaseInstallManager, IInstallManagerOptions } from '../../logic/base/BaseInstallManager';
import { PurgeManager } from '../../logic/PurgeManager';
import { InstallManagerFactory } from '../../logic/InstallManagerFactory';

export class UpgradeSelfAction extends BaseRushAction {
  private _skipUpdateFlag!: CommandLineFlagParameter;
  private _versionParameter!: CommandLineStringParameter;
  private _terminal: Terminal;

  public constructor(parser: RushCommandLineParser) {
    super({
      actionName: 'upgrade-self',
      summary: 'Upgrade rush version in current repository',
      documentation:
        'The "rush upgrade-self" command is used to upgrade rush version in current repository. ' +
        'It helps maintainer to upgrade rushVersion in rush.json, settle down the versions of the' +
        ' dependency of rush self, and update lockfile in autoinstallers if changed.',
      parser
    });
    this._terminal = new Terminal(new ConsoleTerminalProvider());
  }

  protected onDefineParameters(): void {
    this._skipUpdateFlag = this.defineFlagParameter({
      parameterLongName: '--skip-update',
      parameterShortName: '-s',
      description:
        'If specified, the "rush update" command will not be run after updating the package.json files.'
    });
    this._versionParameter = this.defineStringParameter({
      parameterLongName: '--version',
      argumentName: 'VERSION',
      description:
        'Specify the version of the rush to be upgraded. It receives simple version(1.0.0), version range(^5), ' +
        'version tag(latest). If not specified, prompt the user to select a version'
    });
  }

  protected async runAsync(): Promise<void> {
    this._terminal = new Terminal(
      new ConsoleTerminalProvider({
        verboseEnabled: this.parser.isDebug
      })
    );
    const upgradeRushSelf: UpgradeRushSelf = new UpgradeRushSelf({
      rushConfiguration: this.rushConfiguration,
      terminal: this._terminal
    });

    const { needRushUpdate } = await upgradeRushSelf.upgradeAsync(this._versionParameter.value);

    if (needRushUpdate && !this._skipUpdateFlag.value) {
      const executeResult: boolean = await this._runRushUpdate();
      if (!executeResult) {
        this._terminal.writeErrorLine(`Run "rush update" failed...`);
      }
    }

    this._terminal.writeLine(Colors.green(`Rush version successfully updated`));
  }

  private async _runRushUpdate(): Promise<boolean> {
    const purgeManager: PurgeManager = new PurgeManager(this.rushConfiguration, this.rushGlobalFolder);
    const installManagerOptions: IInstallManagerOptions = {
      debug: this.parser.isDebug,
      allowShrinkwrapUpdates: true,
      bypassPolicy: false,
      noLink: false,
      fullUpgrade: false,
      recheckShrinkwrap: false,
      networkConcurrency: undefined,
      collectLogFile: false,
      variant: undefined,
      maxInstallAttempts: RushConstants.defaultMaxInstallAttempts,
      pnpmFilterArguments: []
    };
    const installManager: BaseInstallManager = InstallManagerFactory.getInstallManager(
      this.rushConfiguration,
      this.rushGlobalFolder,
      purgeManager,
      installManagerOptions
    );

    this._terminal.writeLine(Colors.green(`Running "rush update"...`));
    try {
      await installManager.doInstallAsync();
      return true;
    } catch (e) {
      return false;
    } finally {
      purgeManager.deleteAll();
    }
  }
}
