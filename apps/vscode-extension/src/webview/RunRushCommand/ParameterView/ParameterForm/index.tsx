import { CSSProperties, MutableRefObject, ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  CommandLineChoiceListParameter,
  CommandLineChoiceParameter,
  CommandLineFlagParameter,
  CommandLineIntegerParameter,
  CommandLineParameterKind
} from '@rushstack/ts-command-line';
import { FieldValues, useForm } from 'react-hook-form';
import { Label } from '@fluentui/react';

import { ControlledTextField } from '../../ControlledFormComponents/ControlledTextField';
import { ControlledComboBox } from '../../ControlledFormComponents/ControlledComboBox';
import { ControlledTextFieldArray } from '../../ControlledFormComponents/ControlledTextFieldArray';
import {
  ICommandLineParameter,
  onChangeFormDefaultValues,
  useSearchedParameters
} from '../../store/slices/parameter';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ParameterFormWatcher } from './Watcher';

import type { AnyAction, Dispatch } from '@reduxjs/toolkit';

const formStyle: CSSProperties = {
  width: '430px'
};

export const ParameterForm = (): JSX.Element => {
  const commandName: string = useAppSelector((state) => state.parameter.commandName);
  const parameters: ICommandLineParameter[] = useSearchedParameters();

  const defaultValues: FieldValues = useMemo(() => {
    return parameters.reduce((acc: FieldValues, parameter: ICommandLineParameter) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parameterHasDefaultValue: ICommandLineParameter & { defaultValue?: string } =
        parameter as ICommandLineParameter & { defaultValue?: string };
      if ('defaultValue' in parameterHasDefaultValue) {
        acc[parameterHasDefaultValue.longName] = parameterHasDefaultValue.defaultValue;
      }
      return acc;
    }, {});
  }, [commandName, parameters]);

  const { control, watch, reset } = useForm({
    defaultValues
  });

  const dispatch: Dispatch<AnyAction> = useAppDispatch();
  const defaultValuesRef: MutableRefObject<FieldValues> = useRef<FieldValues>({});
  useEffect(() => {
    // deep clone
    const clonedValues: FieldValues = JSON.parse(JSON.stringify(defaultValues));
    defaultValuesRef.current = clonedValues;
    console.log('change default values', defaultValues);
  }, [defaultValues]);

  useEffect(() => {
    const defaultValues: FieldValues = defaultValuesRef.current;
    reset(defaultValues);
    console.log('rest', defaultValues);
    dispatch(onChangeFormDefaultValues(defaultValues));
  }, [commandName, reset]);

  // const fieldValues: FieldValues = watch();
  // useEffect(() => {
  //   dispatch(onChangeFormValues(fieldValues));
  // }, [fieldValues])

  return (
    <div style={formStyle}>
      <h3>{commandName}</h3>
      {parameters.map((parameter: ICommandLineParameter) => {
        let fieldNode: ReactNode = null;
        switch (parameter.kind) {
          case CommandLineParameterKind.Choice: {
            const commandLineChoiceParameter: CommandLineChoiceParameter =
              parameter as CommandLineChoiceParameter;
            fieldNode = (
              <ControlledComboBox
                name={commandLineChoiceParameter.longName}
                control={control}
                defaultValue={commandLineChoiceParameter.defaultValue}
                options={commandLineChoiceParameter.alternatives.map((alternative: string) => ({
                  key: alternative,
                  text: alternative
                }))}
              />
            );
            break;
          }
          case CommandLineParameterKind.ChoiceList: {
            const commandLineChoiceListParameter: CommandLineChoiceListParameter =
              parameter as CommandLineChoiceListParameter;
            fieldNode = (
              <ControlledComboBox
                multiSelect={true}
                name={commandLineChoiceListParameter.longName}
                control={control}
                options={commandLineChoiceListParameter.alternatives.map((alternative: string) => ({
                  key: alternative,
                  text: alternative
                }))}
              />
            );
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
                    text: 'true'
                  },
                  {
                    key: 'false',
                    text: 'false'
                  }
                ]}
              />
            );
            break;
          }
          case CommandLineParameterKind.Integer: {
            const commandLineIntegerParameter: CommandLineIntegerParameter =
              parameter as CommandLineIntegerParameter;
            fieldNode = (
              <ControlledTextField
                type="number"
                defaultValue={String(commandLineIntegerParameter.defaultValue)}
                name={commandLineIntegerParameter.longName}
                control={control}
              />
            );
            break;
          }
          case CommandLineParameterKind.IntegerList: {
            fieldNode = (
              <ControlledTextFieldArray type="number" name={parameter.longName} control={control} />
            );
            break;
          }
          case CommandLineParameterKind.String: {
            fieldNode = <ControlledTextField type="string" name={parameter.longName} control={control} />;
            break;
          }
          case CommandLineParameterKind.StringList: {
            fieldNode = (
              <ControlledTextFieldArray type="string" name={parameter.longName} control={control} />
            );
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
            <Label id={parameter.longName} required={parameter.required}>
              {parameter.longName}
            </Label>
            {parameter.description ? <p>{parameter.description}</p> : null}
            {fieldNode}
          </div>
        );
      })}
      <ParameterFormWatcher watch={watch} />
    </div>
  );
};
