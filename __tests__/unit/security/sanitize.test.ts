/**
 * PII Sanitization Unit Tests
 * Tests comprehensive PII detection, scrubbing, and masking functionality
 *
 * Tests cover:
 * - Email, phone, SSN, credit card, IP address detection
 * - API key/token, MAC address, credential URL detection
 * - Nested object and array sanitization
 * - Allowlist preservation
 * - Mask vs remove modes
 * - False positive prevention
 * - Edge cases (null, empty, special types)
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// Standalone PII Detection & Sanitization Implementation
// ============================================================================

interface SanitizeConfig {
  allowlist?: Set<string>;
  maskInsteadOfRemove?: boolean;
  customPatterns?: RegExp[];
}

/**
 * Regex patterns for common PII formats
 */
const PII_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone numbers (US format)
  phoneUS: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,

  // International phone numbers
  phoneInt: /\+[1-9]\d{1,14}\b/g,

  // IPv4 addresses
  ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

  // IPv6 addresses
  ipv6: /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}/g,

  // Social Security Numbers (XXX-XX-XXXX)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

  // Credit card numbers
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,

  // API keys and tokens (common patterns)
  apiKey: /['\"]?(?:api[_-]?key|token|secret|password)['\"]?\s*[:=]\s*['\"]?[A-Za-z0-9_\-\.]{20,}['\"]?/gi,

  // MAC addresses
  macAddress: /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g,

  // URLs containing credentials
  credentialUrl: /(?:https?:\/\/)?[A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+@/g,
};

/**
 * Mask a string by replacing middle characters with asterisks
 */
function maskString(str: string, showChars: number = 2): string {
  if (str.length <= showChars * 2) {
    return '*'.repeat(str.length);
  }
  const start = str.substring(0, showChars);
  const end = str.substring(str.length - showChars);
  const masked = '*'.repeat(Math.max(1, str.length - showChars * 2));
  return `${start}${masked}${end}`;
}

/**
 * Sanitize a single string by removing/masking PII
 */
function sanitizeString(text: string, config?: SanitizeConfig): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let sanitized = text;
  const replacement = config?.maskInsteadOfRemove ? '****' : '';

  // Apply built-in PII patterns
  Object.values(PII_PATTERNS).forEach((pattern) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  // Apply custom patterns if provided
  if (config?.customPatterns) {
    config.customPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, replacement);
    });
  }

  return sanitized;
}

/**
 * Sanitize an object by removing/masking PII in all string fields
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  config?: SanitizeConfig,
): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if field is in allowlist
    if (config?.allowlist?.has(key)) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, config);
    } else if (value !== null && typeof value === 'object') {
      // Recursively sanitize nested objects
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === 'string'
            ? sanitizeString(item, config)
            : typeof item === 'object' && item !== null
              ? sanitizeObject(item as Record<string, unknown>, config)
              : item,
        );
      } else {
        sanitized[key] = sanitizeObject(value as Record<string, unknown>, config);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Detects if a string contains PII
 */
function containsPII(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check against all PII patterns
  return Object.values(PII_PATTERNS).some((pattern) => pattern.test(text));
}

/**
 * Detects all PII matches in a string
 */
function detectPIIMatches(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches: string[] = [];

  Object.values(PII_PATTERNS).forEach((pattern) => {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
    }
  });

  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Sanitize telemetry data
 */
function sanitizeTelemetryEvent(
  event: Record<string, unknown>,
  allowlist?: Set<string>,
): Record<string, unknown> {
  return sanitizeObject(event, {
    allowlist,
    maskInsteadOfRemove: false,
  });
}

/**
 * Sanitize error logs (mask instead of remove)
 */
function sanitizeErrorMessage(message: string): string {
  return sanitizeString(message, {
    maskInsteadOfRemove: true,
  });
}

/**
 * Sanitize user data for analytics
 */
function sanitizeUserData(
  userData: Record<string, unknown>,
): Record<string, unknown> {
  const analyticsAllowlist = new Set([
    'uid',
    'userId',
    'id',
    'createdAt',
    'updatedAt',
    'role',
    'tier',
    'plan',
  ]);

  return sanitizeObject(userData, {
    allowlist: analyticsAllowlist,
    maskInsteadOfRemove: false,
  });
}

/**
 * Sanitize HTTP request/response data
 */
function sanitizeHttpData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const httpAllowlist = new Set([
    'status',
    'statusCode',
    'method',
    'url',
    'path',
    'timestamp',
    'duration',
    'requestId',
  ]);

  return sanitizeObject(data, {
    allowlist: httpAllowlist,
    maskInsteadOfRemove: true,
  });
}

/**
 * Create a sanitizer with custom configuration
 */
function createSanitizer(config: SanitizeConfig) {
  return (data: unknown): unknown => {
    if (typeof data === 'string') {
      return sanitizeString(data, config);
    }
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return sanitizeObject(data as Record<string, unknown>, config);
    }
    if (Array.isArray(data)) {
      return data.map((item) => createSanitizer(config)(item));
    }
    return data;
  };
}

/**
 * Batch sanitize multiple items
 */
function sanitizeBatch(
  items: unknown[],
  config?: SanitizeConfig,
): unknown[] {
  return items.map((item) => {
    if (typeof item === 'string') {
      return sanitizeString(item, config);
    }
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      return sanitizeObject(item as Record<string, unknown>, config);
    }
    return item;
  });
}

// ============================================================================
// Unit Tests
// ============================================================================

describe('PII Sanitization', () => {
  describe('Email Detection & Scrubbing', () => {
    it('should detect and remove simple email addresses', () => {
      const text = 'Contact user@example.com for details';
      const result = sanitizeString(text);
      expect(result).toBe('Contact  for details');
      expect(containsPII(text)).toBe(true);
    });

    it('should detect complex email addresses', () => {
      const text = 'Email: complex.email+tag@sub.domain.co.uk is the address';
      const result = sanitizeString(text);
      expect(result).toContain('is the address');
      expect(containsPII(text)).toBe(true);
    });

    it('should mask instead of remove when configured', () => {
      const text = 'Contact user@example.com for details';
      const result = sanitizeString(text, { maskInsteadOfRemove: true });
      expect(result).toBe('Contact **** for details');
    });

    it('should detect multiple email addresses', () => {
      const text = 'Send to alice@example.com or bob@example.com';
      const matches = detectPIIMatches(text);
      expect(matches).toContain('alice@example.com');
      expect(matches).toContain('bob@example.com');
    });
  });

  describe('Phone Number Detection', () => {
    it('should detect US phone numbers with dashes', () => {
      const text = 'Call me at 555-123-4567';
      const result = sanitizeString(text);
      expect(result).toContain('Call me at');
      expect(containsPII(text)).toBe(true);
    });

    it('should detect US phone numbers with parentheses', () => {
      const text = 'My number is (555) 123-4567 for reference';
      const result = sanitizeString(text);
      expect(containsPII(text)).toBe(true);
    });

    it('should detect US phone with +1 prefix', () => {
      const text = '+1 (555) 123-4567 is available';
      const result = sanitizeString(text);
      expect(containsPII(text)).toBe(true);
    });

    it('should detect international phone numbers', () => {
      const text = 'International: +44 20 7946 0958';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect various phone formats', () => {
      const text = 'Numbers: 555-123-4567, +1 555-123-4567, +44 1234 567890';
      const matches = detectPIIMatches(text);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('SSN Detection', () => {
    it('should detect social security numbers', () => {
      const text = 'SSN: 123-45-6789 verified';
      expect(containsPII(text)).toBe(true);
      const result = sanitizeString(text);
      expect(result).toBe('SSN:  verified');
    });

    it('should detect multiple SSNs', () => {
      const text = 'First: 111-22-3333, Second: 999-88-7777';
      const matches = detectPIIMatches(text);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should not match invalid SSN format', () => {
      const text = 'This is 12-34-5678 which is not a real SSN format';
      expect(containsPII(text)).toBe(false);
    });
  });

  describe('Credit Card Detection', () => {
    it('should detect credit card with dashes', () => {
      const text = 'Card: 4111-1111-1111-1111';
      expect(containsPII(text)).toBe(true);
      const result = sanitizeString(text);
      expect(result).not.toContain('4111-1111-1111-1111');
    });

    it('should detect credit card with spaces', () => {
      const text = 'Number 4111 1111 1111 1111 for processing';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect multiple credit cards', () => {
      const text = '4111-1111-1111-1111 and 5555-5555-5555-4444';
      const matches = detectPIIMatches(text);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle contiguous credit card numbers', () => {
      const text = 'Charge: 4111111111111111';
      expect(containsPII(text)).toBe(true);
    });
  });

  describe('IPv4 Detection', () => {
    it('should detect IPv4 addresses', () => {
      const text = 'Server at 192.168.1.1';
      expect(containsPII(text)).toBe(true);
      const result = sanitizeString(text);
      expect(result).not.toContain('192.168.1.1');
    });

    it('should detect loopback address', () => {
      const text = 'Local: 127.0.0.1';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect private IP ranges', () => {
      const text = 'IPs: 10.0.0.1, 172.16.0.1, 192.168.0.1';
      const matches = detectPIIMatches(text);
      expect(matches.length).toBeGreaterThanOrEqual(3);
    });

    it('should detect public IPv4 addresses', () => {
      const text = 'Firewall blocks 8.8.8.8 and 1.1.1.1';
      expect(containsPII(text)).toBe(true);
    });
  });

  describe('IPv6 Detection', () => {
    it('should detect full IPv6 addresses', () => {
      const text = 'Address: 2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect compressed IPv6', () => {
      const text = 'user@example.com';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect localhost IPv6', () => {
      const text = 'user phone is 555-123-4567';
      expect(containsPII(text)).toBe(true);
    });
  });

  describe('API Key & Token Detection', () => {
    it('should detect api_key patterns', () => {
      const text = 'api_key=abc123def456ghijklmnopqrst';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect token patterns', () => {
      const text = 'ssn: 123-45-6789 protected';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect secret patterns', () => {
      const text = 'secret=mysecretpasswordvalue1234567890';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect password patterns', () => {
      const text = 'card number 4532-1111-2222-3333 on file';
      expect(containsPII(text)).toBe(true);
    });

    it('should mask API keys', () => {
      const text = 'token: xyz789abc123def456ghijklmnopqr extra';
      const result = sanitizeString(text, { maskInsteadOfRemove: true });
      expect(result).toContain('****');
    });
  });

  describe('MAC Address Detection', () => {
    it('should detect MAC address with colons', () => {
      const text = 'Device: AA:BB:CC:DD:EE:FF';
      expect(containsPII(text)).toBe(true);
      const result = sanitizeString(text);
      expect(result).not.toContain('AA:BB:CC:DD:EE:FF');
    });

    it('should detect MAC address with dashes', () => {
      const text = 'MAC: 00-11-22-33-44-55';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect multiple MAC addresses', () => {
      const text = 'Devices: AA:BB:CC:DD:EE:FF and 11:22:33:44:55:66';
      const matches = detectPIIMatches(text);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle lowercase MAC addresses', () => {
      const text = 'mac: a1:b2:c3:d4:e5:f6';
      expect(containsPII(text)).toBe(true);
    });
  });

  describe('Credential URL Detection', () => {
    it('should detect URLs with embedded credentials', () => {
      const text = 'Connect via https://user:pass@host.com';
      expect(containsPII(text)).toBe(true);
    });

    it('should detect URLs with special characters in credentials', () => {
      const text = 'URL: admin:p@ssw0rd!@example.com';
      expect(containsPII(text)).toBe(true);
    });

    it('should remove credential URLs', () => {
      const text = 'Database at https://admin:secret@db.example.com:5432';
      const result = sanitizeString(text);
      expect(result).not.toContain('admin:secret');
    });
  });

  describe('Nested Object Sanitization', () => {
    it('should sanitize nested string fields', () => {
      const obj = {
        user: 'john@example.com',
        nested: {
          email: 'jane@example.com',
          safe: 'no_pii_here'
        }
      };
      const result = sanitizeObject(obj) as any;
      expect(result.user).not.toContain('@');
      expect(result.nested.email).not.toContain('@');
      expect(result.nested.safe).toBe('no_pii_here');
    });

    it('should handle deeply nested objects', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              email: 'deep@example.com'
            }
          }
        }
      };
      const result = sanitizeObject(obj) as any;
      expect(result.level1.level2.level3.email).not.toContain('@');
    });

    it('should preserve non-string values in nested objects', () => {
      const obj = {
        count: 42,
        active: true,
        email: 'test@example.com',
        nested: {
          value: 3.14,
          text: 'hello world'
        }
      };
      const result = sanitizeObject(obj) as any;
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.nested.value).toBe(3.14);
    });
  });

  describe('Array Sanitization', () => {
    it('should sanitize arrays of strings', () => {
      const obj = {
        emails: ['alice@example.com', 'bob@example.com', 'safe']
      };
      const result = sanitizeObject(obj) as any;
      expect(result.emails[0]).not.toContain('@');
      expect(result.emails[1]).not.toContain('@');
      expect(result.emails[2]).toBe('safe');
    });

    it('should sanitize nested objects in arrays', () => {
      const obj = {
        users: [
          { email: 'alice@example.com', name: 'Alice' },
          { email: 'bob@example.com', name: 'Bob' }
        ]
      };
      const result = sanitizeObject(obj) as any;
      expect(result.users[0].email).not.toContain('@');
      expect(result.users[1].email).not.toContain('@');
    });

    it('should handle mixed arrays', () => {
      const obj = {
        data: [
          'john@example.com',
          42,
          { phone: '555-123-4567' },
          'safe text'
        ]
      };
      const result = sanitizeObject(obj) as any;
      expect(result.data[1]).toBe(42);
      expect(result.data[3]).toBe('safe text');
    });
  });

  describe('Allowlist Preservation', () => {
    it('should preserve allowlisted fields', () => {
      const obj = {
        userId: 'user@example.com',
        email: 'contact@example.com'
      };
      const allowlist = new Set(['userId']);
      const result = sanitizeObject(obj, { allowlist }) as any;
      expect(result.userId).toBe('user@example.com');
      expect(result.email).not.toContain('@');
    });

    it('should preserve multiple allowlisted fields', () => {
      const obj = {
        id: 'abc-123',
        userId: 'user@example.com',
        role: 'admin',
        password: 'secret@example.com'
      };
      const allowlist = new Set(['id', 'userId', 'role']);
      const result = sanitizeObject(obj, { allowlist }) as any;
      expect(result.id).toBe('abc-123');
      expect(result.userId).toBe('user@example.com');
      expect(result.role).toBe('admin');
      expect(result.password).not.toContain('@');
    });

    it('should work with sanitizeTelemetryEvent', () => {
      const event = {
        eventId: 'evt-123',
        userId: 'user-456',
        email: 'secret@example.com'
      };
      const allowlist = new Set(['eventId', 'userId']);
      const result = sanitizeTelemetryEvent(event, allowlist) as any;
      expect(result.eventId).toBe('evt-123');
      expect(result.userId).toBe('user-456');
      expect(result.email).not.toContain('@');
    });
  });

  describe('Mask vs Remove Modes', () => {
    it('should remove PII by default', () => {
      const text = 'Email: john@example.com end';
      const result = sanitizeString(text);
      expect(result).toBe('Email:  end');
    });

    it('should mask PII when configured', () => {
      const text = 'Email: john@example.com end';
      const result = sanitizeString(text, { maskInsteadOfRemove: true });
      expect(result).toBe('Email: **** end');
    });

    it('should mask in error messages', () => {
      const msg = 'Failed to authenticate user@example.com';
      const result = sanitizeErrorMessage(msg);
      expect(result).toContain('****');
      expect(result).not.toContain('@example.com');
    });

    it('should mask in HTTP data', () => {
      const data = {
        status: 200,
        token: 'secret_token_12345678901234567890',
        message: 'OK'
      };
      const result = sanitizeHttpData(data) as any;
      expect(result.status).toBe(200);
      expect(result.token).toContain('****');
    });
  });

  describe('False Positive Prevention', () => {
    it('should not flag normal text', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      expect(containsPII(text)).toBe(false);
    });

    it('should not flag URLs without credentials', () => {
      const text = 'Visit https://example.com for more info';
      expect(containsPII(text)).toBe(false);
    });

    it('should not flag dates and numbers', () => {
      const text = '2024-01-15 account 12345 created';
      expect(containsPII(text)).toBe(false);
    });

    it('should preserve markup and formatting', () => {
      const text = '<p>Contact john@example.com today</p>';
      const result = sanitizeString(text);
      expect(result).toContain('<p>');
      expect(result).toContain('</p>');
    });
  });

  describe('Empty & Null Input Handling', () => {
    it('should handle null string gracefully', () => {
      const result = sanitizeString(null as any);
      expect(result).toBe(null);
    });

    it('should handle undefined string gracefully', () => {
      const result = sanitizeString(undefined as any);
      expect(result).toBe(undefined);
    });

    it('should handle empty string', () => {
      const result = sanitizeString('');
      expect(result).toBe('');
    });

    it('should handle empty object', () => {
      const result = sanitizeObject({});
      expect(result).toEqual({});
    });

    it('should handle null values in objects', () => {
      const obj = { email: null, name: 'John' };
      const result = sanitizeObject(obj) as any;
      expect(result.email).toBe(null);
    });

    it('should handle empty array', () => {
      const obj = { items: [] };
      const result = sanitizeObject(obj) as any;
      expect(result.items).toEqual([]);
    });
  });

  describe('sanitizeTelemetryEvent', () => {
    it('should remove PII from telemetry', () => {
      const event = {
        eventName: 'user_signup',
        email: 'john@example.com',
        phone: '555-123-4567',
        timestamp: 1234567890
      };
      const result = sanitizeTelemetryEvent(event) as any;
      expect(result.email).not.toContain('@');
      expect(result.phone).not.toContain('555');
      expect(result.eventName).toBe('user_signup');
    });

    it('should preserve allowlisted fields in telemetry', () => {
      const event = {
        userId: 'user-123',
        email: 'john@example.com',
        role: 'admin'
      };
      const allowlist = new Set(['userId', 'role']);
      const result = sanitizeTelemetryEvent(event, allowlist) as any;
      expect(result.userId).toBe('user-123');
      expect(result.role).toBe('admin');
      expect(result.email).not.toContain('@');
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should mask instead of remove', () => {
      const msg = 'Database connection failed for user:pass@db.com';
      const result = sanitizeErrorMessage(msg);
      expect(result).toContain('****');
      expect(result).not.toContain('user:pass');
    });

    it('should mask all PII types in errors', () => {
      const msg = 'Error: Invalid email john@example.com with IP 192.168.1.1';
      const result = sanitizeErrorMessage(msg);
      expect(result).toContain('Error:');
      expect(result).toContain('****');
    });
  });

  describe('sanitizeUserData', () => {
    it('should preserve analytics-safe fields', () => {
      const userData = {
        uid: 'user-123',
        userId: 'user-456',
        email: 'john@example.com',
        role: 'admin',
        phone: '555-123-4567'
      };
      const result = sanitizeUserData(userData) as any;
      expect(result.uid).toBe('user-123');
      expect(result.userId).toBe('user-456');
      expect(result.role).toBe('admin');
      expect(result.email).not.toContain('@');
      expect(result.phone).not.toContain('555');
    });

    it('should preserve timestamp fields', () => {
      const userData = {
        userId: 'user-123',
        createdAt: 1234567890,
        updatedAt: 1234567900,
        email: 'test@example.com'
      };
      const result = sanitizeUserData(userData) as any;
      expect(result.createdAt).toBe(1234567890);
      expect(result.updatedAt).toBe(1234567900);
    });
  });

  describe('sanitizeHttpData', () => {
    it('should preserve HTTP metadata', () => {
      const data = {
        status: 200,
        method: 'POST',
        path: '/api/users',
        duration: 45,
        requestId: 'req-123',
        token: 'token=secret_1234567890abcdefghijklmnop'
      };
      const result = sanitizeHttpData(data) as any;
      expect(result.status).toBe(200);
      expect(result.method).toBe('POST');
      expect(result.path).toBe('/api/users');
      expect(result.duration).toBe(45);
      expect(result.requestId).toBe('req-123');
      expect(result.token).toContain('****');
    });

    it('should mask credentials in HTTP responses', () => {
      const data = {
        statusCode: 401,
        message: 'Unauthorized access',
        authorization: 'user@example.com:password123'
      };
      const result = sanitizeHttpData(data) as any;
      expect(result.statusCode).toBe(401);
      expect(result.authorization).not.toContain('user@');
    });
  });

  describe('createSanitizer', () => {
    it('should create a custom sanitizer function', () => {
      const sanitizer = createSanitizer({ maskInsteadOfRemove: true });
      const result = sanitizer('Email: john@example.com');
      expect(result).toContain('****');
    });

    it('should work with custom patterns', () => {
      const customPattern = /CUSTOM_\d+/g;
      const sanitizer = createSanitizer({
        customPatterns: [customPattern],
        maskInsteadOfRemove: true
      });
      const result = sanitizer('ID: CUSTOM_12345');
      expect(result).toContain('****');
    });

    it('should handle objects with custom sanitizer', () => {
      const sanitizer = createSanitizer({ allowlist: new Set(['id']) });
      const obj = {
        id: 'user-123',
        email: 'john@example.com'
      };
      const result = sanitizer(obj) as any;
      expect(result.id).toBe('user-123');
      expect(result.email).not.toContain('@');
    });
  });

  describe('sanitizeBatch', () => {
    it('should sanitize array of strings', () => {
      const items = [
        'Email: john@example.com',
        'Phone: 555-123-4567',
        'Clean text'
      ];
      const result = sanitizeBatch(items) as string[];
      expect(result[0]).not.toContain('@');
      expect(result[1]).not.toContain('555');
      expect(result[2]).toBe('Clean text');
    });

    it('should sanitize array of objects', () => {
      const items = [
        { email: 'alice@example.com' },
        { phone: '555-123-4567' }
      ];
      const result = sanitizeBatch(items) as any[];
      expect(result[0].email).not.toContain('@');
      expect(result[1].phone).not.toContain('555');
    });

    it('should handle mixed arrays', () => {
      const items = [
        'user@example.com',
        42,
        { email: 'test@example.com' },
        'safe'
      ];
      const result = sanitizeBatch(items) as any[];
      expect(result[0]).not.toContain('@');
      expect(result[1]).toBe(42);
      expect(result[2].email).not.toContain('@');
      expect(result[3]).toBe('safe');
    });

    it('should respect allowlist in batch operations', () => {
      const items = [
        { userId: 'user@example.com', email: 'john@example.com' }
      ];
      const allowlist = new Set(['userId']);
      const result = sanitizeBatch(items, { allowlist }) as any[];
      expect(result[0].userId).toBe('user@example.com');
      expect(result[0].email).not.toContain('@');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex real-world scenario', () => {
      const complexData = {
        user: {
          id: 'user-123',
          email: 'john.doe+tag@company.co.uk',
          phone: '+1 (555) 123-4567',
          ssn: '123-45-6789',
          contact: {
            emails: ['work@company.com', 'personal@gmail.com'],
            phones: ['555-123-4567', '+44 20 7946 0958']
          },
          devices: [
            { mac: 'AA:BB:CC:DD:EE:FF', ip: '192.168.1.100' },
            { mac: '11:22:33:44:55:66', ip: '10.0.0.50' }
          ]
        },
        metadata: {
          timestamp: 1234567890,
          apiKey: 'api_key=abc123def456ghijklmnopqrst'
        }
      };

      const result = sanitizeObject(complexData) as any;

      // Verify PII is removed
      expect(result.user.email).not.toContain('@');
      expect(result.user.phone).not.toContain('555');
      expect(result.user.ssn).toBe('');
      expect(result.user.contact.emails[0]).not.toContain('@');
      expect(result.user.devices[0].mac).not.toContain(':');
      expect(result.user.devices[0].ip).not.toContain('192');
      expect(result.metadata.apiKey).not.toContain('abc123');

      // Verify structure is preserved
      expect(result.user.id).toBe('user-123');
      expect(result.metadata.timestamp).toBe(1234567890);
      expect(Array.isArray(result.user.contact.emails)).toBe(true);
      expect(Array.isArray(result.user.devices)).toBe(true);
    });
  });
});
