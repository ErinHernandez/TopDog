/**
 * ESLint Rule: no-unbounded-firestore
 *
 * Catches potentially unbounded Firestore queries that could cause server hangs.
 *
 * @module eslint-rules/no-unbounded-firestore
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unbounded Firestore getDocs calls without limit()',
      category: 'Possible Errors',
      recommended: true,
    },
    messages: {
      unboundedCollection:
        'getDocs(collection(...)) must include limit() to prevent server hangs. ' +
        'Wrap in query() with limit(), e.g., getDocs(query(collection(...), limit(100)))',
      unboundedQuery:
        'getDocs(query(...)) should include limit() for safety. ' +
        'Add limit() constraint, e.g., query(..., limit(100))',
      usePlayerService:
        'Direct player collection queries should use playerService instead. ' +
        'Import from lib/services/playerService',
      useDraftPicksService:
        'Direct picks subcollection queries should use draftPicksService instead. ' +
        'Import from lib/services/draftPicksService',
    },
    schema: [],
  },

  create(context) {
    // Track if limit is present in query() calls
    let hasLimitInCurrentQuery = false;
    let currentQueryNode = null;

    return {
      // Check for getDocs(collection(...)) pattern
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'getDocs'
        ) {
          const arg = node.arguments[0];

          if (!arg) return;

          // Case 1: getDocs(collection(...)) - always an error
          if (
            arg.type === 'CallExpression' &&
            arg.callee.type === 'Identifier' &&
            arg.callee.name === 'collection'
          ) {
            // Check if it's a players collection
            const collectionArgs = arg.arguments;
            const isPlayersCollection = collectionArgs.some(
              (a) =>
                a.type === 'Literal' &&
                typeof a.value === 'string' &&
                a.value.toLowerCase().includes('player')
            );

            if (isPlayersCollection) {
              context.report({
                node,
                messageId: 'usePlayerService',
              });
            } else {
              context.report({
                node,
                messageId: 'unboundedCollection',
              });
            }
          }

          // Case 2: getDocs(query(...)) - check for limit
          if (
            arg.type === 'CallExpression' &&
            arg.callee.type === 'Identifier' &&
            arg.callee.name === 'query'
          ) {
            const queryArgs = arg.arguments;

            // Check if any argument is a limit() call
            const hasLimit = queryArgs.some(
              (a) =>
                a.type === 'CallExpression' &&
                a.callee.type === 'Identifier' &&
                a.callee.name === 'limit'
            );

            if (!hasLimit) {
              // Check if it's a picks subcollection
              const isPicksCollection = queryArgs.some((a) => {
                if (a.type === 'CallExpression' && a.callee.name === 'collection') {
                  return a.arguments.some(
                    (ca) =>
                      ca.type === 'Literal' &&
                      typeof ca.value === 'string' &&
                      ca.value.toLowerCase().includes('pick')
                  );
                }
                return false;
              });

              if (isPicksCollection) {
                context.report({
                  node,
                  messageId: 'useDraftPicksService',
                });
              } else {
                context.report({
                  node,
                  messageId: 'unboundedQuery',
                });
              }
            }
          }

          // Case 3: getDocs with a variable - can't statically analyze, skip
        }
      },
    };
  },
};
