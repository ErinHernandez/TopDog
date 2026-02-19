/**
 * Validation utilities for integrity system
 *
 * Provides type-safe validation for API inputs
 */

// Valid values for admin actions
export const VALID_ACTIONS = ['cleared', 'warned', 'suspended', 'banned', 'escalated'] as const;
export const VALID_TARGET_TYPES = ['draft', 'userPair', 'user'] as const;

export type AdminActionType = typeof VALID_ACTIONS[number];
export type TargetType = typeof VALID_TARGET_TYPES[number];

/**
 * Type guard for admin action
 */
export function isValidAction(action: string): action is AdminActionType {
  return VALID_ACTIONS.includes(action as AdminActionType);
}

/**
 * Type guard for target type
 */
export function isValidTargetType(targetType: string): targetType is TargetType {
  return VALID_TARGET_TYPES.includes(targetType as TargetType);
}

/**
 * Validate draft ID format
 * Draft IDs are Firebase document IDs: alphanumeric, 20+ characters
 */
export function isValidDraftId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

/**
 * Validate user pair ID format
 * Pair IDs are: userId1_userId2 (lexicographically ordered)
 */
export function isValidPairId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]+_[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Validate user ID format
 */
export function isValidUserId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

/**
 * Sanitize string input (trim and limit length)
 */
export function sanitizeString(input: string | undefined, maxLength: number): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

/**
 * Validated admin action request data
 */
export interface ValidatedAdminActionRequest {
  targetType: TargetType;
  targetId: string;
  action: AdminActionType;
  reason: string;
  notes?: string;
}

/**
 * Raw request body structure for admin actions
 */
interface AdminActionRequestBody {
  targetType?: string;
  targetId?: string;
  action?: string;
  reason?: string;
  notes?: string;
}

/**
 * Validate admin action request body
 */
export function validateAdminActionRequest(body: AdminActionRequestBody): ValidationResult<ValidatedAdminActionRequest> {
  const errors: string[] = [];

  // Validate targetType
  if (!body.targetType) {
    errors.push('targetType is required');
  } else if (!isValidTargetType(body.targetType)) {
    errors.push(`Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}`);
  }

  // Validate targetId
  if (!body.targetId || typeof body.targetId !== 'string' || body.targetId.trim().length === 0) {
    errors.push('targetId is required and must be a non-empty string');
  } else {
    // Validate targetId format based on targetType
    if (body.targetType === 'draft' && !isValidDraftId(body.targetId)) {
      errors.push('Invalid draft ID format');
    } else if (body.targetType === 'userPair' && !isValidPairId(body.targetId)) {
      errors.push('Invalid pair ID format. Expected format: userId1_userId2');
    } else if (body.targetType === 'user' && !isValidUserId(body.targetId)) {
      errors.push('Invalid user ID format');
    }
  }

  // Validate action
  if (!body.action) {
    errors.push('action is required');
  } else if (!isValidAction(body.action)) {
    errors.push(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }

  // Validate reason
  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    errors.push('reason is required and must be a non-empty string');
  } else if (body.reason.length > 1000) {
    errors.push('reason must be 1000 characters or less');
  }

  // Validate notes (optional)
  if (body.notes && typeof body.notes === 'string' && body.notes.length > 5000) {
    errors.push('notes must be 5000 characters or less');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // At this point, we've validated that body.targetId exists and is a non-empty string
  const targetId = body.targetId!;

  return {
    valid: true,
    errors: [],
    data: {
      targetType: body.targetType as TargetType,
      targetId: targetId.trim(),
      action: body.action as AdminActionType,
      reason: sanitizeString(body.reason!, 1000),
      notes: body.notes ? sanitizeString(body.notes, 5000) : undefined,
    },
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: {
  limit?: string | number;
  offset?: string | number;
}): { limit: number; offset: number } {
  let limit = 50; // Default
  let offset = 0; // Default

  if (params.limit !== undefined) {
    const parsed = typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit;
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      limit = parsed;
    }
  }

  if (params.offset !== undefined) {
    const parsed = typeof params.offset === 'string' ? parseInt(params.offset, 10) : params.offset;
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return { limit, offset };
}
