# iOS Master Implementation Plan

**For:** Orchestrating agent assigning tasks to subagents  
**Status:** Ready for implementation  
**Sequence:** iOS Native → Desktop Web → Android Native

---

## Quick Links to Task Documents

| Document | Subagent Task | Est. Complexity |
|----------|---------------|-----------------|
| [IOS_DESIGN_SYSTEM.md](./IOS_DESIGN_SYSTEM.md) | Build design tokens + core components | Medium |
| [IOS_SCREENS.md](./IOS_SCREENS.md) | Build screens from specs | High |
| [IOS_DATA_MODELS.md](./IOS_DATA_MODELS.md) | Create Swift Codable structs | Low |
| [IOS_SERVICES.md](./IOS_SERVICES.md) | Firebase, API, Push, Live Activities | High |
| [IOS_INFRASTRUCTURE.md](./IOS_INFRASTRUCTURE.md) | Navigation, errors, App Store prep | Medium |

**Also reference:**
- [IOS_SWIFT_GUIDELINES.md](./IOS_SWIFT_GUIDELINES.md) - Swift coding standards and conventions
- [`../UI_SPEC.md`](../UI_SPEC.md) - Complete visual specification (47+ screenshots)
- [`../MOBILE_COMPONENT_INVENTORY.md`](../MOBILE_COMPONENT_INVENTORY.md) - Web component props/behavior

---

## Project Structure

```
TopDog-iOS/
├── TopDog/
│   ├── App/
│   │   ├── TopDogApp.swift
│   │   ├── AppState.swift
│   │   └── AppRouter.swift
│   │
│   ├── Core/
│   │   ├── DesignSystem/
│   │   │   ├── Colors.swift
│   │   │   ├── Typography.swift
│   │   │   ├── Spacing.swift
│   │   │   ├── Haptics.swift
│   │   │   └── Components/
│   │   │       ├── TDButton.swift
│   │   │       ├── TDCard.swift
│   │   │       ├── TDTextField.swift
│   │   │       ├── PositionBadge.swift
│   │   │       └── LoadingSkeleton.swift
│   │   │
│   │   ├── Networking/
│   │   │   ├── APIClient.swift
│   │   │   └── APIEndpoints.swift
│   │   │
│   │   ├── Services/
│   │   │   ├── AuthService.swift
│   │   │   ├── DraftRoomService.swift
│   │   │   ├── TournamentService.swift
│   │   │   └── LiveActivityService.swift
│   │   │
│   │   └── Utilities/
│   │       ├── AppError.swift
│   │       └── Extensions/
│   │
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── Views/
│   │   │   │   ├── AuthGateView.swift
│   │   │   │   ├── LoginView.swift
│   │   │   │   ├── SignUpView.swift
│   │   │   │   └── ForgotPasswordView.swift
│   │   │   └── ViewModels/
│   │   │       └── AuthViewModel.swift
│   │   │
│   │   ├── Lobby/
│   │   │   ├── Views/
│   │   │   │   ├── LobbyView.swift
│   │   │   │   ├── TournamentCardV3.swift
│   │   │   │   └── JoinTournamentSheet.swift
│   │   │   └── ViewModels/
│   │   │       └── LobbyViewModel.swift
│   │   │
│   │   ├── DraftRoom/
│   │   │   ├── Views/
│   │   │   │   ├── DraftRoomView.swift
│   │   │   │   ├── DraftStatusBar.swift
│   │   │   │   ├── DraftFooter.swift
│   │   │   │   ├── PicksBar.swift
│   │   │   │   ├── PlayerListView.swift
│   │   │   │   ├── PlayerRow.swift
│   │   │   │   ├── PlayerExpandedCard.swift
│   │   │   │   ├── QueueView.swift
│   │   │   │   ├── RosterView.swift
│   │   │   │   ├── DraftBoardView.swift
│   │   │   │   └── DraftInfoView.swift
│   │   │   └── ViewModels/
│   │   │       └── DraftRoomViewModel.swift
│   │   │
│   │   ├── MyTeams/
│   │   │   └── ...
│   │   │
│   │   ├── Exposure/
│   │   │   └── ...
│   │   │
│   │   └── Profile/
│   │       └── ...
│   │
│   ├── Models/
│   │   ├── Player.swift
│   │   ├── Tournament.swift
│   │   ├── DraftRoom.swift
│   │   ├── User.swift
│   │   └── DraftQueue.swift
│   │
│   ├── LiveActivities/
│   │   ├── DraftTimerAttributes.swift
│   │   └── DraftTimerActivityView.swift
│   │
│   └── Resources/
│       ├── Assets.xcassets
│       └── Info.plist
│
├── TopDogTests/
├── TopDogUITests/
└── TopDog.xcodeproj
```

---

## Implementation Phases

### Phase 1: Foundation
**Subagent tasks:** Design System + Data Models + App Shell

| Task | Document | Files to Create |
|------|----------|-----------------|
| 1.1 Design tokens | IOS_DESIGN_SYSTEM.md §1 | Colors.swift, Typography.swift, Spacing.swift |
| 1.2 Haptics | IOS_DESIGN_SYSTEM.md §2 | Haptics.swift |
| 1.3 Core components | IOS_DESIGN_SYSTEM.md §3 | TDButton, TDCard, TDTextField, PositionBadge |
| 1.4 Data models | IOS_DATA_MODELS.md | All model files |
| 1.5 App shell | IOS_INFRASTRUCTURE.md §1 | TopDogApp.swift, AppState.swift, AppRouter.swift |
| 1.6 Tab bar | IOS_SCREENS.md §TabBar | Custom tab bar component |

**Dependencies:** None (start here)

---

### Phase 2: Auth Flow
**Subagent tasks:** Auth Service + Auth Screens

| Task | Document | Files to Create |
|------|----------|-----------------|
| 2.1 Auth service | IOS_SERVICES.md §Auth | AuthService.swift |
| 2.2 Auth gate | IOS_SCREENS.md §Auth | AuthGateView.swift |
| 2.3 Login screen | IOS_SCREENS.md §Auth | LoginView.swift |
| 2.4 Sign up screen | IOS_SCREENS.md §Auth | SignUpView.swift |
| 2.5 Forgot password | IOS_SCREENS.md §Auth | ForgotPasswordView.swift |

**Dependencies:** Phase 1 complete

---

### Phase 3: Lobby
**Subagent tasks:** Tournament Service + Lobby Screen

| Task | Document | Files to Create |
|------|----------|-----------------|
| 3.1 Tournament service | IOS_SERVICES.md §Tournament | TournamentService.swift |
| 3.2 Lobby view | IOS_SCREENS.md §Lobby | LobbyView.swift |
| 3.3 Tournament card | IOS_SCREENS.md §Lobby | TournamentCardV3.swift + subcomponents |
| 3.4 Join modal | IOS_SCREENS.md §Lobby | JoinTournamentSheet.swift |

**Dependencies:** Phase 2 complete

---

### Phase 4: Draft Room (Core)
**Subagent tasks:** Draft Service + Draft Room Shell + Player List

| Task | Document | Files to Create |
|------|----------|-----------------|
| 4.1 Draft service | IOS_SERVICES.md §Draft | DraftRoomService.swift |
| 4.2 Draft room shell | IOS_SCREENS.md §DraftRoom | DraftRoomView.swift |
| 4.3 Status bar | IOS_SCREENS.md §DraftRoom | DraftStatusBar.swift |
| 4.4 Footer tabs | IOS_SCREENS.md §DraftRoom | DraftFooter.swift |
| 4.5 Picks bar | IOS_SCREENS.md §DraftRoom | PicksBar.swift |
| 4.6 Player list | IOS_SCREENS.md §DraftRoom | PlayerListView.swift, PlayerRow.swift |
| 4.7 Player expanded | IOS_SCREENS.md §DraftRoom | PlayerExpandedCard.swift |

**Dependencies:** Phase 3 complete

---

### Phase 5: Draft Room (Complete)
**Subagent tasks:** Queue + Roster + Board + Timer Logic

| Task | Document | Files to Create |
|------|----------|-----------------|
| 5.1 Queue view | IOS_SCREENS.md §DraftRoom | QueueView.swift |
| 5.2 Roster view | IOS_SCREENS.md §DraftRoom | RosterView.swift |
| 5.3 Draft board | IOS_SCREENS.md §DraftRoom | DraftBoardView.swift |
| 5.4 Info view | IOS_SCREENS.md §DraftRoom | DraftInfoView.swift |
| 5.5 Timer logic | IOS_SERVICES.md §Draft | Timer state machine in ViewModel |

**Dependencies:** Phase 4 complete

---

### Phase 6: Secondary Screens
**Subagent tasks:** My Teams + Exposure + Profile

| Task | Document | Files to Create |
|------|----------|-----------------|
| 6.1 My Teams | IOS_SCREENS.md §MyTeams | MyTeamsView.swift + components |
| 6.2 Exposure | IOS_SCREENS.md §Exposure | ExposureView.swift |
| 6.3 Profile | IOS_SCREENS.md §Profile | ProfileView.swift |
| 6.4 Settings | IOS_SCREENS.md §Settings | SettingsSheet.swift |

**Dependencies:** Phase 4 complete (can run parallel with Phase 5)

---

### Phase 7: Platform Features
**Subagent tasks:** Push Notifications + Live Activities + Deep Links

| Task | Document | Files to Create |
|------|----------|-----------------|
| 7.1 Push setup | IOS_SERVICES.md §Push | NotificationHandler.swift |
| 7.2 Live Activities | IOS_SERVICES.md §LiveActivities | LiveActivityService.swift |
| 7.3 Deep linking | IOS_INFRASTRUCTURE.md §DeepLinks | URL handling in AppRouter |

**Dependencies:** Phase 5 complete

---

### Phase 8: Polish & Ship
**Subagent tasks:** Testing + App Store Prep

| Task | Document | Files to Create |
|------|----------|-----------------|
| 8.1 Unit tests | — | Test files |
| 8.2 UI tests | — | UI test files |
| 8.3 App icons | IOS_INFRASTRUCTURE.md §AppStore | Assets.xcassets |
| 8.4 Screenshots | IOS_INFRASTRUCTURE.md §AppStore | Marketing assets |
| 8.5 Metadata | IOS_INFRASTRUCTURE.md §AppStore | App Store Connect |

**Dependencies:** All phases complete

---

## Task Assignment Format

When assigning tasks to subagents, use this format:

```
TASK: [Task ID] - [Task Name]
DOCUMENT: [Document to read]
SECTION: [Specific section]
OUTPUT: [Files to create/modify]
ACCEPTANCE: [How to verify completion]
```

**Example:**
```
TASK: 1.1 - Design Tokens (Colors)
DOCUMENT: docs/ios/IOS_DESIGN_SYSTEM.md
SECTION: §1.1 Colors
OUTPUT: TopDog-iOS/TopDog/Core/DesignSystem/Colors.swift
ACCEPTANCE: All color tokens from web match exactly, hex values verified
```

---

## Quality Gates

Before marking a phase complete:

- [ ] All files compile without errors
- [ ] No hardcoded values (all from design system)
- [ ] Haptic feedback on all tap targets
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Matches web UI pixel-for-pixel (compare screenshots)

---

## Key Decisions (Do Not Change)

| Decision | Value | Source |
|----------|-------|--------|
| Position colors | QB=#F472B6, RB=#0fba80, WR=#FBBF25, TE=#7C3AED | LOCKED |
| Min touch target | 44px | Apple HIG |
| Player row height | 64px | Web constants |
| Footer height | 56px | Web constants |
| Pick card size | 140×172px | Web constants |

---

## Parallel Work Opportunities

These task groups can run simultaneously:

| Group A | Group B | Group C |
|---------|---------|---------|
| 4.6 Player list | 4.5 Picks bar | 4.3 Status bar |
| 5.1 Queue view | 5.2 Roster view | 5.3 Draft board |
| 6.1 My Teams | 6.2 Exposure | 6.3 Profile |

---

## References

- **Visual specs:** `docs/UI_SPEC.md`
- **Component inventory:** `docs/MOBILE_COMPONENT_INVENTORY.md`
- **Platform strategy:** `docs/PLATFORM_STRATEGY_PREPLAN.md`
- **Legacy pixel plan:** `docs/IOS_PIXEL_PERFECT_PLAN.md` (consolidated here)
