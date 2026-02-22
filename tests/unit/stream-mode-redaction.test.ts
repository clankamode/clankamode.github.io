import { describe, expect, it } from 'vitest';
import { __streamModeTestUtils } from '@/stream-mode';

describe('stream-mode redaction', () => {
  it('masks emails while preserving domain', () => {
    const out = __streamModeTestUtils.redactString('james@example.com');
    expect(out).toBe('j•••s@example.com');
  });

  it('redacts bearer and jwt-like tokens', () => {
    expect(
      __streamModeTestUtils.redactString('Bearer abcdefghijklmnopqrstuvwxyz0123456789'),
    ).toBe('•••');

    expect(
      __streamModeTestUtils.redactString(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc123def456ghi789.xyz987uvw654rst321',
      ),
    ).toBe('•••');
  });

  it('redacts long numeric identifiers', () => {
    expect(__streamModeTestUtils.redactString('Order 123456789012345678 shipped')).toContain('•••');
  });

  it('deep-redacts sensitive keys in nested objects', () => {
    const input = {
      email: 'james@example.com',
      nested: {
        accessToken: 'abcdefghijklmnopqrstuvwxyz0123456789',
        ok: 'safe-value',
      },
      list: [{ password: 'super-secret' }, { name: 'James' }],
    };

    const output = __streamModeTestUtils.deepRedactForConsole(input) as Record<string, unknown>;
    expect(output.email).toBe('•••');
    expect((output.nested as Record<string, unknown>).accessToken).toBe('•••');
    expect((output.nested as Record<string, unknown>).ok).toBe('safe-value');

    const list = output.list as Array<Record<string, unknown>>;
    expect(list[0].password).toBe('•••');
    expect(list[1].name).toBe('•••');
  });
});
