# TournamentCard Layout Rebuild - Runtime Testing Guide

**Status:** Ready for Testing  
**Date:** January 2025

---

## 🚀 Quick Start Testing

### Step 1: Navigate to Test Page

1. Ensure dev server is running: `npm run dev`
2. Open browser: `http://localhost:3000/testing-grounds/vx2-mobile-app-demo`
3. Wait for page to fully load (tournament card should be visible)

### Step 2: Open Browser DevTools

1. Press `F12` or right-click → "Inspect"
2. Go to **Console** tab
3. Copy and paste the contents of `test-layout-shifts.js` into console
4. Press Enter

You should see:
```
✅ Found bottom section component
📊 Current element positions:
📐 CSS Grid Properties:
✅ Testing tool ready!
```

### Step 3: Test Layout Stability

#### Test 1: Viewport Resize
1. Run the test script (from Step 2)
2. Resize browser window (make it smaller/larger)
3. In console, run: `_compareLayout()`
4. **Expected**: Shifts < 1px

#### Test 2: DevTools Panel Toggle
1. Run the test script
2. Open/close DevTools (F12)
3. In console, run: `_compareLayout()`
4. **Expected**: Shifts < 1px

#### Test 3: Mobile Address Bar (if testing on mobile)
1. Run the test script
2. Scroll to show/hide mobile browser address bar
3. In console, run: `_compareLayout()`
4. **Expected**: Shifts < 1px

---

## 🔍 Verification Checklist

### Component Structure

Open **Elements** tab in DevTools and verify:

- [ ] `.vx2-tournament-bottom-section` exists
- [ ] Has `display: grid` in computed styles
- [ ] Has `grid-template-rows: auto auto auto` (or `auto auto` if no progress)
- [ ] Has `gap: 16px` (or `12px` on compact devices)
- [ ] Has `contain: layout style`

### Button Element

- [ ] `.vx2-tournament-button` exists
- [ ] Has `height: 57px` (or `40px` on compact)
- [ ] Has `min-height: 57px` (or `40px` on compact)
- [ ] Has `max-height: 57px` (or `40px` on compact)
- [ ] Has `margin-bottom: 0px` (no margin, uses grid gap)

### Progress Section

- [ ] `.vx2-progress-section` exists (if tournament has maxEntries)
- [ ] Has `height: 8px` in container
- [ ] Has `contain: layout`

### Stats Grid

- [ ] `.vx2-tournament-stats` exists
- [ ] Has `display: grid`
- [ ] Has `grid-template-columns: repeat(3, 1fr)`
- [ ] Has `gap: 24px` (or `12px` on compact)
- [ ] Has `contain: layout`

### Spacer Removed

- [ ] `.vx2-card-spacer` does NOT exist (removed)

---

## 📊 Manual Testing Steps

### Visual Inspection

1. **Take Screenshot**: Capture current tournament card
2. **Resize Window**: Make window smaller/larger
3. **Take Another Screenshot**: Compare with first
4. **Verify**: Elements should be in same relative positions

### Functionality Testing

1. **Click Button**: Click "Join Tournament" button
   - [ ] Button click handler fires
   - [ ] Modal opens (if implemented)
   - [ ] No console errors

2. **Keyboard Navigation**: 
   - [ ] Tab to button (should highlight)
   - [ ] Press Enter (should trigger click)
   - [ ] ARIA label is correct

3. **Progress Bar** (if visible):
   - [ ] Progress bar displays correctly
   - [ ] Tiled background shows on fill
   - [ ] Percentage matches tournament data

4. **Stats Display**:
   - [ ] Three stats display correctly
   - [ ] Values match tournament data
   - [ ] Font sizes are correct

---

## 🐛 Troubleshooting

### Issue: "Bottom section not found"

**Solution:**
- Make sure you're on the **Lobby** tab
- Wait for page to fully load
- Check if tournament data is loading (Firebase connection)

### Issue: Layout still shifts

**Check:**
1. Verify CSS Grid is applied: `display: grid` on `.vx2-tournament-bottom-section`
2. Check for conflicting CSS: Look for `!important` rules in `device-sizing.css`
3. Verify `contain: layout style` is applied
4. Check if parent container is causing shifts

### Issue: Button height wrong

**Check:**
1. Verify `height`, `min-height`, and `max-height` are all set
2. Check for CSS overrides in `device-sizing.css`
3. Verify constants match: `buttonHeight: 57` (or `40` on compact)

### Issue: Stats not displaying

**Check:**
1. Verify tournament data has `entryFee`, `totalEntries`, `firstPlacePrize`
2. Check console for errors
3. Verify StatItem component is rendering

---

## 📈 Performance Testing

### Chrome DevTools Performance Tab

1. Open **Performance** tab
2. Click **Record** (circle icon)
3. Trigger viewport change (resize window)
4. Stop recording
5. **Check**: Look for "Layout" events
   - **Expected**: Minimal or no Layout events
   - **Bad**: Many Layout events = layout thrashing

### Layout Shift Measurement

The test script automatically measures shifts. Look for:

- ✅ **< 1px**: Excellent (stable)
- ⚠️ **1-5px**: Acceptable (minor shifts)
- ❌ **> 5px**: Problem (significant shifts)

---

## ✅ Success Criteria

### Code Implementation
- [x] New component created
- [x] Main component updated
- [x] CSS overrides updated
- [x] No linter errors

### Runtime Testing (Your Task)
- [ ] No layout shifts on viewport changes
- [ ] Visual match with original
- [ ] All functionality works
- [ ] CSS Grid properties verified
- [ ] Button dimensions correct
- [ ] Stats display correctly

---

## 📝 Test Results Template

After testing, document results:

```markdown
## Test Results - [Date]

### Environment
- Browser: Chrome/Safari/Firefox [version]
- Device: Desktop/Mobile [model]
- Viewport: [width]x[height]

### Layout Stability
- Viewport Resize: ✅/❌ (shift: Xpx)
- DevTools Toggle: ✅/❌ (shift: Xpx)
- Mobile Address Bar: ✅/❌ (shift: Xpx)

### Component Verification
- Bottom Section: ✅/❌
- CSS Grid: ✅/❌
- Button: ✅/❌
- Progress: ✅/❌
- Stats: ✅/❌

### Functionality
- Button Click: ✅/❌
- Keyboard Nav: ✅/❌
- ARIA Labels: ✅/❌

### Issues Found
- [List any issues]

### Overall Status
✅ PASS / ❌ FAIL
```

---

## 🎯 Next Steps

1. **Run Tests**: Follow steps above
2. **Document Results**: Use template above
3. **Report Issues**: If any shifts > 1px, document them
4. **Verify Visual Match**: Compare screenshots
5. **Test on Multiple Devices**: Desktop, mobile, tablet

---

**Ready to test!** Start with Step 1 above. 🚀
