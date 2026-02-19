# iOS Implementation Plan

**Status:** Planning  
**Goal:** Ship world-class native iOS app to App Store  
**Reference:** Current web app (visual reference only)

---

## Table of Contents

1. [Feature Inventory](#1-feature-inventory)
2. [Project Setup](#2-project-setup)
3. [Architecture](#3-architecture)
4. [Design System](#4-design-system)
5. [Core Infrastructure](#5-core-infrastructure)
6. [Feature Implementation](#6-feature-implementation)
7. [Testing Strategy](#7-testing-strategy)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [App Store Preparation](#9-app-store-preparation)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Feature Inventory

### Main Tabs (Bottom Navigation)

| Tab | Description | Complexity |
|-----|-------------|------------|
| **Lobby** | Tournament list, filters, search, tournament cards | High |
| **Live Drafts** | Active drafts user is in | Medium |
| **Slow Drafts** | Async drafts with longer pick times | Medium |
| **My Teams** | Completed teams, playoff brackets | High |
| **Profile** | User settings, account management | Medium |

### Draft Room (Critical Path)

| Component | Description | Complexity |
|-----------|-------------|------------|
| **Player List** | 550+ players, virtualized scroll, 60fps | Critical |
| **Draft Board** | Pick history grid, all teams | High |
| **Timer** | Countdown, haptics when low | Medium |
| **Queue** | Drag-to-reorder player queue | High |
| **Roster View** | Current team composition | Medium |
| **Player Card** | Expanded stats, historical data | High |
| **Pick Flow** | Confirm pick, optimistic UI | High |

### Authentication

| Screen | Description |
|--------|-------------|
| Login | Email/password, social auth |
| Sign Up | Email, username, password |
| Forgot Password | Email reset flow |
| Phone Auth | SMS verification |
| Biometrics | Face ID / Touch ID |
| Profile Settings | Edit profile, change password |
| Delete Account | Account deletion flow |

### Payments/Wallet

| Modal | Payment Providers |
|-------|-------------------|
| Deposit | Stripe, PayMongo, Paystack, Xendit |
| Withdraw | Same providers |
| Payment Methods | Saved cards management |
| Deposit History | Transaction list |

### Other Features

| Feature | Description |
|---------|-------------|
| Rankings Modal | Player rankings view |
| Autodraft Limits | Position limits configuration |
| Location Services | Geo-compliance |
| Push Notifications | Draft alerts, pick reminders |
| Dynamic Island | Live draft timer (existing Swift code) |
| Live Activities | Lock screen draft status |
| Widgets | Upcoming drafts, live draft status |

---

## 2. Project Setup

### Prerequisites

- [ ] **Apple Developer Account** ($99/year) — BLOCKER
- [ ] Xcode 15.2+ installed
- [ ] iOS 16.1+ deployment target (supports Live Activities)
- [ ] Physical iPhone for testing (Simulator can't test Dynamic Island)

### Initial Project Structure

```
TopDog/
├── TopDog.xcodeproj
├── TopDog/
│   ├── App/
│   │   ├── TopDogApp.swift           # @main entry point
│   │   ├── AppDelegate.swift         # Push notifications, lifecycle
│   │   └── SceneDelegate.swift       # If needed for multi-window
│   │
│   ├── Features/                     # Feature modules
│   │   ├── Auth/
│   │   ├── Lobby/
│   │   ├── DraftRoom/
│   │   ├── MyTeams/
│   │   ├── Profile/
│   │   └── Wallet/
│   │
│   ├── Core/                         # Shared infrastructure
│   │   ├── Network/
│   │   ├── Storage/
│   │   ├── DesignSystem/
│   │   └── Utilities/
│   │
│   ├── LiveActivities/               # Existing Swift code
│   │   ├── DraftTimerActivity.swift
│   │   └── DraftAlertActivity.swift
│   │
│   ├── Widgets/
│   │   └── DraftTimerWidget.swift
│   │
│   └── Resources/
│       ├── Assets.xcassets
│       ├── Localizable.strings
│       └── Info.plist
│
├── TopDogTests/
├── TopDogUITests/
└── TopDogWidgetExtension/
```

### Dependencies (Swift Package Manager)

| Package | Purpose | Required |
|---------|---------|----------|
| **Firebase iOS SDK** | Auth, Firestore, Analytics, Messaging | Yes |
| **Kingfisher** | Image loading/caching | Yes |
| **SwiftLint** | Code style enforcement | Yes |
| **SnapKit** (optional) | Auto Layout DSL (if using UIKit) | No |

### Xcode Configuration

```
Build Settings:
- Swift Language Version: 5.9
- iOS Deployment Target: 16.1
- Enable Strict Concurrency Checking: Complete
- Build Active Architecture Only: Debug=Yes, Release=No
- Targeted Device Families: iPhone only (iPad runs in compatibility mode)
```

---

## 3. Architecture

### Pattern: MVVM + Coordinator

```
┌─────────────────────────────────────────────────────────┐
│                        View                              │
│  (SwiftUI Views - declarative, stateless rendering)      │
└─────────────────────────┬───────────────────────────────┘
                          │ observes
┌─────────────────────────▼───────────────────────────────┐
│                    ViewModel                             │
│  (@Observable class - state, business logic)             │
│  - Fetches data from Services                            │
│  - Transforms data for View                              │
│  - Handles user actions                                  │
└─────────────────────────┬───────────────────────────────┘
                          │ uses
┌─────────────────────────▼───────────────────────────────┐
│                     Services                             │
│  (Protocols + implementations)                           │
│  - AuthService, DraftService, TournamentService          │
│  - Network requests, Firestore subscriptions             │
└─────────────────────────┬───────────────────────────────┘
                          │ calls
┌─────────────────────────▼───────────────────────────────┐
│                   Network Layer                          │
│  - APIClient (REST endpoints)                            │
│  - FirestoreClient (real-time subscriptions)             │
└─────────────────────────────────────────────────────────┘
```

### Navigation: Coordinator Pattern

```swift
// Router handles all navigation
@Observable
class AppRouter {
    var path = NavigationPath()
    var sheet: Sheet?
    var fullScreenCover: FullScreenCover?
    
    enum Sheet: Identifiable {
        case joinTournament(Tournament)
        case deposit
        case playerDetail(Player)
        // ...
    }
    
    enum FullScreenCover: Identifiable {
        case draftRoom(roomId: String)
        case auth
        // ...
    }
}
```

### State Management

```swift
// Global app state
@Observable
class AppState {
    var user: User?
    var isAuthenticated: Bool { user != nil }
    var balance: Decimal = 0
    
    // Injected services
    let authService: AuthServiceProtocol
    let draftService: DraftServiceProtocol
    // ...
}

// Per-feature ViewModels
@Observable
class LobbyViewModel {
    var tournaments: [Tournament] = []
    var isLoading = false
    var error: Error?
    
    private let tournamentService: TournamentServiceProtocol
    
    func loadTournaments() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            tournaments = try await tournamentService.fetchTournaments()
        } catch {
            self.error = error
        }
    }
}
```

---

## 4. Design System

### Colors (from web app)

```swift
// DesignSystem/Colors.swift
import SwiftUI

extension Color {
    static let td = TopDogColors()
}

struct TopDogColors {
    // Backgrounds
    let background = Color(hex: "#101927")
    let backgroundSecondary = Color(hex: "#1a2332")
    let backgroundTertiary = Color(hex: "#243044")
    
    // Primary
    let primary = Color(hex: "#1DA1F2")      // TopDog blue
    let primaryDark = Color(hex: "#1a91da")
    
    // Positions
    let qb = Color(hex: "#ff6b6b")           // Red
    let rb = Color(hex: "#4ecdc4")           // Teal
    let wr = Color(hex: "#1DA1F2")           // Blue
    let te = Color(hex: "#f9ca24")           // Yellow
    
    // Semantic
    let success = Color(hex: "#00d26a")
    let warning = Color(hex: "#ffc107")
    let error = Color(hex: "#ff4757")
    
    // Text
    let textPrimary = Color.white
    let textSecondary = Color(white: 0.7)
    let textTertiary = Color(white: 0.5)
}
```

### Typography

```swift
// DesignSystem/Typography.swift
import SwiftUI

extension Font {
    static let td = TopDogFonts()
}

struct TopDogFonts {
    // Headlines
    let largeTitle = Font.system(size: 34, weight: .bold)
    let title = Font.system(size: 28, weight: .bold)
    let title2 = Font.system(size: 22, weight: .bold)
    let title3 = Font.system(size: 20, weight: .semibold)
    
    // Body
    let body = Font.system(size: 17, weight: .regular)
    let bodyBold = Font.system(size: 17, weight: .semibold)
    let callout = Font.system(size: 16, weight: .regular)
    
    // Small
    let footnote = Font.system(size: 13, weight: .regular)
    let caption = Font.system(size: 12, weight: .regular)
    let captionBold = Font.system(size: 12, weight: .semibold)
    
    // Monospace (for timers, stats)
    let mono = Font.system(size: 17, weight: .medium, design: .monospaced)
    let monoLarge = Font.system(size: 28, weight: .bold, design: .monospaced)
}
```

### Spacing

```swift
// DesignSystem/Spacing.swift
enum Spacing {
    static let xxs: CGFloat = 2   // Extra extra small
    static let xs: CGFloat = 4    // Extra small
    static let sm: CGFloat = 8    // Small
    static let md: CGFloat = 12   // Medium
    static let lg: CGFloat = 16   // Large
    static let xl: CGFloat = 24   // Extra large
    static let xxl: CGFloat = 32  // Extra extra large
    static let xxxl: CGFloat = 48 // Largest
}
```

### Components

```swift
// DesignSystem/Components/TDButton.swift
struct TDButton: View {
    let title: String
    let style: Style
    let action: () -> Void
    
    enum Style {
        case primary, secondary, destructive, ghost
    }
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.td.bodyBold)
                .foregroundColor(foregroundColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.sm)
                .background(backgroundColor)
                .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

// DesignSystem/Components/TDCard.swift
struct TDCard<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(Spacing.md)
            .background(Color.td.backgroundSecondary)
            .cornerRadius(16)
    }
}

// DesignSystem/Components/TDTextField.swift
struct TDTextField: View {
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    
    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .padding(Spacing.sm)
        .background(Color.td.backgroundTertiary)
        .cornerRadius(8)
        .foregroundColor(.white)
    }
}
```

### Haptics

```swift
// DesignSystem/Haptics.swift
import UIKit

enum Haptics {
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    
    static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    
    static func heavy() {
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    }
    
    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
    
    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
    
    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }
    
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
    
    // Custom: tick for timer
    static func timerTick() {
        UIImpactFeedbackGenerator(style: .rigid).impactOccurred(intensity: 0.5)
    }
    
    // Custom: draft pick confirmation
    static func pickConfirmed() {
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
    }
}
```

---

## 5. Core Infrastructure

### Network Layer

```swift
// Core/Network/APIClient.swift
protocol APIClientProtocol {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T
}

class APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let authProvider: AuthProviderProtocol
    
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let token = try? await authProvider.getIdToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body if present
        if let body = endpoint.body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard 200..<300 ~= httpResponse.statusCode else {
            throw APIError.httpError(statusCode: httpResponse.statusCode, data: data)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

### Firestore Real-time

```swift
// Core/Network/FirestoreClient.swift
import FirebaseFirestore

protocol FirestoreClientProtocol {
    func subscribe<T: Decodable>(
        to collection: String,
        where field: String,
        equals value: Any
    ) -> AsyncThrowingStream<[T], Error>
    
    func subscribeToDocument<T: Decodable>(
        collection: String,
        documentId: String
    ) -> AsyncThrowingStream<T?, Error>
}

class FirestoreClient: FirestoreClientProtocol {
    private let db = Firestore.firestore()
    
    func subscribe<T: Decodable>(
        to collectionPath: String,
        where field: String,
        equals value: Any
    ) -> AsyncThrowingStream<[T], Error> {
        AsyncThrowingStream { continuation in
            let listener = db.collection(collectionPath)
                .whereField(field, isEqualTo: value)
                .addSnapshotListener { snapshot, error in
                    if let error = error {
                        continuation.finish(throwing: error)
                        return
                    }
                    
                    guard let documents = snapshot?.documents else {
                        continuation.yield([])
                        return
                    }
                    
                    do {
                        let items = try documents.map { doc in
                            try doc.data(as: T.self)
                        }
                        continuation.yield(items)
                    } catch {
                        continuation.finish(throwing: error)
                    }
                }
            
            continuation.onTermination = { _ in
                listener.remove()
            }
        }
    }
}
```

### Auth Service

```swift
// Core/Services/AuthService.swift
import FirebaseAuth

protocol AuthServiceProtocol {
    var currentUser: User? { get }
    func signIn(email: String, password: String) async throws -> User
    func signUp(email: String, password: String, username: String) async throws -> User
    func signOut() throws
    func resetPassword(email: String) async throws
    func observeAuthState() -> AsyncStream<User?>
}

class AuthService: AuthServiceProtocol {
    private let auth = Auth.auth()
    private let userService: UserServiceProtocol
    
    var currentUser: User? {
        guard let firebaseUser = auth.currentUser else { return nil }
        // Map Firebase user to domain User
        return User(id: firebaseUser.uid, email: firebaseUser.email)
    }
    
    func signIn(email: String, password: String) async throws -> User {
        let result = try await auth.signIn(withEmail: email, password: password)
        return try await userService.fetchUser(id: result.user.uid)
    }
    
    func observeAuthState() -> AsyncStream<User?> {
        AsyncStream { continuation in
            let handle = auth.addStateDidChangeListener { _, firebaseUser in
                if let firebaseUser = firebaseUser {
                    Task {
                        let user = try? await self.userService.fetchUser(id: firebaseUser.uid)
                        continuation.yield(user)
                    }
                } else {
                    continuation.yield(nil)
                }
            }
            
            continuation.onTermination = { _ in
                self.auth.removeStateDidChangeListener(handle)
            }
        }
    }
}
```

### Storage

```swift
// Core/Storage/SecureStorage.swift
import Security

protocol SecureStorageProtocol {
    func save(_ data: Data, for key: String) throws
    func load(for key: String) throws -> Data?
    func delete(for key: String) throws
}

class KeychainStorage: SecureStorageProtocol {
    func save(_ data: Data, for key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Delete existing item
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }
    
    // ... load and delete implementations
}
```

---

## 6. Feature Implementation

### 6.1 Authentication

```
Features/Auth/
├── Views/
│   ├── AuthGateView.swift          # Shows auth or main app
│   ├── LoginView.swift
│   ├── SignUpView.swift
│   ├── ForgotPasswordView.swift
│   └── BiometricPromptView.swift
├── ViewModels/
│   └── AuthViewModel.swift
└── Components/
    ├── SocialAuthButtons.swift
    └── UsernameField.swift
```

**Key Behaviors:**
- Email/password authentication
- Username validation (real-time uniqueness check)
- Face ID / Touch ID after first login
- Session persistence
- Logout clears all local state

### 6.2 Lobby

```
Features/Lobby/
├── Views/
│   ├── LobbyView.swift             # Main tab view
│   ├── TournamentCard.swift        # Individual tournament
│   ├── TournamentDetailSheet.swift # Expanded info
│   ├── JoinTournamentSheet.swift   # Entry flow
│   └── FilterSheet.swift           # Filter/sort options
├── ViewModels/
│   └── LobbyViewModel.swift
├── Models/
│   └── Tournament.swift
└── Components/
    ├── TournamentProgressBar.swift
    ├── PrizePoolBadge.swift
    └── EntryFeeBadge.swift
```

**Key Behaviors:**
- Pull-to-refresh
- Filter by entry fee, tournament type
- Sort by start time, prize pool, entries
- Tap card → detail sheet
- Join button → entry confirmation → payment if needed

### 6.3 Draft Room (Critical)

```
Features/DraftRoom/
├── Views/
│   ├── DraftRoomView.swift         # Container
│   ├── PlayerListView.swift        # Main player list
│   ├── PlayerRow.swift             # Individual player row
│   ├── DraftBoardView.swift        # Pick history grid
│   ├── TimerView.swift             # Countdown
│   ├── QueueView.swift             # Draggable queue
│   ├── RosterView.swift            # My roster
│   ├── PlayerDetailSheet.swift     # Expanded card
│   └── PickConfirmationView.swift  # Confirm pick
├── ViewModels/
│   ├── DraftRoomViewModel.swift    # Main state
│   ├── PlayerListViewModel.swift   # Player filtering/sorting
│   └── QueueViewModel.swift        # Queue management
├── Models/
│   ├── DraftState.swift
│   ├── Player.swift
│   ├── DraftPick.swift
│   └── QueuedPlayer.swift
├── Services/
│   ├── DraftRoomService.swift      # Firestore subscriptions
│   └── DraftTimerService.swift     # Timer management
└── Components/
    ├── PositionFilter.swift
    ├── PicksRemainingBadge.swift
    └── DraftStatusBar.swift
```

**Performance Requirements:**
- Player list: 60fps scroll with 550+ items
- Use `LazyVStack` with `.id()` for recycling
- Debounce search input (300ms)
- Optimistic UI for pick submission
- Haptic feedback: selection, pick confirmed, timer warning

**Real-time Subscriptions:**
- Draft room document (state, current pick, timer)
- Picks collection (new picks)
- Participants (who's connected)

### 6.4 My Teams

```
Features/MyTeams/
├── Views/
│   ├── MyTeamsView.swift
│   ├── TeamCard.swift
│   ├── TeamDetailView.swift
│   ├── PlayoffBracketView.swift
│   └── MatchupView.swift
├── ViewModels/
│   └── MyTeamsViewModel.swift
└── Models/
    ├── Team.swift
    ├── PlayoffMatchup.swift
    └── TeamStanding.swift
```

### 6.5 Wallet

```
Features/Wallet/
├── Views/
│   ├── WalletView.swift            # Balance, actions
│   ├── DepositSheet.swift          # Amount selection
│   ├── WithdrawSheet.swift
│   ├── PaymentMethodsView.swift
│   └── TransactionHistoryView.swift
├── ViewModels/
│   └── WalletViewModel.swift
├── Services/
│   ├── PaymentService.swift        # Stripe integration
│   └── PaymentProviderFactory.swift
└── Models/
    ├── Transaction.swift
    └── PaymentMethod.swift
```

**Payment Flow:**
1. User taps Deposit
2. Selects amount
3. Chooses payment method (Apple Pay, card, etc.)
4. Processes via appropriate provider
5. Firestore updates balance
6. UI reflects new balance

---

## 7. Testing Strategy

### Unit Tests (80%+ Coverage Target)

```
TopDogTests/
├── ViewModels/
│   ├── LobbyViewModelTests.swift
│   ├── DraftRoomViewModelTests.swift
│   └── AuthViewModelTests.swift
├── Services/
│   ├── AuthServiceTests.swift
│   ├── DraftServiceTests.swift
│   └── PaymentServiceTests.swift
├── Utilities/
│   └── ...
└── Mocks/
    ├── MockAuthService.swift
    ├── MockFirestoreClient.swift
    └── ...
```

### UI Tests

```
TopDogUITests/
├── AuthFlowTests.swift
├── LobbyFlowTests.swift
├── DraftRoomFlowTests.swift
└── PaymentFlowTests.swift
```

### Snapshot Tests

```swift
// Using swift-snapshot-testing
func testTournamentCard() {
    let card = TournamentCard(tournament: .mock)
    assertSnapshot(matching: card, as: .image(layout: .device(config: .iPhone13)))
}
```

### Performance Tests

```swift
func testPlayerListScrollPerformance() {
    measure(metrics: [XCTOSSignpostMetric.scrollDraggingMetric]) {
        // Scroll through player list
        app.swipeUp()
        app.swipeUp()
        app.swipeDown()
    }
}
```

---

## 8. CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ios.yml
name: iOS CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: macos-14
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.2.app
      
      - name: Cache SPM
        uses: actions/cache@v3
        with:
          path: .build
          key: ${{ runner.os }}-spm-${{ hashFiles('**/Package.resolved') }}
      
      - name: Build
        run: xcodebuild build -scheme TopDog -destination 'platform=iOS Simulator,name=iPhone 15'
      
      - name: Test
        run: xcodebuild test -scheme TopDog -destination 'platform=iOS Simulator,name=iPhone 15'
      
      - name: SwiftLint
        run: swiftlint lint --strict

  deploy-testflight:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: macos-14
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Fastlane
        run: bundle install
      
      - name: Deploy to TestFlight
        run: bundle exec fastlane beta
        env:
          APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
```

### Fastlane

```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    increment_build_number(xcodeproj: "TopDog.xcodeproj")
    build_app(scheme: "TopDog")
    upload_to_testflight
  end
  
  desc "Push a new release to the App Store"
  lane :release do
    increment_version_number(xcodeproj: "TopDog.xcodeproj")
    increment_build_number(xcodeproj: "TopDog.xcodeproj")
    build_app(scheme: "TopDog")
    upload_to_app_store
  end
end
```

---

## 9. App Store Preparation

### Required Assets

| Asset | Specification |
|-------|---------------|
| App Icon | 1024x1024 PNG (no alpha) |
| Screenshots | 6.7" (1290x2796), 6.5" (1284x2778), 5.5" (1242x2208) |
| App Preview Video | Optional, 15-30 seconds |
| App Name | "TopDog - Best Ball Fantasy" (30 char max) |
| Subtitle | "Draft. Compete. Win." (30 char max) |
| Description | 4000 char max |
| Keywords | 100 char max, comma-separated |
| Privacy Policy URL | Required |
| Support URL | Required |

### App Store Review Considerations

| Concern | Mitigation |
|---------|------------|
| **Gambling/Contests** | Clearly distinguish fantasy sports from gambling in metadata |
| **Payments** | Use Apple Pay / IAP where required, document third-party payment justification |
| **Location** | Explain geo-compliance requirements |
| **Age Rating** | 17+ (Frequent/Intense Contests) |

### TestFlight Beta

- Internal testers: Up to 100 (no review needed)
- External testers: Up to 10,000 (requires beta review)
- Plan: Start internal, expand to external after stability

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Project setup, core infrastructure, design system

- [ ] Create Xcode project with folder structure
- [ ] Configure Firebase SDK (Auth, Firestore)
- [ ] Implement design system (colors, typography, spacing, haptics)
- [ ] Build core components (TDButton, TDCard, TDTextField)
- [ ] Implement network layer (APIClient, FirestoreClient)
- [ ] Implement auth service
- [ ] Set up SwiftLint
- [ ] Set up GitHub Actions (build + test)

**Deliverable:** App launches, can authenticate with Firebase

### Phase 2: Auth Flow (Week 2-3)

**Goal:** Complete authentication experience

- [ ] Login screen
- [ ] Sign up screen (with username validation)
- [ ] Forgot password
- [ ] Biometric authentication
- [ ] Auth state persistence
- [ ] Logout

**Deliverable:** User can create account, log in, log out

### Phase 3: Lobby (Week 3-4)

**Goal:** Tournament browsing and joining

- [ ] Tab bar navigation
- [ ] Lobby view with tournament list
- [ ] Tournament card component
- [ ] Pull-to-refresh
- [ ] Filter/sort sheet
- [ ] Tournament detail sheet
- [ ] Join tournament flow (without payment)

**Deliverable:** User can browse and join free tournaments

### Phase 4: Draft Room - Core (Week 4-6)

**Goal:** Functional draft room

- [ ] Draft room container
- [ ] Player list (virtualized, 60fps)
- [ ] Player row component
- [ ] Position filters
- [ ] Search
- [ ] Timer display
- [ ] Draft board (basic)
- [ ] Make a pick (Firestore write)
- [ ] Real-time pick updates

**Deliverable:** User can enter draft and make picks

### Phase 5: Draft Room - Polish (Week 6-8)

**Goal:** World-class draft experience

- [ ] Player detail sheet (stats, history)
- [ ] Queue management (drag to reorder)
- [ ] Roster view
- [ ] Haptics throughout
- [ ] Timer haptics (warning, urgent)
- [ ] Pick confirmation with animation
- [ ] Autodraft settings
- [ ] Leave draft confirmation

**Deliverable:** Draft room is buttery smooth

### Phase 6: Live Activities & Dynamic Island (Week 8-9)

**Goal:** Integrate existing Swift code

- [ ] Integrate DraftTimerActivityManager
- [ ] Start/update/end Live Activity from draft room
- [ ] Dynamic Island compact view
- [ ] Dynamic Island expanded view
- [ ] Lock screen Live Activity
- [ ] Test on physical device

**Deliverable:** Draft timer appears on Dynamic Island

### Phase 7: My Teams & Profile (Week 9-10)

**Goal:** Complete non-draft features

- [ ] My Teams list
- [ ] Team detail view
- [ ] Playoff bracket view
- [ ] Profile tab
- [ ] Settings
- [ ] Push notification preferences

**Deliverable:** All main tabs functional

### Phase 8: Wallet & Payments (Week 10-11)

**Goal:** Money in, money out

- [ ] Balance display
- [ ] Deposit flow (Stripe)
- [ ] Apple Pay integration
- [ ] Withdraw flow
- [ ] Transaction history
- [ ] Payment methods management

**Deliverable:** User can deposit and withdraw funds

### Phase 9: Push Notifications (Week 11-12)

**Goal:** Engagement features

- [ ] FCM integration
- [ ] Draft starting soon
- [ ] Your turn to pick
- [ ] Tournament filled
- [ ] Deep linking from notifications

**Deliverable:** Users get notified of important events

### Phase 10: Widgets (Week 12)

**Goal:** Home screen presence

- [ ] Upcoming drafts widget (small, medium)
- [ ] Live draft widget (shows current pick)
- [ ] Widget configuration

**Deliverable:** Users can add widgets to home screen

### Phase 11: Testing & Polish (Week 12-14)

**Goal:** Production ready

- [ ] 80%+ unit test coverage
- [ ] UI tests for critical paths
- [ ] Performance profiling (Instruments)
- [ ] Memory leak hunting
- [ ] Accessibility audit (VoiceOver)
- [ ] Edge case testing
- [ ] Crash-free validation

**Deliverable:** App is stable and performant

### Phase 12: App Store Submission (Week 14-15)

**Goal:** Ship it

- [ ] App Store Connect setup
- [ ] Screenshots for all device sizes
- [ ] App preview video (optional)
- [ ] Metadata (description, keywords)
- [ ] Privacy policy
- [ ] TestFlight external beta
- [ ] Address beta feedback
- [ ] Submit for review
- [ ] Launch

**Deliverable:** App is live on the App Store

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Minimum iOS** | iOS 16.1+ | Supports Live Activities/Dynamic Island. 95%+ adoption. |
| **iPad** | iPhone app fills screen, no iPad layouts | Native iPad is a future project. All or nothing. |
| **Offline mode** | My Teams + Exposure + Profile cached | Draft room requires online (real-time). |
| **Social auth** | Apple Sign In + Email/Password | Apple Sign In required by App Store. Keep it simple. |
| **Analytics** | Firebase Analytics | Already using Firebase. Free. Can add Amplitude later. |

### Offline Mode Implementation

Cache these locally using SwiftData or Core Data:

| Data | Cache Strategy | Refresh |
|------|----------------|---------|
| My Teams | Persist to disk | On app launch + pull-to-refresh |
| Exposure | Persist to disk | On app launch + pull-to-refresh |
| User Profile | Persist to disk | On profile change |
| Tournament List | Memory cache only | Always fetch fresh |
| Draft Room | No cache (real-time) | Requires network |

User can browse teams and exposure offline. Joining tournaments and drafting requires network.

### iPad Behavior

```swift
// Info.plist - Remove iPad from supported devices OR
// Let iPhone app run on iPad in compatibility mode

// The app will:
// - Fill the iPad screen (not letterboxed)
// - Use iPhone layouts (no Split View support)
// - Work in portrait only

// Native iPad app is a separate future project
```

---

## Next Steps

1. **BLOCKER:** Set up Apple Developer Account ($99/year)
2. Create Xcode project
3. Set up Firebase iOS SDK
4. Begin Phase 1: Foundation

---

**Document Status:** Ready for execution  
**Last Updated:** January 2026
