# iOS Implementation: Order of Operations

**Generated:** January 31, 2026
**Status:** Phases 1-3 Complete, Phase 4+ Remaining

---

## Implementation Review Summary

### ✅ COMPLETED (Phases 1-3)

| Phase | Task | Files Created | Status |
|-------|------|---------------|--------|
| **1.1** | Colors | `Core/DesignSystem/Colors.swift` | ✅ |
| **1.2** | Typography | `Core/DesignSystem/Typography.swift` | ✅ |
| **1.3** | Spacing | `Core/DesignSystem/Spacing.swift` | ✅ |
| **1.4** | Haptics | `Core/DesignSystem/Haptics.swift` | ✅ |
| **1.5** | Components | `TDButton`, `TDCard`, `TDTextField`, `PositionBadge`, `LoadingSkeleton` | ✅ |
| **1.6** | Data Models | `Player`, `Tournament`, `DraftRoom`, `User`, `DraftQueue`, `APIResponses` | ✅ |
| **1.7** | App Shell | `TopDogApp`, `AppState`, `AppRouter` | ✅ |
| **1.8** | Tab Bar | `TDTabBar`, `MainTabView` | ✅ |
| **2.1** | API Client | `Core/Networking/APIClient.swift` | ✅ |
| **2.2** | Error Handling | `Core/Utilities/AppError.swift` | ✅ |
| **2.3** | Auth Service | `Core/Services/AuthService.swift` | ✅ |
| **2.4** | Auth Views | `AuthGateView`, `LoginView`, `SignUpView`, `ForgotPasswordView` | ✅ |
| **2.5** | Support Components | `ErrorView`, `CheckboxToggleStyle`, `SearchBar` | ✅ |
| **3.1** | Tournament Service | `Core/Services/TournamentService.swift` | ✅ |
| **3.2** | Lobby Views | `LobbyView`, `TournamentCardV3`, `JoinTournamentSheet` | ✅ |

**Total Files Created: 38**

---

### ⏳ REMAINING (Phases 4-8)

#### Phase 4: Draft Room (Core) - **CRITICAL PATH**
| Task | Document Section | Output Files | Priority |
|------|------------------|--------------|----------|
| 4.1 | Draft Service | `Core/Services/DraftRoomService.swift` | P0 |
| 4.2 | Draft Room Shell | `Features/DraftRoom/Views/DraftRoomView.swift` | P0 |
| 4.3 | Status Bar | `Features/DraftRoom/Views/DraftStatusBar.swift` | P0 |
| 4.4 | Footer Tabs | `Features/DraftRoom/Views/DraftFooter.swift` | P0 |
| 4.5 | Picks Bar | `Features/DraftRoom/Views/PicksBar.swift` | P0 |
| 4.6 | Player List | `Features/DraftRoom/Views/PlayerListView.swift` | P0 |
| 4.7 | Player Row | `Features/DraftRoom/Views/PlayerRow.swift` | P0 |
| 4.8 | Player Expanded | `Features/DraftRoom/Views/PlayerExpandedCard.swift` | P1 |
| 4.9 | Position Filters | `Features/DraftRoom/Views/PositionFilterBar.swift` | P1 |

#### Phase 5: Draft Room (Complete)
| Task | Document Section | Output Files | Priority |
|------|------------------|--------------|----------|
| 5.1 | Queue View | `Features/DraftRoom/Views/QueueView.swift` | P1 |
| 5.2 | Roster View | `Features/DraftRoom/Views/RosterView.swift` | P1 |
| 5.3 | Draft Board | `Features/DraftRoom/Views/DraftBoardView.swift` | P2 |
| 5.4 | Info View | `Features/DraftRoom/Views/DraftInfoView.swift` | P2 |
| 5.5 | Timer Logic | State machine in DraftRoomService | P1 |

#### Phase 6: Secondary Screens
| Task | Document Section | Output Files | Priority |
|------|------------------|--------------|----------|
| 6.1 | My Teams | `Features/MyTeams/Views/MyTeamsView.swift` | P2 |
| 6.2 | Exposure | `Features/Exposure/Views/ExposureView.swift` | P2 |
| 6.3 | Profile | `Features/Profile/Views/ProfileView.swift` | P2 |
| 6.4 | Settings | `Features/Profile/Views/SettingsSheet.swift` | P3 |
| 6.5 | Deposit | `Features/Profile/Views/DepositSheet.swift` | P3 |

#### Phase 7: Platform Features
| Task | Document Section | Output Files | Priority |
|------|------------------|--------------|----------|
| 7.1 | Push Notifications | `Core/Services/NotificationService.swift` | P2 |
| 7.2 | Live Activities | `Core/Services/LiveActivityService.swift` | P2 |
| 7.3 | Deep Links | Already in `AppRouter` | ✅ Done |

#### Phase 8: Polish & Ship
| Task | Description | Priority |
|------|-------------|----------|
| 8.1 | Unit Tests | P3 |
| 8.2 | UI Tests | P3 |
| 8.3 | App Icons | P3 |
| 8.4 | Screenshots | P3 |
| 8.5 | App Store Metadata | P3 |

---

## NEW ORDER OF OPERATIONS

### Sprint 1: Draft Room Core (P0) - Est. 4-6 hours
**Goal:** Functional draft room where users can see players and make picks

```
┌─────────────────────────────────────────────────────────────┐
│  PARALLEL GROUP A         PARALLEL GROUP B                  │
├─────────────────────────────────────────────────────────────┤
│  4.1 DraftRoomService     4.3 DraftStatusBar               │
│  4.2 DraftRoomView        4.4 DraftFooter                  │
│  4.6 PlayerListView       4.5 PicksBar                     │
│  4.7 PlayerRow            4.9 PositionFilterBar            │
└─────────────────────────────────────────────────────────────┘
```

**Execution Order:**
1. `DraftRoomService.swift` - Real-time Firestore subscriptions
2. `DraftStatusBar.swift` - Timer display, back button
3. `DraftFooter.swift` - Tab navigation within draft
4. `PicksBar.swift` - Horizontal pick cards scroll
5. `PositionFilterBar.swift` - QB/RB/WR/TE filter buttons
6. `PlayerListView.swift` - Main player list container
7. `PlayerRow.swift` - Individual player row
8. `DraftRoomView.swift` - Container wiring everything together

### Sprint 2: Draft Room Complete (P1) - Est. 3-4 hours
**Goal:** All draft tabs functional, queue management, timer warnings

```
┌─────────────────────────────────────────────────────────────┐
│  PARALLEL GROUP A         PARALLEL GROUP B                  │
├─────────────────────────────────────────────────────────────┤
│  5.1 QueueView            5.2 RosterView                   │
│  4.8 PlayerExpandedCard   5.5 Timer State Machine          │
└─────────────────────────────────────────────────────────────┘
```

**Execution Order:**
1. `PlayerExpandedCard.swift` - Draft button, stats when row tapped
2. `QueueView.swift` - Drag-to-reorder queue management
3. `RosterView.swift` - Participants list with their picks
4. Timer state machine in `DraftRoomService` (warnings at 10s, 5s)
5. `DraftBoardView.swift` - Grid view of all picks
6. `DraftInfoView.swift` - Tournament info, payouts

### Sprint 3: Secondary Screens (P2) - Est. 2-3 hours
**Goal:** All main tabs functional

```
┌─────────────────────────────────────────────────────────────┐
│  PARALLEL: All can run simultaneously                       │
├─────────────────────────────────────────────────────────────┤
│  6.1 MyTeamsView          6.2 ExposureView                 │
│  6.3 ProfileView          7.1 NotificationService          │
│  7.2 LiveActivityService                                    │
└─────────────────────────────────────────────────────────────┘
```

### Sprint 4: Polish (P3) - Est. 2-3 hours
**Goal:** App Store ready

- Settings, Deposit, Withdraw sheets
- Unit tests for services
- UI tests for critical flows
- App icons and screenshots
- App Store metadata

---

## DISCREPANCIES FOUND & RESOLUTIONS

### 1. Design System Additions (Beyond Spec)
**Added components not in IOS_DESIGN_SYSTEM.md:**
- `SearchBar.swift` - Needed for player search
- `ErrorView.swift` - From IOS_INFRASTRUCTURE.md
- `CheckboxToggleStyle.swift` - Needed for auth forms

**Resolution:** Keep additions, they follow design patterns

### 2. AppRouter vs Spec
**Spec says:** `AppRouter.shared` singleton
**Implementation:** `@State private var router = AppRouter()` per-instance

**Resolution:** Current implementation is more SwiftUI-idiomatic. Keep as-is.

### 3. AppState Sync with AuthService
**Spec says:** AppState should have `currentUser`, `isOnline`, `features`
**Implementation:** AppState has `user`, `isAuthenticated`, `balance`

**Resolution:** Need to add:
- `FeatureFlags` struct
- `isOnline` connectivity monitoring
- Sync `currentUser` from AuthService

### 4. Missing in Spec: TournamentCardV3 Subcomponents
**Spec shows:** `TournamentTitle`, `TournamentProgressBar`, `TournamentStatsRow`, `StatColumn`
**Implementation:** All created in `TournamentCardV3.swift`

**Resolution:** ✅ Complete

### 5. Typography Extension Missing `monoLarge`
**Used in:** `MainTabView.swift` for balance display
**Spec:** Not defined

**Resolution:** Need to add to Typography.swift:
```swift
let monoLarge = Font.system(size: TDFontSize.lg, design: .monospaced)
```

---

## CRITICAL FILES TO CREATE NEXT

In order of priority:

```
1. TopDog/Core/Services/DraftRoomService.swift
2. TopDog/Features/DraftRoom/Views/DraftRoomView.swift
3. TopDog/Features/DraftRoom/Views/DraftStatusBar.swift
4. TopDog/Features/DraftRoom/Views/DraftFooter.swift
5. TopDog/Features/DraftRoom/Views/PicksBar.swift
6. TopDog/Features/DraftRoom/Views/PositionFilterBar.swift
7. TopDog/Features/DraftRoom/Views/PlayerListView.swift
8. TopDog/Features/DraftRoom/Views/PlayerRow.swift
9. TopDog/Features/DraftRoom/Views/PlayerExpandedCard.swift
```

---

## PARALLEL WORK MATRIX

| Agent 1 | Agent 2 | Agent 3 |
|---------|---------|---------|
| DraftRoomService | DraftStatusBar | PositionFilterBar |
| PlayerListView | DraftFooter | PicksBar |
| PlayerRow | QueueView | RosterView |
| DraftBoardView | DraftInfoView | LiveActivityService |
| MyTeamsView | ExposureView | ProfileView |

---

## BUILD VERIFICATION CHECKPOINTS

After each sprint, verify:

1. **Sprint 1 Complete:**
   - [ ] Can navigate from Lobby → Join Sheet → Draft Room
   - [ ] Players display in list with position colors
   - [ ] Timer counts down
   - [ ] Picks bar shows picks horizontally
   - [ ] Footer tabs switch content

2. **Sprint 2 Complete:**
   - [ ] Can expand player row → see stats → tap Draft
   - [ ] Queue shows added players
   - [ ] Roster shows all participants' picks
   - [ ] Timer warnings trigger haptics at 10s, 5s
   - [ ] Draft board shows grid

3. **Sprint 3 Complete:**
   - [ ] My Teams tab shows drafted teams
   - [ ] Exposure tab shows player % ownership
   - [ ] Profile tab shows user info and balance
   - [ ] Push notifications request permission
   - [ ] Live Activity shows on lock screen

4. **Sprint 4 Complete:**
   - [ ] All tests pass
   - [ ] No compiler warnings
   - [ ] App icons render correctly
   - [ ] Screenshots captured for all screen sizes
   - [ ] App Store submission ready

---

## COMMAND TO START NEXT PHASE

```
Read IOS_SCREENS.md §DraftRoom and IOS_SERVICES.md §3, then implement
Sprint 1 (Draft Room Core). Use subagents for parallel work groups A and B.
Files to create: DraftRoomService, DraftRoomView, DraftStatusBar, DraftFooter,
PicksBar, PositionFilterBar, PlayerListView, PlayerRow.
```
