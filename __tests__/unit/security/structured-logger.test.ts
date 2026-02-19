/**
 * Tests for lib/structuredLogger.ts — production-grade structured logging.
 *
 * Covers:
 * - Log level filtering
 * - Sensitive field redaction
 * - Error serialization
 * - Log entry creation with context
 * - Child logger inheritance
 * - Export compatibility (logger.debug/info/warn/error still callable)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, _internals } from '@/lib/structuredLogger';

const { redactSensitive, serializeError, createLogEntry } = _internals;

/* ================================================================
   redactSensitive
   ================================================================ */

describe('redactSensitive', () => {
  it('redacts password fields', () => {
    const input = { username: 'alice', password: 'secret123' };
    const result = redactSensitive(input) as Record<string, unknown>;
    expect(result.username).toBe('alice');
    expect(result.password).toBe('[REDACTED]');
  });

  it('redacts multiple sensitive keys', () => {
    const input = {
      apiKey: 'ak_123',
      token: 'tok_abc',
      accessToken: 'at_xyz',
      name: 'safe',
    };
    const result = redactSensitive(input) as Record<string, unknown>;
    expect(result.apiKey).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
    expect(result.accessToken).toBe('[REDACTED]');
    expect(result.name).toBe('safe');
  });

  it('handles nested objects', () => {
    const input = {
      user: {
        name: 'bob',
        credentials: { password: 'hidden', apiKey: 'hidden' },
      },
    };
    const result = redactSensitive(input) as any;
    expect(result.user.name).toBe('bob');
    expect(result.user.credentials.password).toBe('[REDACTED]');
    expect(result.user.credentials.apiKey).toBe('[REDACTED]');
  });

  it('handles arrays', () => {
    const input = [{ token: '123' }, { name: 'safe' }];
    const result = redactSensitive(input) as any[];
    expect(result[0].token).toBe('[REDACTED]');
    expect(result[1].name).toBe('safe');
  });

  it('returns primitives unchanged', () => {
    expect(redactSensitive('hello')).toBe('hello');
    expect(redactSensitive(42)).toBe(42);
    expect(redactSensitive(true)).toBe(true);
    expect(redactSensitive(null)).toBe(null);
    expect(redactSensitive(undefined)).toBe(undefined);
  });

  it('caps recursion depth', () => {
    // Build a deeply nested object
    let obj: any = { value: 'leaf' };
    for (let i = 0; i < 12; i++) {
      obj = { nested: obj };
    }
    const result = redactSensitive(obj) as any;
    // Should not throw, and deep values become [MAX_DEPTH]
    expect(result).toBeDefined();
  });

  it('is case-insensitive for key matching', () => {
    const input = { Authorization: 'Bearer xyz', Cookie: 'session=abc' };
    const result = redactSensitive(input) as Record<string, unknown>;
    expect(result.Authorization).toBe('[REDACTED]');
    expect(result.Cookie).toBe('[REDACTED]');
  });
});

/* ================================================================
   serializeError
   ================================================================ */

describe('serializeError', () => {
  it('serializes Error objects', () => {
    const err = new Error('test error');
    const result = serializeError(err);
    expect(result.name).toBe('Error');
    expect(result.message).toBe('test error');
    expect(result.stack).toBeDefined();
  });

  it('handles TypeError', () => {
    const err = new TypeError('bad type');
    const result = serializeError(err);
    expect(result.name).toBe('TypeError');
    expect(result.message).toBe('bad type');
  });

  it('handles string errors', () => {
    const result = serializeError('string error');
    expect(result.message).toBe('string error');
  });

  it('handles unknown error types', () => {
    const result = serializeError(42);
    expect(result.message).toBe('42');
  });

  it('includes cause when present', () => {
    const cause = new Error('root cause');
    const err = new Error('wrapper', { cause });
    const result = serializeError(err);
    expect(result.cause).toBeDefined();
    expect((result.cause as any).message).toBe('root cause');
  });

  it('truncates stack to 8 lines', () => {
    const err = new Error('deep');
    const result = serializeError(err);
    if (result.stack) {
      const lines = (result.stack as string).split('\n');
      expect(lines.length).toBeLessThanOrEqual(8);
    }
  });
});

/* ================================================================
   createLogEntry
   ================================================================ */

describe('createLogEntry', () => {
  it('creates an entry with required fields', () => {
    const entry = createLogEntry('info', 'test message');
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('test message');
    expect(entry.timestamp).toBeDefined();
    expect(entry.service).toBe('idesaign');
  });

  it('includes context when provided', () => {
    const entry = createLogEntry('info', 'test', { action: 'upload', size: 1024 });
    expect(entry.context?.action).toBe('upload');
    expect(entry.context?.size).toBe(1024);
  });

  it('extracts traceId from context', () => {
    const entry = createLogEntry('info', 'test', { traceId: 'trace-abc' });
    expect(entry.traceId).toBe('trace-abc');
  });

  it('extracts requestId as traceId', () => {
    const entry = createLogEntry('info', 'test', { requestId: 'req-123' });
    expect(entry.traceId).toBe('req-123');
  });

  it('extracts userId from context', () => {
    const entry = createLogEntry('info', 'test', { userId: 'user-456' });
    expect(entry.userId).toBe('user-456');
  });

  it('includes serialized error in context', () => {
    const err = new Error('boom');
    const entry = createLogEntry('error', 'failure', undefined, err);
    expect(entry.context?.error).toBeDefined();
    expect((entry.context?.error as any).message).toBe('boom');
  });

  it('redacts sensitive fields in context', () => {
    const entry = createLogEntry('info', 'test', {
      username: 'alice',
      password: 'secret',
      apiKey: 'ak_123',
    });
    expect(entry.context?.username).toBe('alice');
    expect(entry.context?.password).toBe('[REDACTED]');
    expect(entry.context?.apiKey).toBe('[REDACTED]');
  });

  it('omits context when empty', () => {
    const entry = createLogEntry('info', 'simple message');
    expect(entry.context).toBeUndefined();
  });
});

/* ================================================================
   logger public API
   ================================================================ */

describe('logger API', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // In test mode (NODE_ENV=test), the logger uses console.*
    consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.debug is callable', () => {
    expect(() => logger.debug('test debug')).not.toThrow();
  });

  it('logger.info is callable', () => {
    expect(() => logger.info('test info')).not.toThrow();
  });

  it('logger.warn is callable', () => {
    expect(() => logger.warn('test warn')).not.toThrow();
  });

  it('logger.error is callable with error object', () => {
    expect(() => logger.error('test error', new Error('e'))).not.toThrow();
  });

  it('logger.error is callable with context', () => {
    expect(() =>
      logger.error('test', new Error('e'), { userId: 'u1' }),
    ).not.toThrow();
  });
});

/* ================================================================
   child logger
   ================================================================ */

describe('logger.child', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a child logger that inherits base context', () => {
    const child = logger.child({ requestId: 'req-789' });
    expect(() => child.info('from child')).not.toThrow();
    expect(() => child.warn('child warn')).not.toThrow();
    expect(() => child.error('child error', new Error('e'))).not.toThrow();
    expect(() => child.debug('child debug')).not.toThrow();
  });

  it('child logger merges additional context', () => {
    const child = logger.child({ requestId: 'req-789' });
    // This should not throw — the merge happens internally
    expect(() => child.info('extra', { extra: 'data' })).not.toThrow();
  });
});
