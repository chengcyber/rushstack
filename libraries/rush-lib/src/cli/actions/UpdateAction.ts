// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { CommandLineFlagParameter } from '@rushstack/ts-command-line';

import { BaseInstallAction } from './BaseInstallAction';
import { IInstallManagerOptions } from '../../logic/base/BaseInstallManager';
import { RushCommandLineParser } from '../RushCommandLineParser';
import { SelectionParameterSet } from '../SelectionParameterSet';
import { AlreadyReportedError, ConsoleTerminalProvider, Terminal } from '@rushstack/node-core-library';
import { PrintUtilities } from '@rushstack/terminal';

export class UpdateAction extends BaseInstallAction {
  private _fullParameter!: CommandLineFlagParameter;
  private _recheckParameter!: CommandLineFlagParameter;

  public constructor(parser: RushCommandLineParser) {
    super({
      actionName: 'update',
      summary:
        'Install package dependencies for all projects in the repo,' +
        ' and create or update the shrinkwrap file as needed',
      documentation:
        'The "rush update" command installs the dependencies described in your' +
        ' package.json files, and updates the shrinkwrap file as needed.' +
        ' (This "shrinkwrap" file stores a central inventory of all dependencies and versions' +
        ' for projects in your repo. It is found in the "common/config/rush" folder.)' +
        ' Note that Rush always performs a single install for all projects in your repo.' +
        ' You should run "rush update" whenever you start working in a Rush repo,' +
        ' after you pull from Git, and after you modify a package.json file.' +
        ' If there is nothing to do, "rush update" is instantaneous.' +
        ' NOTE: In certain cases "rush install" should be used instead of "rush update"' +
        ' -- for details, see the command help for "rush install".',
      parser
    });
  }

  protected onDefineParameters(): void {
    super.onDefineParameters();

    if (this.rushConfiguration.hasSplitWorkspaceProject) {
      // Partial update is supported only when there are split workspace project
      this._selectionParameters = new SelectionParameterSet(this.rushConfiguration, this, {
        // Include lockfile processing since this expands the selection, and we need to select
        // at least the same projects selected with the same query to "rush build"
        includeExternalDependencies: true,
        // Disable filtering because rush-project.json is riggable and therefore may not be available
        enableFiltering: false
      });
    }

    this._fullParameter = this.defineFlagParameter({
      parameterLongName: '--full',
      description:
        'Normally "rush update" tries to preserve your existing installed versions' +
        ' and only makes the minimum updates needed to satisfy the package.json files.' +
        ' This conservative approach prevents your PR from getting involved with package updates that' +
        ' are unrelated to your work. Use "--full" when you really want to update all dependencies' +
        ' to the latest SemVer-compatible version.  This should be done periodically by a person' +
        ' or robot whose role is to deal with potential upgrade regressions.'
    });
    this._recheckParameter = this.defineFlagParameter({
      parameterLongName: '--recheck',
      description:
        'If the shrinkwrap file appears to already satisfy the package.json files,' +
        ' then "rush update" will skip invoking the package manager at all.  In certain situations' +
        ' this heuristic may be inaccurate.  Use the "--recheck" flag to force the package manager' +
        " to process the shrinkwrap file.  This will also update your shrinkwrap file with Rush's fixups." +
        ' (To minimize shrinkwrap churn, these fixups are normally performed only in the temporary folder.)'
    });
  }

  protected async runAsync(): Promise<void> {
    await this.parser.pluginManager.updateAsync();

    if (this.parser.pluginManager.error) {
      await this.parser.pluginManager.reinitializeAllPluginsForCommandAsync(this.actionName);
    }

    return super.runAsync();
  }

  protected async buildInstallOptionsAsync(): Promise<IInstallManagerOptions> {
    const terminal: Terminal = new Terminal(new ConsoleTerminalProvider());

    /**
     * Partial update should only affects on split workspace project, and
     * not affects on normal rush workspace projects.
     */
    const pnpmFilterArguments: string[] = [];
    let splitWorkspacePnpmFilterArguments: string[] = [];

    if (this._selectionParameters?.isSelectionSpecified) {
      const selected = await this._selectionParameters.getSelectedProjectsAsync(terminal);
      let hasSelectedSplitWorkspaceProject: boolean = false;
      for (const rushProject of selected.values()) {
        if (rushProject.splitWorkspace) {
          hasSelectedSplitWorkspaceProject = true;
          break;
        }
      }
      // Throw error when there is no split workspace project selected
      if (!hasSelectedSplitWorkspaceProject) {
        terminal.writeLine();
        terminal.writeErrorLine(
          PrintUtilities.wrapWords(
            `Project filtering arguments cannot be used when running "rush update" without selecting split workspace projects. Run the command again with specifying a split workspace project.`
          )
        );
        throw new AlreadyReportedError();
      }

      splitWorkspacePnpmFilterArguments = (
        await this._selectionParameters.getPnpmFilterArgumentsAsync(terminal)
      ).splitWorkspacePnpmFilterArguments;
    }

    return {
      debug: this.parser.isDebug,
      allowShrinkwrapUpdates: true,
      bypassPolicy: this._bypassPolicyParameter.value!,
      noLink: this._noLinkParameter.value!,
      fullUpgrade: this._fullParameter.value!,
      recheckShrinkwrap: this._recheckParameter.value!,
      networkConcurrency: this._networkConcurrencyParameter.value,
      collectLogFile: this._debugPackageManagerParameter.value!,
      variant: this._variant.value,
      // Because the 'defaultValue' option on the _maxInstallAttempts parameter is set,
      // it is safe to assume that the value is not null
      maxInstallAttempts: this._maxInstallAttempts.value!,
      pnpmFilterArguments,
      splitWorkspacePnpmFilterArguments,
      checkOnly: false
    };
  }
}
