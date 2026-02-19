# Glossary Components - Quick Start

Fast reference for using the TopDog Glossary UI components.

## Import

```typescript
import {
  GlossaryLayout,
  ElementCard,
  SearchBar,
  FilterPanel,
  WireframeElement,
  WireframeContainer,
} from '@/components/glossary';
```

## Basic Usage

### 1. Layout (Container)
```tsx
<GlossaryLayout activeModule="draft-room" onModuleSelect={setModule}>
  {/* Your content here */}
</GlossaryLayout>
```

### 2. Search
```tsx
<SearchBar
  value={query}
  onSearch={setQuery}
  placeholder="Search elements..."
/>
```

### 3. Filters
```tsx
<FilterPanel
  filters={activeFilters}
  onFilterChange={setFilters}
/>
```

### 4. Element List Items
```tsx
{elements.map(el => (
  <ElementCard
    key={el.id}
    element={el}
    onClick={() => navigate(`/glossary/${el.id}`)}
    isSelected={selected === el.id}
  />
))}
```

### 5. Wireframes
```tsx
<WireframeContainer containerBounds={{ x: 0, y: 0, width: 500, height: 400 }}>
  <WireframeElement
    bounds={{ x: 20, y: 20, width: 100, height: 50 }}
    label="Button"
    variant="highlight"
  />
  <WireframeElement
    bounds={{ x: 140, y: 20, width: 340, height: 50 }}
    label="Title"
    variant="default"
  />
</WireframeContainer>
```

## Variants

**WireframeElement variants:**
- `default` - Standard outline
- `highlight` - Bright border, emphasized
- `sibling` - Gray, de-emphasized

## Theme Colors (Auto-Applied)

All components automatically use:
- Dark backgrounds (#101927, #1f2937)
- Light text (#ffffff)
- Teal accents (#2DE2C5)
- Blue accents (#1DA1F2)

No theme configuration needed - just import and use!

## Keyboard Shortcuts

- **Search:** Cmd+K (Mac) / Ctrl+K (Windows)
- **Clear Search:** Esc
- **Select Item:** Enter / Space
- **Focus:** Tab

## Props Reference

### GlossaryLayout
```ts
interface GlossaryLayoutProps {
  children: ReactNode;
  activeModule?: ModuleId;
  onModuleSelect?: (moduleId: ModuleId) => void;
}
```

### ElementCard
```ts
interface ElementCardProps {
  element: GlossaryElement;
  onClick?: () => void;
  isSelected?: boolean;
}
```

### SearchBar
```ts
interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  value?: string;
  debounceMs?: number;
}
```

### FilterPanel
```ts
interface FilterPanelProps {
  onFilterChange?: (filters: GlossaryFilters) => void;
  filters?: GlossaryFilters;
}
```

### WireframeElement
```ts
interface WireframeElementProps {
  bounds: Bounds;
  label?: string;
  variant?: 'default' | 'highlight' | 'sibling';
  onClick?: () => void;
  interactive?: boolean;
}
```

## Available Modules

1. `draft-room` - Draft Room
2. `lobby` - Lobby/Home
3. `my-teams` - My Teams
4. `live-slow-drafts` - Live/Slow Drafts
5. `auth` - Authentication
6. `settings` - Settings/Profile
7. `payments` - Payments
8. `onboarding` - Onboarding
9. `navigation-shell` - Navigation Shell

## Element Types

button | input | text | icon | container | card | list | modal | tab | badge | toggle | slider | dropdown | image | indicator | divider

## File Locations

- **Components:** `/components/glossary/*.tsx`
- **Styles:** `/components/glossary/*.module.css`
- **Types:** `/lib/glossary/types.ts`
- **Tokens:** `/styles/tokens.css`

## Common Patterns

### Filtered List
```tsx
const filtered = elements.filter(el => {
  if (filters.module && el.module !== filters.module) return false;
  if (filters.elementType && el.elementType !== filters.elementType) return false;
  if (filters.isInteractive && !el.isInteractive) return false;
  if (search && !el.name.toLowerCase().includes(search.toLowerCase())) return false;
  return true;
});
```

### With Navigation
```tsx
const navigate = useNavigate();

<ElementCard
  element={element}
  onClick={() => navigate(`/glossary/${element.id}`)}
/>
```

### With State
```tsx
const [activeModule, setActiveModule] = useState<ModuleId>('draft-room');
const [filters, setFilters] = useState<GlossaryFilters>({});
const [search, setSearch] = useState('');
```

## Styling Customization

Override via CSS:
```css
/* Change primary accent color */
:root {
  --color-brand-primary: #your-color;
}

/* Change spacing */
:root {
  --spacing-lg: 20px;
}
```

Most styling is controlled via CSS custom properties in `/styles/tokens.css`.

## TypeScript Types

Import from `@/lib/glossary/types`:
```ts
import type {
  ModuleId,
  ElementType,
  GlossaryElement,
  GlossaryFilters,
  Bounds,
} from '@/lib/glossary/types';
```

## Mobile Responsive

All components are fully responsive. They stack vertically on screens < 768px.

## Accessibility

- Keyboard navigable (Tab, Enter, Space, Esc)
- Screen reader compatible
- WCAG AA contrast ratios
- Focus visible on all interactive elements

## Performance Notes

- SearchBar debounces by default (300ms)
- CSS animations use GPU acceleration
- No layout thrashing
- Minimal re-renders with proper memoization

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

---

For detailed documentation, see `COMPONENT_GUIDE.md`
