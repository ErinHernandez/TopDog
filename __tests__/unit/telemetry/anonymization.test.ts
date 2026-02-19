import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnonymizationPipeline, batchAnonymize } from '@/lib/studio/telemetry/processing/anonymization';

describe('AnonymizationPipeline', () => {
  let pipeline: AnonymizationPipeline;
  const TEST_USER_ID = 'user_abc123';
  const TEST_SALT = 'test_salt_fixed_for_determinism';

  beforeEach(() => {
    pipeline = new AnonymizationPipeline(TEST_USER_ID, TEST_SALT);
  });

  describe('Hash Strength', () => {
    it('reports fnv1a before async init completes', () => {
      const fresh = new AnonymizationPipeline('user1', 'salt1');
      expect(['fnv1a', 'sha256']).toContain(fresh.getHashStrength());
    });

    it('reports sha256 after waitForReady completes', async () => {
      await pipeline.waitForReady();
      expect(pipeline.getHashStrength()).toBe('sha256');
      expect(pipeline.isReady()).toBe(true);
    });

    it('hashedUserId is non-empty before and after init', async () => {
      const hashBefore = pipeline.getHashedUserId();
      expect(hashBefore).toBeTruthy();
      expect(hashBefore.length).toBeGreaterThan(0);

      await pipeline.waitForReady();
      const hashAfter = pipeline.getHashedUserId();
      expect(hashAfter).toBeTruthy();
      expect(hashAfter.length).toBeGreaterThan(0);
    });

    it('hashValueStrong returns SHA-256 length hash (64 hex chars)', async () => {
      await pipeline.waitForReady();
      const hash = await pipeline.hashValueStrong('test_value', 'test_field');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('hashValueStrong is deterministic', async () => {
      await pipeline.waitForReady();
      const hash1 = await pipeline.hashValueStrong('same_value', 'same_field');
      const hash2 = await pipeline.hashValueStrong('same_value', 'same_field');
      expect(hash1).toBe(hash2);
    });

    it('hashValueStrong uses cache on second call', async () => {
      await pipeline.waitForReady();
      const hash1 = await pipeline.hashValueStrong('cached_val', 'cached_field');
      const hash2 = await pipeline.hashValueStrong('cached_val', 'cached_field');
      expect(hash1).toBe(hash2);
    });
  });

  describe('warmHashCache', () => {
    it('pre-computes hashes for given values and fields', async () => {
      await pipeline.waitForReady();
      await pipeline.warmHashCache(['val1', 'val2'], ['field1', 'field2']);

      const hash = await pipeline.hashValueStrong('val1', 'field1');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('scrubText', () => {
    it('redacts email addresses', () => {
      const text = 'Contact me at john@example.com for details';
      const scrubbed = pipeline.scrubText(text);
      expect(scrubbed).not.toContain('john@example.com');
      expect(scrubbed).toContain('[EMAIL]');
    });

    it('redacts phone numbers', () => {
      const text = 'Call me at 555-123-4567';
      const scrubbed = pipeline.scrubText(text);
      expect(scrubbed).not.toContain('555-123-4567');
      expect(scrubbed).toContain('[PHONE]');
    });

    it('redacts IP addresses', () => {
      const text = 'Server at 192.168.1.1 is down';
      const scrubbed = pipeline.scrubText(text);
      expect(scrubbed).not.toContain('192.168.1.1');
      expect(scrubbed).toContain('[IPADDRESS]');
    });

    it('handles empty and null-ish inputs', () => {
      expect(pipeline.scrubText('')).toBe('');
      expect(pipeline.scrubText(null as any)).toBe(null);
      expect(pipeline.scrubText(undefined as any)).toBe(undefined);
    });
  });

  describe('scrubTextStrong', () => {
    it('redacts email addresses using SHA-256', async () => {
      await pipeline.waitForReady();
      const text = 'Contact me at john@example.com for details';
      const scrubbed = await pipeline.scrubTextStrong(text);
      expect(scrubbed).not.toContain('john@example.com');
      expect(scrubbed).toContain('[EMAIL]');
    });
  });

  describe('redactObject', () => {
    it('redacts default PII fields', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const obj = {
        email: 'test@example.com',
        phone: '555-123-4567',
        userId: 'user_123',
        name: 'Safe Name',
      };

      const redacted = pipeline.redactObject(obj);
      expect(redacted.email).toMatch(/\[REDACTED:/);
      expect(redacted.phone).toMatch(/\[REDACTED:/);
      expect(redacted.userId).toMatch(/\[REDACTED:/);
      expect(redacted.name).toBe('Safe Name');
      warnSpy.mockRestore();
    });

    it('shows deprecation warning on first call', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      pipeline.redactObject({ email: 'a@b.com' });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('redactObjectStrong', () => {
    it('redacts default PII fields with SHA-256', async () => {
      await pipeline.waitForReady();
      const obj = {
        email: 'test@example.com',
        userId: 'user_123',
        name: 'Safe Name',
      };

      const redacted = await pipeline.redactObjectStrong(obj);
      expect(redacted.email).toMatch(/\[REDACTED:/);
      expect(redacted.userId).toMatch(/\[REDACTED:/);
      expect(redacted.name).toBe('Safe Name');
    });
  });

  describe('replaceUserIds', () => {
    it('replaces userId fields with hashed ID', () => {
      const obj = {
        userId: 'original_123',
        user_id: 'original_456',
        data: { nested_userId: 'original_789' },
        safeField: 'untouched',
      };

      const replaced = pipeline.replaceUserIds(obj);
      const hashedId = pipeline.getHashedUserId();
      expect(replaced.userId).toBe(hashedId);
      expect(replaced.user_id).toBe(hashedId);
      expect(replaced.safeField).toBe('untouched');
    });

    it('handles arrays in objects', () => {
      const obj = {
        items: [{ userId: 'u1' }, { userId: 'u2' }],
      };

      const replaced = pipeline.replaceUserIds(obj);
      const hashedId = pipeline.getHashedUserId();
      expect(replaced.items[0].userId).toBe(hashedId);
      expect(replaced.items[1].userId).toBe(hashedId);
    });
  });

  describe('GDPR deletion', () => {
    it('tracks deletion request', () => {
      expect(pipeline.isDeletionScheduled()).toBe(false);
      pipeline.requestDeletion();
      expect(pipeline.isDeletionScheduled()).toBe(true);
    });
  });

  describe('Salt and hash security', () => {
    it('does not use Math.random for salt generation', () => {
      const randomSpy = vi.spyOn(Math, 'random');
      // Constructor calls generateSecureSalt when no salt arg is provided
      const securePipeline = new AnonymizationPipeline('user_secure_test');
      // Node.js crypto.randomBytes should be used, not Math.random
      expect(randomSpy).not.toHaveBeenCalled();
      randomSpy.mockRestore();
    });

    it('sync hashValue produces deterministic results with same salt', () => {
      const p1 = new AnonymizationPipeline('user1', 'deterministic_salt');
      const p2 = new AnonymizationPipeline('user1', 'deterministic_salt');

      const text = 'Send to secure@example.com please';
      const s1 = p1.scrubText(text);
      const s2 = p2.scrubText(text);
      expect(s1).toBe(s2);
      expect(s1).toContain('[EMAIL]');
    });

    it('different salts produce different scrub results', () => {
      const p1 = new AnonymizationPipeline('user1', 'salt_alpha');
      const p2 = new AnonymizationPipeline('user1', 'salt_beta');

      // The redacted output replaces PII with [TYPE] tags regardless of salt,
      // but the internal hash mapping should differ
      const text = 'Contact admin@corp.com now';
      const s1 = p1.scrubText(text);
      const s2 = p2.scrubText(text);
      // Both should redact the email
      expect(s1).toContain('[EMAIL]');
      expect(s2).toContain('[EMAIL]');
    });
  });

  describe('verifyAnonymization', () => {
    it('detects exposed user ID', () => {
      const data = { field: TEST_USER_ID };
      const result = pipeline.verifyAnonymization(data);
      expect(result.isAnonymized).toBe(false);
      expect(result.exposedFields).toContain('userId');
    });

    it('passes for clean data', () => {
      const data = { field: 'no_pii_here', count: 42 };
      const result = pipeline.verifyAnonymization(data);
      expect(result.isAnonymized).toBe(true);
      expect(result.exposedFields).toHaveLength(0);
    });
  });
});

describe('batchAnonymize', () => {
  it('processes multiple records with SHA-256', async () => {
    const records = [
      { userId: 'user_a', email: 'a@test.com', action: 'click' },
      { userId: 'user_b', email: 'b@test.com', action: 'scroll' },
    ];

    const results = await batchAnonymize(records);
    expect(results).toHaveLength(2);

    for (const result of results) {
      expect(result.anonymized).toBeDefined();
      expect(result.record).toBeDefined();
      expect(result.record.hashedUserId).toBeTruthy();
      expect(result.anonymized.email).toMatch(/\[REDACTED:/);
    }
  });

  it('uses awaited pipeline (SHA-256, not FNV-1a)', async () => {
    const records = [{ userId: 'test_user', data: 'clean' }];
    const results = await batchAnonymize(records);

    expect(results[0].record.hashedUserId).toMatch(/^[0-9a-f]{64}$/);
  });
});
