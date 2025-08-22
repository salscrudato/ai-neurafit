// main.tsx — robust entry with env-aware StrictMode & resilient SW registration
import { StrictMode, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';


// ---- Root element (defensive) ----
const container = document.getElementById('root');
if (!container) {
  // Fail fast: this should never happen in a healthy build
  throw new Error('Root container #root not found');
}

const root = createRoot(container);



// ---- Render (use StrictMode in dev; opt-out automatically in prod) ----
const withStrict = import.meta.env.DEV;

startTransition(() => {
  root.render(
    withStrict ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    ),
  );
});

// Optional: expose a simple hot-reload accept for Vite HMR safety
if (import.meta.hot) {
  import.meta.hot.accept();
}