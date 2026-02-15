'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

/** Messages the UI sends to the worker. */
interface WorkerInMessage {
  type: 'init' | 'run' | 'interrupt';
  code?: string;
  runId?: string;
}

/** Messages the worker sends back. */
interface WorkerOutMessage {
  type: 'ready' | 'stdout' | 'stderr' | 'result' | 'error' | 'done';
  runId?: string;
  data?: string;
}

export interface OutputLine {
  text: string;
  stream: 'stdout' | 'stderr' | 'result' | 'system';
}

interface UsePythonRunnerReturn {
  /** Whether Pyodide has finished loading and is ready. */
  isReady: boolean;
  /** Whether code is currently executing. */
  isRunning: boolean;
  /** Whether Pyodide is loading (first init or re-init after timeout). */
  isLoading: boolean;
  /** Accumulated output lines from the current / last run. */
  output: OutputLine[];
  /** Execute `code` in the Python runtime. */
  run: (code: string) => void;
  /** Clear output and reset to initial state. */
  reset: () => void;
}

const TIMEOUT_MS = 5_000;
const MAX_INIT_RETRIES = 3;
const INIT_BACKOFF_BASE_MS = 1_000; // 1 s, 2 s, 4 s
const MIN_SPINNER_MS = 1_000; // show spinner for at least 1 s

const INITIAL_OUTPUT: OutputLine[] = [
  { text: 'Initializing Python environment…', stream: 'system' },
];

export function usePythonRunner(): UsePythonRunnerReturn {
  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runStartRef = useRef<number>(0);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState<OutputLine[]>(INITIAL_OUTPUT);

  // Mirror isRunning in a ref so the `run` callback always sees the latest value
  const isRunningRef = useRef(false);

  const destroyWorker = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (spinnerTimerRef.current) {
      clearTimeout(spinnerTimerRef.current);
      spinnerTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsReady(false);
    isRunningRef.current = false;
    setIsRunning(false);
  }, []);

  const createWorker = useCallback(() => {
    destroyWorker();
    setIsLoading(true);

    const worker = new Worker(new URL('../workers/python.worker.js', import.meta.url));

    worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
      const msg = e.data;

      if (msg.type === 'ready') {
        retryCountRef.current = 0; // successful init resets retries
        setIsReady(true);
        setIsLoading(false);
        setOutput([
          { text: 'Python 3 (Pyodide) ready. Hit Run to execute your code.', stream: 'system' },
        ]);
        return;
      }

      /* Ignore messages from stale runs */
      if (msg.runId && msg.runId !== runIdRef.current) return;

      switch (msg.type) {
        case 'stdout':
          setOutput((prev) => [...prev, { text: msg.data ?? '', stream: 'stdout' }]);
          break;
        case 'stderr':
          setOutput((prev) => [...prev, { text: msg.data ?? '', stream: 'stderr' }]);
          break;
        case 'result':
          setOutput((prev) => [...prev, { text: msg.data ?? '', stream: 'result' }]);
          break;
        case 'error':
          setOutput((prev) => [...prev, { text: msg.data ?? '', stream: 'stderr' }]);
          break;
        case 'done': {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          // Ensure spinner shows for at least MIN_SPINNER_MS
          const elapsed = Date.now() - runStartRef.current;
          const remaining = Math.max(0, MIN_SPINNER_MS - elapsed);
          const finish = () => {
            isRunningRef.current = false;
            setIsRunning(false);
            spinnerTimerRef.current = null;
          };
          if (remaining > 0) {
            spinnerTimerRef.current = setTimeout(finish, remaining);
          } else {
            finish();
          }
          break;
        }
      }
    };

    worker.onerror = () => {
      const attempt = retryCountRef.current;

      if (attempt >= MAX_INIT_RETRIES) {
        // Give up — surface a stable failure state
        setIsLoading(false);
        setOutput([
          { text: 'Failed to initialize Python environment after multiple attempts.', stream: 'stderr' },
          { text: 'Check your network connection and reload the page to try again.', stream: 'system' },
        ]);
        return;
      }

      retryCountRef.current = attempt + 1;
      const delayMs = INIT_BACKOFF_BASE_MS * 2 ** attempt; // 1 s, 2 s, 4 s

      setOutput([
        { text: `Worker error — retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${MAX_INIT_RETRIES})…`, stream: 'stderr' },
      ]);

      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        createWorker();
      }, delayMs);
    };

    workerRef.current = worker;

    // Tell the worker to load Pyodide
    const msg: WorkerInMessage = { type: 'init' };
    worker.postMessage(msg);
  }, [destroyWorker]);

  useEffect(() => {
    createWorker();
    return () => destroyWorker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(
    (code: string) => {
      if (!workerRef.current || !isReady || isRunningRef.current) return;

      // Clear any lingering timeout from a previous run
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const runId = crypto.randomUUID();
      runIdRef.current = runId;

      runStartRef.current = Date.now();
      isRunningRef.current = true;
      setIsRunning(true);
      setOutput([{ text: '', stream: 'system' }]);

      const msg: WorkerInMessage = { type: 'run', code, runId };
      workerRef.current.postMessage(msg);

      // Timeout safety net — kill + recreate worker
      timeoutRef.current = setTimeout(() => {
        setOutput((prev) => [
          ...prev,
          { text: `\nExecution timed out after ${TIMEOUT_MS / 1000}s — worker restarted.`, stream: 'stderr' },
        ]);
        isRunningRef.current = false;
        setIsRunning(false);
        createWorker();
      }, TIMEOUT_MS);
    },
    [isReady, createWorker],
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (spinnerTimerRef.current) {
      clearTimeout(spinnerTimerRef.current);
      spinnerTimerRef.current = null;
    }
    runIdRef.current = null;
    isRunningRef.current = false;
    setIsRunning(false);
    setOutput([
      {
        text: isReady
          ? 'Python 3 (Pyodide) ready. Hit Run to execute your code.'
          : 'Initializing Python environment…',
        stream: 'system',
      },
    ]);
  }, [isReady]);

  return { isReady, isRunning, isLoading, output, run, reset };
}
