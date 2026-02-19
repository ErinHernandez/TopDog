# Plan: Automatically Sort Based on the Codebase

**Status:** Planning  
**Goal:** Set up automated sorting that respects and reflects the codebase (imports, exports, and optional structure) so order is consistent and predictable.

---

## 1. Scope: What “sort based on the codebase” means

We can automate sorting in three areas. Recommend starting with **(A)** and adding **(B)** if useful.

| Area | What gets sorted | How it’s “based on codebase” |
|------|-------------------|------------------------------|
| **A. Imports** | Import statements in every file | Order by: builtins → external packages → internal aliases/paths (e.g. `@/`, `lib/`, `components/`). Groups and order are defined by project paths. |
| **B. Exports** | Export order in a file | Optional: e.g. types first, then constants, then components, then default. Can be enforced by a rule or formatter. |
| **C. Generated lists** | Scripts that emit routes, components, etc. | Any script that outputs a list (e.g. sitemap, nav) sorts by filesystem or dependency order (e.g. by path, or by import graph). |

**Recommendation:** Implement **A** first (import sorting). Add **B** only if you want consistent export order; **C** is already “codebase-based” if those scripts use the repo layout.

---

## 2. Option A: Import sorting (recommended first step)

### 2.1 Approach

- Use **ESLint** so sorting is:
  - Defined in one place (`eslint.config.mjs`).
  - Run via `npm run lint:fix` (and optionally in CI).
  - Enforced the same for everyone.

### 2.2 Implementation options

1. **`eslint-plugin-simple-import-sort`** (recommended)
   - Simple, popular, works well with Next/React/TypeScript.
   - Groups: side-effect imports → external packages → internal (by path).
   - Configurable group order and “internal” path prefixes.

2. **`@trivago/prettier-plugin-sort-imports`**
   - Sorts via Prettier. You don’t currently have Prettier; adding it only for this is more tooling than necessary if ESLint can do it.

3. **`eslint-plugin-import` + `import/order`**
   - Built-in `import/order` rule. More verbose config but no extra plugin.

**Recommendation:** Use **`eslint-plugin-simple-import-sort`** with groups that match your codebase:

- Group 1: side-effect imports (e.g. `import 'styles/global.css'`).
- Group 2: Node / React builtins (e.g. `react`, `next/*`).
- Group 3: other external packages (e.g. `firebase/*`, `lodash`).
- Group 4: internal by path, e.g. `@/`, `lib/`, `components/`, `pages/`, `hooks/`, etc., in an order you define (e.g. `lib` before `components` before `pages`).

### 2.3 Codebase-aware “internal” order

“Based on the codebase” here means:

- **Path prefixes** come from your real folders: `@/`, `lib/`, `components/`, `pages/`, `hooks/`, `types/`, etc.
- **Order of those groups** is fixed in config (e.g. types → lib → components → pages → hooks) so it’s consistent everywhere.

No dynamic analysis is required; the config is the single source of truth derived from your structure.

### 2.4 Steps (high level)

1. Add `eslint-plugin-simple-import-sort` (and any needed parser/TypeScript support if not already there).
2. In `eslint.config.mjs`:
   - Enable the plugin.
   - Configure `simple-import-sort/imports` (and optionally `simple-import-sort/exports`) with groups and internal path order.
3. Run `npm run lint:fix` to sort the repo once (and fix any new issues).
4. Optionally: add a small “sort imports” script that only runs the import rule (e.g. for pre-commit or editor-on-save).
5. In CI: keep `lint` (or `lint:fix`) so new code stays sorted.

---

## 3. Option B: Export sorting (optional)

- **What:** Order of `export { A, B, C }` or multiple `export` lines.
- **How:** Same plugin can provide `simple-import-sort/exports`, or use a Prettier/ESLint plugin that sorts exports.
- **When:** Only if you care about consistent export order; otherwise skip.

---

## 4. Option C: Scripts that output “codebase-based” lists

- **What:** Any script that generates a list from the repo (e.g. routes, component catalog, sitemap).
- **How:** Sort the list by:
  - file path (e.g. `pages/**` order), or
  - dependency graph (e.g. topological order), or
  - a config file that defines order.
- **When:** Per-script; no single “auto-sort codebase” switch. Each script can be updated to sort its output by path or dependency when you touch it.

---

## 5. Phased rollout

| Phase | Action | Outcome |
|-------|--------|---------|
| **1** | Add ESLint import-sort plugin and config (Option A) | Config reflects codebase paths; one-time `lint:fix` sorts existing files. |
| **2** | Run `lint:fix` on full codebase, fix any new lint issues | Entire repo has consistent import order. |
| **3** | Document in README or CONTRIBUTING: “Imports are auto-sorted; run `npm run lint:fix` before commit.” | Team keeps using the same rule. |
| **4** | (Optional) Pre-commit hook or editor “format on save” that runs import sort | Fewer manual fixes. |
| **5** | (Optional) Add export sorting (Option B) if desired | Same idea for exports. |
| **6** | (As needed) When editing scripts that emit lists, add explicit sorting by path or dependency (Option C) | Generated lists stay codebase-ordered. |

---

## 6. Success criteria

- **A.** Every file’s imports follow the same group order (side-effect → externals → internal by path).
- **B.** One command (`npm run lint:fix`) reproduces that order.
- **C.** CI runs lint (or lint:fix) so new code stays sorted.
- **D.** (Optional) Export order consistent; (optional) generated lists sorted by path/dependency.

---

## 7. Open decisions

1. **Exact internal path order:** Decide the order of groups like `@/`, `lib/`, `components/`, `hooks/`, `pages/`, `types/` and encode in ESLint config.
2. **Pre-commit vs. CI only:** Whether to run import sort in a pre-commit hook (e.g. husky) or rely on CI + manual `lint:fix`.
3. **Export sorting:** Whether to enable `simple-import-sort/exports` (or equivalent) in Phase 1 or later.

---

## 8. Next step

Implement **Phase 1**: add `eslint-plugin-simple-import-sort`, configure groups from the codebase layout, run `lint:fix` on a subset of files to validate, then roll out to the full codebase and CI.
