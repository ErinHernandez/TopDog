/**
 * Email Validation Security Tests
 *
 * Tests the hardened sanitizeEmail() function against RFC 5321/5322 rules,
 * common attack patterns, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeEmail } from '@/Documents/bestball-site/lib/inputSanitization';

describe('sanitizeEmail - RFC-compliant validation', () => {
  // ========== Valid emails ==========

  it('accepts standard email addresses', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    expect(sanitizeEmail('john.doe@company.org')).toBe('john.doe@company.org');
    expect(sanitizeEmail('alice+tag@gmail.com')).toBe('alice+tag@gmail.com');
    expect(sanitizeEmail('test_user@sub.domain.co')).toBe('test_user@sub.domain.co');
  });

  it('lowercases and trims input', () => {
    expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com');
    expect(sanitizeEmail('ADMIN@TOPDOG.IO')).toBe('admin@topdog.io');
  });

  it('accepts emails with hyphens in domain', () => {
    expect(sanitizeEmail('user@my-site.com')).toBe('user@my-site.com');
  });

  it('accepts emails with numeric local part', () => {
    expect(sanitizeEmail('12345@example.com')).toBe('12345@example.com');
  });

  it('accepts two-letter TLDs', () => {
    expect(sanitizeEmail('user@example.uk')).toBe('user@example.uk');
    expect(sanitizeEmail('user@example.io')).toBe('user@example.io');
  });

  it('accepts long TLDs', () => {
    expect(sanitizeEmail('user@example.technology')).toBe('user@example.technology');
  });

  // ========== Invalid emails - basic ==========

  it('rejects non-string input', () => {
    expect(sanitizeEmail(null)).toBeNull();
    expect(sanitizeEmail(undefined)).toBeNull();
    expect(sanitizeEmail(123)).toBeNull();
    expect(sanitizeEmail({})).toBeNull();
    expect(sanitizeEmail([])).toBeNull();
  });

  it('rejects empty strings', () => {
    expect(sanitizeEmail('')).toBeNull();
    expect(sanitizeEmail('   ')).toBeNull();
  });

  it('rejects emails without @ sign', () => {
    expect(sanitizeEmail('userexample.com')).toBeNull();
  });

  it('rejects emails with multiple @ signs', () => {
    expect(sanitizeEmail('user@@example.com')).toBeNull();
    expect(sanitizeEmail('user@admin@example.com')).toBeNull();
  });

  // ========== Invalid emails - local part rules ==========

  it('rejects empty local part', () => {
    expect(sanitizeEmail('@example.com')).toBeNull();
  });

  it('rejects local part exceeding 64 characters', () => {
    const longLocal = 'a'.repeat(65);
    expect(sanitizeEmail(`${longLocal}@example.com`)).toBeNull();
  });

  it('rejects local part with consecutive dots', () => {
    expect(sanitizeEmail('user..name@example.com')).toBeNull();
  });

  it('rejects local part starting with dot', () => {
    expect(sanitizeEmail('.user@example.com')).toBeNull();
  });

  it('rejects local part ending with dot', () => {
    expect(sanitizeEmail('user.@example.com')).toBeNull();
  });

  // ========== Invalid emails - domain rules ==========

  it('rejects domains without TLD', () => {
    expect(sanitizeEmail('user@localhost')).toBeNull();
    expect(sanitizeEmail('user@hostname')).toBeNull();
  });

  it('rejects domains with single-char TLD', () => {
    expect(sanitizeEmail('user@example.a')).toBeNull();
  });

  it('rejects domains with numeric TLD', () => {
    expect(sanitizeEmail('user@example.123')).toBeNull();
  });

  it('rejects empty domain', () => {
    expect(sanitizeEmail('user@')).toBeNull();
  });

  // ========== Invalid emails - length ==========

  it('rejects emails exceeding 254 characters', () => {
    const longLocal = 'a'.repeat(64);
    const longDomain = 'b'.repeat(180) + '.com';
    expect(sanitizeEmail(`${longLocal}@${longDomain}`)).toBeNull();
  });

  // ========== Attack patterns ==========

  it('rejects emails with spaces', () => {
    expect(sanitizeEmail('user name@example.com')).toBeNull();
    expect(sanitizeEmail('user@example .com')).toBeNull();
  });

  it('rejects emails with special characters in domain', () => {
    expect(sanitizeEmail('user@exam!ple.com')).toBeNull();
    expect(sanitizeEmail('user@exam<ple.com')).toBeNull();
  });
});
