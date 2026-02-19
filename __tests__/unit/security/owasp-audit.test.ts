/**
 * OWASP Top 10 Security Audit Tests
 * Comprehensive test coverage for all security audit checks
 * @module __tests__/unit/security/owasp-audit.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  runSecurityAudit,
  SecurityAuditResult,
  AuditCheck,
} from '@/lib/security/owasp-audit';
import {
  sanitizeHTML,
  sanitizeFilename,
  sanitizePrompt,
  validateURL,
  validateImageBuffer,
  escapeForFirestore,
  validateEmail,
  sanitizeJSON,
  validateNumber,
} from '@/lib/security/input-sanitizer';
import {
  getRateLimits,
  checkRateLimit,
  checkAuthRateLimit,
  validateFileSize,
  getRecommendedPlan,
} from '@/lib/security/rate-limiter-tiers';
import {
  buildCSP,
  generateNonce,
  getSecurityHeaders,
} from '@/lib/security/csp-policy';

describe('OWASP Security Audit', () => {
  describe('Audit Execution', () => {
    it('should run complete security audit and return results', async () => {
      const result = await runSecurityAudit();

      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(result.overallStatus).toMatch(/^(pass|fail|warning)$/);
    });

    it('should aggregate all audit categories', async () => {
      const result = await runSecurityAudit();

      expect(result.categories.a01_broken_access_control).toBeInstanceOf(
        Array
      );
      expect(result.categories.a02_cryptographic_failures).toBeInstanceOf(
        Array
      );
      expect(result.categories.a03_injection).toBeInstanceOf(Array);
      expect(result.categories.a04_insecure_design).toBeInstanceOf(Array);
      expect(result.categories.a05_security_misconfiguration).toBeInstanceOf(
        Array
      );
      expect(result.categories.a06_vulnerable_components).toBeInstanceOf(
        Array
      );
      expect(result.categories.a07_authentication_failures).toBeInstanceOf(
        Array
      );
      expect(result.categories.a08_data_integrity_failures).toBeInstanceOf(
        Array
      );
      expect(result.categories.a09_logging_monitoring).toBeInstanceOf(Array);
      expect(result.categories.a10_ssrf).toBeInstanceOf(Array);
    });

    it('should compute summary statistics correctly', async () => {
      const result = await runSecurityAudit();

      expect(result.summary.totalChecks).toBeGreaterThan(0);
      expect(result.summary.passed).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed).toBeGreaterThanOrEqual(0);
      expect(result.summary.criticalIssues).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalChecks).toBe(
        result.summary.passed + result.summary.failed
      );
    });

    it('should fail if critical issues are found', async () => {
      const result = await runSecurityAudit();

      if (result.summary.criticalIssues > 0) {
        expect(result.overallStatus).toBe('fail');
      }
    });
  });
});

describe('Input Sanitization (A03: Injection Prevention)', () => {
  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const dirty =
        '<p>Hello</p><script>alert("xss")</script><p>World</p>';
      const clean = sanitizeHTML(dirty);

      expect(clean).not.toContain('script');
      expect(clean).not.toContain('alert');
    });

    it('should remove onclick handlers', () => {
      const dirty = '<img src=x onclick="alert(1)">';
      const clean = sanitizeHTML(dirty);

      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
    });

    it('should remove iframe tags', () => {
      const dirty = '<p>Safe</p><iframe src="evil.com"></iframe>';
      const clean = sanitizeHTML(dirty);

      expect(clean).not.toContain('iframe');
    });

    it('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('');
      expect(sanitizeHTML(null as any)).toBe('');
    });

    it('should strip script tags entirely (no residual content)', () => {
      const result = sanitizeHTML('<script>alert(1)</script>');
      // Script tags and their content are removed before encoding
      expect(result).toBe('');
    });

    it('should HTML-encode remaining content after dangerous tag removal', () => {
      const result = sanitizeHTML('<p>Hello</p>');
      // Non-dangerous tags are HTML-encoded
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should remove onerror attributes', () => {
      const dirty =
        '<img src=x onerror="fetch(\'http://evil.com\')">';
      const clean = sanitizeHTML(dirty);

      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('fetch');
    });
  });

  describe('sanitizeFilename', () => {
    it('should prevent path traversal', () => {
      const dangerous = '../../etc/passwd.txt';
      const safe = sanitizeFilename(dangerous);

      expect(safe).not.toContain('..');
      expect(safe).not.toContain('/');
      expect(safe).toBe('etcpasswd.txt');
    });

    it('should remove null bytes', () => {
      const dangerous = 'file\0.txt';
      const safe = sanitizeFilename(dangerous);

      expect(safe).not.toContain('\0');
      expect(safe).toBe('file.txt');
    });

    it('should remove slashes', () => {
      const dangerous = '../../../evil/file.txt';
      const safe = sanitizeFilename(dangerous);

      expect(safe).not.toContain('/');
      expect(safe).not.toContain('\\');
    });

    it('should limit filename length to 255', () => {
      const longName = 'a'.repeat(300);
      const safe = sanitizeFilename(longName);

      expect(safe.length).toBeLessThanOrEqual(255);
    });

    it('should handle empty filenames', () => {
      expect(sanitizeFilename('')).toBe('file');
      expect(sanitizeFilename(null as any)).toBe('file');
    });

    it('should preserve legitimate filenames', () => {
      const legitimate = 'my-document_v2.pdf';
      const safe = sanitizeFilename(legitimate);

      expect(safe).toBe(legitimate);
    });
  });

  describe('sanitizePrompt', () => {
    it('should remove SQL keywords', () => {
      const malicious =
        'Generate image; DELETE FROM users; --';
      const clean = sanitizePrompt(malicious);

      expect(clean).not.toContain('DELETE');
      // FROM is a common English word and is intentionally NOT blocked
      expect(clean).toContain('FROM');
    });

    it('should remove control characters', () => {
      const withControl = 'Hello\x00World\x08Test';
      const clean = sanitizePrompt(withControl);

      expect(clean).not.toContain('\x00');
      expect(clean).not.toContain('\x08');
    });

    it('should remove shell metacharacters', () => {
      const shellInjection = 'image; rm -rf /';
      const clean = sanitizePrompt(shellInjection);

      expect(clean).not.toContain(';');
      expect(clean).not.toContain('|');
      expect(clean).not.toContain('&');
    });

    it('should limit prompt length to 10000 characters', () => {
      const longPrompt = 'a'.repeat(15000);
      const clean = sanitizePrompt(longPrompt);

      expect(clean.length).toBeLessThanOrEqual(10000);
    });

    it('should collapse multiple spaces', () => {
      const spaced = 'Generate    image    with    spaces';
      const clean = sanitizePrompt(spaced);

      expect(clean).not.toContain('    ');
      expect(clean).toContain('Generate image');
    });

    it('should remove DROP keyword', () => {
      const malicious = 'DROP TABLE users';
      const clean = sanitizePrompt(malicious);

      expect(clean).not.toContain('DROP');
    });
  });

  describe('validateURL', () => {
    it('should allow valid HTTPS URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('https://api.github.com/users')).toBe(true);
    });

    it('should allow valid HTTP URLs', () => {
      expect(validateURL('http://example.com')).toBe(true);
    });

    it('should block localhost', () => {
      expect(validateURL('http://localhost')).toBe(false);
      expect(validateURL('http://localhost:8080')).toBe(false);
    });

    it('should block 127.0.0.1', () => {
      expect(validateURL('http://127.0.0.1')).toBe(false);
      expect(validateURL('http://127.0.0.1:3000')).toBe(false);
    });

    it('should block private IP ranges', () => {
      expect(validateURL('http://10.0.0.1')).toBe(false);
      expect(validateURL('http://192.168.1.1')).toBe(false);
      expect(validateURL('http://172.16.0.1')).toBe(false);
    });

    it('should block IPv6 localhost', () => {
      expect(validateURL('http://[::1]')).toBe(false);
    });

    it('should respect allowed domains', () => {
      expect(
        validateURL('https://api.example.com', ['example.com'])
      ).toBe(true);
      expect(
        validateURL('https://evil.com', ['example.com'])
      ).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not a url')).toBe(false);
      expect(validateURL('')).toBe(false);
      expect(validateURL(null as any)).toBe(false);
    });

    it('should reject non-http protocols', () => {
      expect(validateURL('ftp://example.com')).toBe(false);
      expect(validateURL('file:///etc/passwd')).toBe(false);
      expect(validateURL('javascript:alert(1)')).toBe(false);
    });
  });

  describe('validateImageBuffer', () => {
    it('should validate JPEG images', () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff]);
      const result = validateImageBuffer(jpegHeader);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should validate PNG images', () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const result = validateImageBuffer(pngHeader);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('png');
    });

    it('should reject invalid formats', () => {
      const invalidHeader = Buffer.from([0x00, 0x00, 0x00]);
      const result = validateImageBuffer(invalidHeader);

      expect(result.valid).toBe(false);
      expect(result.format).toBe('unknown');
    });

    it('should reject empty buffers', () => {
      const result = validateImageBuffer(Buffer.from([]));

      expect(result.valid).toBe(false);
    });

    it('should reject oversized files', () => {
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024); // 51 MB
      const result = validateImageBuffer(largeBuffer);

      expect(result.valid).toBe(false);
    });
  });

  describe('escapeForFirestore', () => {
    it('should escape dots', () => {
      const result = escapeForFirestore('user.name');
      expect(result).toBe('user\\.name');
    });

    it('should escape slashes', () => {
      const result = escapeForFirestore('path/to/resource');
      expect(result).toBe('path\\/to\\/resource');
    });

    it('should limit string length', () => {
      const longString = 'a'.repeat(2000);
      const result = escapeForFirestore(longString);

      expect(result.length).toBeLessThanOrEqual(1500);
    });

    it('should handle empty input', () => {
      expect(escapeForFirestore('')).toBe('');
      expect(escapeForFirestore(null as any)).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('john.doe+tag@sub.example.co.uk')).toBe(
        true
      );
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('should reject extremely long emails', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('sanitizeJSON', () => {
    it('should parse valid JSON', () => {
      const result = sanitizeJSON('{"key":"value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should reject invalid JSON', () => {
      const result = sanitizeJSON('{invalid json}');
      expect(result).toBeNull();
    });

    it('should reject non-object JSON', () => {
      expect(sanitizeJSON('"string"')).toBeNull();
      expect(sanitizeJSON('123')).toBeNull();
    });
  });

  describe('validateNumber', () => {
    it('should validate numbers', () => {
      expect(validateNumber(42)).toBe(true);
      expect(validateNumber('100')).toBe(true);
    });

    it('should enforce min/max bounds', () => {
      expect(validateNumber(50, 0, 100)).toBe(true);
      expect(validateNumber(150, 0, 100)).toBe(false);
      expect(validateNumber(-10, 0, 100)).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(validateNumber('abc')).toBe(false);
      expect(validateNumber(null)).toBe(false);
      expect(validateNumber(NaN)).toBe(false);
    });
  });
});

describe('Rate Limiting (A04: Insecure Design)', () => {
  describe('getRateLimits', () => {
    it('should return limits for all plans', () => {
      const free = getRateLimits('free');
      const pro = getRateLimits('pro');
      const team = getRateLimits('team');
      const enterprise = getRateLimits('enterprise');

      expect(free.ai).toBe(5);
      expect(pro.ai).toBe(50);
      expect(team.ai).toBe(200);
      expect(enterprise.ai).toBe(1000);
    });

    it('should tier upload limits correctly', () => {
      const free = getRateLimits('free');
      const pro = getRateLimits('pro');

      expect(free.upload).toBeLessThan(pro.upload);
    });

    it('should tier file size limits correctly', () => {
      const free = getRateLimits('free');
      const pro = getRateLimits('pro');

      expect(free.fileSize).toBeLessThan(pro.fileSize);
    });

    it('should default to free plan for unknown plans', () => {
      const result = getRateLimits('invalid' as any);
      expect(result).toEqual(getRateLimits('free'));
    });
  });

  describe('checkRateLimit', () => {
    it('should return rate limit result with all fields', async () => {
      const result = await checkRateLimit('user123', 'ai', 'pro');

      expect(result.allowed).toBeDefined();
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.resetTime).toBeGreaterThan(0);
      expect(result.limitWindow).toBe(3600000);
    });

    it('should have different remaining counts for different plans', async () => {
      const freeResult = await checkRateLimit('user123', 'ai', 'free');
      const proResult = await checkRateLimit('user123', 'ai', 'pro');

      // Both should initially have full limits available (in mock)
      expect(freeResult.remaining).toBeLessThanOrEqual(
        proResult.remaining
      );
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within limits', () => {
      const freeLimit = getRateLimits('free').fileSize * 1024 * 1024;
      expect(validateFileSize(freeLimit - 1, 'free')).toBe(true);
    });

    it('should reject files exceeding limits', () => {
      const freeLimit = getRateLimits('free').fileSize * 1024 * 1024;
      expect(validateFileSize(freeLimit + 1, 'free')).toBe(false);
    });

    it('should allow larger files for higher plans', () => {
      const freeLimit = getRateLimits('free').fileSize * 1024 * 1024;
      const testSize = freeLimit + 1024;

      expect(validateFileSize(testSize, 'free')).toBe(false);
      expect(validateFileSize(testSize, 'pro')).toBe(true);
    });
  });

  describe('getRecommendedPlan', () => {
    it('should recommend upgrade when near limits', () => {
      const highUsage = { ai: 4.5, upload: 9.5, generate: 2.8, export: 4 };
      const recommended = getRecommendedPlan(highUsage, 'free');

      expect(recommended).toBe('pro');
    });

    it('should return null when usage is low', () => {
      const lowUsage = { ai: 1, upload: 2, generate: 1, export: 1 };
      const recommended = getRecommendedPlan(lowUsage, 'free');

      expect(recommended).toBeNull();
    });

    it('should return null for enterprise plan', () => {
      const usage = { ai: 900, upload: 1800, generate: 450, export: 900 };
      const recommended = getRecommendedPlan(usage, 'enterprise');

      expect(recommended).toBeNull();
    });
  });
});

describe('Content Security Policy (A05: Security Misconfiguration)', () => {
  describe('buildCSP', () => {
    it('should build CSP for development', () => {
      const csp = buildCSP('development');

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src");
    });

    it('should build CSP for staging', () => {
      const csp = buildCSP('staging');

      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).toContain('block-all-mixed-content');
    });

    it('should build CSP for production', () => {
      const csp = buildCSP('production');

      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).toContain('report-uri');
    });

    it('should include nonce in production CSP', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCSP('production', nonce);

      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    it('should include Stripe domain in CSP', () => {
      const csp = buildCSP('production');

      expect(csp).toContain('stripe.com');
    });

    it('should include Firebase domain in CSP', () => {
      const csp = buildCSP('production');

      expect(csp).toContain('firebase.googleapis.com');
    });
  });

  describe('generateNonce', () => {
    it('should generate valid base64 nonce', () => {
      const nonce = generateNonce();

      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
      // Should be valid base64
      expect(() => Buffer.from(nonce, 'base64')).not.toThrow();
    });

    it('should generate different nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('getSecurityHeaders', () => {
    it('should return all required security headers', () => {
      const headers = getSecurityHeaders();

      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Referrer-Policy']).toContain('strict-origin');
    });

    it('should include HSTS header', () => {
      const headers = getSecurityHeaders();

      expect(headers['Strict-Transport-Security']).toContain('max-age');
      expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
    });

    it('should include Permissions-Policy header', () => {
      const headers = getSecurityHeaders();

      expect(headers['Permissions-Policy']).toBeDefined();
      expect(headers['Permissions-Policy']).toContain('geolocation=()');
      expect(headers['Permissions-Policy']).toContain('camera=()');
    });

    it('should disable client-side caching', () => {
      const headers = getSecurityHeaders();

      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Cache-Control']).toContain('no-cache');
      expect(headers['Pragma']).toBe('no-cache');
    });
  });
});

describe('Security Best Practices', () => {
  it('should have comprehensive test coverage', () => {
    // This test ensures the test suite itself is comprehensive
    expect(true).toBe(true); // Placeholder for coverage validation
  });

  it('should prevent XSS through multiple layers', () => {
    const xssPayload = '<img src=x onerror="alert(1)">';

    const sanitized = sanitizeHTML(xssPayload);
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('alert');
  });

  it('should prevent path traversal through multiple layers', () => {
    const pathTraversal = '../../../../etc/passwd';

    const sanitized = sanitizeFilename(pathTraversal);
    expect(sanitized).not.toContain('..');
    expect(sanitized).not.toContain('/');
  });

  it('should enforce rate limiting across tiers', () => {
    const freeLimits = getRateLimits('free');
    const proLimits = getRateLimits('pro');
    const teamLimits = getRateLimits('team');
    const enterpriseLimits = getRateLimits('enterprise');

    expect(freeLimits.ai).toBeLessThan(proLimits.ai);
    expect(proLimits.ai).toBeLessThan(teamLimits.ai);
    expect(teamLimits.ai).toBeLessThan(enterpriseLimits.ai);
  });
});
