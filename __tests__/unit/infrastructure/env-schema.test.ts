/**
 * Tests for environment variable schema validation.
 * @phase 35
 */

import { describe, it, expect } from 'vitest';
import { serverSchema, clientSchema } from '@/lib/studio/infrastructure/env/schema';

describe('serverSchema', () => {
  it('parses empty env with defaults', () => {
    const result = serverSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.LOG_LEVEL).toBe('info');
      expect(result.data.CORS_ALLOWED_ORIGINS).toBe('http://localhost:3000');
      expect(result.data.ADMIN_UIDS).toEqual([]);
      expect(result.data.ALLOWED_EXTERNAL_DOMAINS).toEqual([]);
    }
  });

  it('parses ADMIN_UIDS as comma-separated array', () => {
    const result = serverSchema.safeParse({
      ADMIN_UIDS: 'uid1, uid2, uid3',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ADMIN_UIDS).toEqual(['uid1', 'uid2', 'uid3']);
    }
  });

  it('parses empty ADMIN_UIDS as empty array', () => {
    const result = serverSchema.safeParse({ ADMIN_UIDS: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ADMIN_UIDS).toEqual([]);
    }
  });

  it('rejects invalid NODE_ENV', () => {
    const result = serverSchema.safeParse({ NODE_ENV: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts valid NODE_ENV values', () => {
    for (const env of ['development', 'production', 'test']) {
      const result = serverSchema.safeParse({ NODE_ENV: env });
      expect(result.success).toBe(true);
    }
  });

  it('accepts valid LOG_LEVEL values', () => {
    for (const level of ['debug', 'info', 'warn', 'error']) {
      const result = serverSchema.safeParse({ LOG_LEVEL: level });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid LOG_LEVEL', () => {
    const result = serverSchema.safeParse({ LOG_LEVEL: 'trace' });
    expect(result.success).toBe(false);
  });

  it('transforms positive integer strings', () => {
    const result = serverSchema.safeParse({
      AI_BUDGET_LIMIT_PER_DAY: '100',
      MAX_UPLOAD_SIZE_MB: '50',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.AI_BUDGET_LIMIT_PER_DAY).toBe(100);
      expect(result.data.MAX_UPLOAD_SIZE_MB).toBe(50);
    }
  });

  it('collapses empty optional strings to undefined', () => {
    const result = serverSchema.safeParse({
      STRIPE_SECRET_KEY: '',
      OPENAI_API_KEY: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.STRIPE_SECRET_KEY).toBeUndefined();
      expect(result.data.OPENAI_API_KEY).toBeUndefined();
    }
  });

  it('preserves non-empty optional strings', () => {
    const result = serverSchema.safeParse({
      STRIPE_SECRET_KEY: 'sk_test_abc123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.STRIPE_SECRET_KEY).toBe('sk_test_abc123');
    }
  });
});

describe('clientSchema', () => {
  it('parses empty env with defaults', () => {
    const result = clientSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NEXT_PUBLIC_BASE_URL).toBe('http://localhost:3000');
      expect(result.data.NEXT_PUBLIC_ENVIRONMENT).toBe('development');
      expect(result.data.NEXT_PUBLIC_ENABLE_RETOUCH_AI).toBe(false);
      expect(result.data.NEXT_PUBLIC_AI_DEBUG).toBe(false);
    }
  });

  it('transforms boolean strings correctly', () => {
    const result = clientSchema.safeParse({
      NEXT_PUBLIC_ENABLE_RETOUCH_AI: 'true',
      NEXT_PUBLIC_AI_DEBUG: 'false',
      NEXT_PUBLIC_ENABLE_RETOUCH_TELEMETRY: '1',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NEXT_PUBLIC_ENABLE_RETOUCH_AI).toBe(true);
      expect(result.data.NEXT_PUBLIC_AI_DEBUG).toBe(false);
      expect(result.data.NEXT_PUBLIC_ENABLE_RETOUCH_TELEMETRY).toBe(true);
    }
  });

  it('accepts valid environment values', () => {
    for (const env of ['development', 'staging', 'production']) {
      const result = clientSchema.safeParse({ NEXT_PUBLIC_ENVIRONMENT: env });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid environment', () => {
    const result = clientSchema.safeParse({ NEXT_PUBLIC_ENVIRONMENT: 'qa' });
    expect(result.success).toBe(false);
  });

  it('parses positive integers from strings', () => {
    const result = clientSchema.safeParse({
      NEXT_PUBLIC_MAX_FILE_SIZE: '52428800',
      NEXT_PUBLIC_UPLOAD_TIMEOUT: '30000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NEXT_PUBLIC_MAX_FILE_SIZE).toBe(52428800);
      expect(result.data.NEXT_PUBLIC_UPLOAD_TIMEOUT).toBe(30000);
    }
  });
});
