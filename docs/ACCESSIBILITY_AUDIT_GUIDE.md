# Accessibility Audit Guide

**Last Updated:** January 2025  
**Status:** Audit guide created, ready for implementation

---

## Overview

This guide provides a comprehensive approach to auditing and improving accessibility (a11y) for the BestBall platform. The goal is WCAG 2.1 AA compliance to ensure the platform is accessible to all users.

---

## Why Accessibility Matters

- **Legal Compliance:** WCAG 2.1 AA is required in many jurisdictions
- **Broader Audience:** 15% of the world's population has some form of disability
- **Better UX:** Accessible design improves usability for everyone
- **SEO Benefits:** Accessible sites rank better in search engines

---

## WCAG 2.1 AA Requirements

### Perceivable

1. **Text Alternatives**
   - All images have alt text
   - Icons have aria-labels
   - Decorative images are marked as such

2. **Time-based Media**
   - Videos have captions
   - Audio has transcripts
   - No auto-playing audio

3. **Adaptable**
   - Content can be presented in different ways
   - Information isn't conveyed by color alone
   - Text can be resized up to 200%

4. **Distinguishable**
   - Color contrast ratio ≥ 4.5:1 for text
   - Color contrast ratio ≥ 3:1 for UI components
   - Text spacing can be adjusted

### Operable

5. **Keyboard Accessible**
   - All functionality available via keyboard
   - No keyboard traps
   - Focus indicators visible

6. **Enough Time**
   - Users can extend time limits
   - No auto-updating content without pause/stop
   - Draft timers can be paused (if applicable)

7. **Seizures and Physical Reactions**
   - No content flashes more than 3 times per second

8. **Navigable**
   - Clear page titles
   - Focus order is logical
   - Multiple ways to navigate
   - Headings and labels are descriptive

### Understandable

9. **Readable**
   - Language of page is identified
   - Unusual words are defined
   - Abbreviations are explained

10. **Predictable**
    - Navigation is consistent
    - Components with same functionality are identified consistently
    - Changes of context are initiated by user

11. **Input Assistance**
    - Errors are identified and described
    - Labels and instructions are provided
    - Error suggestions are provided
    - Legal/financial data can be reviewed before submission

### Robust

12. **Compatible**
    - Valid HTML
    - Proper use of ARIA attributes
    - Screen reader compatibility

---

## Audit Tools

### Automated Tools

1. **axe DevTools** (Recommended)
   - Browser extension
   - Free and open source
   - Comprehensive rule set
   - **Install:** Chrome/Edge extension store

2. **WAVE** (Web Accessibility Evaluation Tool)
   - Browser extension
   - Visual indicators
   - Free
   - **Install:** Chrome/Edge extension store

3. **Lighthouse** (Built into Chrome DevTools)
   - Accessibility audit included
   - Performance + accessibility
   - **Access:** Chrome DevTools → Lighthouse tab

4. **Pa11y** (Command-line tool)
   - Automated testing
   - CI/CD integration
   - **Install:** `npm install -g pa11y`

### Manual Testing

1. **Keyboard Navigation**
   - Tab through entire page
   - Verify all interactive elements are reachable
   - Check focus indicators are visible
   - Test with Enter/Space for buttons

2. **Screen Reader Testing**
   - **NVDA** (Windows, free)
   - **JAWS** (Windows, paid)
   - **VoiceOver** (macOS/iOS, built-in)
   - **TalkBack** (Android, built-in)

3. **Color Contrast**
   - Use contrast checker tools
   - Test with color blindness simulators
   - Verify information isn't color-only

---

## Audit Checklist

### Critical Pages to Audit

- [ ] Homepage
- [ ] Draft room
- [ ] User signup/login
- [ ] Payment flow
- [ ] User profile/settings
- [ ] Tournament pages
- [ ] Player search/filter

### Per Page Checklist

#### Images and Media
- [ ] All images have alt text
- [ ] Decorative images have empty alt (`alt=""`)
- [ ] Icons have aria-labels
- [ ] Videos have captions (if applicable)
- [ ] No auto-playing media

#### Forms
- [ ] All inputs have labels
- [ ] Error messages are associated with inputs
- [ ] Required fields are marked
- [ ] Form validation is clear
- [ ] Submit buttons are accessible

#### Navigation
- [ ] Skip links for main content
- [ ] Logical heading hierarchy (h1 → h2 → h3)
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works
- [ ] No keyboard traps

#### Color and Contrast
- [ ] Text contrast ≥ 4.5:1
- [ ] UI component contrast ≥ 3:1
- [ ] Information not conveyed by color alone
- [ ] Color blindness tested

#### Interactive Elements
- [ ] Buttons have accessible names
- [ ] Links have descriptive text (not "click here")
- [ ] Focus states are visible
- [ ] Hover states don't hide information
- [ ] Touch targets ≥ 44x44px (mobile)

#### ARIA and Semantics
- [ ] Proper HTML5 semantic elements
- [ ] ARIA labels where needed
- [ ] ARIA live regions for dynamic content
- [ ] Roles are used correctly
- [ ] No redundant ARIA

#### Content
- [ ] Page titles are descriptive
- [ ] Language is declared (`lang` attribute)
- [ ] Abbreviations are explained
- [ ] Content is readable (grade level)

---

## Common Issues and Fixes

### Issue 1: Missing Alt Text

**Problem:**
```html
<img src="player.jpg" />
```

**Fix:**
```html
<img src="player.jpg" alt="Josh Allen, Quarterback, Buffalo Bills" />
```

### Issue 2: Color-Only Information

**Problem:**
```html
<span style="color: red;">Error: Invalid input</span>
```

**Fix:**
```html
<span style="color: red;" aria-label="Error">
  <span aria-hidden="true">⚠️</span>
  Error: Invalid input
</span>
```

### Issue 3: Missing Labels

**Problem:**
```html
<input type="text" name="username" />
```

**Fix:**
```html
<label for="username">Username</label>
<input type="text" id="username" name="username" />
```

### Issue 4: Poor Focus Indicators

**Problem:**
```css
button:focus {
  outline: none; /* Removes focus indicator */
}
```

**Fix:**
```css
button:focus {
  outline: 2px solid #4285F4;
  outline-offset: 2px;
}
```

### Issue 5: Missing ARIA Labels

**Problem:**
```html
<button>
  <svg>...</svg>
</button>
```

**Fix:**
```html
<button aria-label="Close modal">
  <svg aria-hidden="true">...</svg>
</button>
```

### Issue 6: Keyboard Traps

**Problem:**
Modal that can't be closed with Escape key.

**Fix:**
```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

---

## Implementation Plan

### Phase 1: Automated Audit (Week 1)

1. **Install Tools**
   ```bash
   # Install Pa11y for CI/CD
   npm install --save-dev pa11y
   ```

2. **Run Automated Audit**
   - Use axe DevTools on all critical pages
   - Document all issues found
   - Prioritize by severity

3. **Create Issues**
   - Create GitHub issues for each category
   - Label by priority (P0, P1, P2)
   - Assign to appropriate team members

### Phase 2: Manual Testing (Week 2)

1. **Keyboard Navigation**
   - Test all pages with keyboard only
   - Document keyboard traps
   - Verify focus indicators

2. **Screen Reader Testing**
   - Test with NVDA/VoiceOver
   - Verify all content is announced
   - Check ARIA labels work

3. **Color Contrast**
   - Test all text/background combinations
   - Use contrast checker tools
   - Fix low contrast issues

### Phase 3: Fixes (Week 3-4)

1. **Critical Issues (P0)**
   - Missing alt text
   - Keyboard traps
   - Missing labels
   - Focus indicators

2. **High Priority (P1)**
   - Color contrast
   - ARIA improvements
   - Semantic HTML

3. **Medium Priority (P2)**
   - Content improvements
   - Documentation
   - Testing

### Phase 4: Verification (Week 5)

1. **Re-run Automated Audit**
   - Verify all issues fixed
   - Check Lighthouse scores

2. **Manual Testing**
   - Re-test with screen readers
   - Verify keyboard navigation
   - Test with users (if possible)

3. **Documentation**
   - Update accessibility statement
   - Document testing process
   - Create maintenance plan

---

## Testing Checklist

### Automated Testing

```bash
# Run Pa11y on critical pages
pa11y https://your-domain.com/
pa11y https://your-domain.com/draft/room123
pa11y https://your-domain.com/signup
```

### Manual Testing

1. **Keyboard Navigation**
   - [ ] Tab through entire page
   - [ ] All interactive elements reachable
   - [ ] Focus indicators visible
   - [ ] No keyboard traps
   - [ ] Escape closes modals

2. **Screen Reader**
   - [ ] All content announced
   - [ ] Navigation is clear
   - [ ] Forms are understandable
   - [ ] Error messages are clear

3. **Visual**
   - [ ] Text is readable
   - [ ] Contrast is sufficient
   - [ ] Information not color-only
   - [ ] Text can be resized

---

## Maintenance

### Ongoing

1. **Automated Testing**
   - Add Pa11y to CI/CD pipeline
   - Run on every PR
   - Fail builds on critical issues

2. **Code Reviews**
   - Check for accessibility in PRs
   - Use accessibility checklist
   - Test with keyboard

3. **User Feedback**
   - Monitor accessibility complaints
   - Test with real users
   - Iterate based on feedback

### Quarterly

1. **Full Audit**
   - Run complete audit
   - Update documentation
   - Fix new issues

2. **Tool Updates**
   - Update audit tools
   - Check for new WCAG guidelines
   - Review best practices

---

## Resources

### Tools
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **WAVE:** https://wave.webaim.org/
- **Lighthouse:** Built into Chrome DevTools
- **Pa11y:** https://pa11y.org/

### Documentation
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices:** https://www.w3.org/WAI/ARIA/apg/
- **WebAIM:** https://webaim.org/

### Testing Tools
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **Screen Reader Testing:** NVDA, JAWS, VoiceOver
- **Keyboard Testing:** Built into browsers

---

## Next Steps

1. **Install Audit Tools**
   - Install axe DevTools browser extension
   - Install WAVE browser extension

2. **Run Initial Audit**
   - Audit homepage
   - Audit draft room
   - Document all issues

3. **Prioritize Fixes**
   - Create GitHub issues
   - Assign priorities
   - Plan implementation

4. **Start Fixing**
   - Begin with critical issues
   - Test as you go
   - Document changes

---

**Last Updated:** January 2025  
**Status:** Ready for implementation  
**Next Review:** After initial audit
