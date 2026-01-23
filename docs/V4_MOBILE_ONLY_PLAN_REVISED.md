# V4 Mobile-Only Architecture Plan (Revised)

**Date:** January 2025  
**Status:** Planning  
**Reference:** Master refactoring **100% complete** per `docs/MASTER_REFACTORING_COMPLETE.md`, `REFACTORING_FINAL_SUMMARY.md`, `REFACTORING_STATUS_UPDATE.md`

**Handoff:** For an agent executing this plan, use **`docs/V4_MOBILE_ONLY_HANDOFF.md`** as the runbook (phased tasks, verification, rollback).

---

## 1. Post-Refactoring Baseline

**V4 builds on the completed master refactoring.** The following is already done:

| Item | Status | Source |
|------|--------|--------|
| Draft room versions | 1 (VX2 only) | Phase 1E complete |
| Legacy draft code (v2, v3, vx, topdog) | Deleted | Phase 1E |
| `components/shared/` | Migrated to `components/ui/` | Phase 4 |
| Redux | Removed | Phase 3 |
| API standardization | 87/87 routes (100%) | Phase 5 |
| TypeScript | Priority files migrated | Phase 2 |
| Middleware | 100% VX2 redirect | Phase 1D |

**Implications for V4:**
- Do **not** remove legacy draft code again (already gone).
- Use **`components/ui/`** (not `components/shared/`).
- Assume single draft room (VX2), no legacy routes.

---

## 2. V4 Scope

**Goal:** Native mobile, mobile-only. No desktop features or layouts. **On desktop:** all UI inside a phone frame. **On real mobile:** fullscreen app (no frame).

**In scope:**
- Remove desktop Navbar, Footer, desktop layouts.
- Remove all tablet support (components, hooks, routes).
- Remove desktop-only pages; redirect to app.
- Enforce **phone frame on desktop** for app/draft/testing-grounds; **fullscreen on real mobile**.
- Remove desktop breakpoints / desktop-only UI.

**Out of scope:**
- Re-running Phase 1–5 (already complete).
- Changing API routes, payments, or auth.
- Rewriting VX2 draft room or app shell logic beyond wiring.

---

## 3. Current State (Validated)

### 3.1 Layout and navigation

| Item | Path | Notes |
|------|------|--------|
| `_app.tsx` | `pages/_app.tsx` | Renders `Navbar` + `Footer` except landing, draft, dev-draft-navbar, mobile demos, testing-grounds, profile-customization, mobile-profile-customization |
| Desktop nav | `components/Navbar.js` | Desktop top nav |
| Desktop footer | `components/Footer.js` | Desktop footer |
| VX2 shell | `components/vx2/shell/AppShellVX2.tsx` | `showPhoneFrame`, `devicePreset`, `fullScreen`; wraps `InnerShell` in `MobilePhoneFrame` when `showPhoneFrame` |
| Phone frame | `components/vx2/shell/MobilePhoneFrame.tsx` | Device presets, `fullScreen`; used by AppShellVX2 and draft/testing-grounds |

**Note:** `components/v3/Layout/` **does not exist** (no v3 layout to delete).

### 3.2 Tablet (verified)

| Item | Path | Consumers |
|------|------|-----------|
| Tablet shell | `components/vx2/tablet/` | `vx2-tablet-app-demo` only |
| Tablet constants | `components/vx2/core/constants/tablet.ts` | tablet/, core |
| Tablet types | `components/vx2/core/types/tablet.ts` | tablet/, core |
| Layout context | `components/vx2/core/context/TabletLayoutContext.tsx` | `TabletShellVX2` only |
| Hooks | `useIsTablet`, `useTabletOrientation` in `hooks/ui/` | Tablet + `vx2-tablet-app-demo` only |

**Routes:** Only `testing-grounds/vx2-tablet-app-demo` exists. **`vx2-tablet-draft-room` does not exist** (only `vx2-draft-room`).

### 3.3 App entry and routing

| Route | Current behavior |
|-------|-------------------|
| `/` | Mobile → redirect to `testing-grounds/vx2-mobile-app-demo`; desktop → “Under construction” landing |
| `/mobile` | Redirect to `vx2-mobile-app-demo` |
| `/testing-grounds/vx2-mobile-app-demo` | AppShellVX2; desktop = multi-device frame selector, mobile = fullscreen |
| `/draft/vx2/[roomId]` | Mobile = fullscreen `DraftRoomVX2`; desktop = local 375×812 frame + `DraftRoomVX2` |

### 3.4 Desktop-only pages (candidates for removal)

- `pages/rankings.tsx`
- `pages/my-teams.tsx`
- `pages/exposure.tsx`
- `pages/profile-customization.tsx`
- `pages/customer-support.tsx`
- `pages/deposit-history.tsx`

**Keep (or adapt):** `deposit/*/callback`, `admin/*`, `dev/*`, `testing-grounds/*` (except tablet), `404`, `500`, `_error`. `mobile-*` pages can redirect to `/` (app has equivalent tabs/modals).

---

## 4. Revised Phase Plan

### Phase 1: Global phone-frame and app shell (Week 1)

**1.1 `_app.tsx`**
- Remove `Navbar` and `Footer` entirely.
- Remove route-based “hide Navbar/Footer” logic (`isLandingPage`, `isDraftRoom`, etc.).
- Add **root layout**: desktop → wrap `Component` in `MobilePhoneFrame` + optional chrome (e.g. centering); **real mobile** → no frame, just `Component`.
- Keep `SWRConfig`, `UserProvider`, `PlayerDataProvider`, `GlobalErrorBoundary`.
- Retain `DevNav` for `testing-grounds` + desktop only (unchanged).

**1.2 `AppShellVX2`**
- Remove `showPhoneFrame`, `devicePreset`, `fullScreen`; frame is handled in `_app`.
- Always render `InnerShell` (tabs + modals). No device-based frame branching inside shell.

**1.3 `MobilePhoneFrame`**
- Standardize one default preset (e.g. `iphone-15`).
- Fixed dimensions; no desktop-specific sizing. `fullScreen` behavior TBD (centered vs full-viewport).

**Deliverables:** Desktop routes inside phone frame; mobile fullscreen; no Navbar/Footer.

---

### Phase 2: Remove desktop UI (Week 1)

**2.1 Delete**
- `components/Navbar.js`
- `components/Footer.js`

**2.2 Clean up**
- Strip `Navbar`/`Footer` imports and usage (today: `_app` only; verify with `grep`).
- Ensure no `components/v3/Layout` references (none exist).

**Deliverables:** No desktop nav/footer.

---

### Phase 3: Remove tablet (Week 1–2)

**3.1 Delete**
- `components/vx2/tablet/` (entire tree).
- `components/vx2/core/constants/tablet.ts`.
- `components/vx2/core/types/tablet.ts`.
- `components/vx2/core/context/TabletLayoutContext.tsx`.
- `components/vx2/hooks/ui/useIsTablet.ts`, `useTabletOrientation.ts`.
- `pages/testing-grounds/vx2-tablet-app-demo.tsx` (and `.js.bak` if present).

**3.2 Clean up**
- Remove tablet exports from `core/constants/index`, `core/types/index`. Drop `TabletLayoutContext` from `core/context` (it is **not** in `context/index` today).
- Remove `vx2/tablet` from any `vx2` barrel or internal imports.
- Update `core/types/app.ts`: remove or narrow `DeviceType` if it references `'tablet'`.
- Remove `vx2-tablet-*` from DevNav / doc links.

**Deliverables:** No tablet code, no tablet routes.

---

### Phase 4: Remove desktop-only pages (Week 2)

**4.1 Delete**
- `pages/rankings.tsx`
- `pages/my-teams.tsx`
- `pages/exposure.tsx`
- `pages/profile-customization.tsx`
- `pages/customer-support.tsx`
- `pages/deposit-history.tsx`

**4.2 Optional**
- `mobile-rankings`, `mobile-deposit-history`, `mobile-profile-customization`, etc.: redirect to `/` (app provides equivalent UI).

**4.3 Middleware**
- Extend `middleware.ts`: add matcher for removed paths; redirect to `/` (or return 410 if preferred). Preserve existing draft redirects.

**Deliverables:** No desktop-only pages; redirects in place.

---

### Phase 5: Align all routes with phone frame (Week 2)

**5.1 App entry**
- **`/`** = app route: frame (desktop) or fullscreen (mobile) + `AppShellVX2`. Replace current landing + mobile redirect.
- **`/mobile`**: redirect to `/` (or remove if redundant).

**5.2 Draft**
- `pages/draft/vx2/[roomId].tsx`: remove “desktop vs mobile” branching. Always render `DraftRoomVX2`; layout (frame vs fullscreen) comes from `_app`.

**5.3 VX2 mobile app demo**
- `testing-grounds/vx2-mobile-app-demo`: single phone preset when in frame; remove multi-device selector. Or fold into main app and retire demo route (TBD).

**5.4 Testing-grounds**
- Other testing-grounds pages: frame + content; “always one phone” where applicable.

**Deliverables:** Single app route; draft and testing-grounds use global frame logic.

---

### Phase 6: Breakpoints and styles (Week 2–3)

**6.1 Constants**
- In `vx2/core/constants`: remove desktop/tablet breakpoints (`lg`, `xl`, `2xl`, tablet-specific). Keep `responsive.ts` device classes (`compact` / `standard` / `large`).

**6.2 Components (audit)**
- Remove `@media` and Tailwind `lg:`, `xl:`, `2xl:` that target desktop. Known usages (pre-audit): `Switch`, `FlagGrid`, `ProfileCustomizationPage`, `RosterView`, `sizes.ts`, `auth` constants, `UsernameInput`, `ProgressBar`, `SearchInput`, `PositionBadge`, `tablet.ts`.

**Deliverables:** Mobile-only breakpoints and styles.

---

### Phase 7: Viewport and meta (Week 3)

**7.1 Viewport**
- Use `width=device-width` for real mobile; fixed width (e.g. 375) only when rendering inside desktop frame, if needed.

**7.2 Meta**
- Standardize `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` for PWA/mobile.

**Deliverables:** Consistent mobile viewport and meta.

---

### Phase 8: Testing and cleanup (Week 3)

**8.1 Verification**
- Desktop: all app/draft/testing-grounds routes in frame; no Navbar/Footer, no tablet UI.
- Real devices: app and draft work; layout correct.
- `npm run build`; type-check and lint pass.

**8.2 Cleanup**
- Remove unused desktop/tablet references.
- Update `REFACTORING_IMPLEMENTATION_STATUS` (or equivalent) to “V4 mobile-only complete.”

**Deliverables:** Green checks; docs updated.

---

## 5. File Change Summary

**Delete**
- `components/Navbar.js`, `components/Footer.js`
- `components/vx2/tablet/` (all)
- `components/vx2/core/constants/tablet.ts`, `core/types/tablet.ts`
- `components/vx2/core/context/TabletLayoutContext.tsx`
- `components/vx2/hooks/ui/useIsTablet.ts`, `useTabletOrientation.ts`
- `pages/rankings.tsx`, `my-teams.tsx`, `exposure.tsx`, `profile-customization.tsx`, `customer-support.tsx`, `deposit-history.tsx`
- `pages/testing-grounds/vx2-tablet-app-demo.tsx`

**Modify**
- `pages/_app.tsx` (frame always on desktop, no Navbar/Footer)
- `components/vx2/shell/AppShellVX2.tsx` (no frame props)
- `pages/draft/vx2/[roomId].tsx` (single layout, no device branching)
- `pages/index.tsx` (app = `/`, frame/fullscreen per _app)
- `pages/mobile.tsx` (redirect to `/` or remove)
- `pages/testing-grounds/vx2-mobile-app-demo.tsx` (single phone, or retire)
- `vx2` core (exports; remove tablet, layout context)
- `middleware.ts` (redirects for removed pages)

**Keep**
- `components/ui/`
- All API routes
- VX2 app shell, tabs, draft room, modals
- `MobilePhoneFrame` (simplified)
- `DevNav` (testing-grounds + desktop)
- Deposit callbacks, `admin/*`, `dev/*`, error pages (layout TBD)

---

## 6. Success Criteria

- [ ] No Navbar/Footer.
- [ ] No tablet code or routes.
- [ ] No desktop-only pages (redirects in place).
- [ ] All app/draft/testing-grounds routes in phone frame on desktop, fullscreen on mobile.
- [ ] Mobile-only breakpoints and styles.
- [ ] Build, type-check, and lint pass.
- [ ] Manual check on desktop (frame) and real device (fullscreen).

---

## 7. Timeline

- **Phase 1–2:** ~3–5 days (frame, remove desktop UI).
- **Phase 3:** ~2–3 days (tablet removal).
- **Phase 4–5:** ~2–3 days (pages, routes, app entry).
- **Phase 6–7:** ~2–3 days (breakpoints, viewport).
- **Phase 8:** ~1–2 days (test and clean up).

**Total:** ~2–3 weeks.

---

## 8. Edge Cases and Exceptions

| Case | Handling |
|------|----------|
| **DevNav** | Keep; testing-grounds + desktop only. |
| **Deposit callbacks** (`deposit/paymongo|paystack|xendit/callback`) | Keep; render inside `_app`. Use minimal layout (e.g. success message) inside frame or fullscreen per _app. |
| **Admin / dev** (`admin/*`, `dev/*`) | Keep. Either in-frame (cramped) or exclude from frame (minimal layout). TBD. |
| **404, 500, _error** | Minimal layout; in or out of frame TBD. |
| **GlobalErrorBoundary** | Uses custom “errorNavbar”, not `Navbar.js`. Keep as-is. |
| **`mobile-*` pages** | Redirect to `/` or remove; app has equivalent features. |

---

## 9. Pre-Flight and Verification

**Before Phase 2**
- `grep -r "from.*Navbar\|from.*Footer" --include="*.tsx" --include="*.ts" --include="*.js"` and fix any remaining refs.

**Before Phase 3**
- `grep -r "useIsTablet\|useTabletOrientation\|TabletShell\|TabletFrame\|tablet/" --include="*.tsx" --include="*.ts"`; ensure only tablet module and `vx2-tablet-app-demo` consume them.

**After Phase 6**
- `grep -r "lg:\|xl:\|2xl:\|@media.*min-width" --include="*.tsx" --include="*.css" components/vx2`; confirm desktop breakpoints removed.

---

## 10. Revisions vs. Original V4 Plan

**Sources:** `docs/MASTER_REFACTORING_COMPLETE.md`, `REFACTORING_FINAL_SUMMARY.md`, `REFACTORING_STATUS_UPDATE.md`

**Changes applied:**

1. **Baseline** – Master refactoring complete. Single draft (VX2), legacy deleted, `components/ui/` in place. V4 builds on this.
2. **Legacy draft** – Phase 1E done. No legacy draft removal in V4.
3. **Shared components** – Use `components/ui/` only.
4. **API routes** – 87/87 standardized. APIs unchanged for V4.
5. **Scope** – V4 = mobile-only and desktop/tablet removal only.
6. **Phasing** – Phases 1–8 assume master plan complete.

**Refinements in this revision:**

7. **Validated current state** – Removed `v3/Layout` references; corrected tablet routes (only `vx2-tablet-app-demo`; no `vx2-tablet-draft-room`); added `TabletLayoutContext` to delete list.
8. **Frame semantics** – Explicit: desktop = frame, mobile = fullscreen.
9. **App entry** – `/` = app; desktop-only pages redirect to `/`.
10. **Explicit file lists** – Delete/modify lists with concrete paths.
11. **Edge cases** – DevNav, deposit callbacks, admin, dev, error pages, `mobile-*`.
12. **Pre-flight checks** – Grep steps before Phase 2 and 3; audit after Phase 6.

---

**Last updated:** January 2025  
**Rev.** Aligned with `MASTER_REFACTORING_COMPLETE`, `REFACTORING_FINAL_SUMMARY`, `REFACTORING_STATUS_UPDATE`. Refined with validated file inventory, edge cases, and pre-flight steps.
