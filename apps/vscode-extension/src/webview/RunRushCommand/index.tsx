import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, PartialTheme } from '@fluentui/react';

import { App } from './App';
import { store } from './store';

const theme: PartialTheme = {
  palette: {
    // themePrimary: 'var(--vscode-settings-headerForeground)',
    // themeSecondary: 'var(--vscode-button-secondaryForeground)',
  },
  defaultFontStyle: {
    fontFamily: 'var(--vscode-editor-font-family)',
    fontWeight: 'var(--vscode-editor-font-weight)',
    fontSize: 'var(--vscode-editor-font-size)'
  },
  semanticColors: {
    bodyText: 'var(--vscode-editor-foreground)',
    bodyBackground: 'var(--vscode-editor-background)',
    focusBorder: 'var(--vscode-focusBorder)',
    buttonText: 'var(--vscode-button-foreground)',
    buttonBackground: 'var(--vscode-button-background)',
    buttonBackgroundHovered: 'var(--vscode-button-hoverBackground)',
    errorText: 'var(--vscode-errorForeground)'
  }
};

// eslint-disable-next-line @rushstack/no-new-null
const $root: HTMLElement | null = document.getElementById('root');

if ($root) {
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <App />
      </Provider>
    </ThemeProvider>,
    $root
  );
}
