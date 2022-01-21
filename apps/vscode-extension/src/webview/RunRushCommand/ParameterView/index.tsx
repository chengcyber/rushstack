import { IStackStyles, DefaultPalette, IStackItemStyles, IStackTokens, Stack } from '@fluentui/react';
import { ParameterDisplay } from './ParameterDisplay';
import { ParameterForm } from './ParameterForm';
import { ParameterNav } from './ParameterNav';

// Styles definition
const stackStyles: IStackStyles = {
  root: {
    background: DefaultPalette.themeTertiary,
    height: '100%'
  }
};
const stackItemStyles: IStackItemStyles = {
  root: {
    alignItems: 'flex-start',
    background: DefaultPalette.themePrimary,
    color: DefaultPalette.white,
    display: 'flex',
    height: '100%',
    justifyContent: 'flex-start',
    minWidth: 0
  }
};

// Tokens definition
const stackTokens: IStackTokens = {
  childrenGap: 5,
  padding: 10
};

export const ParameterView = (): JSX.Element => {
  return (
    <Stack horizontal disableShrink styles={stackStyles} tokens={stackTokens}>
      <Stack.Item align="auto" styles={stackItemStyles}>
        <ParameterNav />
      </Stack.Item>
      <Stack.Item align="auto" styles={stackItemStyles}>
        <ParameterForm />
      </Stack.Item>
      <Stack.Item grow={1} align="auto" styles={stackItemStyles}>
        <ParameterDisplay />
      </Stack.Item>
    </Stack>
  );
};
