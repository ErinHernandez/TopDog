# TypeScript Migration Examples

**Date:** January 23, 2025  
**Purpose:** Reference examples for future migrations

---

## Migration Pattern

### Step 1: Analyze Original File
- Review props and state
- Identify dependencies
- Check for type definitions

### Step 2: Create TypeScript Version
- Rename `.js` to `.tsx`
- Add type definitions
- Type all props, state, and functions
- Add JSDoc comments

### Step 3: Verify
- Run type check
- Check linter
- Test functionality

---

## Example 1: LoadingSpinner ✅

### Before (JavaScript)
```javascript
export default function LoadingSpinner({ message = "Loading...", size = "medium" }) {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8", 
    large: "h-12 w-12"
  };
  // ...
}
```

### After (TypeScript)
```typescript
export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium' 
}: LoadingSpinnerProps): React.ReactElement {
  const sizeClasses: Record<'small' | 'medium' | 'large', string> = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };
  // ...
}
```

**Key Changes:**
- ✅ Added interface for props
- ✅ Typed return value
- ✅ Used union type for `size`
- ✅ Added JSDoc comments

---

## Example 2: Modal ✅

### Before (JavaScript)
```javascript
export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  // ...
}
```

### After (TypeScript)
```typescript
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ 
  open, 
  onClose, 
  children 
}: ModalProps): React.ReactElement | null {
  if (!open) return null;
  // ...
}
```

**Key Changes:**
- ✅ Added interface for props
- ✅ Typed return value (`React.ReactElement | null`)
- ✅ Typed callback function
- ✅ Improved accessibility (keyboard navigation, ARIA)

---

## Example 3: AuthModal ✅

### Before (JavaScript)
```javascript
export default function AuthModal({ open, onClose, onAuthSuccess }) {
  const [user, setUser] = useState(null);
  // ...
}
```

### After (TypeScript)
```typescript
export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: AuthUser) => void;
}

export default function AuthModal({ 
  open, 
  onClose, 
  onAuthSuccess 
}: AuthModalProps): React.ReactElement | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  // ...
}
```

**Key Changes:**
- ✅ Created `AuthUser` interface
- ✅ Typed state with generics
- ✅ Typed optional callback
- ✅ Improved error handling types

---

## Example 4: AppShell ✅

### Before (JavaScript)
```javascript
const AppShell = ({ 
  children, 
  title = "TopDog Fantasy Sports", 
  showSubHeader = true,
  activeTab = null,
  // ...
}) => {
  // ...
};
```

### After (TypeScript)
```typescript
export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showSubHeader?: boolean;
  activeTab?: string | null | undefined;
  className?: string;
  containerMaxWidth?: string;
}

const AppShell: React.FC<AppShellProps> = ({ 
  children, 
  title = 'TopDog Fantasy Sports',
  // ...
}): React.ReactElement => {
  // ...
};
```

**Key Changes:**
- ✅ Used `React.FC` type
- ✅ Typed all props
- ✅ Handled nullable types correctly
- ✅ Added JSDoc comments

---

## Common Patterns

### 1. Props Interface
```typescript
export interface ComponentProps {
  requiredProp: string;
  optionalProp?: number;
  callback?: (value: string) => void;
  children?: React.ReactNode;
}
```

### 2. State Typing
```typescript
// Simple state
const [value, setValue] = useState<string>('');

// Nullable state
const [user, setUser] = useState<User | null>(null);

// Complex state
const [data, setData] = useState<DataState>({
  loading: false,
  error: null,
  items: [],
});
```

### 3. Event Handlers
```typescript
// Click handler
const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
  // ...
};

// Form submit
const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
  event.preventDefault();
  // ...
};

// Input change
const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
  setValue(event.target.value);
};
```

### 4. Async Functions
```typescript
const fetchData = async (): Promise<Data> => {
  const response = await fetch('/api/data');
  return response.json();
};
```

### 5. Component Return Types
```typescript
// Always returns element
function Component(): React.ReactElement {
  return <div>...</div>;
}

// Can return null
function Component(): React.ReactElement | null {
  if (!condition) return null;
  return <div>...</div>;
}
```

---

## Migration Checklist

For each file:

- [ ] **Analysis**
  - [ ] Review current implementation
  - [ ] Identify all props and their types
  - [ ] Check dependencies
  - [ ] Find existing type definitions

- [ ] **Migration**
  - [ ] Rename `.js` to `.tsx`
  - [ ] Create props interface
  - [ ] Type all function parameters
  - [ ] Type return values
  - [ ] Type state variables
  - [ ] Type event handlers
  - [ ] Add JSDoc comments

- [ ] **Verification**
  - [ ] Run `npm run type-check`
  - [ ] Check linter errors
  - [ ] Test component functionality
  - [ ] Update imports if needed

- [ ] **Cleanup**
  - [ ] Delete old `.js` file
  - [ ] Update any imports
  - [ ] Update documentation

---

## Tips

1. **Start Simple:** Begin with components that have few dependencies
2. **Use Existing Types:** Check `lib/` and `types/` for existing type definitions
3. **Incremental:** Migrate one file at a time
4. **Test:** Verify functionality after each migration
5. **Document:** Add JSDoc comments for better IDE support

---

**Last Updated:** January 23, 2025
