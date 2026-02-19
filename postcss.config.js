/**
 * PostCSS Configuration
 *
 * Includes:
 * - Tailwind CSS processing
 * - Autoprefixer for browser compatibility
 * - CSS minification via cssnano (production only)
 */
module.exports = {
  plugins: [
    'tailwindcss',
    'autoprefixer',
    // CSS minification in production
    ...(process.env.NODE_ENV === 'production'
      ? [['cssnano', {
          preset: ['default', {
            // Aggressive optimization for production
            discardComments: { removeAll: true },
            normalizeUrl: true,
            reduceIdents: true,
            normalizeWhitespace: true,
            colormin: true,
            // Don't minify z-index (can cause stacking issues)
            zindex: false,
            // Don't merge @media rules (can break mobile-first queries)
            mergeRules: false,
          }],
        }]]
      : []),
  ],
}; 