import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { supabaseConfigured } from './services/auth';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    {!supabaseConfigured && (
      <div
        style={{
          padding: '12px 16px',
          background: '#fef3c7',
          color: '#78350f',
          font: '500 14px/1.5 system-ui, sans-serif',
          borderBottom: '1px solid #f59e0b',
          position: 'relative',
          zIndex: 9999,
        }}
      >
        <strong>Configuration needed:</strong> VITE_SUPABASE_URL and
        VITE_SUPABASE_PUBLISHABLE_KEY were not set when this build ran. Accounts,
        reports, and uploads will not work until they are added to the hosting
        environment variables and the site is redeployed.
      </div>
    )}
    <App />
  </>,
);
