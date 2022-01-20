import { ITextFieldProps, TextField } from '@fluentui/react';
import { Controller } from 'react-hook-form';

import type { IHookFormProps } from './interface';

export type IControlledTextFieldProps = ITextFieldProps & IHookFormProps<string>;

export const ControlledTextField = (props: IControlledTextFieldProps): JSX.Element => {
  const { name, control, rules, defaultValue } = props;
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field: { onChange, value, onBlur, name: fieldName }, fieldState: { error } }) => {
        return (
          <TextField
            {...props}
            onChange={onChange}
            value={value}
            onBlur={onBlur}
            name={fieldName}
            errorMessage={error && error.message}
          />
        )
      }}
    />
  );
};
