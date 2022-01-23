import { Stack, DefaultPalette, IStackStyles, IStackTokens, initializeIcons } from '@fluentui/react';
import { useEffect } from 'react';
import { fromExtensionListener } from './Message/fromExtension';
import { ParameterView } from './ParameterView';
import { Toolbar } from './Toolbar';

initializeIcons();

// Styles definition
const stackStyles: IStackStyles = {
  root: {
    height: '100vh',
    // background: DefaultPalette.themeTertiary,
    padding: 0
  }
};

const verticalGapStackTokens: IStackTokens = {
  childrenGap: 10,
  padding: 10
};

export const App = (): JSX.Element => {
  useEffect(() => {
    window.addEventListener('message', fromExtensionListener);
    return () => {
      window.removeEventListener('message', fromExtensionListener);
    };
  }, []);

  return (
    <Stack styles={stackStyles} tokens={verticalGapStackTokens}>
      <Stack.Item style={{ zIndex: 1 }}>
        <Toolbar />
      </Stack.Item>
      <Stack.Item grow style={{ overflow: 'auto', marginTop: 0 }}>
        <ParameterView />
      </Stack.Item>
    </Stack>
  );
};
