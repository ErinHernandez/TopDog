# PWA Implementation Plan - TopDog Mobile Demo

**Document Version**: 1.0  
**Created**: December 12, 2025  
**Status**: Planning - Ready for Implementation  
**Estimated Implementation Time**: 4-6 hours

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [PWA Requirements](#3-pwa-requirements)
4. [Technical Architecture](#4-technical-architecture)
5. [Data & Asset Inventory](#5-data--asset-inventory)
6. [Implementation Plan](#6-implementation-plan)
7. [Offline Strategy](#7-offline-strategy)
8. [Testing Plan](#8-testing-plan)
9. [Deployment Strategy](#9-deployment-strategy)
10. [Risk Assessment](#10-risk-assessment)
11. [Post-Implementation](#11-post-implementation)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### Goal
Transform the TopDog VX2 mobile app into an installable Progressive Web App (PWA) that can run fully offline on an iPad for investor demonstrations.

### Success Criteria
- [ ] App installable to iPad home screen via Safari "Add to Home Screen"
- [ ] Full offline functionality after initial load
- [ ] Draft room demo operates without network connectivity
- [ ] Sub-3-second initial load on subsequent visits
- [ ] App-like experience (no browser chrome, splash screen)

### Key Deliverables
| Deliverable | Description |
|-------------|-------------|
| `manifest.json` | Web app manifest for installation |
| Service Worker | Caching and offline support via `next-pwa` |
| Splash Screens | iOS splash images for professional launch experience |
| Offline Data Bundle | All demo data pre-cached |
| Test Suite | Verification scripts for offline functionality |

---

## 2. Current State Analysis

### 2.1 Application Architecture

| Aspect | Current State | PWA Ready? |
|--------|---------------|------------|
| **Framework** | Next.js 16 (Pages Router) | Yes - `next-pwa` compatible |
| **Hosting** | Vercel (assumed) | Yes - HTTPS included |
| **Data Layer** | Static JSON + Mock Adapter | Yes - can be cached |
| **External APIs** | SportsDataIO (headshots only) | Needs handling |
| **Assets** | Local (`/public/`) | Yes - cacheable |

### 2.2 Demo Pages to Support

| Page | Route | Purpose |
|------|-------|---------|
| Draft Room | `/testing-grounds/vx2-draft-room` | Primary demo - full draft experience |
| Mobile App | `/testing-grounds/vx2-mobile-app-demo` | App shell with tabs |
| Card Sandbox | `/testing-grounds/card-sandbox` | Component showcase (optional) |

### 2.3 Data Dependencies

```
Data Flow:
┌────────────────────────────────────────────────────────────────┐
│ VX2 Draft Room                                                  │
│                                                                 │
│  useAvailablePlayers() ─────► usePlayerPool() ─► /data/player-pool-2025.json
│                        └────► useLiveADP()    ─► /data/adp/live-2025.json
│                                                                 │
│  useHistoricalStats() ──────► /data/history/seasons/*.json     │
│                                                                 │
│  PlayerExpandedCard ────────► Team logos: /logos/nfl/*.png     │
│                                                                 │
│  [EXTERNAL - NEEDS HANDLING]                                   │
│  PlayerPhoto ───────────────► ui-avatars.com (initials)        │
│  Headshots API ─────────────► SportsDataIO (not used in demo)  │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. PWA Requirements

### 3.1 Core PWA Checklist

| Requirement | Description | Priority |
|-------------|-------------|----------|
| HTTPS | Secure connection | Required (Vercel provides) |
| Web App Manifest | Installation metadata | Required |
| Service Worker | Offline caching | Required |
| Responsive | Works on all screens | Already done |
| Installable | "Add to Home Screen" | Required |
| Splash Screen | Launch image | Recommended |
| Offline Mode | Works without network | Required |

### 3.2 iOS Safari Specific Requirements

iOS Safari has unique PWA requirements:

| Requirement | Implementation |
|-------------|----------------|
| `apple-touch-icon` | 180x180 PNG icon |
| `apple-mobile-web-app-capable` | Meta tag |
| `apple-mobile-web-app-status-bar-style` | Meta tag |
| `apple-touch-startup-image` | Multiple splash screens for different device sizes |
| Standalone mode | `display: standalone` in manifest |

### 3.3 Offline Requirements Matrix

| Feature | Offline Requirement | Strategy |
|---------|---------------------|----------|
| Draft Room UI | Must work | Pre-cache all JS/CSS |
| Player Pool Data | Must work | Pre-cache JSON |
| ADP Data | Must work | Pre-cache JSON |
| Historical Stats | Must work | Pre-cache JSON |
| NFL Team Logos | Must work | Pre-cache all PNGs |
| Player Headshots | Should work | Use offline fallback (initials) |
| Draft Timer | Must work | Client-side only |
| Queue Management | Must work | localStorage (already implemented) |

---

## 4. Technical Architecture

### 4.1 PWA Package Selection

**Recommended: `next-pwa` v5.6.0**

Rationale:
- Official Next.js PWA solution
- Automatic service worker generation
- Workbox integration for caching strategies
- Zero-config with sensible defaults
- Active maintenance

```bash
npm install next-pwa
```

### 4.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         iPad Safari                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PWA (Standalone)                        │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Service Worker                          │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │  │
│  │  │  │ Cache First │  │ Network     │  │ Stale While │  │  │  │
│  │  │  │ (Assets)    │  │ First       │  │ Revalidate  │  │  │  │
│  │  │  │             │  │ (API)       │  │ (Data)      │  │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                           │                                │  │
│  │  ┌────────────────────────▼────────────────────────────┐  │  │
│  │  │                   Cache Storage                      │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │  │  │
│  │  │  │ _next/   │ │ /data/   │ │ /logos/  │ │ HTML   │  │  │  │
│  │  │  │ static   │ │ JSON     │ │ PNG      │ │ Pages  │  │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Caching Strategy by Resource Type

| Resource Type | Strategy | Rationale |
|---------------|----------|-----------|
| HTML Pages | Network First, Cache Fallback | Always try fresh, fallback offline |
| JS/CSS (`_next/static`) | Cache First | Immutable, hash-versioned |
| Data JSON (`/data/*`) | Cache First, Background Revalidate | Static for demo |
| Images (`/logos/*`, `/*.png`) | Cache First | Rarely change |
| Fonts (`/Monocraft.ttf`) | Cache First | Never changes |
| External (ui-avatars.com) | Offline Fallback | Use placeholder |

---

## 5. Data & Asset Inventory

### 5.1 Static Data Files (Must Cache)

| Path | Size (est.) | Description |
|------|-------------|-------------|
| `/data/player-pool-2025.json` | ~150KB | Player pool (554 players) |
| `/data/adp/live-2025.json` | ~80KB | Live ADP data |
| `/data/history/manifest.json` | ~1KB | Historical data manifest |
| `/data/history/seasons/2021.json` | ~100KB | 2021 season stats |
| `/data/history/seasons/2022.json` | ~100KB | 2022 season stats |
| `/data/history/seasons/2023.json` | ~100KB | 2023 season stats |
| `/data/history/seasons/2024.json` | ~100KB | 2024 season stats |
| `/data/history/players/index.json` | ~50KB | Player index |
| **Total Data** | **~680KB** | |

### 5.2 Asset Files (Must Cache)

| Path | Count | Size (est.) | Description |
|------|-------|-------------|-------------|
| `/logos/nfl/*.png` | 33 | ~200KB | NFL team logos |
| `/wr_blue.png` | 1 | ~50KB | Background texture |
| `/logo.png` | 1 | ~20KB | TopDog logo |
| `/secondary_logo.png` | 1 | ~20KB | Secondary logo |
| `/Monocraft.ttf` | 1 | ~100KB | Custom font |
| `/*.svg` | 8 | ~10KB | Icons |
| **Total Assets** | **45** | **~400KB** | |

### 5.3 Generated Assets (Auto-cached by Next.js)

| Type | Description |
|------|-------------|
| `_next/static/chunks/*` | JavaScript bundles |
| `_next/static/css/*` | CSS bundles |
| `_next/static/media/*` | Static media |

### 5.4 External Resources (Require Offline Handling)

| URL | Usage | Offline Strategy |
|-----|-------|------------------|
| `ui-avatars.com/api/*` | Player initials fallback | **Pre-generate and cache** |
| `*.sportsdata.io/*` | Headshots (not in demo) | **Not needed - mock adapter** |

---

## 6. Implementation Plan

### Phase 1: Package Installation & Configuration (30 min)

#### Step 1.1: Install Dependencies

```bash
npm install next-pwa
```

#### Step 1.2: Update `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev
  runtimeCaching: [
    // Static data files - Cache First
    {
      urlPattern: /^\/data\/.*\.json$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'topdog-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Images - Cache First
    {
      urlPattern: /^\/logos\/.*\.png$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'topdog-logos',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Other static assets
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ttf|woff|woff2)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'topdog-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    // External avatar fallback
    {
      urlPattern: /^https:\/\/ui-avatars\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'avatar-fallbacks',
        expiration: {
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/draft/topdog',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
```

---

### Phase 2: Web App Manifest (30 min)

#### Step 2.1: Create `public/manifest.json`

```json
{
  "name": "TopDog Best Ball",
  "short_name": "TopDog",
  "description": "Best Ball Draft Platform",
  "start_url": "/testing-grounds/vx2-draft-room",
  "display": "standalone",
  "background_color": "#101927",
  "theme_color": "#1DA1F2",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["sports", "games", "entertainment"]
}
```

#### Step 2.2: Create App Icons

Generate from existing logo using a tool like [Real Favicon Generator](https://realfavicongenerator.net/) or script:

```bash
# Create /public/icons/ directory
mkdir -p public/icons

# Sizes needed:
# 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
```

---

### Phase 3: iOS-Specific Meta Tags (30 min)

#### Step 3.1: Update `pages/_document.js` (or create if doesn't exist)

```jsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Primary Meta Tags */}
        <meta name="application-name" content="TopDog" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TopDog" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1DA1F2" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        
        {/* Apple Splash Screens */}
        {/* iPhone 14 Pro Max (430x932) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
        {/* iPhone 14 Pro (393x852) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />
        {/* iPhone 13/14 (390x844) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        {/* iPad Pro 12.9" (1024x1366) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
        {/* iPad Pro 11" (834x1194) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1668x2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"
        />
        {/* iPad 10.2" (810x1080) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1620x2160.png"
          media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)"
        />
        
        {/* Preconnect for external resources */}
        <link rel="preconnect" href="https://ui-avatars.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

---

### Phase 4: Create Splash Screens & Icons (1 hour)

#### Step 4.1: Create Splash Screen Generator Script

Create `scripts/generate-pwa-assets.js`:

```javascript
/**
 * PWA Asset Generator
 * 
 * Generates app icons and splash screens for PWA installation.
 * Run: node scripts/generate-pwa-assets.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SPLASH_DIR = path.join(__dirname, '../public/splash');
const SOURCE_LOGO = path.join(__dirname, '../public/logo.png');

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

// iOS splash screen sizes (width x height @ pixel ratio)
const SPLASH_SCREENS = [
  { width: 1290, height: 2796, name: 'splash-1290x2796.png' },  // iPhone 14 Pro Max
  { width: 1179, height: 2556, name: 'splash-1179x2556.png' },  // iPhone 14 Pro
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' },  // iPhone 13/14
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' },  // iPad Pro 12.9
  { width: 1668, height: 2388, name: 'splash-1668x2388.png' },  // iPad Pro 11
  { width: 1620, height: 2160, name: 'splash-1620x2160.png' },  // iPad 10.2
];

// Brand colors
const BACKGROUND_COLOR = '#101927';
const LOGO_SIZE_RATIO = 0.3; // Logo takes up 30% of smaller dimension

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function generateIcons() {
  await ensureDir(ICONS_DIR);
  
  for (const size of ICON_SIZES) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    
    await sharp(SOURCE_LOGO)
      .resize(size, size, {
        fit: 'contain',
        background: BACKGROUND_COLOR,
      })
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: icon-${size}x${size}.png`);
  }
}

async function generateSplashScreens() {
  await ensureDir(SPLASH_DIR);
  
  for (const { width, height, name } of SPLASH_SCREENS) {
    const logoSize = Math.floor(Math.min(width, height) * LOGO_SIZE_RATIO);
    const outputPath = path.join(SPLASH_DIR, name);
    
    // Create background with centered logo
    const background = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: BACKGROUND_COLOR,
      },
    }).png().toBuffer();
    
    const logo = await sharp(SOURCE_LOGO)
      .resize(logoSize, logoSize, { fit: 'contain' })
      .toBuffer();
    
    await sharp(background)
      .composite([{
        input: logo,
        gravity: 'center',
      }])
      .toFile(outputPath);
    
    console.log(`Generated: ${name}`);
  }
}

async function main() {
  console.log('Generating PWA assets...\n');
  
  await generateIcons();
  console.log('\n');
  await generateSplashScreens();
  
  console.log('\nDone! PWA assets generated successfully.');
}

main().catch(console.error);
```

#### Step 4.2: Add npm script

```json
{
  "scripts": {
    "generate-pwa-assets": "node scripts/generate-pwa-assets.js"
  }
}
```

---

### Phase 5: Offline Data Pre-caching (30 min)

#### Step 5.1: Create Pre-cache Configuration

The `next-pwa` package automatically generates a service worker. Configure additional pre-caching:

Update `next.config.js` to include pre-cached paths:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  
  // Additional files to pre-cache on install
  additionalManifestEntries: [
    { url: '/data/player-pool-2025.json', revision: null },
    { url: '/data/adp/live-2025.json', revision: null },
    { url: '/data/history/manifest.json', revision: null },
    { url: '/data/history/seasons/2021.json', revision: null },
    { url: '/data/history/seasons/2022.json', revision: null },
    { url: '/data/history/seasons/2023.json', revision: null },
    { url: '/data/history/seasons/2024.json', revision: null },
    { url: '/data/history/players/index.json', revision: null },
  ],
  
  // Runtime caching config...
});
```

---

### Phase 6: Offline Fallback for External Resources (30 min)

#### Step 6.1: Create Offline Fallback Component

The app already uses `ui-avatars.com` as a fallback for player photos. For fully offline operation, we have two options:

**Option A: Accept external dependency (simpler)**
- Pre-warm cache by loading app while online
- Avatar URLs will be cached by service worker
- Works if user loads app once while online

**Option B: Generate local initials (bulletproof)**

Create `components/shared/OfflineAvatar.tsx`:

```typescript
/**
 * Offline-safe avatar component
 * Generates initials directly in canvas - no external dependency
 */

import React, { useRef, useEffect } from 'react';
import { POSITION_COLORS } from '../vx2/core/constants/colors';

interface OfflineAvatarProps {
  name: string;
  position?: 'QB' | 'RB' | 'WR' | 'TE';
  size?: number;
}

export function OfflineAvatar({ 
  name, 
  position = 'RB', 
  size = 40 
}: OfflineAvatarProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get initials
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    // Background
    const bgColor = POSITION_COLORS[position] || '#6b7280';
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.4}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, size / 2, size / 2);
  }, [name, position, size]);
  
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
      }}
    />
  );
}
```

**Recommendation**: Use Option A (pre-warm cache). Option B is available if stricter offline guarantee is needed.

---

### Phase 7: Build & Verification (30 min)

#### Step 7.1: Build Process

```bash
# 1. Generate PWA assets
npm run generate-pwa-assets

# 2. Build production
npm run build

# 3. Verify service worker was generated
ls -la public/sw.js
ls -la public/workbox-*.js
```

#### Step 7.2: Local Testing

```bash
# Start production server locally
npm run start

# Open http://localhost:3000/testing-grounds/vx2-draft-room
# Test "Add to Home Screen" in Chrome DevTools > Application > Manifest
```

---

## 7. Offline Strategy

### 7.1 Cache-First Resources

These resources are cached on first load and served from cache on subsequent requests:

| Resource Pattern | Cache Name | TTL |
|------------------|------------|-----|
| `/data/*.json` | `topdog-data` | 30 days |
| `/logos/nfl/*.png` | `topdog-logos` | 1 year |
| `/_next/static/*` | `next-static` | Forever (immutable) |
| `/*.png`, `/*.ttf` | `topdog-assets` | 1 year |

### 7.2 Network-First Resources

| Resource Pattern | Fallback |
|------------------|----------|
| HTML pages | Cached version |
| API routes | Not used in demo |

### 7.3 Pre-Cached on Install

These files are downloaded immediately when the service worker installs:

```
/data/player-pool-2025.json
/data/adp/live-2025.json
/data/history/manifest.json
/data/history/seasons/2021.json
/data/history/seasons/2022.json
/data/history/seasons/2023.json
/data/history/seasons/2024.json
/data/history/players/index.json
```

### 7.4 Offline Indicators

Consider adding UI feedback for offline state:

```typescript
// hooks/useOnlineStatus.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}
```

---

## 8. Testing Plan

### 8.1 Desktop Browser Testing

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Manifest loads | DevTools > Application > Manifest | Shows app info, icons |
| Service worker registers | DevTools > Application > Service Workers | Shows `sw.js` active |
| Cache populated | DevTools > Application > Cache Storage | Shows cached resources |
| Offline mode | DevTools > Network > Offline, reload | App loads from cache |
| Install prompt | DevTools > Application > Manifest > "Add to home screen" | Shows install option |

### 8.2 iPad Testing Checklist

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Load app | Navigate to URL in Safari | App loads normally |
| Add to home | Share > Add to Home Screen | Icon added to home screen |
| Launch from home | Tap home screen icon | App launches standalone (no Safari chrome) |
| Splash screen | Launch app | Shows branded splash briefly |
| Offline test | Enable airplane mode, launch app | App loads and functions |
| Draft room | Navigate to draft room, start draft | Timer works, picks work |
| Queue | Add/remove players | localStorage persists |
| Switch tabs | Navigate between tabs | All tabs render |

### 8.3 Offline Functionality Tests

```bash
# Test script (manual steps)

1. Open app on iPad while online
2. Navigate through all demo pages to populate cache
3. Add app to home screen
4. Enable airplane mode
5. Force quit Safari
6. Launch app from home screen
7. Verify:
   - [ ] Draft room loads
   - [ ] Player list shows 554 players
   - [ ] Timer countdown works
   - [ ] Queue add/remove works
   - [ ] Tab navigation works
   - [ ] Player expanded card shows stats
   - [ ] Team logos load
```

---

## 9. Deployment Strategy

### 9.1 Pre-Deployment Checklist

- [ ] All icons generated (`/public/icons/`)
- [ ] All splash screens generated (`/public/splash/`)
- [ ] `manifest.json` in `/public/`
- [ ] `_document.js` has all meta tags
- [ ] `next.config.js` has PWA configuration
- [ ] Build succeeds (`npm run build`)
- [ ] `sw.js` generated in `/public/`

### 9.2 Deployment Steps

```bash
# 1. Generate assets (if not done)
npm run generate-pwa-assets

# 2. Commit changes
git add .
git commit -m "feat: Add PWA support for offline demo"

# 3. Push to deploy
git push origin main

# 4. Verify deployment
# - Check https://your-app.vercel.app/manifest.json
# - Check https://your-app.vercel.app/sw.js
```

### 9.3 iPad Installation Steps (for investor meeting)

```
1. On iPad, open Safari
2. Navigate to: https://your-app.vercel.app/testing-grounds/vx2-draft-room
3. Wait for page to fully load (ensure all assets cached)
4. Tap Share button (square with arrow)
5. Scroll down, tap "Add to Home Screen"
6. Name it "TopDog" and tap "Add"
7. Navigate through all tabs to ensure cache is warm
8. App is now ready for offline demo
```

---

## 10. Risk Assessment

### 10.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| iOS Safari PWA bugs | Medium | High | Test on actual iPad, have laptop hotspot backup |
| Cache not fully populated | Medium | High | Provide pre-demo checklist, verify cache in DevTools |
| Large asset fails to cache | Low | Medium | Verify total cache size < iOS limits (~50MB) |
| Service worker update issues | Low | Medium | Use `skipWaiting: true` to force immediate activation |
| External avatar URLs not cached | Medium | Low | Use cache-first strategy, pre-warm cache |

### 10.2 Backup Plan

If PWA fails during demo:
1. Use laptop + iPad hotspot method (tested and reliable)
2. Run `npm run dev` on laptop
3. Create WiFi hotspot from laptop
4. Connect iPad to hotspot
5. Access via `http://[laptop-ip]:3000`

---

## 11. Post-Implementation

### 11.1 Maintenance Tasks

| Task | Frequency | Description |
|------|-----------|-------------|
| Update player pool | Pre-season | Update `/data/player-pool-*.json`, bump revision |
| Update ADP data | Weekly (in-season) | Update `/data/adp/live-*.json` |
| Test offline mode | Before each demo | Run through test checklist |
| Monitor cache size | Monthly | Ensure cache stays under iOS limits |

### 11.2 Future Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Push notifications | Low | Not needed for demo |
| Background sync | Low | Not needed for demo |
| Share target | Low | Allow sharing to app |
| Periodic background update | Medium | Update data when online |

---

## 12. Appendices

### Appendix A: Complete File Checklist

```
Files to Create:
├── public/
│   ├── manifest.json
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-180x180.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── splash/
│       ├── splash-1290x2796.png
│       ├── splash-1179x2556.png
│       ├── splash-1170x2532.png
│       ├── splash-2048x2732.png
│       ├── splash-1668x2388.png
│       └── splash-1620x2160.png
├── pages/
│   └── _document.js (create or update)
├── scripts/
│   └── generate-pwa-assets.js
└── next.config.js (update)

Files Auto-Generated (after build):
├── public/
│   ├── sw.js
│   └── workbox-*.js
```

### Appendix B: iOS PWA Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No push notifications | None for demo | N/A |
| 50MB cache limit | Low risk (~2MB used) | Monitor cache size |
| No background sync | None for demo | N/A |
| Must use Safari | Low | Already planning Safari |
| No install prompt | Low | Manual "Add to Home Screen" |
| IndexedDB may be cleared | Medium | Use localStorage for queue (already done) |

### Appendix C: Quick Reference Commands

```bash
# Development (PWA disabled)
npm run dev

# Production build (PWA enabled)
npm run build

# Production server
npm run start

# Generate PWA assets
npm run generate-pwa-assets

# Check cache in browser
# Open DevTools > Application > Cache Storage
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-12 | AI Assistant | Initial comprehensive plan |

---

**END OF DOCUMENT**

