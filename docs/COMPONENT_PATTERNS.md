# Component Patterns - VX2 Standard

**Date:** January 2025  
**Status:** Phase 4 - Component Standardization  
**Reference:** TOPDOG_MASTER_REFACTORING_PLAN.md

---

## File Structure

### VX2 Feature Components

```
components/vx2/[feature]/
├── components/
│   └── FeatureComponent.tsx
├── hooks/
│   └── useFeature.ts
├── context/
│   └── FeatureContext.tsx
├── types.ts
└── index.ts
```

### Shared UI Components

```
components/ui/                    # NEW: Shared UI components
├── button/
│   ├── Button.tsx
│   └── index.ts
├── modal/
│   ├── Modal.tsx
│   └── index.ts
├── card/
│   ├── Card.tsx
│   └── index.ts
├── input/
│   ├── Input.tsx
│   ├── SearchInput.tsx
│   └── index.ts
├── feedback/
│   ├── LoadingSpinner.tsx
│   ├── ErrorDisplay.tsx
│   ├── EmptyState.tsx
│   └── index.ts
└── index.ts
```

---

## Form validation (inline errors)

When a form shows **inline** validation messages under a field (e.g. “Please enter a valid email”):

- Show the message **only after the user leaves the field (blur)**.
- Hide the message **while the field is focused**.

**Reference:** [FORM_VALIDATION_PATTERN.md](./FORM_VALIDATION_PATTERN.md) — use this logic everywhere similar inline validation appears.

---

## Component Template

```typescript
/**
 * ComponentName - Brief description
 * 
 * Detailed description of what this component does.
 * 
 * @example
 * ```tsx
 * <ComponentName prop1="value" prop2={123} />
 * ```
 */

import React from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';

// ============================================================================
// TYPES
// ============================================================================

export interface ComponentNameProps {
  /** Required prop description */
  requiredProp: string;
  /** Optional prop description */
  optionalProp?: number;
  /** Additional className */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ComponentName({
  requiredProp,
  optionalProp = 0,
  className = '',
}: ComponentNameProps): React.ReactElement {
  return (
    <div
      className={className}
      style={{
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: BG_COLORS.primary,
        color: TEXT_COLORS.primary,
      }}
    >
      {/* Implementation */}
    </div>
  );
}

export default ComponentName;
```

---

## Hook Template

```typescript
/**
 * useFeature - Hook description
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, doAction } = useFeature({ id: '123' });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================================================
// TYPES
// ============================================================================

export interface UseFeatureOptions {
  /** Feature ID */
  id: string;
  /** Optional configuration */
  enabled?: boolean;
}

export interface UseFeatureResult {
  /** Feature data */
  data: FeatureData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Actions */
  actions: {
    doAction: () => Promise<void>;
    reset: () => void;
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useFeature({
  id,
  enabled = true,
}: UseFeatureOptions): UseFeatureResult {
  const [data, setData] = useState<FeatureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !id) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'collection', id),
      (snapshot) => {
        setData(snapshot.data() as FeatureData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [id, enabled]);

  const doAction = useCallback(async () => {
    // Implementation
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(true);
  }, []);

  return {
    data,
    isLoading,
    error,
    actions: { doAction, reset },
  };
}

export default useFeature;
```

---

## Context Template

```typescript
/**
 * FeatureContext - Context description
 */

import { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureContextValue {
  value: string;
  setValue: (newValue: string) => void;
  reset: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const FeatureContext = createContext<FeatureContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function FeatureProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [value, setValue] = useState('');

  const reset = () => {
    setValue('');
  };

  return (
    <FeatureContext.Provider value={{ value, setValue, reset }}>
      {children}
    </FeatureContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useFeatureContext(): FeatureContextValue {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatureContext must be used within FeatureProvider');
  }
  return context;
}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` prefix | `useUserProfile.ts` |
| Contexts | PascalCase with `Context` suffix | `UserContext.tsx` |
| Types | PascalCase | `UserProfileProps` |
| Files | Match export name | `UserProfile.tsx` exports `UserProfile` |
| Directories | kebab-case | `user-profile/` |

---

## Constants Usage

**Always use VX2 constants:**

```typescript
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
```

**Never hardcode:**
- ❌ `padding: '16px'` → ✅ `padding: SPACING.md`
- ❌ `color: '#ffffff'` → ✅ `color: TEXT_COLORS.primary`
- ❌ `borderRadius: '8px'` → ✅ `borderRadius: RADIUS.md`

---

## State Management Pattern

**Use Context + hooks, not Redux:**

```typescript
// ✅ Good: Context + hooks
const { user, updateUser } = useAuth();

// ❌ Bad: Redux (deprecated)
const user = useSelector(state => state.user);
```

---

## Loading/Error/Empty States

**Always handle all states:**

```typescript
export function MyComponent({ id }: MyComponentProps) {
  const { data, isLoading, error } = useFeatureData({ id });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState message="No data found" />;

  return <div>{/* Render data */}</div>;
}
```

---

## TypeScript Requirements

**All components must:**
- ✅ Use TypeScript (`.tsx` files)
- ✅ Export prop interfaces
- ✅ Use strict types (no `any`)
- ✅ Include JSDoc comments

---

## Accessibility Requirements

**All interactive components must:**
- ✅ Include `aria-label` or `aria-labelledby`
- ✅ Support keyboard navigation
- ✅ Have proper focus management
- ✅ Use semantic HTML

---

## Testing Pattern

```typescript
// __tests__/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop1="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

---

**Last Updated:** January 2025
