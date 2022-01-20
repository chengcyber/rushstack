import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { App } from './App';
import { store } from './store';

// eslint-disable-next-line @rushstack/no-new-null
const $root: HTMLElement | null = document.getElementById('root');

if ($root) {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    $root
  );
}
