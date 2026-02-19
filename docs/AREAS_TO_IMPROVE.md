# Areas to Improve

**Generated:** 2026-02-02  
**Source:** CODE_REVIEW_COMPREHENSIVE.md + codebase scan (API validation, TypeScript, TODOs, tests, a11y).

Use this as a backlog; pick by priority and impact.

---

## 1. API validation (security & consistency)

**Current state:** Several routes use `validateBody(req, ['key1', 'key2'], logger)` (presence-only) instead of Zod. Draft submit/validate-pick and many auth/payment routes already use `validateRequestBody(req, schema, logger)`.

**Routes still on key-only or manual validation:**

| Route | Current | Improvement |
|-------|---------|-------------|
| ~~`pages/api/xendit/virtual-account.ts`~~ | ~~validateBody + custom validateRequest~~ | **Done:** `xenditCreateVABodySchema` + `validateRequestBody`. |
| ~~`pages/api/xendit/ewallet.ts`~~ | ~~validateBody~~ | **Done:** `xenditCreateEWalletChargeBodySchema` + `validateRequestBody` (OVO mobileNumber refine). |
| ~~`pages/api/paymongo/source.ts`~~ | ~~validateBody~~ | **Done:** `paymongoCreateSourceBodySchema` + `validateRequestBody`. |
| ~~`pages/api/azure-vision/analyze.ts`~~ | ~~validateBody~~ | **Done:** `azureVisionAnalyzeSchema` + `validateRequestBody`. |
| `pages/api/auth/signup.ts` | `validateBody` then `validateRequestBody` for signup | Already has schema; consider single `validateRequestBody` for body shape. |

**Done:** `user/update-contact` (updateContactSchema), `paystack/verify` (paystackVerifySchema for POST), `vision/analyze` (visionAnalyzeSchema), `azure-vision/analyze` (azureVisionAnalyzeSchema), `xendit/virtual-account` (xenditCreateVABodySchema), `xendit/ewallet` (xenditCreateEWalletChargeBodySchema), `paymongo/source` (paymongoCreateSourceBodySchema).

**Recommendation:** For each route, add or reuse a schema in `lib/validation`, then switch to `validateRequestBody(req, schema, logger)` and remove `validateBody` / manual checks. Return 400 with Zod error message on failure.

---

## 2. TypeScript: reduce `any`

**Current state:** ~150 matches for `as any` / `: any` across 22 files; many in tests/scripts; some in production.

**Production-focused files to tighten:**

- **components/vx2:** `useDebounce.ts` (already documented), `DraftStatusBar.tsx`, `TournamentCardV3.tsx` – use proper types or `unknown` + guards.
- **lib:** `draftSession.ts`, `edgeErrorHandler.ts`, `middlewareErrorHandler.ts`, `paypalOAuth.ts`, `pushNotifications/fcmService.ts`, `performance/webVitals.ts`.
- **pages/api:** `health-edge.ts`, `xendit/disbursement.ts` (disbursement already uses `ApiHandler`; confirm no remaining `any`).
- **sw.ts:** Service worker uses `any` with eslint-disable; consider minimal interfaces for event/request shapes.

**Recommendation:** Tackle one file at a time: replace `any` with a concrete type or `unknown` and narrow with type guards. Prefer interfaces for request/event shapes used in lib and API.

---

## 3. TODOs and follow-ups

**Code TODOs (non-test):**

- **pages/testing-grounds/vx2-draft-room.tsx:** “In production, validate via API that user has access to this room.”
- **lib/xendit/xenditService.ts:** “Make this required once XENDIT_WEBHOOK_SECRET is configured.”
- **lib/validation/index.ts:** “Migrate all imports to use domain-specific files, then remove this.”
- **lib/paypal/paypalWithdrawals.ts:** Multiple TODOs for email/SMS/notifications and withdrawal hold/processing jobs.
- **scripts/ingest-historical-data.js:** “Implement ESPN Fantasy API historical stats fetching.”

**Recommendation:** Either schedule and implement (e.g. webhook secret, validation barrel cleanup) or convert to tracked issues with clear owners.

---

## 4. Testing

**Gaps:**

- **Component tests:** Only a few vx2 components have tests (e.g. `SignInModal.test.tsx`). Draft room, lobby, and tabs are largely untested at component level.
- **API:** Draft submit-pick and validate-pick have dedicated tests (`__tests__/api/draft-submit-pick.test.ts`, `__tests__/api/draft-validate-pick.test.ts`); other draft/critical endpoints could use similar coverage.
- **E2E:** Cypress specs exist; ensure they run in CI and are stable.

**Recommendation:** Add 1–2 high-value component tests (e.g. `JoinTournamentModal`, `TabBarVX2`, or a small draft-room slice). Add API tests for validate-pick and any new critical routes. Keep E2E in CI.

---

## 5. Accessibility

**Current state:** Many vx2 components use `aria-*` and `role=` (400+ matches). Code review notes:

- Draft room: queue/share and other icon-only buttons should have clear `aria-label` (or visible text).
- Lobby/tournament cards: interactive elements need accessible names; use `role="button"` where not native `<button>`.
- Modals: confirm focus trap and focus restore on close; consider a shared hook/component for modal focus.

**Recommendation:** Audit draft-room and lobby: ensure every interactive control has an accessible name and correct role. Verify modal focus behavior and document pattern in a shared modal component or hook.

---

## 6. Documentation and ops

**Suggested docs (from code review):**

- **API overview:** Single list or OpenAPI-driven doc of routes (method, path, auth, validation). Keeps contracts and clients in sync.
- **Firestore policy:** Short doc or comment in `lib/firebase-utils.ts`: all reads must be bounded (`limit()` or known-bounded subcollection). Tie to `lint:firestore` and CI.
- **VX2 overview (deferred):** Map features (auth, draft room, lobby, tabs, modals) to directories and entry components for new contributors.

**Ops:**

- Run `lint:firestore` (or equivalent) in CI with `lint` and `type-check`.
- Keep `docs/VX2_COLORS_AND_TOKENS.md` updated as more components are migrated to tokens/themes.

---

## 7. VX2 colors (remaining)

**Current state:** Most vx2 surfaces use `colors.ts` themes and CSS vars. Remaining spots (from VX2_COLORS_AND_TOKENS.md):

- **ConnectOnboardingModalVX2:** TSX already uses `var(--...)` for icons; CSS has many fallbacks – optional cleanup.
- **Payment modal CSS:** Paystack/PayMongo/Connect modals use `var(--..., #hex)` fallbacks – acceptable; global tokens now exist in `styles/tokens.css`.

**Recommendation:** Migrate any remaining hardcoded hex/rgba in vx2 to tokens or theme constants when touching those components; keep the doc’s “Examples Already Migrated” and “Files to Migrate” sections updated.

---

## Priority summary

| Priority | Area | Action |
|----------|------|--------|
| **P0**   | API validation | ~~Add Zod + `validateRequestBody` to xendit (virtual-account, ewallet), paymongo/source.~~ **Done.** *(Remaining: auth/signup single validateRequestBody.)* |
| **P1**   | TypeScript | Reduce `any` in production vx2 and lib (see list above). |
| **P1**   | Testing | Add API test for validate-pick; add 1–2 high-value vx2 component tests. |
| **P2**   | Docs/ops | Firestore policy doc + CI for lint:firestore; API overview or OpenAPI. |
| **P2**   | Accessibility | Audit draft room and lobby for aria-labels and focus in modals. |
| **P3**   | TODOs | Resolve or ticket: xendit webhook secret, validation index migration, PayPal withdrawal notifications. |
| **P3**   | VX2 colors | Finish remaining hardcoded colors when editing those components; update colors doc. |
