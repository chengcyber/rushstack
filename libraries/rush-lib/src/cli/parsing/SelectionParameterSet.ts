// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  AlreadyReportedError,
  PackageJsonLookup,
  IPackageJson,
  ITerminal
} from '@rushstack/node-core-library';
import { CommandLineParameterProvider, CommandLineStringListParameter } from '@rushstack/ts-command-line';

import { RushConfiguration } from '../../api/RushConfiguration';
import { RushConfigurationProject } from '../../api/RushConfigurationProject';
import { Selection } from '../../logic/Selection';
import type { ISelectorParser as ISelectorParser } from '../../logic/selectors/ISelectorParser';
import {
  GitChangedProjectSelectorParser,
  IGitSelectorParserOptions
} from '../../logic/selectors/GitChangedProjectSelectorParser';
import { NamedProjectSelectorParser } from '../../logic/selectors/NamedProjectSelectorParser';
import { TagProjectSelectorParser } from '../../logic/selectors/TagProjectSelectorParser';
import { VersionPolicyProjectSelectorParser } from '../../logic/selectors/VersionPolicyProjectSelectorParser';

/**
 * This class is provides the set of command line parameters used to select projects
 * based on dependencies.
 *
 * It is a separate component such that unrelated actions can share the same parameters.
 */
export class SelectionParameterSet {
  private readonly _rushConfiguration: RushConfiguration;

  private readonly _fromProject: CommandLineStringListParameter;
  private readonly _impactedByProject: CommandLineStringListParameter;
  private readonly _impactedByExceptProject: CommandLineStringListParameter;
  private readonly _onlyProject: CommandLineStringListParameter;
  private readonly _toProject: CommandLineStringListParameter;
  private readonly _toExceptProject: CommandLineStringListParameter;

  private readonly _fromVersionPolicy: CommandLineStringListParameter;
  private readonly _toVersionPolicy: CommandLineStringListParameter;

  private readonly _selectorParserByScope: Map<string, ISelectorParser<RushConfigurationProject>>;
  private readonly _selectors: CommandLineStringListParameter[] = [];
  private _isSelectionSpecified: boolean | undefined;

  public constructor(
    rushConfiguration: RushConfiguration,
    action: CommandLineParameterProvider,
    gitOptions: IGitSelectorParserOptions
  ) {
    this._rushConfiguration = rushConfiguration;

    const selectorParsers: Map<string, ISelectorParser<RushConfigurationProject>> = new Map<
      string,
      ISelectorParser<RushConfigurationProject>
    >();

    const nameSelectorParser: NamedProjectSelectorParser = new NamedProjectSelectorParser(rushConfiguration);
    selectorParsers.set('name', nameSelectorParser);
    selectorParsers.set('git', new GitChangedProjectSelectorParser(rushConfiguration, gitOptions));
    selectorParsers.set('tag', new TagProjectSelectorParser(rushConfiguration));
    selectorParsers.set('version-policy', new VersionPolicyProjectSelectorParser(rushConfiguration));

    this._selectorParserByScope = selectorParsers;

    const getSpecifierCompletions: () => Promise<string[]> = async (): Promise<string[]> => {
      const completions: string[] = ['.'];
      for (const [prefix, selector] of selectorParsers) {
        for (const completion of selector.getCompletions()) {
          completions.push(`${prefix}:${completion}`);
        }
      }

      // Include completions from the name parser without a scope
      for (const completion of nameSelectorParser.getCompletions()) {
        completions.push(completion);
      }

      return completions;
    };

    this._toProject = action.defineStringListParameter({
      parameterLongName: '--to',
      parameterShortName: '-t',
      argumentName: 'PROJECT',
      description:
        'Normally all projects in the monorepo will be processed;' +
        ' adding this parameter will instead select a subset of projects.' +
        ' Each "--to" parameter expands this selection to include PROJECT and all its dependencies.' +
        ' "." can be used as shorthand for the project in the current working directory.' +
        ' For details, refer to the website article "Selecting subsets of projects".',
      completions: getSpecifierCompletions
    });
    this._toExceptProject = action.defineStringListParameter({
      parameterLongName: '--to-except',
      parameterShortName: '-T',
      argumentName: 'PROJECT',
      description:
        'Normally all projects in the monorepo will be processed;' +
        ' adding this parameter will instead select a subset of projects.' +
        ' Each "--to-except" parameter expands this selection to include all dependencies of PROJECT,' +
        ' but not PROJECT itself.' +
        ' "." can be used as shorthand for the project in the current working directory.' +
        ' For details, refer to the website article "Selecting subsets of projects".',
      completions: getSpecifierCompletions
    });

    this._fromProject = action.defineStringListParameter({
      parameterLongName: '--from',
      parameterShortName: '-f',
      argumentName: 'PROJECT',
      description:
        'Normally all projects in the monorepo will be processed;' +
        ' adding this parameter will instead select a subset of projects.' +
        ' Each "--from" parameter expands this selection to include PROJECT and all projects that depend on it,' +
        ' plus all dependencies of this set.' +
        ' "." can be used as shorthand for the project in the current working directory.' +
        ' For details, refer to the website article "Selecting subsets of projects".',
      completions: getSpecifierCompletions
    });
    this._onlyProject = action.defineStringListParameter({
      parameterLongName: '--only',
      parameterShortName: '-o',
      argumentName: 'PROJECT',
      description:
        'Normally all projects in the monorepo will be processed;' +
        ' adding this parameter will instead select a subset of projects.' +
        ' Each "--only" parameter expands this selection to include PROJECT; its dependencies are not added.' +
        ' "." can be used as shorthand for the project in the current working directory.' +
        ' Note that this parameter is "unsafe" as it may produce a selection that excludes some dependencies.' +
        ' For details, refer to the website article "Selecting subsets of projects".',
      completions: getSpecifierCompletions
    });

    this._impactedByProject = action.defineStringListParameter({
      parameterLongName: '--impacted-by',
      parameterShortName: '-i',
      argumentName: 'PROJECT',
      description:
        'Normally all projects in the monorepo will be processed;' +
        ' adding this parameter will instead select a subset of projects.' +
        ' Each "--impacted-by" parameter expands this selection to include PROJECT and any projects that' +
        ' depend on PROJECT (and thus might be broken by changes to PROJECT).' +
        ' "." can be used as shorthand for the project in the current working directory.' +
        ' Note that this parameter is "unsafe" as it may produce a selection that excludes some dependencies.' +
        ' For details, refer to the website article "Selecting subsets of projects".',
      completions: getSpecifierCompletions
    });

    this._impactedByExceptProject = action.defineStringListParameter({
      parameterLongName: '--impacted-by-except',
      parameterShortName: '-I',
      argumentName: 'PROJECT',
      description:
        'Normally all projects in the monorepo will be processed;' +
        ' adding this parameter will instead select a subset of projects.' +
        ' Each "--impacted-by-except" parameter works the same as "--impacted-by" except that PROJECT itself' +
        ' is not added to the selection.' +
        ' "." can be used as shorthand for the project in the current working directory.' +
        ' Note that this parameter is "unsafe" as it may produce a selection that excludes some dependencies.' +
        ' For details, refer to the website article "Selecting subsets of projects".',
      completions: getSpecifierCompletions
    });

    this._toVersionPolicy = action.defineStringListParameter({
      parameterLongName: '--to-version-policy',
      argumentName: 'VERSION_POLICY_NAME',
      description:
        'Normally all projects in the monorepo will be processed;' +
        ' adding this parameter will instead select a subset of projects.' +
        ' The "--to-version-policy" parameter is equivalent to specifying "--to" for each of the projects' +
        ' belonging to VERSION_POLICY_NAME.' +
        ' For details, refer to the website article "Selecting subsets of projects".'
    });
    this._fromVersionPolicy = action.defineStringListParameter({
      parameterLongName: '--from-version-policy',
      argumentName: 'VERSION_POLICY_NAME',
      description:
        'Normally all projects in the monorepo will be processed;' +
        ' adding this parameter will instead select a subset of projects.' +
        ' The "--from-version-policy" parameter is equivalent to specifying "--from" for each of the projects' +
        ' belonging to VERSION_POLICY_NAME.' +
        ' For details, refer to the website article "Selecting subsets of projects".'
    });

    this._selectors = [
      this._onlyProject,
      this._fromProject,
      this._toProject,
      this._toExceptProject,
      this._impactedByProject,
      this._impactedByExceptProject
    ];
  }

  /**
   * Check if any of the selection parameters have a value specified on the command line
   *
   * Returns true if specifying any selection parameters, otherwise false.
   */
  public get isSelectionSpecified(): boolean {
    if (undefined === this._isSelectionSpecified) {
      this._isSelectionSpecified = this._selectors.some(
        (param: CommandLineStringListParameter) => param.values.length > 0
      );
    }
    return this._isSelectionSpecified;
  }

  /**
   * Computes the set of selected projects based on all parameter values.
   *
   * If no parameters are specified, returns all projects in the Rush config file.
   */
  public async getSelectedProjectsAsync(terminal: ITerminal): Promise<Set<RushConfigurationProject>> {
    // Hack out the old version-policy parameters
    for (const value of this._fromVersionPolicy.values) {
      (this._fromProject.values as string[]).push(`version-policy:${value}`);
    }
    for (const value of this._toVersionPolicy.values) {
      (this._toProject.values as string[]).push(`version-policy:${value}`);
    }

    // If no selection parameters are specified, return everything
    if (!this.isSelectionSpecified) {
      return new Set(this._rushConfiguration.projects);
    }

    const [
      // Include exactly these projects (--only)
      onlyProjects,
      // Include all projects that depend on these projects, and all dependencies thereof
      fromProjects,
      // --to
      toRaw,
      // --to-except
      toExceptProjects,
      // --impacted-by
      impactedByProjects,
      // --impacted-by-except
      impactedByExceptProjects
    ] = await Promise.all(
      this._selectors.map((param: CommandLineStringListParameter) => {
        return this._evaluateProjectParameterAsync(param, terminal);
      })
    );

    const selection: Set<RushConfigurationProject> = Selection.union(
      // Safe command line options
      Selection.expandAllDependencies(
        Selection.union(
          toRaw,
          Selection.directDependenciesOf(toExceptProjects),
          // --from / --from-version-policy
          Selection.expandAllConsumers(fromProjects)
        )
      ),

      // Unsafe command line option: --only
      onlyProjects,

      // Unsafe command line options: --impacted-by, --impacted-by-except
      Selection.expandAllConsumers(
        Selection.union(impactedByProjects, Selection.directConsumersOf(impactedByExceptProjects))
      )
    );

    return selection;
  }

  /**
   * Represents the selection as `--filter` parameters to pnpm, and selected projects when partial install
   *
   * @remarks
   * This is a separate from the selection to allow the filters to be represented more concisely.
   *
   * @see https://pnpm.io/filtering
   */
  public async getPnpmFilterArgumentsAsync(terminal: ITerminal): Promise<{
    pnpmFilterArguments: string[];
    splitWorkspacePnpmFilterArguments: string[];
    selectedProjects: Set<RushConfigurationProject> | undefined;
    hasSelectSplitWorkspaceProject: boolean;
  }> {
    const pnpmFilterArguments: string[] = [];
    const splitWorkspacePnpmFilterArguments: string[] = [];
    let hasSelectSplitWorkspaceProject: boolean = false;

    if (this._rushConfiguration.hasSplitWorkspaceProject) {
      // when there are split workspace projects, the selected projects are computed inside Rush.js.
      const selection: Set<RushConfigurationProject> = await this.getSelectedProjectsAsync(terminal);

      const selectedRushProjects: Set<RushConfigurationProject> = new Set<RushConfigurationProject>();
      const selectedSplitWorkspaceProjects: Set<RushConfigurationProject> =
        new Set<RushConfigurationProject>();

      for (const project of selection) {
        if (!project.splitWorkspace) {
          selectedRushProjects.add(project);
        } else {
          hasSelectSplitWorkspaceProject = true;
          selectedSplitWorkspaceProjects.add(project);
        }
      }

      // It is no need to push pnpm filter args if projects are fully selected.
      if (
        this._rushConfiguration.getFilteredProjects({
          splitWorkspace: false
        }).length !== selectedRushProjects.size
      ) {
        for (const selectedProject of selectedRushProjects.values()) {
          pnpmFilterArguments.push('--filter', `${selectedProject.packageName}`);
        }
      }

      if (
        this._rushConfiguration.getFilteredProjects({
          splitWorkspace: true
        }).length !== selectedSplitWorkspaceProjects.size
      ) {
        for (const selectedProject of selectedSplitWorkspaceProjects.values()) {
          splitWorkspacePnpmFilterArguments.push('--filter', `${selectedProject.packageName}`);
        }
      }
    } else {
      // when there are no split workspace projects, replies on pnpm filtering with ellipsis

      // Include exactly these projects (--only)
      for (const project of await this._evaluateProjectParameterAsync(this._onlyProject, terminal)) {
        pnpmFilterArguments.push('--filter', project.packageName);
      }

      // Include all projects that depend on these projects, and all dependencies thereof
      const fromProjects: Set<RushConfigurationProject> = Selection.union(
        // --from
        await this._evaluateProjectParameterAsync(this._fromProject, terminal)
      );

      // All specified projects and all projects that they depend on
      for (const project of Selection.union(
        // --to
        await this._evaluateProjectParameterAsync(this._toProject, terminal),
        // --from / --from-version-policy
        Selection.expandAllConsumers(fromProjects)
      )) {
        pnpmFilterArguments.push('--filter', `${project.packageName}...`);
      }

      // --to-except
      // All projects that the project directly or indirectly declares as a dependency
      for (const project of await this._evaluateProjectParameterAsync(this._toExceptProject, terminal)) {
        pnpmFilterArguments.push('--filter', `${project.packageName}^...`);
      }

      // --impacted-by
      // The project and all projects directly or indirectly declare it as a dependency
      for (const project of await this._evaluateProjectParameterAsync(this._impactedByProject, terminal)) {
        pnpmFilterArguments.push('--filter', `...${project.packageName}`);
      }

      // --impacted-by-except
      // All projects that directly or indirectly declare the specified project as a dependency
      for (const project of await this._evaluateProjectParameterAsync(
        this._impactedByExceptProject,
        terminal
      )) {
        pnpmFilterArguments.push('--filter', `...^${project.packageName}`);
      }
    }

    // Undefined when full install
    let selectedProjects: Set<RushConfigurationProject> | undefined;
    if (this.isSelectionSpecified) {
      selectedProjects = await this.getSelectedProjectsAsync(terminal);
    }

    return {
      pnpmFilterArguments,
      splitWorkspacePnpmFilterArguments,
      selectedProjects,
      hasSelectSplitWorkspaceProject
    };
  }

  /**
   * Usage telemetry for selection parameters. Only saved locally, and if requested in the config.
   */
  public getTelemetry(): { [key: string]: string } {
    return {
      command_from: `${this._fromProject.values.length > 0}`,
      command_impactedBy: `${this._impactedByProject.values.length > 0}`,
      command_impactedByExcept: `${this._impactedByExceptProject.values.length > 0}`,
      command_only: `${this._onlyProject.values.length > 0}`,
      command_to: `${this._toProject.values.length > 0}`,
      command_toExcept: `${this._toExceptProject.values.length > 0}`,

      command_fromVersionPolicy: `${this._fromVersionPolicy.values.length > 0}`,
      command_toVersionPolicy: `${this._toVersionPolicy.values.length > 0}`
    };
  }

  /**
   * Computes the referents of parameters that accept a project identifier.
   * Handles '.', unscoped names, and scoped names.
   */
  private async _evaluateProjectParameterAsync(
    listParameter: CommandLineStringListParameter,
    terminal: ITerminal
  ): Promise<Set<RushConfigurationProject>> {
    const parameterName: string = listParameter.longName;
    const selection: Set<RushConfigurationProject> = new Set();

    for (const rawSelector of listParameter.values) {
      // Handle the special case of "current project" without a scope
      if (rawSelector === '.') {
        const packageJsonLookup: PackageJsonLookup = PackageJsonLookup.instance;
        const packageJson: IPackageJson | undefined = packageJsonLookup.tryLoadPackageJsonFor(process.cwd());
        if (packageJson) {
          const project: RushConfigurationProject | undefined = this._rushConfiguration.getProjectByName(
            packageJson.name
          );

          if (project) {
            selection.add(project);
          } else {
            terminal.writeErrorLine(
              'Rush is not currently running in a project directory specified in rush.json. ' +
                `The "." value for the ${parameterName} parameter is not allowed.`
            );
            throw new AlreadyReportedError();
          }
        } else {
          terminal.writeErrorLine(
            'Rush is not currently running in a project directory. ' +
              `The "." value for the ${parameterName} parameter is not allowed.`
          );
          throw new AlreadyReportedError();
        }

        continue;
      }

      const scopeIndex: number = rawSelector.indexOf(':');

      const scope: string = scopeIndex < 0 ? 'name' : rawSelector.slice(0, scopeIndex);
      const unscopedSelector: string = scopeIndex < 0 ? rawSelector : rawSelector.slice(scopeIndex + 1);

      const handler: ISelectorParser<RushConfigurationProject> | undefined =
        this._selectorParserByScope.get(scope);
      if (!handler) {
        terminal.writeErrorLine(
          `Unsupported selector prefix "${scope}" passed to "${parameterName}": "${rawSelector}".` +
            ` Supported prefixes: ${Array.from(
              this._selectorParserByScope.keys(),
              (scope: string) => `"${scope}:"`
            ).join(', ')}`
        );
        throw new AlreadyReportedError();
      }

      for (const project of await handler.evaluateSelectorAsync({
        unscopedSelector,
        terminal,
        parameterName
      })) {
        selection.add(project);
      }
    }

    return selection;
  }

  public toArguments(): string[] {
    const args: string[] = [];
    for (const selector of this._selectors) {
      for (const value of selector.values) {
        args.push(selector.longName, value);
      }
    }
    return args;
  }
}
