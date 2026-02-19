# TopDog Design Tool — Soft Launch Review

**Scope:** The **TopDog Design tool** (TopDog Studio) — the web-based design IDE for creating, visualizing, and cross-platform rendering UI components. This review is **not** about the design of the TopDog site or iOS app; it is about the **tool product** itself.

**Reference:** [HANDOFF-PROMPT.md](../HANDOFF-PROMPT.md) (what TopDog Studio is), [design-reference/design-system.md](../design-reference/design-system.md) (tokens the tool references when generating code).

**Soft launch decisions (fill before running checklist):**

| Decision | Yes / No | Notes |
|----------|----------|--------|
| Catalog (`/dev/catalog`) in scope? | | If Yes, include catalog checklist. |
| Companion (device discovery / simulator capture) in scope? | | If Yes, include companion checklist. |
| Primary target viewport | | e.g. desktop 1440px (or document if different). |

---

## Scope of the tool

| Area | Location | Purpose |
|------|----------|---------|
| **Studio app** | [pages/studio/](pages/studio/) (`/studio`, `/studio/library`, `/studio/rosetta`, `/studio/recreate`, `/studio/component/[id]`) | Routes for the design tool |
| **Studio UI** | [components/studio/](components/studio/) | Layout (CommandBar, Navigator, StudioLayout), panels, workspace, canvas, drawing, pages |
| **Studio logic** | [lib/studio/](lib/studio/) | Core types, registry, rendering, AI (detection, codegen, recreation), token tracking, hooks, context |
| **Design system reference** | [design-reference/design-system.md](design-reference/design-system.md) | Canonical tokens; tool’s AI/codegen and docs should align |
| **Studio API** | [pages/api/studio/ai.ts](pages/api/studio/ai.ts) | AI proxy for the tool |
| **Companion service** | [services/studio-companion/](services/studio-companion/) | Device discovery / simulator capture (if used at soft launch) |

Optional (if “TopDog Design” includes the catalog): [pages/dev/catalog.tsx](pages/dev/catalog.tsx) at `/dev/catalog` — TopDog Design Catalog (element inventory). Include in checklist only if the catalog is part of the tool’s soft launch.

---

## Goals of the review

1. **Tool readiness** — Studio flows (dashboard → recreate → library → rosetta → component workbench) work and are presentable for a limited soft launch audience.
2. **Consistency** — Tool UI follows [design-reference/design-system.md](design-reference/design-system.md) (studio/device-frame palette) where applicable; no conflicting or ad‑hoc tokens in Studio-only UI. Studio uses this spec, not the main site product tokens (see [TOPDOG_DESIGN_CODE_REVIEW_REPORT.md](TOPDOG_DESIGN_CODE_REVIEW_REPORT.md) for product vs studio token split).
3. **Accuracy** — AI/codegen and in-tool copy reference the correct design system; no broken or misleading instructions.
4. **Stability** — No blocking layout breaks, missing assets, or critical errors on primary viewports.

---

## Checklist (copy-pasteable)

### Tool scope and access

- [ ] All Studio routes load: `/studio`, `/studio/library`, `/studio/rosetta`, `/studio/recreate`, `/studio/component/[id]`.
- [ ] Access control for Studio routes is correct for soft launch (e.g. dev-only, feature flag, or limited invite). *Note: Studio pages currently have no server-side gate; document where gating lives (middleware, getServerSideProps, or feature-flag service) or confirm open access is intentional.*
- [ ] If catalog is in scope: `/dev/catalog` loads and access is appropriate.

### Studio UI and design-system alignment

- [ ] Studio UI (CommandBar, panels, workspace, dashboard, library, recreate, rosetta) uses [design-reference/design-system.md](design-reference/design-system.md) tokens or documented deviations (studio palette, not main site product tokens).
- [ ] No hardcoded colors/fonts in Studio that conflict with [design-reference/design-system.md](design-reference/design-system.md) (e.g. buttons, inputs, cards, device frame).
- [ ] Studio-specific styles ([components/studio/**/*.module.css](components/studio/)) reviewed for consistency and readability.

### Key flows (happy path)

- [ ] Dashboard → Recreate: open recreate; **screenshot upload** and **draw/sketch** paths both work; run detection/generation without blocking errors.
- [ ] Library: list/search components, open code viewer, export (per-language or bundle) works.
- [ ] Rosetta Matrix: load matrix, see cells for selected platforms, no critical layout/rendering failures.
- [ ] Component workbench: open a component by id, view/edit and re-render as expected.

### AI and code generation

- [ ] AI proxy ([pages/api/studio/ai.ts](pages/api/studio/ai.ts)) is configured and guarded for soft launch (body size, allowed models, max_tokens caps; document if per-user/IP rate limiting is required and in place).
- [ ] Generated code references TopDog design system tokens from [design-reference/design-system.md](design-reference/design-system.md) where applicable (no stale or wrong token names in prompts/hints).
- [ ] Studio chat (ChatPanel: design help, refinements) works end-to-end; no sensitive data in prompts or responses in production.

### Stability and polish

- [ ] No P1 layout breaks or missing assets on target viewport(s) (see “Primary target viewport” above; e.g. desktop 1440px).
- [ ] Error states (e.g. failed detection, failed render) are visible and not blank/crashy.
- [ ] Console: no debug logs or sensitive data in production build for Studio routes.

### Accessibility (tool UI)

- [ ] Primary actions (e.g. “Recreate”, “Export”, “Open library”) have focus states and are keyboard reachable.
- [ ] Critical labels/headings are exposed for screen readers where it matters for the tool’s use.

### Optional: Design catalog (if in scope)

- [ ] All catalog elements/screens render; no broken links.
- [ ] Meta and in-page copy correct for “TopDog Design” tool context.
- [ ] Access to `/dev/catalog` appropriate (e.g. dev-only or gated).

### Optional: Companion (if in scope)

- [ ] Device discovery and connect flow work (or simulator/emulator capture path used at soft launch).
- [ ] No blocking errors when companion is unavailable; graceful degradation or clear messaging.

---

## Result sections (fill in when running the review)

### 1. Tool scope and access

**Result:**  
**Notes:**

### 2. Studio UI and design-system alignment

**Result:**  
**Notes:**

### 3. Key flows (happy path)

**Result:**  
**Notes:**

### 4. AI and code generation

**Result:**  
**Notes:**

### 5. Stability and polish

**Result:**  
**Notes:**

### 6. Accessibility (tool UI)

**Result:**  
**Notes:**

### 7. Optional: Design catalog

**Result:**  
**Notes:**

### 8. Optional: Companion

**Result:**  
**Notes:**

---

## Out of scope for this review

- Design of the **TopDog site** (tournament page, marketing, Join modal).
- **TopDog iOS app** design system (Colors.swift, Typography, TD* components) and App Store assets.
- General site security or code quality (see [docs/archive/handoffs/SOFT_LAUNCH_HANDOFF.md](archive/handoffs/SOFT_LAUNCH_HANDOFF.md) for that).

---

## Process

1. Fill in **Soft launch decisions** (catalog in scope? companion in scope? primary viewport).
2. Owner runs through the checklist before soft launch; skip optional sections (catalog, companion) if marked “No.”
3. Fill in “Result” and “Notes” in each result section.
4. Log any open issues in your issue tracker with a label such as `topdog-design-tool-soft-launch`.
