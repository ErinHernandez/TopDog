import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    settings: {
      "import/resolver": {
        node: {
          paths: ["."],
        },
      },
    },
    rules: {
      // ═══════════════════════════════════════════════════════════════
      // CRITICAL RULES - ERRORS (Block CI, can cause runtime failures)
      // ═══════════════════════════════════════════════════════════════
      "react-hooks/rules-of-hooks": "error",      // Conditional hooks cause crashes
      "react-hooks/exhaustive-deps": "error",     // Missing deps cause stale closures

      // ═══════════════════════════════════════════════════════════════
      // PERFORMANCE RULES - WARNINGS (Convert to errors by April 2026)
      // ═══════════════════════════════════════════════════════════════
      "react-hooks/set-state-in-effect": "warn",  // TODO: Error by 2026-04-27
      "react-hooks/immutability": "warn",         // TODO: Error by 2026-04-27
      "react-hooks/refs": "warn",                 // React Compiler optimization hint

      // ═══════════════════════════════════════════════════════════════
      // OPTIMIZATION RULES - WARNINGS (React Compiler hints, keep as warnings)
      // ═══════════════════════════════════════════════════════════════
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/purity": "warn",

      // ═══════════════════════════════════════════════════════════════
      // STYLE RULES - WARNINGS (Non-blocking)
      // ═══════════════════════════════════════════════════════════════
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
      "import/no-anonymous-default-export": "warn",

      // ═══════════════════════════════════════════════════════════════
      // CONSOLE RULE - Smart configuration
      // ═══════════════════════════════════════════════════════════════
      "no-console": ["warn", {
        allow: ["warn", "error", "info"]
      }],
    },
  },
  // ═══════════════════════════════════════════════════════════════
  // FILE-PATTERN OVERRIDES
  // ═══════════════════════════════════════════════════════════════
  {
    // Development and testing files - relaxed rules
    files: [
      "pages/testing-grounds/**/*",
      "pages/dev/**/*",
      "pages/test-*.tsx",
      "sandbox/**/*",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
    ],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Server-side code - allow structured logging
    files: ["pages/api/**/*.ts", "lib/**/*.ts"],
    rules: {
      "no-console": ["warn", {
        allow: ["warn", "error", "info", "log"] // Server logging acceptable
      }],
    },
  },
  {
    // Scripts - no restrictions
    files: ["scripts/**/*"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "functions/**",
      "scripts/**",
      "dev/**",
      "__tests__/**",
    ],
  },
];

export default eslintConfig;
