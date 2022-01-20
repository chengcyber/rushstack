import { CommandLineChoiceListParameter, CommandLineChoiceParameter, CommandLineFlagParameter, CommandLineParameter, CommandLineParameterKind } from "@rushstack/ts-command-line";
import { useForm } from "react-hook-form";
import { ControlledTextField } from "../ControlledFormComponents/ControlledTextField";
import { useAppSelector } from "../store/hooks";

import type { ReactNode } from "react";
import { ControlledComboBox } from "../ControlledFormComponents/ControlledComboBox";

export const ParameterForm = (): JSX.Element => {
  const { control } = useForm();

  const parameters: CommandLineParameter[] = useAppSelector(state => state.parameter.parameters);

  return (
    <div>
      {
        parameters.map((parameter: CommandLineParameter) => {
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
                  name={parameter.longName}
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
            <>
              <h3 id={parameter.longName}>
                {parameter.longName}
              </h3>
              {parameter.description ? <p>{parameter.description}</p> : null}
              {fieldNode}
            </>
          )
        })
      }
    </div>
  )
}