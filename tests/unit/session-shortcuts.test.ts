import { describe, expect, it } from 'vitest';
import { isEditableEventTarget, shouldIgnoreSessionShortcut } from '@/lib/session-shortcuts';

describe('session-shortcuts', () => {
  it('detects editable targets', () => {
    const input = { tagName: 'INPUT' } as unknown as EventTarget;
    const textarea = { tagName: 'TEXTAREA' } as unknown as EventTarget;
    const select = { tagName: 'SELECT' } as unknown as EventTarget;
    const div = { tagName: 'DIV' } as unknown as EventTarget;
    const contentEditable = { tagName: 'DIV', isContentEditable: true } as unknown as EventTarget;

    expect(isEditableEventTarget(input)).toBe(true);
    expect(isEditableEventTarget(textarea)).toBe(true);
    expect(isEditableEventTarget(select)).toBe(true);
    expect(isEditableEventTarget(contentEditable)).toBe(true);
    expect(isEditableEventTarget(div)).toBe(false);
    expect(isEditableEventTarget(null)).toBe(false);
  });

  it('ignores shortcuts on modifiers or editable targets', () => {
    const div = { tagName: 'DIV' } as unknown as EventTarget;
    const input = { tagName: 'INPUT' } as unknown as EventTarget;

    expect(shouldIgnoreSessionShortcut({ target: div, metaKey: true, ctrlKey: false, altKey: false, defaultPrevented: false, repeat: false, isComposing: false })).toBe(true);
    expect(shouldIgnoreSessionShortcut({ target: div, metaKey: false, ctrlKey: true, altKey: false, defaultPrevented: false, repeat: false, isComposing: false })).toBe(true);
    expect(shouldIgnoreSessionShortcut({ target: div, metaKey: false, ctrlKey: false, altKey: true, defaultPrevented: false, repeat: false, isComposing: false })).toBe(true);
    expect(shouldIgnoreSessionShortcut({ target: input, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: false, repeat: false, isComposing: false })).toBe(true);
    expect(shouldIgnoreSessionShortcut({ target: div, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: false, repeat: false, isComposing: false })).toBe(false);
    expect(shouldIgnoreSessionShortcut({ target: div, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: true, repeat: false, isComposing: false })).toBe(true);
    expect(shouldIgnoreSessionShortcut({ target: div, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: false, repeat: true, isComposing: false })).toBe(true);
    expect(shouldIgnoreSessionShortcut({ target: div, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: false, repeat: false, isComposing: true })).toBe(true);
  });
});
