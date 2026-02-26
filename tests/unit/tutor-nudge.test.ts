import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TutorNudge from '@/app/ai/_components/TutorNudge';
import { NUDGE_DELAY_MS, getNudgeDelayRemainingMs, shouldScheduleTutorNudge } from '@/app/ai/_components/TutorChat';

describe('tutor nudge', () => {
  it('NUDGE_DELAY_MS is 480000 (8 minutes)', () => {
    expect(NUDGE_DELAY_MS).toBe(480000);
  });

  it('nudge resets when checklist item changes (nudgeFiredForRef logic)', () => {
    expect(
      shouldScheduleTutorNudge({
        isInSession: true,
        isOpen: false,
        messagesLength: 1,
        currentChecklistItem: 'Step A',
        nudgeFiredFor: 'Step A',
      })
    ).toBe(false);

    expect(
      shouldScheduleTutorNudge({
        isInSession: true,
        isOpen: false,
        messagesLength: 1,
        currentChecklistItem: 'Step B',
        nudgeFiredFor: 'Step A',
      })
    ).toBe(true);
  });

  it('nudge does not fire if messages.length > 1', () => {
    expect(
      shouldScheduleTutorNudge({
        isInSession: true,
        isOpen: false,
        messagesLength: 2,
        currentChecklistItem: 'Step A',
        nudgeFiredFor: null,
      })
    ).toBe(false);
  });

  it('nudge does not fire if tutor is open', () => {
    expect(
      shouldScheduleTutorNudge({
        isInSession: true,
        isOpen: true,
        messagesLength: 1,
        currentChecklistItem: 'Step A',
        nudgeFiredFor: null,
      })
    ).toBe(false);
  });

  it('tracks remaining delay based on step start time', () => {
    expect(getNudgeDelayRemainingMs(1_000, 1_000)).toBe(NUDGE_DELAY_MS);
    expect(getNudgeDelayRemainingMs(1_000, 1_000 + NUDGE_DELAY_MS + 250)).toBe(0);
  });

  it('TutorNudge renders hint text and calls onOpen when clicked', () => {
    const onOpen = vi.fn();
    const element = TutorNudge({ onOpen, checklistItemTitle: 'Two pointers' });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('Need a hint on this step?');
    expect(element.props['aria-label']).toBe('Need a hint on: Two pointers');

    element.props.onClick();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
