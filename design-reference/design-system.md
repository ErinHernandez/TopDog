# TopDog Design System Reference

**Note:** This spec is for studio/device frames and tooling (e.g. device glow, search/input in design tools). Product UI (web app and iOS app) uses tokens in `styles/tokens.css` / `styles/tokens/_tokens.css` and `TopDog-iOS/TopDog/Core/DesignSystem/`.

Extracted from reference screenshots. All new components must use ONLY these exact values.

## Colors

### Backgrounds
- Page background: `#1a1a1a` to `#1f1f1f` (near black with subtle warmth)
- Card background: `#2a2a2a` to `#2d2d2d`
- Elevated surface: `#333333`
- Input fields: `rgba(255, 255, 255, 0.05)` with border

### Text
- Primary text: `#ffffff`
- Secondary text: `#9ca3af` (muted gray)
- Tertiary/placeholder: `#6b7280`

### Accents
- Primary blue: `#3b82f6` (links, active states)
- Device glow: `#0ea5e9` to `#38bdf8` (cyan-blue)
- Success/brand: `#04FBB9` (existing TopDog teal)

### Borders
- Default: `rgba(255, 255, 255, 0.1)`
- Hover: `rgba(255, 255, 255, 0.2)`
- Active/focus: `#3b82f6`

## Typography

### Font
- Primary: System UI / -apple-system / Inter
- Monospace: Monocraft (existing)

### Sizes
- Heading 1: 24px, font-weight: 600
- Heading 2: 18px, font-weight: 600
- Body: 14px, font-weight: 400
- Small: 12px, font-weight: 400
- Code: 13px, monospace

## Spacing

### Padding
- Cards: 16px
- Buttons: 12px 20px
- Inputs: 12px 16px
- Sections: 24px

### Gaps
- Between cards: 12px
- Between items: 8px
- Between sections: 24px

## Components

### Buttons (from screenshots)
- Background: `#f5f5f0` (cream/off-white)
- Text: `#1a1a1a` (near black)
- Border radius: 8px
- Height: 40px
- Padding: 12px 20px
- Font size: 14px
- Font weight: 500
- Hover: slight darken to `#e8e8e3`

### Cards
- Background: `#2a2a2a`
- Border: 1px solid `rgba(255, 255, 255, 0.1)`
- Border radius: 12px
- Padding: 16px

### Device Frames (iPhone)
- Border: 2px solid `#0ea5e9` (blue glow effect)
- Border radius: 44px (for iPhone notch area)
- Box shadow: `0 0 20px rgba(14, 165, 233, 0.3)`
- Inner background: `#1a2332` (dark navy)

### Search/Input
- Background: `rgba(255, 255, 255, 0.05)`
- Border: 1px solid `rgba(255, 255, 255, 0.1)`
- Border radius: 8px
- Height: 48px
- Focus border: `#3b82f6`

### Dropdowns
- Background: `#2a2a2a`
- Border: 1px solid `rgba(255, 255, 255, 0.1)`
- Border radius: 8px
- Item hover: `rgba(255, 255, 255, 0.05)`

### List Items
- Border bottom: 1px solid `rgba(255, 255, 255, 0.05)`
- Padding: 16px 0
- Hover: `rgba(255, 255, 255, 0.03)`

## Icons

Using lucide-react (already in project):
- Copy, Check (for clipboard actions)
- ChevronDown, ChevronRight (for expandable sections)
- ArrowLeft (for back navigation)
- Smartphone, Monitor, Tablet (for platform indicators)

## Animations

### Transitions
- Default: 150ms ease
- Hover states: 200ms ease
- Content fade: 300ms ease-out

### Transforms
- Button hover: translateY(-1px)
- Card hover: translateY(-2px)
- Device select: scale(1.02)

## Grid Background (optional decoration)
- Pattern: 40px grid lines
- Color: `rgba(255, 255, 255, 0.03)`
