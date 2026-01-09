# Deprecation Warnings Fix

## Summary
This document tracks the resolution of npm deprecation warnings encountered during package installation.

## Direct Dependencies

### react-beautiful-dnd@13.1.1
**Status:** ⚠️ Deprecated - Migration Required

**Current Usage:**
- `pages/draft/topdog/[roomId].js` - Main draft room drag-and-drop functionality
- `components/StrictModeDroppable.js` - StrictMode wrapper component

**Migration Path:**
The library is deprecated. Recommended alternatives:
1. **@dnd-kit/core** + **@dnd-kit/sortable** - Modern, actively maintained, TypeScript-first
2. **react-dnd** - More complex but powerful
3. **@hello-pangea/dnd** - Fork of react-beautiful-dnd with React 18+ support

**Migration Complexity:** High - Requires refactoring drag-and-drop implementation across draft room components.

**Recommendation:** Plan as a separate migration task. The library still functions but won't receive updates.

## Transitive Dependencies (Fixed via Overrides)

The following deprecated packages have been addressed via npm overrides in `package.json`:

### ✅ Fixed via Overrides

1. **uuid@3.3.2** → `uuid@^11.0.0`
   - UUID generation
   - Upgraded to v11 (uses crypto.randomUUID() instead of Math.random())

2. **source-map@0.8.0-beta.0** → `source-map@^0.7.4`
   - Source map utilities
   - Using stable version instead of beta

3. **sourcemap-codec@1.4.8** → `@jridgewell/sourcemap-codec@^1.4.15`
   - Source map encoding/decoding
   - Replaced with maintained fork

4. **rollup-plugin-terser@7.0.2** → `@rollup/plugin-terser@^7.0.2`
   - Terser minification plugin
   - Replaced with official package

5. **whatwg-encoding@3.1.1** → `@exodus/bytes@^1.0.0`
   - Encoding utilities
   - Replaced with recommended alternative

### ⚠️ Removed from Overrides (Build Tool Compatibility)

The following packages were initially added to overrides but removed due to build tool compatibility issues:

1. **rimraf@3.0.2, rimraf@2.7.1**
   - **Issue:** Forcing `rimraf@^5.0.5` breaks `next-pwa` build process (pify compatibility)
   - **Status:** Left as-is. These are build-time dependencies and warnings don't affect production
   - **Impact:** Low - deprecation warnings only, functionality unaffected

2. **glob@7.2.3**
   - **Issue:** Forcing `glob@^11.0.0` breaks `next-pwa` dependency chain
   - **Status:** Left as-is. Part of build toolchain
   - **Impact:** Low - deprecation warnings only, functionality unaffected

## Transitive Dependencies (Cannot Override Easily)

These packages are deeply nested dependencies that may cause breaking changes if overridden:

### ⚠️ Workbox Packages
- `workbox-cacheable-response@6.6.0`
- `workbox-google-analytics@6.6.0`

**Status:** Part of `next-pwa` dependency tree. These are dev/build-time dependencies and don't affect runtime. Consider updating `next-pwa` when a newer version is available.

### ⚠️ Build Tool Dependencies
- `rimraf@3.0.2, rimraf@2.7.1` - File deletion (used by next-pwa)
- `glob@7.2.3` - File pattern matching (used by next-pwa)
- `npmlog@5.0.1`
- `gauge@3.0.2`
- `are-we-there-yet@2.0.0`
- `inflight@1.0.6`

**Status:** Part of npm/build toolchains. These are development-only and don't affect production builds. Attempting to override `rimraf` and `glob` breaks the `next-pwa` build process, so they are left as-is. Warnings are harmless.

### ⚠️ node-domexception@1.0.0
**Status:** Transitive dependency. The warning suggests using platform-native DOMException, but this is likely pulled in by a polyfill library. Consider updating the parent package that requires it.

### ⚠️ gm@1.25.1
**Status:** GraphicsMagick wrapper (sunset). Not directly used in this codebase - `sharp` is used instead. This is likely a transitive dependency from another package. Consider identifying and updating the parent package.

### ⚠️ path-match@1.2.4
**Status:** Already handled via override to use `path-to-regexp@6.2.2`. The warning may persist if the package is still in the tree, but functionality is overridden.

## Next Steps

1. ✅ **Completed:** Added npm overrides for easily fixable transitive dependencies
2. ⏳ **Pending:** Plan `react-beautiful-dnd` migration to `@dnd-kit` or `@hello-pangea/dnd`
3. ⏳ **Monitor:** Watch for updates to `next-pwa` that may resolve Workbox warnings
4. ⏳ **Optional:** Investigate and update packages that pull in `gm` and `node-domexception`

## Testing After Overrides

After running `npm install`, verify:
- ✅ Build still works: `npm run build`
- ✅ Development server starts: `npm run dev`
- ✅ Draft room drag-and-drop functionality works
- ✅ No new runtime errors

## Notes

- Overrides force all packages in the dependency tree to use specified versions
- This may cause compatibility issues if parent packages aren't compatible with newer versions
- Monitor for any build or runtime errors after applying overrides
- Some warnings may persist if packages are still in `node_modules` but functionality is overridden
