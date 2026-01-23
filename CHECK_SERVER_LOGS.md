# Check Server Logs - Next Step

## Current Issue

The server is running ("✓ Ready in 925ms") but API endpoints return "Internal Server Error". 

**Root Cause**: Next.js hasn't compiled the TypeScript files in `lib/dataSources/` yet, or there's a compilation error preventing them from being compiled.

## What to Check

**Look at your terminal where `npm run dev` is running** and check for:

### 1. Compilation Errors
When you access `/api/nfl/projections`, Next.js will try to compile it on-demand. Look for errors like:

```
Error: Cannot find module 'lib/dataSources/config'
Module not found: Can't resolve 'lib/dataSources/config'
SyntaxError in lib/dataSources/config.ts
TypeError: ...
```

### 2. TypeScript Errors
Check for TypeScript compilation errors:
- Type errors
- Import/export mismatches
- Missing dependencies

### 3. First Request Compilation
When you first hit the endpoint, Next.js will compile it. Watch for:
- Compilation messages
- Error messages
- Stack traces

## Quick Test

Try accessing the endpoint and **immediately check the terminal** for any error messages that appear.

## Common Issues

1. **Module not found** → TypeScript files not compiled
2. **Syntax error** → Fix the TypeScript code
3. **Import error** → Check import paths
4. **Type error** → Fix TypeScript types

---

**Action**: Check the server terminal output when you access the endpoint and share any error messages you see.
