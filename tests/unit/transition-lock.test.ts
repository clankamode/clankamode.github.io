import { describe, expect, it } from 'vitest';
import { createTransitionLock } from '@/lib/transition-lock';

describe('transition lock', () => {
  it('acquires and releases advancing transitions', () => {
    const lock = createTransitionLock();

    expect(lock.getStatus()).toBe('ready');
    expect(lock.acquire('advancing')).toBe(true);
    expect(lock.getStatus()).toBe('advancing');
    expect(lock.acquire('advancing')).toBe(false);

    lock.release();
    expect(lock.getStatus()).toBe('ready');
  });

  it('blocks a finalizing transition while advancing is active', () => {
    const lock = createTransitionLock();

    expect(lock.acquire('advancing')).toBe(true);
    expect(lock.acquire('finalizing')).toBe(false);

    lock.release();
    expect(lock.acquire('finalizing')).toBe(true);
    expect(lock.getStatus()).toBe('finalizing');
  });
});

