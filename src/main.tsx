import './features/access/invitationToken';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { env } from '@/shared/config/env';
import './styles/globals.css';

document.title = env.appName;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
