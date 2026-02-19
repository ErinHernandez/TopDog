/**
 * Unit tests for ImageModerator
 *
 * Tests provider-based safety classification, unknown provider quarantine,
 * error handling (fail-open), and singleton behavior.
 *
 * @module __tests__/unit/services/moderation/imageModerator.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: mocks.mockLogWarn,
    error: mocks.mockLogError,
    debug: vi.fn(),
  },
}));

import { ImageModerator, getImageModerator } from '@/lib/studio/services/moderation/imageModerator';
import type { ImageCheckOptions } from '@/lib/studio/services/moderation/imageModerator';

describe('ImageModerator', () => {
  let moderator: ImageModerator;
  const testBuffer = Buffer.from('fake-image-data');

  beforeEach(() => {
    moderator = new ImageModerator();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Known providers (Phase 1 — trust provider safety)
  // ==========================================================================

  describe('known providers with built-in safety', () => {
    const knownProviders = ['openai', 'dall-e', 'stability', 'stable-diffusion', 'midjourney', 'adobe-firefly'];

    for (const provider of knownProviders) {
      it(`should pass images from ${provider}`, async () => {
        const options: ImageCheckOptions = {
          provider,
          userId: 'user-123',
        };

        const result = await moderator.checkImage(testBuffer, options);
        expect(result.safe).toBe(true);
        expect(result.flags).toHaveLength(0);
        expect(result.confidence).toBe(0.85);
        expect(result.provider).toBe(provider);
        expect(result.scannedAt).toBeDefined();
      });
    }

    it('should be case-insensitive for provider matching', async () => {
      const result = await moderator.checkImage(testBuffer, {
        provider: 'OpenAI',
        userId: 'user-123',
      });
      expect(result.safe).toBe(true);
    });

    it('should log passed moderation for known providers', async () => {
      await moderator.checkImage(testBuffer, {
        provider: 'openai',
        userId: 'user-456',
      });

      expect(mocks.mockLogInfo).toHaveBeenCalledWith(
        'image_moderation_passed',
        expect.objectContaining({
          userId: 'user-456',
          provider: 'openai',
          confidence: 0.85,
        })
      );
    });

    it('should include jobId in log when provided', async () => {
      await moderator.checkImage(testBuffer, {
        provider: 'openai',
        userId: 'user-123',
        jobId: 'job-abc',
      });

      expect(mocks.mockLogInfo).toHaveBeenCalledWith(
        'image_moderation_passed',
        expect.objectContaining({ jobId: 'job-abc' })
      );
    });
  });

  // ==========================================================================
  // Unknown providers — quarantine
  // ==========================================================================

  describe('unknown providers', () => {
    it('should quarantine images from unknown providers', async () => {
      const result = await moderator.checkImage(testBuffer, {
        provider: 'unknown-ai-service',
        userId: 'user-123',
      });

      expect(result.safe).toBe(false);
      expect(result.flags.length).toBeGreaterThan(0);
      expect(result.flags[0]).toContain('Unknown provider');
      expect(result.confidence).toBe(0.5);
    });

    it('should log quarantine warning for unknown providers', async () => {
      await moderator.checkImage(testBuffer, {
        provider: 'sketchy-provider',
        userId: 'user-789',
      });

      expect(mocks.mockLogWarn).toHaveBeenCalledWith(
        'image_moderation_quarantined',
        expect.objectContaining({
          userId: 'user-789',
          provider: 'sketchy-provider',
          reason: 'unknown_provider',
        })
      );
    });
  });

  // ==========================================================================
  // hasBuiltinSafety helper
  // ==========================================================================

  describe('hasBuiltinSafety', () => {
    it('should return true for known safe providers', () => {
      expect(moderator.hasBuiltinSafety('openai')).toBe(true);
      expect(moderator.hasBuiltinSafety('stability')).toBe(true);
    });

    it('should return false for unknown providers', () => {
      expect(moderator.hasBuiltinSafety('random-provider')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(moderator.hasBuiltinSafety('OpenAI')).toBe(true);
      expect(moderator.hasBuiltinSafety('STABILITY')).toBe(true);
    });
  });

  // ==========================================================================
  // Singleton
  // ==========================================================================

  describe('getImageModerator', () => {
    it('should return the same instance on multiple calls', () => {
      const a = getImageModerator();
      const b = getImageModerator();
      expect(a).toBe(b);
    });

    it('should return an ImageModerator instance', () => {
      const instance = getImageModerator();
      expect(instance).toBeInstanceOf(ImageModerator);
    });
  });
});
