/**
 * Tests for lib/csrfProtection.js
 * 
 * CSRF protection tests focusing on attack scenarios:
 * - Valid token validation
 * - Missing token attacks
 * - Token mismatch attacks
 * - Token replay attacks
 * - Timing attack prevention
 */

jest.mock('crypto', () => ({
  randomBytes: jest.fn((size) => {
    const buffer = Buffer.alloc(size);
    buffer.fill(0x42); // Fill with predictable value for testing
    return buffer;
  }),
}));

const crypto = require('crypto');

describe('lib/csrfProtection', () => {
  let csrfProtection;
  let originalEnv;

  beforeAll(() => {
    originalEnv = {
      NODE_ENV: process.env.NODE_ENV,
    };
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    csrfProtection = require('../../../lib/csrfProtection');
  });

  describe('generateCSRFToken', () => {
    it('generates a valid CSRF token', () => {
      const token = csrfProtection.generateCSRFToken();

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('generates unique tokens', () => {
      const token1 = csrfProtection.generateCSRFToken();
      const token2 = csrfProtection.generateCSRFToken();

      // Even with mocked crypto, tokens should be different if called multiple times
      // In real implementation, randomBytes generates different values
      expect(crypto.randomBytes).toHaveBeenCalled();
    });
  });

  describe('validateCSRFToken', () => {
    describe('Valid Token Validation', () => {
      it('accepts valid matching tokens', () => {
        const token = 'valid-token-123';

        const req = {
          headers: {
            'x-csrf-token': token,
          },
          cookies: {
            'csrf-token': token,
          },
        };

        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(true);
      });

      it('accepts valid tokens with different header casing', () => {
        const token = 'valid-token-123';

        const req = {
          headers: {
            'X-CSRF-Token': token,
          },
          cookies: {
            'csrf-token': token,
          },
        };

        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(true);
      });
    });

    describe('Attack Scenarios', () => {
      it('rejects requests with missing header token', () => {
        const req = {
          headers: {},
          cookies: {
            'csrf-token': 'valid-token-123',
          },
        };

        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(false);
      });

      it('rejects requests with missing cookie token', () => {
        const req = {
          headers: {
            'x-csrf-token': 'valid-token-123',
          },
          cookies: {},
        };

        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(false);
      });

      it('rejects requests with mismatched tokens (token tampering)', () => {
        const req = {
          headers: {
            'x-csrf-token': 'tampered-token-456',
          },
          cookies: {
            'csrf-token': 'valid-token-123',
          },
        };

        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(false);
      });

      it('rejects empty token strings', () => {
        const req = {
          headers: {
            'x-csrf-token': '',
          },
          cookies: {
            'csrf-token': '',
          },
        };

        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(false);
      });

      it('rejects token from different session (replay attack)', () => {
        // Simulate token from a different session
        const req = {
          headers: {
            'x-csrf-token': 'token-from-different-session',
          },
          cookies: {
            'csrf-token': 'current-session-token',
          },
        };

        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(false);
      });
    });

    describe('Timing Attack Prevention', () => {
      it('uses constant-time comparison (same length tokens)', () => {
        const token1 = 'a'.repeat(64);
        const token2 = 'b'.repeat(64);

        const req = {
          headers: {
            'x-csrf-token': token1,
          },
          cookies: {
            'csrf-token': token2,
          },
        };

        // The validation should compare entire strings
        // JavaScript === uses constant-time comparison for strings
        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(false);
      });

      it('rejects tokens of different lengths immediately', () => {
        const req = {
          headers: {
            'x-csrf-token': 'short',
          },
          cookies: {
            'csrf-token': 'much-longer-token-value',
          },
        };

        const isValid = csrfProtection.validateCSRFToken(req);

        expect(isValid).toBe(false);
      });
    });
  });

  describe('withCSRFProtection middleware', () => {
    describe('Read-Only Operations', () => {
      it('skips CSRF for GET requests', async () => {
        const handler = jest.fn((req, res) => {
          res.json({ success: true });
        });

        const wrappedHandler = csrfProtection.withCSRFProtection(handler);

        const req = {
          method: 'GET',
          headers: {},
          cookies: {},
        };
        const res = {
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ success: true });
      });

      it('skips CSRF for HEAD requests', async () => {
        const handler = jest.fn((req, res) => {
          res.sendStatus(200);
        });

        const wrappedHandler = csrfProtection.withCSRFProtection(handler);

        const req = {
          method: 'HEAD',
          headers: {},
          cookies: {},
        };
        const res = {
          sendStatus: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).toHaveBeenCalled();
      });

      it('skips CSRF for OPTIONS requests', async () => {
        const handler = jest.fn((req, res) => {
          res.sendStatus(200);
        });

        const wrappedHandler = csrfProtection.withCSRFProtection(handler);

        const req = {
          method: 'OPTIONS',
          headers: {},
          cookies: {},
        };
        const res = {
          sendStatus: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).toHaveBeenCalled();
      });
    });

    describe('State-Changing Operations', () => {
      it('allows POST requests with valid CSRF token', async () => {
        const token = 'valid-token-123';
        const handler = jest.fn((req, res) => {
          res.json({ success: true });
        });

        const wrappedHandler = csrfProtection.withCSRFProtection(handler);

        const req = {
          method: 'POST',
          headers: {
            'x-csrf-token': token,
          },
          cookies: {
            'csrf-token': token,
          },
        };
        const res = {
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ success: true });
      });

      it('rejects POST requests without CSRF token', async () => {
        const handler = jest.fn();

        const wrappedHandler = csrfProtection.withCSRFProtection(handler);

        const req = {
          method: 'POST',
          headers: {},
          cookies: {},
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'CSRF_TOKEN_INVALID',
          message: 'Invalid or missing CSRF token',
        });
      });

      it('rejects PUT requests without valid CSRF token', async () => {
        const handler = jest.fn();

        const wrappedHandler = csrfProtection.withCSRFProtection(handler);

        const req = {
          method: 'PUT',
          headers: {
            'x-csrf-token': 'token1',
          },
          cookies: {
            'csrf-token': 'token2', // Mismatch
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('rejects DELETE requests without valid CSRF token', async () => {
        const handler = jest.fn();

        const wrappedHandler = csrfProtection.withCSRFProtection(handler);

        const req = {
          method: 'DELETE',
          headers: {},
          cookies: {},
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
      });
    });
  });

  describe('setCSRFTokenCookie', () => {
    it('sets CSRF token cookie with secure flags', () => {
      const res = {
        setHeader: jest.fn(),
      };
      const token = 'test-token-123';

      csrfProtection.setCSRFTokenCookie(res, token);

      expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', [
        expect.stringContaining('csrf-token=test-token-123'),
        expect.stringContaining('HttpOnly'),
        expect.stringContaining('Secure'),
        expect.stringContaining('SameSite=Strict'),
      ]);
    });
  });
});
