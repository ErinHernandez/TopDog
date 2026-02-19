# Draft Room V3 - Exact Visual Specifications

## Critical Design Principles
- **ZERO VISUAL CHANGES** during migration
- Preserve pixel-perfect positioning and spacing
- Maintain exact color values and gradients
- Keep all interaction behaviors identical

## Main Container Architecture

### Root Container
```css
className: "min-h-screen bg-[#101927] text-white overflow-x-auto zoom-resistant"
style: { minHeight: '1500px' }
```

### Fixed Width Container
```css
className: "zoom-stable"
style: { width: '1391px', minWidth: '1391px', maxWidth: '1391px' }
```

## Horizontal Scrolling Picks Bar

### Container
```css
style: {
  position: 'relative',
  width: '100vw',
  paddingTop: '30px',
  paddingBottom: '30px',
  backgroundColor: '#101927'
}
```

### Scrolling Content
```css
style: {
  height: '256px',
  gap: '4.5px',
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  scrollBehavior: 'smooth'
}
```

### Pick Cards
```css
style: {
  width: '158px',
  height: '70.875px',
  marginBottom: '12px'
}
```

## Fixed Positioned Elements

### On The Clock Container
```css
style: {
  position: 'absolute',
  top: '0px',
  left: '45.5px',
  width: 288,
  height: '100px',
  border: '2px solid #FBBF25'
}
```

### Full Draft Board Button
```css
style: {
  position: 'absolute',
  top: '118px',
  left: '45.5px',
  width: '288px',
  backgroundColor: '#6b7280',
  border: '1px solid rgba(128, 128, 128, 0.4)'
}
```

### Autodraft Container
```css
style: {
  position: 'absolute',
  top: '182px',
  left: '45.5px',
  width: '174px',
  height: '90px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}
```

### Picks Away Calendar
```css
style: {
  position: 'absolute',
  top: '182px',
  left: '215.5px',
  paddingLeft: '16px',
  paddingRight: '32px'
}
```

### Main Content Container
```css
style: {
  position: 'fixed',
  left: '0px',
  top: '380px',
  width: '100vw',
  bottom: '0px',
  paddingLeft: '20px'
}
```

## Three Column Layout

### Left Sidebar (Your Queue)
```css
style: {
  position: 'absolute',
  top: '290px',
  left: '45.5px',
  marginLeft: '-17px',
  width: '288px',
  height: '797px'
}
```

### Center Column (Available Players)
- Position filters with exact widths: 80px each
- ADP column: 40px width
- Rankings column: 40px width
- Player gradient calculations with precise color stops

### Right Column (Your Team)
- Position-specific roster slots
- Gradient backgrounds for each position

## Position Color System

### Primary Colors
- QB: #7C3AED (deep purple)
- RB: #0fba80 (green) 
- WR: #4285F4 (blue)
- TE: #7C3AED (purple)

### Gradient Calculations
Complex mathematical gradients with 200 color stops calculated at 0.2px intervals for seamless transitions.

## Button Specifications

### Position Filter Buttons
```css
style: {
  width: '80px',
  minHeight: '32px',
  borderWidth: '1px'
}
```

### Queue Action Buttons
Hover states with exact color transitions and opacity changes.

## Responsive Considerations
- Fixed 1391px layout prevents responsive breaking
- Zoom-resistant classes for browser zoom stability
- Overflow handling for different screen sizes

## Critical Implementation Notes
1. All positioning is absolute/fixed for pixel-perfect control
2. Z-index layers carefully managed for proper stacking
3. Transform3d used for hardware acceleration
4. Gradient calculations must be preserved exactly
5. All hover states and transitions maintained
6. Drag and drop functionality preserved
7. Firebase real-time updates maintained
