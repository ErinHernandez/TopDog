# Lobby Tab Sandbox — Refined Plan & Code Examples

> **What is this?** An isolated testing environment for **LobbyTabVX2** (your tournament lobby component). This lets you develop and test the lobby UI without dealing with authentication, payments, or other complexity.

**Document Relationships:**
- **This Plan** = Design decisions, rationale, code examples (the "why" and "what")
- **`LOBBY_TAB_SANDBOX_HANDOFF.md`** = Step-by-step implementation (the "how")

---

## 0. Before You Start (Prerequisites)

### Required Files Must Exist

Before implementing, verify these components exist in your codebase:

```bash
# Run from project root to check dependencies
ls -la components/vx2/core/index.ts
ls -la components/vx2/navigation/index.ts
ls -la components/vx2/tabs/lobby/index.ts
ls -la components/vx2/shell/MobilePhoneFrame.tsx
ls -la components/vx2/core/constants/index.ts
```

### Required Exports

Confirm these exports are available:

| File | Required Exports |
|------|------------------|
| `components/vx2/core/index.ts` | `TabNavigationProvider` |
| `components/vx2/navigation/index.ts` | `TabBarVX2` |
| `components/vx2/tabs/lobby/index.ts` | `LobbyTabVX2` |
| `components/vx2/core/constants/index.ts` | `BG_COLORS`, `DEVICE_PRESETS`, `DevicePresetId`, `ALL_DEVICES` |

### Phase 3 Dependencies (Optional)

Only needed if implementing state overrides:

```bash
ls -la components/vx2/components/shared/feedback/index.ts
```

Exports: `EmptyState`, `ErrorState`. If missing, use the fallback placeholder implementations in Phase 3.

> **Tip:** If any imports fail later, check these files first. Missing exports are the #1 cause of sandbox build failures.

---

## 1. Goals

| Goal | What It Means | Why It Matters |
|------|---------------|----------------|
| **Isolate** | Run LobbyTabVX2 alone — no auth gate, no other tabs, no payment modals | Faster iteration; test lobby UI without logging in or setting up test users |
| **Preview** | Render inside `MobilePhoneFrame` with tab bar | See exactly how it looks on a real phone; catch layout issues early |
| **Iterate** | Optional device selector + loading/error/empty state toggles | Test responsive design and edge cases without waiting for real API states |

---

## 2. File Structure

```
pages/testing-grounds/
  lobby-tab-sandbox.tsx      ← You'll create this file
                             ← URL: /testing-grounds/lobby-tab-sandbox

# OPTIONAL: Only create if you add many controls and want reuse
sandbox/lobby/
  Sandbox.tsx                # Reusable wrapper component
  index.ts                   # Re-export
```

**Decision Guide:**
- **MVP only?** → Single file `lobby-tab-sandbox.tsx` is fine
- **Adding device picker + state toggles?** → Still fine in single file
- **Want to reuse in other sandboxes?** → Extract to `sandbox/lobby/`

---

## 3. Imports & Constants (Reference)

```tsx
// pages/testing-grounds/lobby-tab-sandbox.tsx

// === React & Next.js ===
import React, { useState } from 'react';
import Head from 'next/head';

// === Your VX2 Components ===
import { TabNavigationProvider } from '../../components/vx2/core';
import { TabBarVX2 } from '../../components/vx2/navigation';
import { LobbyTabVX2 } from '../../components/vx2/tabs/lobby';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { BG_COLORS, DEVICE_PRESETS } from '../../components/vx2/core/constants';
import type { DevicePresetId } from '../../components/vx2/core/constants';

// === Sandbox-Specific Constants ===
const PAGE_BG = '#1a1a2e';
const DEFAULT_DEVICE: DevicePresetId = 'iphone-14-pro-max';
```

> **Note:** Import paths use `../../` because the file lives in `pages/testing-grounds/`. Add `ALL_DEVICES` when implementing Phase 2 (device selector).

---

## 4. MVP — Single Phone with Lobby + Tab Bar

**What you're building:** A centered phone preview showing the lobby with a tab bar at the bottom.

### Layout Hierarchy

```
Page (dark background, centered content)
└── TabNavigationProvider (manages tab state)
    └── MobilePhoneFrame (phone visual wrapper)
        └── Content Container (flex column)
            ├── Lobby Area (scrollable, takes remaining space)
            │   └── LobbyTabVX2
            └── TabBarVX2 (fixed at bottom)
```

### Complete MVP Code

```tsx
// pages/testing-grounds/lobby-tab-sandbox.tsx

import React from 'react';
import Head from 'next/head';
import { TabNavigationProvider } from '../../components/vx2/core';
import { TabBarVX2 } from '../../components/vx2/navigation';
import { LobbyTabVX2 } from '../../components/vx2/tabs/lobby';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { BG_COLORS } from '../../components/vx2/core/constants';
import type { DevicePresetId } from '../../components/vx2/core/constants';

const PAGE_BG = '#1a1a2e';
const DEFAULT_DEVICE: DevicePresetId = 'iphone-14-pro-max';

export default function LobbyTabSandboxPage(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Lobby Tab Sandbox - TopDog</title>
        <meta name="description" content="Testing environment for LobbyTabVX2" />
      </Head>

      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ backgroundColor: PAGE_BG }}
      >
        <TabNavigationProvider initialTab="lobby">
          <MobilePhoneFrame devicePreset={DEFAULT_DEVICE} label="Lobby Tab Sandbox">
            <div
              style={{
                height: '100%',
                backgroundColor: BG_COLORS.primary,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}>
                <LobbyTabVX2 onJoinClick={(id) => console.log('Join clicked:', id)} />
              </div>
              <TabBarVX2 />
            </div>
          </MobilePhoneFrame>
        </TabNavigationProvider>
      </div>
    </>
  );
}
```

### Why `minHeight: 0`?

By default, flex children won't shrink below their content size. Adding `minHeight: 0` allows the lobby area to shrink and scroll properly instead of pushing the tab bar off-screen.

### MVP Verification Checklist

- [ ] Page loads at `/testing-grounds/lobby-tab-sandbox`
- [ ] Phone frame is visible and centered
- [ ] Lobby content appears inside the frame
- [ ] Tab bar is visible at the bottom of the phone
- [ ] Lobby scrolls if content exceeds frame height
- [ ] Tab bar stays fixed (doesn't scroll with content)
- [ ] Console shows "Join clicked: [id]" when clicking a tournament's join button
- [ ] No TypeScript errors in terminal
- [ ] No console errors in browser DevTools

---

## 5. Phase 2 — Device Selector

**What you're adding:** A dropdown to switch between device sizes (iPhone SE, 13, 14 Pro Max, etc.).

### Changes

- Add `useState` and `ALL_DEVICES`, `DEVICE_PRESETS` imports.
- Add `const [devicePreset, setDevicePreset] = useState<DevicePresetId>(DEFAULT_DEVICE)`.
- Render a device selector above (or beside) the phone; pass `devicePreset` and updated `label` into `MobilePhoneFrame`.

### Device Selector Example

```tsx
<div style={{ marginBottom: 24, width: 200 }}>
  <label htmlFor="device-select" style={{ color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>
    Device Preview
  </label>
  <select
    id="device-select"
    value={devicePreset}
    onChange={(e) => setDevicePreset(e.target.value as DevicePresetId)}
    style={{
      width: '100%',
      padding: '8px 12px',
      backgroundColor: '#1F2937',
      border: '1px solid #374151',
      borderRadius: 6,
      color: '#FFF',
      fontSize: 13,
      cursor: 'pointer',
    }}
  >
    {ALL_DEVICES.map((id) => (
      <option key={id} value={id}>{DEVICE_PRESETS[id]?.name ?? id}</option>
    ))}
  </select>
</div>
```

### Phase 2 Verification Checklist

- [ ] Dropdown appears (above or beside the phone)
- [ ] All device options are listed
- [ ] Selecting a device changes the phone frame size
- [ ] Label updates to show current device name
- [ ] Lobby content reflows correctly for different screen sizes
- [ ] No layout jumping or flickering on device change

---

## 6. Phase 3 — State Override Toggles

**What you're adding:** Buttons to simulate loading, error, and empty states without touching the data layer.

### Why Override Instead of Mock the Hook?

`LobbyTabVX2` uses `useTournaments` internally. Rather than mocking that hook, swap what the sandbox renders. This keeps the sandbox isolated from production code.

### State Type and Toggles

```tsx
type StateOverride = 'default' | 'loading' | 'error' | 'empty';
const [stateOverride, setStateOverride] = useState<StateOverride>('default');
```

Use toggle buttons (default / loading / error / empty). When not `default`, render a placeholder instead of `LobbyTabVX2`.

### Placeholder Components

**Loading:** A div with `animation: 'pulse 2s infinite'` and `aria-label="Loading tournaments"`. `@keyframes pulse` lives in `styles/globals.css`.

**Error / Empty:** Use `ErrorState` and `EmptyState` from `components/vx2/components/shared/feedback` if available. If not, use inline fallbacks: simple centered message + Retry / Refresh button that sets `stateOverride` back to `'default'`.

### Conditional Rendering

```tsx
<div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
  {stateOverride === 'loading' && <LoadingPlaceholder />}
  {stateOverride === 'error' && <ErrorPlaceholder onRetry={() => setStateOverride('default')} />}
  {stateOverride === 'empty' && <EmptyPlaceholder onRefresh={() => setStateOverride('default')} />}
  {stateOverride === 'default' && <LobbyTabVX2 onJoinClick={(id) => console.log('Join clicked:', id)} />}
</div>
```

### Phase 3 Verification Checklist

- [ ] Four state buttons appear (default, loading, error, empty)
- [ ] Selected button is visually highlighted
- [ ] Loading shows pulsing placeholder
- [ ] Error shows message + retry; retry returns to default
- [ ] Empty shows message + refresh; refresh returns to default
- [ ] Default shows actual lobby content
- [ ] Transitions between states are smooth

---

## 7. Join Click Handling

`LobbyTabVX2` exposes `onJoinClick`. In the sandbox, keep it minimal:

```tsx
<LobbyTabVX2
  onJoinClick={(tournamentId) => {
    console.log('[Lobby Sandbox] Join clicked:', tournamentId);
    // Optional: alert(`Would join: ${tournamentId}`);
    // Optional: router.push(`/testing-grounds/vx2-draft-room?tournament=${tournamentId}`);
  }}
/>
```

**What NOT to do:** Don't implement actual join logic, call real APIs, or modify tournament state. The sandbox is for visual/interaction testing only.

---

## 8. Optional — Extract Reusable Wrapper

**When to extract:** Only if you're building multiple sandboxes that need the same phone + tab bar wrapper.

### `sandbox/lobby/Sandbox.tsx`

Same structure as MVP inner content: `TabNavigationProvider` → `MobilePhoneFrame` → column (lobby area + `TabBarVX2`). Accept `devicePreset`, `label`, `onJoinClick` as props.

### `sandbox/lobby/index.ts`

```ts
export { default as LobbySandbox } from './Sandbox';
export type { LobbySandboxProps } from './Sandbox';
```

### Simplified Page

Import `LobbySandbox` from `../../sandbox/lobby`, render it inside the usual outer layout, and pass `onJoinClick`. Optionally pass `devicePreset` / `label` when using Phase 2.

---

## 9. Troubleshooting

### Import Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Module not found: ... vx2/core` | Wrong path or missing export | Check `components/vx2/core/index.ts` exports `TabNavigationProvider` |
| `Type 'DevicePresetId' is not exported` | Missing type export | Verify `core/constants` exports `DevicePresetId` from `./sizes` |
| `ALL_DEVICES is not defined` | Missing export | Verify `core/constants` re-exports `ALL_DEVICES` from `./sizes` |

### Layout Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Tab bar pushed off screen | Missing `minHeight: 0` on flex child | Add `minHeight: 0` to the lobby container |
| Content not scrolling | `overflow` on wrong element | Let `LobbyTabVX2` handle scrolling or add `overflow: auto` as needed |
| Phone frame not centered | Missing flex container | Ensure parent has `display: flex`, `items-center`, `justify-center` |

### State Override Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Loading pulse not animating | Missing `@keyframes pulse` | Use `styles/globals.css` or Tailwind `animate-pulse` |
| Error/Empty components not found | Missing shared feedback | Use inline fallback placeholders (see handoff) |

---

## 10. Summary & Roadmap

| Phase | Delivered | Complexity | Time Estimate |
|-------|-----------|------------|---------------|
| **MVP** | Single phone, Lobby + TabBar, console logging | Low | 15–30 min |
| **Phase 2** | Device selector dropdown | Low | 10–15 min |
| **Phase 3** | Loading/error/empty state toggles | Medium | 20–30 min |
| **Optional** | Extracted reusable wrapper | Low | 10–15 min |

### Recommended Approach

1. **Start with MVP** — Get something working and verify it.
2. **Add device selector** — Quick win for testing responsive design.
3. **Add state overrides** — Only if you need to test edge-case UIs.
4. **Extract wrapper** — Only if building additional sandboxes.

### Out of Scope (Intentionally)

- Authentication gates  
- Payment/entry modals  
- Real tournament API calls  
- Navigation to other tabs  
- User session management  

---

## Quick Reference: Complete MVP File

```tsx
// pages/testing-grounds/lobby-tab-sandbox.tsx

import React from 'react';
import Head from 'next/head';
import { TabNavigationProvider } from '../../components/vx2/core';
import { TabBarVX2 } from '../../components/vx2/navigation';
import { LobbyTabVX2 } from '../../components/vx2/tabs/lobby';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { BG_COLORS } from '../../components/vx2/core/constants';
import type { DevicePresetId } from '../../components/vx2/core/constants';

const PAGE_BG = '#1a1a2e';
const DEFAULT_DEVICE: DevicePresetId = 'iphone-14-pro-max';

export default function LobbyTabSandboxPage(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Lobby Tab Sandbox - TopDog</title>
        <meta name="description" content="Testing environment for LobbyTabVX2" />
      </Head>

      <div
        className="min-h-screen flex items-center justify-center p-8"
        style={{ backgroundColor: PAGE_BG }}
      >
        <TabNavigationProvider initialTab="lobby">
          <MobilePhoneFrame devicePreset={DEFAULT_DEVICE} label="Lobby Tab Sandbox">
            <div
              style={{
                height: '100%',
                backgroundColor: BG_COLORS.primary,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <LobbyTabVX2 onJoinClick={(id) => console.log('Join clicked:', id)} />
              </div>
              <TabBarVX2 />
            </div>
          </MobilePhoneFrame>
        </TabNavigationProvider>
      </div>
    </>
  );
}
```

For step-by-step implementation, acceptance criteria, and Phase 2/3 code, see **`LOBBY_TAB_SANDBOX_HANDOFF.md`**.
