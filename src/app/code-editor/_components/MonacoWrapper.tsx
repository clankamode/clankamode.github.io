'use client';

import { useRef, useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

const DARK_THEME = 'cinematic-dark';
const LIGHT_THEME = 'cinematic-light';

const THEME_RULES = [
  { token: 'comment', foreground: '6b6b6b', fontStyle: 'italic' },
  { token: 'keyword', foreground: 'c084fc' },
  { token: 'keyword.control', foreground: '8b5cf6' },
  { token: 'string', foreground: '10b981' },
  { token: 'string.escape', foreground: 'd97706' },
  { token: 'number', foreground: 'f59e0b' },
  { token: 'type', foreground: '0d9488' },
  { token: 'class', foreground: '0d9488' },
  { token: 'function', foreground: '4f46e5' },
  { token: 'variable', foreground: '2563eb' },
  { token: 'constant', foreground: '2563eb' },
  { token: 'parameter', foreground: '2563eb' },
  { token: 'decorator', foreground: '4f46e5' },
  { token: 'operator', foreground: 'a1a1aa' },
  { token: 'delimiter', foreground: 'a1a1aa' },
];

const LIGHT_THEME_COLORS: Record<string, string> = {
  'editor.background': '#ffffff',
  'editor.foreground': '#09090b',
  'editorLineNumber.foreground': '#d1d1d6',
  'editorLineNumber.activeForeground': '#71717a',
  'editor.selectionBackground': '#2cbb5d20',
  'editor.inactiveSelectionBackground': '#f4f4f5',
  'editorIndentGuide.background': '#f4f4f5',
  'editorIndentGuide.activeBackground': '#e4e4e7',
  'editor.lineHighlightBackground': '#f6f6f7',
  'editor.lineHighlightBorder': '#f6f6f700',
  'editorCursor.foreground': '#09090b',
  'editorWhitespace.foreground': '#e4e4e7',
  'editorWidget.background': '#ffffff',
  'editorWidget.border': '#e4e4e7',
  'editorSuggestWidget.background': '#ffffff',
  'editorSuggestWidget.border': '#e4e4e7',
  'editorSuggestWidget.selectedBackground': '#f4f4f5',
  'minimap.background': '#ffffff',
  'scrollbar.shadow': '#00000000',
  'scrollbarSlider.background': '#00000010',
  'scrollbarSlider.hoverBackground': '#00000020',
  'scrollbarSlider.activeBackground': '#00000030',
};

const DARK_THEME_COLORS: Record<string, string> = {
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
  fontSize: 16,
  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
  fontLigatures: false,
  lineHeight: 25,
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

    monaco.editor.defineTheme(DARK_THEME, {
      base: 'vs-dark',
      inherit: true,
      rules: THEME_RULES,
      colors: DARK_THEME_COLORS,
    });

    monaco.editor.defineTheme(LIGHT_THEME, {
      base: 'vs',
      inherit: true,
      rules: THEME_RULES,
      colors: LIGHT_THEME_COLORS,
    });

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    monaco.editor.setTheme(isDarkMode ? DARK_THEME : LIGHT_THEME);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      monaco.editor.setTheme(e.matches ? DARK_THEME : LIGHT_THEME);
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    editor.addAction({
      id: 'run-python',
      label: 'Run Python',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onRunRef.current?.(),
    });

    editor.focus();

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return (
    <Editor
      height="100%"
      language="python"
      value={value}
      theme={DARK_THEME}
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
