# iOS Pixel-Perfect Implementation Plan

**Status:** Comprehensive Plan  
**Goal:** Exact replica of TopDog web app in native iOS  
**Based on:** Deep codebase analysis + SwiftUI best practices research

---

## Related Documents (Source of Truth)

| Document | Purpose |
|----------|---------|
| **[`docs/UI_SPEC.md`](./UI_SPEC.md)** | Complete visual specification - design tokens, component specs, screen layouts, 47+ screenshots |
| **[`docs/MOBILE_COMPONENT_INVENTORY.md`](./MOBILE_COMPONENT_INVENTORY.md)** | Component inventory - props, state, relationships, priority matrix for 38+ components |
| **[`docs/PLATFORM_STRATEGY_PREPLAN.md`](./PLATFORM_STRATEGY_PREPLAN.md)** | Platform strategy decisions (iOS → Desktop Web → Android) |

**IMPORTANT:** When implementing components, cross-reference `UI_SPEC.md` for exact pixel values and `MOBILE_COMPONENT_INVENTORY.md` for component props/behavior.

---

## Table of Contents

1. [Codebase Analysis Summary](#1-codebase-analysis-summary)
2. [Design System Translation](#2-design-system-translation)
3. [Component Mapping](#3-component-mapping)
4. [Implementation Strategy](#4-implementation-strategy)
5. [Screen-by-Screen Breakdown](#5-screen-by-screen-breakdown)
6. [Performance Requirements](#6-performance-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Phase Breakdown](#8-phase-breakdown)

**Appendices (Visual References):**
- [Appendix A: Draft Room Visual Reference](#appendix-a-draft-room-visual-reference)
- [Appendix B: Safe Area Considerations](#appendix-b-safe-area-considerations)
- [Appendix C: Lobby Tab Visual Reference](#appendix-c-lobby-tab-visual-reference)
- [Appendix D: Exposure Tab Visual Reference](#appendix-d-exposure-tab-visual-reference)
- [Appendix E: Screenshot Inventory](#appendix-e-screenshot-inventory)

**Appendices (Implementation):**
- [Appendix F: Swift Data Models](#appendix-f-swift-data-models)
- [Appendix G: Firebase Integration](#appendix-g-firebase-integration)
- [Appendix H: Push Notifications & Live Activities](#appendix-h-push-notifications--live-activities)
- [Appendix I: App Store Checklist](#appendix-i-app-store-checklist)
- [Appendix J: Deep Linking & Navigation](#appendix-j-deep-linking--navigation)
- [Appendix K: Error Handling](#appendix-k-error-handling)

---

## 1. Codebase Analysis Summary

### Design System (from `core/constants/`)

#### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#101927` | Main background |
| `bg-secondary` | `#1f2937` | Elevated surfaces |
| `bg-tertiary` | `#111827` | Cards |
| `bg-card` | `#1f2833` | Card backgrounds |
| `text-primary` | `#ffffff` | Primary text |
| `text-secondary` | `#9ca3af` | Secondary text |
| `text-muted` | `#6b7280` | Muted text |
| `brand-primary` | `#2DE2C5` | Primary brand |
| `navbar-solid` | `#1DA1F2` | TopDog blue |
| `position-qb` | `#F472B6` | QB pink |
| `position-rb` | `#0fba80` | RB green |
| `position-wr` | `#FBBF25` | WR yellow |
| `position-te` | `#7C3AED` | TE purple |
| `state-ontheclock` | `#EF4444` | Urgent red |
| `state-success` | `#10B981` | Success green |
| `state-warning` | `#F59E0B` | Warning orange |

#### Spacing
| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 24px |
| `2xl` | 32px |
| `3xl` | 48px |

#### Typography
| Token | Size |
|-------|------|
| `xs` | 12px |
| `sm` | 14px |
| `base` | 16px |
| `lg` | 18px |
| `xl` | 20px |
| `2xl` | 24px |
| `3xl` | 30px |
| `4xl` | 36px |
| `5xl` | 52px |

#### Corner Radius
| Token | Value |
|-------|-------|
| `sm` | 4px |
| `md` | 8px |
| `lg` | 12px |
| `xl` | 16px |
| `2xl` | 24px |
| `full` | 9999px |

#### Touch Targets
| Token | Value |
|-------|-------|
| `min` | 44px |
| `comfort` | 48px |
| `large` | 56px |

### Component Inventory

#### Shell Components
- `AppShellVX2` — Root orchestrator
- `AppHeaderVX2` — Header with logo, deposit button
- `TabBarVX2` — Bottom tab navigation (5 tabs)
- `MobilePhoneFrame` — Desktop preview frame

#### Tab Views
1. **Lobby** — Tournament cards, join flow
2. **Live Drafts** — Active drafts (placeholder in web)
3. **My Teams** — Team cards, playoff brackets
4. **Exposure** — Player exposure report
5. **Profile** — Settings, customization
6. **(Slow Drafts)** — Alternative tab for async drafts

#### Draft Room (Critical)
- `DraftRoomVX2` — Main orchestrator
- `PlayerList` — Virtualized player list (react-window)
- `DraftBoard` — 18×12 grid
- `QueueView` — Drag-to-reorder queue
- `RosterView` — Team composition
- `PicksBar` — Horizontal picks scroll
- `PlayerExpandedCard` — Detailed stats
- `DraftStatusBar` — Timer header
- `DraftFooter` — Tab navigation

#### Modals
- `JoinTournamentModal` — Tournament join flow
- `DepositModalVX2` — Stripe payment
- `WithdrawModalVX2` — Withdrawal
- Various payment provider modals
- Auth modals (login, signup, forgot password)

### Key Patterns Identified

1. **CSS Modules** — All styling via `.module.css` files
2. **CSS Custom Properties** — Dynamic values via `var(--token)`
3. **Atomic Components** — Small, reusable pieces in `elements/`
4. **Tiled Backgrounds** — `/wr_blue.png`, `/square_background.png`
5. **Blur-up Loading** — Base64 placeholder → full image
6. **Fixed Heights** — Prevents layout shift (8px/57px/48px)
7. **Virtualization** — `react-window` for player list

---

## 2. Design System Translation

### SwiftUI Color System

```swift
// TopDog/Core/DesignSystem/Colors.swift

extension Color {
    static let td = TopDogColors()
}

struct TopDogColors {
    // Backgrounds
    let bgPrimary = Color(hex: "#101927")
    let bgSecondary = Color(hex: "#1f2937")
    let bgTertiary = Color(hex: "#111827")
    let bgCard = Color(hex: "#1f2833")
    let bgElevated = Color(hex: "#243044")
    
    // Text
    let textPrimary = Color.white
    let textSecondary = Color(hex: "#9ca3af")
    let textMuted = Color(hex: "#6b7280")
    let textDisabled = Color(hex: "#4b5563")
    
    // Brand
    let brandPrimary = Color(hex: "#2DE2C5")
    let brandSecondary = Color(hex: "#59c5bf")
    let navbarSolid = Color(hex: "#1DA1F2")
    let navbarLight = Color(hex: "#4DB5F5")
    
    // Positions
    let positionQB = Color(hex: "#F472B6")
    let positionRB = Color(hex: "#0fba80")
    let positionWR = Color(hex: "#FBBF25")
    let positionTE = Color(hex: "#7C3AED")
    let positionBN = Color(hex: "#6B7280")
    
    // States
    let stateOnTheClock = Color(hex: "#EF4444")
    let stateActive = Color(hex: "#60A5FA")
    let stateSelected = Color(hex: "#2DE2C5")
    let stateSuccess = Color(hex: "#10B981")
    let stateWarning = Color(hex: "#F59E0B")
    let stateError = Color(hex: "#EF4444")
    
    // Borders
    let borderDefault = Color.white.opacity(0.1)
    let borderLight = Color.white.opacity(0.05)
    let borderFocus = Color(hex: "#59c5bf")
    
    // Helper
    func position(_ pos: String) -> Color {
        switch pos.uppercased() {
        case "QB": return positionQB
        case "RB": return positionRB
        case "WR": return positionWR
        case "TE": return positionTE
        default: return positionBN
        }
    }
}
```

### SwiftUI Spacing System

```swift
// TopDog/Core/DesignSystem/Spacing.swift

enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    static let xxxl: CGFloat = 48
}

enum CornerRadius {
    static let sm: CGFloat = 4
    static let md: CGFloat = 8
    static let lg: CGFloat = 12
    static let xl: CGFloat = 16
    static let xxl: CGFloat = 24
    static let full: CGFloat = 9999
}

enum TouchTarget {
    static let min: CGFloat = 44
    static let comfort: CGFloat = 48
    static let large: CGFloat = 56
}
```

### SwiftUI Typography System

```swift
// TopDog/Core/DesignSystem/Typography.swift

enum FontSize {
    static let xs: CGFloat = 12
    static let sm: CGFloat = 14
    static let base: CGFloat = 16
    static let lg: CGFloat = 18
    static let xl: CGFloat = 20
    static let xxl: CGFloat = 24
    static let xxxl: CGFloat = 30
    static let display: CGFloat = 36
    static let hero: CGFloat = 52
}

extension Font {
    static let td = TopDogFonts()
}

struct TopDogFonts {
    // Body
    let bodyXS = Font.system(size: FontSize.xs)
    let bodySM = Font.system(size: FontSize.sm)
    let body = Font.system(size: FontSize.base)
    let bodyLG = Font.system(size: FontSize.lg)
    
    // Bold
    let bodyXSBold = Font.system(size: FontSize.xs, weight: .semibold)
    let bodySMBold = Font.system(size: FontSize.sm, weight: .semibold)
    let bodyBold = Font.system(size: FontSize.base, weight: .semibold)
    let bodyLGBold = Font.system(size: FontSize.lg, weight: .semibold)
    
    // Headlines
    let headline = Font.system(size: FontSize.xl, weight: .bold)
    let title = Font.system(size: FontSize.xxl, weight: .bold)
    let titleLG = Font.system(size: FontSize.xxxl, weight: .bold)
    let display = Font.system(size: FontSize.display, weight: .bold)
    let hero = Font.system(size: FontSize.hero, weight: .bold)
    
    // Tournament titles (Anton SC equivalent)
    let tournamentTitle = Font.system(size: 46, weight: .black)
    
    // Monospace
    let mono = Font.system(size: FontSize.base, design: .monospaced)
    let monoLG = Font.system(size: FontSize.xxl, weight: .bold, design: .monospaced)
    let monoXL = Font.system(size: FontSize.display, weight: .bold, design: .monospaced)
}
```

---

## 3. Component Mapping

### Web → SwiftUI Translation

| Web Component | SwiftUI Equivalent |
|---------------|-------------------|
| `div` | `VStack`, `HStack`, `ZStack` |
| `span` | `Text` |
| CSS Grid | `LazyVGrid`, `LazyHGrid`, `Grid` |
| Flexbox | `HStack`, `VStack` with `.frame()` |
| CSS `position: absolute` | `ZStack` with `.offset()` or `overlay` |
| `overflow: scroll` | `ScrollView` |
| `react-window` | `LazyVStack` in `ScrollView` |
| CSS Custom Properties | Swift constants or `@Environment` |
| CSS Modules | ViewModifier or component styles |
| `onClick` | `.onTapGesture` or `Button` |
| `useState` | `@State` |
| `useContext` | `@Environment` or `@Observable` |
| `useCallback/useMemo` | Swift computed properties |

### Critical Component Translations

#### TabBar
```swift
// Web: TabBarVX2.tsx
// iOS: Custom tab bar (not native TabView)
struct TDTabBar: View {
    @Binding var selectedTab: Tab
    
    var body: some View {
        HStack(spacing: 0) {
            ForEach(Tab.allCases, id: \.self) { tab in
                TDTabItem(tab: tab, isSelected: selectedTab == tab)
                    .onTapGesture {
                        Haptics.tabSwitch()
                        selectedTab = tab
                    }
            }
        }
        .frame(height: 56)
        .background(Color.td.bgPrimary)
    }
}
```

#### Tournament Card (V3)
```swift
// Web: TournamentCardV3.tsx (650px height)
// iOS: Exact dimensions
struct TournamentCardV3: View {
    let tournament: Tournament
    
    var body: some View {
        VStack(spacing: 0) {
            // Title section
            TournamentTitle(title: tournament.title)
                .padding(.top, Spacing.md)
            
            Spacer(minLength: Spacing.xl)
            
            // Logo
            TournamentLogo(url: tournament.logoURL)
                .frame(maxHeight: 72)
            
            Spacer()
            
            // Bottom section (8px + 57px + 48px)
            TournamentBottomSection(tournament: tournament)
        }
        .padding(21)
        .frame(minHeight: 650)
        .background(Color(hex: "#0a0a1a"))
        .cornerRadius(CornerRadius.xl)
    }
}
```

#### Player List Row
```swift
// Web: PlayerList.tsx (64px row height per constants/index.ts)
struct PlayerRow: View {
    let player: Player
    let isQueued: Bool
    let onQueue: () -> Void
    let onTap: () -> Void
    
    var body: some View {
        HStack(spacing: Spacing.sm) {
            // ADP (~50px width)
            Text(String(format: "%.1f", player.adp))
                .font(.system(size: 14))
                .foregroundColor(.td.textSecondary)
                .frame(width: 50, alignment: .leading)
            
            // Player info (flex)
            VStack(alignment: .leading, spacing: 4) {
                Text(player.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.td.textPrimary)
                
                HStack(spacing: 4) {
                    // Position badge (pill)
                    PositionBadge(position: player.position)
                    
                    Text("\(player.team) (\(player.byeWeek))")
                        .font(.system(size: 12))
                        .foregroundColor(.td.textSecondary)
                }
            }
            
            Spacer()
            
            // Queue button (~32px circle)
            Button(action: onQueue) {
                Image(systemName: isQueued ? "checkmark" : "plus")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(isQueued ? .td.stateSuccess : .td.textSecondary)
                    .frame(width: 32, height: 32)
                    .background(Color.td.bgTertiary)
                    .clipShape(Circle())
            }
            
            // Projected (~50px)
            Text("\(Int(player.projected))")
                .font(.system(size: 14))
                .foregroundColor(.td.textPrimary)
                .frame(width: 50)
            
            // Rank (~50px)
            Text("\(player.rank)")
                .font(.system(size: 14))
                .foregroundColor(.td.textSecondary)
                .frame(width: 50)
        }
        .frame(height: 64) // Per DRAFT_LAYOUT.playerRowHeight
        .padding(.horizontal, Spacing.md) // 12px per SPACING.md
        .background(Color.td.bgCard)
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
    }
}
```

---

## 4. Implementation Strategy

### Best Practices Applied

#### 1. Exact Measurements
- Use exact pixel values from web CSS
- No default SwiftUI spacing
- Match all dimensions (heights, widths, padding, margins)

#### 2. Design Token Discipline
- ALL values come from constants
- No hardcoded colors, sizes, or spacing
- Single source of truth

#### 3. Component Structure
```
Feature/
├── Views/
│   ├── FeatureView.swift          # Main view
│   ├── FeatureRow.swift           # Row component
│   └── FeatureDetail.swift        # Detail view
├── Components/
│   ├── FeatureCard.swift          # Reusable card
│   └── FeatureButton.swift        # Specific button
├── ViewModels/
│   └── FeatureViewModel.swift     # State management
└── Models/
    └── Feature.swift              # Data model
```

#### 4. View Measurement Approach
- Use `.background` with `GeometryReader` for measurements
- Never put `GeometryReader` in main view tree
- Prefer fixed frames where dimensions are known

#### 5. Performance Strategy
- `LazyVStack` for all lists >20 items
- `List` when native styling acceptable
- Custom virtualization only if needed
- Profile with Instruments before optimizing

---

## 5. Screen-by-Screen Breakdown

### Screen 1: Lobby Tab

#### Web Reference
- Single featured tournament card (V3)
- Background: Dark (#101927)
- Card: 650px min height, 21px padding, 16px radius

#### SwiftUI Implementation
```
LobbyTab/
├── LobbyView.swift                 # Tab container
├── TournamentCard/
│   ├── TournamentCardV3.swift      # Main card
│   ├── TournamentTitle.swift       # Title with line break
│   ├── TournamentLogo.swift        # Logo image
│   ├── TournamentProgressBar.swift # Progress indicator
│   ├── TournamentJoinButton.swift  # Join CTA
│   └── TournamentStats.swift       # 3-column stats
└── JoinTournamentSheet.swift       # Join modal
```

#### Key Dimensions (V3)
| Element | Value |
|---------|-------|
| Card min height | 650px |
| Card padding | 21px |
| Card radius | 16px |
| Title margin top | 12px |
| Title font size | 46px |
| Spacer min height | 24px |
| Logo max height | 72px |
| Progress height | 8px |
| Button height | 57px |
| Button radius | 12px |
| Stats height | 48px |
| Stats gap | 24px |

### Screen 2: Draft Room

#### Web Reference (from constants/index.ts)
- Header (navbarHeight): 26px (content only, + safe area)
- PicksBar height: 130px
- Content: Flexible (tabs)
- Footer: 56px (tab navigation)

#### SwiftUI Implementation
```
DraftRoom/
├── DraftRoomView.swift             # Main container
├── Components/
│   ├── DraftStatusBar.swift        # Timer header (26px + safe area)
│   ├── DraftFooter.swift           # Tab bar (56px)
│   ├── PicksBar.swift              # Horizontal picks (130px)
│   └── DraftTabContent.swift       # Tab switcher
├── Tabs/
│   ├── PlayerListView.swift        # Players tab
│   ├── QueueView.swift             # Queue tab
│   ├── RosterView.swift            # Rosters tab
│   ├── DraftBoardView.swift        # Board tab
│   └── DraftInfoView.swift         # Info tab
├── PlayerComponents/
│   ├── PlayerRow.swift             # 64px row (code)
│   ├── PlayerExpandedCard.swift    # Expanded stats
│   └── PositionFilter.swift        # Filter buttons (48px bar, 64px buttons)
└── BoardComponents/
    ├── BoardGrid.swift             # 18x12 grid
    ├── BoardCell.swift             # Individual cell (72x64px)
    └── BoardHeader.swift           # Team headers (32px)
```

#### Key Dimensions (from constants/index.ts)
| Element | Code Value |
|---------|------------|
| Navbar height (content) | 26px |
| Picks bar height | 130px |
| Pick card width | 140px |
| Pick card height | 172px |
| Pick card gap | 8px |
| Footer height | 56px |
| Footer icon size | 24px |
| Player row height | 64px |
| Player row padding X | 12px |
| Filter bar height | 48px |
| Filter button width | 64px |
| Search bar height | 44px |
| Queue item height | 56px |
| Roster row height | 48px |
| Board cell width | 72px |
| Board cell height | 64px |
| Board header height | 32px |

### Screen 3: My Teams

#### Web Reference
- Team cards with position tracker
- Sort dropdown
- Expandable player details
- Playoff bracket view

#### SwiftUI Implementation
```
MyTeams/
├── MyTeamsView.swift               # Main view
├── Components/
│   ├── TeamCard.swift              # Team card
│   ├── SortDropdown.swift          # Sort controls
│   ├── PositionTracker.swift       # Position bar
│   └── PlayerRosterRow.swift       # Roster item
├── TeamDetail/
│   ├── TeamDetailView.swift        # Full team view
│   └── RosterList.swift            # 18-player list
└── Playoff/
    ├── PlayoffBracketView.swift    # Bracket
    ├── PlayoffPodView.swift        # Pod detail
    └── MatchupView.swift           # Matchup
```

### Screen 4: Profile

#### Web Reference
- Avatar/customization preview
- Balance display
- Menu items (Payment Methods, etc.)
- Settings modals

#### SwiftUI Implementation
```
Profile/
├── ProfileView.swift               # Main view
├── Components/
│   ├── AvatarBox.swift             # Customization preview
│   ├── BalanceCard.swift           # Balance display
│   └── ProfileMenuItem.swift       # Menu row
└── Settings/
    ├── ProfileSettingsSheet.swift  # Settings modal
    ├── PaymentMethodsSheet.swift   # Payment methods
    ├── TransactionHistorySheet.swift
    └── CustomizationSheet.swift
```

### Screen 5: Auth Screens

#### Web Reference
- Full-screen login/signup
- Multi-step flows
- Blue outline modal wrapper
- `/wr_blue.png` tiled background

#### SwiftUI Implementation
```
Auth/
├── AuthGateView.swift              # Auth check
├── LoginView.swift                 # Login screen
├── SignUpView.swift                # Multi-step signup
├── ForgotPasswordView.swift        # Password reset
├── Components/
│   ├── AuthTextField.swift         # Styled input
│   ├── AuthButton.swift            # Styled button
│   ├── PasswordStrength.swift      # Strength indicator
│   └── OTPInput.swift              # 6-digit code
└── Biometric/
    └── BiometricPrompt.swift       # Face ID prompt
```

---

## 6. Performance Requirements

### Targets (from Implementation Plan)

| Metric | Target |
|--------|--------|
| App launch (cold) | < 500ms |
| Player list scroll | 60fps on 3-year-old devices |
| Tap response | < 100ms feedback |
| Memory footprint | < 200MB active |
| Crash rate | Zero |

### Player List Optimization

1. **Use `LazyVStack`** — Only render visible rows
2. **Fixed row heights** — 40px normal, 220px expanded
3. **Avoid nested ForEach** — Flatten structure
4. **Memoize filtering** — Computed property caching
5. **Profile with Instruments** — Before optimizing

### Draft Board Optimization

1. **Grid structure** — Use SwiftUI `Grid` or `LazyVGrid`
2. **Cell recycling** — Let SwiftUI handle via Lazy containers
3. **Minimize redraws** — Use `.id()` for stable identity
4. **Batch updates** — Combine state changes

---

## 7. Technical Architecture

### State Management

```
App State Architecture
├── AppState (@Observable)           # Global state
│   ├── user: User?
│   ├── balance: Decimal
│   └── isAuthenticated: Bool
│
├── Router (@Observable)             # Navigation
│   ├── path: NavigationPath
│   ├── activeSheet: Sheet?
│   └── fullScreenCover: Cover?
│
└── Feature ViewModels (@Observable) # Per-feature
    ├── LobbyViewModel
    ├── DraftRoomViewModel
    ├── MyTeamsViewModel
    └── ProfileViewModel
```

### Data Flow

```
Firebase/API → Service → ViewModel → View
                 ↓
              Model (Codable)
```

### Networking

```swift
// Services
protocol TournamentServiceProtocol {
    func fetchTournaments() async throws -> [Tournament]
    func joinTournament(id: String, entries: Int) async throws
}

protocol DraftServiceProtocol {
    func subscribeToDraft(roomId: String) -> AsyncStream<DraftState>
    func makePick(playerId: String) async throws
    func updateQueue(playerIds: [String]) async throws
}
```

---

## 8. Phase Breakdown

### Phase 1: Design System (3-5 days)
- [ ] Colors.swift — Exact hex values from web
- [ ] Typography.swift — Font sizes and weights
- [ ] Spacing.swift — All spacing tokens
- [ ] Haptics.swift — Feedback patterns
- [ ] Core components (TDButton, TDCard, TDTextField)
- [ ] Position badges
- [ ] Loading skeletons

### Phase 2: Tab Shell (2-3 days)
- [ ] Custom TabBar (not native TabView)
- [ ] Tab switching with haptics
- [ ] Header component
- [ ] Safe area handling
- [ ] Basic navigation structure

### Phase 3: Lobby Tab (5-7 days)
- [ ] TournamentCardV3 — Exact replica
- [ ] TournamentTitle with line breaking
- [ ] TournamentProgressBar with tiled background
- [ ] TournamentJoinButton with tiled background
- [ ] TournamentStats grid
- [ ] JoinTournamentSheet modal
- [ ] Tournament data service

### Phase 4: Draft Room — Structure (3-5 days)
- [ ] DraftRoomView container
- [ ] DraftStatusBar (timer, status)
- [ ] DraftFooter (tab navigation)
- [ ] Tab content switcher
- [ ] Scroll position preservation

### Phase 5: Draft Room — Player List (7-10 days)
- [ ] PlayerRow (40px height, exact columns)
- [ ] Position filter buttons
- [ ] Search bar
- [ ] Sortable columns
- [ ] LazyVStack virtualization
- [ ] PlayerExpandedCard (stats tables)
- [ ] Queue button with state

### Phase 6: Draft Room — Queue & Roster (5-7 days)
- [ ] QueueView with reorder
- [ ] RosterView with team selector
- [ ] Roster slots (9 starters + 9 bench)
- [ ] Position badges
- [ ] Expandable player details

### Phase 7: Draft Room — Board & Picks (7-10 days)
- [ ] DraftBoard (18×12 grid)
- [ ] BoardCell (92×62px)
- [ ] Snake draft ordering
- [ ] User column highlighting
- [ ] Position tracker bars
- [ ] PicksBar horizontal scroll
- [ ] Auto-scroll to current pick

### Phase 8: Draft Room — Timer & Logic (5-7 days)
- [ ] Timer countdown
- [ ] Timer urgency states (normal/warning/critical)
- [ ] Grace period handling
- [ ] Shake animation on expire
- [ ] Pick submission
- [ ] Real-time updates via Firestore

### Phase 9: My Teams (5-7 days)
- [ ] Team cards
- [ ] Sort functionality
- [ ] Team detail view
- [ ] Roster display
- [ ] Playoff bracket

### Phase 10: Profile & Settings (5-7 days)
- [ ] Profile view
- [ ] Balance display
- [ ] Menu items
- [ ] Settings sheets
- [ ] Customization preview

### Phase 11: Auth Screens (5-7 days)
- [ ] Login screen
- [ ] Sign up multi-step flow
- [ ] Forgot password
- [ ] Biometric prompt
- [ ] Apple Sign In
- [ ] Firebase Auth integration

### Phase 12: Payments (5-7 days)
- [ ] Deposit modal
- [ ] Stripe integration
- [ ] Apple Pay
- [ ] Withdraw modal
- [ ] Transaction history

### Phase 13: Live Activities (3-5 days)
- [ ] Integrate existing Swift code
- [ ] Dynamic Island compact view
- [ ] Dynamic Island expanded view
- [ ] Lock screen Live Activity

### Phase 14: Polish & Testing (7-10 days)
- [ ] Performance profiling
- [ ] Memory optimization
- [ ] Accessibility audit
- [ ] Edge case testing
- [ ] Device testing (various iPhones)
- [ ] TestFlight beta

### Phase 15: App Store (3-5 days)
- [ ] Screenshots
- [ ] App preview video
- [ ] Metadata
- [ ] Submission
- [ ] Review response

---

---

## Appendix A: Draft Room Visual Reference

**Source:** Screenshot from web app in phone frame (Jan 31, 2026)  
**Screenshot location:** `/Users/td.d/.cursor/projects/Users-td-d-Documents-bestball-site/assets/Screenshot_2026-01-31_at_5.02.02_AM-06dcd837-7f4b-4470-bdef-c91c77ed85fe.png`

**IMPORTANT:** The web app was rendered in a simulated phone frame. All pixel values in the code are correct, but iOS implementation will need safe area adjustments:
- The simulated frame did not have actual iOS safe areas (Dynamic Island, home indicator)
- Elements are correctly sized; only their position relative to safe areas needs fine-tuning

### A.1 Header (DraftStatusBar)

**From constants/index.ts: `DRAFT_LAYOUT.navbarHeight = 26`** (content only, safe area added)

| Element | Specification |
|---------|--------------|
| Content height | 26px (code) |
| Total with safe area | 26px + safe-area-inset-top |
| Background | Dark (#101927) |
| Back chevron | White, left aligned, ~24px |
| Timer | "23" - large monospace, bold, centered |
| Timer font | ~36-40px, bold, monospace |

### A.2 Picks Bar (Horizontal Scroll)

**From constants/index.ts:**
- `picksBarHeight: 130`
- `pickCardWidth: 140`
- `pickCardHeight: 172`
- `pickCardGap: 8` (SPACING.sm)

| Element | Specification |
|---------|--------------|
| Bar height | 130px (code) |
| Card width | 140px (code) |
| Card height | 172px (code) |
| Card spacing | 8px gap (code) |
| Card radius | ~8px |
| Card background (default) | Gray (#374151) |

#### User's Pick Card (with pick made)
- **Border:** 2-3px yellow/gold (#FBBF25)
- **Username:** Top, truncated, white, ~11px
- **Pick number:** "1.01" left, position "WR" right (same line, ~10px)
- **Player name:** "Ja'Marr Chase" centered, bold, white, ~14px
- **Team:** "CIN" centered, gray (#9ca3af), ~11px
- **Position tracker:** Bottom bar showing position distribution gradient

#### "On The Clock" Card
- **Border:** None (gray border)
- **Text:** "On The Clock" centered, white, ~13px
- **No player info**

#### Future Pick Cards
- **Border:** None
- **Just pick number visible**

### A.3 Position Filter Buttons

**From constants/index.ts:**
- `filterBarHeight: 48`
- `filterButtonWidth: 64`

| Element | Specification |
|---------|--------------|
| Bar height | 48px (code) |
| Button width | 64px (code) |
| Button height | ~40px (visual) |
| Border width | 2px |
| Border radius | ~8px (rounded rectangle) |
| Background | Dark (#1f2937) |
| Spacing | ~8px gap |

**Position Colors (from core/constants/colors.ts - LOCKED per memory #4753963):**

| Position | Border/Badge Color | Hex |
|----------|-------------------|-----|
| QB | Pink | #F472B6 |
| RB | Green | #0fba80 |
| WR | Yellow | #FBBF25 |
| TE | Purple | #7C3AED |
| BN | Gray | #6B7280 |

**Filter Button Logic:**
- Border shows position color when count > 0
- Border shows gray (#6B7280) when count = 0
- Format: `[POS] [count]` (e.g., "WR 1")

### A.4 Search Bar

**From constants/index.ts: `DRAFT_LAYOUT.searchBarHeight = 44`**

| Element | Specification |
|---------|--------------|
| Height | 44px (code) |
| Background | Dark (#1f2937) |
| Border | Subtle (rgba(255,255,255,0.1)) |
| Border radius | ~8px |
| Padding horizontal | ~16px |
| Icon | Magnifying glass, gray, ~18px |
| Placeholder | "Search..." gray (#6b7280) |
| Clear button | "Clear" text, right aligned |

### A.5 Column Headers

| Element | Specification |
|---------|--------------|
| Height | ~32px |
| "ADP" | Left aligned |
| "PROJ" | Right area |
| "RANK" | Right area |
| Text color | Gray (#6b7280) |
| Font size | ~12px |
| Font weight | Medium/semibold |

### A.6 Player List Rows

**From constants/index.ts:**
- `playerRowHeight: 64`
- `playerRowPaddingX: 12` (SPACING.md)
- `filterBarHeight: 48`
- `filterButtonWidth: 64`

| Element | Specification |
|---------|--------------|
| Row height | 64px (code) |
| Row background | Dark (#1f2833) |
| Row separator | 1px rgba(255,255,255,0.1) |
| Padding horizontal | 12px (code: SPACING.md) |
| Filter bar height | 48px (code) |
| Filter button width | 64px (code) |

#### Row Layout (Left to Right)
1. **ADP Column** (~50px width)
   - Value: "7.1", "12.5", etc.
   - Color: Gray (#9ca3af)
   - Font: ~14px, regular
   - Alignment: Left

2. **Player Info** (flex/fill)
   - **Name:** "Malik Nabers" - white, bold, ~15-16px
   - **Subline:** Position badge + Team + Bye
   - **Spacing:** ~4px between name and subline

3. **Queue Button** (~40px)
   - Circle diameter: ~32px
   - Background: Dark (#374151)
   - Icon: "+" white/gray, ~16px
   - Border: 1px subtle

4. **PROJ Column** (~50px)
   - Value: "317", "314", etc.
   - Color: White
   - Font: ~14px
   - Alignment: Center

5. **RANK Column** (~50px)
   - Value: "1", "2", "3", etc.
   - Color: Gray (#9ca3af)
   - Font: ~14px
   - Alignment: Center

### A.7 Position Badges

| Position | Background | Text Color |
|----------|-----------|------------|
| QB | Pink (#F472B6) | Dark |
| RB | Green (#0fba80) | Dark |
| WR | Yellow (#FBBF25) | Dark |
| TE | Purple (#7C3AED) | White |

| Element | Specification |
|---------|--------------|
| Height | ~20px |
| Min width | ~28px |
| Padding | 4px 8px |
| Border radius | Full (pill shape) |
| Font size | ~11px |
| Font weight | Semibold |
| Text transform | Uppercase |

### A.8 Footer Tab Bar (Draft Room)

**From constants/index.ts:**
- `footerHeight: 56`
- `footerIconSize: 24`

| Element | Specification |
|---------|--------------|
| Height | 56px (code) |
| Icon size | 24px (code) |
| Background | Dark (#101927) |
| Tab count | 5 |
| Active color | Blue (#1DA1F2) |
| Inactive color | Gray (#6b7280) |

**From constants/index.ts: `DRAFT_TABS`**
| Tab | ID | Label | Icon |
|-----|-----|-------|------|
| 1 | players | "Players" | user |
| 2 | queue | "Queue" | plus |
| 3 | rosters | "Rosters" | list |
| 4 | board | "Board" | grid |
| 5 | info | "Info" | info |

### A.9 Position Tracker Bar (in Pick Cards)

| Element | Specification |
|---------|--------------|
| Height | ~6-8px |
| Width | Full card width (minus padding) |
| Background | Dark (#374151) |
| Border radius | ~3px |
| Segments | Colored fills for QB/RB/WR/TE based on roster composition |

---

## Appendix B: Safe Area Considerations

### iOS Safe Areas to Handle

1. **Top Safe Area (Dynamic Island / Notch)**
   - iPhone 14 Pro+: 59px
   - iPhone 14/13/12: 47px
   - iPhone SE: 20px

2. **Bottom Safe Area (Home Indicator)**
   - Devices with home indicator: 34px
   - Devices with home button: 0px

### Implementation Approach

```swift
// Use GeometryReader sparingly, prefer SafeAreaInsets
struct DraftRoomView: View {
    var body: some View {
        VStack(spacing: 0) {
            // Header respects top safe area automatically
            DraftStatusBar()
            
            // Content fills remaining space
            DraftContent()
            
            // Footer above home indicator
            DraftFooter()
        }
        .ignoresSafeArea(.container, edges: .bottom) // For custom footer handling
    }
}
```

### Key Adjustments from Web Frame

1. **Top:** Web frame simulated ~44px status bar. iOS will use actual safe area.
2. **Bottom:** Web frame had no home indicator. iOS needs 34px bottom padding on newer devices.
3. **Keyboard:** Not simulated in web. iOS needs keyboard avoidance.

---

## Appendix C: Lobby Tab Visual Reference

**Screenshot:** `Screenshot_2026-01-31_at_5.06.31_AM-141d5b77-5d20-433b-a3c6-0fc165b4a406.png`

### C.1 Tournament Card (TournamentCardV3)

| Element | Specification |
|---------|--------------|
| Background | Blue tiled pattern (`/wr_blue.png`) |
| Border | ~4px blue outline (#1E3A5F or similar) |
| Border radius | ~16px |
| Padding | 21px (from code) |

#### Title
- Text: "THE TOPDOG INTERNATIONAL"
- Color: White (#FFFFFF)
- Font: Large, bold, uppercase
- Text shadow: Yes (for depth)
- Line break: After "TOPDOG" (smart word wrap)
- Alignment: Center

#### Logo
- Position: Centered
- Type: Globe image
- Max height: 72px (from code)

#### Progress Bar
- Height: 8px (from code)
- Background: Dark/transparent
- Fill: White/light gradient
- Border radius: ~4px
- Width: Full card width (minus padding)

#### Join Button
- Text: "Join Tournament"
- Background: Light blue/cyan (#4DB5F5 or similar)
- Height: 57px (from code)
- Border radius: 12px (from code)
- Font: 18px, semibold
- Color: White

#### Stats Row
| Column | Value | Label |
|--------|-------|-------|
| 1 | $25 | ENTRY |
| 2 | 571,480 | ENTRIES |
| 3 | $2.1M | 1ST PLACE |

- Layout: 3-column grid
- Value font: ~16px, bold, white
- Label font: ~11px, uppercase, gray (#9ca3af)
- Row height: 48px (from code)

### C.2 Main Tab Bar (App-level)

| Element | Specification |
|---------|--------------|
| Tabs | 5: Lobby, Live Drafts, Teams, Exposure, Profile |
| Active indicator | Blue color (#1DA1F2) |
| Inactive color | Gray (#6b7280) |
| Icons | Home, Lightning, People, Chart, Person |
| Height | ~56px + home indicator |

---

## Appendix D: Exposure Tab Visual Reference

**Screenshot:** `Screenshot_2026-01-31_at_5.06.48_AM-e24ce091-8821-43fb-8fce-2ce194db5f3c.png`

### D.1 Search Bar

| Element | Specification |
|---------|--------------|
| Height | ~44px |
| Background | Dark gray (#374151) |
| Border radius | ~8px |
| Icon | Magnifying glass, left |
| Placeholder | "Search..." gray |
| Padding | ~16px horizontal |

### D.2 Position Filter Tabs

| Element | Specification |
|---------|--------------|
| Layout | 4 equal-width buttons in a row |
| Buttons | QB, RB, WR, TE |
| Background | Dark (inactive) |
| Active state | Position color border/fill |
| Height | ~32-36px |
| Gap | ~8px |

### D.3 Column Header

| Element | Specification |
|---------|--------------|
| Text | "EXP%" |
| Alignment | Right |
| Color | Gray (#6b7280) |
| Font | ~12px, medium weight |

### D.4 Exposure List Rows

| Element | Specification |
|---------|--------------|
| Row height | ~56px |
| Background | Dark (#1f2833) |
| Separator | 1px rgba(255,255,255,0.1) |

#### Row Layout
1. **Player Name** (left, flex)
   - Font: ~15px, semibold, white
   
2. **Position Badge + Team** (below name)
   - Badge: Colored pill (WR=yellow, RB=green, TE=purple, QB=pink)
   - Team: ~12px, gray, 3-letter code

3. **Exposure %** (right)
   - Format: "52%"
   - Font: ~16px, medium, white
   - Alignment: Right

### D.5 Sample Data (for reference)

| Player | Position | Team | EXP% |
|--------|----------|------|------|
| Ja'Marr Chase | WR | CIN | 52% |
| CeeDee Lamb | WR | DAL | 47% |
| Amon-Ra St. Brown | WR | DET | 45% |
| Bijan Robinson | RB | ATL | 39% |
| Breece Hall | RB | NYJ | 36% |
| Garrett Wilson | WR | NYJ | 35% |
| Tyreek Hill | WR | MIA | 33% |
| Puka Nacua | WR | LAR | 31% |
| Travis Kelce | TE | KC | 29% |
| Josh Allen | QB | BUF | 27% |
| Saquon Barkley | RB | PHI | 26% |

---

## Appendix E: Screenshot Inventory

| Screen | Filename | Location |
|--------|----------|----------|
| Draft Room (Players Tab) | `Screenshot_2026-01-31_at_5.02.02_AM-*.png` | assets/ |
| Lobby Tab | `Screenshot_2026-01-31_at_5.06.31_AM-*.png` | assets/ |
| Exposure Tab | `Screenshot_2026-01-31_at_5.06.48_AM-*.png` | assets/ |
| Draft Room (Board Tab) | `Screenshot_2026-01-31_at_3.03.54_PM-*.png` | assets/ |
| Auth - Sign Up | `Screenshot_2026-01-31_at_3.05.18_PM-*.png` | assets/ |
| Auth - Sign In | `Screenshot_2026-01-31_at_3.05.24_PM-*.png` | assets/ |
| Auth - Forgot Password | `Screenshot_2026-01-31_at_3.05.32_PM-*.png` | assets/ |
| Settings - Profile Tab | `Screenshot_2026-01-31_at_3.05.41_PM-*.png` | assets/ |
| Settings - Draft Alerts | `Screenshot_2026-01-31_at_3.05.50_PM-*.png` | assets/ |
| Settings - Security | `Screenshot_2026-01-31_at_3.05.58_PM-*.png` | assets/ |
| Lobby Tab Sandbox (Dev) | `Screenshot_2026-01-31_at_3.06.20_PM-*.png` | assets/ |
| Lobby Card (Clean) | `Screenshot_2026-01-30_at_2.41.02_PM-*.png` | assets/ |
| Lobby Card (Alt) | `Screenshot_2026-01-30_at_2.42.39_PM-*.png` | assets/ |
| Globe Asset | `image-fa86b81e-*.png` | assets/ |

**Screens still needed for complete reference:**
- [ ] Live Drafts Tab
- [ ] Teams Tab (My Teams)
- [ ] Profile Tab (main, not settings)
- [ ] Join Tournament Modal
- [ ] Draft Room - Queue Tab
- [ ] Draft Room - Roster Tab
- [ ] Draft Room - Info Tab
- [ ] Deposit Modal

---

## Summary

### Total Estimated Scope
- **Design System + Shell:** 1-2 weeks
- **Lobby:** 1 week
- **Draft Room:** 4-5 weeks
- **My Teams + Profile:** 2 weeks
- **Auth + Payments:** 2 weeks
- **Polish + Launch:** 2 weeks

**Total:** ~12-14 weeks for pixel-perfect implementation

### Critical Success Factors

1. **Exact measurements** — Every pixel matters
2. **Design tokens** — No hardcoded values
3. **Performance** — 60fps scrolling non-negotiable
4. **Testing** — On real devices, not just simulator
5. **Iteration** — Compare against web constantly

### Next Steps

1. Screenshot inventory of every web screen
2. Extract exact CSS values for each component
3. Begin Phase 1: Design System
4. Build component by component, matching exactly

---

## Appendix F: Swift Data Models

### F.1 Core Models

```swift
// Models/Player.swift
import Foundation

struct Player: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let firstName: String
    let lastName: String
    let position: Position
    let team: String
    let byeWeek: Int
    let adp: Double
    let projectedPoints: Double
    let rank: Int
    let headshotURL: String?
    
    // Stats (optional, loaded on expand)
    var stats: PlayerStats?
}

enum Position: String, Codable, CaseIterable {
    case qb = "QB"
    case rb = "RB"
    case wr = "WR"
    case te = "TE"
    case flex = "FLEX"
    case bench = "BN"
    
    var color: Color {
        switch self {
        case .qb: return Color(hex: "#F472B6")
        case .rb: return Color(hex: "#0fba80")
        case .wr: return Color(hex: "#FBBF25")
        case .te: return Color(hex: "#7C3AED")
        case .flex, .bench: return Color(hex: "#6B7280")
        }
    }
}

struct PlayerStats: Codable {
    let seasons: [SeasonStats]
}

struct SeasonStats: Codable {
    let year: Int
    let games: Int
    let passingYards: Int?
    let passingTDs: Int?
    let rushingYards: Int?
    let rushingTDs: Int?
    let receivingYards: Int?
    let receivingTDs: Int?
    let receptions: Int?
    let targets: Int?
}
```

```swift
// Models/Tournament.swift
import Foundation

struct Tournament: Codable, Identifiable {
    let id: String
    let title: String
    let entryFeeCents: Int
    let currentEntries: Int
    let maxEntries: Int // 0 = unlimited
    let firstPlacePrizeCents: Int
    let totalPrizeCents: Int
    let draftSpeed: DraftSpeed
    let status: TournamentStatus
    let logoURL: String?
    let backgroundURL: String?
    
    var entryFeeFormatted: String {
        "$\(entryFeeCents / 100)"
    }
    
    var firstPlaceFormatted: String {
        let dollars = firstPlacePrizeCents / 100
        if dollars >= 1_000_000 {
            return "$\(String(format: "%.1f", Double(dollars) / 1_000_000))M"
        } else if dollars >= 1_000 {
            return "$\(dollars / 1000)K"
        }
        return "$\(dollars)"
    }
}

enum DraftSpeed: String, Codable {
    case fast = "fast"      // 30 seconds
    case slow = "slow"      // 12 hours
}

enum TournamentStatus: String, Codable {
    case open = "open"
    case filling = "filling"
    case full = "full"
    case drafting = "drafting"
    case complete = "complete"
}
```

```swift
// Models/DraftRoom.swift
import Foundation

struct DraftRoom: Codable, Identifiable {
    let id: String
    let tournamentId: String
    let status: DraftRoomStatus
    let currentPickNumber: Int
    let totalPicks: Int // typically 216 (12 teams × 18 rounds)
    let pickTimeSeconds: Int
    let participants: [Participant]
    let picks: [DraftPick]
    
    var currentRound: Int {
        (currentPickNumber - 1) / participants.count + 1
    }
    
    var currentPickInRound: Int {
        ((currentPickNumber - 1) % participants.count) + 1
    }
}

enum DraftRoomStatus: String, Codable {
    case waiting = "waiting"
    case countdown = "countdown"
    case active = "active"
    case paused = "paused"
    case complete = "complete"
}

struct Participant: Codable, Identifiable {
    let id: String
    let odaId: String // TopDog user ID
    let username: String
    let index: Int // 0-11 for position in draft
    let isUser: Bool // Is this the current user?
    var picks: [DraftPick]
    
    var rosterByPosition: [Position: [Player]] {
        // Computed from picks
        Dictionary(grouping: picks.map(\.player), by: \.position)
    }
}

struct DraftPick: Codable, Identifiable {
    let id: String
    let pickNumber: Int
    let round: Int
    let pickInRound: Int
    let participantId: String
    let participantIndex: Int
    let player: Player
    let timestamp: Date
}
```

```swift
// Models/User.swift
import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String?
    let username: String
    let balanceCents: Int
    let createdAt: Date
    let emailVerified: Bool
    
    var balanceFormatted: String {
        String(format: "$%.2f", Double(balanceCents) / 100)
    }
}

struct UserProfile: Codable {
    let userId: String
    let displayName: String?
    let avatarURL: String?
    let country: String?
    let preferences: UserPreferences
}

struct UserPreferences: Codable {
    var draftAlerts: DraftAlertPreferences
    var biometricsEnabled: Bool
}

struct DraftAlertPreferences: Codable {
    var roomFilled: Bool
    var draftStarting: Bool
    var twoPicksAway: Bool
    var onTheClock: Bool
    var tenSecondsRemaining: Bool
    var slowDraftEmailUpdates: Bool
}
```

### F.2 Queue Model

```swift
// Models/DraftQueue.swift
import Foundation

struct QueuedPlayer: Codable, Identifiable {
    let id: String // Same as player.id
    let player: Player
    let queuedAt: Date
    var queuePosition: Int
}

// Persisted to UserDefaults
struct DraftQueueState: Codable {
    let draftRoomId: String
    var players: [QueuedPlayer]
}
```

---

## Appendix G: Firebase Integration

### G.1 Firestore Collections Structure

```
firestore/
├── users/
│   └── {userId}/
│       ├── profile: UserProfile
│       ├── balance: Int (cents)
│       └── teams/
│           └── {teamId}: Team
│
├── tournaments/
│   └── {tournamentId}: Tournament
│
├── draftRooms/
│   └── {roomId}/
│       ├── status: DraftRoomStatus
│       ├── currentPick: Int
│       ├── participants/
│       │   └── {participantId}: Participant
│       └── picks/
│           └── {pickId}: DraftPick
│
└── players/
    └── {playerId}: Player (static data, cached)
```

### G.2 Real-Time Subscriptions (Swift)

```swift
// Services/DraftRoomService.swift
import FirebaseFirestore

@Observable
class DraftRoomService {
    private let db = Firestore.firestore()
    private var listeners: [ListenerRegistration] = []
    
    var draftRoom: DraftRoom?
    var picks: [DraftPick] = []
    var error: Error?
    
    func subscribe(roomId: String) {
        // Listen to draft room document
        let roomListener = db.collection("draftRooms")
            .document(roomId)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let data = snapshot?.data() else { return }
                self?.draftRoom = try? Firestore.Decoder().decode(DraftRoom.self, from: data)
            }
        listeners.append(roomListener)
        
        // Listen to picks subcollection
        let picksListener = db.collection("draftRooms")
            .document(roomId)
            .collection("picks")
            .order(by: "pickNumber")
            .addSnapshotListener { [weak self] snapshot, error in
                guard let documents = snapshot?.documents else { return }
                self?.picks = documents.compactMap { doc in
                    try? doc.data(as: DraftPick.self)
                }
            }
        listeners.append(picksListener)
    }
    
    func unsubscribe() {
        listeners.forEach { $0.remove() }
        listeners.removeAll()
    }
    
    func makePick(roomId: String, playerId: String) async throws {
        // Call API endpoint (picks are validated server-side)
        let url = URL(string: "\(APIConfig.baseURL)/api/draft/\(roomId)/pick")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["playerId": playerId])
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw DraftError.pickFailed
        }
    }
}
```

### G.3 Firebase Auth (Swift)

```swift
// Services/AuthService.swift
import FirebaseAuth

@Observable
class AuthService {
    static let shared = AuthService()
    
    private(set) var user: FirebaseAuth.User?
    private(set) var isAuthenticated = false
    private(set) var isLoading = true
    
    private var authStateListener: AuthStateDidChangeListenerHandle?
    
    init() {
        authStateListener = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.user = user
            self?.isAuthenticated = user != nil
            self?.isLoading = false
        }
    }
    
    func signIn(email: String, password: String) async throws {
        try await Auth.auth().signIn(withEmail: email, password: password)
    }
    
    func signUp(email: String, password: String) async throws {
        try await Auth.auth().createUser(withEmail: email, password: password)
    }
    
    func signInWithApple(credential: AuthCredential) async throws {
        try await Auth.auth().signIn(with: credential)
    }
    
    func signOut() throws {
        try Auth.auth().signOut()
    }
    
    func sendPasswordReset(email: String) async throws {
        try await Auth.auth().sendPasswordReset(withEmail: email)
    }
    
    var idToken: String? {
        get async {
            try? await user?.getIDToken()
        }
    }
}
```

### G.4 API Client

```swift
// Core/Networking/APIClient.swift
import Foundation

actor APIClient {
    static let shared = APIClient()
    
    private let baseURL = "https://api.topdog.dog" // or your domain
    private let session = URLSession.shared
    
    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Encodable? = nil
    ) async throws -> T {
        var url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = method
        
        // Add auth token
        if let token = await AuthService.shared.idToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard 200..<300 ~= httpResponse.statusCode else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
}

enum APIError: Error {
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError
}
```

---

## Appendix H: Push Notifications & Live Activities

### H.1 Push Notification Payloads

```json
// Your turn to pick
{
  "aps": {
    "alert": {
      "title": "Your Turn!",
      "body": "Pick 2.05 - 30 seconds to draft"
    },
    "sound": "default",
    "badge": 1,
    "category": "DRAFT_PICK",
    "content-available": 1
  },
  "data": {
    "type": "on_the_clock",
    "roomId": "abc123",
    "pickNumber": 17,
    "timeRemaining": 30
  }
}

// Two picks away
{
  "aps": {
    "alert": {
      "title": "2 Picks Away",
      "body": "Get ready - THE TOPDOG INTERNATIONAL"
    },
    "sound": "default"
  },
  "data": {
    "type": "picks_away",
    "roomId": "abc123",
    "picksAway": 2
  }
}

// Draft starting
{
  "aps": {
    "alert": {
      "title": "Draft Starting",
      "body": "THE TOPDOG INTERNATIONAL is starting now!"
    },
    "sound": "default"
  },
  "data": {
    "type": "draft_starting",
    "roomId": "abc123"
  }
}
```

### H.2 Live Activity Integration

```swift
// LiveActivities/DraftTimerAttributes.swift
import ActivityKit
import SwiftUI

struct DraftTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timeRemaining: Int
        var pickNumber: Int
        var round: Int
        var pickInRound: Int
        var isMyTurn: Bool
        var currentPlayerName: String?
        var currentPlayerPosition: String?
    }
    
    var tournamentName: String
    var roomId: String
}
```

```swift
// Services/LiveActivityService.swift
import ActivityKit

class LiveActivityService {
    static let shared = LiveActivityService()
    
    private var currentActivity: Activity<DraftTimerAttributes>?
    
    func startDraftActivity(
        tournamentName: String,
        roomId: String,
        initialState: DraftTimerAttributes.ContentState
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        
        let attributes = DraftTimerAttributes(
            tournamentName: tournamentName,
            roomId: roomId
        )
        
        do {
            currentActivity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialState, staleDate: nil),
                pushType: .token
            )
        } catch {
            print("Failed to start Live Activity: \(error)")
        }
    }
    
    func updateActivity(state: DraftTimerAttributes.ContentState) {
        Task {
            await currentActivity?.update(
                ActivityContent(state: state, staleDate: nil)
            )
        }
    }
    
    func endActivity() {
        Task {
            await currentActivity?.end(nil, dismissalPolicy: .immediate)
            currentActivity = nil
        }
    }
}
```

### H.3 Push Notification Handler

```swift
// App/NotificationHandler.swift
import UserNotifications

class NotificationHandler: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationHandler()
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        
        guard let type = userInfo["type"] as? String,
              let roomId = userInfo["roomId"] as? String else { return }
        
        switch type {
        case "on_the_clock", "picks_away", "draft_starting":
            // Navigate to draft room
            await MainActor.run {
                AppRouter.shared.navigate(to: .draftRoom(roomId: roomId))
            }
        default:
            break
        }
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        // Show banner even when app is in foreground
        return [.banner, .sound, .badge]
    }
}
```

---

## Appendix I: App Store Checklist

### I.1 Required App Icons

| Size | Scale | Usage |
|------|-------|-------|
| 1024×1024 | 1x | App Store |
| 180×180 | 3x | iPhone App |
| 120×120 | 2x | iPhone App |
| 167×167 | 2x | iPad Pro App |
| 152×152 | 2x | iPad App |
| 76×76 | 1x | iPad App |
| 120×120 | 3x | iPhone Spotlight |
| 80×80 | 2x | iPhone Spotlight |
| 87×87 | 3x | iPhone Settings |
| 58×58 | 2x | iPhone Settings |
| 40×40 | 2x | iPhone Notification |
| 60×60 | 3x | iPhone Notification |

### I.2 Screenshot Sizes

| Device | Size | Required |
|--------|------|----------|
| iPhone 6.7" | 1290×2796 | Yes |
| iPhone 6.5" | 1284×2778 | Yes |
| iPhone 5.5" | 1242×2208 | Yes |
| iPad Pro 12.9" | 2048×2732 | If iPad supported |
| iPad Pro 11" | 1668×2388 | If iPad supported |

### I.3 App Store Metadata

```yaml
App Name: TopDog Fantasy
Subtitle: Best Ball Draft Contests
Category: Sports
Secondary Category: Games (Strategy)

Keywords (100 chars max):
fantasy football, best ball, draft, NFL, contests, prizes, daily fantasy, DFS

Description (4000 chars max):
[Write compelling description highlighting:
- What TopDog is (best ball fantasy football)
- Key features (live drafts, prizes, Dynamic Island)
- Why it's better (buttery smooth, world-class UX)
]

What's New (for updates):
[Release notes for each version]

Privacy Policy URL: https://topdog.dog/privacy
Support URL: https://topdog.dog/support
Marketing URL: https://topdog.dog
```

### I.4 App Review Checklist

- [ ] Demo account credentials (for reviewers to test)
- [ ] Age rating questionnaire completed
- [ ] Export compliance (uses encryption? HTTPS = yes)
- [ ] Content rights documentation (if using NFL content)
- [ ] Gambling compliance (varies by jurisdiction)
- [ ] In-app purchases configured (if any)
- [ ] Subscription terms (if applicable)

### I.5 Certificates & Provisioning

```
Required Certificates:
├── Apple Development (for dev builds)
├── Apple Distribution (for App Store)
└── Apple Push Services (for notifications)

Provisioning Profiles:
├── TopDog Dev (Development)
├── TopDog AdHoc (TestFlight internal)
└── TopDog AppStore (App Store distribution)

Capabilities to Enable:
├── Push Notifications
├── Sign in with Apple
├── Associated Domains (for Universal Links)
├── App Groups (for Widget/Live Activity data sharing)
└── Background Modes (remote notifications)
```

---

## Appendix J: Deep Linking & Navigation

### J.1 URL Scheme

```
topdog://                           → App home (lobby)
topdog://lobby                      → Lobby tab
topdog://draft/{roomId}             → Enter draft room
topdog://teams                      → My Teams tab
topdog://teams/{teamId}             → Team detail
topdog://exposure                   → Exposure tab
topdog://profile                    → Profile tab
topdog://deposit                    → Open deposit modal
```

### J.2 Universal Links (AASA)

```json
// apple-app-site-association (hosted at topdog.dog/.well-known/)
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.dog.topdog.app",
        "paths": [
          "/draft/*",
          "/tournament/*",
          "/teams/*",
          "/invite/*"
        ]
      }
    ]
  }
}
```

### J.3 Navigation Router

```swift
// App/AppRouter.swift
import SwiftUI

@Observable
class AppRouter {
    static let shared = AppRouter()
    
    var selectedTab: AppTab = .lobby
    var navigationPath = NavigationPath()
    var activeSheet: AppSheet?
    var activeFullScreenCover: AppFullScreenCover?
    
    enum AppTab: String, CaseIterable {
        case lobby, liveDrafts, teams, exposure, profile
    }
    
    enum AppSheet: Identifiable {
        case joinTournament(Tournament)
        case deposit
        case settings
        
        var id: String {
            switch self {
            case .joinTournament(let t): return "join-\(t.id)"
            case .deposit: return "deposit"
            case .settings: return "settings"
            }
        }
    }
    
    enum AppFullScreenCover: Identifiable {
        case draftRoom(roomId: String)
        case auth
        
        var id: String {
            switch self {
            case .draftRoom(let id): return "draft-\(id)"
            case .auth: return "auth"
            }
        }
    }
    
    func navigate(to destination: AppFullScreenCover) {
        activeFullScreenCover = destination
    }
    
    func handleDeepLink(_ url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true) else { return }
        
        let path = components.path
        
        if path.hasPrefix("/draft/") {
            let roomId = String(path.dropFirst("/draft/".count))
            navigate(to: .draftRoom(roomId: roomId))
        } else if path == "/deposit" {
            activeSheet = .deposit
        }
        // ... handle other paths
    }
}
```

---

## Appendix K: Error Handling

### K.1 Error Types

```swift
// Core/Errors/AppError.swift
import Foundation

enum AppError: LocalizedError {
    // Network
    case networkUnavailable
    case serverError(statusCode: Int)
    case timeout
    
    // Auth
    case notAuthenticated
    case sessionExpired
    case invalidCredentials
    
    // Draft
    case draftNotFound
    case notYourTurn
    case playerAlreadyDrafted
    case invalidPick
    case draftComplete
    
    // Payment
    case insufficientBalance
    case paymentFailed(reason: String)
    
    // General
    case unknown(Error)
    
    var errorDescription: String? {
        switch self {
        case .networkUnavailable:
            return "No internet connection"
        case .serverError(let code):
            return "Server error (\(code))"
        case .notYourTurn:
            return "It's not your turn to pick"
        case .playerAlreadyDrafted:
            return "This player has already been drafted"
        case .insufficientBalance:
            return "Insufficient balance"
        default:
            return "Something went wrong"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .networkUnavailable:
            return "Check your connection and try again"
        case .sessionExpired:
            return "Please sign in again"
        case .insufficientBalance:
            return "Add funds to continue"
        default:
            return "Please try again"
        }
    }
}
```

### K.2 Error UI Component

```swift
// Core/Components/ErrorView.swift
struct ErrorView: View {
    let error: AppError
    let onRetry: (() -> Void)?
    let onDismiss: (() -> Void)?
    
    var body: some View {
        VStack(spacing: Spacing.lg) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundColor(.td.stateWarning)
            
            Text(error.errorDescription ?? "Something went wrong")
                .font(.td.headline)
                .foregroundColor(.td.textPrimary)
                .multilineTextAlignment(.center)
            
            if let suggestion = error.recoverySuggestion {
                Text(suggestion)
                    .font(.td.body)
                    .foregroundColor(.td.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            HStack(spacing: Spacing.md) {
                if let onDismiss {
                    Button("Dismiss") { onDismiss() }
                        .buttonStyle(TDButtonStyle.secondary)
                }
                
                if let onRetry {
                    Button("Try Again") { onRetry() }
                        .buttonStyle(TDButtonStyle.primary)
                }
            }
        }
        .padding(Spacing.xl)
    }
}
```

---

**Document Status:** Complete  
**Ready for:** Implementation  
**Reference:** Web app at localhost:3000
