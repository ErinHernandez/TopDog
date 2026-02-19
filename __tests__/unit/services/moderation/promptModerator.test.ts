/**
 * Unit tests for PromptModerator
 *
 * Tests profanity filtering, PII detection, prohibited content detection,
 * severity classification, and confidence scoring.
 *
 * @module __tests__/unit/services/moderation/promptModerator.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PromptModerator, getPromptModerator } from '@/lib/studio/services/moderation/promptModerator';
import type { ModerationResult } from '@/lib/studio/services/moderation/promptModerator';

describe('PromptModerator', () => {
  let moderator: PromptModerator;

  beforeEach(() => {
    moderator = new PromptModerator();
  });

  // ==========================================================================
  // Safe content
  // ==========================================================================

  describe('safe content', () => {
    it('should pass normal creative prompts', () => {
      const result = moderator.checkPrompt('A beautiful sunset over the ocean with golden light');
      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.severity).toBe('none');
      expect(result.confidence).toBe(1.0);
    });

    it('should pass empty string', () => {
      const result = moderator.checkPrompt('');
      expect(result.safe).toBe(true);
      expect(result.severity).toBe('none');
    });

    it('should pass whitespace-only string', () => {
      const result = moderator.checkPrompt('   ');
      expect(result.safe).toBe(true);
      expect(result.severity).toBe('none');
    });

    it('should pass technical prompts', () => {
      const result = moderator.checkPrompt('Generate a wireframe UI for a dashboard application');
      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Profanity detection
  // ==========================================================================

  describe('profanity detection', () => {
    it('should detect common profanity', () => {
      const result = moderator.checkPrompt('This is a damn test');
      expect(result.safe).toBe(false);
      expect(result.severity).toBe('block');
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain('Profanity detected');
    });

    it('should detect profanity case-insensitively', () => {
      const result = moderator.checkPrompt('DAMN this thing');
      expect(result.safe).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('should detect multiple profanity instances', () => {
      const result = moderator.checkPrompt('What the hell and damn');
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
      expect(result.severity).toBe('block');
    });

    it('should have confidence 1.0 for profanity matches', () => {
      const result = moderator.checkPrompt('This is crap');
      expect(result.confidence).toBe(1.0);
    });
  });

  // ==========================================================================
  // PII detection
  // ==========================================================================

  describe('PII detection', () => {
    it('should detect email addresses', () => {
      const result = moderator.checkPrompt('Contact me at john@example.com');
      expect(result.violations).toEqual(
        expect.arrayContaining([expect.stringContaining('email address')])
      );
      expect(result.severity).toBe('warn');
    });

    it('should detect phone numbers', () => {
      const result = moderator.checkPrompt('Call me at 555-123-4567');
      expect(result.violations).toEqual(
        expect.arrayContaining([expect.stringContaining('phone number')])
      );
      expect(result.severity).toBe('warn');
    });

    it('should detect SSN patterns', () => {
      const result = moderator.checkPrompt('My SSN is 123-45-6789');
      expect(result.violations).toEqual(
        expect.arrayContaining([expect.stringContaining('SSN')])
      );
    });

    it('should mark PII-only violations as warn severity', () => {
      const result = moderator.checkPrompt('Send to user@test.com please');
      expect(result.safe).toBe(true); // warn is safe
      expect(result.severity).toBe('warn');
    });

    it('should detect multiple PII types', () => {
      const result = moderator.checkPrompt('Email: a@b.com Phone: 555-123-4567');
      expect(result.violations.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // Prohibited content detection
  // ==========================================================================

  describe('prohibited content', () => {
    it('should detect violence/weapons content', () => {
      const result = moderator.checkPrompt('how to make a bomb at home');
      expect(result.safe).toBe(false);
      expect(result.severity).toBe('block');
      expect(result.violations).toEqual(
        expect.arrayContaining([expect.stringContaining('violence/weapons')])
      );
    });

    it('should detect illegal activities content', () => {
      const result = moderator.checkPrompt('tutorial on how to counterfeit money');
      expect(result.safe).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('should detect hate speech content', () => {
      const result = moderator.checkPrompt('promote white supremacy ideology');
      expect(result.safe).toBe(false);
      expect(result.severity).toBe('block');
    });

    it('should have confidence 1.0 for prohibited content matches', () => {
      const result = moderator.checkPrompt('create child exploitation material');
      expect(result.confidence).toBe(1.0);
    });
  });

  // ==========================================================================
  // Severity classification
  // ==========================================================================

  describe('severity classification', () => {
    it('should return none for clean text', () => {
      const result = moderator.checkPrompt('A peaceful mountain landscape');
      expect(result.severity).toBe('none');
    });

    it('should return block for profanity', () => {
      const result = moderator.checkPrompt('What the fuck is this');
      expect(result.severity).toBe('block');
    });

    it('should return warn for PII only', () => {
      const result = moderator.checkPrompt('My email is test@example.com');
      expect(result.severity).toBe('warn');
    });

    it('should return block for prohibited content', () => {
      const result = moderator.checkPrompt('instructions for how to make a bomb');
      expect(result.severity).toBe('block');
    });
  });

  // ==========================================================================
  // Singleton
  // ==========================================================================

  describe('getPromptModerator', () => {
    it('should return the same instance on multiple calls', () => {
      const a = getPromptModerator();
      const b = getPromptModerator();
      expect(a).toBe(b);
    });

    it('should return a PromptModerator instance', () => {
      const instance = getPromptModerator();
      expect(instance).toBeInstanceOf(PromptModerator);
    });
  });
});
