# Plan: Make Join Tournament Modal Cover Phone Frame Safe Area

**Goal:** When the Join Tournament modal is open, it should cover the full phone screen including the top safe area (28px), but NOT cover the bottom tab bar (81px).

**Status:** Infrastructure is complete. Modal is **not using the portal**. Debug needed.

**Approach:** Option B (Portal) — portal the modal into a dedicated root inside `MobilePhoneFrame` that covers the safe area and main content, but excludes the tab bar.

---

## 1. Current Issue

The portal infrastructure exists and is correctly configured, but the modal is **not being portaled**. Based on the screenshot, the modal renders in its normal position (inside `contentContainer`) rather than in the portal root.

**Expected behavior:**
- ✅ Cover the safe area (top 28px)
- ✅ Cover the main content area  
- ✅ NOT cover the tab bar (bottom 81px)

**Actual behavior:**
- ❌ Does not cover safe area (gap at top)
- ✅ Covers main content area
- ❌ Covers tab bar (when it shouldn't based on portal config)

---

## 2. Infrastructure Review (Already Complete)

### 2.1 Portal Root in MobilePhoneFrame ✅

**File:** `components/vx2/shell/MobilePhoneFrame.tsx`

```tsx
const TAB_BAR_HEIGHT_PX = 81;

const modalRootStyle: React.CSSProperties = {
  '--modal-root-bottom-inset': `${TAB_BAR_HEIGHT_PX}px`,
} as React.CSSProperties;

// Inside innerScreen:
<div id="phone-frame-modal-root" className={styles.modalRoot} style={modalRootStyle} />
```

### 2.2 Portal Root CSS ✅

**File:** `components/vx2/shell/MobilePhoneFrame.module.css`

```css
.modalRoot {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: var(--modal-root-bottom-inset, 0); /* excludes tab bar (81px) */
  z-index: 1001;
  pointer-events: none;
  border-radius: inherit;
  overflow: hidden;
}
```

### 2.3 Portal Hook ✅

**File:** `lib/usePhoneFramePortal.ts`

```tsx
export function usePhoneFramePortal(): { portalRoot: HTMLElement | null } {
  const inPhoneFrame = useInPhoneFrame();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (inPhoneFrame) {
      const root = document.getElementById('phone-frame-modal-root');
      setPortalRoot(root);
    } else {
      setPortalRoot(null);
    }
  }, [inPhoneFrame]);

  return { portalRoot };
}
```

### 2.4 Modal Portal Logic ✅

**File:** `components/vx2/tabs/lobby/JoinTournamentModal.tsx`

```tsx
const { portalRoot } = usePhoneFramePortal();

// At end of component:
if (portalRoot) {
  return createPortal(modalContent, portalRoot);
}
return modalContent;
```

### 2.5 DOM Structure (Expected)

```
MobilePhoneFrame
  └─ innerScreen (position: relative)
       ├─ safeArea (28px, z-index: 1)
       ├─ contentContainer (padding-top: 28px)
       │    └─ AppShellVX2
       │         └─ shellContainer (flex column)
       │              ├─ mainContent (flex: 1)
       │              │    └─ LobbyTabVX2 (modal NOT rendered here when portaled)
       │              └─ tabBarWrapper
       │                   └─ TabBarVX2
       └─ modalRoot (bottom: 81px, z-index: 1001)  ← Modal SHOULD render here
            └─ JoinTournamentModal (via portal)
```

---

## 3. Debugging: Why Portal Isn't Working

The infrastructure is correct, but the modal is not being portaled. Possible causes:

### 3.1 Hypothesis A: `useInPhoneFrame()` Returns False

The hook depends on `InPhoneFrameProvider` being in the component tree above the modal.

**Check:** In `_app.tsx`, verify the provider wraps the phone frame branch:

```tsx
// _app.tsx (desktop branch)
<InPhoneFrameProvider value={true}>
  <MobilePhoneFrame>
    {pageContent}
  </MobilePhoneFrame>
</InPhoneFrameProvider>
```

**Verify:** Add `console.log('inPhoneFrame:', useInPhoneFrame())` in JoinTournamentModal to confirm the value.

### 3.2 Hypothesis B: Portal Root Not Found

The `document.getElementById('phone-frame-modal-root')` call might fail if:
- The DOM element doesn't exist yet (timing issue)
- The ID is incorrect
- MobilePhoneFrame isn't rendering the modal root

**Check:** In browser DevTools, search for `phone-frame-modal-root` element in the DOM tree.

**Verify:** Add logging in usePhoneFramePortal:
```tsx
useEffect(() => {
  if (inPhoneFrame) {
    const root = document.getElementById('phone-frame-modal-root');
    console.log('Portal root found:', root);
    setPortalRoot(root);
  }
}, [inPhoneFrame]);
```

### 3.3 Hypothesis C: Render Order Issue

The modal might render before MobilePhoneFrame has mounted its modal root div. The `useEffect` in the hook should handle this, but if the modal opens on first render, there could be a race condition.

**Check:** Does the portal work on second modal open (after navigation)?

**Fix if needed:** Add a check that waits for the DOM element:
```tsx
useEffect(() => {
  if (!inPhoneFrame) {
    setPortalRoot(null);
    return;
  }
  
  // Check immediately
  let root = document.getElementById('phone-frame-modal-root');
  if (root) {
    setPortalRoot(root);
    return;
  }
  
  // Fallback: wait for DOM
  const observer = new MutationObserver(() => {
    root = document.getElementById('phone-frame-modal-root');
    if (root) {
      setPortalRoot(root);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  return () => observer.disconnect();
}, [inPhoneFrame]);
```

### 3.4 Hypothesis D: Modal Renders Outside Phone Frame

If the modal is rendered from a route that doesn't go through `_app.tsx`'s phone frame branch (e.g., sandbox pages that render their own frame), the context might not be set.

**Check:** What page/route is the screenshot from? Is it:
- `/` (main app) — should have InPhoneFrameProvider
- `/testing-grounds/lobby-tab-sandbox` — has its own frame, might not set context

---

## 4. Debug Plan (Step by Step)

1. **Add console logging** to identify which hypothesis is correct:
   ```tsx
   // In JoinTournamentModal.tsx
   const inPhoneFrame = useInPhoneFrame();
   const { portalRoot } = usePhoneFramePortal();
   console.log('[JoinTournamentModal] inPhoneFrame:', inPhoneFrame);
   console.log('[JoinTournamentModal] portalRoot:', portalRoot);
   ```

2. **Check DOM** in browser DevTools for `#phone-frame-modal-root`

3. **Identify the route** being tested — main app or sandbox?

4. **Fix based on findings:**
   - If `inPhoneFrame` is false → Check InPhoneFrameProvider wrapping
   - If `portalRoot` is null but `inPhoneFrame` is true → Add DOM wait logic
   - If sandbox page → Ensure sandbox wraps with InPhoneFrameProvider

---

## 5. Expected Fix (Once Debugging Complete)

After the portal is working, the modal should:
- Render inside `#phone-frame-modal-root`
- Cover from top of screen (including safe area) to 81px from bottom (excluding tab bar)
- Have `pointer-events: auto` on overlay so clicks work

No CSS changes needed — the infrastructure is already correct.

---

## 6. Verification Checklist (After Fix)

### Visual Verification
- [ ] Modal covers safe area (top 28px) — no gap at top
- [ ] Modal does NOT cover tab bar — tabs visible and tappable
- [ ] Modal corners clip correctly at top (respects innerScreen border-radius)
- [ ] Modal bottom edge aligns with top of tab bar

### Functional Verification
- [ ] Tab bar buttons are tappable while modal is open
- [ ] Tapping a different tab dismisses modal context (navigates away)
- [ ] Modal close button works
- [ ] Modal overlay click-to-dismiss works

### Edge Cases
- [ ] Opening Rules modal from within Join modal — stacks correctly
- [ ] Works on main app route (`/`)
- [ ] Works on sandbox routes (if InPhoneFrameProvider is added)

---

## 7. Summary

**Infrastructure:** Complete and correctly configured.

**Problem:** Modal is not using the portal (renders in original location).

**Debug:** Verify `useInPhoneFrame()` returns true and `portalRoot` is found.

**Fix:** Based on debug findings — likely InPhoneFrameProvider or timing issue.

**No CSS changes needed** — portal root already has `bottom: 81px` to exclude tab bar.
