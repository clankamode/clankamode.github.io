/* ──────────────────────────────────────────────────────────────
   Pyodide Web Worker
   Protocol: see usePythonRunner.ts for the full message contract.
   ────────────────────────────────────────────────────────────── */

let pyodide = null;

/* ── helpers ─────────────────────────────────────────────────── */

function post(msg) {
  self.postMessage(msg);
}

/* ── init ────────────────────────────────────────────────────── */

async function initPyodide() {
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js');

  pyodide = await self.loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/',
  });

  post({ type: 'ready' });
}

/* ── run ─────────────────────────────────────────────────────── */

async function runCode(code, runId) {
  if (!pyodide) {
    post({ type: 'error', runId, data: 'Pyodide is not initialized' });
    post({ type: 'done', runId });
    return;
  }

  // Redirect stdout / stderr so every print() streams to the UI
  pyodide.setStdout({
    batched: (text) => {
      post({ type: 'stdout', runId, data: text });
    },
  });

  pyodide.setStderr({
    batched: (text) => {
      post({ type: 'stderr', runId, data: text });
    },
  });

  try {
    const result = await pyodide.runPythonAsync(code);

    // If the last expression evaluated to a non-None value, send it
    if (result !== undefined && result !== null) {
      const repr =
        typeof result === 'object' && result.toString
          ? result.toString()
          : String(result);

      // Only send if it's not "None" (Pyodide can return the Python None)
      if (repr !== 'None') {
        post({ type: 'result', runId, data: repr });
      }

      // Dispose PyProxy to avoid leaking Python-side memory
      if (result && typeof result.destroy === 'function') {
        result.destroy();
      }
    }
  } catch (err) {
    // Extract just the Python traceback string
    const message =
      err && typeof err === 'object' && err.message
        ? err.message
        : String(err);

    post({ type: 'error', runId, data: message });
  }

  post({ type: 'done', runId });
}

/* ── message handler ─────────────────────────────────────────── */

self.onmessage = (event) => {
  const { type, code, runId } = event.data;

  switch (type) {
    case 'init':
      initPyodide();
      break;
    case 'run':
      runCode(code, runId);
      break;
    default:
      break;
  }
};
