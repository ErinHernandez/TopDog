# Debugging ESPN Integration - Module Loading Issue

## Current Issue

The API endpoint `/api/nfl/projections` is returning "Internal Server Error". This suggests the TypeScript modules in `lib/dataSources/` are not being loaded correctly.

## Diagnostic Steps

### 1. Check Server Logs

Look at the terminal where `npm run dev` is running. You should see:
- Any TypeScript compilation errors
- Any module resolution errors
- Any runtime errors

**Look for errors like:**
- `Cannot find module`
- `Module not found`
- `SyntaxError`
- `TypeError`

### 2. Verify Server Restart

Make sure the server was **fully restarted** after creating the new TypeScript files:

```bash
# Stop server (Ctrl+C)
# Wait for it to fully stop
# Then restart:
npm run dev
```

### 3. Check File Structure

Verify all files exist:
```bash
ls -la lib/dataSources/
```

Should show:
- `config.ts`
- `espnFantasy.ts`
- `index.ts`
- `sportsdataio.ts`
- `types.ts`

### 4. Test Module Import Directly

Try importing in Node.js REPL (if TypeScript is compiled):
```bash
node
> const mod = require('./lib/dataSources/config.js');
```

If this fails, Next.js hasn't compiled the TypeScript files yet.

### 5. Check Next.js Build Output

Look for compilation messages in the server output:
- Should see files being compiled
- Should NOT see errors about `lib/dataSources/*`

### 6. Manual Type Check

If you have `tsc` available:
```bash
npx tsc --noEmit lib/dataSources/*.ts
```

This will show TypeScript errors without compiling.

## Common Issues

### Issue: Module Not Found
**Cause**: TypeScript files not compiled to JavaScript  
**Fix**: Restart server, wait for compilation

### Issue: Import Error
**Cause**: Incorrect import path or missing export  
**Fix**: Check import statements match exports

### Issue: Runtime Error
**Cause**: Error in module code (e.g., require() failing)  
**Fix**: Check server logs for specific error

## Next Steps

1. **Check server logs** - Most important step
2. **Verify server restart** - Ensure clean restart
3. **Share error message** - If you see a specific error, share it

## Expected Behavior After Fix

Once working, the endpoint should:
- Return 200 status
- Include `"source": "sportsdataio"` in response
- Return player projection data

---

**Action**: Check the server terminal output for error messages and share them.
