# TopDog UI Specification

**Purpose:** Comprehensive visual specification for pixel-perfect recreation on iOS (SwiftUI) and other platforms.  
**Source of Truth:** Web codebase (`components/vx2/`)  
**Status:** Active reference document

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
2. [Component Library](#2-component-library)
3. [Screen Specifications](#3-screen-specifications)
4. [Interaction Patterns](#4-interaction-patterns)
5. [Reference Screenshots](#5-reference-screenshots)

---

## 1. Design Tokens

All values extracted from `components/vx2/core/constants/`.

### 1.1 Colors

#### Position Colors (LOCKED - Do Not Change)

| Token | Hex | Usage |
|-------|-----|-------|
| `position-qb` | `#F472B6` | QB badge, filter, pick cell |
| `position-rb` | `#0fba80` | RB badge, filter, pick cell |
| `position-wr` | `#FBBF25` | WR badge, filter, pick cell |
| `position-te` | `#7C3AED` | TE badge, filter, pick cell |
| `position-bn` | `#6B7280` | Bench/gray fallback |

#### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#2DE2C5` | Selected states, highlights |
| `brand-secondary` | `#59c5bf` | Focus borders, accents |
| `brand-accent` | `#04FBB9` | Bright accent |

#### Navbar Blue (matches `/wr_blue.png`)

| Token | Hex | Usage |
|-------|-----|-------|
| `navbar-solid` | `#1DA1F2` | Tab active, buttons, badges |
| `navbar-light` | `#4DB5F5` | Light variant |
| `navbar-dark` | `#1A91DA` | Dark variant |

#### Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#101927` | Main dark background |
| `bg-secondary` | `#1f2937` | Card backgrounds |
| `bg-tertiary` | `#111827` | Darker sections |
| `bg-elevated` | `rgba(255,255,255,0.1)` | Elevated surfaces |
| `bg-card` | `#1f2833` | Player card background |
| `bg-black` | `#000000` | Footer, pure black |

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#ffffff` | Primary text |
| `text-secondary` | `#9ca3af` | Secondary/muted |
| `text-muted` | `#6b7280` | Disabled/hints |
| `text-disabled` | `#4b5563` | Disabled states |

#### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `border-default` | `rgba(255,255,255,0.1)` | Standard borders |
| `border-light` | `rgba(255,255,255,0.05)` | Subtle borders |
| `border-subtle` | `rgba(255,255,255,0.15)` | Slightly visible |
| `border-focus` | `#59c5bf` | Focus state |
| `border-error` | `#ef4444` | Error state |
| `border-success` | `#10b981` | Success state |

#### UI State Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `state-ontheclock` | `#EF4444` | On the clock red |
| `state-myturn` | `#EF4444` | User's turn |
| `state-active` | `#60A5FA` | Active blue |
| `state-selected` | `#2DE2C5` | Selected teal |
| `state-success` | `#10B981` | Success green |
| `state-warning` | `#F59E0B` | Warning amber |
| `state-error` | `#EF4444` | Error red |
| `state-info` | `#3B82F6` | Info blue |

#### Tab Bar Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `tabbar-background` | `#000000` | Tab bar bg |
| `tabbar-border` | `#374151` | Top border |
| `tabbar-icon-active` | `#1DA1F2` | Selected icon |
| `tabbar-icon-inactive` | `#9CA3AF` | Unselected icon |

### 1.2 Typography

#### Font Sizes (px)

| Token | Size |
|-------|------|
| `xs` | 12 |
| `sm` | 14 |
| `base` | 16 |
| `lg` | 18 |
| `xl` | 20 |
| `2xl` | 26 |
| `3xl` | 32 |
| `4xl` | 40 |
| `5xl` | 52 |

#### Line Heights

| Token | Value |
|-------|-------|
| `tight` | 1.1 |
| `snug` | 1.25 |
| `normal` | 1.5 |
| `relaxed` | 1.75 |

#### Font Weights

| Token | Value |
|-------|-------|
| `normal` | 400 |
| `medium` | 500 |
| `semibold` | 600 |
| `bold` | 700 |

### 1.3 Spacing (px)

| Token | Value |
|-------|-------|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `2xl` | 32 |
| `3xl` | 48 |

### 1.4 Border Radius (px)

| Token | Value |
|-------|-------|
| `sm` | 4 |
| `md` | 8 |
| `lg` | 12 |
| `xl` | 16 |
| `2xl` | 24 |
| `full` | 9999 |

### 1.5 Touch Targets (px)

| Token | Value | Usage |
|-------|-------|-------|
| `min` | 44 | Minimum (Apple HIG) |
| `comfort` | 48 | Comfortable tap |
| `large` | 56 | Large action buttons |

### 1.6 Animation

#### Durations (ms)

| Token | Value | Usage |
|-------|-------|-------|
| `fast` | 75 | Micro-interactions |
| `normal` | 150 | Standard transitions |
| `slow` | 300 | Emphasis animations |
| `page` | 200 | Page transitions |

#### Easing

| Token | Value |
|-------|-------|
| `default` | `ease` |
| `in` | `ease-in` |
| `out` | `ease-out` |
| `inOut` | `ease-in-out` |
| `spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

### 1.7 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `base` | 0 | Content |
| `elevated` | 10 | Slightly elevated |
| `stickyContent` | 20 | Sticky headers |
| `dropdown` | 100 | Dropdowns/menus |
| `header` | 150 | App header |
| `tabBar` | 150 | Tab bar |
| `sticky` | 200 | Sticky elements |
| `fixed` | 300 | Fixed position |
| `modalBackdrop` | 400 | Modal backdrop |
| `modal` | 500 | Modal content |
| `popover` | 600 | Popovers |
| `tooltip` | 700 | Tooltips |
| `toast` | 800 | Toast notifications |
| `max` | 9999 | Critical overlays |

---

## 2. Component Library

### 2.1 Position Badge

```
Dimensions:
- Height: 20px
- Min Width: 28px
- Padding: 4px 8px
- Border Radius: full (pill)

Typography:
- Font Size: 11px
- Font Weight: semibold
- Text Transform: uppercase

Colors by Position:
- QB: bg #F472B6, text dark
- RB: bg #0fba80, text dark
- WR: bg #FBBF25, text dark
- TE: bg #7C3AED, text white
- BN: bg #6B7280, text white
```

### 2.2 Player Row (Draft Room)

```
Dimensions:
- Height: 64px (fixed)
- Padding X: 12px (SPACING.md)

Layout (left to right):
1. ADP Column: 50px width, left aligned
2. Player Info: flex fill
   - Name: 15px semibold white
   - Subline: position badge + team + bye (12px gray)
   - Gap: 4px vertical
3. Queue Button: 32px circle
4. PROJ Column: 50px width, centered
5. RANK Column: 50px width, centered

Colors:
- Background: #1f2833 (bg-card)
- Separator: 1px rgba(255,255,255,0.1)
- ADP text: #9ca3af (text-secondary)
- Name text: #ffffff (text-primary)
- Subline text: #9ca3af
- PROJ text: #ffffff
- RANK text: #9ca3af
```

### 2.3 Pick Card (Picks Bar)

```
Dimensions:
- Width: 140px
- Height: 172px
- Gap: 8px (SPACING.sm)
- Border Radius: 8px

Layout (top to bottom):
1. Username: truncated, 11px
2. Pick number + Position: "1.01 WR", 10px
3. Player Name: centered, 14px bold
4. Team: centered, 11px gray
5. Position Tracker Bar: bottom, 6-8px height

States:
- Default: gray border (#374151)
- User's Pick: 2-3px yellow border (#FBBF25)
- On The Clock: gray bg, "On The Clock" text
- Future: just pick number visible
```

### 2.4 Filter Button (Position)

```
Dimensions:
- Width: 64px
- Height: ~40px
- Border: 2px
- Border Radius: 8px
- Background: #1f2937 (bg-secondary)

Typography:
- Format: "[POS] [count]"
- Font Size: 12px
- Font Weight: medium

States:
- Active (count > 0): position-colored border
- Inactive (count = 0): gray border (#6B7280)
- Selected: position-colored border + fill
```

### 2.5 Search Bar

```
Dimensions:
- Height: 44px
- Padding X: 16px
- Border Radius: 8px

Layout:
- Icon: magnifying glass, 18px, left
- Input: flex fill
- Clear: "Clear" text, right (when has value)

Colors:
- Background: #1f2937
- Border: rgba(255,255,255,0.1)
- Placeholder: #6b7280
- Icon: #6b7280
```

### 2.6 Tab Bar Item

```
Dimensions:
- Min Height: 44px
- Padding Top: 10px
- Padding Bottom: 10px
- Icon Size: 24px

Typography:
- Label Size: 10px
- Label Line Height: 12px
- Label Margin Top: 4px

Colors:
- Active Icon: #1DA1F2
- Active Label: #1DA1F2
- Inactive Icon: #9CA3AF
- Inactive Label: #9CA3AF
- Background: #000000

Badge (if present):
- Min Width: 18px
- Height: 18px
- Font Size: 10.5px
- Background: #1DA1F2
- Text: white
```

### 2.7 Button (Primary)

```
Dimensions:
- Height: 57px (tournament card)
- Border Radius: 12px
- Padding X: 24px

Typography:
- Font Size: 18px
- Font Weight: semibold

Colors:
- Background: #4DB5F5 (navbar-light) or gradient
- Text: white
- Disabled: 50% opacity
```

### 2.8 Tournament Card (V3)

```
Dimensions:
- Min Height: 650px
- Padding: 21px
- Border Radius: 16px

Layout (top to bottom):
1. Title: margin-top 12px
2. Spacer: min 24px
3. Logo: max-height 72px
4. Spacer: flex
5. Progress Bar: 8px height
6. Join Button: 57px height
7. Stats Row: 48px height

Colors:
- Background: tiled /wr_blue.png on #1E3A5F
- Border: ~4px blue outline
- Title: white with text shadow

Stats Row:
- 3 columns, 24px gap
- Value: 16px bold white
- Label: 11px uppercase gray
```

---

## 3. Screen Specifications

### 3.1 Draft Room

#### Layout Structure

```
Total Height: 100vh

Components (top to bottom):
1. Status Bar: device safe area
2. Draft Status Bar: 26px content
3. Picks Bar: 130px
4. Content Area: flex fill
5. Footer Tab Bar: 56px
6. Home Indicator: device safe area
```

#### Draft Status Bar

```
Height: 26px (content only)
Padding X: 12px

Layout:
- Left: Back chevron (24px)
- Center: Timer (36-40px monospace bold)
- Right: (variable)

Timer Colors by State:
- Normal (>10s): #60A5FA (state-active)
- Warning (5-10s): #F59E0B (state-warning)
- Critical (<5s): #EF4444 (state-error)
```

#### Picks Bar

```
Height: 130px
Padding: 8px vertical, 12px horizontal
Card Width: 140px
Card Height: 172px
Card Gap: 8px

Scroll: horizontal, snap to card
Auto-scroll: to current pick on changes
```

#### Player List Tab

```
Components (top to bottom):
1. Position Filters: 48px height, 64px buttons, 8px gap
2. Search Bar: 44px height
3. Column Headers: ~32px height
4. Player List: LazyVStack, 64px rows
```

#### Queue Tab

```
Empty State:
- + icon centered
- "No players queued" text
- "Browse Players" button

With Players:
- Item Height: 56px
- Drag Handle Width: 32px
- Reorderable via drag
```

#### Roster Tab

```
Header: Participant selector, 44px height
Row Height: 48px

Position Slots:
- QB (1)
- RB (2)
- WR (3)
- TE (1)
- FLEX (2)
- BENCH (9)

Total: 18 slots
```

#### Board Tab

```
Grid: 18 rows × teamCount columns
Cell Width: 72px
Cell Height: 64px
Header Height: 32px

Snake Draft: alternating direction per round
User Column: highlighted with #3B82F6 border
```

#### Footer Tab Bar

```
Height: 56px
Icon Size: 24px
5 Tabs: Players, Queue, Rosters, Board, Info

Active: #1DA1F2
Inactive: #6b7280
Background: #101927
```

### 3.2 Lobby Tab

```
Layout: Full-bleed tournament card

Card:
- Min Height: 650px
- Background: tiled pattern
- Contains: title, logo, progress, button, stats

Stats Row (3 columns):
- ENTRY: "$25"
- ENTRIES: "571,480"
- 1ST PLACE: "$2.1M"
```

### 3.3 App Tab Bar (Main)

```
5 Tabs: Lobby, Live Drafts, My Teams, Exposure, Profile

Height: 44px min + padding + home indicator
Icons: 24px
Labels: 10px

Active: #1DA1F2
Inactive: #9CA3AF
Background: #000000
Border Top: #374151
```

### 3.4 Settings Modal

```
3 Tabs: Profile, Draft Alerts, Security

Profile Tab:
- Avatar placeholder
- Customize button
- Name/Email/Phone fields
- Sign Out button

Draft Alerts Tab:
- Toggle switches for notifications
- Items: Room Filled, Draft Starting, Two Picks Away, On The Clock, 10 Seconds

Security Tab:
- Password reset section
- Current Session info with last login
```

### 3.5 Authentication Screens

```
Shared:
- Full screen modals
- Blue outline wrapper
- Tiled background (/wr_blue.png)

Sign In:
- Email input
- Password input (with visibility toggle)
- Remember me checkbox
- Forgot password link
- Sign In button

Create Account:
- Email input
- Password input
- Password requirements checklist
- Continue button

Forgot Password:
- Email/Phone toggle
- Input field
- Send Code button
```

---

## 4. Interaction Patterns

### 4.1 Haptics

| Action | Pattern |
|--------|---------|
| Tab switch | Light tap |
| Button press | Medium impact |
| Pick made | Success notification |
| Error | Error notification |
| Timer warning | Warning notification |
| Drag start | Selection feedback |
| Drag end | Impact feedback |

### 4.2 Gestures

| Gesture | Location | Action |
|---------|----------|--------|
| Tap | Player row | Expand/collapse |
| Tap | Queue button | Add/remove from queue |
| Tap | Filter button | Toggle position filter |
| Swipe horizontal | Picks bar | Scroll picks |
| Long press | Queue item | Begin drag |
| Drag | Queue item | Reorder |
| Pull down | Player list | Refresh |

### 4.3 Timer State Machine

```
States:
- idle: Not user's turn
- active: User's turn, >10s remaining
- warning: 5-10s remaining
- critical: <5s remaining
- grace: Timer expired, grace period
- autopick: Grace expired, auto-picking

Transitions:
- idle → active: Becomes user's turn
- active → warning: Timer < 10s
- warning → critical: Timer < 5s
- critical → grace: Timer expires
- grace → autopick: Grace expires
- any → idle: Pick made or turn passes
```

### 4.4 Draft Room Navigation

```
Entry Points:
- From Live Drafts tab: tap draft card
- From Slow Drafts tab: tap Enter Draft
- From notification: deep link

Exit:
- Back button: confirms exit
- Exit Draft modal: Withdraw Entry / Leave Draft Room / Stay
```

---

## 5. Reference Screenshots

> **Total:** ~47 screenshots + 1 asset file
> **Location:** `/Users/td.d/.cursor/projects/Users-td-d-Documents-bestball-site/assets/`

### 5.1 Authentication (5 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `4.53.40_AM` | iOS Auth Gate | TopDog logo, Sign In/Create Account/Apple Sign In |
| `3.57.03_PM` | Create Account | Email/password, requirements, Continue |
| `3.57.04_PM` | Sign In | Email/password, Remember me, Forgot password |
| `3.57.06_PM` | Forgot Password | Email/Phone toggle, Send Code |
| `3.57.01_PM` | Auth Empty State | Placeholder icon, "Select a modal" |

### 5.2 Settings Modal (3 tabs)

| File | Screen | Key Elements |
|------|--------|--------------|
| `3.57.08_PM` | Profile | Avatar, Customize, Name/Email/Phone, Sign Out |
| `3.57.10_PM` | Draft Alerts | Toggles: Room Filled, Draft Starting, Two Picks Away, On The Clock, 10 Seconds |
| `3.57.12_PM` | Security | Password reset, Current Session |

### 5.3 Lobby Tab (4 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `5.06.31_AM` | Tournament Card | THE TOPDOG INTERNATIONAL, globe, $25, Join |
| `4.08.04_PM` | Join Tournament Modal | Entry count, 30s/Slow toggle, Details, Scoring, Roster |
| `3.06.20_PM` | Lobby Sandbox | Design tool sliders |
| `12.54.09_AM` | Lobby Sandbox | Element toggles |

### 5.4 Draft Room - Players Tab (5 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `2025-09-30_2.32.47_AM` | Draft Position Card | "2.12", "6 away", urgency bar |
| `2026-01-16_1.15.50_AM` | Player List | Timer "23", picks bar, filters |
| `2026-01-16_1.14.42_AM` | Player List (My Turn) | Timer "30", blue header |
| `5.02.02_AM` | Player List (Latest) | WR filter (yellow), RANK sort |
| `4.29.44_PM` | Player Expanded | Team logo, stats table, DRAFT button |

### 5.5 Draft Room - Queue Tab

| File | Screen | Status | Key Elements |
|------|--------|--------|--------------|
| `4.10.52_PM` | Queue Empty | TARGET | + icon, "No players queued", Browse Players |
| — | Queue with Players | **NEEDS REDESIGN** | Current iteration not satisfactory |

### 5.6 Draft Room - Roster Tab (2 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `4.10.26_PM` | Roster Empty | Username dropdown, position slots, share FAB |
| `4.29.53_PM` | Roster with Players | Filled WR slots, Queue badge "2" |

### 5.7 Draft Room - Board Tab (3 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `2026-01-16_1.16.56_AM` | Board (Filled) | Snake grid, position-colored cells |
| `4.10.00_PM` | Board (Empty) | Timer "50", 4 columns, "23 away" |
| `3.03.54_PM` | Board (Dev) | Timer "2", dev controls |

### 5.8 Draft Room - Info Tab

| File | Screen | Status | Key Elements |
|------|--------|--------|--------------|
| `4.13.25_PM` | Info Tab | **CURRENT, NOT GOAL** | Exit Draft, Tutorial, Draft Format, Roster Construction - needs redesign |

### 5.9 Draft Room - Modals & Tutorial (5 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `4.25.22_PM` | Exit Draft Modal | Warning icon, Withdraw Entry (red), Leave, Stay |
| `3.55.12_PM` | Tutorial 1/4 | "Pick Your Players" |
| `3.55.15_PM` | Tutorial 2/4 | "Snake Draft Format" |
| `3.55.17_PM` | Tutorial 3/4 | "Queue Up Players" |
| `3.55.20_PM` | Tutorial 4/4 | "Set It & Forget It" |

### 5.10 Live Drafts Tab (2 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `4.26.49_PM` | Live Drafts List | Fast/Slow toggle, ON THE CLOCK badge, timer, progress |
| `image-c1cd0136` | Live Drafts Cards | Picks away, NEEDS badges |

### 5.11 Slow Drafts Tab (3 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `3.57.39_PM` | Slow Drafts List | Cards, YOUR TURN badges |
| `3.57.43_PM` | Slow Draft Expanded | MY ROSTER grid, POSITION NEEDS bars |
| `4.26.57_PM` | Slow Draft Full | 12 picks, progress checkmarks |

### 5.12 My Teams Tab

| File | Screen | Key Elements |
|------|--------|--------------|
| `4.26.47_PM` | Teams List | Search, 50 teams, Sort: Draft Date |

### 5.13 Exposure Tab (2 screens)

| File | Screen | Key Elements |
|------|--------|--------------|
| `5.06.48_AM` | Exposure List | Search, filters, EXP% |
| `4.26.44_PM` | Exposure Full | Player percentages |

### 5.14 Profile Tab

| File | Screen | Key Elements |
|------|--------|--------------|
| `4.26.42_PM` | Profile Tab | Avatar, Customize, +Deposit, menu items |

### 5.15 Payment Flow

| File | Screen | Key Elements |
|------|--------|--------------|
| `2026-01-05_5.57.07_PM` | Deposit Funds | Stripe form, card fields |

### 5.16 Error State

| File | Screen | Key Elements |
|------|--------|--------------|
| `4.18.01_PM` | Error State | Warning icon, "Something went wrong", actions |

### 5.17 Asset Files

| File | Type | Usage | Details |
|------|------|-------|---------|
| `4096_globe_ocean_matched_4096.png` | Image | Tournament card | 4096x4096, position-colored grid |

---

## Screens Marked for Redesign

These screenshots show **current state**, NOT target design:

1. **Info Tab** (`4.13.25_PM`) - Needs redesign
2. **Queue Tab (with players)** - Needs redesign
3. **Player Stats Dropdown** - New component to design

---

## Device Safe Areas

### iPhone Models

| Model | Status Bar | Home Indicator |
|-------|------------|----------------|
| iPhone SE | 20px | 0px |
| iPhone 12/13 Mini | 50px | 34px |
| iPhone 12/13 | 47px | 34px |
| iPhone 15 | 59px | 34px |
| iPhone 14/15 Pro Max | 59px | 34px |
| iPhone 16 Pro Max | 62px | 34px |

### SwiftUI Safe Area Handling

```swift
// Header respects top safe area automatically
// Footer needs manual home indicator spacing
.ignoresSafeArea(.container, edges: .bottom)
.safeAreaInset(edge: .bottom) {
    TabBar()
}
```

---

## Source Code References

| Token Category | File |
|----------------|------|
| Colors | `components/vx2/core/constants/colors.ts` |
| Sizes/Spacing | `components/vx2/core/constants/sizes.ts` |
| Draft Layout | `components/vx2/draft-room/constants/index.ts` |
| Device Presets | `components/vx2/core/constants/sizes.ts` |

---

**Document Status:** Complete  
**Last Updated:** January 31, 2026  
**Maintainer:** LLM agents building iOS/cross-platform implementations
