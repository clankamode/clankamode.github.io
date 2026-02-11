'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BlockEditor } from '@/components/editor/BlockEditor';
import { BlockRenderer } from '@/components/editor/BlockRenderer';
import { parseBlocks } from '@/components/editor/utils/parseBlocks';
import ContentDiffViewer from './ContentDiffViewer';

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

const MIN_LEFT_PERCENT = 25;
const MAX_LEFT_PERCENT = 75;
const DEFAULT_LEFT_PERCENT = 60;
const RESIZE_HANDLE_PX = 8;

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const blocks = useMemo(() => parseBlocks(value), [value]);
  const [mode, setMode] = useState<'write' | 'inspect'>('write');
  const [mediaLibraryTrigger, setMediaLibraryTrigger] = useState(0);
  const [leftPercent, setLeftPercent] = useState(DEFAULT_LEFT_PERCENT);
  const [isLg, setIsLg] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceState, setVoiceState] = useState<'idle' | 'generating' | 'error'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [updateInstruction, setUpdateInstruction] = useState('');
  const [updateState, setUpdateState] = useState<'idle' | 'generating' | 'error'>('idle');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [proposedBody, setProposedBody] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dragRef = useRef({ startX: 0, startPercent: 0 });

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsLg(mq.matches);
    const fn = () => setIsLg(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceError('Speech recognition is not supported in this browser.');
      setShowVoicePanel(true);
      return;
    }

    setVoiceError(null);
    setShowVoicePanel(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let nextTranscript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result[0]?.transcript) {
          nextTranscript += `${result[0].transcript} `;
        }
      }
      setVoiceTranscript(nextTranscript.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setVoiceError(`Voice input failed: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  const handleGenerateFromVoice = useCallback(async () => {
    if (!voiceTranscript.trim()) {
      setVoiceError('Record or paste some spoken notes first.');
      return;
    }

    setVoiceState('generating');
    setVoiceError(null);

    try {
      const response = await fetch('/api/content/voice-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: voiceTranscript,
          existingBody: value,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate draft from voice notes.');
      }

      const data = await response.json();
      if (!data.draft || typeof data.draft !== 'string') {
        throw new Error('No draft returned from AI model.');
      }

      onChange(data.draft);
      setVoiceState('idle');
      setShowVoicePanel(false);
      setVoiceTranscript('');
    } catch (error) {
      console.error(error);
      setVoiceState('error');
      setVoiceError('Unable to build draft. Please try again.');
    }
  }, [onChange, value, voiceTranscript]);

  const handleRequestUpdate = useCallback(async () => {
    if (!updateInstruction.trim()) {
      setUpdateError('Describe the changes you want.');
      return;
    }

    setUpdateState('generating');
    setUpdateError(null);
    setProposedBody(null);

    try {
      const response = await fetch('/api/content/article-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: value, instruction: updateInstruction.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate update.');
      }

      const data = await response.json();
      if (!data.proposedBody || typeof data.proposedBody !== 'string') {
        throw new Error('No proposed content returned.');
      }

      setProposedBody(data.proposedBody);
      setUpdateState('idle');
    } catch (err) {
      console.error(err);
      setUpdateState('error');
      setUpdateError(err instanceof Error ? err.message : 'Unable to generate update. Try again.');
    }
  }, [value, updateInstruction]);

  const handleAcceptUpdate = useCallback(() => {
    if (proposedBody !== null) {
      onChange(proposedBody);
      setProposedBody(null);
      setUpdateInstruction('');
      setShowUpdatePanel(false);
      setUpdateError(null);
    }
  }, [onChange, proposedBody]);

  const handleDismissUpdate = useCallback(() => {
    setProposedBody(null);
    setUpdateInstruction('');
    setShowUpdatePanel(false);
    setUpdateError(null);
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startPercent: leftPercent };
    const onMove = (moveEvent: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const delta = moveEvent.clientX - dragRef.current.startX;
      const deltaPercent = (delta / container.offsetWidth) * 100;
      setLeftPercent(() =>
        Math.min(MAX_LEFT_PERCENT, Math.max(MIN_LEFT_PERCENT, dragRef.current.startPercent + deltaPercent))
      );
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [leftPercent]);

  const wordCount = useMemo(() => {
    const text = blocks
      .filter((block) => block.type === 'markdown' || block.type === 'callout' || block.type === 'code')
      .map((block) => ('content' in block ? block.content : ''))
      .join(' ');
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [blocks]);

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted/30 font-semibold">Authoring Surface</span>
            <div className="flex items-center gap-2 text-xs text-text-secondary font-mono">
              {wordCount} words · {readingTime} min read
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary transition hover:text-text-primary focus-ring"
            onClick={() => setMediaLibraryTrigger((prev) => prev + 1)}
          >
            Media Library
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary transition hover:text-text-primary focus-ring"
            onClick={() => {
              if (showVoicePanel && isRecording) {
                recognitionRef.current?.stop();
                setIsRecording(false);
              }
              setShowVoicePanel((prev) => !prev);
            }}
          >
            Voice Draft
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-text-secondary transition hover:text-text-primary focus-ring"
            onClick={() => {
              setShowUpdatePanel((prev) => !prev);
              if (!showUpdatePanel) {
                setUpdateError(null);
                setProposedBody(null);
              }
            }}
          >
            Ask for updates
          </button>

          {/* Mode Toggles */}
          <div className="flex items-center rounded-full bg-surface-interactive p-1">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all ${mode === 'write'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
                }`}
              onClick={() => setMode('write')}
            >
              Write
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-all ${mode === 'inspect'
                ? 'bg-surface-dense text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
                }`}
              onClick={() => setMode('inspect')}
            >
              Inspect
            </button>
          </div>
        </div>
      </div>

      {showVoicePanel && (
        <div className="rounded-xl border border-border-subtle bg-surface-interactive/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Voice to Draft</p>
              <p className="text-[11px] text-text-muted/70">Speak naturally, then generate a full markdown draft.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleRecording}
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition-colors ${isRecording ? 'border-red-400 text-red-300' : 'border-border-subtle text-text-secondary hover:text-text-primary'}`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button
                type="button"
                onClick={handleGenerateFromVoice}
                disabled={voiceState === 'generating'}
                className="rounded-full bg-accent-primary px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white transition-opacity disabled:opacity-60"
              >
                {voiceState === 'generating' ? 'Building Draft...' : 'Generate Full Draft'}
              </button>
            </div>
          </div>
          <textarea
            className="min-h-[140px] w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-3 text-sm text-text-primary focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Talk through your ideas or paste a transcript here..."
            value={voiceTranscript}
            onChange={(event) => setVoiceTranscript(event.target.value)}
          />
          {voiceError && <p className="mt-2 text-xs text-red-400">{voiceError}</p>}
        </div>
      )}

      {showUpdatePanel && (
        <div className="rounded-xl border border-border-subtle bg-surface-interactive/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Ask for updates</p>
              <p className="text-[11px] text-text-muted/70">Describe changes; see the diff, then accept or dismiss.</p>
            </div>
            {!proposedBody ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpdatePanel(false)}
                  className="rounded-full border border-border-subtle px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleRequestUpdate}
                  disabled={updateState === 'generating'}
                  className="rounded-full bg-accent-primary px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white transition-opacity disabled:opacity-60"
                >
                  {updateState === 'generating' ? 'Generating…' : 'Generate update'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDismissUpdate}
                  className="rounded-full border border-border-subtle px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleAcceptUpdate}
                  className="rounded-full bg-accent-primary px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white"
                >
                  Accept changes
                </button>
              </div>
            )}
          </div>
          {!proposedBody ? (
            <>
              <textarea
                className="min-h-[100px] w-full rounded-lg border border-border-subtle bg-surface-dense px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-border-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Make the intro punchier, add a code example for the API call, shorten the conclusion..."
                value={updateInstruction}
                onChange={(e) => setUpdateInstruction(e.target.value)}
                disabled={updateState === 'generating'}
              />
              {updateError && <p className="mt-2 text-xs text-red-400">{updateError}</p>}
            </>
          ) : (
            <ContentDiffViewer
              currentContent={value}
              proposedContent={proposedBody}
              className="max-h-[420px]"
            />
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={`flex gap-0 transition-all duration-300 ${mode === 'inspect' ? 'lg:flex-row' : 'flex-col'}`}
      >
        {/* Editor Column */}
        <div
          className={`transition-all duration-300 mx-auto w-full ${mode === 'write' ? 'max-w-5xl' : ''} ${mode === 'inspect' ? 'lg:mx-0 lg:min-w-0 lg:shrink-0' : ''}`}
          style={mode === 'inspect' && isLg ? { flex: `0 0 ${leftPercent}%` } : undefined}
        >
          <div className={`min-h-[800px] bg-[#18181b] px-8 lg:px-12 rounded-lg ${mode === 'write' ? 'shadow-2xl border-x border-y border-white/5' : ''}`}>
            <BlockEditor value={value} onChange={onChange} mediaLibraryTrigger={mediaLibraryTrigger} mode={mode} />
          </div>
        </div>

        {/* Resize Handle - Only in Inspect Mode */}
        {mode === 'inspect' && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={Math.round(leftPercent)}
            aria-valuemin={MIN_LEFT_PERCENT}
            aria-valuemax={MAX_LEFT_PERCENT}
            tabIndex={0}
            className="hidden lg:flex shrink-0 w-2 cursor-col-resize items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
            onMouseDown={startResize}
            style={{ width: RESIZE_HANDLE_PX }}
          >
            <div className="w-0.5 h-full min-h-[600px] bg-border/50 group-hover:bg-accent-primary/60 transition-colors rounded-full" />
          </div>
        )}

        {/* Preview Column - Only visible in Inspect Mode */}
        {mode === 'inspect' && (
          <div className="lg:flex-1 sticky top-24 h-[calc(100vh-160px)] min-h-[720px] min-w-[320px] overflow-hidden lg:border-l border-white/10 pl-6 opacity-75 w-full">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted/50 font-semibold">Preview</span>
            </div>
            <div className="h-full overflow-y-auto pr-2 scrollbar-hide">
              <BlockRenderer blocks={blocks} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
