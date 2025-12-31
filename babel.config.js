/**
 * Babel Configuration for TopDog
 * 
 * Configured to support legacy iOS devices (iOS 12+)
 * See .browserslistrc for target browser definitions
 */
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Use browserslist config from .browserslistrc
        // This ensures optional chaining (?.) and nullish coalescing (??)
        // are transpiled for iOS 12+ support
        useBuiltIns: false, // Don't auto-inject polyfills (Next.js handles this)
        bugfixes: true, // Use smaller output with modern transforms where possible
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  // Ensure Safari-specific bug fixes are applied
  plugins: [],
};
