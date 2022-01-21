import { ComboBox, IComboBoxOption, IComboBoxProps } from '@fluentui/react';
import { Controller } from 'react-hook-form';

import type { IHookFormProps } from './interface';

export type IControlledComboBoxProps = IComboBoxProps & IHookFormProps<string>;

export const ControlledComboBox = (props: IControlledComboBoxProps): JSX.Element => {
  const { name, control, rules, defaultValue } = props;
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field: { onChange, value, onBlur, name: fieldName }, fieldState: { error } }) => {
        const onChangeComboBox: IComboBoxProps['onChange'] = (
          e: unknown,
          option: IComboBoxOption | undefined
        ) => {
          if (option) {
            onChange(option.key);
          }
        };
        return (
          <>
            <ComboBox
              {...props}
              onChange={onChangeComboBox}
              selectedKey={value}
              onBlur={onBlur}
              id={fieldName}
              errorMessage={error && error.message}
            />
          </>
        );
      }}
    />
  );
};
