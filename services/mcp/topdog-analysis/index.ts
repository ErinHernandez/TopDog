/**
 * @fileoverview TopDog Studio Analysis MCP Server
 *
 * Exposes code analysis, linting, accessibility checking, and complexity
 * analysis as MCP tools. Provides AI assistants with capabilities to analyze
 * component code for quality, accessibility, and maintainability.
 *
 * @module services/mcp/topdog-analysis
 */

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single linting issue found during analysis
 */
export interface LintIssue {
  readonly rule: string;
  readonly severity: "error" | "warning" | "info";
  readonly line: number;
  readonly column: number;
  readonly message: string;
  readonly fix?: string;
}

/**
 * Code metrics collected during analysis
 */
export interface CodeMetrics {
  readonly lineCount: number;
  readonly functionCount: number;
  readonly importCount: number;
  readonly exportCount: number;
  readonly cyclomaticComplexity: number;
  readonly hasTypeScript: boolean;
}

/**
 * Result of code analysis
 */
export interface AnalysisResult {
  readonly success: boolean;
  readonly metrics: CodeMetrics;
  readonly issues: readonly LintIssue[];
  readonly suggestions: readonly string[];
  readonly accessibility?: readonly string[];
  readonly score: number;
}

/**
 * MCP tool definition for analysis
 */
export interface MCPToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: {
    readonly type: string;
    readonly properties: Record<string, unknown>;
    readonly required: readonly string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get available analysis tools
 * @returns Readonly array of MCP tool definitions
 */
export function getAnalysisTools(): readonly MCPToolDefinition[] {
  return [
    {
      name: "analyze_component",
      description: "Run comprehensive component analysis",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Component source code to analyze",
          },
          language: {
            type: "string",
            enum: ["typescript", "javascript", "jsx", "tsx"],
            description: "Source language (default: typescript)",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "lint_code",
      description: "Run linting checks on code",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Code to lint",
          },
          rules: {
            type: "array",
            items: { type: "string" },
            description: "Specific rules to check (optional)",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "check_accessibility",
      description: "Check code for WCAG accessibility compliance",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Component code to check",
          },
          level: {
            type: "string",
            enum: ["A", "AA", "AAA"],
            description: "WCAG level (default: AA)",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "measure_complexity",
      description: "Analyze cyclomatic complexity of code",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Code to measure",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "suggest_improvements",
      description: "Get AI-powered improvement suggestions",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Code to analyze",
          },
          context: {
            type: "string",
            description: "Context or intent of the code (optional)",
          },
        },
        required: ["code"],
      },
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count lines of code, excluding comments and empty lines
 * @param code - Source code to analyze
 * @returns Line count
 */
function countLines(code: string): number {
  return code
    .split("\n")
    .filter((line) => line.trim().length > 0 && !line.trim().startsWith("//"))
    .length;
}

/**
 * Count function definitions in code
 * @param code - Source code to analyze
 * @returns Function count
 */
function countFunctions(code: string): number {
  const functionRegex = /(?:function|const|let)\s+\w+\s*(?::|=)\s*(?:\(|async|function)/g;
  const matches = code.match(functionRegex);
  return matches ? matches.length : 0;
}

/**
 * Count import statements
 * @param code - Source code to analyze
 * @returns Import count
 */
function countImports(code: string): number {
  const importRegex = /import\s+.+\s+from\s+['"].+['"]/g;
  const matches = code.match(importRegex);
  return matches ? matches.length : 0;
}

/**
 * Count export statements
 * @param code - Source code to analyze
 * @returns Export count
 */
function countExports(code: string): number {
  const exportRegex = /export\s+(?:const|function|interface|type|class)/g;
  const matches = code.match(exportRegex);
  return matches ? matches.length : 0;
}

/**
 * Estimate cyclomatic complexity using heuristics
 * Pattern-matching estimates only. These metrics are heuristic approximations. For production-grade analysis, use TypeScript compiler API or ESLint with complexity rules.
 * @param code - Source code to analyze
 * @returns Complexity score
 */
function estimateCyclomaticComplexity(code: string): number {
  let complexity = 1;
  const conditionals = (code.match(/(?:if|else if|else|switch|case|for|while|catch)/g) || [])
    .length;
  const logicalOperators = (code.match(/(?:&&|\|\||!)/g) || []).length;

  complexity += conditionals * 1;
  complexity += logicalOperators * 0.5;

  return Math.max(1, Math.round(complexity));
}

/**
 * Detect if code is TypeScript
 * @param code - Source code to check
 * @returns True if TypeScript syntax is detected
 */
function isTypeScript(code: string): boolean {
  return /:\s*(?:string|number|boolean|unknown|any|readonly|Record|Map|Set|Promise)/i.test(
    code,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Perform lightweight static analysis on code
 * @param code - Source code to analyze
 * @param language - Programming language
 * @returns Analysis result with metrics, issues, and suggestions
 */
export function analyzeCode(code: string, language: string = "typescript"): AnalysisResult {
  const metrics: CodeMetrics = {
    lineCount: countLines(code),
    functionCount: countFunctions(code),
    importCount: countImports(code),
    exportCount: countExports(code),
    cyclomaticComplexity: estimateCyclomaticComplexity(code),
    hasTypeScript: isTypeScript(code),
  };

  const issues: LintIssue[] = [];
  const suggestions: string[] = [];
  const accessibilityIssues: string[] = [];

  // Basic linting checks
  if (metrics.cyclomaticComplexity > 10) {
    issues.push({
      rule: "high-complexity",
      severity: "warning",
      line: 1,
      column: 0,
      message: "Function has high cyclomatic complexity",
    });
    suggestions.push("Consider breaking down complex logic into smaller functions");
  }

  if (metrics.lineCount > 200) {
    issues.push({
      rule: "large-function",
      severity: "warning",
      line: 1,
      column: 0,
      message: "Function is quite long",
    });
    suggestions.push("Consider splitting into multiple smaller functions for better maintainability");
  }

  if (metrics.importCount > 15) {
    issues.push({
      rule: "too-many-imports",
      severity: "info",
      line: 1,
      column: 0,
      message: "Many imports detected",
    });
    suggestions.push("Review if all imports are necessary");
  }

  if (!metrics.hasTypeScript && language === "typescript") {
    issues.push({
      rule: "missing-types",
      severity: "warning",
      line: 1,
      column: 0,
      message: "TypeScript types not detected",
    });
    suggestions.push("Add explicit type annotations for better type safety");
  }

  // Accessibility checks for React/component code
  if (/onClick|onKeyDown|role=/.test(code)) {
    if (!/aria-label|aria-describedby|aria-controls/.test(code)) {
      accessibilityIssues.push("Missing ARIA labels for interactive elements");
    }
    if (!/tabIndex|role=/.test(code)) {
      accessibilityIssues.push("Consider adding proper keyboard navigation support");
    }
  }

  // Calculate quality score (0-100)
  let score = 100;
  score -= Math.min(issues.filter((i) => i.severity === "error").length * 10, 40);
  score -= Math.min(issues.filter((i) => i.severity === "warning").length * 5, 30);
  score -= Math.max(0, (metrics.cyclomaticComplexity - 5) * 2);

  return {
    success: true,
    metrics,
    issues,
    suggestions,
    accessibility: accessibilityIssues,
    score: Math.max(0, Math.round(score)),
  };
}

/**
 * Analyze code for accessibility compliance
 * @param code - Component code to check
 * @param level - WCAG compliance level
 * @returns Analysis result with accessibility issues
 */
export function checkAccessibility(code: string, level: "A" | "AA" | "AAA" = "AA"): AnalysisResult {
  const issues: LintIssue[] = [];
  const suggestions: string[] = [];

  // Check for semantic HTML and ARIA attributes
  if (/onClick/.test(code) && !/onKeyDown|role=/.test(code)) {
    issues.push({
      rule: "a11y-click-events-have-key-events",
      severity: "error",
      line: 1,
      column: 0,
      message: "Click events should have corresponding keyboard events",
    });
  }

  if (/<img/.test(code) && !/alt=/.test(code)) {
    issues.push({
      rule: "img-alt-text",
      severity: "error",
      line: 1,
      column: 0,
      message: "Images must have alt text",
    });
  }

  if (/<button|<a/.test(code) && !/aria-label|title=|>{.*}<\//.test(code)) {
    issues.push({
      rule: "button-has-text",
      severity: "warning",
      line: 1,
      column: 0,
      message: "Button or link should have descriptive text or aria-label",
    });
  }

  if (/onChange|onInput/.test(code) && !/aria-describedby|aria-label|label/.test(code)) {
    issues.push({
      rule: "form-input-label",
      severity: "error",
      line: 1,
      column: 0,
      message: "Form inputs should have associated labels",
    });
  }

  const metrics = analyzeCode(code).metrics;
  const baseScore = 100 - issues.length * 20;

  return {
    success: true,
    metrics,
    issues,
    suggestions,
    accessibility: issues.map((i) => i.message),
    score: Math.max(0, baseScore),
  };
}

/**
 * Measure code complexity
 * @param code - Code to measure
 * @returns Analysis result with complexity metrics
 */
export function measureComplexity(code: string): AnalysisResult {
  const metrics = analyzeCode(code).metrics;
  const suggestions: string[] = [];

  if (metrics.cyclomaticComplexity > 10) {
    suggestions.push("High complexity: Consider refactoring into smaller units");
  }
  if (metrics.cyclomaticComplexity > 5) {
    suggestions.push("Moderate complexity: Review control flow for clarity");
  }

  const complexityScore = Math.max(0, 100 - metrics.cyclomaticComplexity * 5);

  return {
    success: true,
    metrics,
    issues: [],
    suggestions,
    score: complexityScore,
  };
}
