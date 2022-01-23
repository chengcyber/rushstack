import { IconButton, ITextFieldProps, Stack, TextField } from '@fluentui/react';
import { Controller, RegisterOptions, useFieldArray } from 'react-hook-form';
import { ErrorMessage } from './ErrorMessage';

import type { IHookFormProps } from './interface';

export type IControlledTextFieldArrayProps = ITextFieldProps &
  IHookFormProps<string> & {
    arrayRules?: RegisterOptions;
  };

export const ControlledTextFieldArray = (props: IControlledTextFieldArrayProps): JSX.Element => {
  const { name, control, rules, arrayRules, defaultValue } = props;
  const { fields, remove, append } = useFieldArray({
    name,
    control
  });
  return (
    <div>
      <div>
        {/* <Controller
          name={name}
          control={control}
          rules={arrayRules}
          render={({ fieldState: { error } }) => (
            <>
              {error ? <ErrorMessage message={error.message} /> : null}
            </>
          )}
        /> */}
        {fields.map((field, index) => {
          return (
            <div key={field.id}>
              <Stack horizontal>
                <Controller
                  name={`${name}.${index}.value`}
                  control={control}
                  rules={rules}
                  defaultValue={defaultValue}
                  render={({
                    field: { onChange, value, onBlur, name: fieldName },
                    fieldState: { error }
                  }) => {
                    return (
                      <TextField
                        {...props}
                        onChange={(e, v) => {
                          console.log('-------newValue', `${name}.${index}.value`, v);
                          onChange(v);
                        }}
                        value={value}
                        onBlur={onBlur}
                        name={fieldName}
                        errorMessage={error && error.message}
                      />
                    );
                  }}
                />
                <IconButton
                  iconProps={{
                    iconName: 'Delete'
                  }}
                  title="delete"
                  ariaLabel="delete"
                  onClick={() => remove(index)}
                />
              </Stack>
            </div>
          );
        })}
      </div>
      <IconButton
        iconProps={{
          iconName: 'Add'
        }}
        title="Add"
        ariaLabel="Add"
        onClick={() => {
          append({
            value: ''
          });
        }}
      />
    </div>
  );
};
