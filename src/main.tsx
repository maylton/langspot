import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AuthApp from './AuthApp';
import ErrorBoundary from './ErrorBoundary';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><ErrorBoundary><AuthApp /></ErrorBoundary></StrictMode>,
);
