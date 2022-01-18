import ReactDOM from 'react-dom';
import { App } from './App';

// eslint-disable-next-line @rushstack/no-new-null
const $root: HTMLElement | null = document.getElementById('root');

if ($root) {
  ReactDOM.render(<App />, $root);
}
