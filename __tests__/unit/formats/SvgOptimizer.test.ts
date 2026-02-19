/**
 * SvgOptimizer Unit Tests
 * Tests SVG optimization functionality for TopDog Studio
 * 
 * Implements standalone SVG optimizer with key optimizations:
 * - Comment removal
 * - Whitespace collapse
 * - Color shortening
 * - Empty group removal
 * - Default attribute removal
 * - Metadata stripping
 * - XSS prevention
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// Standalone SVG Optimizer Implementation
// ============================================================================

interface OptimizationStats {
  originalSize: number;
  optimizedSize: number;
  savings: {
    bytes: number;
    percentage: number;
  };
}

/**
 * Shortens hex color values
 * #FFFFFF -> #FFF, #FF0000 -> #F00
 */
function shortenColor(color: string): string {
  if (!color.startsWith('#') || color.length !== 7) {
    return color;
  }

  const r = color[1];
  const g = color[3];
  const b = color[5];

  if (color[2] === r && color[4] === g && color[6] === b) {
    return `#${r}${g}${b}`.toUpperCase();
  }

  return color;
}

/**
 * Removes XML comments from SVG content
 */
function removeComments(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Collapses excessive whitespace while preserving structure
 */
function collapseWhitespace(svg: string): string {
  // Remove newlines and extra spaces, but preserve single spaces between elements
  return svg
    .replace(/\n/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes hidden or invisible elements
 * Elements with display:none, visibility:hidden, opacity:0
 */
function removeHiddenElements(svg: string): string {
  let result = svg;

  // Remove elements with display:none
  result = result.replace(/<[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/g, '');

  // Remove elements with visibility:hidden
  result = result.replace(
    /<[^>]*style="[^"]*visibility:\s*hidden[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/g,
    ''
  );

  return result;
}

/**
 * Removes empty group elements
 */
function removeEmptyGroups(svg: string): string {
  let result = svg;
  let previousLength;

  // Iteratively remove empty <g> tags
  do {
    previousLength = result.length;
    result = result.replace(/<g[^>]*>\s*<\/g>/g, '');
  } while (result.length !== previousLength);

  return result;
}

/**
 * Shortens color values in style attributes and fill/stroke attributes
 */
function optimizeColors(svg: string): string {
  let result = svg;

  // Match hex colors in attributes
  const colorRegex = /#[0-9A-Fa-f]{6}\b/g;
  result = result.replace(colorRegex, (match) => shortenColor(match));

  return result;
}

/**
 * Removes default SVG attributes that are not needed
 */
function removeDefaultAttributes(svg: string): string {
  let result = svg;

  // Remove default fill="none" when not in style
  result = result.replace(/\s+fill="none"/g, '');

  // Remove version attribute (often default)
  result = result.replace(/\s+version="[^"]*"/g, '');

  return result;
}

/**
 * Strips metadata and editor-specific data
 */
function stripMetadata(svg: string): string {
  let result = svg;

  // Remove <metadata> tags
  result = result.replace(/<metadata[\s\S]*?<\/metadata>/g, '');

  // Remove <defs> with only metadata/editor junk
  result = result.replace(/<defs>\s*<\/defs>/g, '');

  // Remove sodipodi and inkscape namespaces and attributes
  result = result.replace(/\s+xmlns:sodipodi="[^"]*"/g, '');
  result = result.replace(/\s+xmlns:inkscape="[^"]*"/g, '');
  result = result.replace(/\s+sodipodi:[^=]*="[^"]*"/g, '');
  result = result.replace(/\s+inkscape:[^=]*="[^"]*"/g, '');

  return result;
}

/**
 * Removes potentially dangerous content (XSS prevention)
 */
function removeDangerousContent(svg: string): string {
  let result = svg;

  // Remove script tags
  result = result.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove event handlers
  result = result.replace(/\s+on\w+="[^"]*"/g, '');

  // Remove javascript: URLs
  result = result.replace(/href="javascript:[^"]*"/gi, '');

  return result;
}

/**
 * Main SVG optimization function
 * Applies all optimization techniques and returns statistics
 */
function optimizeSvg(svg: string): { optimized: string; stats: OptimizationStats } {
  const originalSize = new TextEncoder().encode(svg).length;

  let optimized = svg;

  // Apply optimizations in order
  optimized = removeDangerousContent(optimized);
  optimized = removeComments(optimized);
  optimized = stripMetadata(optimized);
  optimized = removeHiddenElements(optimized);
  optimized = removeEmptyGroups(optimized);
  optimized = optimizeColors(optimized);
  optimized = removeDefaultAttributes(optimized);
  optimized = collapseWhitespace(optimized);

  const optimizedSize = new TextEncoder().encode(optimized).length;
  const savedBytes = originalSize - optimizedSize;
  const savedPercentage =
    originalSize > 0 ? Math.round((savedBytes / originalSize) * 100 * 100) / 100 : 0;

  const stats: OptimizationStats = {
    originalSize,
    optimizedSize,
    savings: {
      bytes: savedBytes,
      percentage: savedPercentage,
    },
  };

  return { optimized, stats };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SvgOptimizer - SVG Optimization', () => {
  describe('Comment Removal', () => {
    it('removes single-line XML comments', () => {
      const svg = '<svg><!-- This is a comment --><rect/></svg>';
      const result = removeComments(svg);
      expect(result).not.toContain('<!--');
      expect(result).not.toContain('comment');
      expect(result).toContain('<rect/>');
    });

    it('removes multi-line XML comments', () => {
      const svg = `<svg>
        <!-- This is a 
             multi-line comment -->
        <circle/>
      </svg>`;
      const result = removeComments(svg);
      expect(result).not.toContain('<!--');
      expect(result).toContain('<circle/>');
    });

    it('removes multiple comments', () => {
      const svg = '<svg><!-- c1 --><rect/><!-- c2 --><circle/></svg>';
      const result = removeComments(svg);
      expect(result).not.toContain('<!--');
      expect(result).not.toContain('-->');
    });

    it('preserves SVG content when removing comments', () => {
      const svg = '<svg><!-- comment --><path d="M10,10 L20,20"/></svg>';
      const result = removeComments(svg);
      expect(result).toContain('<path d="M10,10 L20,20"/>');
    });
  });

  describe('Whitespace Collapse', () => {
    it('removes newlines', () => {
      const svg = `<svg>
        <rect/>
      </svg>`;
      const result = collapseWhitespace(svg);
      expect(result).not.toContain('\n');
    });

    it('removes excessive spaces between tags', () => {
      const svg = '<svg>   <rect/>   <circle/>   </svg>';
      const result = collapseWhitespace(svg);
      expect(result).not.toContain('   ');
    });

    it('collapses multiple spaces to single space', () => {
      const svg = '<svg>  <g>  <rect/>  </g>  </svg>';
      const result = collapseWhitespace(svg);
      expect(result).toBe('<svg><g><rect/></g></svg>');
    });

    it('preserves content between tags', () => {
      const svg = '<text>  Hello World  </text>';
      const result = collapseWhitespace(svg);
      expect(result).toContain('Hello World');
    });
  });

  describe('Color Shortening', () => {
    it('shortens #FFFFFF to #FFF', () => {
      expect(shortenColor('#FFFFFF')).toBe('#FFF');
    });

    it('shortens #FF0000 to #F00', () => {
      expect(shortenColor('#FF0000')).toBe('#F00');
    });

    it('shortens #0000FF to #00F', () => {
      expect(shortenColor('#0000FF')).toBe('#00F');
    });

    it('shortens #AABBCC to #ABC', () => {
      expect(shortenColor('#AABBCC')).toBe('#ABC');
    });

    it('does not shorten non-shortenenable colors', () => {
      expect(shortenColor('#ABCDEF')).toBe('#ABCDEF');
    });

    it('handles lowercase hex values', () => {
      expect(shortenColor('#ffffff')).toBe('#FFF');
    });

    it('returns non-hex colors unchanged', () => {
      expect(shortenColor('red')).toBe('red');
      expect(shortenColor('rgb(255,0,0)')).toBe('rgb(255,0,0)');
    });

    it('optimizes colors in SVG attributes', () => {
      const svg = '<svg><rect fill="#FF0000"/></svg>';
      const result = optimizeColors(svg);
      expect(result).toContain('#F00');
      expect(result).not.toContain('#FF0000');
    });

    it('optimizes colors in style attributes', () => {
      const svg = '<svg><rect style="fill:#FFFFFF"/></svg>';
      const result = optimizeColors(svg);
      expect(result).toContain('#FFF');
    });
  });

  describe('Empty Group Removal', () => {
    it('removes empty <g> tags', () => {
      const svg = '<svg><g></g><rect/></svg>';
      const result = removeEmptyGroups(svg);
      expect(result).not.toContain('<g></g>');
      expect(result).toContain('<rect/>');
    });

    it('removes nested empty groups', () => {
      const svg = '<svg><g><g></g></g></svg>';
      const result = removeEmptyGroups(svg);
      expect(result).not.toContain('<g>');
    });

    it('preserves groups with content', () => {
      const svg = '<svg><g><rect/></g></svg>';
      const result = removeEmptyGroups(svg);
      expect(result).toContain('<g><rect/></g>');
    });

    it('removes multiple empty groups', () => {
      const svg = '<svg><g></g><rect/><g></g></svg>';
      const result = removeEmptyGroups(svg);
      expect(result).not.toContain('<g></g>');
    });

    it('handles whitespace in empty groups', () => {
      const svg = '<svg><g>   </g></svg>';
      const result = removeEmptyGroups(svg);
      expect(result).not.toContain('<g>');
    });
  });

  describe('Hidden Element Removal', () => {
    it('removes elements with display:none', () => {
      const svg = '<svg><rect style="display:none"></rect><circle/></svg>';
      const result = removeHiddenElements(svg);
      expect(result).not.toContain('display:none');
      expect(result).toContain('<circle/>');
    });

    it('removes elements with visibility:hidden', () => {
      const svg = '<svg><rect style="visibility:hidden"></rect><circle/></svg>';
      const result = removeHiddenElements(svg);
      expect(result).not.toContain('visibility:hidden');
      expect(result).toContain('<circle/>');
    });

    it('preserves visible elements', () => {
      const svg = '<svg><rect/><circle/></svg>';
      const result = removeHiddenElements(svg);
      expect(result).toContain('<rect/>');
      expect(result).toContain('<circle/>');
    });
  });

  describe('Default Attribute Removal', () => {
    it('removes fill="none" attributes', () => {
      const svg = '<svg><rect fill="none"/></svg>';
      const result = removeDefaultAttributes(svg);
      expect(result).not.toContain('fill="none"');
    });

    it('removes version attributes', () => {
      const svg = '<svg version="1.1"><rect/></svg>';
      const result = removeDefaultAttributes(svg);
      expect(result).not.toContain('version=');
    });

    it('preserves non-default attributes', () => {
      const svg = '<svg><rect fill="#FF0000"/></svg>';
      const result = removeDefaultAttributes(svg);
      expect(result).toContain('fill=');
    });
  });

  describe('Metadata Stripping', () => {
    it('removes metadata tags', () => {
      const svg = '<svg><metadata>Author: John</metadata><rect/></svg>';
      const result = stripMetadata(svg);
      expect(result).not.toContain('<metadata');
      expect(result).toContain('<rect/>');
    });

    it('removes empty defs tags', () => {
      const svg = '<svg><defs></defs><rect/></svg>';
      const result = stripMetadata(svg);
      expect(result).not.toContain('<defs>');
      expect(result).toContain('<rect/>');
    });

    it('removes sodipodi namespace', () => {
      const svg =
        '<svg xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"><rect/></svg>';
      const result = stripMetadata(svg);
      expect(result).not.toContain('sodipodi');
    });

    it('removes inkscape namespace', () => {
      const svg =
        '<svg xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"><rect/></svg>';
      const result = stripMetadata(svg);
      expect(result).not.toContain('inkscape');
    });

    it('removes sodipodi attributes', () => {
      const svg = '<svg><rect sodipodi:type="rect"/></svg>';
      const result = stripMetadata(svg);
      expect(result).not.toContain('sodipodi:');
    });

    it('removes inkscape attributes', () => {
      const svg = '<svg><rect inkscape:label="layer"/></svg>';
      const result = stripMetadata(svg);
      expect(result).not.toContain('inkscape:');
    });
  });

  describe('XSS Prevention', () => {
    it('removes script tags', () => {
      const svg = '<svg><script>alert("xss")</script><rect/></svg>';
      const result = removeDangerousContent(svg);
      expect(result).not.toContain('<script');
      expect(result).toContain('<rect/>');
    });

    it('removes event handlers', () => {
      const svg = '<svg><rect onclick="alert(1)"/></svg>';
      const result = removeDangerousContent(svg);
      expect(result).not.toContain('onclick');
    });

    it('removes javascript: URLs', () => {
      const svg = '<svg><a href="javascript:alert(1)">link</a></svg>';
      const result = removeDangerousContent(svg);
      expect(result).not.toContain('javascript:');
    });

    it('removes multiple event handlers', () => {
      const svg =
        '<svg><rect onload="alert(1)" onerror="alert(2)" onmouseover="alert(3)"/></svg>';
      const result = removeDangerousContent(svg);
      expect(result).not.toContain('onload');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('onmouseover');
    });

    it('preserves safe SVG content', () => {
      const svg = '<svg><rect fill="red" width="100"/></svg>';
      const result = removeDangerousContent(svg);
      expect(result).toContain('fill=');
      expect(result).toContain('width=');
    });
  });

  describe('Full Optimization', () => {
    it('applies all optimizations', () => {
      const svg = `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
          <!-- Editor metadata -->
          <metadata>Created by Inkscape</metadata>
          <defs></defs>
          <!-- Main content -->
          <g>
            <rect fill="#FF0000" style="display:none"></rect>
            <circle fill="#FFFFFF"/>
          </g>
          <g></g>
        </svg>
      `;

      const { optimized, stats } = optimizeSvg(svg);

      // Check all optimizations applied
      expect(optimized).not.toContain('<!--');
      expect(optimized).not.toContain('metadata');
      expect(optimized).not.toContain('display:none');
      expect(optimized).not.toContain('<g></g>');
      expect(optimized).not.toContain('#FF0000');
      expect(optimized).toContain('#FFF');
      expect(optimized).not.toContain('\n');

      // Check stats are accurate
      expect(stats.originalSize).toBeGreaterThan(stats.optimizedSize);
      expect(stats.savings.bytes).toBeGreaterThan(0);
      expect(stats.savings.percentage).toBeGreaterThan(0);
    });

    it('preserves essential SVG structure', () => {
      const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="blue"/>
      </svg>`;

      const { optimized } = optimizeSvg(svg);

      expect(optimized).toContain('width=');
      expect(optimized).toContain('height=');
      expect(optimized).toContain('circle');
      expect(optimized).toContain('cx=');
      expect(optimized).toContain('cy=');
    });

    it('handles complex real-world SVG', () => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <!-- Created by designer -->
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              .myclass { fill: #FF0000; }
            </style>
          </defs>
          <g id="layer1">
            <g></g>
            <path d="M10,10 L20,20" stroke="#0000FF" fill="none"/>
            <text x="10" y="20">Hello</text>
          </g>
          <g style="display:none">
            <rect width="100" height="100"/>
          </g>
        </svg>`;

      const { optimized, stats } = optimizeSvg(svg);

      // Should be significantly smaller
      expect(stats.savings.percentage).toBeGreaterThan(10);
      expect(optimized).not.toContain('display:none');
      expect(optimized).not.toContain('<!--');
      expect(optimized).toContain('path');
      expect(optimized).toContain('text');
    });
  });

  describe('Statistics Accuracy', () => {
    it('calculates correct original size', () => {
      const svg = '<svg><rect/></svg>';
      const { stats } = optimizeSvg(svg);
      expect(stats.originalSize).toBe(new TextEncoder().encode(svg).length);
    });

    it('calculates correct optimized size', () => {
      const svg = '<svg><!-- comment --><rect/></svg>';
      const { optimized, stats } = optimizeSvg(svg);
      expect(stats.optimizedSize).toBe(new TextEncoder().encode(optimized).length);
    });

    it('calculates correct bytes saved', () => {
      const svg = '<svg><!-- long comment content here --><rect/></svg>';
      const { stats } = optimizeSvg(svg);
      expect(stats.savings.bytes).toBeGreaterThan(0);
      expect(stats.savings.bytes).toBe(stats.originalSize - stats.optimizedSize);
    });

    it('calculates correct percentage saved', () => {
      const svg = '<svg><!-- comment --><rect/></svg>';
      const { stats } = optimizeSvg(svg);
      const expectedPercentage = (stats.savings.bytes / stats.originalSize) * 100;
      expect(Math.abs(stats.savings.percentage - expectedPercentage)).toBeLessThan(0.01);
    });

    it('returns 0% savings for already optimized SVG', () => {
      const svg = '<svg><rect/></svg>';
      const { stats } = optimizeSvg(svg);
      expect(stats.savings.percentage).toBe(0);
    });
  });

  describe('Content Preservation', () => {
    it('preserves path data', () => {
      const svg = '<svg><path d="M10,10 L100,100 Q 200,200 300,300"/></svg>';
      const { optimized } = optimizeSvg(svg);
      expect(optimized).toContain('M10,10 L100,100 Q 200,200 300,300');
    });

    it('preserves text content', () => {
      const svg = '<svg><text>Important Text</text></svg>';
      const { optimized } = optimizeSvg(svg);
      expect(optimized).toContain('Important Text');
    });

    it('preserves viewBox attributes', () => {
      const svg = '<svg viewBox="0 0 100 100"><rect/></svg>';
      const { optimized } = optimizeSvg(svg);
      expect(optimized).toContain('viewBox');
    });

    it('preserves transform attributes', () => {
      const svg = '<svg><g transform="translate(10,20)"><rect/></g></svg>';
      const { optimized } = optimizeSvg(svg);
      expect(optimized).toContain('transform');
    });

    it('preserves meaningful IDs and classes', () => {
      const svg = '<svg><rect id="myRect" class="highlight"/></svg>';
      const { optimized } = optimizeSvg(svg);
      expect(optimized).toContain('id=');
      expect(optimized).toContain('class=');
    });
  });
});
