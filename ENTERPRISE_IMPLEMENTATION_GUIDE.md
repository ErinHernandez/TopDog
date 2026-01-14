# Enterprise Implementation Guide: Bestball Platform
## Complete Actionable Remediation Playbook

**Version:** 2.0 Enterprise Edition  
**Date:** January 2025  
**Classification:** Technical Implementation Guide  
**Target Audience:** Development Team & Technical Leadership

---

## How to Use This Document

This guide transforms the code analysis findings into **immediately executable actions**. Each section contains:

1. **The Problem** — What's wrong and why it matters
2. **The Solution** — Complete, copy-paste-ready code
3. **Implementation Steps** — Exact commands to run
4. **Verification** — How to confirm it's fixed
5. **Time Estimate** — Realistic effort required

---

# Phase 1: Critical Security & Stability (Week 1-2)

## 1.1 Production Dependency Security Audit

### Problem
Unknown vulnerabilities in production dependencies could expose user data and payment information.

### Solution

**Step 1: Create the audit script**

```bash
# File: scripts/security-audit.sh
#!/bin/bash

echo "======================================"
echo "Production Security Audit - $(date)"
echo "======================================"

# Run npm audit for production only
echo -e "\n📦 Running npm audit (production)..."
npm audit --production --json > audit-results.json 2>/dev/null

# Parse and display results
CRITICAL=$(cat audit-results.json | jq '.metadata.vulnerabilities.critical // 0')
HIGH=$(cat audit-results.json | jq '.metadata.vulnerabilities.high // 0')
MODERATE=$(cat audit-results.json | jq '.metadata.vulnerabilities.moderate // 0')
LOW=$(cat audit-results.json | jq '.metadata.vulnerabilities.low // 0')

echo -e "\n🔴 Critical: $CRITICAL"
echo "🟠 High: $HIGH"
echo "🟡 Moderate: $MODERATE"
echo "🟢 Low: $LOW"

# Fail if critical or high vulnerabilities exist
if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
    echo -e "\n❌ SECURITY AUDIT FAILED"
    echo "Fix critical/high vulnerabilities before deploying!"
    cat audit-results.json | jq '.vulnerabilities | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | {name: .key, severity: .value.severity, via: .value.via[0], recommendation: .value.fixAvailable}'
    exit 1
fi

echo -e "\n✅ Security audit passed"
exit 0
```

**Step 2: Run the audit**

```bash
chmod +x scripts/security-audit.sh
./scripts/security-audit.sh
```

**Step 3: Fix vulnerabilities automatically (where possible)**

```bash
# Auto-fix what can be fixed
npm audit fix --production

# For breaking changes that require manual review
npm audit fix --force --dry-run  # Preview first
```

**Step 4: Add to package.json scripts**

```json
{
  "scripts": {
    "security:audit": "./scripts/security-audit.sh",
    "security:fix": "npm audit fix --production",
    "precommit": "npm run security:audit && npm run lint"
  }
}
```

### Verification
```bash
npm run security:audit
# Expected: "✅ Security audit passed"
```

### Time Estimate
Initial setup: 1 hour | Ongoing: Automated

---

## 1.2 Environment Variable Security Audit

### Problem
244 environment variable usages need review to ensure no sensitive data is exposed to the client.

### Solution

**Step 1: Create the environment audit script**

```javascript
// File: scripts/audit-env-vars.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SENSITIVE_PATTERNS = [
  /SECRET/i, /KEY/i, /PASSWORD/i, /TOKEN/i, /PRIVATE/i,
  /CREDENTIAL/i, /API_KEY/i, /AUTH/i, /STRIPE/i, /WEBHOOK/i
];

const CLIENT_SAFE_PREFIXES = ['NEXT_PUBLIC_'];

// Find all env var usages
const findEnvUsages = () => {
  const results = {
    serverOnly: [],
    clientExposed: [],
    potentialLeak: []
  };

  // Get all files using process.env
  const grepOutput = execSync(
    `grep -rn "process\\.env\\." --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" . 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const lines = grepOutput.split('\n').filter(Boolean);
  
  lines.forEach(line => {
    // Skip node_modules and .next
    if (line.includes('node_modules') || line.includes('.next')) return;
    
    const match = line.match(/process\.env\.([A-Z_0-9]+)/);
    if (!match) return;

    const envVar = match[1];
    const filePath = line.split(':')[0];
    const isClientFile = filePath.includes('/pages/') || 
                         filePath.includes('/components/') ||
                         filePath.includes('/app/') && !filePath.includes('/api/');
    
    const isSensitive = SENSITIVE_PATTERNS.some(p => p.test(envVar));
    const isClientSafe = CLIENT_SAFE_PREFIXES.some(p => envVar.startsWith(p));

    const entry = {
      variable: envVar,
      file: filePath,
      line: line.split(':')[1],
      isSensitive,
      isClientSafe
    };

    if (isClientFile && isSensitive && !isClientSafe) {
      results.potentialLeak.push(entry);
    } else if (isClientFile && isClientSafe) {
      results.clientExposed.push(entry);
    } else {
      results.serverOnly.push(entry);
    }
  });

  return results;
};

// Generate report
const generateReport = (results) => {
  console.log('\n' + '='.repeat(60));
  console.log('ENVIRONMENT VARIABLE SECURITY AUDIT');
  console.log('='.repeat(60));

  if (results.potentialLeak.length > 0) {
    console.log('\n🚨 CRITICAL: POTENTIAL SECRET LEAKS TO CLIENT');
    console.log('-'.repeat(40));
    results.potentialLeak.forEach(({ variable, file, line }) => {
      console.log(`  ❌ ${variable}`);
      console.log(`     File: ${file}:${line}`);
    });
  }

  console.log('\n📊 Summary:');
  console.log(`  Server-only variables: ${results.serverOnly.length}`);
  console.log(`  Client-exposed (NEXT_PUBLIC_): ${results.clientExposed.length}`);
  console.log(`  ⚠️  Potential leaks: ${results.potentialLeak.length}`);

  // Extract unique variables
  const allVars = [...new Set([
    ...results.serverOnly.map(e => e.variable),
    ...results.clientExposed.map(e => e.variable),
    ...results.potentialLeak.map(e => e.variable)
  ])].sort();

  console.log('\n📝 All environment variables found:');
  allVars.forEach(v => console.log(`  - ${v}`));

  return results.potentialLeak.length === 0;
};

// Generate .env.example
const generateEnvExample = (results) => {
  const allVars = [...new Set([
    ...results.serverOnly.map(e => e.variable),
    ...results.clientExposed.map(e => e.variable)
  ])].sort();

  const template = `# Environment Variables Template
# Copy this file to .env.local and fill in values
# Generated: ${new Date().toISOString()}

# ===========================================
# PUBLIC VARIABLES (exposed to client browser)
# ===========================================
${allVars.filter(v => v.startsWith('NEXT_PUBLIC_')).map(v => `${v}=`).join('\n')}

# ===========================================
# SERVER-ONLY VARIABLES (never exposed to client)
# ===========================================
${allVars.filter(v => !v.startsWith('NEXT_PUBLIC_')).map(v => `${v}=`).join('\n')}
`;

  fs.writeFileSync('.env.example', template);
  console.log('\n✅ Generated .env.example');
};

// Main
const results = findEnvUsages();
const passed = generateReport(results);
generateEnvExample(results);

process.exit(passed ? 0 : 1);
```

**Step 2: Run the audit**

```bash
node scripts/audit-env-vars.js
```

**Step 3: Fix any leaks found**

If the audit finds sensitive variables in client code, you have two options:

**Option A: Move to API route (recommended)**
```typescript
// BEFORE: Leaking secret in client component
// File: components/PaymentButton.tsx (BAD)
const stripeKey = process.env.STRIPE_SECRET_KEY; // ❌ EXPOSED!

// AFTER: Use API route
// File: pages/api/create-payment-intent.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Server-only - never exposed to client
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: 'usd',
  });
  
  res.json({ clientSecret: paymentIntent.client_secret });
}
```

**Option B: Use NEXT_PUBLIC_ prefix (only for non-sensitive)**
```typescript
// Only for values that are SAFE to expose publicly
// Like Stripe's publishable key (not secret key!)
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
```

### Verification
```bash
node scripts/audit-env-vars.js
# Expected: "⚠️ Potential leaks: 0"
```

### Time Estimate
4-8 hours depending on number of leaks to fix

---

## 1.3 TODO/FIXME/BUG Comment Triage System

### Problem
907 untracked technical debt items could hide security vulnerabilities or critical bugs.

### Solution

**Step 1: Create the TODO extraction and categorization tool**

```javascript
// File: scripts/triage-todos.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Priority keywords - order matters (first match wins)
const PRIORITY_RULES = [
  { priority: 'P0-CRITICAL', patterns: [/security/i, /vulnerability/i, /exploit/i, /injection/i, /xss/i, /csrf/i, /auth.*bypass/i] },
  { priority: 'P0-CRITICAL', patterns: [/payment/i, /stripe/i, /billing/i, /charge/i, /money/i, /financial/i] },
  { priority: 'P0-CRITICAL', patterns: [/data.*loss/i, /corrupt/i, /race.*condition/i, /deadlock/i] },
  { priority: 'P1-HIGH', patterns: [/bug/i, /broken/i, /crash/i, /error/i, /fail/i, /wrong/i] },
  { priority: 'P1-HIGH', patterns: [/hack/i, /workaround/i, /temporary/i, /remove.*before/i] },
  { priority: 'P2-MEDIUM', patterns: [/todo/i, /fixme/i, /refactor/i, /cleanup/i, /optimize/i] },
  { priority: 'P2-MEDIUM', patterns: [/performance/i, /slow/i, /memory/i, /leak/i] },
  { priority: 'P3-LOW', patterns: [/nice.*to.*have/i, /someday/i, /maybe/i, /consider/i, /enhancement/i] }
];

// File priority weights (security-critical files get boosted)
const FILE_WEIGHTS = {
  'payment': 2, 'stripe': 2, 'billing': 2,
  'auth': 2, 'security': 2, 'csrf': 2,
  'api': 1.5, 'admin': 1.5
};

const extractTodos = () => {
  const output = execSync(
    `grep -rn -E "(TODO|FIXME|BUG|HACK|XXX|WARN):" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" . 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );

  const todos = [];
  
  output.split('\n').filter(Boolean).forEach(line => {
    if (line.includes('node_modules') || line.includes('.next')) return;
    
    const parts = line.split(':');
    if (parts.length < 3) return;
    
    const file = parts[0];
    const lineNum = parts[1];
    const content = parts.slice(2).join(':').trim();
    
    // Determine priority
    let priority = 'P3-LOW';
    for (const rule of PRIORITY_RULES) {
      if (rule.patterns.some(p => p.test(content))) {
        priority = rule.priority;
        break;
      }
    }
    
    // Apply file weight boost
    const fileName = path.basename(file).toLowerCase();
    for (const [keyword, weight] of Object.entries(FILE_WEIGHTS)) {
      if (fileName.includes(keyword) || file.toLowerCase().includes(`/${keyword}`)) {
        if (priority === 'P2-MEDIUM') priority = 'P1-HIGH';
        if (priority === 'P3-LOW') priority = 'P2-MEDIUM';
        break;
      }
    }
    
    todos.push({ file, lineNum, content, priority });
  });

  return todos;
};

const generateReport = (todos) => {
  // Group by priority
  const grouped = {
    'P0-CRITICAL': [],
    'P1-HIGH': [],
    'P2-MEDIUM': [],
    'P3-LOW': []
  };
  
  todos.forEach(todo => {
    grouped[todo.priority].push(todo);
  });

  // Generate markdown report
  let report = `# Technical Debt Triage Report
Generated: ${new Date().toISOString()}

## Summary
| Priority | Count | Action Required |
|----------|-------|-----------------|
| P0-CRITICAL | ${grouped['P0-CRITICAL'].length} | Immediate - Block releases |
| P1-HIGH | ${grouped['P1-HIGH'].length} | This sprint |
| P2-MEDIUM | ${grouped['P2-MEDIUM'].length} | This quarter |
| P3-LOW | ${grouped['P3-LOW'].length} | Backlog |

**Total: ${todos.length} items**

---

`;

  for (const [priority, items] of Object.entries(grouped)) {
    report += `## ${priority} (${items.length} items)\n\n`;
    
    if (items.length === 0) {
      report += '_No items_\n\n';
      continue;
    }
    
    items.forEach((item, idx) => {
      report += `### ${idx + 1}. ${item.file}:${item.lineNum}\n`;
      report += `\`\`\`\n${item.content}\n\`\`\`\n\n`;
    });
  }

  fs.writeFileSync('TODO_TRIAGE_REPORT.md', report);
  
  // Generate CSV for import to project management
  const csv = 'Priority,File,Line,Content\n' + 
    todos.map(t => `"${t.priority}","${t.file}","${t.lineNum}","${t.content.replace(/"/g, '""')}"`).join('\n');
  fs.writeFileSync('todo-items.csv', csv);

  console.log('\n📊 TODO Triage Summary:');
  console.log(`  🔴 P0-CRITICAL: ${grouped['P0-CRITICAL'].length}`);
  console.log(`  🟠 P1-HIGH: ${grouped['P1-HIGH'].length}`);
  console.log(`  🟡 P2-MEDIUM: ${grouped['P2-MEDIUM'].length}`);
  console.log(`  🟢 P3-LOW: ${grouped['P3-LOW'].length}`);
  console.log(`\n✅ Reports generated:`);
  console.log(`  - TODO_TRIAGE_REPORT.md (human readable)`);
  console.log(`  - todo-items.csv (import to Jira/Linear/etc)`);

  return grouped['P0-CRITICAL'].length;
};

const todos = extractTodos();
const criticalCount = generateReport(todos);

if (criticalCount > 0) {
  console.log(`\n⚠️  WARNING: ${criticalCount} CRITICAL items need immediate attention!`);
  process.exit(1);
}
```

**Step 2: Run the triage**

```bash
node scripts/triage-todos.js
```

**Step 3: Create GitHub Issues from CSV**

```bash
# Install GitHub CLI if not present
# brew install gh  (macOS) or see https://cli.github.com/

# Create issues from CSV (example for P0 items)
while IFS=, read -r priority file line content; do
  if [[ "$priority" == *"P0"* ]]; then
    gh issue create \
      --title "🔴 [P0] Technical Debt: ${file}:${line}" \
      --body "**File:** ${file}:${line}\n\n**Content:**\n\`\`\`\n${content}\n\`\`\`\n\n**Priority:** P0-CRITICAL - Immediate action required" \
      --label "priority:critical,tech-debt"
  fi
done < todo-items.csv
```

### Verification
```bash
node scripts/triage-todos.js
# Check TODO_TRIAGE_REPORT.md for full report
```

### Time Estimate
Initial triage: 2-4 hours | Issue creation: 1-2 hours

---

## 1.4 Standardize Remaining API Route

### Problem
1 API route (out of 72) lacks standardized error handling, breaking the 98.6% → 100% goal.

### Solution

**Step 1: Create the API error handler utility**

```typescript
// File: lib/apiErrorHandler.ts
import { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

type ApiHandler<T = unknown> = (
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void>;

export function withErrorHandler<T = unknown>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (req: NextApiRequest, res: NextApiResponse<ApiResponse<T>>) => {
    try {
      await handler(req, res);
    } catch (error) {
      const apiError = error as ApiError;
      const statusCode = apiError.statusCode || 500;
      const message = apiError.message || 'Internal server error';
      const code = apiError.code || 'INTERNAL_ERROR';

      // Log to Sentry for 500 errors
      if (statusCode >= 500) {
        Sentry.captureException(error, {
          extra: {
            url: req.url,
            method: req.method,
            body: req.body,
            query: req.query,
          },
        });
      }

      // Log server-side
      console.error(`[API Error] ${req.method} ${req.url}:`, {
        statusCode,
        code,
        message,
        stack: apiError.stack,
      });

      res.status(statusCode).json({
        success: false,
        error: {
          message,
          code,
          details: process.env.NODE_ENV === 'development' ? apiError.details : undefined,
        },
      });
    }
  };
}

// Helper to create typed errors
export function createApiError(
  message: string,
  statusCode = 500,
  code = 'ERROR',
  details?: unknown
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

// Common error factories
export const ApiErrors = {
  badRequest: (message = 'Bad request', details?: unknown) => 
    createApiError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message = 'Unauthorized') => 
    createApiError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message = 'Forbidden') => 
    createApiError(message, 403, 'FORBIDDEN'),
  
  notFound: (message = 'Not found') => 
    createApiError(message, 404, 'NOT_FOUND'),
  
  methodNotAllowed: (allowed: string[]) => 
    createApiError(`Method not allowed. Allowed: ${allowed.join(', ')}`, 405, 'METHOD_NOT_ALLOWED'),
  
  conflict: (message = 'Conflict') => 
    createApiError(message, 409, 'CONFLICT'),
  
  rateLimited: (message = 'Too many requests') => 
    createApiError(message, 429, 'RATE_LIMITED'),
  
  internal: (message = 'Internal server error', details?: unknown) => 
    createApiError(message, 500, 'INTERNAL_ERROR', details),
};
```

**Step 2: Find the non-standardized route**

```bash
# Find routes not using withErrorHandler
grep -rL "withErrorHandler" pages/api --include="*.ts" --include="*.js"
```

**Step 3: Update the route to use standardized error handling**

```typescript
// BEFORE (non-standardized):
// File: pages/api/some-endpoint.ts
export default async function handler(req, res) {
  try {
    const data = await fetchSomething();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message }); // ❌ Non-standard
  }
}

// AFTER (standardized):
// File: pages/api/some-endpoint.ts
import { withErrorHandler, ApiErrors, ApiResponse } from '@/lib/apiErrorHandler';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResponseData {
  items: string[];
  total: number;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ResponseData>>
) {
  // Method validation
  if (req.method !== 'GET') {
    throw ApiErrors.methodNotAllowed(['GET']);
  }

  // Input validation
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    throw ApiErrors.badRequest('Missing required parameter: id');
  }

  // Business logic
  const data = await fetchSomething(id);
  
  if (!data) {
    throw ApiErrors.notFound(`Item ${id} not found`);
  }

  // Success response
  res.status(200).json({
    success: true,
    data: {
      items: data.items,
      total: data.items.length,
    },
  });
}

export default withErrorHandler(handler);
```

### Verification
```bash
# All routes should now use withErrorHandler
grep -rL "withErrorHandler" pages/api --include="*.ts" --include="*.js" | wc -l
# Expected: 0
```

### Time Estimate
2-4 hours

---

# Phase 2: Type Safety & Code Quality (Week 2-4)

## 2.1 Eliminate `any` Types in Critical Paths

### Problem
111 `any` types reduce type safety, especially dangerous in payment and auth code.

### Solution

**Step 1: Create the `any` finder script**

```javascript
// File: scripts/find-any-types.js
const { execSync } = require('child_process');
const fs = require('fs');

const CRITICAL_PATHS = [
  'payment', 'stripe', 'billing', 'checkout',
  'auth', 'login', 'session', 'token',
  'security', 'csrf', 'admin'
];

const findAnyTypes = () => {
  const output = execSync(
    `grep -rn ": any" --include="*.ts" --include="*.tsx" . 2>/dev/null || true`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const results = {
    critical: [],
    standard: []
  };

  output.split('\n').filter(Boolean).forEach(line => {
    if (line.includes('node_modules') || line.includes('.next')) return;
    
    const [file, lineNum, ...rest] = line.split(':');
    const content = rest.join(':').trim();
    
    const isCritical = CRITICAL_PATHS.some(p => 
      file.toLowerCase().includes(p)
    );

    const entry = { file, lineNum, content };
    
    if (isCritical) {
      results.critical.push(entry);
    } else {
      results.standard.push(entry);
    }
  });

  return results;
};

const results = findAnyTypes();

console.log('\n🔴 CRITICAL PATH `any` TYPES (Must fix immediately):');
console.log('='.repeat(50));
results.critical.forEach(({ file, lineNum, content }) => {
  console.log(`\n${file}:${lineNum}`);
  console.log(`  ${content}`);
});

console.log(`\n\n📊 Summary:`);
console.log(`  Critical path: ${results.critical.length}`);
console.log(`  Standard: ${results.standard.length}`);
console.log(`  Total: ${results.critical.length + results.standard.length}`);

// Generate fix suggestions
fs.writeFileSync('any-types-report.json', JSON.stringify(results, null, 2));
```

**Step 2: Common `any` → proper type conversions**

```typescript
// ================================
// PAYMENT CODE TYPE FIXES
// ================================

// BEFORE ❌
const handlePayment = async (data: any) => {
  const amount: any = data.amount;
  const customerId: any = data.customerId;
};

// AFTER ✅
interface PaymentData {
  amount: number;
  customerId: string;
  currency?: 'usd' | 'eur' | 'gbp';
  metadata?: Record<string, string>;
}

const handlePayment = async (data: PaymentData): Promise<PaymentResult> => {
  const { amount, customerId, currency = 'usd' } = data;
  // Type-safe now!
};

// ================================
// API RESPONSE TYPE FIXES  
// ================================

// BEFORE ❌
const fetchData = async (): Promise<any> => {
  const res = await fetch('/api/data');
  return res.json();
};

// AFTER ✅
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code: string };
}

interface UserData {
  id: string;
  email: string;
  name: string;
}

const fetchData = async (): Promise<ApiResponse<UserData>> => {
  const res = await fetch('/api/data');
  return res.json() as Promise<ApiResponse<UserData>>;
};

// ================================
// EVENT HANDLER TYPE FIXES
// ================================

// BEFORE ❌
const handleClick = (e: any) => {
  e.preventDefault();
  const value = e.target.value;
};

// AFTER ✅
import { MouseEvent, ChangeEvent } from 'react';

const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
};

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value; // Type-safe!
};

// ================================
// STRIPE WEBHOOK TYPE FIXES
// ================================

// BEFORE ❌
const handleWebhook = async (event: any) => {
  const session: any = event.data.object;
};

// AFTER ✅
import Stripe from 'stripe';

const handleWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const amountTotal = session.amount_total; // number | null
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      break;
    }
  }
};

// ================================
// FIREBASE/FIRESTORE TYPE FIXES
// ================================

// BEFORE ❌
const getUserData = async (userId: string): Promise<any> => {
  const doc = await db.collection('users').doc(userId).get();
  return doc.data();
};

// AFTER ✅
import { 
  DocumentData, 
  QueryDocumentSnapshot,
  FirestoreDataConverter 
} from 'firebase/firestore';

interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
  };
}

const userConverter: FirestoreDataConverter<UserDocument> = {
  toFirestore(user: UserDocument): DocumentData {
    return {
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      settings: user.settings,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): UserDocument {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      email: data.email,
      displayName: data.displayName,
      createdAt: data.createdAt.toDate(),
      settings: data.settings,
    };
  },
};

const getUserData = async (userId: string): Promise<UserDocument | null> => {
  const docRef = doc(db, 'users', userId).withConverter(userConverter);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};
```

**Step 3: Add ESLint rule to prevent new `any` types**

```javascript
// Add to .eslintrc.js
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
  },
  overrides: [
    {
      // Stricter rules for critical paths
      files: [
        '**/payment/**/*.ts',
        '**/auth/**/*.ts',
        '**/security/**/*.ts',
        '**/api/**/*.ts',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/strict-boolean-expressions': 'error',
      },
    },
  ],
};
```

### Verification
```bash
node scripts/find-any-types.js
# Expected: "Critical path: 0"
```

### Time Estimate
40-60 hours for full elimination

---

## 2.2 Replace Console Statements with Structured Logging

### Problem
764 console.log statements make debugging and monitoring difficult in production.

### Solution

**Step 1: Create the client logger**

```typescript
// File: lib/logger/clientLogger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Batch send logs every 10 seconds in production
    if (typeof window !== 'undefined' && !this.isDevelopment) {
      this.flushInterval = setInterval(() => this.flush(), 10000);
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry = this.formatMessage(level, message, context);
    
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Development: use console with structured output
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}]`, message, context || '', error || '');
      return;
    }

    // Production: buffer and batch send
    this.buffer.push(entry);
    
    // Immediately flush errors
    if (level === 'error') {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
    } catch {
      // Re-add to buffer if send fails
      this.buffer.unshift(...entries);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }
}

export const logger = new ClientLogger();

// Usage examples:
// logger.info('User joined draft', { component: 'DraftRoom', userId: '123', draftId: '456' });
// logger.error('Payment failed', error, { component: 'Checkout', amount: 100 });
```

**Step 2: Create the server logger**

```typescript
// File: lib/logger/serverLogger.ts
import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ServerLogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  duration?: number;
  [key: string]: unknown;
}

interface ServerLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: ServerLogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class ServerLogger {
  private serviceName: string;
  private environment: string;

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'bestball-api';
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: ServerLogContext,
    error?: Error
  ): ServerLogEntry {
    const entry: ServerLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        service: this.serviceName,
        environment: this.environment,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: ServerLogEntry): void {
    // In production, output as JSON for log aggregation
    if (this.environment === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // In development, use readable format
      const { level, message, context, error } = entry;
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
      console.log(prefix, message, context ? JSON.stringify(context, null, 2) : '');
      if (error) console.error(error.stack);
    }
  }

  debug(message: string, context?: ServerLogContext): void {
    if (this.environment === 'development') {
      this.output(this.formatEntry('debug', message, context));
    }
  }

  info(message: string, context?: ServerLogContext): void {
    this.output(this.formatEntry('info', message, context));
  }

  warn(message: string, context?: ServerLogContext): void {
    this.output(this.formatEntry('warn', message, context));
  }

  error(message: string, error?: Error, context?: ServerLogContext): void {
    const entry = this.formatEntry('error', message, context, error);
    this.output(entry);

    // Also send to Sentry
    if (error && this.environment === 'production') {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  }

  // Request logging middleware helper
  request(req: { method: string; url: string }, duration: number, statusCode: number): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.output(
      this.formatEntry(level, `${req.method} ${req.url} ${statusCode}`, {
        method: req.method,
        path: req.url,
        statusCode,
        duration,
      })
    );
  }
}

export const serverLogger = new ServerLogger();

// Usage:
// serverLogger.info('Processing payment', { userId: '123', amount: 100 });
// serverLogger.error('Database connection failed', error, { database: 'primary' });
```

**Step 3: Create automated console replacement script**

```javascript
// File: scripts/replace-console-logs.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with console statements
const findConsoleStatements = () => {
  const output = execSync(
    `grep -rln "console\\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null || true`,
    { encoding: 'utf8' }
  );
  
  return output.split('\n').filter(f => 
    f && !f.includes('node_modules') && !f.includes('.next') && !f.includes('scripts/')
  );
};

// Determine if file is client or server
const isServerFile = (filePath) => {
  return filePath.includes('/api/') || 
         filePath.includes('/server/') ||
         filePath.includes('/lib/') && !filePath.includes('/lib/hooks');
};

// Generate replacement suggestions
const generateReplacements = () => {
  const files = findConsoleStatements();
  const suggestions = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const isServer = isServerFile(file);
    const loggerImport = isServer
      ? "import { serverLogger } from '@/lib/logger/serverLogger';"
      : "import { logger } from '@/lib/logger/clientLogger';";
    const loggerName = isServer ? 'serverLogger' : 'logger';

    const replacements = [];
    
    lines.forEach((line, idx) => {
      if (line.includes('console.log')) {
        replacements.push({
          line: idx + 1,
          original: line.trim(),
          replacement: line.replace(/console\.log\((.*)\)/, `${loggerName}.info($1)`).trim(),
        });
      } else if (line.includes('console.error')) {
        replacements.push({
          line: idx + 1,
          original: line.trim(),
          replacement: line.replace(/console\.error\((.*)\)/, `${loggerName}.error($1)`).trim(),
        });
      } else if (line.includes('console.warn')) {
        replacements.push({
          line: idx + 1,
          original: line.trim(),
          replacement: line.replace(/console\.warn\((.*)\)/, `${loggerName}.warn($1)`).trim(),
        });
      }
    });

    if (replacements.length > 0) {
      suggestions.push({
        file,
        loggerImport,
        replacements,
      });
    }
  });

  return suggestions;
};

const suggestions = generateReplacements();

console.log('\n📝 Console Statement Replacement Plan');
console.log('='.repeat(50));

let totalCount = 0;
suggestions.forEach(({ file, loggerImport, replacements }) => {
  console.log(`\n📄 ${file}`);
  console.log(`   Add import: ${loggerImport}`);
  replacements.forEach(({ line, original, replacement }) => {
    console.log(`   Line ${line}:`);
    console.log(`     - ${original}`);
    console.log(`     + ${replacement}`);
  });
  totalCount += replacements.length;
});

console.log(`\n📊 Total replacements needed: ${totalCount}`);

// Save report
fs.writeFileSync('console-replacement-plan.json', JSON.stringify(suggestions, null, 2));
console.log('\n✅ Saved detailed plan to console-replacement-plan.json');
```

### Verification
```bash
grep -rn "console\." --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".next" | wc -l
# Target: < 50 (keep some for critical debugging)
```

### Time Estimate
20-40 hours for full replacement

---

# Phase 3: Testing Infrastructure (Week 3-5)

## 3.1 Test Coverage Analysis & Configuration

### Problem
Test coverage not measured, need comprehensive suite for Tier 0/1 code.

### Solution

**Step 1: Update Jest configuration for coverage**

```javascript
// File: jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'pages/api/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Tiered coverage thresholds
  coverageThreshold: {
    // Global minimum
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    // Tier 0: Payment & Security (95%+)
    './pages/api/payment/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './pages/api/stripe/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/auth*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './lib/security*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Tier 1: Core Business Logic (90%+)
    './pages/api/draft/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './pages/api/league/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './lib/draft*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

module.exports = createJestConfig(customConfig);
```

**Step 2: Create Jest setup file**

```javascript
// File: jest.setup.js
import '@testing-library/jest-dom';

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  STRIPE_SECRET_KEY: 'sk_test_mock',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock',
  FIREBASE_PROJECT_ID: 'test-project',
};

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Console error spy to catch React warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
```

**Step 3: Create example Tier 0 payment test**

```typescript
// File: __tests__/api/payment/create-checkout.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/payment/create-checkout';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('POST /api/payment/create-checkout', () => {
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(() => {
    mockStripe = new (Stripe as jest.MockedClass<typeof Stripe>)(
      'sk_test',
      { apiVersion: '2023-10-16' }
    ) as jest.Mocked<Stripe>;
  });

  describe('Successful checkout creation', () => {
    it('creates a checkout session with valid parameters', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          priceId: 'price_12345',
          quantity: 1,
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        },
      });

      (mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: 'cs_test_12345',
        url: 'https://checkout.stripe.com/pay/cs_test_12345',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        success: true,
        data: {
          sessionId: 'cs_test_12345',
          url: 'https://checkout.stripe.com/pay/cs_test_12345',
        },
      });
    });

    it('applies discount code when provided', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          priceId: 'price_12345',
          discountCode: 'SAVE20',
        },
      });

      await handler(req, res);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discounts: [{ coupon: 'SAVE20' }],
        })
      );
    });
  });

  describe('Input validation', () => {
    it('rejects missing priceId', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { quantity: 1 },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: {
          message: 'Missing required parameter: priceId',
          code: 'BAD_REQUEST',
        },
      });
    });

    it('rejects invalid quantity', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { priceId: 'price_12345', quantity: -1 },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('rejects non-POST methods', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  describe('Error handling', () => {
    it('handles Stripe API errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { priceId: 'price_12345' },
      });

      const stripeError = new Error('Card declined');
      (stripeError as any).type = 'StripeCardError';
      (mockStripe.checkout.sessions.create as jest.Mock).mockRejectedValue(stripeError);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).error.code).toBe('CARD_ERROR');
    });

    it('handles network errors', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { priceId: 'price_12345' },
      });

      (mockStripe.checkout.sessions.create as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('Security', () => {
    it('sanitizes user input', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          priceId: 'price_12345<script>alert("xss")</script>',
        },
      });

      await handler(req, res);

      // Should reject or sanitize malicious input
      expect(res._getStatusCode()).toBe(400);
    });

    it('validates success/cancel URLs are allowed domains', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          priceId: 'price_12345',
          successUrl: 'https://evil.com/steal-data',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).error.message).toContain('Invalid URL');
    });
  });
});
```

**Step 4: Add test scripts to package.json**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
    "test:tier0": "jest --coverage --testPathPattern='(payment|auth|security)' --coverageThreshold='{\"global\":{\"lines\":95}}'",
    "test:tier1": "jest --coverage --testPathPattern='(draft|league|user)' --coverageThreshold='{\"global\":{\"lines\":90}}'",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```

### Verification
```bash
npm run test:coverage
# Check coverage/lcov-report/index.html for detailed report
```

### Time Estimate
Initial setup: 4-8 hours | Tier 0 tests: 40 hours | Tier 1 tests: 32 hours

---

# Phase 4: Architecture & Performance (Month 2-3)

## 4.1 Bundle Analysis & Optimization

### Problem
Bundle size needs analysis; legacy draft room versions add 200-300KB of duplicate code.

### Solution

**Step 1: Install and configure bundle analyzer**

```bash
npm install --save-dev @next/bundle-analyzer
```

**Step 2: Update next.config.js**

```javascript
// File: next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  // Optimize bundle
  experimental: {
    optimizePackageImports: [
      'lodash',
      'date-fns',
      '@heroicons/react',
      'lucide-react',
    ],
  },
  
  webpack: (config, { isServer }) => {
    // Bundle splitting for large modules
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Separate chunk for Stripe
          stripe: {
            test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
            name: 'stripe',
            chunks: 'all',
            priority: 20,
          },
          // Separate chunk for Firebase
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 20,
          },
          // Draft room components (identify duplication)
          draftRoom: {
            test: /[\\/]components[\\/](draft|DraftRoom|VX|topdog)[\\/]/,
            name: 'draft-room',
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

**Step 3: Analyze bundle**

```bash
# Generate bundle analysis
ANALYZE=true npm run build

# This opens two browser windows:
# - Client bundle analysis
# - Server bundle analysis
```

**Step 4: Create bundle size tracking script**

```javascript
// File: scripts/track-bundle-size.js
const fs = require('fs');
const path = require('path');

const BUILD_DIR = '.next';
const STATS_FILE = 'bundle-stats.json';

const getDirectorySize = (dir) => {
  let size = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const analyzeChunks = () => {
  const chunksDir = path.join(BUILD_DIR, 'static', 'chunks');
  const chunks = {};
  
  if (fs.existsSync(chunksDir)) {
    fs.readdirSync(chunksDir).forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(chunksDir, file);
        chunks[file] = fs.statSync(filePath).size;
      }
    });
  }
  
  return chunks;
};

const run = () => {
  const clientDir = path.join(BUILD_DIR, 'static');
  const totalSize = getDirectorySize(clientDir);
  const chunks = analyzeChunks();
  
  // Sort chunks by size
  const sortedChunks = Object.entries(chunks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  console.log('\n📦 Bundle Size Analysis');
  console.log('='.repeat(50));
  console.log(`\nTotal client bundle: ${formatBytes(totalSize)}`);
  
  console.log('\nTop 20 largest chunks:');
  sortedChunks.forEach(([name, size], idx) => {
    console.log(`  ${idx + 1}. ${name}: ${formatBytes(size)}`);
  });

  // Load previous stats if exist
  let previousStats = null;
  if (fs.existsSync(STATS_FILE)) {
    previousStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  }

  // Calculate diff
  if (previousStats) {
    const diff = totalSize - previousStats.totalSize;
    const diffPercent = ((diff / previousStats.totalSize) * 100).toFixed(2);
    const sign = diff > 0 ? '+' : '';
    console.log(`\n📊 Change from last build: ${sign}${formatBytes(diff)} (${sign}${diffPercent}%)`);
    
    if (diff > 50 * 1024) { // 50KB increase
      console.log('⚠️  WARNING: Significant bundle size increase!');
    }
  }

  // Save current stats
  const currentStats = {
    timestamp: new Date().toISOString(),
    totalSize,
    chunks,
  };
  fs.writeFileSync(STATS_FILE, JSON.stringify(currentStats, null, 2));
  console.log('\n✅ Stats saved to bundle-stats.json');
};

run();
```

**Step 5: Add to CI/CD**

```yaml
# File: .github/workflows/bundle-size.yml
name: Bundle Size Check

on:
  pull_request:
    branches: [main]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Analyze bundle
        run: node scripts/track-bundle-size.js
      
      - name: Check bundle size limit
        run: |
          SIZE=$(cat bundle-stats.json | jq '.totalSize')
          MAX_SIZE=5242880  # 5MB
          if [ $SIZE -gt $MAX_SIZE ]; then
            echo "❌ Bundle size ($SIZE bytes) exceeds limit ($MAX_SIZE bytes)"
            exit 1
          fi
          echo "✅ Bundle size ($SIZE bytes) is within limit"
```

### Verification
```bash
ANALYZE=true npm run build
node scripts/track-bundle-size.js
```

### Time Estimate
Setup: 4 hours | Optimization: 20-40 hours

---

## 4.2 VX2 Migration Strategy

### Problem
5 draft room versions (v2, v3, topdog, VX, VX2) with 40-50% code duplication.

### Solution

**Step 1: Create migration tracking document**

```typescript
// File: docs/VX2_MIGRATION_TRACKER.ts
// This serves as both documentation and type definitions

export interface MigrationItem {
  component: string;
  legacyVersions: ('v2' | 'v3' | 'topdog' | 'VX')[];
  vx2Status: 'not-started' | 'in-progress' | 'complete' | 'verified';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  assignee?: string;
  notes?: string;
  dependencies?: string[];
}

export const MIGRATION_TRACKER: MigrationItem[] = [
  // Draft Room Core
  {
    component: 'DraftBoard',
    legacyVersions: ['v2', 'v3', 'VX'],
    vx2Status: 'in-progress',
    priority: 'P0',
    notes: 'Core component - migrate first',
    dependencies: [],
  },
  {
    component: 'PlayerCard',
    legacyVersions: ['v2', 'v3', 'topdog', 'VX'],
    vx2Status: 'not-started',
    priority: 'P0',
    dependencies: ['DraftBoard'],
  },
  {
    component: 'DraftTimer',
    legacyVersions: ['v2', 'VX'],
    vx2Status: 'complete',
    priority: 'P1',
  },
  {
    component: 'TeamRoster',
    legacyVersions: ['v2', 'v3', 'VX'],
    vx2Status: 'not-started',
    priority: 'P1',
    dependencies: ['PlayerCard'],
  },
  {
    component: 'DraftChat',
    legacyVersions: ['v3', 'VX'],
    vx2Status: 'not-started',
    priority: 'P2',
  },
  // Add all components here...
];

// Generate migration report
export const generateMigrationReport = () => {
  const stats = {
    total: MIGRATION_TRACKER.length,
    complete: MIGRATION_TRACKER.filter(i => i.vx2Status === 'complete').length,
    inProgress: MIGRATION_TRACKER.filter(i => i.vx2Status === 'in-progress').length,
    notStarted: MIGRATION_TRACKER.filter(i => i.vx2Status === 'not-started').length,
  };

  const percentComplete = ((stats.complete / stats.total) * 100).toFixed(1);

  return {
    ...stats,
    percentComplete,
    byPriority: {
      P0: MIGRATION_TRACKER.filter(i => i.priority === 'P0'),
      P1: MIGRATION_TRACKER.filter(i => i.priority === 'P1'),
      P2: MIGRATION_TRACKER.filter(i => i.priority === 'P2'),
      P3: MIGRATION_TRACKER.filter(i => i.priority === 'P3'),
    },
  };
};
```

**Step 2: Create component abstraction layer**

```typescript
// File: components/draft-room/shared/index.ts
// Shared types and utilities that all versions can use during migration

export interface Player {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  adp: number;
  projectedPoints: number;
  byeWeek: number;
}

export interface DraftPick {
  pickNumber: number;
  round: number;
  player: Player | null;
  teamId: string;
  timestamp?: Date;
  isAutoPick?: boolean;
}

export interface DraftState {
  draftId: string;
  status: 'waiting' | 'active' | 'paused' | 'complete';
  currentPick: number;
  picks: DraftPick[];
  availablePlayers: Player[];
  teams: DraftTeam[];
  settings: DraftSettings;
}

export interface DraftTeam {
  id: string;
  name: string;
  ownerId: string;
  roster: Player[];
  draftPosition: number;
}

export interface DraftSettings {
  rounds: number;
  pickTimeSeconds: number;
  scoringFormat: 'standard' | 'ppr' | 'half-ppr';
  rosterSlots: Record<string, number>;
}

// Shared hooks that work across all versions
export { useDraftState } from './hooks/useDraftState';
export { useDraftTimer } from './hooks/useDraftTimer';
export { useDraftSocket } from './hooks/useDraftSocket';
export { usePlayerSearch } from './hooks/usePlayerSearch';

// Shared utilities
export { formatPickNumber } from './utils/formatters';
export { calculateTeamNeeds } from './utils/teamNeeds';
export { sortPlayers } from './utils/sorting';
```

**Step 3: Create shared hook example**

```typescript
// File: components/draft-room/shared/hooks/useDraftState.ts
import { useState, useEffect, useCallback } from 'react';
import { DraftState, DraftPick, Player } from '../index';

interface UseDraftStateOptions {
  draftId: string;
  onPickMade?: (pick: DraftPick) => void;
  onDraftComplete?: () => void;
}

interface UseDraftStateReturn {
  state: DraftState | null;
  isLoading: boolean;
  error: Error | null;
  makePick: (player: Player) => Promise<void>;
  autoPick: () => Promise<void>;
  pauseDraft: () => Promise<void>;
  resumeDraft: () => Promise<void>;
}

export const useDraftState = (options: UseDraftStateOptions): UseDraftStateReturn => {
  const { draftId, onPickMade, onDraftComplete } = options;
  
  const [state, setState] = useState<DraftState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial state
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/draft/${draftId}`);
        if (!response.ok) throw new Error('Failed to fetch draft');
        const data = await response.json();
        setState(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDraft();
  }, [draftId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!draftId) return;

    const eventSource = new EventSource(`/api/draft/${draftId}/stream`);
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      if (update.type === 'PICK_MADE') {
        setState(prev => prev ? {
          ...prev,
          currentPick: update.currentPick,
          picks: [...prev.picks, update.pick],
          availablePlayers: prev.availablePlayers.filter(p => p.id !== update.pick.player.id),
        } : null);
        onPickMade?.(update.pick);
      }
      
      if (update.type === 'DRAFT_COMPLETE') {
        setState(prev => prev ? { ...prev, status: 'complete' } : null);
        onDraftComplete?.();
      }
    };

    eventSource.onerror = () => {
      setError(new Error('Connection lost'));
      eventSource.close();
    };

    return () => eventSource.close();
  }, [draftId, onPickMade, onDraftComplete]);

  const makePick = useCallback(async (player: Player) => {
    const response = await fetch(`/api/draft/${draftId}/pick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to make pick');
    }
  }, [draftId]);

  const autoPick = useCallback(async () => {
    await fetch(`/api/draft/${draftId}/auto-pick`, { method: 'POST' });
  }, [draftId]);

  const pauseDraft = useCallback(async () => {
    await fetch(`/api/draft/${draftId}/pause`, { method: 'POST' });
  }, [draftId]);

  const resumeDraft = useCallback(async () => {
    await fetch(`/api/draft/${draftId}/resume`, { method: 'POST' });
  }, [draftId]);

  return {
    state,
    isLoading,
    error,
    makePick,
    autoPick,
    pauseDraft,
    resumeDraft,
  };
};
```

**Step 4: Create deprecation warnings**

```typescript
// File: lib/deprecation.ts
const DEPRECATION_WARNINGS_SHOWN = new Set<string>();

export const deprecationWarning = (
  component: string,
  legacyVersion: string,
  replacementPath: string
) => {
  const key = `${component}-${legacyVersion}`;
  
  if (DEPRECATION_WARNINGS_SHOWN.has(key)) return;
  DEPRECATION_WARNINGS_SHOWN.add(key);

  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️ DEPRECATION WARNING: ${component} (${legacyVersion}) is deprecated.\n` +
      `   Please migrate to: ${replacementPath}\n` +
      `   This component will be removed in the next major version.`
    );
  }
};

// Usage in legacy components:
// deprecationWarning('DraftBoard', 'v2', 'components/draft-room/VX2/DraftBoard');
```

### Verification
```bash
# Track migration progress
npx ts-node -e "import { generateMigrationReport } from './docs/VX2_MIGRATION_TRACKER'; console.log(generateMigrationReport());"
```

### Time Estimate
200+ hours total, broken into sprints

---

# Phase 5: CI/CD & DevOps (Month 2-3)

## 5.1 GitHub Actions CI/CD Pipeline

### Problem
No CI/CD pipeline for automated testing, security scanning, and deployment.

### Solution

**Step 1: Create the main CI workflow**

```yaml
# File: .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Job 1: Lint and Type Check
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run TypeScript type check
        run: npm run type-check

  # Job 2: Security Audit
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --production --audit-level=high
      
      - name: Run environment variable audit
        run: node scripts/audit-env-vars.js
        continue-on-error: true

  # Job 3: Unit Tests
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  # Job 4: Build
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
      
      - name: Analyze bundle size
        run: node scripts/track-bundle-size.js
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next
          retention-days: 7

  # Job 5: E2E Tests (on PR to main only)
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request' && github.base_ref == 'main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: build
          path: .next
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v6
        with:
          start: npm start
          wait-on: 'http://localhost:3000'
          wait-on-timeout: 120
        env:
          CYPRESS_BASE_URL: http://localhost:3000

  # Job 6: Deploy Preview (PR only)
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  # Job 7: Deploy Production (main branch only)
  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://bestball.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

**Step 2: Create the PR checks workflow**

```yaml
# File: .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-title:
    name: PR Title Check
    runs-on: ubuntu-latest
    steps:
      - name: Check PR title format
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            chore
            revert
          requireScope: false

  changed-files:
    name: Check Changed Files
    runs-on: ubuntu-latest
    outputs:
      payment: ${{ steps.filter.outputs.payment }}
      auth: ${{ steps.filter.outputs.auth }}
      api: ${{ steps.filter.outputs.api }}
    steps:
      - uses: actions/checkout@v4
      
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            payment:
              - 'pages/api/payment/**'
              - 'pages/api/stripe/**'
              - 'lib/payment/**'
            auth:
              - 'lib/auth**'
              - 'lib/security**'
              - 'pages/api/auth/**'
            api:
              - 'pages/api/**'

  payment-review:
    name: Payment Code Review Required
    runs-on: ubuntu-latest
    needs: changed-files
    if: needs.changed-files.outputs.payment == 'true'
    steps:
      - name: Request payment team review
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.pulls.requestReviewers({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              team_reviewers: ['payment-team']
            })

  security-review:
    name: Security Review Required
    runs-on: ubuntu-latest
    needs: changed-files
    if: needs.changed-files.outputs.auth == 'true'
    steps:
      - name: Request security team review
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.pulls.requestReviewers({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              team_reviewers: ['security-team']
            })
```

**Step 3: Add required package.json scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit",
    "security:audit": "./scripts/security-audit.sh",
    "analyze": "ANALYZE=true next build"
  }
}
```

### Verification
```bash
# Test CI locally with act (https://github.com/nektos/act)
act -j lint
act -j test
```

### Time Estimate
Initial setup: 8-16 hours | Ongoing maintenance: 2-4 hours/month

---

# Quick Reference: Commands Cheat Sheet

```bash
# =============================================
# SECURITY
# =============================================
npm run security:audit              # Run full security audit
npm audit --production              # Check production dependencies
node scripts/audit-env-vars.js      # Audit environment variables

# =============================================
# CODE QUALITY
# =============================================
node scripts/triage-todos.js        # Categorize all TODOs
node scripts/find-any-types.js      # Find `any` types
npm run lint                        # Run ESLint
npm run lint:fix                    # Auto-fix lint issues
npm run type-check                  # Run TypeScript check

# =============================================
# TESTING
# =============================================
npm test                            # Run all tests
npm run test:coverage               # Run with coverage report
npm run test:tier0                  # Run critical path tests only
npm run test:watch                  # Watch mode for development

# =============================================
# PERFORMANCE
# =============================================
ANALYZE=true npm run build          # Generate bundle analysis
node scripts/track-bundle-size.js   # Track bundle size over time

# =============================================
# BUILD & DEPLOY
# =============================================
npm run build                       # Production build
npm start                          # Start production server
```

---

# Implementation Timeline Summary

| Week | Focus Area | Key Deliverables |
|------|-----------|------------------|
| 1 | Security | Security audit complete, env vars audited, TODOs triaged |
| 2 | Security + Quality | API standardization 100%, critical `any` types eliminated |
| 3 | Testing | Jest configured, Tier 0 tests written (95%+ coverage) |
| 4 | Testing + Quality | Tier 1 tests written, console.log replacement started |
| 5-6 | Performance | Bundle analyzer, initial optimizations complete |
| 7-8 | CI/CD | GitHub Actions pipeline fully operational |
| 9-12 | Architecture | VX2 migration Phase 1 (P0 components) |

---

# Success Metrics Dashboard

Track these metrics weekly:

| Metric | Current | Target | Tracking |
|--------|---------|--------|----------|
| Security vulnerabilities (critical/high) | ? | 0 | `npm audit --production` |
| Environment variable leaks | ? | 0 | `node scripts/audit-env-vars.js` |
| P0 TODOs | ? | 0 | `node scripts/triage-todos.js` |
| `any` types in critical paths | ? | 0 | `node scripts/find-any-types.js` |
| API standardization | 98.6% | 100% | Manual review |
| Tier 0 test coverage | ? | 95%+ | `npm run test:tier0` |
| Tier 1 test coverage | ? | 90%+ | `npm run test:tier1` |
| Console statements | 764 | <50 | `grep -rn "console\." \| wc -l` |
| Bundle size | ? | -20% | `node scripts/track-bundle-size.js` |
| VX2 migration | ? | 100% | Migration tracker |

---

**Document Version:** 2.0  
**Last Updated:** January 2025  
**Next Review:** February 2025

*This is a living document. Update metrics and progress weekly.*
