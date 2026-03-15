import { describe, expect, test } from 'vitest';
import { getStreakDays, getStreakStatus } from '@/lib/progress/helpers';

function isoOnDay(day: string): string {
  return `${day}T12:00:00.000Z`;
}

describe('getStreakStatus', () => {
  test('default behavior: applies the free weekly freeze automatically', () => {
    const result = getStreakStatus([isoOnDay('2026-03-03')], {
      today: new Date('2026-03-04T12:00:00.000Z'),
    });

    expect(result.streakDays).toBe(2);
    expect(result.dayStates).toEqual([
      { date: '2026-03-04', state: 'freeze', reason: 'manual-freeze' },
      { date: '2026-03-03', state: 'earned' },
    ]);
  });

  test('freeze preserve: manual freeze keeps streak when within weekly limit', () => {
    const result = getStreakStatus([isoOnDay('2026-03-02'), isoOnDay('2026-02-28')], {
      today: new Date('2026-03-02T12:00:00.000Z'),
      freezeRecords: [{ usedAt: isoOnDay('2026-03-01'), type: 'manual' }],
      weeklyFreezeLimit: 1,
    });

    expect(result.streakDays).toBe(3);
    expect(result.dayStates).toEqual([
      { date: '2026-03-02', state: 'earned' },
      { date: '2026-03-01', state: 'freeze', reason: 'manual-freeze' },
      { date: '2026-02-28', state: 'earned' },
    ]);
  });

  test('auto-freeze preserve: missing weekday consumes the free weekly freeze', () => {
    const result = getStreakStatus([isoOnDay('2026-03-05'), isoOnDay('2026-03-03')], {
      today: new Date('2026-03-05T12:00:00.000Z'),
      weeklyFreezeLimit: 1,
    });

    expect(result.streakDays).toBe(3);
    expect(result.dayStates).toEqual([
      { date: '2026-03-05', state: 'earned' },
      { date: '2026-03-04', state: 'freeze', reason: 'manual-freeze' },
      { date: '2026-03-03', state: 'earned' },
    ]);
  });

  test('no-freeze break: manual freeze does not apply when weekly freeze limit is 0', () => {
    const result = getStreakStatus([isoOnDay('2026-03-05'), isoOnDay('2026-03-03')], {
      today: new Date('2026-03-05T12:00:00.000Z'),
      weeklyFreezeLimit: 0,
    });

    expect(result.streakDays).toBe(1);
    expect(result.dayStates).toEqual([{ date: '2026-03-05', state: 'earned' }]);
  });

  test('weekend-off preserve: weekend continuity applies when enabled', () => {
    const completions = [isoOnDay('2026-03-02'), isoOnDay('2026-02-27')];

    const withoutWeekendOff = getStreakStatus(completions, {
      today: new Date('2026-03-02T12:00:00.000Z'),
      weeklyFreezeLimit: 0,
      weekendOffEnabled: false,
    });

    const withWeekendOff = getStreakStatus(completions, {
      today: new Date('2026-03-02T12:00:00.000Z'),
      weeklyFreezeLimit: 0,
      weekendOffEnabled: true,
    });

    expect(withoutWeekendOff.streakDays).toBe(1);
    expect(withWeekendOff.streakDays).toBe(4);
    expect(withWeekendOff.dayStates).toEqual([
      { date: '2026-03-02', state: 'earned' },
      { date: '2026-03-01', state: 'freeze', reason: 'weekend-off' },
      { date: '2026-02-28', state: 'freeze', reason: 'weekend-off' },
      { date: '2026-02-27', state: 'earned' },
    ]);
  });
});

describe('getStreakDays', () => {
  test('returns streak day count from status logic', () => {
    const streakDays = getStreakDays([isoOnDay('2026-03-02'), isoOnDay('2026-03-01')], {
      today: new Date('2026-03-02T12:00:00.000Z'),
      weeklyFreezeLimit: 0,
    });

    expect(streakDays).toBe(2);
  });
});
