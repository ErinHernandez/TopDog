# Container Shorthand Reference

## Container Designations

| Shorthand | Full Description |
|-----------|------------------|
| C1 | Horizontal scrolling bar |
| C2 | Team Roster container |
| C3 | Available Players container |
| C4 | Your Queue container |
| C5 | Picks Away container |
| C6 | Autodraft Would Be container |
| C7 | Full Draft Board container |
| C8 | On the Clock container |

## Detailed Container Specifications

### C1 - Horizontal Scrolling Bar
- **Position**: `position: 'relative'`
- **Width**: `width: '100vw'`
- **Height**: `height: '256px'`
- **Padding**: `paddingTop: '60px'`, `paddingBottom: '0px'`, `paddingLeft: '0'`, `paddingRight: '0'`
- **Background**: `backgroundColor: '#101927'`
- **Transform**: `transform: 'translateZ(0)'`
- **Overflow**: `overflowX: 'auto'`, `overflowY: 'visible'`
- **Scroll**: `scrollSnapType: 'x mandatory'`, `scrollBehavior: 'smooth'`
- **Gap**: `gap: '4.5px'`

### C2 - Team Roster Container
- **Position**: `position: 'absolute'`, `top: '0px'`, `right: '0px'`
- **Width**: `width: '288px'`
- **Height**: `height: '1081px'`
- **Padding**: `padding: '18px'`
- **Background**: `bg-white/10` (rgba(255, 255, 255, 0.1))
- **Border**: `border: '1px solid rgba(255, 255, 255, 0.1)'`
- **Z-index**: `z-30`
- **Additional**: `paddingLeft: '0px'`, `paddingRight: '-9px'`, `paddingBottom: '24px'`

### C3 - Available Players Container
- **Position**: `position: 'absolute'`, `top: '0px'`, `left: '408px'`
- **Width**: `width: '768px'`
- **Height**: `height: '1081px'`
- **Padding**: `paddingLeft: '24px'`, `paddingRight: '24px'`, `paddingTop: '24px'`
- **Background**: `bg-white/10` (rgba(255, 255, 255, 0.1))
- **Border**: `border: '1px solid rgba(255, 255, 255, 0.1)'`
- **Transform**: `transform: 'translateZ(0)'`
- **Overflow**: `overflowY: 'auto'`

### C4 - Your Queue Container
- **Position**: `marginLeft: '-17px'`, `marginTop: '-10px'`
- **Width**: `width: '288px'`
- **Height**: `height: '797px'`
- **Padding**: `p-4` (16px)
- **Background**: `bg-white/10` (rgba(255, 255, 255, 0.1))
- **Border**: `border: '1px solid rgba(255, 255, 255, 0.1)'`
- **Z-index**: `z-30`
- **Parent**: `w-80` (320px width), `flex flex-col flex-shrink-0`

### C5 - Picks Away Container (PicksAwayCalendar)
- **Component**: `PicksAwayCalendar`
- **Position**: Within C6 (Autodraft Would Be container)
- **Styling**: Inherits from parent container styling
- **Background**: `bg-white/10` (rgba(255, 255, 255, 0.1))
- **Border**: `border: '1px solid rgba(255, 255, 255, 0.1)'`
- **Text**: Dynamic based on picksAway value (0="ON THE CLOCK", 1="UP NEXT", 2+="##")

### C6 - Autodraft Would Be Container
- **Position**: `paddingLeft: '16px'`, `paddingRight: '32px'`, `marginTop: '-100px'`
- **Width**: `width: '174px'`
- **Height**: `height: '90px'`, `minHeight: '90px'`, `maxHeight: '90px'`
- **Background**: `bg-white/10` (rgba(255, 255, 255, 0.1))
- **Border**: `border: '1px solid rgba(255, 255, 255, 0.1)'`
- **Border Left**: `border-l-4 border-[#2DE2C5]`
- **Text**: "Autodraft Would Be:" in `text-[#60A5FA]` color

### C7 - Full Draft Board Container
- **Position**: `paddingLeft: '16px'`, `paddingRight: '32px'`, `top: '0px'`, `marginBottom: '18px'`
- **Width**: `width: '288px'`
- **Background**: `backgroundColor: '#6b7280'`
- **Border**: `border: '1px solid rgba(128, 128, 128, 0.4)'`
- **Color**: `color: '#fff'`
- **Padding**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Font**: `font-bold`, `text-sm`

### C8 - On the Clock Container
- **Position**: `paddingLeft: '18px'`, `paddingRight: '23px'`, `top: '-100px'`
- **Width**: `width: 288px`, `minWidth: 288px`, `maxWidth: 288px`
- **Height**: `height: '100px'`, `minHeight: '100px'`, `maxHeight: '100px'`
- **Background**: `bg-white/10` (rgba(255, 255, 255, 0.1))
- **Border**: `border: '1px solid rgba(255, 255, 255, 0.1)'`
- **Text**: "ON THE CLOCK" or "DRAFT STARTING" in `text-xl font-bold text-white`
- **Padding**: `p-4` (16px)

## Usage Notes

- These shorthand designations are for internal reference only
- Do not add these labels to the actual code
- Use these references to ensure correct container identification when making adjustments
- Helps avoid confusion when moving or modifying specific containers
