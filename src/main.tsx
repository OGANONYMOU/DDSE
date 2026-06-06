import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { installGlobalErrorHandlers } from './lib/errorLogger';
import { flushAuditQueue } from './services/auditLogger';
import { observability } from './lib/observability';
import { automationEngine } from './lib/automationEngine';
import { initWorkflowEngine } from './lib/workflowEngine';

// ── N-7: PWA Service Worker registration ─────────────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        navigator.serviceWorker.addEventListener('message', (ev) => {
          if ((ev.data as { type?: string } | null)?.type === 'SYNC_READY') {
            window.dispatchEvent(new Event('online'));
          }
        });
        if ('periodicSync' in reg) {
          (reg as unknown as { periodicSync: { register(t: string, o: object): Promise<void> } })
            .periodicSync.register('ddse-draft-sync', { minInterval: 5 * 60_000 })
            .catch(() => {});
        }
      })
      .catch(() => {});
  });
}

// ── Phase 10 — Error capture ────────────────────────────────────────────────
const cleanupErrorHandlers = installGlobalErrorHandlers();

// Flush any queued offline audit events on startup
void flushAuditQueue();

// ── Phase 12 — Platform Ecosystem startup ────────────────────────────────────
observability.init();
const cleanupWorkflows = initWorkflowEngine();
automationEngine.init();

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupErrorHandlers();
    cleanupWorkflows();
    automationEngine.destroy();
    observability.destroy();
  });
}
