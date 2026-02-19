# Blue Outline Restructure Plan

## Goal
Restructure the blue outline (wr_blue.png) so it's only coded in Sign Up, Sign In, and Forgot Password modals, rather than being a global MobilePhoneFrame feature that needs to be disabled everywhere else.

## Current State Analysis

### Current Implementation
- **Location**: `components/vx2/shell/MobilePhoneFrame.tsx`
- **Mechanism**: `showBlueOutline` prop (default: `true`) controls whether the blue outline appears on the phone frame's screen border
- **Usage**: 
  - Applied globally to the phone frame's screen div (line 44-53)
  - Conditionally disabled in test page: `showBlueOutline={activeModal !== 'profile'}`

### Problems with Current Approach
1. **Global feature**: Blue outline is a frame-level feature, not modal-specific
2. **Opt-out pattern**: Requires explicitly disabling it for non-auth modals
3. **Tight coupling**: Test page needs to know which modals should have blue outline
4. **Maintenance burden**: Every new modal/page needs to remember to disable if needed

## Proposed Solution

### Architecture Change
Move the blue outline from `MobilePhoneFrame` to individual auth modals:
- **SignInModal**: Apply blue outline as a wrapper/border
- **SignUpModal**: Apply blue outline as a wrapper/border  
- **ForgotPasswordModal**: Apply blue outline as a wrapper/border
- **ProfileSettingsModal**: No blue outline (default behavior)
- **Other modals/pages**: No blue outline (default behavior)

### Implementation Approach

#### Option 1: Modal-Level Wrapper (Recommended)
Add a blue outline wrapper div inside each auth modal that creates the border effect.

**Pros:**
- Clean separation of concerns
- Each modal controls its own styling
- No global state/props needed
- Easy to add/remove per modal

**Cons:**
- Slight code duplication (3 modals need the wrapper)
- Need to ensure consistent styling across modals

#### Option 2: Shared Auth Modal Wrapper Component
Create a reusable `AuthModalWrapper` component that provides the blue outline.

**Pros:**
- DRY (Don't Repeat Yourself)
- Consistent styling guaranteed
- Easy to maintain

**Cons:**
- Additional component layer
- All auth modals must use the wrapper

## Implementation Steps

### Phase 1: Remove Global Blue Outline
1. **Remove `showBlueOutline` prop from MobilePhoneFrame**
   - File: `components/vx2/shell/MobilePhoneFrame.tsx`
   - Remove prop from interface (line 24-25)
   - Remove prop from function signature (line 28)
   - Change background to always use `#000` (line 49-51)
   - Remove conditional logic

2. **Update test page**
   - File: `pages/testing-grounds/vx2-auth-test.tsx`
   - Remove `showBlueOutline` prop from MobilePhoneFrame usage (line 111)

### Phase 2: Add Blue Outline to Auth Modals

#### Option A: Individual Implementation (Simpler)
For each auth modal, add a wrapper div with blue outline:

**SignInModal.tsx**
- Wrap the main modal div with a blue outline wrapper
- Apply `wr_blue.png` as border/background

**SignUpModal.tsx**
- Same approach as SignInModal

**ForgotPasswordModal.tsx**
- Same approach as SignInModal

#### Option B: Shared Component (More Maintainable)
1. **Create `AuthModalWrapper.tsx`**
   - Location: `components/vx2/auth/components/AuthModalWrapper.tsx`
   - Props: `children`, optional styling overrides
   - Applies blue outline border/background
   - Handles positioning and z-index

2. **Update auth modals to use wrapper**
   - Wrap each modal's content with `<AuthModalWrapper>`

### Phase 3: Verification
1. Test Sign In modal - should have blue outline
2. Test Sign Up modal - should have blue outline
3. Test Forgot Password modal - should have blue outline
4. Test Profile Settings modal - should NOT have blue outline
5. Test other pages/modals - should NOT have blue outline
6. Verify no regressions in existing functionality

## Files to Modify

### Must Modify
1. `components/vx2/shell/MobilePhoneFrame.tsx`
   - Remove `showBlueOutline` prop
   - Remove conditional blue outline logic
   - Always use black background

2. `pages/testing-grounds/vx2-auth-test.tsx`
   - Remove `showBlueOutline` prop usage

3. `components/vx2/auth/components/SignInModal.tsx`
   - Add blue outline wrapper/border

4. `components/vx2/auth/components/SignUpModal.tsx`
   - Add blue outline wrapper/border

5. `components/vx2/auth/components/ForgotPasswordModal.tsx`
   - Add blue outline wrapper/border

### Optional (If using shared component)
6. `components/vx2/auth/components/AuthModalWrapper.tsx` (new file)
   - Create reusable wrapper component

## Technical Details

### Blue Outline Styling
The blue outline should match the current visual appearance:
- Uses `wr_blue.png` image
- Applied as background with `cover` sizing
- Positioned as a border around the modal content
- Maintains rounded corners consistent with phone frame

### Positioning Considerations
- Modals use `absolute` positioning with `top: 0` (or `contentTopInset`)
- Blue outline wrapper should not interfere with modal positioning
- Ensure z-index layering is correct (outline behind content)

### Edge Cases
- **Phone code verification step**: Blue outline should persist across modal steps
- **Modal transitions**: Blue outline should remain consistent during step changes
- **Error states**: Blue outline should not be affected by error displays
- **Loading states**: Blue outline should remain visible during loading

## Recommendation

**Recommended Approach: Option A (Individual Implementation)**

**Rationale:**
- Simpler to implement (no new component)
- Each modal has full control over its styling
- Easier to customize per modal if needed later
- Less abstraction = easier to understand and maintain
- Code duplication is minimal (3 modals, ~10 lines each)

**Implementation Pattern:**
```tsx
// In each auth modal (SignInModal, SignUpModal, ForgotPasswordModal)
return (
  <div 
    className="absolute left-0 right-0 bottom-0 flex flex-col"
    style={{ 
      top: `${contentTopInset}px`, 
      backgroundColor: BG_COLORS.secondary, 
      zIndex: Z_INDEX.modal 
    }}
  >
    {/* Blue outline wrapper */}
    <div
      style={{
        position: 'absolute',
        inset: '-8px',
        background: 'url(/wr_blue.png) no-repeat center center',
        backgroundSize: 'cover',
        borderRadius: '2.5rem',
        zIndex: -1,
      }}
    />
    
    {/* Existing modal content */}
    {/* ... */}
  </div>
);
```

## Testing Checklist

- [ ] Sign In modal displays blue outline
- [ ] Sign Up modal displays blue outline
- [ ] Forgot Password modal displays blue outline
- [ ] Profile Settings modal has NO blue outline
- [ ] Other modals/pages have NO blue outline
- [ ] Blue outline appears correctly on all modal steps
- [ ] Blue outline persists during modal transitions
- [ ] No visual regressions in existing modals
- [ ] MobilePhoneFrame works correctly without blue outline prop
- [ ] Test page works without showBlueOutline prop

## Rollback Plan

If issues arise, rollback steps:
1. Revert MobilePhoneFrame changes (restore showBlueOutline prop)
2. Revert test page changes (restore showBlueOutline usage)
3. Remove blue outline from individual modals
4. Restore original conditional logic

## Timeline Estimate

- **Phase 1** (Remove global): 15 minutes
- **Phase 2** (Add to modals): 30-45 minutes
- **Phase 3** (Testing): 15-20 minutes
- **Total**: ~1-1.5 hours

## Notes

- The blue outline is a visual design element specific to auth flows
- Moving it to modal level makes the design intent clearer
- This change improves code maintainability and reduces coupling
- Future modals won't need to opt-out of blue outline
