# V4 Mobile-Only Architecture Plan (Refined)

**Date:** January 2025  
**Status:** Ready for Execution  
**Baseline:** Master refactoring 100% complete (VX2 only, Redux removed, 87/87 APIs standardized)

---

## Executive Summary

**Goal:** Transform TopDog into a mobile-only application.

| Environment | Behavior |
|-------------|----------|
| Desktop browser | App renders inside a centered phone frame (375×812) |
| Mobile browser | App renders fullscreen (no frame) |

**What gets removed:**
- Desktop Navbar and Footer
- All tablet support (components, hooks, routes, types)
- Desktop-only pages (rankings, my-teams, exposure, etc.)
- Desktop breakpoints (lg:, xl:, 2xl:)

**What stays unchanged:**
- All API routes (87/87 standardized)
- Payment processing (Stripe, PayMongo, Paystack, Xendit)
- Authentication system
- VX2 draft room and app shell logic
- Firebase backend

**Timeline:** 2-3 weeks across 8 phases

---

## Table of Contents

1. [Pre-Flight Checklist](#1-pre-flight-checklist)
2. [Phase 1: Global Phone Frame](#2-phase-1-global-phone-frame)
3. [Phase 2: Remove Desktop UI](#3-phase-2-remove-desktop-ui)
4. [Phase 3: Remove Tablet Support](#4-phase-3-remove-tablet-support)
5. [Phase 4: Remove Desktop-Only Pages](#5-phase-4-remove-desktop-only-pages)
6. [Phase 5: Align Routes](#6-phase-5-align-routes)
7. [Phase 6: Breakpoints and Styles](#7-phase-6-breakpoints-and-styles)
8. [Phase 7: Viewport and Meta](#8-phase-7-viewport-and-meta)
9. [Phase 8: Testing and Cleanup](#9-phase-8-testing-and-cleanup)
10. [Edge Cases (Decided)](#10-edge-cases-decided)
11. [Rollback Procedures](#11-rollback-procedures)
12. [File Reference](#12-file-reference)
13. [Success Criteria](#13-success-criteria)

---

## 1. Pre-Flight Checklist

**Run these commands BEFORE starting any phase. All must pass.**

```bash
# 1. Build must pass
npm run build

# 2. Lint must pass
npm run lint

# 3. Type-check must pass
npm run type-check

# 4. Document current Navbar/Footer consumers
# Expected: _app.tsx only
rg "from.*Navbar|from.*Footer" pages components lib hooks --type ts --type tsx --type js
# If rg unavailable:
grep -rn "from.*Navbar\|from.*Footer" pages components lib hooks --include="*.ts" --include="*.tsx" --include="*.js"

# 5. Document current tablet consumers
# Expected: components/vx2/tablet/*, vx2-tablet-app-demo only
rg "useIsTablet|useTabletOrientation|TabletShell|TabletFrame|from.*tablet" components/vx2 pages --type ts --type tsx
```

**If any unexpected consumers found:** Fix them BEFORE proceeding. Document fixes in commit message.

**Create feature branch:**
```bash
git checkout -b feature/v4-mobile-only
git push -u origin feature/v4-mobile-only
```

---

## 2. Phase 1: Global Phone Frame

**Duration:** 1-2 days  
**Goal:** Desktop = phone frame around all routes. Mobile = fullscreen. No Navbar/Footer.

### 2.1 Create Device Detection Hook (Hydration-Safe)

**File:** `hooks/useIsMobileDevice.ts`

This hook MUST be hydration-safe to prevent React hydration mismatches.

```typescript
// hooks/useIsMobileDevice.ts
import { useState, useEffect } from 'react';

/**
 * Hydration-safe mobile device detection.
 * Returns `null` during SSR/initial render, then actual value after mount.
 * This prevents hydration mismatch between server and client.
 */
export function useIsMobileDevice(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      // Also check screen width as fallback (real mobile typically < 768px)
      const isNarrowScreen = window.innerWidth < 768;
      
      return mobileRegex.test(userAgent) || isNarrowScreen;
    };

    setIsMobile(checkMobile());

    // Optional: listen for resize (handles desktop dev tools mobile emulation)
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
```

### 2.2 Modify `pages/_app.tsx`

**Current state (summarized):**
- Renders `Navbar` + `Footer` conditionally based on route
- Has complex route-based hide logic
- Wraps with providers (SWRConfig, UserProvider, PlayerDataProvider)

**Target state:**
- NO Navbar/Footer
- Desktop: wrap Component in MobilePhoneFrame
- Mobile: render Component directly (fullscreen)
- Keep all providers
- Keep DevNav for testing-grounds routes only

```typescript
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { SWRConfig } from 'swr';
import { UserProvider } from '@/context/UserContext';
import { PlayerDataProvider } from '@/context/PlayerDataContext';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import { MobilePhoneFrame } from '@/components/vx2/shell/MobilePhoneFrame';
import DevNav from '@/components/dev/DevNav';
import { useIsMobileDevice } from '@/hooks/useIsMobileDevice';
import '@/styles/globals.css';

// Routes where DevNav should appear (testing/development only)
const DEV_NAV_ROUTES = ['/testing-grounds', '/dev'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isMobile = useIsMobileDevice();
  
  // Show DevNav on testing-grounds and dev routes (desktop only)
  const showDevNav = DEV_NAV_ROUTES.some(route => router.pathname.startsWith(route));

  // During SSR/hydration, render without frame to avoid mismatch
  // Frame will appear after client-side hydration
  const renderContent = () => {
    // SSR or initial hydration: render without frame (will update on mount)
    if (isMobile === null) {
      return <Component {...pageProps} />;
    }

    // Mobile device: fullscreen, no frame
    if (isMobile) {
      return <Component {...pageProps} />;
    }

    // Desktop: wrap in phone frame
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {showDevNav && (
          <div className="fixed top-4 left-4 z-50">
            <DevNav />
          </div>
        )}
        <MobilePhoneFrame>
          <Component {...pageProps} />
        </MobilePhoneFrame>
      </div>
    );
  };

  return (
    <GlobalErrorBoundary>
      <SWRConfig value={{ revalidateOnFocus: false }}>
        <UserProvider>
          <PlayerDataProvider>
            {renderContent()}
          </PlayerDataProvider>
        </UserProvider>
      </SWRConfig>
    </GlobalErrorBoundary>
  );
}

export default MyApp;
```

### 2.3 Simplify `MobilePhoneFrame.tsx`

**File:** `components/vx2/shell/MobilePhoneFrame.tsx`

**Current state:** Has device presets, fullScreen prop, desktop-specific sizing  
**Target state:** Single fixed preset (iPhone 15 dimensions), simple wrapper

```typescript
// components/vx2/shell/MobilePhoneFrame.tsx
import React from 'react';

interface MobilePhoneFrameProps {
  children: React.ReactNode;
}

/**
 * Phone frame for desktop viewing.
 * Fixed dimensions matching iPhone 15 (393×852 logical pixels).
 * Scaled slightly for comfortable desktop viewing.
 */
export function MobilePhoneFrame({ children }: MobilePhoneFrameProps) {
  return (
    <div 
      className="relative bg-black rounded-[3rem] p-3 shadow-2xl"
      style={{ 
        width: '393px',
        height: '852px',
      }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />
      
      {/* Screen */}
      <div 
        className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative"
      >
        {children}
      </div>
      
      {/* Home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full" />
    </div>
  );
}

export default MobilePhoneFrame;
```

### 2.4 Simplify `AppShellVX2.tsx`

**File:** `components/vx2/shell/AppShellVX2.tsx`

Remove frame-related props. The frame is now handled by `_app.tsx`.

```typescript
// Remove these props from AppShellVX2:
// - showPhoneFrame
// - devicePreset  
// - fullScreen

// Remove any MobilePhoneFrame usage inside AppShellVX2
// Always render InnerShell directly

// BEFORE:
export function AppShellVX2({ 
  showPhoneFrame = false, 
  devicePreset = 'iphone-15',
  fullScreen = false,
  ...props 
}) {
  if (showPhoneFrame) {
    return (
      <MobilePhoneFrame preset={devicePreset} fullScreen={fullScreen}>
        <InnerShell {...props} />
      </MobilePhoneFrame>
    );
  }
  return <InnerShell {...props} />;
}

// AFTER:
export function AppShellVX2(props: AppShellVX2Props) {
  return <InnerShell {...props} />;
}
```

### 2.5 Phase 1 Verification

```bash
# 1. Build must pass
npm run build

# 2. Lint must pass  
npm run lint

# 3. Type-check must pass
npm run type-check

# 4. Manual verification:
# - Open http://localhost:3000 in desktop browser
#   Expected: Page inside phone frame, centered, dark background
# - Open in mobile emulator or real device
#   Expected: Fullscreen, no frame
# - No Navbar or Footer visible anywhere

# 5. Commit
git add -A
git commit -m "Phase 1: Global phone frame - desktop=frame, mobile=fullscreen, remove Navbar/Footer from layout"
```

---

## 3. Phase 2: Remove Desktop UI

**Duration:** 0.5 days  
**Goal:** Delete Navbar.js and Footer.js files

### 3.1 Pre-Delete Verification

```bash
# Verify no remaining imports (should be zero after Phase 1)
rg "from.*Navbar|from.*Footer" pages components lib hooks

# If any results: fix them first before deleting
```

### 3.2 Delete Files

```bash
# Delete Navbar
rm components/Navbar.js

# Delete Footer  
rm components/Footer.js

# If TypeScript versions exist:
rm -f components/Navbar.tsx components/Footer.tsx
```

### 3.3 Phase 2 Verification

```bash
# 1. Verify deletion
ls components/Navbar.* components/Footer.* 2>/dev/null && echo "ERROR: Files still exist" || echo "OK: Files deleted"

# 2. Build must pass
npm run build

# 3. No references remain
rg "Navbar|Footer" components pages --type ts --type tsx --type js | grep -v "// " | grep -v "DevNav"
# Expected: No results (or only comments)

# 4. Commit
git add -A
git commit -m "Phase 2: Delete Navbar.js and Footer.js"
```

---

## 4. Phase 3: Remove Tablet Support

**Duration:** 1-2 days  
**Goal:** Remove all tablet-related code, hooks, types, constants, and routes

### 4.1 Pre-Delete Verification

```bash
# Document all tablet consumers
rg "useIsTablet|useTabletOrientation|TabletShell|TabletFrame|TabletLayoutContext|from.*tablet" components/vx2 pages

# Expected consumers (OK to delete):
# - components/vx2/tablet/*
# - pages/testing-grounds/vx2-tablet-app-demo.tsx
# - components/vx2/core/constants/tablet.ts
# - components/vx2/core/types/tablet.ts
# - components/vx2/core/context/TabletLayoutContext.tsx
# - components/vx2/hooks/ui/useIsTablet.ts
# - components/vx2/hooks/ui/useTabletOrientation.ts

# Any OTHER consumers must be fixed first
```

### 4.2 Delete Files and Directories

```bash
# 1. Delete tablet directory (entire tree)
rm -rf components/vx2/tablet/

# 2. Delete tablet constants
rm -f components/vx2/core/constants/tablet.ts

# 3. Delete tablet types
rm -f components/vx2/core/types/tablet.ts

# 4. Delete tablet context
rm -f components/vx2/core/context/TabletLayoutContext.tsx

# 5. Delete tablet hooks
rm -f components/vx2/hooks/ui/useIsTablet.ts
rm -f components/vx2/hooks/ui/useTabletOrientation.ts

# 6. Delete tablet demo page
rm -f pages/testing-grounds/vx2-tablet-app-demo.tsx
rm -f pages/testing-grounds/vx2-tablet-app-demo.js.bak
```

### 4.3 Clean Up Exports

**File:** `components/vx2/core/constants/index.ts`

Remove tablet exports:
```typescript
// REMOVE these lines:
export * from './tablet';
// or
export { TABLET_BREAKPOINT, TABLET_FRAME_WIDTH, ... } from './tablet';
```

**File:** `components/vx2/core/types/index.ts`

Remove tablet type exports:
```typescript
// REMOVE these lines:
export * from './tablet';
// or  
export type { TabletConfig, TabletOrientation, ... } from './tablet';
```

**File:** `components/vx2/core/types/app.ts`

If `DeviceType` includes 'tablet', narrow it:
```typescript
// BEFORE:
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// AFTER:
export type DeviceType = 'mobile' | 'desktop';
```

**File:** `components/vx2/hooks/ui/index.ts`

Remove tablet hook exports if present:
```typescript
// REMOVE if present:
export { useIsTablet } from './useIsTablet';
export { useTabletOrientation } from './useTabletOrientation';
```

**File:** `components/dev/DevNav.js` (or `.tsx`)

Remove links to tablet routes:
```typescript
// REMOVE links like:
{ href: '/testing-grounds/vx2-tablet-app-demo', label: 'Tablet Demo' }
{ href: '/testing-grounds/vx2-tablet-draft-room', label: 'Tablet Draft' }
```

### 4.4 Phase 3 Verification

```bash
# 1. Verify no tablet references remain in active code
rg "useIsTablet|useTabletOrientation|TabletShell|TabletFrame|TabletLayoutContext|tablet" components/vx2 pages --type ts --type tsx
# Expected: No results

# 2. Verify deleted directories don't exist
ls -la components/vx2/tablet/ 2>/dev/null && echo "ERROR: tablet/ still exists" || echo "OK: tablet/ deleted"

# 3. Build must pass
npm run build

# 4. Type-check must pass
npm run type-check

# 5. Commit
git add -A
git commit -m "Phase 3: Remove all tablet support (components, hooks, types, constants, routes)"
```

---

## 5. Phase 4: Remove Desktop-Only Pages

**Duration:** 0.5-1 day  
**Goal:** Delete desktop-only pages and add redirects

### 5.1 Delete Pages

```bash
# Delete desktop-only pages
rm -f pages/rankings.tsx
rm -f pages/my-teams.tsx
rm -f pages/exposure.tsx
rm -f pages/profile-customization.tsx
rm -f pages/customer-support.tsx
rm -f pages/deposit-history.tsx

# Also delete mobile-* variants if they exist (app has equivalent UI)
rm -f pages/mobile-rankings.tsx
rm -f pages/mobile-deposit-history.tsx
rm -f pages/mobile-profile-customization.tsx
```

### 5.2 Update Middleware Redirects

**File:** `middleware.ts`

Add redirects for deleted pages. **Keep existing draft redirects intact.**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that have been removed - redirect to home
const REMOVED_PAGES = [
  '/rankings',
  '/my-teams',
  '/exposure',
  '/profile-customization',
  '/customer-support',
  '/deposit-history',
  '/mobile-rankings',
  '/mobile-deposit-history',
  '/mobile-profile-customization',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect removed desktop-only pages to home
  if (REMOVED_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // KEEP EXISTING: Legacy draft redirects to VX2
  if (pathname.startsWith('/draft/v2/') || 
      pathname.startsWith('/draft/v3/') || 
      pathname.startsWith('/draft/topdog/')) {
    const roomId = pathname.split('/').pop();
    return NextResponse.redirect(new URL(`/draft/vx2/${roomId}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Removed pages
    '/rankings',
    '/my-teams',
    '/exposure',
    '/profile-customization',
    '/customer-support',
    '/deposit-history',
    '/mobile-rankings',
    '/mobile-deposit-history',
    '/mobile-profile-customization',
    // Legacy draft routes
    '/draft/v2/:path*',
    '/draft/v3/:path*',
    '/draft/topdog/:path*',
  ],
};
```

### 5.3 Phase 4 Verification

```bash
# 1. Verify pages deleted
for page in rankings my-teams exposure profile-customization customer-support deposit-history; do
  ls pages/${page}.tsx 2>/dev/null && echo "ERROR: ${page}.tsx still exists" || echo "OK: ${page}.tsx deleted"
done

# 2. Build must pass
npm run build

# 3. Test redirects (start dev server first)
npm run dev &
sleep 5

# Test each redirect
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3000/rankings
# Expected: 307 http://localhost:3000/

curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3000/my-teams
# Expected: 307 http://localhost:3000/

# 4. Kill dev server and commit
pkill -f "next dev"
git add -A
git commit -m "Phase 4: Remove desktop-only pages, add redirects in middleware"
```

---

## 6. Phase 5: Align Routes

**Duration:** 1 day  
**Goal:** Make `/` the app entry point. Remove device branching from individual routes.

### 6.1 Update `pages/index.tsx`

**Current state:** Desktop shows "Under construction", mobile redirects to vx2-mobile-app-demo  
**Target state:** Both desktop and mobile show AppShellVX2 (frame handled by `_app`)

```typescript
// pages/index.tsx
import { AppShellVX2 } from '@/components/vx2/shell/AppShellVX2';

export default function HomePage() {
  // Frame vs fullscreen is handled by _app.tsx
  // This page just renders the app shell
  return <AppShellVX2 />;
}
```

### 6.2 Update `pages/mobile.tsx`

Redirect to `/` (app is now the same for all devices):

```typescript
// pages/mobile.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MobilePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
```

**Or delete the file and add to middleware redirects:**
```bash
rm -f pages/mobile.tsx
```

Then in `middleware.ts`:
```typescript
const REMOVED_PAGES = [
  // ... existing
  '/mobile',
];
```

### 6.3 Update `pages/draft/vx2/[roomId].tsx`

**Current state:** Has desktop vs mobile layout branching  
**Target state:** Always renders DraftRoomVX2 (frame handled by `_app`)

```typescript
// pages/draft/vx2/[roomId].tsx
import { useRouter } from 'next/router';
import { DraftRoomVX2 } from '@/components/vx2/draft-room/components/DraftRoomVX2';

export default function DraftRoomPage() {
  const router = useRouter();
  const { roomId } = router.query;

  if (!roomId || typeof roomId !== 'string') {
    return null; // or loading state
  }

  // Frame vs fullscreen is handled by _app.tsx
  // This page just renders the draft room
  return <DraftRoomVX2 roomId={roomId} />;
}
```

### 6.4 Simplify `pages/testing-grounds/vx2-mobile-app-demo.tsx`

**Current state:** Has multi-device selector  
**Target state:** Single phone demo (or redirect to `/`)

**Option A: Keep as simple demo**
```typescript
// pages/testing-grounds/vx2-mobile-app-demo.tsx
import { AppShellVX2 } from '@/components/vx2/shell/AppShellVX2';

export default function VX2MobileAppDemo() {
  // This is now just an alias to the main app
  // Keeping for backwards compatibility with bookmarks/links
  return <AppShellVX2 />;
}
```

**Option B: Redirect to main app**
```bash
rm -f pages/testing-grounds/vx2-mobile-app-demo.tsx
```

Add to middleware:
```typescript
if (pathname === '/testing-grounds/vx2-mobile-app-demo') {
  return NextResponse.redirect(new URL('/', request.url));
}
```

### 6.5 Phase 5 Verification

```bash
# 1. Build must pass
npm run build

# 2. Start dev server
npm run dev &
sleep 5

# 3. Test routes
# / should load app
curl -s http://localhost:3000 | grep -q "AppShellVX2\|topdog" && echo "OK: / loads app"

# /mobile should redirect to /
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/mobile
# Expected: 307 or page loads (if not redirecting)

# /draft/vx2/test-room should load
curl -s http://localhost:3000/draft/vx2/test-room | grep -q "DraftRoom\|draft" && echo "OK: Draft loads"

# 4. Manual check:
# - Desktop: / shows app in phone frame
# - Mobile: / shows app fullscreen
# - Draft room works on both

# 5. Cleanup and commit
pkill -f "next dev"
git add -A
git commit -m "Phase 5: Align routes - / is app entry, remove device branching from pages"
```

---

## 7. Phase 6: Breakpoints and Styles

**Duration:** 1-2 days  
**Goal:** Remove desktop/tablet breakpoints, keep mobile-only styles

### 7.1 Audit Desktop Breakpoints

```bash
# Find all desktop breakpoints in VX2 components
rg "lg:|xl:|2xl:|@media.*min-width.*1024|@media.*min-width.*1280" components/vx2 --type ts --type tsx --type css -l

# Common files that need changes:
# - components/vx2/core/constants/sizes.ts
# - components/vx2/core/constants/responsive.ts
# - Various component files
```

### 7.2 Update Constants

**File:** `components/vx2/core/constants/sizes.ts` (or similar)

```typescript
// REMOVE desktop/tablet breakpoints:
// - lg: 1024px
// - xl: 1280px  
// - 2xl: 1536px
// - tablet: 768px

// KEEP mobile breakpoints:
export const BREAKPOINTS = {
  xs: 320,   // Small phones
  sm: 375,   // Standard phones (iPhone)
  md: 414,   // Large phones (iPhone Plus/Max)
} as const;
```

**File:** `components/vx2/core/constants/responsive.ts`

```typescript
// KEEP device size classes for mobile variants:
export const DEVICE_SIZES = {
  compact: 320,   // Small phones
  standard: 375,  // Standard phones
  large: 414,     // Large phones
} as const;

// REMOVE tablet/desktop references
```

### 7.3 Update Component Styles

For each file found in the audit, remove desktop breakpoints:

**Pattern to find and remove:**
```typescript
// REMOVE patterns like:
className="... lg:w-full lg:px-8 xl:max-w-4xl 2xl:text-lg ..."

// REPLACE with mobile-only:
className="... w-full px-4 ..."
```

**Example transformations:**

```typescript
// BEFORE:
<div className="p-2 sm:p-4 lg:p-8 xl:p-12">

// AFTER:
<div className="p-2 sm:p-4">
```

```typescript
// BEFORE:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// AFTER:
<div className="grid grid-cols-1 sm:grid-cols-2">
```

```css
/* BEFORE: */
@media (min-width: 1024px) {
  .container { max-width: 960px; }
}

/* AFTER: Remove entire block */
```

### 7.4 Phase 6 Verification

```bash
# 1. Verify no desktop breakpoints remain in VX2
rg "lg:|xl:|2xl:" components/vx2 --type ts --type tsx
# Expected: No results (or only in comments)

rg "@media.*min-width.*(1024|1280|1536)" components/vx2 --type css
# Expected: No results

# 2. Build must pass
npm run build

# 3. Visual check: app looks correct on mobile viewport
# Open dev tools > mobile emulator > verify layout

# 4. Commit
git add -A
git commit -m "Phase 6: Remove desktop/tablet breakpoints, mobile-only styles"
```

---

## 8. Phase 7: Viewport and Meta

**Duration:** 0.5 days  
**Goal:** Correct viewport and PWA meta tags for mobile

### 8.1 Update `pages/_document.tsx`

```typescript
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="TopDog" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TopDog" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### 8.2 Verify Viewport in `_app.tsx` or Layout

Ensure viewport meta is set (Next.js handles this automatically, but verify):

```typescript
// If using next/head in _app.tsx or a layout:
import Head from 'next/head';

// In component:
<Head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</Head>
```

### 8.3 Phase 7 Verification

```bash
# 1. Build must pass
npm run build

# 2. Check meta tags in built output
npm run dev &
sleep 5
curl -s http://localhost:3000 | grep -E "viewport|theme-color|apple-mobile-web-app"

# Expected output includes:
# <meta name="viewport" content="width=device-width...
# <meta name="theme-color" content="#000000"
# <meta name="apple-mobile-web-app-capable" content="yes"

# 3. Commit
pkill -f "next dev"
git add -A
git commit -m "Phase 7: Standardize viewport and PWA meta tags"
```

---

## 9. Phase 8: Testing and Cleanup

**Duration:** 1-2 days  
**Goal:** Final verification and documentation

### 9.1 Automated Verification

```bash
# 1. Full build
npm run build
echo "Build: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

# 2. Type check
npm run type-check
echo "Type check: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

# 3. Lint
npm run lint
echo "Lint: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

# 4. No Navbar/Footer references
echo "Navbar/Footer check:"
rg "Navbar|Footer" components pages --type ts --type tsx --type js | grep -v "//" | grep -v "DevNav" | wc -l
# Expected: 0

# 5. No tablet references
echo "Tablet check:"
rg "tablet|Tablet" components/vx2 pages --type ts --type tsx | grep -v "//" | wc -l
# Expected: 0

# 6. No desktop breakpoints
echo "Desktop breakpoints check:"
rg "lg:|xl:|2xl:" components/vx2 --type ts --type tsx | grep -v "//" | wc -l
# Expected: 0
```

### 9.2 Manual Testing Checklist

**Desktop Browser:**
- [ ] `/` loads app inside phone frame, centered on dark background
- [ ] `/draft/vx2/[roomId]` loads draft room inside phone frame
- [ ] `/testing-grounds/*` routes load inside phone frame
- [ ] No Navbar visible anywhere
- [ ] No Footer visible anywhere
- [ ] DevNav visible on testing-grounds routes (top-left)
- [ ] `/rankings` redirects to `/`
- [ ] `/my-teams` redirects to `/`
- [ ] `/deposit/paymongo/callback` works (minimal layout in frame)

**Mobile Device/Emulator:**
- [ ] `/` loads app fullscreen (no frame)
- [ ] `/draft/vx2/[roomId]` loads draft room fullscreen
- [ ] Layout looks correct (no overflow, proper spacing)
- [ ] Touch interactions work
- [ ] PWA meta tags present (can add to home screen)

**Error States:**
- [ ] `/404` renders correctly
- [ ] `/500` renders correctly
- [ ] Invalid draft room ID handled gracefully

### 9.3 Update Documentation

**File:** `docs/REFACTORING_IMPLEMENTATION_STATUS.md` (or create if needed)

Add section:
```markdown
## V4 Mobile-Only Migration

**Status:** ✅ COMPLETE  
**Date:** [DATE]

### Changes Made:
- Removed desktop Navbar and Footer
- Removed all tablet support (components, hooks, types, routes)
- Removed desktop-only pages (rankings, my-teams, exposure, etc.)
- Added redirects for removed pages
- Desktop now shows app in phone frame
- Mobile shows app fullscreen
- Removed desktop breakpoints (lg:, xl:, 2xl:)

### Files Deleted:
- components/Navbar.js
- components/Footer.js
- components/vx2/tablet/ (entire directory)
- components/vx2/core/constants/tablet.ts
- components/vx2/core/types/tablet.ts
- components/vx2/core/context/TabletLayoutContext.tsx
- components/vx2/hooks/ui/useIsTablet.ts
- components/vx2/hooks/ui/useTabletOrientation.ts
- pages/rankings.tsx
- pages/my-teams.tsx
- pages/exposure.tsx
- pages/profile-customization.tsx
- pages/customer-support.tsx
- pages/deposit-history.tsx
- pages/testing-grounds/vx2-tablet-app-demo.tsx

### Files Modified:
- pages/_app.tsx
- components/vx2/shell/AppShellVX2.tsx
- components/vx2/shell/MobilePhoneFrame.tsx
- pages/index.tsx
- pages/draft/vx2/[roomId].tsx
- middleware.ts
- components/vx2/core/constants/index.ts
- components/vx2/core/types/index.ts
```

### 9.4 Final Commit and PR

```bash
git add -A
git commit -m "Phase 8: Final verification and documentation for V4 mobile-only migration"

# Push and create PR
git push origin feature/v4-mobile-only

# Create PR with description:
# Title: V4 Mobile-Only Architecture Migration
# Description: [Copy the changes from documentation above]
```

---

## 10. Edge Cases (Decided)

These were marked "TBD" in the original plan. Here are the decisions:

| Case | Decision | Implementation |
|------|----------|----------------|
| **DevNav** | Keep, desktop only | Show on `/testing-grounds/*` and `/dev/*` routes, positioned outside phone frame |
| **Deposit callbacks** | In frame on desktop | Renders inside MobilePhoneFrame like any other page |
| **Admin pages** | In frame on desktop | Renders inside MobilePhoneFrame; cramped but functional |
| **Dev pages** | In frame on desktop | Same as admin; DevNav visible outside frame |
| **404 page** | In frame on desktop | Renders inside MobilePhoneFrame |
| **500 page** | In frame on desktop | Renders inside MobilePhoneFrame |
| **_error page** | In frame on desktop | Renders inside MobilePhoneFrame |
| **GlobalErrorBoundary** | Keep as-is | Uses custom error UI, not Navbar.js |
| **mobile-* pages** | Delete and redirect | Redirect to `/` via middleware |

---

## 11. Rollback Procedures

### Per-Phase Rollback

If a phase breaks build/lint/critical flows:

```bash
# 1. Identify the breaking commit
git log --oneline -5

# 2. Revert the phase's commits
git revert HEAD~N..HEAD  # Where N is number of commits in phase

# 3. Push the revert
git push origin feature/v4-mobile-only

# 4. Verify build passes
npm run build
```

### Full Rollback

If migration must be completely abandoned:

```bash
# 1. Switch to main
git checkout main

# 2. Delete feature branch locally
git branch -D feature/v4-mobile-only

# 3. Delete feature branch remotely (if pushed)
git push origin --delete feature/v4-mobile-only
```

### Middleware Rollback

If redirects cause issues:

```bash
# 1. Edit middleware.ts
# 2. Remove problematic matchers from REMOVED_PAGES array
# 3. Keep draft redirects intact
# 4. Commit and deploy
```

---

## 12. File Reference

### Files to DELETE

```
components/Navbar.js
components/Footer.js
components/vx2/tablet/                          (entire directory)
components/vx2/core/constants/tablet.ts
components/vx2/core/types/tablet.ts
components/vx2/core/context/TabletLayoutContext.tsx
components/vx2/hooks/ui/useIsTablet.ts
components/vx2/hooks/ui/useTabletOrientation.ts
pages/rankings.tsx
pages/my-teams.tsx
pages/exposure.tsx
pages/profile-customization.tsx
pages/customer-support.tsx
pages/deposit-history.tsx
pages/mobile-rankings.tsx                       (if exists)
pages/mobile-deposit-history.tsx                (if exists)
pages/mobile-profile-customization.tsx          (if exists)
pages/mobile.tsx                                (or redirect)
pages/testing-grounds/vx2-tablet-app-demo.tsx
pages/testing-grounds/vx2-tablet-app-demo.js.bak (if exists)
```

### Files to MODIFY

```
pages/_app.tsx                                  (remove Navbar/Footer, add frame logic)
components/vx2/shell/AppShellVX2.tsx            (remove frame props)
components/vx2/shell/MobilePhoneFrame.tsx       (simplify to single preset)
pages/index.tsx                                 (render AppShellVX2 directly)
pages/draft/vx2/[roomId].tsx                    (remove device branching)
pages/testing-grounds/vx2-mobile-app-demo.tsx   (simplify or redirect)
middleware.ts                                   (add redirects for removed pages)
components/vx2/core/constants/index.ts          (remove tablet exports)
components/vx2/core/types/index.ts              (remove tablet exports)
components/vx2/core/types/app.ts                (narrow DeviceType)
components/vx2/hooks/ui/index.ts                (remove tablet hook exports)
components/dev/DevNav.js                        (remove tablet links)
components/vx2/core/constants/sizes.ts          (remove desktop breakpoints)
components/vx2/core/constants/responsive.ts     (remove desktop breakpoints)
pages/_document.tsx                             (PWA meta tags)
```

### Files to CREATE

```
hooks/useIsMobileDevice.ts                      (hydration-safe device detection)
```

### Files to KEEP (Do Not Touch)

```
pages/api/**/*                                  (all 87 API routes)
lib/payments/**/*                               (payment processing)
lib/firebase/**/*                               (database utilities)
components/ui/**/*                              (UI component library)
components/vx2/draft-room/**/*                  (draft room components)
components/vx2/app/**/*                         (app components)
components/vx2/modals/**/*                      (modal components)
components/vx2/auth/**/*                        (auth components)
components/GlobalErrorBoundary.tsx              (error handling)
pages/deposit/*/callback.tsx                    (payment callbacks)
pages/admin/**/*                                (admin pages)
pages/dev/**/*                                  (dev pages)
pages/404.tsx                                   (error page)
pages/500.tsx                                   (error page)
pages/_error.tsx                                (error page)
```

---

## 13. Success Criteria

All boxes must be checked before merging:

### Code Quality
- [ ] `npm run build` passes
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] No TypeScript errors
- [ ] No console errors in browser

### Deletions Verified
- [ ] No `Navbar.js` or `Footer.js`
- [ ] No `components/vx2/tablet/` directory
- [ ] No tablet hooks (`useIsTablet`, `useTabletOrientation`)
- [ ] No tablet types/constants
- [ ] No desktop-only pages (rankings, my-teams, etc.)
- [ ] No tablet routes (`vx2-tablet-app-demo`)

### Functionality Verified
- [ ] Desktop: `/` shows app in phone frame
- [ ] Desktop: `/draft/vx2/[roomId]` shows draft in phone frame
- [ ] Mobile: `/` shows app fullscreen
- [ ] Mobile: `/draft/vx2/[roomId]` shows draft fullscreen
- [ ] Redirects work for removed pages
- [ ] DevNav visible on testing-grounds (desktop only)
- [ ] Payment callbacks work
- [ ] Auth flows work

### Style Verified
- [ ] No `lg:`, `xl:`, `2xl:` in VX2 components
- [ ] No tablet breakpoints
- [ ] Mobile layout looks correct
- [ ] No overflow issues

### Documentation Updated
- [ ] `REFACTORING_IMPLEMENTATION_STATUS.md` updated
- [ ] This plan archived in `docs/`

---

## Quick Reference Commands

```bash
# Start development
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Search for patterns
rg "pattern" components pages --type ts --type tsx

# Delete file
rm -f path/to/file.tsx

# Delete directory
rm -rf path/to/directory/

# Git commit
git add -A && git commit -m "message"

# Revert last commit
git revert HEAD
```

---

**Document Version:** 2.0 (Refined)  
**Created:** January 2025  
**Based on:** V4_MOBILE_ONLY_PLAN_REVISED.md, V4_MOBILE_ONLY_HANDOFF.md
