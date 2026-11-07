import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AuthApp from './AuthApp';
import ErrorBoundary from './ErrorBoundary';
import './styles.css';
import './assessment-preset.css';
import './live-assessment.css';
import './assessment-report.css';
import './assessment-pacing.css';
import './assessment-manage.css';
import './brand.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><ErrorBoundary><AuthApp /></ErrorBoundary></StrictMode>,
);
