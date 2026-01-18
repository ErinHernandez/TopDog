/**
 * ESLint Local Rules Plugin
 *
 * This plugin loads custom ESLint rules for the project.
 * To use, add "local-rules" to your ESLint plugins and configure rules.
 *
 * @module eslint-rules/index
 */

module.exports = {
  rules: {
    'no-unbounded-firestore': require('./no-unbounded-firestore'),
  },
};
