# TopDog Design Code Review Report

**Date:** 2026-02-06  
**Scope:** Full design-system audit per plan (tokens, web, iOS, catalog, docs, accessibility).

---

## 1. Executive summary

- **Token alignment:** Web (styles/tokens.css, _tokens.css, variables/colors.css, vx2/core/constants/colors.ts) and iOS (Colors.swift) are **aligned** on brand (#2DE2C5, #04FBB9, #1DA1F2) and core semantic tokens. design-reference/design-system.md uses a **different palette** (#3b82f6, #1a1a1a, #2a2a2a) and should be clarified as “studio/device-frame” reference, not product UI.
- **Critical drift:** iOS **WidgetColors.swift** (both extensions) defines `brandAccent = #F59E0B` (orange); main app uses `brandAccent = #04FBB9` (teal). **Fix:** Align widget to #04FBB9.
- **Duplicate token sources:** Three CSS token files define overlapping tokens (tokens.css, tokens/_tokens.css, variables/colors.css). _tokens.css is the most complete; recommend one canonical file and others re-export or import.
- **Hardcoded hex:** 50+ occurrences of #2DE2C5/#04FBB9/#1DA1F2 in pages and components; many are fallbacks `var(--brand-primary, #2DE2C5)` (acceptable). **Action:** Replace inline styles in pages/rules.tsx, 404, 500, admin, ExportModal, PlayerDropdown with CSS variables.
- **MCM (dev-only):** Catalog and wireframe pages duplicate the MCM object in 7+ files. **Action:** Extract to lib/dev/mcmTokens.ts and import everywhere.

---

## 2. Master token audit (summary)

| Token | Web (CSS/TS) | iOS (Colors.swift) | Status |
|-------|--------------|-------------------|--------|
| brand primary | #2DE2C5 (tokens.css, colors.ts) | #2DE2C5 | Aligned |
| brand accent | #04FBB9 | #04FBB9 | Aligned (widget: **drift** #F59E0B) |
| navbar solid | #1DA1F2 | #1DA1F2 | Aligned |
| bg primary | #101927 | dark #101927, light #FFFFFF | Aligned (iOS adaptive) |
| text primary | #ffffff | dark #FFFFFF, light #111827 | Aligned |
| state selected | #2DE2C5 | #2DE2C5 | Aligned |
| position QB/RB/WR/TE/BN | Same hex across web/iOS | Same | Aligned (locked) |

**design-reference/design-system.md:** Uses #3b82f6, #1a1a1a, #2a2a2a, #0ea5e9 – document as “studio/device frame” spec, not product tokens.

---

## 3. Design docs index

| Document | Purpose | Authoritative for |
|----------|---------|-------------------|
| [styles/tokens.css](styles/tokens.css) / [styles/tokens/_tokens.css](styles/tokens/_tokens.css) | Web CSS tokens | Web token values (choose one as canonical) |
| [components/vx2/core/constants/colors.ts](components/vx2/core/constants/colors.ts) | VX2 JS/TS constants | Web runtime colors (must match CSS) |
| [TopDog-iOS/docs/DESIGN_SYSTEM.md](TopDog-iOS/docs/DESIGN_SYSTEM.md) | iOS design system | iOS tokens, TD* component API, a11y |
| [docs/UI_SPEC.md](docs/UI_SPEC.md) | Cross-platform spec | Single reference for token names and usage |
| [design-reference/design-system.md](design-reference/design-system.md) | Extracted reference | Studio/device frames only; not product palette |

**Recommendation:** Treat **styles/tokens/_tokens.css** as single source of truth for web CSS; have tokens.css and variables/colors.css import or re-export. Add one “Token map” section to docs/UI_SPEC.md: token name → web var → iOS property.

---

## 4. Hardcoded value report (high-impact only)

| File | Line / context | Value | Recommendation |
|------|----------------|-------|----------------|
| pages/rules.tsx | Multiple h2 style={{ color: '...' }} | #2DE2C5 | Use className with var(--color-brand-primary) or Tailwind text-primary |
| pages/404.tsx, 500.tsx, _error.tsx | Button hover | #2DE2C5 | Use var(--color-brand-primary) or Tailwind |
| pages/admin/clear-picks.tsx | h2 style | #2DE2C5 | Same as rules |
| components/ExportModal.js | h4, button | #2DE2C5, #60A5FA | Use CSS vars or theme classes |
| components/shared/PlayerDropdown/*.ts, *.js | backgroundColor | #2DE2C5 | Use var(--color-brand-primary) or import from vx2/core/constants/colors |
| components/studio/pages/RecreationCanvas.module.css | Multiple | #2DE2C5 | Use var(--color-brand-primary) |
| components/studio/pages/DiffOverlay.tsx/.module.css | excellent color | #2DE2C5 | Use var or constant |
| styles/critical.css | --brand-primary, --brand-accent | #1a1a2e, #2DE2C5 | Note: --brand-primary here is dark navy; rename or align with tokens.css |
| TopDog-iOS/TopDogWidgetExtension/WidgetColors.swift | brandAccent | #F59E0B | Change to #04FBB9 to match main app |

Studio files using `var(--brand-primary, #2DE2C5)` are acceptable (fallback); prefer defining --brand-primary in :root from tokens.

---

## 5. iOS adoption

- **Design system usage:** Feature views (Lobby, Draft, Auth, Wallet, Settings, Teams, Onboarding) use Color.td.*, Font.td.*, Spacing.*, and TD* components consistently (grep shows 20+ files using design tokens).
- **Widgets:** WidgetColors and WidgetTypography duplicate a subset of Colors/Typography. Doc comment says “Keep in sync with Colors.swift”. **Finding:** brandAccent is wrong in WidgetColors (#F59E0B vs #04FBB9). Recommend shared Swift package or codegen for widget tokens to avoid drift.

---

## 6. Token file consolidation (web)

- **tokens.css:** References “mirror JS constants in components/vx2/core/constants”.
- **_tokens.css:** Claims “SINGLE SOURCE OF TRUTH”; includes position gradients, state colors, breakpoints, spacing, typography.
- **variables/colors.css:** Subset; “Mapped from components/vx2/core/constants/colors.ts”.

**Recommendation:** Keep _tokens.css as canonical; have tokens.css and variables/colors.css either (a) @import _tokens.css and add any extras, or (b) document that _tokens.css is the source and other two are legacy duplicates to be removed after migration.

---

## 7. MCM (dev catalog / wireframes)

- **Current:** MCM object (bg, surface, line, text, orange, teal, gold, coral, sage) is copy-pasted in: pages/dev/catalog.tsx, wireframe.tsx, wireframe-all.tsx, extraction.tsx, wireframe-screenshot.tsx, wireframe-screenshot/v2.tsx, wireframe/cleanV1.tsx, pastiteration-02-04-26.tsx, pastiteration-02-04-26-2205.tsx, components/dev/WireframePhone.tsx, WireframeContent.tsx, docs/wireframe-v1-with-dotted-lines.tsx.
- **Action:** Extract to lib/dev/mcmTokens.ts and import in all of the above. Reduces drift and single place to update.

---

## 8. Accessibility (summary)

- **iOS:** DESIGN_SYSTEM.md documents Dynamic Type, VoiceOver labels/hints, haptics. Contrast (text on bg) should be verified for textMuted on bgCard (low contrast risk). Touch targets: 44pt minimum – TDButton and list rows comply when using design system sizes.
- **Web:** VX2 uses dark backgrounds (#101927, #1f2833); teal #2DE2C5 and blue #1DA1F2 on dark meet WCAG AA for large text. Focus styles: ensure all interactive elements have visible focus (e.g. outline with --border-focus). prefers-reduced-motion in styles/legacy-support.css – verify coverage for any new animations.

---

## 9. Findings list (prioritized)

### P0 – Fix immediately

1. **iOS Widget brandAccent wrong:** TopDogWidgetExtension/WidgetColors.swift and TopDogWidget/WidgetColors.swift use brandAccent = #F59E0B; should be #04FBB9 to match main app.
2. **critical.css --brand-primary mismatch:** critical.css defines --brand-primary: #1a1a2e (navy); rest of app uses --color-brand-primary: #2DE2C5. Either rename critical’s variable to avoid confusion or align with tokens.

### P1 – High value

3. **Replace hardcoded #2DE2C5 in shipping pages:** rules.tsx, 404, 500, admin/clear-picks.tsx, ExportModal.js, PlayerDropdown (shared + ui) – use CSS variable or Tailwind token.
4. **Single canonical web token file:** Decide _tokens.css vs tokens.css; consolidate so one file is source, others import or are deprecated.
5. **Extract MCM to lib/dev/mcmTokens.ts:** Remove duplicate MCM from 10+ dev/wireframe files; import from single module.

### P2 – Nice to have

6. **Design docs index:** Add a short DESIGN_DOCS_INDEX.md (or section in LIBRARY.md) pointing to UI_SPEC, DESIGN_SYSTEM, design-reference, and token file roles.
7. **Studio hex cleanup:** RecreationCanvas.module.css, DiffOverlay – use var(--color-brand-primary) instead of raw #2DE2C5.
8. **design-reference/design-system.md:** Add one line at top: “This spec is for studio/device frames and tooling; product UI uses tokens in styles/tokens and TopDog-iOS DesignSystem.”

---

## 10. Action items (concrete)

| # | Action | Owner |
|---|--------|--------|
| 1 | Change WidgetColors.swift brandAccent to #04FBB9 in both widget targets | Dev |
| 2 | Replace style={{ color: '#2DE2C5' }} in pages/rules.tsx with className using var(--color-brand-primary) or text-primary | Dev |
| 3 | Replace hardcoded #2DE2C5 in pages/404.tsx, 500.tsx, _error.tsx, admin/clear-picks.tsx with CSS var or Tailwind | Dev |
| 4 | Create lib/dev/mcmTokens.ts; export MCM and types; update catalog, wireframe*, extraction, WireframePhone, WireframeContent to import | Dev |
| 5 | Document or fix critical.css --brand-primary vs tokens.css (rename or align) | Dev |
| 6 | Add “Design docs index” section to LIBRARY.md or create docs/DESIGN_DOCS_INDEX.md | Dev |
| 7 | Optional: Consolidate web token files to single canonical (_tokens.css) and migrate imports | Dev |
| 8 | Optional: Add one-line clarification at top of design-reference/design-system.md | Dev |

---

## 11. Cross-platform token table (excerpt)

| Token name | Web (CSS) | Web (TS) | iOS |
|------------|-----------|----------|-----|
| Brand primary | --color-brand-primary: #2DE2C5 | BRAND_COLORS.primary | Color.td.brandPrimary |
| Brand accent | --color-brand-accent: #04FBB9 | BRAND_COLORS.accent | Color.td.brandAccent |
| Navbar solid | --color-navbar-solid: #1DA1F2 | NAVBAR_BLUE.solid | Color.td.navbarSolid |
| Bg primary | --bg-primary: #101927 | BG_COLORS.primary | Color.td.bgPrimary |
| Text primary | --text-primary: #ffffff | TEXT_COLORS.primary | Color.td.textPrimary |
| State selected | --color-selected: #2DE2C5 | STATE_COLORS.selected | Color.td.stateSelected |

Full table can live in docs/UI_SPEC.md or TopDog-iOS/docs/DESIGN_SYSTEM.md.

---

*End of TopDog Design Code Review Report*
