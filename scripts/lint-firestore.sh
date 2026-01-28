#!/bin/bash
# Firestore Query Safety Linter
# Checks for unbounded getDocs patterns that could cause server hangs

set -e

echo "Running Firestore query safety check..."

ERRORS=0

# Pattern 1: Direct collection without limit (existing)
echo "Checking for getDocs(collection(...)) without limit..."
UNBOUNDED_COLLECTION=$(grep -rn 'getDocs(collection(' --include='*.ts' --include='*.tsx' pages/ lib/ components/ 2>/dev/null | grep -v 'limit(' | grep -v '.test.ts' | grep -v 'node_modules' || true)

if [ -n "$UNBOUNDED_COLLECTION" ]; then
  echo ""
  echo "ERROR: Unbounded getDocs(collection()) found!"
  echo "$UNBOUNDED_COLLECTION"
  ERRORS=1
fi

# Pattern 2: Query without limit
echo "Checking for getDocs(query(...)) without limit..."
QUERY_NO_LIMIT=$(grep -rn 'getDocs(query(' --include='*.ts' --include='*.tsx' pages/ lib/ components/ 2>/dev/null | grep -v 'limit(' | grep -v '.test.ts' | grep -v 'node_modules' || true)

if [ -n "$QUERY_NO_LIMIT" ]; then
  echo ""
  echo "WARNING: query() without limit() found (not blocking):"
  echo "$QUERY_NO_LIMIT"
fi

# Pattern 3: Variable refs (getDocs(someRef))
echo "Checking for getDocs(ref) patterns..."
VAR_REF=$(grep -rn 'getDocs([a-zA-Z]*Ref)' --include='*.ts' --include='*.tsx' pages/ lib/ components/ 2>/dev/null | grep -v 'limit(' | grep -v '.test.ts' | grep -v 'node_modules' | grep -v '// MIGRATION' | grep -v '// INTENTIONAL_FULL_SCAN' || true)

if [ -n "$VAR_REF" ]; then
  echo ""
  echo "WARNING: Potential unbounded getDocs(ref) found:"
  echo "$VAR_REF"
  echo "If intentional, add '// MIGRATION' or '// INTENTIONAL_FULL_SCAN' comment."
fi

if [ "$ERRORS" -eq 1 ]; then
  echo ""
  echo "❌ Firestore query check FAILED"
  echo "All getDocs(collection(...)) calls must include limit()."
  echo "See docs/firestore-best-practices.md for details."
  exit 1
fi

echo ""
echo "✅ Firestore query check passed"
exit 0
