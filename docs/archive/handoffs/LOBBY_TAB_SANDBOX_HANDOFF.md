# Lobby Tab Sandbox – Implementation Handoff

**Project:** Bestball Site – VX2 Testing Grounds  
**Date:** January 2025  
**Status:** Ready for Implementation  
**Scope:** Isolated testing page for LobbyTabVX2 (tournament lobby)  
**Estimated Effort:** MVP 15–30 min; Phase 2 10–15 min; Phase 3 20–30 min; optional extraction 10–15 min  

**Related:** `docs/LOBBY_TAB_SANDBOX_PLAN.md` (design, rationale, code examples, troubleshooting)

**URL:** `/testing-grounds/lobby-tab-sandbox`

---

## Executive Summary

Implement a **Lobby Tab Sandbox**: a testing-grounds page that renders **LobbyTabVX2** in isolation—no auth gate, no other tabs, no payment modals—inside a phone frame with tab bar. Use it to develop and test the lobby UI without touching production app shell, auth, or payments.

**Goals:**
- **Isolate** – Run LobbyTabVX2 alone.
- **Preview** – Render inside `MobilePhoneFrame` with `TabBarVX2` for realistic layout.
- **Iterate** – Optional: device selector, loading/error/empty overrides for UI testing.

**Current state:**
- Plan and code examples live in `docs/LOBBY_TAB_SANDBOX_PLAN.md`.
- A minimal `pages/testing-grounds/lobby-tab-sandbox.tsx` may already exist; align with this handoff and extend as needed.

**What you will deliver:**
- **MVP:** Single Next.js page → phone frame → Lobby tab + tab bar. Join click logs to console.
- **Phase 2 (optional):** Device selector (dropdown) to switch phone preset.
- **Phase 3 (optional):** State override toggles (default / loading / error / empty) that swap in placeholders instead of LobbyTabVX2.
- **Optional extraction:** `sandbox/lobby/Sandbox.tsx` if you add controls and want a reusable “Lobby in phone” wrapper.

**Out of scope:** Auth gate, other tabs, payment modals, real tournament API. Sandbox is testing-grounds only.

---

## Table of Contents

1. [Prerequisites & References](#1-prerequisites--references)
2. [MVP – Single Phone, Lobby + Tab Bar](#2-mvp--single-phone-lobby--tab-bar)
3. [Phase 2 – Device Selector](#3-phase-2--device-selector)
4. [Phase 3 – State Override Toggles](#4-phase-3--state-override-toggles)
5. [Join Click Handling](#5-join-click-handling)
6. [Optional – Extract `sandbox/lobby/Sandbox.tsx`](#6-optional--extract-sandboxlobbysandboxtsx)
7. [Verification & Testing Checklist](#7-verification--testing-checklist)
8. [Troubleshooting](#8-troubleshooting)
9. [Summary & Roadmap](#9-summary--roadmap)

---

## 1. Prerequisites & References

**Relationship to plan:** This handoff provides implementation steps and acceptance criteria. Use `docs/LOBBY_TAB_SANDBOX_PLAN.md` for design rationale, layout notes, troubleshooting, and additional code examples.

### Before You Start: Verify Dependencies

Run from project root:

```bash
ls -la components/vx2/core/index.ts
ls -la components/vx2/navigation/index.ts
ls -la components/vx2/tabs/lobby/index.ts
ls -la components/vx2/shell/MobilePhoneFrame.tsx
ls -la components/vx2/core/constants/index.ts
```

**Required exports:**

| File | Exports |
|------|---------|
| `components/vx2/core` | `TabNavigationProvider` |
| `components/vx2/navigation` | `TabBarVX2` |
| `components/vx2/tabs/lobby` | `LobbyTabVX2` |
| `components/vx2/core/constants` | `BG_COLORS`, `DEVICE_PRESETS`, `ALL_DEVICES`, `DevicePresetId` |

**Phase 3 only:** `components/vx2/components/shared/feedback` → `EmptyState`, `ErrorState`. If missing, use inline fallback placeholders (see Phase 3).

**Existing code to use:**
- `TabNavigationProvider`, `TabBarVX2`, `LobbyTabVX2`, `MobilePhoneFrame`, `BG_COLORS`, `DEVICE_PRESETS`, `ALL_DEVICES`, `DevicePresetId` as above
- `EmptyState`, `ErrorState` from `components/vx2/components/shared/feedback` (or fallbacks)
- `useState` from React (Phase 2 and 3)

**Data:** LobbyTabVX2 uses `useTournaments` (mock data). No API work required.

**Reference implementations:**
- `pages/testing-grounds/slow-draft-sandbox.tsx` – simple phone-frame page
- `pages/testing-grounds/tournament-card-sandbox.js` – device selector, sidebar layout, `TabNavigationProvider` + `TabBarVX2`

---

## 2. MVP – Single Phone, Lobby + Tab Bar

**Objective:** One page, one phone frame, Lobby tab content + tab bar. No controls.

### 2.1 Files to Create

| File | Purpose |
|------|---------|
| `pages/testing-grounds/lobby-tab-sandbox.tsx` | Next.js page; layout + phone frame + Lobby + tab bar |

### 2.2 Implementation Steps

**Step 1.** Create the page with imports and constants:

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
```

**Step 2.** Implement the page component:

- Outer: `min-h-screen`, centered, `backgroundColor: PAGE_BG`, padding (e.g. `p-8`).
- Wrap with `TabNavigationProvider` and `initialTab="lobby"`.
- Render `MobilePhoneFrame` with `devicePreset={DEFAULT_DEVICE}` and `label="Lobby Tab Sandbox"`.
- Inside the frame, a column layout:
  - Top: `flex: 1`, `minHeight: 0`, `overflow: 'hidden'` → `LobbyTabVX2`.
  - Bottom: `TabBarVX2`.
- Use `BG_COLORS.primary` for the inner background.

**Why `minHeight: 0`?** Flex children otherwise won't shrink below content size; the lobby area would push the tab bar off-screen. `minHeight: 0` lets it shrink and scroll correctly.

**Step 3.** Add `Head` with title and meta description.

**Full MVP example:**

```tsx
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
          <MobilePhoneFrame
            devicePreset={DEFAULT_DEVICE}
            label="Lobby Tab Sandbox"
          >
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
                <LobbyTabVX2 onJoinClick={(id) => console.log('Join:', id)} />
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

### 2.3 Acceptance Criteria

- [ ] Page loads at `/testing-grounds/lobby-tab-sandbox`
- [ ] Phone frame is visible and centered
- [ ] Lobby content (featured card, progress, join button, stats) appears inside the frame
- [ ] Tab bar is visible at the bottom of the phone; Lobby tab appears active
- [ ] Lobby scrolls if content exceeds frame height; tab bar stays fixed
- [ ] Console shows `Join clicked: [id]` when clicking a tournament’s join button
- [ ] No TypeScript errors in terminal; no console errors in DevTools

---

## 3. Phase 2 – Device Selector

**Objective:** Add a dropdown to switch `devicePreset` (e.g. iPhone SE, 13, 14 Pro Max).

**Layout:** Stack the device selector **above** the phone (simplest), or use a **left sidebar** (like `tournament-card-sandbox`): `<aside>` + `<main>`. Place the dropdown in that control area.

### 3.1 Files to Modify

| File | Changes |
|------|---------|
| `pages/testing-grounds/lobby-tab-sandbox.tsx` | Add state, device selector UI, pass `devicePreset` into `MobilePhoneFrame` |

### 3.2 Implementation Steps

**Step 1.** Extend imports: add `useState` to the React import, and add `DEVICE_PRESETS`, `ALL_DEVICES`, and `DevicePresetId` from `../../components/vx2/core/constants`:

```tsx
import React, { useState } from 'react';
// ...
import { BG_COLORS, DEVICE_PRESETS, ALL_DEVICES } from '../../components/vx2/core/constants';
import type { DevicePresetId } from '../../components/vx2/core/constants';
```

**Step 2.** Add state:

```tsx
const [devicePreset, setDevicePreset] = useState<DevicePresetId>(DEFAULT_DEVICE);
```

**Step 3.** Add a device selector (above phone or in sidebar). Use `ALL_DEVICES` and `DEVICE_PRESETS`:

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

**Step 4.** Pass `devicePreset` into `MobilePhoneFrame` and use it in the label:

```tsx
<MobilePhoneFrame
  devicePreset={devicePreset}
  label={`Lobby · ${DEVICE_PRESETS[devicePreset]?.name ?? devicePreset}`}
>
  {/* same inner layout as MVP */}
</MobilePhoneFrame>
```

### 3.3 Acceptance Criteria

- [ ] Dropdown appears (above or beside the phone)
- [ ] All device options are listed
- [ ] Selecting a device changes the phone frame size; label updates
- [ ] Lobby content reflows correctly; no layout jumping or flickering

---

## 4. Phase 3 – State Override Toggles

**Objective:** Sandbox can force **loading**, **error**, or **empty** UI by rendering placeholders instead of `LobbyTabVX2`. No changes to `useTournaments` or LobbyTabVX2. Place toggles in the same control area as the device selector. Use `ErrorState` / `EmptyState` from shared feedback when available; otherwise use inline fallback placeholders (centered message + Retry / Refresh button).

### 4.1 Files to Modify

| File | Changes |
|------|---------|
| `pages/testing-grounds/lobby-tab-sandbox.tsx` | State override type and state; toggle UI; placeholder components; conditional render |

### 4.2 Implementation Steps

**Step 1.** Define override type and state:

```tsx
type StateOverride = 'default' | 'loading' | 'error' | 'empty';

const [stateOverride, setStateOverride] = useState<StateOverride>('default');
```

**Step 2.** Add toggle buttons (same control area as device selector):

```tsx
<div style={{ marginBottom: 16 }}>
  <label style={{ color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 500 }}>
    State Override
  </label>
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
    {(['default', 'loading', 'error', 'empty'] as const).map((state) => (
      <button
        key={state}
        onClick={() => setStateOverride(state)}
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: stateOverride === state ? 600 : 400,
          backgroundColor: stateOverride === state ? '#3B82F6' : '#374151',
          color: '#FFF',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'capitalize',
          transition: 'background-color 150ms ease',
        }}
        aria-pressed={stateOverride === state}
      >
        {state}
      </button>
    ))}
  </div>
</div>
```

**Step 3.** Add placeholder components. Use `EmptyState` and `ErrorState` from `../../components/vx2/components/shared/feedback` when available; otherwise use inline fallbacks (centered message + Retry / Refresh). Loading uses `animation: 'pulse 2s infinite'`; `@keyframes pulse` is in `styles/globals.css`.

```tsx
import { EmptyState, ErrorState } from '../../components/vx2/components/shared/feedback';

function LoadingPlaceholder(): React.ReactElement {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        animation: 'pulse 2s infinite',
      }}
      role="status"
      aria-label="Loading tournaments"
    />
  );
}

function ErrorPlaceholder({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ErrorState
        title="Failed to load tournaments"
        description="Simulated error for sandbox"
        onRetry={onRetry}
      />
    </div>
  );
}

function EmptyPlaceholder({ onRefresh }: { onRefresh: () => void }): React.ReactElement {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <EmptyState
        title="No Tournaments Available"
        description="Simulated empty state"
        action={{ label: 'Refresh', onClick: onRefresh, variant: 'secondary' }}
      />
    </div>
  );
}
```

**Step 4.** Conditionally render inside the phone content area:

```tsx
<div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
  {stateOverride === 'loading' && <LoadingPlaceholder />}
  {stateOverride === 'error' && (
    <ErrorPlaceholder onRetry={() => setStateOverride('default')} />
  )}
  {stateOverride === 'empty' && (
    <EmptyPlaceholder onRefresh={() => setStateOverride('default')} />
  )}
  {stateOverride === 'default' && (
    <LobbyTabVX2 onJoinClick={(id) => console.log('Join:', id)} />
  )}
</div>
```

### 4.3 Acceptance Criteria

- [ ] Four state buttons (default, loading, error, empty); selected one is highlighted
- [ ] Loading shows pulsing placeholder
- [ ] Error shows message + Retry; Retry returns to default
- [ ] Empty shows message + Refresh; Refresh returns to default
- [ ] Default shows actual lobby content; layout and tab bar correct for all states

---

## 5. Join Click Handling

Keep `onJoinClick` minimal. Production join logic stays in LobbyTabVX2 / `JoinTournamentModal`.

```tsx
<LobbyTabVX2
  onJoinClick={(tournamentId) => {
    console.log('[Lobby Sandbox] Join clicked:', tournamentId);
    // Optional: alert(`Would join: ${tournamentId}`);
    // Optional: router.push(`/testing-grounds/vx2-draft-room?tournament=${tournamentId}`);
  }}
/>
```

**Do not:** implement actual join logic, call real APIs, or modify tournament state. Sandbox is for visual/interaction testing only.

---

## 6. Optional – Extract `sandbox/lobby/Sandbox.tsx`

**When:** You add device selector and/or state overrides and want a reusable “Lobby in phone” wrapper.

### 6.1 Files to Create

| File | Purpose |
|------|---------|
| `sandbox/lobby/Sandbox.tsx` | TabNavigationProvider + MobilePhoneFrame + LobbyTabVX2 + TabBarVX2 |
| `sandbox/lobby/index.ts` | Re-export `LobbySandbox` |

### 6.2 Implementation

**`sandbox/lobby/Sandbox.tsx`:**

```tsx
import React from 'react';
import { TabNavigationProvider } from '../../components/vx2/core';
import { TabBarVX2 } from '../../components/vx2/navigation';
import { LobbyTabVX2 } from '../../components/vx2/tabs/lobby';
import MobilePhoneFrame from '../../components/vx2/shell/MobilePhoneFrame';
import { BG_COLORS } from '../../components/vx2/core/constants';
import type { DevicePresetId } from '../../components/vx2/core/constants';

export interface LobbySandboxProps {
  devicePreset?: DevicePresetId;
  label?: string;
  onJoinClick?: (id: string) => void;
}

export default function LobbySandbox({
  devicePreset = 'iphone-14-pro-max',
  label = 'Lobby Sandbox',
  onJoinClick,
}: LobbySandboxProps): React.ReactElement {
  return (
    <TabNavigationProvider initialTab="lobby">
      <MobilePhoneFrame devicePreset={devicePreset} label={label}>
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
            <LobbyTabVX2 onJoinClick={onJoinClick} />
          </div>
          <TabBarVX2 />
        </div>
      </MobilePhoneFrame>
    </TabNavigationProvider>
  );
}
```

**`sandbox/lobby/index.ts`:**

```ts
export { default as LobbySandbox } from './Sandbox';
export type { LobbySandboxProps } from './Sandbox';
```

**Page** (`lobby-tab-sandbox.tsx`) then imports `LobbySandbox`, renders it inside the usual outer layout, and passes `devicePreset` / `onJoinClick` (and eventually state-override–related props if you extend the sandbox).

---

## 7. Verification & Testing Checklist

**MVP**
- [ ] Page loads at `/testing-grounds/lobby-tab-sandbox`
- [ ] Phone frame visible and centered; lobby content inside frame
- [ ] Tab bar at bottom; Lobby tab active; lobby scrolls, tab bar fixed
- [ ] Console shows `Join clicked: [id]` on join; no auth/payment flows
- [ ] No TypeScript or console errors

**Phase 2 (if implemented)**
- [ ] Dropdown lists all devices; selection changes frame size and label
- [ ] Lobby reflows correctly; no jumping or flickering

**Phase 3 (if implemented)**
- [ ] Four state buttons; loading/error/empty show placeholders; Retry/Refresh return to default
- [ ] Layout correct for all overrides

**General**
- [ ] No change to production app shell, auth, or payments; `useTournaments` remains mock-based

---

## 8. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `Module not found` / missing exports | Wrong path or missing export | Verify prerequisites (§1); check `core`, `navigation`, `tabs/lobby`, `constants` |
| Tab bar pushed off screen | Missing `minHeight: 0` | Add `minHeight: 0` to lobby container |
| Content not scrolling | `overflow` on wrong element | Let LobbyTabVX2 handle scroll or add `overflow: auto` as needed |
| Phone not centered | Missing flex container | Parent: `display: flex`, `items-center`, `justify-center` |
| Loading pulse not animating | Missing `@keyframes pulse` | Use `styles/globals.css` or Tailwind `animate-pulse` |
| Error/Empty components not found | Missing shared feedback | Use inline fallback placeholders (see Phase 3) |

See **Plan §9 Troubleshooting** for more detail.

---

## 9. Summary & Roadmap

| Phase | Delivered | Complexity | Time |
|-------|-----------|------------|------|
| **MVP** | Single phone, Lobby + TabBar, console logging | Low | 15–30 min |
| **Phase 2** | Device selector dropdown | Low | 10–15 min |
| **Phase 3** | Loading/error/empty state toggles | Medium | 20–30 min |
| **Optional** | `sandbox/lobby` wrapper | Low | 10–15 min |

**Recommended approach:** Start with MVP → add device selector → add state overrides only if needed → extract wrapper only if building more sandboxes.

Implement MVP first, then Phase 2 and 3 as needed. Use `docs/LOBBY_TAB_SANDBOX_PLAN.md` for design rationale, layout options, troubleshooting, and code examples.
