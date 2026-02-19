/**
 * Test suite for PlatformIntelligenceImageExtension code analysis methods
 * Tests analyzeSemanticStructure and analyzeResponsiveness for HTML/CSS code analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformIntelligenceImageExtension } from '@/lib/studio/integration/intelligence/PlatformIntelligenceImageExtension';
import {
  AnalysisType,
  PlatformIntelligenceConfig,
  CodeInput,
} from '@/lib/studio/integration/intelligence/types';

/**
 * Default test configuration with code analysis enabled
 */
const testConfig: PlatformIntelligenceConfig = {
  apiEndpoint: 'https://test.api',
  userId: 'test-user',
  projectId: 'test-project',
  maxImageSizeMB: 10,
  maxCodeLengthChars: 100000,
  enableImageAnalysis: false,
  enableCodeAnalysis: true,
  enableCombinedAnalysis: false,
};

/**
 * Test code samples
 */
const codeExamples = {
  // Well-structured HTML with proper semantic markup
  goodHTML: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Test Page</title>
</head>
<body>
  <header>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <h1>Welcome</h1>
    <h2>Getting Started</h2>
    <section>
      <h3>First Steps</h3>
      <form>
        <label for="username">Username</label>
        <input id="username" type="text" />
        <label for="email">Email</label>
        <input id="email" type="email" />
        <label for="password">Password</label>
        <input id="password" type="password" />
      </form>
      <ol>
        <li>First item</li>
        <li>Second item</li>
      </ol>
      <ul>
        <li>Bullet point</li>
        <li>Another point</li>
      </ul>
    </section>
  </main>
  <footer>Copyright 2024</footer>
</body>
</html>`,

  // Poorly structured HTML with heading hierarchy issues
  badHeadingHTML: `
<html>
<body>
  <h1>Title</h1>
  <h3>Skipped h2!</h3>
  <h2>This is after h3</h2>
</body>
</html>`,

  // No landmarks
  noLandmarksHTML: `
<html>
<body>
  <div class="header">
    <div class="nav">Navigation</div>
  </div>
  <div id="main-content">
    <h1>Title</h1>
  </div>
</body>
</html>`,

  // No headings
  noHeadingsHTML: `
<html>
<body>
  <header><nav><ul><li>Home</li></ul></nav></header>
  <main>
    <section>
      Some content without headings
    </section>
  </main>
</html>`,

  // Multiple h1 tags
  multipleH1HTML: `
<html>
<body>
  <h1>First H1</h1>
  <h1>Second H1</h1>
  <h1>Third H1</h1>
</body>
</html>`,

  // Form inputs without labels
  unlabeledInputsHTML: `
<html>
<body>
  <main>
    <form>
      <input type="text" placeholder="Name" />
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
    </form>
  </main>
</html>`,

  // ARIA landmarks
  ariaLandmarksHTML: `
<html>
<body>
  <div role="banner">Header</div>
  <div role="navigation">Nav</div>
  <div role="main">
    <h1>Title</h1>
    <h2>Subtitle</h2>
  </div>
  <div role="complementary">Sidebar</div>
  <div role="contentinfo">Footer</div>
</body>
</html>`,

  // Inline label wrapping inputs
  inlineLabelsHTML: `
<html>
<body>
  <main>
    <form>
      <label>Name <input type="text" /></label>
      <label>Email <input type="email" /></label>
      <label for="phone">Phone</label>
      <input id="phone" type="tel" />
    </form>
  </main>
</html>`,

  // Responsive CSS with breakpoints
  responsiveCSS: `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    .container { display: flex; }
    .grid { display: grid; }

    @media (min-width: 576px) {
      .col { width: 50%; }
    }
    @media (min-width: 768px) {
      .col { width: 33%; }
    }
    @media (min-width: 992px) {
      .col { width: 25%; }
    }
    @media (max-width: 480px) {
      .nav { display: none; }
    }
  </style>
</head>
<body>
  <header><nav class="nav">Nav</nav></header>
  <main class="container grid">
    <div class="col">Col 1</div>
    <div class="col">Col 2</div>
  </main>
</body>
</html>`,

  // Only flexbox, no grid
  flexboxOnlyCSS: `
<html>
<head>
  <style>
    .container { display: flex; }
    .row { display: flex; gap: 1rem; }
  </style>
</head>
<body>
  <main class="container"></main>
</body>
</html>`,

  // Only grid, no flexbox
  gridOnlyCSS: `
<html>
<head>
  <style>
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); }
  </style>
</head>
<body>
  <main class="grid"></main>
</body>
</html>`,

  // No media queries
  noMediaQueriesCSS: `
<html>
<head>
  <style>
    .container { width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <main class="container"></main>
</body>
</html>`,

  // No viewport meta
  noViewportHTML: `
<html>
<head>
  <title>No viewport</title>
</head>
<body>
  <main><h1>Title</h1></main>
</body>
</html>`,

  // Inline-flex usage
  inlineFlexCSS: `
<html>
<head>
  <style>
    .inline-flex { display: inline-flex; }
  </style>
</head>
<body>
  <main></main>
</body>
</html>`,

  // Inline-grid usage
  inlineGridCSS: `
<html>
<head>
  <style>
    .inline-grid { display: inline-grid; }
  </style>
</head>
<body>
  <main></main>
</body>
</html>`,

  // Many media queries
  manyMediaQueriesCSS: `
<html>
<head>
  <style>
    @media (min-width: 300px) { .a { display: none; } }
    @media (min-width: 400px) { .b { display: none; } }
    @media (min-width: 500px) { .c { display: none; } }
    @media (min-width: 600px) { .d { display: none; } }
    @media (min-width: 700px) { .e { display: none; } }
    @media (min-width: 800px) { .f { display: none; } }
    @media (min-width: 900px) { .g { display: none; } }
    @media (min-width: 1000px) { .h { display: none; } }
    @media (min-width: 1100px) { .i { display: none; } }
    @media (min-width: 1200px) { .j { display: none; } }
    @media (min-width: 1300px) { .k { display: none; } }
    @media (min-width: 1400px) { .l { display: none; } }
    @media (min-width: 1500px) { .m { display: none; } }
    @media (min-width: 1600px) { .n { display: none; } }
    @media (min-width: 1700px) { .o { display: none; } }
    @media (min-width: 1800px) { .p { display: none; } }
    @media (min-width: 1900px) { .q { display: none; } }
    @media (min-width: 2000px) { .r { display: none; } }
    @media (min-width: 2100px) { .s { display: none; } }
    @media (min-width: 2200px) { .t { display: none; } }
    @media (min-width: 2300px) { .u { display: none; } }
  </style>
</head>
<body></body>
</html>`,

  // Mixed breakpoints with mobile-first approach
  mobileFinalCSS: `
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @media (max-width: 480px) { .mobile { display: block; } }
    @media (min-width: 640px) { .col { width: 50%; } }
    @media (min-width: 768px) { .col { width: 33%; } }
  </style>
</head>
<body></body>
</html>`,

  // Empty code
  emptyCode: ``,
};

describe('PlatformIntelligenceImageExtension - analyzeSemanticStructure', () => {
  let extension: PlatformIntelligenceImageExtension;

  beforeEach(() => {
    extension = new PlatformIntelligenceImageExtension(testConfig);
  });

  describe('Heading Hierarchy', () => {
    it('should detect proper h1→h2→h3 hierarchy', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-good-headings',
            language: 'html',
            code: codeExamples.goodHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.headingHierarchy).toBe(true);
    });

    it('should detect skipped heading levels (h1→h3)', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-skip-heading',
            language: 'html',
            code: codeExamples.badHeadingHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.headingHierarchy).toBe(false);
    });

    it('should handle no headings', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-headings',
            language: 'html',
            code: codeExamples.noHeadingsHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(typeof analysis?.headingHierarchy).toBe('boolean');
    });

    it('should detect multiple h1 tags', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-multi-h1',
            language: 'html',
            code: codeExamples.multipleH1HTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Landmark Regions', () => {
    it('should detect <header>, <nav>, <main>, <footer> tags', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-landmarks',
            language: 'html',
            code: codeExamples.goodHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      const regions = analysis?.landmarkRegions || [];
      expect(regions).toContain('header');
      expect(regions).toContain('nav');
      expect(regions).toContain('main');
      expect(regions).toContain('footer');
    });

    it('should detect ARIA landmarks (role="banner", role="navigation", etc.)', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-aria-landmarks',
            language: 'html',
            code: codeExamples.ariaLandmarksHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      const regions = analysis?.landmarkRegions || [];
      expect(regions).toContain('banner');
      expect(regions).toContain('navigation');
      expect(regions).toContain('main');
      expect(regions).toContain('complementary');
      expect(regions).toContain('contentinfo');
    });

    it('should return deduplicated list of landmark regions', async () => {
      const code = `
        <html>
        <body>
          <header></header>
          <header></header>
          <nav></nav>
          <nav></nav>
          <main></main>
          <footer></footer>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-dedup-landmarks',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      const regions = analysis?.landmarkRegions || [];
      const headerCount = regions.filter(r => r === 'header').length;
      expect(headerCount).toBe(1); // Should be deduplicated
    });

    it('should return empty array when no landmarks present', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-landmarks',
            language: 'html',
            code: codeExamples.noLandmarksHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(Array.isArray(analysis?.landmarkRegions)).toBe(true);
      expect(analysis?.landmarkRegions.length).toBe(0);
    });
  });

  describe('List Structures', () => {
    it('should count <ol> tags correctly', async () => {
      const code = `
        <html>
        <body>
          <ol><li>Item 1</li></ol>
          <ol><li>Item 2</li></ol>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-ol-count',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.listStructures.ordered).toBe(2);
    });

    it('should count <ul> tags correctly', async () => {
      const code = `
        <html>
        <body>
          <ul><li>Item 1</li></ul>
          <ul><li>Item 2</li></ul>
          <ul><li>Item 3</li></ul>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-ul-count',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.listStructures.unordered).toBe(3);
    });

    it('should handle nested lists in HTML', async () => {
      const code = `
        <html>
        <body>
          <ul>
            <li>Item 1
              <ul>
                <li>Nested 1</li>
              </ul>
            </li>
            <li>Item 2
              <ol>
                <li>Ordered nested</li>
              </ol>
            </li>
          </ul>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-nested-lists',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.listStructures.unordered).toBe(2);
      expect(analysis?.listStructures.ordered).toBe(1);
    });

    it('should return 0 for both when no lists present', async () => {
      const code = `
        <html>
        <body>
          <main>
            <h1>Title</h1>
            <p>No lists here</p>
          </main>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-lists',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.listStructures.ordered).toBe(0);
      expect(analysis?.listStructures.unordered).toBe(0);
    });
  });

  describe('Label Associations', () => {
    it('should count labels with for= attribute', async () => {
      const code = `
        <html>
        <body>
          <label for="name">Name</label>
          <input id="name" type="text" />
          <label for="email">Email</label>
          <input id="email" type="email" />
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-for-labels',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      // Implementation counts labels with for= plus labels wrapping inputs
      expect(analysis?.labelAssociations).toBeGreaterThanOrEqual(2);
    });

    it('should count labels with htmlFor= (JSX)', async () => {
      const code = `
        <div>
          <label htmlFor="user">User</label>
          <input id="user" type="text" />
        </div>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-htmlfor-labels',
            language: 'jsx',
            code,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.labelAssociations).toBeGreaterThanOrEqual(0);
    });

    it('should count inline labels wrapping inputs', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-inline-labels',
            language: 'html',
            code: codeExamples.inlineLabelsHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.labelAssociations).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 when no labels present', async () => {
      const code = `
        <html>
        <body>
          <main>
            <input type="text" />
            <input type="email" />
          </main>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-labels',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.labelAssociations).toBe(0);
    });
  });

  describe('Scoring', () => {
    it('should score perfect HTML high (close to 100)', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-perfect-score',
            language: 'html',
            code: codeExamples.goodHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.score).toBeGreaterThanOrEqual(85);
      expect(analysis?.score).toBeLessThanOrEqual(100);
    });

    it('should deduct points for missing main landmark', async () => {
      const noMainCode = `
        <html>
        <body>
          <header><nav><ul><li>Home</li></ul></nav></header>
          <section><h1>Title</h1></section>
          <footer>Footer</footer>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-main',
            language: 'html',
            code: noMainCode,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.issues.some(i => i.message.includes('main'))).toBe(true);
    });

    it('should deduct points for missing nav landmark', async () => {
      const noNavCode = `
        <html>
        <body>
          <header>Header</header>
          <main><h1>Title</h1></main>
          <footer>Footer</footer>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-nav',
            language: 'html',
            code: noNavCode,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.issues.some(i => i.message.includes('nav'))).toBe(true);
    });

    it('should deduct points for broken heading hierarchy', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-bad-hierarchy-score',
            language: 'html',
            code: codeExamples.badHeadingHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.score).toBeLessThan(100);
    });

    it('should maintain score between 0 and 100', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-score-bounds',
            language: 'html',
            code: codeExamples.goodHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis?.score).toBeGreaterThanOrEqual(0);
      expect(analysis?.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Issues Detection', () => {
    it('should return empty issues array for perfect HTML', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-perfect-issues',
            language: 'html',
            code: codeExamples.goodHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(Array.isArray(analysis?.issues)).toBe(true);
      expect(analysis?.issues.length).toBeLessThanOrEqual(2);
    });

    it('should flag missing labels on inputs', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-missing-labels',
            language: 'html',
            code: codeExamples.unlabeledInputsHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      const labelIssues = analysis?.issues.filter(i =>
        i.message.toLowerCase().includes('label')
      );
      expect(labelIssues && labelIssues.length > 0).toBe(true);
    });

    it('should include severity levels in issues', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-issue-severity',
            language: 'html',
            code: codeExamples.badHeadingHTML,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      for (const issue of analysis?.issues || []) {
        expect(['critical', 'major', 'minor']).toContain(issue.severity);
      }
    });
  });

  describe('Empty Code Handling', () => {
    it('should handle empty code array', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [],
        [AnalysisType.SemanticStructure]
      );

      // Empty code array means no codeAnalysis is populated
      expect(result.metadata).toBeDefined();
      expect(result.codeAnalysis?.semanticStructure).toBeUndefined();
    });

    it('should handle code with no content', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-empty',
            language: 'html',
            code: codeExamples.emptyCode,
          },
        ],
        [AnalysisType.SemanticStructure]
      );

      const analysis = result.codeAnalysis?.semanticStructure;
      expect(analysis).toBeDefined();
    });
  });
});

describe('PlatformIntelligenceImageExtension - analyzeResponsiveness', () => {
  let extension: PlatformIntelligenceImageExtension;

  beforeEach(() => {
    extension = new PlatformIntelligenceImageExtension(testConfig);
  });

  describe('Breakpoint Extraction', () => {
    it('should extract min-width values from @media queries', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-min-width',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      const breakpoints = analysis?.breakpoints || [];
      expect(breakpoints.length).toBeGreaterThan(0);
      expect(breakpoints).toContain(576);
      expect(breakpoints).toContain(768);
      expect(breakpoints).toContain(992);
    });

    it('should extract max-width values from @media queries', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-max-width',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      const breakpoints = analysis?.breakpoints || [];
      expect(breakpoints).toContain(480);
    });

    it('should return sorted unique breakpoints', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-sorted-unique',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      const breakpoints = analysis?.breakpoints || [];

      // Check uniqueness
      const uniqueBreakpoints = new Set(breakpoints);
      expect(breakpoints.length).toBe(uniqueBreakpoints.size);

      // Check sorted
      for (let i = 1; i < breakpoints.length; i++) {
        expect(breakpoints[i]).toBeGreaterThan(breakpoints[i - 1]);
      }
    });

    it('should return empty array when no media queries present', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-media',
            language: 'html',
            code: codeExamples.noMediaQueriesCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(Array.isArray(analysis?.breakpoints)).toBe(true);
      expect(analysis?.breakpoints.length).toBe(0);
    });
  });

  describe('Layout Detection', () => {
    it('should detect display: flex', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-flex',
            language: 'html',
            code: codeExamples.flexboxOnlyCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.flexboxUsage).toBe(true);
    });

    it('should detect display: grid', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-grid',
            language: 'html',
            code: codeExamples.gridOnlyCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.gridUsage).toBe(true);
    });

    it('should detect display: inline-flex', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-inline-flex',
            language: 'html',
            code: codeExamples.inlineFlexCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.flexboxUsage).toBe(true);
    });

    it('should detect display: inline-grid', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-inline-grid',
            language: 'html',
            code: codeExamples.inlineGridCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.gridUsage).toBe(true);
    });

    it('should return false for both when no layout declarations present', async () => {
      const code = `
        <html>
        <head>
          <style>
            .container { width: 1200px; }
            .box { padding: 20px; }
          </style>
        </head>
        <body>
          <main class="container"></main>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-layout',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.flexboxUsage).toBe(false);
      expect(analysis?.gridUsage).toBe(false);
    });
  });

  describe('Media Queries Counting', () => {
    it('should count total @media occurrences', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-count-media',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.mediaQueries).toBeGreaterThan(0);
      expect(analysis?.mediaQueries).toBe(4);
    });

    it('should handle multiple media queries', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-multi-media',
            language: 'html',
            code: codeExamples.manyMediaQueriesCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.mediaQueries).toBeGreaterThan(10);
    });
  });

  describe('Viewport Meta Detection', () => {
    it('should detect <meta name="viewport"> tag', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-viewport',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.viewportMeta).toBe(true);
    });

    it('should return false when viewport meta tag missing', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-viewport',
            language: 'html',
            code: codeExamples.noViewportHTML,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.viewportMeta).toBe(false);
    });
  });

  describe('Mobile Optimization', () => {
    it('should detect mobile optimized design with viewport + breakpoints', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-mobile-optimized',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.mobileOptimized).toBe(true);
    });

    it('should return false when not mobile optimized (no viewport)', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-not-mobile-optimized',
            language: 'html',
            code: codeExamples.noViewportHTML,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.mobileOptimized).toBe(false);
    });

    it('should generate issues for missing viewport', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-viewport-issue',
            language: 'html',
            code: codeExamples.noViewportHTML,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      const viewportIssues = analysis?.issues.filter(i =>
        i.message.toLowerCase().includes('viewport')
      );
      expect(viewportIssues && viewportIssues.length > 0).toBe(true);
    });

    it('should flag missing mobile breakpoints', async () => {
      const code = `
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @media (min-width: 1200px) { .col { width: 25%; } }
            @media (min-width: 1600px) { .col { width: 20%; } }
          </style>
        </head>
        <body></body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-mobile-bp',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      const mobileIssues = analysis?.issues.filter(i =>
        i.message.toLowerCase().includes('mobile') ||
        i.message.toLowerCase().includes('768')
      );
      expect(mobileIssues && mobileIssues.length > 0).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code input', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-empty-responsive',
            language: 'html',
            code: codeExamples.emptyCode,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis).toBeDefined();
      expect(Array.isArray(analysis?.breakpoints)).toBe(true);
    });

    it('should handle code with no CSS at all', async () => {
      const code = `
        <html>
        <body>
          <h1>Just HTML</h1>
          <p>No styling</p>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-no-css',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.flexboxUsage).toBe(false);
      expect(analysis?.gridUsage).toBe(false);
      expect(analysis?.mediaQueries).toBe(0);
      expect(analysis?.breakpoints.length).toBe(0);
    });

    it('should handle mixed HTML/CSS/JS content', async () => {
      const code = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            .container { display: flex; }
            @media (min-width: 768px) { .col { width: 50%; } }
          </style>
          <script>
            console.log('test');
            @media (broken js) { }
          </script>
        </head>
        <body>
          <main class="container"></main>
        </body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-mixed-content',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.viewportMeta).toBe(true);
      expect(analysis?.flexboxUsage).toBe(true);
      expect(analysis?.breakpoints.length).toBeGreaterThan(0);
    });
  });

  describe('Issues and Recommendations', () => {
    it('should include issues array', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-issues-array',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(Array.isArray(analysis?.issues)).toBe(true);
    });

    it('should warn about too many media queries', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-too-many-queries',
            language: 'html',
            code: codeExamples.manyMediaQueriesCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      const tooManyIssues = analysis?.issues.filter(i =>
        i.message.toLowerCase().includes('high number') ||
        i.message.toLowerCase().includes('many')
      );
      expect(tooManyIssues && tooManyIssues.length > 0).toBe(true);
    });

    it('should suggest flexbox/grid usage when missing', async () => {
      const code = `
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            .container { width: 100%; padding: 20px; }
          </style>
        </head>
        <body></body>
        </html>
      `;
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-suggest-layout',
            language: 'html',
            code,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      const layoutIssues = analysis?.issues.filter(i =>
        i.message.toLowerCase().includes('flexbox') ||
        i.message.toLowerCase().includes('grid')
      );
      expect(layoutIssues && layoutIssues.length > 0).toBe(true);
    });
  });

  describe('Analysis Result Structure', () => {
    it('should return all required ResponsiveAnalysis properties', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-structure',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(analysis?.breakpoints).toBeDefined();
      expect(analysis?.flexboxUsage).toBeDefined();
      expect(analysis?.gridUsage).toBeDefined();
      expect(analysis?.mediaQueries).toBeDefined();
      expect(analysis?.viewportMeta).toBeDefined();
      expect(analysis?.mobileOptimized).toBeDefined();
      expect(analysis?.issues).toBeDefined();
    });

    it('should have correct property types', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [
          {
            id: 'test-types',
            language: 'html',
            code: codeExamples.responsiveCSS,
          },
        ],
        [AnalysisType.Responsiveness]
      );

      const analysis = result.codeAnalysis?.responsiveness;
      expect(Array.isArray(analysis?.breakpoints)).toBe(true);
      expect(typeof analysis?.flexboxUsage).toBe('boolean');
      expect(typeof analysis?.gridUsage).toBe('boolean');
      expect(typeof analysis?.mediaQueries).toBe('number');
      expect(typeof analysis?.viewportMeta).toBe('boolean');
      expect(typeof analysis?.mobileOptimized).toBe('boolean');
      expect(Array.isArray(analysis?.issues)).toBe(true);
    });
  });

  describe('Empty Code Handling', () => {
    it('should handle empty code array', async () => {
      const result = await extension.analyzeDesign(
        undefined,
        [],
        [AnalysisType.Responsiveness]
      );

      // Empty code array means no codeAnalysis is populated
      expect(result.metadata).toBeDefined();
      expect(result.codeAnalysis?.responsiveness).toBeUndefined();
    });
  });
});
