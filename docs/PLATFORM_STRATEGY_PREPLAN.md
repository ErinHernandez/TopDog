# TopDog Platform Strategy: Pre-Plan

**Status:** Pre-Plan (Strategic Sketch)  
**Decision:** Three platforms, world-class on all  
**Sequence:** iOS Native → Desktop Web → Android Native

**Rationale:** iOS users are the primary market. Desktop drafting is essential for competitive parity with Underdog. Android users can use desktop web until native ships.

---

## The Vision

TopDog ships on three platforms, each best-in-class for that platform:

| Platform | Tech Stack | Quality Bar |
|----------|------------|-------------|
| **iOS** | Swift + SwiftUI | Indistinguishable from Apple's own apps |
| **Android** | Kotlin + Jetpack Compose | Feels like it was built by Google |
| **Desktop Web** | React + TypeScript (rebuilt) | Faster and cleaner than Underdog's web |

Not "good enough." Not "acceptable." **The reference implementation** that other fantasy apps aspire to.

---

## Platform 1: Native iOS (Primary Focus)

### Tech Stack
- **Language:** Swift 5.9+
- **UI Framework:** SwiftUI (with UIKit bridges where needed)
- **Async:** Swift Concurrency (async/await, actors)
- **Networking:** URLSession + custom API client
- **Real-time:** Native WebSocket (URLSessionWebSocketTask)
- **Local Storage:** SwiftData (or Core Data if SwiftData is immature)
- **State Management:** Observation framework (@Observable)
- **Dependency Injection:** Swift's native approach or Swinject

### Existing Assets to Integrate
```
ios/
├── DynamicIsland/
│   ├── DraftAlertManager.swift      ← Push-triggered alerts
│   ├── DraftTimerActivityManager.swift  ← Live Activities
│   ├── DraftAlertWidget.swift
│   └── DraftTimerActivityWidget.swift
```

These become modules in the full iOS app, not separate targets.

### App Architecture
```
TopDog iOS App
├── App/
│   ├── TopDogApp.swift              (entry point)
│   ├── AppState.swift               (global observable state)
│   └── Router.swift                 (navigation coordinator)
│
├── Features/
│   ├── Auth/
│   │   ├── Views/
│   │   │   ├── LoginView.swift
│   │   │   ├── SignUpView.swift
│   │   │   └── BiometricPromptView.swift
│   │   ├── ViewModels/
│   │   │   └── AuthViewModel.swift
│   │   └── Services/
│   │       └── AuthService.swift
│   │
│   ├── Lobby/
│   │   ├── Views/
│   │   │   ├── LobbyView.swift
│   │   │   ├── TournamentCard.swift
│   │   │   ├── FilterSheet.swift
│   │   │   └── TournamentDetailView.swift
│   │   ├── ViewModels/
│   │   │   └── LobbyViewModel.swift
│   │   └── Models/
│   │       └── Tournament.swift
│   │
│   ├── DraftRoom/                   ← The crown jewel
│   │   ├── Views/
│   │   │   ├── DraftRoomView.swift
│   │   │   ├── PlayerListView.swift
│   │   │   ├── PlayerRow.swift
│   │   │   ├── PlayerDetailSheet.swift
│   │   │   ├── DraftBoardView.swift
│   │   │   ├── TimerView.swift
│   │   │   ├── QueueView.swift
│   │   │   └── PickConfirmationView.swift
│   │   ├── ViewModels/
│   │   │   ├── DraftRoomViewModel.swift
│   │   │   └── PlayerListViewModel.swift
│   │   ├── Services/
│   │   │   ├── DraftWebSocketService.swift
│   │   │   └── DraftStateManager.swift
│   │   └── Models/
│   │       ├── Player.swift
│   │       ├── DraftPick.swift
│   │       └── DraftState.swift
│   │
│   ├── MyTeams/
│   │   └── ...
│   │
│   ├── Wallet/
│   │   ├── Views/
│   │   │   ├── WalletView.swift
│   │   │   ├── DepositView.swift
│   │   │   └── WithdrawView.swift
│   │   └── ...
│   │
│   ├── Profile/
│   │   └── ...
│   │
│   └── Settings/
│       └── ...
│
├── Core/
│   ├── Networking/
│   │   ├── APIClient.swift
│   │   ├── Endpoints.swift
│   │   ├── WebSocketClient.swift
│   │   └── NetworkMonitor.swift
│   │
│   ├── Storage/
│   │   ├── UserDefaults+Extensions.swift
│   │   ├── KeychainService.swift
│   │   └── CacheManager.swift
│   │
│   ├── DesignSystem/
│   │   ├── Colors.swift
│   │   ├── Typography.swift
│   │   ├── Spacing.swift
│   │   ├── Haptics.swift
│   │   └── Components/
│   │       ├── TDButton.swift
│   │       ├── TDCard.swift
│   │       ├── TDTextField.swift
│   │       └── ...
│   │
│   └── Utilities/
│       ├── Logger.swift
│       ├── Analytics.swift
│       └── FeatureFlags.swift
│
├── LiveActivities/                  ← Existing Swift code, refined
│   ├── DraftTimerActivity.swift
│   └── DraftAlertActivity.swift
│
├── Widgets/
│   ├── DraftTimerWidget.swift
│   └── UpcomingDraftsWidget.swift
│
└── Resources/
    ├── Assets.xcassets
    ├── Localizable.strings
    └── Info.plist
```

### What "World-Class iOS" Means

#### Performance Targets
| Metric | Target | How |
|--------|--------|-----|
| App launch (cold) | < 400ms | Lazy loading, minimal startup work |
| App launch (warm) | < 100ms | State restoration |
| Player list scroll | 60fps always | LazyVStack, view recycling, no main-thread blocking |
| Draft pick action | < 50ms feedback | Optimistic UI, haptic immediate |
| Memory footprint | < 150MB active | Image caching strategy, view lifecycle |

#### UX Targets
| Interaction | Standard |
|-------------|----------|
| Every tap | Haptic feedback (appropriate intensity) |
| Every list | Pull-to-refresh, native feel |
| Every transition | Spring animations, interruptible |
| Every error | Graceful, recoverable, human-readable |
| Every loading state | Skeleton screens, not spinners |
| Offline | Graceful degradation, queue actions |

#### Platform Integration
| Feature | Implementation |
|---------|----------------|
| Dynamic Island | Live draft timer, your turn alerts |
| Live Activities | Lock screen draft status |
| Widgets | Upcoming drafts, live draft status |
| Siri Shortcuts | "Start my next draft" |
| Spotlight | Search your teams, players |
| Handoff | Continue draft on iPad |
| Face ID / Touch ID | Secure login, confirm deposits |
| Apple Pay | One-tap deposits |
| Push Notifications | Rich notifications with actions |

---

## Platform 2: Native Android

### Tech Stack
- **Language:** Kotlin 1.9+
- **UI Framework:** Jetpack Compose (100% Compose, no XML)
- **Async:** Kotlin Coroutines + Flow
- **Networking:** Ktor or Retrofit
- **Real-time:** OkHttp WebSocket
- **Local Storage:** Room (SQLite) or DataStore
- **State Management:** ViewModel + StateFlow
- **Dependency Injection:** Hilt (Dagger under the hood)

### App Architecture
```
TopDog Android App
├── app/
│   ├── TopDogApplication.kt
│   ├── MainActivity.kt
│   └── navigation/
│       └── NavGraph.kt
│
├── feature/
│   ├── auth/
│   │   ├── ui/
│   │   │   ├── LoginScreen.kt
│   │   │   └── SignUpScreen.kt
│   │   ├── viewmodel/
│   │   │   └── AuthViewModel.kt
│   │   └── data/
│   │       └── AuthRepository.kt
│   │
│   ├── lobby/
│   │   ├── ui/
│   │   │   ├── LobbyScreen.kt
│   │   │   └── TournamentCard.kt
│   │   └── ...
│   │
│   ├── draftroom/                   ← The crown jewel
│   │   ├── ui/
│   │   │   ├── DraftRoomScreen.kt
│   │   │   ├── PlayerList.kt
│   │   │   ├── PlayerRow.kt
│   │   │   ├── DraftBoard.kt
│   │   │   └── Timer.kt
│   │   ├── viewmodel/
│   │   │   └── DraftRoomViewModel.kt
│   │   └── data/
│   │       ├── DraftRepository.kt
│   │       └── DraftWebSocket.kt
│   │
│   ├── myteams/
│   ├── wallet/
│   ├── profile/
│   └── settings/
│
├── core/
│   ├── network/
│   │   ├── ApiService.kt
│   │   ├── WebSocketService.kt
│   │   └── NetworkModule.kt
│   │
│   ├── database/
│   │   ├── TopDogDatabase.kt
│   │   └── dao/
│   │
│   ├── designsystem/
│   │   ├── theme/
│   │   │   ├── Color.kt
│   │   │   ├── Typography.kt
│   │   │   └── Theme.kt
│   │   └── components/
│   │       ├── TDButton.kt
│   │       ├── TDCard.kt
│   │       └── ...
│   │
│   └── util/
│       ├── Logger.kt
│       └── Analytics.kt
│
├── widget/
│   └── DraftTimerWidget.kt
│
└── res/
    └── ...
```

### What "World-Class Android" Means

#### Performance Targets
| Metric | Target |
|--------|--------|
| App launch (cold) | < 500ms |
| Player list scroll | 60fps on mid-range devices (Pixel 6a class) |
| Compose recomposition | Minimal, tracked via Layout Inspector |
| Memory | < 200MB active |

#### Platform Integration
| Feature | Implementation |
|---------|----------------|
| Material You | Dynamic color from wallpaper |
| Widgets | Glance-based widgets |
| Google Pay | One-tap deposits |
| Biometric | Fingerprint, face unlock |
| Push | FCM with notification channels |
| Deep Links | App Links verified |
| Picture-in-Picture | Draft timer while multitasking |
| Wear OS | Stretch goal - draft notifications on watch |

---

## Platform 3: Desktop Web

### Tech Stack
- **Framework:** React 18+ (or consider Solid.js for performance)
- **Language:** TypeScript (strict mode)
- **State:** Zustand or Jotai (lighter than Redux)
- **Styling:** Tailwind CSS + CSS Modules for components
- **Real-time:** Native WebSocket
- **Build:** Vite (faster than webpack)
- **Routing:** React Router or TanStack Router

### Architecture Decision: Keep Next.js or Go Pure React?

| Option | Pros | Cons |
|--------|------|------|
| **Keep Next.js** | SSR for SEO, existing code | Heavier, more complexity |
| **Pure React (Vite)** | Faster, simpler, SPA-focused | No SSR, rebuild from scratch |
| **Next.js App Router** | Modern, server components | Learning curve, newer |

**Recommendation:** Keep Next.js but **rebuild the desktop UI from scratch**. The current "phone in frame" components don't translate to desktop - you need desktop-native layouts.

### Desktop UI Architecture
```
Desktop Web App
├── src/
│   ├── app/                         (if App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── lobby/
│   │   ├── draft/
│   │   │   └── [roomId]/
│   │   ├── teams/
│   │   ├── wallet/
│   │   └── settings/
│   │
│   ├── components/
│   │   ├── desktop/                 ← NEW: Desktop-specific components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── DraftRoomDesktop.tsx
│   │   │   ├── PlayerTable.tsx      (table, not list)
│   │   │   ├── DraftBoard.tsx
│   │   │   └── ...
│   │   │
│   │   ├── shared/                  ← Shared with mobile web (if any)
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── Timer.tsx
│   │   │   └── ...
│   │   │
│   │   └── ui/                      ← Design system primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── ...
│   │
│   ├── hooks/
│   │   ├── useDraftRoom.ts
│   │   ├── useWebSocket.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── api/
│   │   ├── websocket/
│   │   └── ...
│   │
│   └── styles/
│       └── ...
```

### Desktop UX Principles

Desktop drafting has different affordances than mobile:

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Player list | Vertical scroll, cards | Table with sortable columns |
| Draft board | Compact, swipeable | Full grid visible |
| Actions | Bottom sheet, full screen | Side panels, modals |
| Navigation | Tab bar | Sidebar or top nav |
| Information density | Low (touch targets) | High (mouse precision) |
| Keyboard | Minimal | Shortcuts for power users |

### Desktop-Specific Features

| Feature | Description |
|---------|-------------|
| Keyboard shortcuts | Space = pick, Q = queue, arrow keys = navigate |
| Multi-column layout | Player list + draft board + queue all visible |
| Sortable tables | Click column headers |
| Hover states | Preview on hover |
| Right-click context menus | Queue player, view stats |
| Resizable panels | User controls layout |
| Multiple tabs | Open multiple drafts |
| Notifications | Browser notifications when it's your turn |

---

## Shared Infrastructure

### What's Shared Across All Platforms

| Asset | Format | Consumers |
|-------|--------|-----------|
| **API Endpoints** | REST + WebSocket | All platforms hit same backend |
| **Type Definitions** | OpenAPI/Swagger → Generated | TypeScript, Swift, Kotlin types |
| **Design Tokens** | JSON | Colors, spacing, typography values |
| **Business Logic Specs** | Documentation | Rules are same, implementations differ |
| **Test Scenarios** | Gherkin/BDD | Same test cases, different runners |
| **Analytics Events** | Schema | Same events tracked everywhere |
| **Error Codes** | Enum | Consistent error handling |

### Type Generation Pipeline
```
OpenAPI Spec (source of truth)
├── → Swift types (Swift OpenAPI Generator)
├── → Kotlin types (OpenAPI Generator)
└── → TypeScript types (openapi-typescript)
```

This ensures API contracts are identical across platforms.

### Design Token Pipeline
```
Figma (source of truth)
├── → design-tokens.json (exported)
├── → Colors.swift
├── → Color.kt
└── → colors.css / tailwind.config.js
```

---

## Sequencing

### Phase 1: iOS Foundation
- Set up Xcode project, architecture
- Build design system components
- Implement auth flow
- Build lobby (tournament list)
- Integrate existing Dynamic Island code

### Phase 2: iOS Draft Room
- Player list (60fps virtualized)
- Draft board
- Timer + haptics
- WebSocket integration
- Queue management
- Pick flow

### Phase 3: iOS Polish
- Live Activities fully integrated
- Widgets
- Offline mode
- Push notifications
- Edge cases, error states
- Performance profiling + optimization
- TestFlight beta

### Phase 4: iOS Ship
- App Store assets
- App Store review
- Launch

### Phase 5: Desktop Web Foundation
- Set up fresh project (React + TypeScript + Vite or Next.js)
- Build desktop design system
- Implement auth flow
- Build lobby with desktop layout (tables, filters)

### Phase 6: Desktop Draft Room
- Desktop-optimized draft room
- Multi-column layout (player list + draft board + queue visible)
- Sortable tables, keyboard shortcuts
- Power-user features

### Phase 7: Desktop Web Polish + Ship
- Browser notifications
- Performance optimization
- Launch

### Phase 8: Android Foundation
- Same structure as iOS Phase 1
- Material You theming

### Phase 9: Android Draft Room
- Same features as iOS
- Platform-specific adaptations

### Phase 10: Android Polish + Ship
- Widgets, notifications
- Play Store launch

---

## Success Metrics

### Performance (Non-Negotiable)
- [ ] 60fps scroll on 3-year-old devices
- [ ] < 500ms cold launch
- [ ] < 100ms response to any tap
- [ ] Zero jank during draft

### Quality (Non-Negotiable)
- [ ] Zero crashes in production
- [ ] < 0.1% ANR rate (Android)
- [ ] 4.8+ star rating target

### Platform Parity
- [ ] All features on all platforms
- [ ] Same-day feature releases (eventually)

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Testing** | World-class | 80%+ unit coverage, UI tests, snapshot tests, E2E, performance regression tests, chaos testing |
| **Analytics** | Both | Session recordings + heatmaps (Hotjar/FullStory) for UX insights, custom data warehouse (BigQuery) for business metrics |
| **Accessibility** | WCAG AA | VoiceOver/TalkBack fully supported, meets legal requirements, good UX for all |
| **iPad** | Scaled → Native later | Ship iPhone UI on iPad first, revisit native iPad layout based on usage data |
| **macOS** | Web only | Power users keep browser extensions (password managers, etc.) |
| **Localization** | English first, architecture-ready | Externalize all strings, RTL-ready layouts, but ship EN only initially |

## Current Technical Stack (Discovered)

| Component | Technology | Notes |
|-----------|------------|-------|
| **Real-time** | Firestore `onSnapshot` listeners | NOT WebSocket - uses Firebase's built-in real-time |
| **Auth** | Firebase Authentication | `signInAnonymously`, `onAuthStateChanged` |
| **Database** | Firestore | Document-based, collections for drafts, picks, users |
| **API** | Next.js API routes | 87 endpoints |
| **Existing Swift** | Dynamic Island + Live Activities | Production-quality code, never tested on device |

## V1 Scope: Full Feature Parity

First App Store release includes everything the web app has:
- Authentication (Firebase Auth → native implementation)
- Lobby (tournament list, filters, search)
- Draft Room (full functionality)
- My Teams
- Wallet (deposit/withdraw)
- Profile
- Settings
- Dynamic Island + Live Activities (existing Swift code)
- Push notifications

## Design Source of Truth

**The current web app is a visual reference only.** 

- Not live in production
- Not being maintained
- Use it to see what screens/features exist
- Native apps replicate the UI/UX, adapted for platform conventions (iOS HIG, Material Design)

When desktop web is built (after iOS + Android), it may be a fresh codebase - decide then.

## Action Items Before Development

### Immediate (Required)
- [ ] **Set up Apple Developer Account** ($99/year) - Required for App Store, TestFlight, provisioning
- [ ] **Set up Google Play Developer Account** ($25 one-time) - Required for Play Store

### Before iOS Development
- [ ] Test existing Swift code on real device
- [ ] Document all web app screens (screenshot inventory)
- [ ] Define navigation structure for native app

## Still To Decide

1. **CI/CD:** Fastlane? GitHub Actions? Bitrise? (Decide during iOS setup)
2. **Crash Reporting:** Sentry? Crashlytics? Both? (Decide during iOS setup)
3. **Feature Flags:** LaunchDarkly? Firebase Remote Config? Custom? (Decide during iOS setup)
4. **A/B Testing:** How to run experiments? (Decide after analytics is set up)
5. **Session Recording Tool:** Hotjar vs FullStory vs LogRocket? (Decide during web rebuild)
6. **Data Warehouse:** BigQuery vs Snowflake vs Clickhouse? (Decide during analytics setup)

---

## Competitive Positioning

| Aspect | Underdog | TopDog Target |
|--------|----------|---------------|
| iOS App | Native, good | Native, **best** |
| Android App | Native, good | Native, **best** |
| Desktop Web | Functional | **Power-user focused** |
| Dynamic Island | No | Yes |
| Live Activities | No | Yes |
| Keyboard Shortcuts | Basic | **Comprehensive** |
| Offline Mode | Limited | **Full draft queue offline** |
| Haptics | Basic | **Considered, premium feel** |

---

## What This Document Is NOT

This is a pre-plan. It establishes:
- Platform decisions (iOS, Android, Desktop Web)
- Tech stack choices
- Architecture patterns
- Quality standards
- Sequencing

It does NOT include:
- Detailed implementation specs
- Timeline estimates
- Staffing plans
- Detailed API contracts
- Figma designs
- Test plans

Those come next, one platform at a time.

---

**Next Step:** Deep-dive into iOS architecture and begin implementation planning.
