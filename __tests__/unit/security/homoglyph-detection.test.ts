/**
 * Homoglyph Attack Detection Tests
 *
 * Tests username similarity detection including Cyrillic ↔ Latin
 * confusable character protection to prevent impersonation attacks.
 */

import { describe, it, expect } from 'vitest';
import {
  generateSimilarVariants,
  areSimilar,
  containsMixedScripts,
  normalizeConfusables,
  levenshteinDistance,
} from '@/Documents/bestball-site/lib/usernameSimilarity';

describe('containsMixedScripts', () => {
  it('returns false for pure Latin usernames', () => {
    expect(containsMixedScripts('admin')).toBe(false);
    expect(containsMixedScripts('TopDog123')).toBe(false);
    expect(containsMixedScripts('john_doe')).toBe(false);
  });

  it('returns false for pure Cyrillic strings', () => {
    // "админ" in full Cyrillic
    expect(containsMixedScripts('\u0430\u0434\u043C\u0438\u043D')).toBe(false);
  });

  it('detects Latin + Cyrillic mixing (homoglyph attack)', () => {
    // "аdmin" where first char is Cyrillic а (U+0430)
    expect(containsMixedScripts('\u0430dmin')).toBe(true);
  });

  it('detects Cyrillic о mixed with Latin text', () => {
    // "t\u043Epdog" — Cyrillic о disguised as Latin o
    expect(containsMixedScripts('t\u043Epdog')).toBe(true);
  });

  it('returns false for pure ASCII with numbers and underscores', () => {
    // Numbers and underscores are neither Latin nor Cyrillic script
    expect(containsMixedScripts('user_123')).toBe(false);
  });
});

describe('normalizeConfusables', () => {
  it('converts Cyrillic confusables to Latin equivalents', () => {
    // "аdmin" with Cyrillic а → "admin"
    expect(normalizeConfusables('\u0430dmin')).toBe('admin');
  });

  it('converts multiple Cyrillic confusables', () => {
    // "Тор" in Cyrillic → "Top" in Latin (Т→T, о→o, р→p)
    expect(normalizeConfusables('\u0422\u043E\u0440')).toBe('Top');
  });

  it('leaves pure Latin text unchanged', () => {
    expect(normalizeConfusables('admin')).toBe('admin');
    expect(normalizeConfusables('TopDog')).toBe('TopDog');
  });

  it('handles mixed digits and letters', () => {
    // "us\u0435r123" — Cyrillic е → Latin e
    expect(normalizeConfusables('us\u0435r123')).toBe('user123');
  });

  it('normalizes Cyrillic С to Latin C', () => {
    expect(normalizeConfusables('\u0421laude')).toBe('Claude');
  });
});

describe('areSimilar - Cyrillic homoglyph detection', () => {
  it('detects Cyrillic а vs Latin a as similar', () => {
    // "аdmin" (Cyrillic а) vs "admin" (Latin a)
    expect(areSimilar('\u0430dmin', 'admin')).toBe(true);
  });

  it('detects Cyrillic lookalike of "topdog" with multiple confusables', () => {
    // "t\u043Epd\u043Eg" — Cyrillic о in both positions (lowercase)
    // normalizeConfusables("t\u043Epd\u043Eg") → "topdog" → matches "topdog"
    expect(areSimilar('t\u043Epd\u043Eg', 'topdog')).toBe(true);
  });

  it('detects Cyrillic о substitution', () => {
    // "j\u043Ehn" vs "john"
    expect(areSimilar('j\u043Ehn', 'john')).toBe(true);
  });

  it('still detects classic digit ↔ letter similarity', () => {
    // "j0hn" vs "john" (0 vs o)
    expect(areSimilar('j0hn', 'john')).toBe(true);
  });

  it('detects "1" vs "l" similarity', () => {
    expect(areSimilar('he1lo', 'hello')).toBe(true);
  });

  it('does not flag unrelated usernames', () => {
    expect(areSimilar('alice', 'bobmarley')).toBe(false);
  });

  it('does not flag identical usernames as similar (they are the SAME)', () => {
    expect(areSimilar('admin', 'admin')).toBe(false);
    expect(areSimilar('Admin', 'admin')).toBe(false);
  });
});

describe('generateSimilarVariants', () => {
  it('generates Cyrillic variants for Latin characters', () => {
    const variants = generateSimilarVariants('ace');
    // 'a' → Cyrillic 'а' (U+0430), 'c' → Cyrillic 'с' (U+0441), 'e' → Cyrillic 'е' (U+0435)
    expect(variants.some(v => v.includes('\u0430'))).toBe(true); // Cyrillic а
    expect(variants.some(v => v.includes('\u0441'))).toBe(true); // Cyrillic с
    expect(variants.some(v => v.includes('\u0435'))).toBe(true); // Cyrillic е
  });

  it('generates Latin variants for Cyrillic characters', () => {
    // Input: Cyrillic "а" (U+0430)
    const variants = generateSimilarVariants('\u0430');
    expect(variants).toContain('a'); // Latin a
  });

  it('generates multiple variants for multi-character strings', () => {
    const variants = generateSimilarVariants('ab');
    expect(variants.length).toBeGreaterThan(0);
  });
});

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns string length for comparison with empty string', () => {
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', 'world')).toBe(5);
  });

  it('returns 1 for single-char substitution', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
  });

  it('returns 1 for single-char insertion', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('returns 1 for single-char deletion', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });
});
