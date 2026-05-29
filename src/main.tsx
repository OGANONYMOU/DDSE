import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { installGlobalErrorHandlers } from './lib/errorLogger';
import { flushAuditQueue } from './services/auditLogger';
import { observability } from './lib/observability';
import { automationEngine } from './lib/automationEngine';
import { initWorkflowEngine } from './lib/workflowEngine';

// ── Phase 10 — Error capture ────────────────────────────────────────────────
const cleanupErrorHandlers = installGlobalErrorHandlers();

// Flush any queued offline audit events on startup
void flushAuditQueue();

// ── Phase 12 — Platform Ecosystem startup ────────────────────────────────────
// Initialize in order: observability first (needs to capture events),
// then workflow engine (listens to events), then automation (runs startup rules).
observability.init();
const cleanupWorkflows = initWorkflowEngine();
automationEngine.init();

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Cleanup on HMR dispose (dev only)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupErrorHandlers();
    cleanupWorkflows();
    automationEngine.destroy();
    observability.destroy();
  });
}
