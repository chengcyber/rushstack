// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import * as os from 'os';
import { RushConfiguration } from '../api/RushConfiguration';
import { NodeJsCompatibility } from '../logic/NodeJsCompatibility';
import {
  AlreadyReportedError,
  Colors,
  ConsoleTerminalProvider,
  EnvironmentMap,
  Executable,
  FileConstants,
  FileSystem,
  Import,
  ITerminal,
  ITerminalProvider,
  JsonFile,
  JsonObject,
  Terminal
} from '@rushstack/node-core-library';
import { PrintUtilities } from '@rushstack/terminal';
import { RushConstants } from '../logic/RushConstants';
import { RushGlobalFolder } from '../api/RushGlobalFolder';
import { PurgeManager } from '../logic/PurgeManager';

import type { IBuiltInPluginConfiguration } from '../pluginFramework/PluginLoader/BuiltInPluginLoader';
import type { SpawnSyncReturns } from 'child_process';
import type { BaseInstallManager, IInstallManagerOptions } from '../logic/base/BaseInstallManager';

const lodash: typeof import('lodash') = Import.lazy('lodash', require);
const semver: typeof import('semver') = Import.lazy('semver', require);
const installManagerFactoryModule: typeof import('../logic/InstallManagerFactory') = Import.lazy(
  '../logic/InstallManagerFactory',
  require
);

const RUSH_SKIP_CHECKS_PARAMETER: string = '--rush-skip-checks';

/**
 * Options for RushPnpmCommandLineParser
 */
export interface IRushPnpmCommandLineParserOptions {
  alreadyReportedNodeTooNewError?: boolean;
  builtInPluginConfigurations?: IBuiltInPluginConfiguration[];
  terminalProvider?: ITerminalProvider;
}

export class RushPnpmCommandLineParser {
  private _terminal: ITerminal;
  private _rushConfiguration!: RushConfiguration;
  private _pnpmArgs!: string[];
  private _commandName: string | undefined;
  private _debugEnabled: boolean;
  private _verboseEnabled: boolean;

  public constructor(options: IRushPnpmCommandLineParserOptions) {
    const { terminalProvider } = options;
    this._debugEnabled = process.argv.indexOf('--debug') >= 0;
    this._verboseEnabled = process.argv.indexOf('--verbose') >= 0;
    const localTerminalProvider: ITerminalProvider =
      terminalProvider ??
      new ConsoleTerminalProvider({
        debugEnabled: this._debugEnabled,
        verboseEnabled: this._verboseEnabled
      });
    this._terminal = new Terminal(localTerminalProvider);

    try {
      // Are we in a Rush repo?
      let rushConfiguration: RushConfiguration | undefined = undefined;
      if (RushConfiguration.tryFindRushJsonLocation()) {
        // showVerbose is false because the logging message may break JSON output
        rushConfiguration = RushConfiguration.loadFromDefaultLocation({ showVerbose: false });
      }

      NodeJsCompatibility.warnAboutCompatibilityIssues({
        isRushLib: true,
        alreadyReportedNodeTooNewError: !!options.alreadyReportedNodeTooNewError,
        rushConfiguration
      });

      if (!rushConfiguration) {
        throw new Error(
          'The "rush-pnpm" command must be executed in a folder that is under a Rush workspace folder'
        );
      }
      this._rushConfiguration = rushConfiguration;

      if (rushConfiguration.packageManager !== 'pnpm') {
        throw new Error(
          'The "rush-pnpm" command requires your rush.json to be configured to use the PNPM package manager'
        );
      }

      if (!rushConfiguration.pnpmOptions.useWorkspaces) {
        const pnpmConfigFilename: string = rushConfiguration.pnpmOptions.jsonFilename || 'rush.json';
        throw new Error(
          `The "rush-pnpm" command requires the "useWorkspaces" setting to be enabled in ${pnpmConfigFilename}`
        );
      }

      const workspaceFolder: string = rushConfiguration.commonTempFolder;
      const workspaceFilePath: string = path.join(workspaceFolder, 'pnpm-workspace.yaml');

      if (!FileSystem.exists(workspaceFilePath)) {
        this._terminal.writeErrorLine('Error: The PNPM workspace file has not been generated:');
        this._terminal.writeErrorLine(`  ${workspaceFilePath}\n`);
        this._terminal.writeLine(Colors.cyan(`Do you need to run "rush install" or "rush update"?`));
        throw new AlreadyReportedError();
      }

      if (!FileSystem.exists(rushConfiguration.packageManagerToolFilename)) {
        this._terminal.writeErrorLine('Error: The PNPM local binary has not been installed yet.');
        this._terminal.writeLine('\n' + Colors.cyan(`Do you need to run "rush install" or "rush update"?`));
        throw new AlreadyReportedError();
      }

      // 0 = node.exe
      // 1 = rush-pnpm
      const pnpmArgs: string[] = process.argv.slice(2);

      this._validatePnpmUsage(pnpmArgs);

      this._pnpmArgs = pnpmArgs;
    } catch (error) {
      this._reportErrorAndSetExitCode(error as Error);
    }
  }

  public async executeAsync(): Promise<void> {
    // Node.js can sometimes accidentally terminate with a zero exit code  (e.g. for an uncaught
    // promise exception), so we start with the assumption that the exit code is 1
    // and set it to 0 only on success.
    process.exitCode = 1;
    this._execute();

    if (process.exitCode === 0) {
      await this._postExecuteAsync();
    }
  }

  private _validatePnpmUsage(pnpmArgs: string[]): void {
    if (pnpmArgs[0] === RUSH_SKIP_CHECKS_PARAMETER) {
      pnpmArgs.shift();
      // Ignore other checks
      return;
    }

    if (pnpmArgs.length === 0) {
      return;
    }
    const firstArg: string = pnpmArgs[0];

    // Detect common safe invocations
    if (pnpmArgs.includes('-h') || pnpmArgs.includes('--help') || pnpmArgs.includes('-?')) {
      return;
    }

    if (pnpmArgs.length === 1) {
      if (firstArg === '-v' || firstArg === '--version') {
        return;
      }
    }

    const BYPASS_NOTICE: string = `To bypass this check, add "${RUSH_SKIP_CHECKS_PARAMETER}" as the very first command line option.`;

    if (!/^[a-z]+([a-z0-9\-])*$/.test(firstArg)) {
      // We can't parse this CLI syntax
      this._terminal.writeErrorLine(
        `Warning: The "rush-pnpm" wrapper expects a command verb before "${firstArg}"\n`
      );
      this._terminal.writeLine(Colors.cyan(BYPASS_NOTICE));
      throw new AlreadyReportedError();
    } else {
      const commandName: string = firstArg;

      // Also accept SKIP_RUSH_CHECKS_PARAMETER immediately after the command verb
      if (pnpmArgs[1] === RUSH_SKIP_CHECKS_PARAMETER) {
        pnpmArgs.splice(1, 1);
        return;
      }

      if (pnpmArgs.indexOf(RUSH_SKIP_CHECKS_PARAMETER) >= 0) {
        // We do not attempt to parse PNPM's complete CLI syntax, so we cannot be sure how to interpret
        // strings that appear outside of the specific patterns that this parser recognizes
        this._terminal.writeErrorLine(
          PrintUtilities.wrapWords(
            `Error: The "${RUSH_SKIP_CHECKS_PARAMETER}" option must be the first parameter for the "rush-pnpm" command.`
          )
        );
        throw new AlreadyReportedError();
      }

      this._commandName = commandName;

      // Warn about commands known not to work
      /* eslint-disable no-fallthrough */
      switch (commandName) {
        // Blocked
        case 'import': {
          this._terminal.writeErrorLine(
            PrintUtilities.wrapWords(
              `Error: The "pnpm ${commandName}" command is known to be incompatible with Rush's environment.`
            ) + '\n'
          );
          this._terminal.writeLine(Colors.cyan(BYPASS_NOTICE));
          throw new AlreadyReportedError();
        }

        // Show warning for install commands
        case 'add':
        case 'install':
        /* synonym */
        case 'i':
        case 'install-test':
        /* synonym */
        case 'it': {
          this._terminal.writeErrorLine(
            PrintUtilities.wrapWords(
              `Error: The "pnpm ${commandName}" command is incompatible with Rush's environment.` +
                ` Use the "rush install" or "rush update" commands instead.`
            ) + '\n'
          );
          this._terminal.writeLine(Colors.cyan(BYPASS_NOTICE));
          throw new AlreadyReportedError();
        }

        // Show warning
        case 'link':
        /* synonym */
        case 'ln':
        case 'remove':
        /* synonym */
        case 'rm':
        case 'unlink':
        case 'update':
        /* synonym */
        case 'up': {
          this._terminal.writeWarningLine(
            PrintUtilities.wrapWords(
              `Warning: The "pnpm ${commandName}" command makes changes that may invalidate Rush's workspace state.`
            ) + '\n'
          );
          this._terminal.writeWarningLine(
            `==> Consider running "rush install" or "rush update" afterwards.\n`
          );
          break;
        }

        // Know safe after validation
        case 'patch': {
          /**
           * If you were to accidentally attempt to use rush-pnpm patch with a pnpmVersion < 7.4.0, pnpm patch may fallback to the system patch command.
           * For instance, /usr/bin/patch which may just hangs forever
           * So, erroring out the command if the pnpm version is < 7.4.0
           */
          if (semver.lt(this._rushConfiguration.packageManagerToolVersion, '7.4.0')) {
            this._terminal.writeErrorLine(
              PrintUtilities.wrapWords(
                `Error: The "pnpm patch" command is added after pnpm@7.4.0.` +
                  ` Please update "pnpmVersion" >= 7.4.0 in rush.json file and run "rush update" to use this command.`
              ) + '\n'
            );
            throw new AlreadyReportedError();
          }
          break;
        }
        case 'patch-commit': {
          const pnpmOptionsJsonFilename: string = path.join(
            this._rushConfiguration.commonRushConfigFolder,
            RushConstants.pnpmConfigFilename
          );
          if (this._rushConfiguration.rushConfigurationJson.pnpmOptions) {
            this._terminal.writeErrorLine(
              PrintUtilities.wrapWords(
                `Error: The "pnpm patch-commit" command is incompatible with specifying "pnpmOptions" in rush.json file.` +
                  ` Please move the content of "pnpmOptions" in rush.json file to ${pnpmOptionsJsonFilename}`
              ) + '\n'
            );
            throw new AlreadyReportedError();
          }
          break;
        }

        // Known safe
        case 'audit':
        case 'exec':
        case 'list':
        /* synonym */
        case 'ls':
        case 'outdated':
        case 'pack':
        case 'prune':
        case 'publish':
        case 'rebuild':
        /* synonym */
        case 'rb':
        case 'root':
        case 'run':
        case 'start':
        case 'store':
        case 'test':
        /* synonym */
        case 't':
        case 'why': {
          break;
        }

        // Unknown
        default: {
          this._terminal.writeErrorLine(
            PrintUtilities.wrapWords(
              `Error: The "pnpm ${commandName}" command has not been tested with Rush's environment. It may be incompatible.`
            ) + '\n'
          );
          this._terminal.writeLine(Colors.cyan(BYPASS_NOTICE));
        }
      }
      /* eslint-enable no-fallthrough */
    }
  }

  private _execute(): void {
    const rushConfiguration: RushConfiguration = this._rushConfiguration;
    const workspaceFolder: string = rushConfiguration.commonTempFolder;
    const pnpmEnvironmentMap: EnvironmentMap = new EnvironmentMap(process.env);
    pnpmEnvironmentMap.set('NPM_CONFIG_WORKSPACE_DIR', workspaceFolder);

    if (rushConfiguration.pnpmOptions.pnpmStorePath) {
      pnpmEnvironmentMap.set('NPM_CONFIG_STORE_DIR', rushConfiguration.pnpmOptions.pnpmStorePath);
    }
    if (rushConfiguration.pnpmOptions.pnpmCachePath) {
      pnpmEnvironmentMap.set('NPM_CONFIG_CACHE_DIR', rushConfiguration.pnpmOptions.pnpmCachePath);
    }

    if (rushConfiguration.pnpmOptions.environmentVariables) {
      for (const [envKey, { value: envValue, override }] of Object.entries(
        rushConfiguration.pnpmOptions.environmentVariables
      )) {
        if (override) {
          pnpmEnvironmentMap.set(envKey, envValue);
        } else {
          if (undefined === pnpmEnvironmentMap.get(envKey)) {
            pnpmEnvironmentMap.set(envKey, envValue);
          }
        }
      }
    }

    const result: SpawnSyncReturns<string> = Executable.spawnSync(
      rushConfiguration.packageManagerToolFilename,
      this._pnpmArgs,
      {
        environmentMap: pnpmEnvironmentMap,
        stdio: 'inherit'
      }
    );
    if (result.error) {
      throw new Error('Failed to invoke PNPM: ' + result.error);
    }
    if (result.status === null) {
      throw new Error('Failed to invoke PNPM: Spawn completed without an exit code');
    }
    process.exitCode = result.status;
  }

  private async _postExecuteAsync(): Promise<void> {
    const commandName: string | undefined = this._commandName;
    if (!commandName) {
      return;
    }

    switch (commandName) {
      case 'patch-commit': {
        // Example: "C:\MyRepo\common\temp\package.json"
        const commonPackageJsonFilename: string = `${this._rushConfiguration.commonTempFolder}/${FileConstants.PackageJson}`;
        const commonPackageJson: JsonObject = JsonFile.load(commonPackageJsonFilename);
        const newGlobalPatchedDependencies: Record<string, string> | undefined =
          commonPackageJson?.pnpm?.patchedDependencies;
        const currentGlobalPatchedDependencies: Record<string, string> | undefined =
          this._rushConfiguration.pnpmOptions.globalPatchedDependencies;

        if (!lodash.isEqual(currentGlobalPatchedDependencies, newGlobalPatchedDependencies)) {
          const commonTempPnpmPatchesFolder: string = `${this._rushConfiguration.commonTempFolder}/${RushConstants.pnpmPatchesFolderName}`;
          const rushPnpmPatchesFolder: string = `${this._rushConfiguration.commonFolder}/pnpm-${RushConstants.pnpmPatchesFolderName}`;
          // Copy (or delete) common\temp\patches\ --> common\pnpm-patches\
          if (FileSystem.exists(commonTempPnpmPatchesFolder)) {
            FileSystem.ensureEmptyFolder(rushPnpmPatchesFolder);
            console.log(`Copying ${commonTempPnpmPatchesFolder}`);
            console.log(`  --> ${rushPnpmPatchesFolder}`);
            FileSystem.copyFiles({
              sourcePath: commonTempPnpmPatchesFolder,
              destinationPath: rushPnpmPatchesFolder
            });
          } else {
            if (FileSystem.exists(rushPnpmPatchesFolder)) {
              console.log(`Deleting ${rushPnpmPatchesFolder}`);
              FileSystem.deleteFolder(rushPnpmPatchesFolder);
            }
          }

          // Update patchedDependencies to pnpm configuration file
          this._rushConfiguration.pnpmOptions.updateGlobalPatchedDependencies(newGlobalPatchedDependencies);

          // Rerun installation to update
          await this._doRushUpdateAsync();

          this._terminal.writeWarningLine(
            `Rush refreshed the ${RushConstants.pnpmConfigFilename}, shrinkwrap file and patch files under the "common/pnpm/patches" folder.` +
              os.EOL +
              '  Please commit this change to Git.'
          );
        }
        break;
      }
    }
  }

  private async _doRushUpdateAsync(): Promise<void> {
    this._terminal.writeLine();
    this._terminal.writeLine(Colors.green('Running "rush update"'));
    this._terminal.writeLine();

    const rushGlobalFolder: RushGlobalFolder = new RushGlobalFolder();
    const purgeManager: PurgeManager = new PurgeManager(this._rushConfiguration, rushGlobalFolder);
    const installManagerOptions: IInstallManagerOptions = {
      debug: this._debugEnabled,
      allowShrinkwrapUpdates: true,
      bypassPolicy: false,
      noLink: false,
      fullUpgrade: false,
      recheckShrinkwrap: true,
      networkConcurrency: undefined,
      collectLogFile: false,
      variant: undefined,
      maxInstallAttempts: RushConstants.defaultMaxInstallAttempts,
      pnpmFilterArguments: [],
      checkOnly: false
    };

    const installManager: BaseInstallManager =
      installManagerFactoryModule.InstallManagerFactory.getInstallManager(
        this._rushConfiguration,
        rushGlobalFolder,
        purgeManager,
        installManagerOptions
      );
    try {
      await installManager.doInstallAsync();
    } finally {
      purgeManager.deleteAll();
    }
  }

  private _reportErrorAndSetExitCode(error: Error): void {
    if (!(error instanceof AlreadyReportedError)) {
      const prefix: string = 'ERROR: ';
      this._terminal.writeErrorLine('\n' + PrintUtilities.wrapWords(prefix + error.message));
    }

    if (this._debugEnabled) {
      // If catchSyncErrors() called this, then show a call stack similar to what Node.js
      // would show for an uncaught error
      this._terminal.writeErrorLine('\n' + error.stack);
    }

    if (process.exitCode !== undefined) {
      process.exit(process.exitCode);
    } else {
      process.exit(1);
    }
  }
}
