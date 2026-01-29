import { createRoot } from 'react-dom/client';
import { App } from './taskpane';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
