'use client';

import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

const THEME_NAME = 'cinematic-dark';

const THEME_RULES = [
  { token: 'comment', foreground: '6b6b6b', fontStyle: 'italic' },
  { token: 'keyword', foreground: 'c084fc' },
  { token: 'keyword.control', foreground: 'C586C0' },
  { token: 'string', foreground: '34d399' },
  { token: 'string.escape', foreground: 'D7BA7D' },
  { token: 'number', foreground: 'facc15' },
  { token: 'type', foreground: '4EC9B0' },
  { token: 'class', foreground: '4EC9B0' },
  { token: 'function', foreground: 'DCDCAA' },
  { token: 'variable', foreground: '9CDCFE' },
  { token: 'constant', foreground: '4FC1FF' },
  { token: 'parameter', foreground: '9CDCFE' },
  { token: 'decorator', foreground: 'DCDCAA' },
  { token: 'operator', foreground: 'D4D4D4' },
  { token: 'delimiter', foreground: 'D4D4D4' },
];

const THEME_COLORS: Record<string, string> = {
  'editor.background': '#0d0d0d',
  'editor.foreground': '#D4D4D4',
  'editorLineNumber.foreground': '#3f3f3f',
  'editorLineNumber.activeForeground': '#a1a1a1',
  'editor.selectionBackground': '#1e8a4240',
  'editor.inactiveSelectionBackground': '#2a2a2a',
  'editorIndentGuide.background': '#2a2a2a',
  'editorIndentGuide.activeBackground': '#3a3a3a',
  'editor.lineHighlightBackground': '#141414',
  'editor.lineHighlightBorder': '#14141400',
  'editorCursor.foreground': '#ffffff',
  'editorWhitespace.foreground': '#2a2a2a',
  'editorWidget.background': '#141414',
  'editorWidget.border': '#2a2a2a',
  'editorSuggestWidget.background': '#141414',
  'editorSuggestWidget.border': '#2a2a2a',
  'editorSuggestWidget.selectedBackground': '#1a1a1a',
  'minimap.background': '#0d0d0d',
  'scrollbar.shadow': '#00000000',
  'scrollbarSlider.background': '#ffffff15',
  'scrollbarSlider.hoverBackground': '#ffffff25',
  'scrollbarSlider.activeBackground': '#ffffff35',
};

const EDITOR_OPTIONS = {
  fontSize: 15,
  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
  fontLigatures: true,
  lineHeight: 24,
  letterSpacing: 0.3,
  minimap: { enabled: false },
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  padding: { top: 16, bottom: 16 },
  lineNumbers: 'on' as const,
  renderLineHighlight: 'line' as const,
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on' as const,
  smoothScrolling: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true, indentation: true },
  autoIndent: 'full' as const,
  tabSize: 4,
  insertSpaces: true,
  wordWrap: 'off' as const,
  automaticLayout: true,
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: { enabled: true },
  folding: true,
  foldingStrategy: 'indentation' as const,
  showFoldingControls: 'mouseover' as const,
  matchBrackets: 'always' as const,
  renderWhitespace: 'selection' as const,
  lineNumbersMinChars: 3,
  glyphMargin: false,
} as const;

interface MonacoWrapperProps {
  value: string;
  onChange?: (value: string) => void;
  onRun?: () => void;
}

export function MonacoWrapper({ value, onChange, onRun }: MonacoWrapperProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme(THEME_NAME, {
      base: 'vs-dark',
      inherit: true,
      rules: THEME_RULES,
      colors: THEME_COLORS,
    });

    monaco.editor.setTheme(THEME_NAME);

    // Cmd/Ctrl + Enter → run code
    editor.addAction({
      id: 'run-python',
      label: 'Run Python',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onRunRef.current?.(),
    });

    editor.focus();
  }, []);

  return (
    <Editor
      height="100%"
      language="python"
      value={value}
      theme={THEME_NAME}
      onChange={(val) => onChange?.(val || '')}
      onMount={handleMount}
      loading={
        <div className="flex h-full w-full items-center justify-center bg-surface-ambient">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-brand-green" />
            <span className="font-mono text-sm text-text-muted">Loading editor...</span>
          </div>
        </div>
      }
      options={EDITOR_OPTIONS}
    />
  );
}
