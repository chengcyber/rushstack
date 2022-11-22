// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { CommandLineParameter, CommandLineRemainder } from '@rushstack/ts-command-line';
import { BaseRushAction, IBaseRushActionOptions } from '../actions/BaseRushAction';
import { Command, CommandLineConfiguration, IParameterJson } from '../../api/CommandLineConfiguration';
import { RushConstants } from '../../logic/RushConstants';
import type { IRemainderJson, ParameterJson } from '../../api/CommandLineJson';

/**
 * Constructor parameters for BaseScriptAction
 */
export interface IBaseScriptActionOptions<TCommand extends Command> extends IBaseRushActionOptions {
  commandLineConfiguration: CommandLineConfiguration;
  command: TCommand;
}

/**
 * Base class for command-line actions that are implemented using user-defined scripts.
 *
 * @remarks
 * Compared to the normal built-in actions, these actions are special because (1) they
 * can be discovered dynamically via common/config/command-line.json, and (2)
 * user-defined command-line parameters can be passed through to the script.
 *
 * The two subclasses are BulkScriptAction and GlobalScriptAction.
 */
export abstract class BaseScriptAction<TCommand extends Command> extends BaseRushAction {
  protected readonly commandLineConfiguration: CommandLineConfiguration;
  protected readonly customParameters: Map<IParameterJson, CommandLineParameter> = new Map();
  protected readonly command: TCommand;
  protected _customRemainder: CommandLineRemainder | undefined;
  protected _customRemainderJson: IRemainderJson | undefined;

  public constructor(options: IBaseScriptActionOptions<TCommand>) {
    super(options);
    this.commandLineConfiguration = options.commandLineConfiguration;
    this.command = options.command;
  }

  protected get customRemainder(): CommandLineRemainder | undefined {
    return this._customRemainder;
  }

  protected get customRemainderJson(): IRemainderJson | undefined {
    return this._customRemainderJson;
  }

  protected defineScriptParameters(): void {
    if (!this.commandLineConfiguration) {
      return;
    }

    // Find any parameters that are associated with this command
    for (const parameter of this.command.associatedParameters) {
      let tsCommandLineParameter: CommandLineParameter | undefined;

      switch (parameter.parameterKind) {
        case 'flag':
          tsCommandLineParameter = this.defineFlagParameter({
            parameterShortName: parameter.shortName,
            parameterLongName: parameter.longName,
            description: parameter.description,
            required: parameter.required
          });
          break;
        case 'choice':
          tsCommandLineParameter = this.defineChoiceParameter({
            parameterShortName: parameter.shortName,
            parameterLongName: parameter.longName,
            description: parameter.description,
            required: parameter.required,
            alternatives: parameter.alternatives.map((x) => x.name),
            defaultValue: parameter.defaultValue
          });
          break;
        case 'string':
          tsCommandLineParameter = this.defineStringParameter({
            parameterLongName: parameter.longName,
            parameterShortName: parameter.shortName,
            description: parameter.description,
            required: parameter.required,
            argumentName: parameter.argumentName
          });
          break;
        case 'integer':
          tsCommandLineParameter = this.defineIntegerParameter({
            parameterLongName: parameter.longName,
            parameterShortName: parameter.shortName,
            description: parameter.description,
            required: parameter.required,
            argumentName: parameter.argumentName
          });
          break;
        case 'stringList':
          tsCommandLineParameter = this.defineStringListParameter({
            parameterLongName: parameter.longName,
            parameterShortName: parameter.shortName,
            description: parameter.description,
            required: parameter.required,
            argumentName: parameter.argumentName
          });
          break;
        case 'integerList':
          tsCommandLineParameter = this.defineIntegerListParameter({
            parameterLongName: parameter.longName,
            parameterShortName: parameter.shortName,
            description: parameter.description,
            required: parameter.required,
            argumentName: parameter.argumentName
          });
          break;
        case 'choiceList':
          tsCommandLineParameter = this.defineChoiceListParameter({
            parameterShortName: parameter.shortName,
            parameterLongName: parameter.longName,
            description: parameter.description,
            required: parameter.required,
            alternatives: parameter.alternatives.map((x) => x.name)
          });
          break;
        default:
          throw new Error(
            `${RushConstants.commandLineFilename} defines a parameter "${
              (parameter as ParameterJson).longName
            }" using an unsupported parameter kind "${(parameter as ParameterJson).parameterKind}"`
          );
      }

      this.customParameters.set(parameter, tsCommandLineParameter);
    }
  }

  protected defineScriptRemainder(): void {
    if (!this.commandLineConfiguration) {
      return;
    }

    if (this.command.associatedRemainder) {
      this._customRemainderJson = this.command.associatedRemainder;
      this._customRemainder = this.defineCommandLineRemainder({
        description: this.command.associatedRemainder.description
      });
    }
  }
}
