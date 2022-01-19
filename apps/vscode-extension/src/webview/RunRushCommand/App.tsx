import { Stack, DefaultPalette, IStackStyles, IStackTokens, initializeIcons } from '@fluentui/react'
import { ParameterView } from './ParameterView';
import { Toolbar } from './Toolbar';

initializeIcons();

// Styles definition
const stackStyles: IStackStyles = {
  root: {
    height: '100vh',
    background: DefaultPalette.themeTertiary,
  },
};

const verticalGapStackTokens: IStackTokens = {
  childrenGap: 10,
  padding: 10,
};

export const App = (): JSX.Element => {
  return <Stack styles={stackStyles} tokens={verticalGapStackTokens}>
    <Stack.Item>
      <Toolbar />
    </Stack.Item>
    <Stack.Item grow>
      <ParameterView />
    </Stack.Item>
  </Stack>
};
