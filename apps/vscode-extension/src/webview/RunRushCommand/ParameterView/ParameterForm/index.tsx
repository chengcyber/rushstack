import { CSSProperties, MutableRefObject, ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  CommandLineChoiceListParameter,
  CommandLineChoiceParameter,
  CommandLineFlagParameter,
  CommandLineIntegerListParameter,
  CommandLineIntegerParameter,
  CommandLineParameterKind
} from '@rushstack/ts-command-line';
import { FieldValues, Resolver, UseControllerProps, useForm, UseFormReturn } from 'react-hook-form';
import { Label } from '@fluentui/react';

import { ControlledTextField } from '../../ControlledFormComponents/ControlledTextField';
import { ControlledComboBox } from '../../ControlledFormComponents/ControlledComboBox';
import { ControlledTextFieldArray } from '../../ControlledFormComponents/ControlledTextFieldArray';
import {
  ICommandLineParameter,
  onChangeFormDefaultValues,
  useArgsTextList,
  useFilteredParameters
} from '../../store/slices/parameter';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ParameterFormWatcher } from './Watcher';

import type { AnyAction, Dispatch } from '@reduxjs/toolkit';
import { ControlledToggle } from '../../ControlledFormComponents/ControlledToggle';
import { FIELD_ANCHOR_CLASSNAME } from '../../hooks/parametersFormScroll';
import { setFormValidateAsync, useUserSelectedParameterName } from '../../store/slices/ui';

const formStyle: CSSProperties = {
  // width: '430px'
};

export const ParameterForm = (): JSX.Element => {
  const commandName: string = useAppSelector((state) => state.parameter.commandName);
  const parameters: ICommandLineParameter[] = useFilteredParameters();
  const argsTextList: string[] = useArgsTextList();
  const dispatch: Dispatch<AnyAction> = useAppDispatch();
  const userSelectdParameterName: string = useUserSelectedParameterName();

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

  const resolverRef: MutableRefObject<Resolver | undefined> = useRef(undefined);
  useEffect(() => {
    const requiredListParameters: ICommandLineParameter[] = parameters.filter((parameter) => {
      return parameter.required && (
        parameter.kind === CommandLineParameterKind.ChoiceList ||
        parameter.kind === CommandLineParameterKind.IntegerList ||
        parameter.kind === CommandLineParameterKind.StringList
      )
    });
    if (requiredListParameters.length) {
      resolverRef.current = (values: FieldValues) => {
        const errors: Record<string, string> = {};
        for (const parameter of requiredListParameters) {
          const fieldName: string = parameter.longName;
          if (!Array.isArray(values[fieldName]) || !values[fieldName].some((item: { value: string }) => item.value)) {
            errors[fieldName] = 'At least one valid item is required';
          }
        }
        if (Object.keys(errors).length) {
          return {
            values: {},
            errors,
          }
        } else {
          return {
            values,
            errors,
          }
        }
      }
    }
  }, [parameters]);

  const form: UseFormReturn = useForm({
    defaultValues,
    resolver: async (...args) => {
      if (resolverRef.current) {
        return await resolverRef.current(...args);
      }
      return { values: {}, errors: {} };
    },
    shouldFocusError: true
  });
  useEffect(() => {
    dispatch(
      setFormValidateAsync(() => {
        return form.trigger();
      })
    );
  }, [form]);
  const { control, watch, reset, getValues } = form;

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
    dispatch(onChangeFormDefaultValues(defaultValues));
  }, [commandName, reset]);

  useEffect(() => {
    if (!userSelectdParameterName) {
      return;
    }
    const $el: HTMLElement | null = document.getElementById(userSelectdParameterName);
    if ($el) {
      $el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'start'
      });
    }
  }, [userSelectdParameterName]);

  return (
    <div style={formStyle}>
      <h3>
        rush {commandName} {argsTextList.join(' ')}
      </h3>
      {parameters.map((parameter: ICommandLineParameter) => {
        let fieldNode: ReactNode = null;
        const baseControllerProps: Pick<Required<UseControllerProps>, 'name' | 'control'> &
          UseControllerProps = {
          name: parameter.longName,
          control
        };
        if (parameter.required) {
          baseControllerProps.rules = {
            validate: () => {
              const v: undefined | Array<{ value: string | number }> | string | number | boolean = getValues(
                parameter.longName
              );

              console.log('validating', v, parameter.longName);

              if (typeof v === 'undefined') {
                return 'This field is required';
              } else if (Array.isArray(v)) {
                console.log('validating array', v);
                if (
                  !v.some((item) => {
                    return Boolean(String(item.value));
                  })
                ) {
                  return 'This field requires at least one valid value';
                }
              } else {
                if (!String(v)) {
                  return 'This field is required';
                }
              }
            }
          };
        }

        switch (parameter.kind) {
          case CommandLineParameterKind.Choice: {
            const commandLineChoiceParameter: CommandLineChoiceParameter =
              parameter as CommandLineChoiceParameter;
            fieldNode = (
              <ControlledComboBox
                {...baseControllerProps}
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
                {...baseControllerProps}
                multiSelect={true}
                options={commandLineChoiceListParameter.alternatives.map((alternative: string) => ({
                  key: alternative,
                  text: alternative
                }))}
              />
            );
            break;
          }
          case CommandLineParameterKind.Flag: {
            // const commandLineFlagParameter: CommandLineFlagParameter = parameter as CommandLineFlagParameter;
            fieldNode = <ControlledToggle {...baseControllerProps} />;
            break;
          }
          case CommandLineParameterKind.Integer: {
            const commandLineIntegerParameter: CommandLineIntegerParameter =
              parameter as CommandLineIntegerParameter;
            fieldNode = (
              <ControlledTextField
                {...baseControllerProps}
                type="number"
                defaultValue={String(commandLineIntegerParameter.defaultValue)}
              />
            );
            break;
          }
          case CommandLineParameterKind.IntegerList: {
            fieldNode = (
              <ControlledTextFieldArray
                {...baseControllerProps}
                type="number"
              />
            );
            break;
          }
          case CommandLineParameterKind.String: {
            fieldNode = <ControlledTextField {...baseControllerProps} type="string" />;
            break;
          }
          case CommandLineParameterKind.StringList: {
            fieldNode = (
              <ControlledTextFieldArray
                {...baseControllerProps}
                type="string"
              />
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
            <Label id={parameter.longName} className={FIELD_ANCHOR_CLASSNAME} required={parameter.required}>
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
