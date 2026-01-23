/**
 * Tests for lib/integrity/validation.ts
 *
 * Tests input validation for admin integrity API routes
 */

import {
  isValidAction,
  isValidTargetType,
  isValidDraftId,
  isValidPairId,
  isValidUserId,
  sanitizeString,
  validateAdminActionRequest,
  validatePaginationParams,
  VALID_ACTIONS,
  VALID_TARGET_TYPES,
} from '@/lib/integrity/validation';

describe('validation', () => {
  describe('isValidAction', () => {
    it('should return true for valid actions', () => {
      VALID_ACTIONS.forEach(action => {
        expect(isValidAction(action)).toBe(true);
      });
    });

    it('should return false for invalid actions', () => {
      expect(isValidAction('invalid')).toBe(false);
      expect(isValidAction('')).toBe(false);
      expect(isValidAction('clear')).toBe(false); // missing 'd'
      expect(isValidAction('CLEARED')).toBe(false); // case sensitive
    });
  });

  describe('isValidTargetType', () => {
    it('should return true for valid target types', () => {
      VALID_TARGET_TYPES.forEach(type => {
        expect(isValidTargetType(type)).toBe(true);
      });
    });

    it('should return false for invalid target types', () => {
      expect(isValidTargetType('invalid')).toBe(false);
      expect(isValidTargetType('')).toBe(false);
      expect(isValidTargetType('DRAFT')).toBe(false); // case sensitive
    });
  });

  describe('isValidDraftId', () => {
    it('should return true for valid draft IDs', () => {
      expect(isValidDraftId('abc123def456ghi789jkl')).toBe(true);
      expect(isValidDraftId('draft_12345678901234567890')).toBe(true);
      expect(isValidDraftId('a'.repeat(20))).toBe(true);
    });

    it('should return false for invalid draft IDs', () => {
      expect(isValidDraftId('')).toBe(false);
      expect(isValidDraftId('short')).toBe(false); // too short
      expect(isValidDraftId('abc@123')).toBe(false); // invalid character
      expect(isValidDraftId(null as any)).toBe(false);
      expect(isValidDraftId(undefined as any)).toBe(false);
    });
  });

  describe('isValidPairId', () => {
    it('should return true for valid pair IDs', () => {
      expect(isValidPairId('user1_user2')).toBe(true);
      expect(isValidPairId('abc123_def456')).toBe(true);
      expect(isValidPairId('user-id-1_user-id-2')).toBe(true);
    });

    it('should return false for invalid pair IDs', () => {
      expect(isValidPairId('')).toBe(false);
      expect(isValidPairId('singleuser')).toBe(false); // no underscore
      expect(isValidPairId('user1_user2_user3')).toBe(false); // too many parts
      expect(isValidPairId('user1@user2')).toBe(false); // invalid separator
    });
  });

  describe('isValidUserId', () => {
    it('should return true for valid user IDs', () => {
      expect(isValidUserId('user123456789012345')).toBe(true);
      expect(isValidUserId('a'.repeat(20))).toBe(true);
    });

    it('should return false for invalid user IDs', () => {
      expect(isValidUserId('')).toBe(false);
      expect(isValidUserId('short')).toBe(false);
      expect(isValidUserId('user@id')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim and limit length', () => {
      expect(sanitizeString('  hello  ', 10)).toBe('hello');
      expect(sanitizeString('a'.repeat(100), 10)).toBe('a'.repeat(10));
    });

    it('should return empty string for invalid input', () => {
      expect(sanitizeString(undefined, 10)).toBe('');
      expect(sanitizeString(null as any, 10)).toBe('');
      expect(sanitizeString('', 10)).toBe('');
    });
  });

  describe('validateAdminActionRequest', () => {
    it('should validate a complete valid request', () => {
      const result = validateAdminActionRequest({
        targetType: 'draft',
        targetId: 'draft12345678901234567890',
        action: 'cleared',
        reason: 'No collusion detected',
        notes: 'Optional notes',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
      expect(result.data?.targetType).toBe('draft');
      expect(result.data?.action).toBe('cleared');
    });

    it('should reject missing required fields', () => {
      const result = validateAdminActionRequest({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid action', () => {
      const result = validateAdminActionRequest({
        targetType: 'draft',
        targetId: 'draft12345678901234567890',
        action: 'invalid_action',
        reason: 'Test reason',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('action'))).toBe(true);
    });

    it('should reject invalid targetType', () => {
      const result = validateAdminActionRequest({
        targetType: 'invalid',
        targetId: 'draft12345678901234567890',
        action: 'cleared',
        reason: 'Test reason',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('targetType'))).toBe(true);
    });

    it('should reject invalid draft ID format', () => {
      const result = validateAdminActionRequest({
        targetType: 'draft',
        targetId: 'short',
        action: 'cleared',
        reason: 'Test reason',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('draft ID'))).toBe(true);
    });

    it('should reject oversized reason', () => {
      const result = validateAdminActionRequest({
        targetType: 'draft',
        targetId: 'draft12345678901234567890',
        action: 'cleared',
        reason: 'a'.repeat(1001),
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('1000'))).toBe(true);
    });

    it('should reject oversized notes', () => {
      const result = validateAdminActionRequest({
        targetType: 'draft',
        targetId: 'draft12345678901234567890',
        action: 'cleared',
        reason: 'Test reason',
        notes: 'a'.repeat(5001),
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('5000'))).toBe(true);
    });

    it('should validate userPair target type', () => {
      const result = validateAdminActionRequest({
        targetType: 'userPair',
        targetId: 'user1_user2',
        action: 'warned',
        reason: 'Test reason',
      });

      expect(result.valid).toBe(true);
    });

    it('should validate user target type', () => {
      const result = validateAdminActionRequest({
        targetType: 'user',
        targetId: 'user123456789012345',
        action: 'suspended',
        reason: 'Test reason',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('validatePaginationParams', () => {
    it('should use defaults for missing params', () => {
      const result = validatePaginationParams({});
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should parse valid limit', () => {
      const result = validatePaginationParams({ limit: '25' });
      expect(result.limit).toBe(25);
    });

    it('should clamp limit to max 100', () => {
      const result = validatePaginationParams({ limit: '200' });
      expect(result.limit).toBe(50); // Should use default if > 100
    });

    it('should parse valid offset', () => {
      const result = validatePaginationParams({ offset: '10' });
      expect(result.offset).toBe(10);
    });

    it('should handle numeric inputs', () => {
      const result = validatePaginationParams({ limit: 25, offset: 10 });
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(10);
    });

    it('should reject invalid limit', () => {
      const result = validatePaginationParams({ limit: 'invalid' });
      expect(result.limit).toBe(50); // Default
    });
  });
});
