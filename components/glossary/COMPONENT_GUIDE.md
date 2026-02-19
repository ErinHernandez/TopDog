# TopDog Glossary UI Components

Complete suite of React components for the TopDog Glossary system. All components follow the dark theme aesthetic with blues and grays, utilizing CSS Modules for scoped styling.

## Components Overview

### 1. GlossaryLayout
**Files:** `GlossaryLayout.tsx` + `GlossaryLayout.module.css`

Main layout wrapper providing a two-column design with sidebar navigation and main content area.

**Features:**
- Sidebar with module navigation (9 modules)
- Main content scrollable area
- Dark theme with border separation
- Responsive design (vertical stack on mobile)
- Module selection callbacks

**Props:**
```typescript
interface GlossaryLayoutProps {
  children: ReactNode;
  activeModule?: ModuleId;
  onModuleSelect?: (moduleId: ModuleId) => void;
}
```

**Usage:**
```tsx
<GlossaryLayout activeModule="draft-room" onModuleSelect={handleModuleChange}>
  <YourContent />
</GlossaryLayout>
```

---

### 2. ElementCard
**Files:** `ElementCard.tsx` + `ElementCard.module.css`

Preview card for displaying individual glossary elements in a list view.

**Features:**
- Element name, ID, and module badge
- Element type badge with color coding
- Interactive status indicator (with pulse animation)
- Hover preview with description, tags, tech debt, and states
- Keyboard accessible (Enter/Space to select)
- Selected state styling

**Props:**
```typescript
interface ElementCardProps {
  element: GlossaryElement;
  onClick?: () => void;
  isSelected?: boolean;
}
```

**Usage:**
```tsx
<ElementCard
  element={glossaryElement}
  onClick={() => navigate(`/glossary/${element.id}`)}
  isSelected={activeElementId === element.id}
/>
```

---

### 3. SearchBar
**Files:** `SearchBar.tsx` + `SearchBar.module.css`

Debounced search input with keyboard shortcuts and clear functionality.

**Features:**
- Debounced search (300ms default)
- Clear button (shows when text entered)
- Keyboard shortcut hint (Cmd+K / Ctrl+K)
- Focus states and visual feedback
- Accessible SVG icons
- Responsive design

**Props:**
```typescript
interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  value?: string;
  debounceMs?: number;
}
```

**Usage:**
```tsx
<SearchBar
  onSearch={handleSearch}
  placeholder="Search elements..."
  debounceMs={300}
/>
```

**Keyboard Shortcuts:**
- `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) - Focus search
- `Esc` - Clear search

---

### 4. FilterPanel
**Files:** `FilterPanel.tsx` + `FilterPanel.module.css`

Expandable filter panel with multiple filtering options.

**Features:**
- Collapsible filter header with active filter count badge
- Module selector (dropdown-style buttons)
- Element type multi-select grid (16 types)
- Interactive-only toggle
- Clear all filters button
- Visual feedback for active filters
- Responsive grid layout

**Props:**
```typescript
interface FilterPanelProps {
  onFilterChange?: (filters: GlossaryFilters) => void;
  filters?: GlossaryFilters;
}
```

**Usage:**
```tsx
<FilterPanel
  filters={activeFilters}
  onFilterChange={handleFilterChange}
/>
```

**Supported Filters:**
- Module (one at a time)
- Element Type (multi-select)
- Interactive status (toggle)

---

### 5. WireframeElement & WireframeContainer
**Files:** `WireframeElement.tsx` + `WireframeElement.module.css`

Wireframe placeholder components for visual representation of UI elements.

**Features (WireframeElement):**
- Dashed border (2px) with rounded corners
- Three variants: default, highlight, sibling
- Dimension display on hover (e.g., "240 x 120")
- Optional label tooltip
- Corner markers appear on hover
- Interactive mode with click handling
- Absolute positioning with custom bounds

**Features (WireframeContainer):**
- Wrapper for displaying multiple wireframe elements
- Container-level label on hover
- Relative positioning context

**Props:**
```typescript
interface WireframeElementProps {
  bounds: Bounds; // { x, y, width, height }
  label?: string;
  variant?: 'default' | 'highlight' | 'sibling';
  onClick?: () => void;
  interactive?: boolean;
}

interface WireframeContainerProps {
  children: React.ReactNode;
  containerBounds?: Bounds;
  label?: string;
}
```

**Usage:**
```tsx
<WireframeContainer containerBounds={{ x: 0, y: 0, width: 500, height: 300 }}>
  <WireframeElement
    bounds={{ x: 10, y: 10, width: 100, height: 80 }}
    label="Header"
    variant="highlight"
    interactive
    onClick={handleClick}
  />
  <WireframeElement
    bounds={{ x: 10, y: 100, width: 480, height: 190 }}
    label="Content"
    variant="default"
  />
</WireframeContainer>
```

**Variants:**
- `default` - Standard dashed border with subtle background
- `highlight` - Thick border with primary color, increased background opacity
- `sibling` - Gray styling for context/non-focused elements

---

## Styling Architecture

### Design Tokens
All components use CSS custom properties from `/styles/tokens.css`:

**Colors:**
- `--bg-primary` (#101927) - Main background
- `--bg-secondary` (#1f2937) - Secondary background
- `--bg-card` (#1f2833) - Card backgrounds
- `--text-primary` (#ffffff) - Primary text
- `--text-secondary` (#9ca3af) - Secondary text
- `--color-brand-primary` (#2DE2C5) - Teal accent
- `--color-blue-bg` (#1DA1F2) - Blue accent
- `--border-default` - Border color with opacity

**Spacing (px):**
- `--spacing-xs` (4px)
- `--spacing-sm` (8px)
- `--spacing-md` (12px)
- `--spacing-lg` (16px)
- `--spacing-xl` (24px)

**Radius:**
- `--radius-sm` (4px)
- `--radius-md` (8px)
- `--radius-lg` (12px)

**Transitions:**
- `--transition-normal` (150ms ease)
- `--transition-fast` (75ms ease)
- `--transition-slow` (300ms ease)

### CSS Modules
Each component has a corresponding `.module.css` file with:
- Scoped class names (no global pollution)
- Comprehensive hover/focus/active states
- Responsive breakpoints (768px)
- Smooth transitions and animations
- Accessibility features (focus rings, outline management)

---

## TypeScript Integration

All components import types from `@/lib/glossary/types`:

**Key Types Used:**
- `ModuleId` - 9 module identifiers
- `ElementType` - 16 element type categories
- `GlossaryElement` - Full element definition
- `GlossaryFilters` - Filter specifications
- `Bounds` - Position and size object

---

## Responsive Design

All components are mobile-responsive:

**Tablet/Desktop (>768px):**
- Full sidebar navigation
- Multi-column grids (SearchBar shortcuts visible)
- Standard spacing and padding

**Mobile (<768px):**
- Horizontal scroll navigation
- Single-column layouts
- Reduced padding and font sizes
- Hidden keyboard shortcut hints

---

## Accessibility Features

- **Keyboard Navigation:**
  - All buttons/interactive elements accessible via Tab
  - Enter/Space to activate buttons
  - Escape to clear/close
  - Focus rings visible on all interactive elements

- **ARIA Labels:**
  - Clear button with aria-label
  - Role attributes on wireframe elements
  - Semantic HTML (buttons, labels, inputs)

- **Color Contrast:**
  - Text meets WCAG AA standards
  - Color not sole indicator (badges have text)
  - Focus states use borders + colors

- **Screen Readers:**
  - Meaningful alt text for SVG icons
  - Label associations on form inputs
  - Semantic heading hierarchy

---

## Animation & Transitions

**Smooth Interactions:**
- Card hover lift (2px translateY)
- Smooth border/background color transitions
- Fade-in animations for tooltips
- Pulse animation for interactive indicators
- Expand/collapse animations for filter panel

**Performance:**
- Uses CSS transitions (GPU accelerated)
- No JavaScript animations
- Debounced search (prevents excessive calls)

---

## Usage Example

Complete page implementation:

```tsx
import {
  GlossaryLayout,
  ElementCard,
  SearchBar,
  FilterPanel,
  WireframeElement,
} from '@/components/glossary';
import type { GlossaryElement, GlossaryFilters } from '@/lib/glossary/types';

export function GlossaryPage() {
  const [activeModule, setActiveModule] = useState<ModuleId>('draft-room');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<GlossaryFilters>({});
  const [elements, setElements] = useState<GlossaryElement[]>([]);

  // Fetch and filter elements
  const filteredElements = elements.filter(el => {
    const matchesSearch =
      el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = !filters.module || el.module === filters.module;
    const matchesType = !filters.elementType || el.elementType === filters.elementType;
    const matchesInteractive = filters.isInteractive === undefined ||
      el.isInteractive === filters.isInteractive;

    return matchesSearch && matchesModule && matchesType && matchesInteractive;
  });

  return (
    <GlossaryLayout
      activeModule={activeModule}
      onModuleSelect={setActiveModule}
    >
      <div style={{ padding: '0 24px' }}>
        <h1>Glossary</h1>

        <SearchBar
          value={searchQuery}
          onSearch={setSearchQuery}
          placeholder="Search elements by name or ID..."
        />

        <FilterPanel
          filters={filters}
          onFilterChange={setFilters}
        />

        <div style={{ display: 'grid', gap: '12px', marginTop: '24px' }}>
          {filteredElements.map(element => (
            <ElementCard
              key={element.id}
              element={element}
              onClick={() => navigate(`/glossary/${element.id}`)}
            />
          ))}
        </div>
      </div>
    </GlossaryLayout>
  );
}
```

---

## File Structure

```
components/glossary/
├── GlossaryLayout.tsx
├── GlossaryLayout.module.css
├── ElementCard.tsx
├── ElementCard.module.css
├── SearchBar.tsx
├── SearchBar.module.css
├── FilterPanel.tsx
├── FilterPanel.module.css
├── WireframeElement.tsx
├── WireframeElement.module.css
├── index.ts
└── COMPONENT_GUIDE.md (this file)
```

---

## Total Lines of Code

- TypeScript: ~900 lines
- CSS Modules: ~1,500 lines
- Total: ~2,400 lines of production-ready code

---

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

Requires CSS Custom Properties support (modern evergreen browsers only).

---

## Notes

1. All components are fully typed with TypeScript
2. No external dependencies beyond React
3. CSS Modules prevent style conflicts
4. Keyboard accessible and screen reader compatible
5. Dark theme with high contrast meets WCAG standards
6. Smooth animations and transitions for better UX
7. Responsive design supports all screen sizes
8. Components are composable and can be used independently
