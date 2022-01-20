import { CommandLineChoiceListParameter, CommandLineChoiceParameter, CommandLineFlagParameter, CommandLineParameterKind } from "@rushstack/ts-command-line";
import { useForm } from "react-hook-form";
import { ControlledTextField } from "../../ControlledFormComponents/ControlledTextField";
import { useAppSelector } from "../../store/hooks";
import { ControlledComboBox } from "../../ControlledFormComponents/ControlledComboBox";

import type { ReactNode } from "react";
import type { ICommandLineParameter } from "../../Message/fromExtension";
import { ParameterFormWatcher } from "./Watcher";

export const ParameterForm = (): JSX.Element => {
  const { control, watch } = useForm();

  const parameters: ICommandLineParameter[] = useAppSelector(state => state.parameter.parameters);

  console.log('wwwwwwww', watch());

  return (
    <div>
      {
        parameters.map((parameter: ICommandLineParameter) => {
          let fieldNode: ReactNode = null;
          switch (parameter.kind) {
            case CommandLineParameterKind.Choice: {
              const commandLineChoiceParameter: CommandLineChoiceParameter = parameter as CommandLineChoiceParameter;
              fieldNode = (
                <ControlledComboBox
                  name={commandLineChoiceParameter.longName}
                  control={control}
                  options={commandLineChoiceParameter.alternatives.map((alternative: string) => ({
                    key: alternative,
                    text: alternative,
                  }))}
                />
              )
              break;
            }
            case CommandLineParameterKind.ChoiceList: {
              const commandLineChoiceListParameter: CommandLineChoiceListParameter = parameter as CommandLineChoiceListParameter;
              fieldNode = (
                <ControlledComboBox
                  multiSelect={true}
                  name={commandLineChoiceListParameter.longName}
                  control={control}
                  options={commandLineChoiceListParameter.alternatives.map((alternative: string) => ({
                    key: alternative,
                    text: alternative,
                  }))}
                />
              )
              break;
            }
            case CommandLineParameterKind.Flag: {
              const commandLineFlagParameter: CommandLineFlagParameter = parameter as CommandLineFlagParameter;
              fieldNode = (
                <ControlledComboBox
                  multiSelect={true}
                  name={commandLineFlagParameter.longName}
                  control={control}
                  options={[
                    {
                      key: '',
                      text: ''
                    },
                    {
                      key: 'true',
                      text: 'true',
                    },
                    {
                      key: 'false',
                      text: 'false',
                    }
                  ]}
                />
              )
              break;
            }
            case CommandLineParameterKind.Integer: {
              fieldNode = (
                <ControlledTextField
                  type="number"
                  name={parameter.longName}
                  control={control}
                />
              )
              break;
            }
            case CommandLineParameterKind.IntegerList: {
              break;
            }
            case CommandLineParameterKind.String: {
              fieldNode = (
                <ControlledTextField
                  type="string"
                  name={parameter.longName.slice(2)}
                  control={control}
                />
              )
              break;
            }
            case CommandLineParameterKind.StringList: {
              break;
            }
            default: {
              const _kind: never = parameter.kind;
              console.error(`Unhandled parameter kind: ${_kind}`);
              return null;
            }
          }

          return (
            <div key={parameter.longName}>
              <h3 id={parameter.longName}>
                {parameter.longName}
              </h3>
              {parameter.description ? <p>{parameter.description}</p> : null}
              {fieldNode}
            </div>
          )
        })
      }
      <ParameterFormWatcher watch={watch} />
    </div>
  )
}