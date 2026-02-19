# Branding Assets

This document describes all logo and branding asset locations across the TopDog platform.

## Main Logo

The primary logo is the white "TD" monogram on black background.

### Web

| File | Path | Usage |
|------|------|-------|
| Main logo | `/public/logo.png` | All web components, auth screens, image sharing |
| Source file | `/public/upscaled_logo.png` | High-resolution source (1024x1024) |

**Components using the logo:**
- `components/vx2/auth/components/SignInModal.tsx`
- `components/vx2/auth/components/SignUpModal.tsx`
- `components/vx2/auth/components/LoginScreenVX2.tsx`
- `components/vx2/auth/components/AuthGateVX2.tsx`
- `components/vx2/auth/components/SignUpScreenVX2.tsx`
- `components/vx2/draft-room/hooks/useImageShare.ts`
- `components/mobile/MobileLayout.tsx`
- `components/mobile/pages/MobileHomeContent.js`
- `components/mobile/pages/PaymentPageContent.js`
- `components/mobile/pages/DepositHistoryContent.js`

### iOS

| File | Path | Usage |
|------|------|-------|
| In-app logo | `TopDog-iOS/TopDog/Assets.xcassets/Logo.imageset/Logo.png` | Auth screens, headers |
| App Icon 120px | `TopDog-iOS/TopDog/Assets.xcassets/AppIcon.appiconset/AppIcon-120.png` | iPhone @2x |
| App Icon 152px | `TopDog-iOS/TopDog/Assets.xcassets/AppIcon.appiconset/AppIcon-152.png` | iPad @2x |
| App Icon 167px | `TopDog-iOS/TopDog/Assets.xcassets/AppIcon.appiconset/AppIcon-167.png` | iPad Pro @2x |
| App Icon 180px | `TopDog-iOS/TopDog/Assets.xcassets/AppIcon.appiconset/AppIcon-180.png` | iPhone @3x |
| App Icon 1024px | `TopDog-iOS/TopDog/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` | App Store |

**Components using the logo:**
- `TopDog-iOS/TopDog/Core/DesignSystem/Components/TopDogLogo.swift`
- Used in `LoginView.swift`, `SignUpView.swift`, `AuthGateView.swift`

### PWA Icons

| Size | Path |
|------|------|
| 72x72 | `/public/icons/icon-72x72.png` |
| 96x96 | `/public/icons/icon-96x96.png` |
| 128x128 | `/public/icons/icon-128x128.png` |
| 144x144 | `/public/icons/icon-144x144.png` |
| 152x152 | `/public/icons/icon-152x152.png` |
| 180x180 | `/public/icons/icon-180x180.png` |
| 192x192 | `/public/icons/icon-192x192.png` |
| 384x384 | `/public/icons/icon-384x384.png` |
| 512x512 | `/public/icons/icon-512x512.png` |

Configured in `/public/manifest.json`.

## Updating the Logo

When updating the logo sitewide:

1. **Web**: Replace `/public/logo.png` with new logo
2. **iOS in-app**: Replace `TopDog-iOS/TopDog/Assets.xcassets/Logo.imageset/Logo.png`
3. **iOS App Icon**: Replace all files in `TopDog-iOS/TopDog/Assets.xcassets/AppIcon.appiconset/`
   - Required sizes: 120, 152, 167, 180, 1024 pixels
4. **PWA**: Regenerate icons using `scripts/generate-pwa-icons.js` or replace manually

### iOS App Icon Sizes (Apple HIG)

| Size | Scale | Pixels | Usage |
|------|-------|--------|-------|
| 60x60 | @2x | 120x120 | iPhone home screen |
| 60x60 | @3x | 180x180 | iPhone Plus/Max home screen |
| 76x76 | @2x | 152x152 | iPad home screen |
| 83.5x83.5 | @2x | 167x167 | iPad Pro home screen |
| 1024x1024 | @1x | 1024x1024 | App Store marketing |

Reference: https://developer.apple.com/design/human-interface-guidelines/app-icons

## Secondary Assets

| File | Path | Usage |
|------|------|-------|
| Blue logo | `/public/blue_logo.png` | Alternative branding |
| Secondary logo | `/public/secondary_logo.png` | Marketing materials |
| WR Blue | `/public/wr_blue.png` | PWA icon background |
