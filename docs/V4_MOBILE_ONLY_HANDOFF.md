# V4 Mobile-Only Handoff — For the Receiving Agent

**Purpose:** Execute the V4 mobile-only migration. Make the app **desktop = phone frame, mobile = fullscreen**; remove desktop Navbar/Footer, tablet, and desktop-only pages.

**Source plan:** `docs/V4_MOBILE_ONLY_PLAN_REVISED.md`  
**Read first:** §1–3 (baseline, scope, current state), then §4 (phases). Use this handoff as the **runbook**; refer to the plan for rationale and edge cases.

---

## 1. Quick orientation

| What | Where |
|------|--------|
| Plan (full) | `docs/V4_MOBILE_ONLY_PLAN_REVISED.md` |
| App shell | `components/vx2/shell/AppShellVX2.tsx` |
| Root layout | `pages/_app.tsx` |
| Draft route | `pages/draft/vx2/[roomId].tsx` |
| Middleware | `middleware.ts` |
| VX2 core exports | `components/vx2/core/constants/index.ts`, `core/types/index.ts` |

**Before you start:**
1. `npm run build` and `npm run lint` pass.
2. Run the pre-flight `rg` (ripgrep) commands below and fix any unexpected refs **before** deleting files. If `rg` is missing, use `grep -rn "pattern" <paths>` instead.

---

## 2. Do / Don’t

**Do:**
- Use `components/ui/` (not `components/shared/`).
- Remove only what the plan lists; keep APIs, auth, payments, VX2 app/draft/modals.
- Work in phases 1 → 8; run verification after each phase.
- Preserve `DevNav` for `testing-grounds` + desktop.

**Don’t:**
- Touch API routes, payments, or auth.
- Delete or refactor legacy draft code (already removed).
- Remove `components/v3/Layout/` (it doesn’t exist).
- Add new features; this is deletion + wiring only.

---

## 3. Pre-flight (run before Phase 1)

```bash
# Navbar/Footer — expect _app only
rg "from.*Navbar|from.*Footer" pages components lib hooks

# Tablet — expect tablet/ and vx2-tablet-app-demo only
rg "useIsTablet|useTabletOrientation|TabletShell|TabletFrame|from.*tablet" components/vx2 pages
```

Fix any refs outside the expected callers **before** you delete. Re-run after Phase 2 and Phase 3 as noted below.

---

## 4. Phase 1 — Global phone-frame and app shell

**Goal:** Desktop = `MobilePhoneFrame` around all routes; mobile = no frame. No Navbar/Footer.

### 4.1 `pages/_app.tsx`

- [ ] Remove `Navbar` and `Footer` imports and JSX.
- [ ] Remove route-based hide logic: `isLandingPage`, `isDraftRoom`, `isDevDraftNavbar`, `isMobileDemo`, `isVX2DraftRoom`, `isVXMobileDemo`, `isTestingGrounds`, `isProfileCustomization`, `isMobileProfileCustomization`.
- [ ] Add root layout:
  - **Desktop:** wrap `Component` in `MobilePhoneFrame` (e.g. centered). Use a single default preset (e.g. `iphone-15`).
  - **Mobile:** render `Component` only (no frame).
- [ ] Keep: `SWRConfig`, `UserProvider`, `PlayerDataProvider`, `GlobalErrorBoundary`, `DevNav` (testing-grounds + desktop only).

**Device detection:** Reuse existing `isMobileDevice`-style logic or `useIsMobileDevice` (from `hooks/useIsMobileDevice`) to decide frame vs no-frame. Ensure no hydration mismatch (e.g. mount check).

### 4.2 `components/vx2/shell/AppShellVX2.tsx`

- [ ] Remove props: `showPhoneFrame`, `devicePreset`, `fullScreen`.
- [ ] Remove `MobilePhoneFrame` usage inside AppShellVX2; always render `InnerShell` (tabs + modals).
- [ ] Remove device-based frame branching.

### 4.3 `components/vx2/shell/MobilePhoneFrame.tsx`

- [ ] Standardize one default preset (e.g. `iphone-15`); fixed dimensions.
- [ ] Drop desktop-specific sizing. Keep `fullScreen` only if _app uses it for centering vs full-viewport.

**Verify:** Desktop: every route (including `/`, draft, testing-grounds) inside a phone frame; no Navbar/Footer. Mobile: fullscreen. `npm run build` and lint pass.

---

## 5. Phase 2 — Remove desktop UI

### 5.1 Pre-flight

```bash
rg "from.*Navbar|from.*Footer" pages components lib hooks
```

Expect **no** results (Phase 1 removed _app refs). Fix any remaining refs before deleting.

### 5.2 Delete

- [ ] `components/Navbar.js`
- [ ] `components/Footer.js`

### 5.3 Clean up

- [ ] Remove `Navbar`/`Footer` imports from `_app` (if not already done in Phase 1).
- [ ] Grep again; ensure no remaining refs.

**Verify:** Build and lint pass. No `Navbar` or `Footer` in bundle.

---

## 6. Phase 3 — Remove tablet

### 6.1 Pre-flight

```bash
rg "useIsTablet|useTabletOrientation|TabletShell|TabletFrame|from.*tablet|TabletLayoutContext" components/vx2 pages
```

Expect only: `components/vx2/tablet/*`, `vx2-tablet-app-demo`, `core/constants/tablet`, `core/types/tablet`, `TabletLayoutContext`, tablet hooks. Everything else must be fixed before delete.

### 6.2 Delete

- [ ] `components/vx2/tablet/` (entire directory)
- [ ] `components/vx2/core/constants/tablet.ts`
- [ ] `components/vx2/core/types/tablet.ts`
- [ ] `components/vx2/core/context/TabletLayoutContext.tsx`
- [ ] `components/vx2/hooks/ui/useIsTablet.ts`
- [ ] `components/vx2/hooks/ui/useTabletOrientation.ts`
- [ ] `pages/testing-grounds/vx2-tablet-app-demo.tsx` (and `vx2-tablet-app-demo.js.bak` if present)

### 6.3 Clean up exports and refs

- [ ] **`components/vx2/core/constants/index.ts`:** Remove the `from './tablet'` export block (TABLET_*, etc.).
- [ ] **`components/vx2/core/types/index.ts`:** Remove the `from './tablet'` type exports.
- [ ] **`components/vx2/core/context/`:** `TabletLayoutContext` is not in `context/index.ts`; no change there. Just delete the file.
- [ ] **`components/vx2/hooks/ui/index.ts`:** If it exports `useIsTablet` or `useTabletOrientation`, remove those exports. (Current index doesn’t; verify.)
- [ ] **`components/vx2/core/types/app.ts`:** If `DeviceType` includes `'tablet'`, remove it or narrow the type.
- [ ] **DevNav / docs:** Remove links to `vx2-tablet-app-demo` or `vx2-tablet-draft-room` (e.g. in `components/dev/DevNav.js` or similar).

**Verify:** Build and lint pass. No tablet imports or routes. Re-run pre-flight grep; only deleted paths may match (none in active code).

---

## 7. Phase 4 — Remove desktop-only pages

### 7.1 Delete

- [ ] `pages/rankings.tsx`
- [ ] `pages/my-teams.tsx`
- [ ] `pages/exposure.tsx`
- [ ] `pages/profile-customization.tsx`
- [ ] `pages/customer-support.tsx`
- [ ] `pages/deposit-history.tsx`

### 7.2 Middleware

- [ ] In `middleware.ts`, add a matcher for:
  - `/rankings`, `/my-teams`, `/exposure`, `/profile-customization`, `/customer-support`, `/deposit-history`
- [ ] Redirect each to `/` (or 410 if preferred). **Keep** existing draft redirects (`/draft/v2|v3|topdog/*` → `/draft/vx2/*`).

### 7.3 Optional

- [ ] `mobile-rankings`, `mobile-deposit-history`, `mobile-profile-customization`, etc.: redirect to `/` or remove. App provides equivalent UI.

**Verify:** Visiting those paths redirects to `/`. Build and lint pass.

---

## 8. Phase 5 — Align routes with phone frame

### 8.1 App entry

- [ ] **`pages/index.tsx`:**  
  - `/` = app route. Desktop: frame + `AppShellVX2`; mobile: fullscreen + `AppShellVX2`.  
  - Remove “under construction” landing and mobile redirect to `vx2-mobile-app-demo`. Use `AppShellVX2` for both.
- [ ] **`pages/mobile.tsx`:** Redirect to `/` (or delete if redundant).

### 8.2 Draft

- [ ] **`pages/draft/vx2/[roomId].tsx`:**  
  - Remove desktop vs mobile branching (`useIsMobileDevice` layout split).  
  - Always render `DraftRoomVX2`. Frame vs fullscreen is determined by `_app` (desktop = frame, mobile = no frame).

### 8.3 VX2 mobile app demo

- [ ] **`pages/testing-grounds/vx2-mobile-app-demo.tsx`:**  
  - Either: single phone preset in frame, remove multi-device selector;  
  - Or: retire route and point main app to `AppShellVX2` (if not already).

### 8.4 Testing-grounds

- [ ] Other testing-grounds pages: ensure “always one phone” where a device selector exists. No tablet.

**Verify:** `/` loads app (frame on desktop, fullscreen on mobile). Draft works same way. Build and lint pass.

---

## 9. Phase 6 — Breakpoints and styles

### 9.1 Constants

- [ ] In `vx2/core/constants` (e.g. `sizes.ts`, `responsive.ts`): remove desktop/tablet breakpoints (`lg`, `xl`, `2xl`, tablet-specific). **Keep** `responsive.ts` device classes: `compact` / `standard` / `large`.

### 9.2 Components (audit)

- [ ] Run:
  ```bash
  rg "lg:|xl:|2xl:|@media.*min-width" components/vx2 -g '*.ts' -g '*.tsx' -g '*.css'
  ```
- [ ] Remove or replace desktop-only `@media` and Tailwind `lg:`/`xl:`/`2xl:` in:
  - `Switch`, `FlagGrid`, `ProfileCustomizationPage`, `RosterView`, `sizes.ts`, auth constants, `UsernameInput`, `ProgressBar`, `SearchInput`, `PositionBadge`, etc.

**Verify:** No desktop breakpoints left in vx2. Build and lint pass.

---

## 10. Phase 7 — Viewport and meta

- [ ] Viewport: `width=device-width` on mobile; fixed width (e.g. 375) only when rendering inside desktop frame, if needed.
- [ ] Meta: standardize `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` for PWA/mobile (e.g. in `_app`, `_document`, or layout).

**Verify:** Mobile viewport and PWA meta correct on key routes.

---

## 11. Phase 8 — Testing and cleanup

### 11.1 Verification

- [ ] Desktop: `/`, `/draft/vx2/[roomId]`, testing-grounds routes load **in phone frame**; no Navbar/Footer, no tablet UI.
- [ ] Real device: app and draft **fullscreen**; layout correct.
- [ ] `npm run build` and `npm run lint` pass.

### 11.2 Cleanup

- [ ] Grep for leftover `Navbar`, `Footer`, `tablet`, `useIsTablet`, `useTabletOrientation`, `TabletShell`, `TabletFrame`; remove or fix.
- [ ] Update `REFACTORING_IMPLEMENTATION_STATUS` or equivalent to “V4 mobile-only complete.”

**Verify:** Success criteria in §6 of the plan are met.

---

## 12. Edge cases (don’t break these)

| Case | Action |
|------|--------|
| **DevNav** | Keep; testing-grounds + desktop only. |
| **Deposit callbacks** (`deposit/paymongo|paystack|xendit/callback`) | Keep; minimal layout inside `_app` (frame or fullscreen per _app). |
| **Admin / dev** (`admin/*`, `dev/*`) | Keep; in-frame or exclude TBD—don’t delete. |
| **404, 500, _error** | Keep; minimal layout; in/out of frame TBD. |
| **GlobalErrorBoundary** | Uses custom “errorNavbar”, not `Navbar.js`. Leave as-is. |
| **`mobile-*` pages** | Redirect to `/` or remove; don’t leave orphan desktop-only behavior. |

---

## 13. Rollback

- Work in a **feature branch**. Tag or commit after each phase.
- If a phase breaks build/lint or key flows:
  1. Revert that phase’s commits.
  2. Re-run build/lint and smoke-test `/`, draft, testing-grounds.
- Middleware: keep draft redirects; only add/remove redirects for deleted desktop pages.

---

## 14. Success criteria (final check)

- [ ] No `Navbar` or `Footer`.
- [ ] No tablet code or routes.
- [ ] No desktop-only pages (redirects in place).
- [ ] App/draft/testing-grounds: **desktop = frame**, **mobile = fullscreen**.
- [ ] Mobile-only breakpoints and styles.
- [ ] Build, type-check, and lint pass.
- [ ] Manual check on desktop (frame) and real device (fullscreen).

---

## 15. Reference — File lists

**Delete (summary):**  
`Navbar.js`, `Footer.js` | `vx2/tablet/` | `core/constants/tablet.ts`, `core/types/tablet.ts` | `TabletLayoutContext.tsx` | `useIsTablet.ts`, `useTabletOrientation.ts` | `rankings`, `my-teams`, `exposure`, `profile-customization`, `customer-support`, `deposit-history` | `vx2-tablet-app-demo`.

**Modify:**  
`_app.tsx` | `AppShellVX2.tsx` | `draft/vx2/[roomId].tsx` | `index.tsx` | `mobile.tsx` | `vx2-mobile-app-demo.tsx` | `core/constants/index`, `core/types/index` | `middleware.ts`.

**Keep:**  
`components/ui/`, all API routes, VX2 app shell/tabs/draft/modals, `MobilePhoneFrame`, `DevNav`, deposit callbacks, `admin/*`, `dev/*`, error pages.

Full detail: `docs/V4_MOBILE_ONLY_PLAN_REVISED.md` §5.

---

**Handoff version:** January 2025  
**Source:** `V4_MOBILE_ONLY_PLAN_REVISED.md`
