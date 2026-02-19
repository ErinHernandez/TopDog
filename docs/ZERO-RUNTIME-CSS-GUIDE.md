# Zero-Runtime CSS Guide

> **⛔ STOP — READ THIS FIRST**
>
> This is an **active architectural requirement**, not a completed project. Every line of CSS you write must follow these rules. One violation breaks CSP compliance for the entire app.

**Last Updated:** January 2026

---

## ⛔ HARD RULES

These are non-negotiable. Violating any of these will fail PR review.

### 1. NO static inline styles
```tsx
// ❌ FORBIDDEN — breaks CSP
<div style={{ color: 'red', padding: '16px' }}>

// ✅ REQUIRED — use CSS modules
<div className={styles.container}>
```

### 2. NO JavaScript color/style constants in components
```tsx
// ❌ FORBIDDEN — do not import these in components
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../core/constants/sizes';

// ✅ REQUIRED — use CSS custom properties in .module.css files
.container {
  background-color: var(--bg-primary);
  color: var(--text-secondary);
}
```

### 3. Dynamic values MUST use CSS custom properties
```tsx
// ❌ FORBIDDEN — inline style with literal value
<div style={{ width: `${percentage}%` }}>

// ✅ REQUIRED — CSS custom property pattern
<div
  className={styles.progressBar}
  style={{ '--progress-width': `${percentage}%` } as React.CSSProperties}
/>
```
```css
.progressBar {
  width: var(--progress-width, 0%);
}
```

### 4. State-based styling uses data attributes, NOT inline styles
```tsx
// ❌ FORBIDDEN
<div style={{ color: status === 'error' ? 'red' : 'green' }}>

// ✅ REQUIRED
<div className={styles.badge} data-severity={status}>
```
```css
.badge[data-severity="error"] { color: var(--color-state-error); }
.badge[data-severity="success"] { color: var(--color-state-success); }
```

### 5. All styling lives in CSS Modules
Every component that needs styling must have a corresponding `.module.css` file.

### 6. NO `:root` in CSS Modules
```css
/* ❌ FORBIDDEN — CSS Modules require "pure" selectors */
:root {
  --my-var: value;
}

/* ✅ Use global tokens from /styles/tokens.css instead */
/* Or define on local class if component-specific */
.container {
  --my-var: value;
}
```

---

## ✅ CORRECT PATTERNS

### Basic Component Structure

```tsx
// MyComponent.tsx
import styles from './MyComponent.module.css';

export function MyComponent() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Title</h2>
      <p className={styles.description}>Description</p>
    </div>
  );
}
```

```css
/* MyComponent.module.css */
.container {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.title {
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}
```

### Dynamic Values (Runtime-Calculated)

When a value comes from JavaScript (percentage, calculated width, etc.):

```tsx
<div
  className={styles.progressBar}
  style={{ '--progress-width': `${percentage}%` } as React.CSSProperties}
/>
```

```css
.progressBar {
  width: var(--progress-width, 0%);
  height: 8px;
  background-color: var(--color-state-active);
  border-radius: var(--radius-full);
}
```

### State-Based Styling (Conditional Colors)

Use `data-*` attributes for state variations:

```tsx
<div className={styles.badge} data-severity={status}>
  {message}
</div>
```

```css
.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.badge[data-severity="error"] {
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--color-state-error);
}

.badge[data-severity="success"] {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--color-state-success);
}

.badge[data-severity="warning"] {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--color-state-warning);
}
```

### Position Colors (Fantasy Sports)

```tsx
<span className={styles.position} data-position={position.toLowerCase()}>
  {position}
</span>
```

```css
.position[data-position="qb"] { color: var(--color-position-qb); }
.position[data-position="rb"] { color: var(--color-position-rb); }
.position[data-position="wr"] { color: var(--color-position-wr); }
.position[data-position="te"] { color: var(--color-position-te); }
```

### Conditional Classes

Use the `cn()` utility for combining classes:

```tsx
import { cn } from '@/lib/utils';

<button className={cn(
  styles.button,
  isActive && styles.buttonActive,
  isDisabled && styles.buttonDisabled
)}>
  Click me
</button>
```

---

## 📖 TOKEN REFERENCE

All tokens are defined in `/styles/tokens.css` and available globally.

### Colors

| Token | Usage |
|-------|-------|
| `--bg-primary` | Main background |
| `--bg-secondary` | Cards, elevated surfaces |
| `--bg-tertiary` | Nested containers, inputs |
| `--text-primary` | Main content text |
| `--text-secondary` | Secondary text, descriptions |
| `--text-muted` | Hints, placeholders |
| `--text-disabled` | Disabled state text |
| `--border-default` | Standard borders |
| `--border-light` | Subtle borders |

### State Colors

| Token | Usage |
|-------|-------|
| `--color-state-active` | Primary action, selected states |
| `--color-state-success` | Success messages |
| `--color-state-error` | Error states, destructive actions |
| `--color-state-warning` | Warnings |
| `--color-state-info` | Informational messages |

### Position Colors

| Token | Position |
|-------|----------|
| `--color-position-qb` | Quarterback |
| `--color-position-rb` | Running Back |
| `--color-position-wr` | Wide Receiver |
| `--color-position-te` | Tight End |

### Spacing

| Token | Value |
|-------|-------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 12px |
| `--spacing-lg` | 16px |
| `--spacing-xl` | 20px |
| `--spacing-2xl` | 24px |
| `--spacing-3xl` | 32px |

### Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-full` | 9999px |

### Typography

| Token | Value |
|-------|-------|
| `--font-size-xs` | 12px |
| `--font-size-sm` | 14px |
| `--font-size-base` | 16px |
| `--font-size-lg` | 18px |
| `--font-size-xl` | 20px |
| `--font-size-2xl` | 26px |
| `--font-weight-normal` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |
| `--line-height-tight` | 1.1 |
| `--line-height-normal` | 1.5 |

### Z-Index

| Token | Value | Usage |
|-------|-------|-------|
| `--z-dropdown` | 100 | Dropdowns, popovers |
| `--z-sticky` | 200 | Sticky headers |
| `--z-modal-backdrop` | 900 | Modal overlays |
| `--z-modal` | 1000 | Modal content |
| `--z-toast` | 1100 | Toast notifications |

---

## ❓ COMMON QUESTIONS

### Q: What if I need a color that's not in the tokens?

Add it to `/styles/tokens.css` first, then use it. Don't inline it.

### Q: Can I use Tailwind classes?

No. This codebase uses CSS Modules, not Tailwind.

### Q: What about third-party components that require inline styles?

Wrap them in a component with a CSS Module. If truly unavoidable, document why in a comment.

### Q: Why is this so strict?

CSP (Content Security Policy) compliance. One inline style forces us to add `'unsafe-inline'` to the CSP header, which defeats the security benefit entirely.

### Q: How do I use dynamic image URLs?

You can't use `url(var(...))` in CSS Modules — the build process tries to resolve URLs at compile time. Pass the full `url()` string from JavaScript:

```tsx
// ✅ CORRECT
<div
  className={styles.imageBox}
  style={{ '--bg-image': `url(${imageUrl})` } as React.CSSProperties}
/>
```

```css
.imageBox {
  background-image: var(--bg-image);
}
```

```css
/* ❌ BROKEN — build error */
.imageBox {
  background-image: url(var(--image-url));
}
```

---

## 🔄 MIGRATION REFERENCE

If you encounter old code that violates these rules, here's how to convert it:

| Old Pattern | New Pattern |
|-------------|-------------|
| `BG_COLORS.primary` | `var(--bg-primary)` |
| `TEXT_COLORS.secondary` | `var(--text-secondary)` |
| `STATE_COLORS.error` | `var(--color-state-error)` |
| `SPACING.md` | `var(--spacing-md)` |
| `RADIUS.lg` | `var(--radius-lg)` |
| `TYPOGRAPHY.fontSize.sm` | `var(--font-size-sm)` |
| `style={{ color: X }}` | `className={styles.X}` |
| `style={{ width: val }}` | `style={{ '--width': val }}` + CSS |

---

## 📜 HISTORICAL CONTEXT

> This section is for context only. You don't need to do any of this — it's already done.

In January 2026, the codebase was refactored to achieve CSP compliance:

- 188 static inline styles → 0
- All JS color constants removed from components
- 85 dynamic styles converted to CSS custom property pattern

Components refactored include: all VX2 auth components, modals, tabs, draft room, slow drafts, shared components, and navigation.

The constants files (`/components/vx2/core/constants/`) still exist for backward compatibility but should NOT be imported in new component code.

---

## 🎯 SUMMARY

1. **No inline styles** (except CSS custom properties for dynamic values)
2. **No JS color constants** in components
3. **Use CSS Modules** + design tokens from `tokens.css`
4. **Use data attributes** for state-based styling
5. **No `:root` in CSS Modules** (use global tokens or local classes)
6. **Every PR must maintain CSP compliance**

Questions? Check `/styles/tokens.css` for available tokens.
