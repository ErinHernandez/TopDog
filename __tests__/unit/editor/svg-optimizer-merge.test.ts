/**
 * SvgOptimizer Merge Paths Tests
 * Tests SVG path merging optimization functionality
 *
 * Tests the mergePaths feature which combines consecutive paths with
 * identical attributes to reduce file size while maintaining visual output
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SvgOptimizer } from '@/lib/studio/editor/formats/svg/SvgOptimizer';

describe('SvgOptimizer.optimize - mergePaths', () => {
  let optimizer: SvgOptimizer;

  beforeEach(() => {
    optimizer = new SvgOptimizer();
  });

  // ============================================================================
  // Path Merging Tests
  // ============================================================================

  it('merges consecutive paths with identical fill attributes', () => {
    const svg = `<svg><path fill="#000000" d="M10 10 L20 20" /><path fill="#000000" d="M30 30 L40 40" /></svg>`;

    const { svg: optimized, stats } = optimizer.optimize(svg, { mergePaths: true });

    // Should have merged the two paths into one
    expect(stats.pathsSimplified).toBeGreaterThan(0);
    expect(optimized).toContain('M10 10 L20 20 M30 30 L40 40');
    expect((optimized.match(/<path/g) || []).length).toBeLessThan(
      (svg.match(/<path/g) || []).length
    );
  });

  it('does not merge paths with different fill colors', () => {
    const svg = `<svg><path fill="#FF0000" d="M10 10 L20 20" /><path fill="#00FF00" d="M30 30 L40 40" /></svg>`;

    const { svg: optimized, stats } = optimizer.optimize(svg, { mergePaths: true });

    // Should not merge paths with different colors
    expect(stats.pathsSimplified).toBe(0);
    expect((optimized.match(/<path/g) || []).length).toEqual(2);
  });

  it('does not merge paths with different stroke attributes', () => {
    const svg = `<svg><path fill="#000000" stroke="none" d="M10 10 L20 20" /><path fill="#000000" stroke="#FF0000" d="M30 30 L40 40" /></svg>`;

    const { svg: optimized, stats } = optimizer.optimize(svg, { mergePaths: true });

    // Should not merge because stroke attributes differ
    expect(stats.pathsSimplified).toBe(0);
    expect((optimized.match(/<path/g) || []).length).toEqual(2);
  });

  it('updates pathsSimplified stat correctly', () => {
    const svg = `<svg><path fill="#000" d="M0 0 L10 10" /><path fill="#000" d="M20 20 L30 30" /><path fill="#000" d="M40 40 L50 50" /></svg>`;

    const { stats } = optimizer.optimize(svg, { mergePaths: true });

    // Three paths merged into one: eliminated 2 paths
    expect(stats.pathsSimplified).toEqual(2);
  });

  it('works with other optimizations enabled simultaneously', () => {
    const svg = `<svg><!-- comment to remove --><path fill="black" d="M10 10 L20 20" /><path fill="black" d="M30 30 L40 40" /></svg>`;

    const { svg: optimized, stats } = optimizer.optimize(svg, {
      mergePaths: true,
      removeComments: true,
      minify: true,
    });

    // Should remove comments, merge paths, and minify
    expect(optimized).not.toContain('<!--');
    expect(stats.pathsSimplified).toBeGreaterThan(0);
    // Minified should have no line breaks
    expect(optimized).not.toContain('\n');
  });

  it('handles single path (nothing to merge)', () => {
    const svg = `<svg><path fill="#000" d="M10 10 L20 20" /></svg>`;

    const { svg: optimized, stats } = optimizer.optimize(svg, { mergePaths: true });

    // Single path: nothing to merge
    expect(stats.pathsSimplified).toBe(0);
    expect((optimized.match(/<path/g) || []).length).toEqual(1);
  });

  it('handles empty SVG gracefully', () => {
    const svg = `<svg></svg>`;

    const { svg: optimized, stats } = optimizer.optimize(svg, { mergePaths: true });

    // Should handle empty SVG without errors
    expect(optimized).toContain('<svg>');
    expect(stats.pathsSimplified).toBe(0);
  });

  // ============================================================================
  // Combination Tests
  // ============================================================================

  it('minify + merge together produces correct result', () => {
    const svg = `<svg><path fill="#000000" d="M10 10 L20 20" /><path fill="#000000" d="M30 30 L40 40" /></svg>`;

    const { svg: optimized } = optimizer.optimize(svg, {
      mergePaths: true,
      minify: true,
    });

    // Should be minified (no extra whitespace) and paths merged
    expect(optimized).not.toContain('\n  ');
    expect((optimized.match(/<path/g) || []).length).toBeLessThan(2);
  });

  it('stats show correct size reduction', () => {
    const svg = `<svg><path fill="#000" d="M10 10 L20 20" /><path fill="#000" d="M30 30 L40 40" /></svg>`;

    const { stats } = optimizer.optimize(svg, { mergePaths: true });

    // Merging should reduce size
    expect(stats.sizeReduction).toBeGreaterThan(0);
    expect(stats.optimizedSize).toBeLessThan(stats.originalSize);
  });

  it('removeComments + merge: comments removed and paths merged', () => {
    const svg = `<svg><!-- This is a comment --><path fill="#000" d="M0 0 L10 10" /><!-- Another comment --><path fill="#000" d="M20 20 L30 30" /></svg>`;

    const { svg: optimized, stats } = optimizer.optimize(svg, {
      mergePaths: true,
      removeComments: true,
    });

    // Comments should be removed
    expect(optimized).not.toContain('<!--');
    // Paths should be merged
    expect(stats.pathsSimplified).toBeGreaterThan(0);
  });

  it('mergeNestedGroups + merge: groups collapsed and paths merged', () => {
    const svg = `<svg><g fill="#000"><path d="M0 0 L10 10" /><path d="M20 20 L30 30" /></g></svg>`;

    const { stats } = optimizer.optimize(svg, {
      mergePaths: true,
      mergeNestedGroups: true,
    });

    // Should merge paths within groups
    expect(stats.pathsSimplified).toBeGreaterThan(0);
  });

  it('enableAll enables all optimizations including merge', () => {
    const svg = `<svg><!-- comment --><path fill="black" d="M0 0 L10 10" /><path fill="black" d="M20 20 L30 30" /></svg>`;

    const { svg: optimized, stats } = optimizer.optimize(svg, {
      enableAll: true,
    });

    // Should apply all optimizations
    expect(optimized).not.toContain('<!--');
    expect(stats.pathsSimplified).toBeGreaterThan(0);
    expect(stats.percentReduction).toBeGreaterThan(0);
  });

  // ============================================================================
  // Attribute Matching Tests
  // ============================================================================

  it('merges paths with multiple identical attributes', () => {
    const svg = `<svg><path fill="#000" stroke="none" opacity="1" d="M0 0 L10 10" /><path fill="#000" stroke="none" opacity="1" d="M20 20 L30 30" /></svg>`;

    const { stats } = optimizer.optimize(svg, { mergePaths: true });

    // All attributes match, should merge
    expect(stats.pathsSimplified).toBeGreaterThan(0);
  });

  it('does not merge when opacity differs', () => {
    const svg = `<svg>
      <path fill="#000" opacity="1" d="M0 0 L10 10" />
      <path fill="#000" opacity="0.5" d="M20 20 L30 30" />
    </svg>`;

    const { stats } = optimizer.optimize(svg, { mergePaths: true });

    // Different opacity, should not merge
    expect(stats.pathsSimplified).toBe(0);
  });

  it('merges paths separated only by whitespace', () => {
    const svg = `<svg><path fill="#000" d="M0 0 L10 10"   /><path fill="#000" d="M20 20 L30 30" /></svg>`;

    const { stats } = optimizer.optimize(svg, { mergePaths: true });

    // Should merge despite whitespace
    expect(stats.pathsSimplified).toBeGreaterThan(0);
  });

  it('preserves path data correctly after merge', () => {
    const svg = `<svg><path fill="#f00" d="M10,10 L20,20" /><path fill="#f00" d="M30,30 L40,40" /></svg>`;

    const { svg: optimized } = optimizer.optimize(svg, { mergePaths: true });

    // Both path data should be present
    expect(optimized).toContain('M10,10');
    expect(optimized).toContain('L20,20');
    expect(optimized).toContain('M30,30');
    expect(optimized).toContain('L40,40');
  });
});
