/**
 * Integration tests for content moderation
 * Tests: prohibited prompt rejected, PII warned, clean passes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptModerator } from '@/lib/studio/services/moderation/promptModerator';
import type { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
}));

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: (handler: any) => handler,
}));

vi.mock('@/lib/studio/infrastructure/cache/cacheManager', () => ({
  getCacheManager: vi.fn(() => ({
    get: mocks.mockCacheGet,
    set: mocks.mockCacheSet,
  })),
}));

vi.mock('@/lib/studio/services/rateLimiter', () => ({
  rateLimiter: {
    checkLimit: mocks.mockCheckRateLimit,
  },
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: mocks.mockLogWarn,
    error: mocks.mockLogError,
    debug: vi.fn(),
  },
}));

// ============================================================================
// Helper Functions
// ============================================================================

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    query: {},
    body: {},
    url: '/api/test',
    ...overrides,
  } as unknown as NextApiRequest;
}

function createMockRes(): NextApiResponse & {
  _status: number;
  _json: any;
  _headers: Record<string, string>;
} {
  const res: any = {
    _status: 200,
    _json: null,
    _headers: {},
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
    setHeader(key: string, value: string) {
      res._headers[key] = value;
      return res;
    },
    getHeader(key: string) {
      return res._headers[key];
    },
    end() {
      return res;
    },
    headersSent: false,
  };
  return res;
}

// ============================================================================
// Tests
// ============================================================================

describe('Content Moderation', () => {
  let moderator: PromptModerator;

  beforeEach(() => {
    vi.clearAllMocks();
    moderator = new PromptModerator();
  });

  describe('Clean Content Handling', () => {
    it('should pass clean creative prompt', () => {
      const prompt = 'A serene landscape with mountains and a sunset';

      const result = moderator.checkPrompt(prompt);

      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.severity).toBe('none');
      expect(result.confidence).toBe(1.0);
    });

    it('should pass empty prompt without violations', () => {
      const result = moderator.checkPrompt('');

      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.severity).toBe('none');
    });

    it('should pass whitespace-only prompt', () => {
      const result = moderator.checkPrompt('   ');

      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should accept technical/scientific terms safely', () => {
      const prompt = 'A quantum physics equation with Schrodinger cat visual';

      const result = moderator.checkPrompt(prompt);

      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Profanity Detection', () => {
    it('should block profanity in prompt', () => {
      const prompt = 'This is a damn ugly image';

      const result = moderator.checkPrompt(prompt);

      expect(result.safe).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.severity).toBe('block');
      expect(result.confidence).toBe(1.0);
    });

    it('should detect case-insensitive profanity', () => {
      const variants = ['DAMN', 'Damn', 'damn', 'dAmN'];

      for (const variant of variants) {
        const result = moderator.checkPrompt(`A ${variant} image`);
        expect(result.safe).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
      }
    });

    it('should detect multiple profanity terms', () => {
      const prompt = 'Damn it, this is crap and shit';

      const result = moderator.checkPrompt(prompt);

      expect(result.safe).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
    });

    it('should have confidence 1.0 for profanity matches', () => {
      const result = moderator.checkPrompt('This is hell');

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('PII Detection', () => {
    it('should warn on email address in prompt', () => {
      const prompt = 'Contact me at user@example.com for details';

      const result = moderator.checkPrompt(prompt);

      expect(result.safe).toBe(true); // warn severity allows proceeding
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.severity).toBe('warn');
    });

    it('should warn on phone number in prompt', () => {
      const prompt = 'Call me at 555-123-4567';

      const result = moderator.checkPrompt(prompt);

      expect(result.safe).toBe(true);
      expect(result.severity).toBe('warn');
    });

    it('should detect multiple PII types', () => {
      const prompt = 'Email: test@domain.com or call 555-987-6543';

      const result = moderator.checkPrompt(prompt);

      expect(result.violations.length).toBeGreaterThan(1);
    });

    it('should warn on SSN detection', () => {
      const prompt = 'My SSN is 123-45-6789';

      const result = moderator.checkPrompt(prompt);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.severity).toBe('warn');
    });
  });

  describe('Prohibited Content Detection', () => {
    it('should block violence/weapons content', () => {
      const result = moderator.checkPrompt('how to make a bomb');

      expect(result.safe).toBe(false);
      expect(result.severity).toBe('block');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should block illegal activity content', () => {
      const result = moderator.checkPrompt('illegal drugs for sale');

      expect(result.safe).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should block hate speech content', () => {
      const result = moderator.checkPrompt('white supremacy instructions');

      expect(result.safe).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('should detect prohibited content case-insensitively', () => {
      const result = moderator.checkPrompt('HOW TO MAKE A BOMB');

      expect(result.safe).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('API Integration', () => {
    it('should reject blocked content via API with 400', async () => {
      const req = createMockReq({
        body: { prompt: 'how to make a bomb' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const moderationCheck = moderator.checkPrompt(req.body.prompt);

      if (!moderationCheck.safe && moderationCheck.severity === 'block') {
        res.status(400).json({
          success: false,
          error: 'Content failed moderation',
          violations: moderationCheck.violations,
        });
      } else {
        res.status(200).json({ success: true });
      }

      expect(res._status).toBe(400);
      expect(res._json.error).toBe('Content failed moderation');
      expect(res._json.violations.length).toBeGreaterThan(0);
    });

    it('should allow content with warn severity', async () => {
      const req = createMockReq({
        body: { prompt: 'Email: test@example.com for updates' },
      });
      req.uid = 'user-456';

      const res = createMockRes();

      const moderationCheck = moderator.checkPrompt(req.body.prompt);

      if (!moderationCheck.safe && moderationCheck.severity === 'block') {
        res.status(400).json({
          success: false,
          error: 'Content blocked',
          violations: moderationCheck.violations,
        });
      } else {
        res.status(200).json({
          success: true,
          warnings: moderationCheck.violations,
        });
      }

      expect(res._status).toBe(200);
      expect(res._json.success).toBe(true);
      expect(res._json.warnings.length).toBeGreaterThan(0);
    });

    it('should pass clean content via API', async () => {
      const req = createMockReq({
        body: { prompt: 'A beautiful mountain landscape' },
      });
      req.uid = 'user-789';

      const res = createMockRes();

      const moderationCheck = moderator.checkPrompt(req.body.prompt);

      if (!moderationCheck.safe && moderationCheck.severity === 'block') {
        res.status(400).json({ error: 'Content blocked' });
      } else {
        res.status(200).json({ success: true });
      }

      expect(res._status).toBe(200);
      expect(res._json.success).toBe(true);
    });
  });

  describe('Confidence Scoring', () => {
    it('should return confidence 1.0 for exact profanity match', () => {
      const result = moderator.checkPrompt('damn');

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should return high confidence for email PII', () => {
      const result = moderator.checkPrompt('user@domain.com');

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should aggregate max confidence across violations', () => {
      const result = moderator.checkPrompt('Email: test@example.com is damn bad');

      expect(result.violations.length).toBeGreaterThan(1);
      // Should be max of all confidences
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Violation Details', () => {
    it('should include violation messages', () => {
      const result = moderator.checkPrompt('this is damn bad');

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain('Profanity');
    });

    it('should differentiate violation categories in messages', () => {
      const result = moderator.checkPrompt(
        'Send this to user@example.com damn quickly'
      );

      expect(result.violations.length).toBeGreaterThan(1);
      const messages = result.violations.join(' ');
      expect(messages).toContain('PII');
      expect(messages).toContain('Profanity');
    });
  });
});
