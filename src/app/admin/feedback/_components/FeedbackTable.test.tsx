import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { useStateMock, useEffectMock, useCallbackMock } = vi.hoisted(() => ({
  useStateMock: vi.fn(),
  useEffectMock: vi.fn(),
  useCallbackMock: vi.fn(),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: useStateMock,
    useEffect: useEffectMock,
    useCallback: useCallbackMock,
  };
});

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { alt, ...rest } = props;
    return <img alt={alt ?? ''} {...rest} />;
  },
}));

(globalThis as { React?: typeof React }).React = React;

import { FeedbackTable } from './FeedbackTable';

interface FeedbackRow {
  id: string;
  created_at: string;
  category: string;
  message: string;
  page_path: string | null;
  contact_email: string | null;
  user_email: string | null;
  status: string;
  isOpen: boolean;
  resolution: string | null;
  metadata?: { attachments?: Array<{ url: string; name?: string }> };
}

interface PendingStatusChange {
  id: string;
  messagePreview: string;
  newIsOpen: boolean;
  resolution: string | null;
}

function makeRow(overrides?: Partial<FeedbackRow>): FeedbackRow {
  return {
    id: 'feedback-1',
    created_at: '2026-02-25T00:00:00.000Z',
    category: 'bug',
    message: 'Feedback message',
    page_path: '/learn',
    contact_email: null,
    user_email: 'alice@example.com',
    status: 'new',
    isOpen: true,
    resolution: null,
    ...overrides,
  };
}

function setupHookState(params?: {
  rows?: FeedbackRow[];
  loading?: boolean;
  pendingStatus?: PendingStatusChange | null;
}) {
  const setters: ReturnType<typeof vi.fn>[] = [];
  const values = [
    1,
    'open',
    'all',
    params?.rows
      ? {
          feedback: params.rows,
          total: params.rows.length,
          page: 1,
          limit: 20,
        }
      : null,
    params?.loading ?? false,
    null,
    params?.pendingStatus ?? null,
    null,
  ];

  let idx = 0;
  useStateMock.mockImplementation((initialValue: unknown) => {
    const stateSetter = vi.fn();
    setters.push(stateSetter);
    const value = idx < values.length ? values[idx] : initialValue;
    idx += 1;
    return [value, stateSetter];
  });

  return setters;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyElement = { type: any; props: Record<string, any>; key: any };

function isElementNode(value: unknown): value is AnyElement {
  return typeof value === 'object' && value !== null && 'type' in value && 'props' in value;
}

function textFromNode(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join('');
  if (isElementNode(node)) return textFromNode(node.props.children);
  return '';
}

function findElements(node: unknown, predicate: (el: AnyElement) => boolean): AnyElement[] {
  const found: AnyElement[] = [];

  const walk = (value: unknown) => {
    if (value == null || typeof value === 'boolean') return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!isElementNode(value)) return;

    if (predicate(value)) {
      found.push(value);
    }

    walk(value.props.children);
  };

  walk(node);
  return found;
}

describe('FeedbackTable', () => {
  beforeEach(() => {
    useStateMock.mockReset();
    useEffectMock.mockReset();
    useCallbackMock.mockReset();
    useEffectMock.mockImplementation(() => undefined);
    useCallbackMock.mockImplementation((fn: unknown) => fn);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as Response)
    );
  });

  test('renders resolution badge with correct colors for each resolution type', () => {
    setupHookState({
      rows: [
        makeRow({ id: 'r1', isOpen: false, status: 'closed', resolution: 'resolved', message: 'Resolved row' }),
        makeRow({ id: 'r2', isOpen: false, status: 'closed', resolution: 'wont_fix', message: 'Wont fix row' }),
        makeRow({ id: 'r3', isOpen: false, status: 'closed', resolution: 'duplicate', message: 'Duplicate row' }),
        makeRow({ id: 'r4', isOpen: false, status: 'closed', resolution: 'not_a_bug', message: 'Not a bug row' }),
      ],
    });

    const html = renderToStaticMarkup(<FeedbackTable />);

    expect(html).toContain('Resolved');
    expect(html).toContain('bg-[#2cbb5d]/20 text-[#2cbb5d]');
    expect(html).toContain('Won&#x27;t Fix');
    expect(html).toContain('bg-[#d4ab3b]/20 text-[#d4ab3b]');
    expect(html).toContain('Duplicate');
    expect(html).toContain('bg-surface-dense text-text-muted');
    expect(html).toContain('Not a Bug');
    expect(html).toContain('bg-[#e05656]/20 text-[#e05656]');
  });

  test('quick Resolved button calls API with resolution: resolved', () => {
    const fetchMock = vi.mocked(global.fetch);
    setupHookState({
      rows: [makeRow({ message: 'Open row' })],
    });

    const tree = FeedbackTable();
    const resolvedButton = findElements(
      tree,
      (el) => el.type === 'button' && textFromNode(el.props.children).trim() === 'Resolved'
    )[0];

    expect(resolvedButton).toBeDefined();
    resolvedButton.props.onClick();

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/feedback/feedback-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed', resolution: 'resolved' }),
    });
  });

  test.each([
    { action: 'close_resolved', resolution: 'resolved' },
    { action: 'close_wont_fix', resolution: 'wont_fix' },
    { action: 'close_duplicate', resolution: 'duplicate' },
    { action: 'close_not_a_bug', resolution: 'not_a_bug' },
  ])('Close as dropdown triggers correct API call for $action', ({ action, resolution }) => {
    const fetchMock = vi.mocked(global.fetch);
    setupHookState({
      rows: [makeRow({ message: `row-${action}` })],
    });

    const tree = FeedbackTable();
    const actionSelect = findElements(
      tree,
      (el) =>
        el.type === 'select' &&
        el.props.defaultValue === ''
    )[0];

    expect(actionSelect).toBeDefined();

    const event = { target: { value: action } };
    actionSelect.props.onChange(event);

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/feedback/feedback-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed', resolution }),
    });
    expect(event.target.value).toBe('');
  });

  test('Reopen option in dropdown sends status: open with null resolution', () => {
    const fetchMock = vi.mocked(global.fetch);
    setupHookState({
      rows: [makeRow({ isOpen: false, status: 'closed', resolution: 'duplicate', message: 'Closed row' })],
    });

    const tree = FeedbackTable();
    const actionSelect = findElements(
      tree,
      (el) =>
        el.type === 'select' &&
        el.props.defaultValue === ''
    )[0];

    expect(actionSelect).toBeDefined();
    const event = { target: { value: 'reopen' } };
    actionSelect.props.onChange(event);

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/feedback/feedback-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open', resolution: null }),
    });
    expect(event.target.value).toBe('');
  });

  test('modal resolution picker renders and confirm stays disabled until a resolution is selected', () => {
    const pendingStatus = {
      id: 'feedback-1',
      messagePreview: 'preview message',
      newIsOpen: false,
      resolution: null,
    };

    let stateSetters = setupHookState({
      rows: [makeRow({ message: 'Modal row' })],
      pendingStatus,
    });

    const html = renderToStaticMarkup(<FeedbackTable />);
    expect(html).toContain('Select a reason for closing this feedback:');
    expect(html).toContain('grid grid-cols-1 gap-2 sm:grid-cols-2');

    stateSetters = setupHookState({
      rows: [makeRow({ message: 'Modal row' })],
      pendingStatus,
    });
    const tree = FeedbackTable();
    const confirmButton = findElements(
      tree,
      (el) => el.type === 'button' && textFromNode(el.props.children).trim() === 'Confirm'
    )[0];
    expect(confirmButton).toBeDefined();
    expect(confirmButton.props.disabled).toBe(true);

    const duplicateButton = findElements(
      tree,
      (el) => el.type === 'button' && textFromNode(el.props.children).trim().startsWith('Duplicate')
    )[0];
    expect(duplicateButton).toBeDefined();
    duplicateButton.props.onClick();

    expect(stateSetters[6]).toHaveBeenCalledWith({
      ...pendingStatus,
      resolution: 'duplicate',
    });

    stateSetters = setupHookState({
      rows: [makeRow({ message: 'Modal row' })],
      pendingStatus: { ...pendingStatus, resolution: 'duplicate' },
    });

    const treeWithSelection = FeedbackTable();
    const confirmEnabled = findElements(
      treeWithSelection,
      (el) => el.type === 'button' && textFromNode(el.props.children).trim() === 'Confirm'
    )[0];
    expect(confirmEnabled.props.disabled).toBe(false);
  });
});
