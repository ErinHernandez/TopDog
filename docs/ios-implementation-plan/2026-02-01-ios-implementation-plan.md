# iOS Implementation Plan

**Date:** February 1, 2026
**Status:** Plan (Not Started)
**Target:** iOS 16+ minimum (from current iOS 17+)
**Purpose:** Enable support for draft phone users and global emerging markets

---

## Executive Summary

This plan outlines the changes needed to lower the iOS minimum deployment target from iOS 17.0 to iOS 16.0. The primary technical blocker is the `@Observable` macro (iOS 17+), which must be replaced with a backward-compatible solution.

**Why iOS 16?**
- Power users with dedicated "draft phones" (often iPhone 8/X stuck on iOS 16)
- Emerging market users with older devices
- Competitive advantage (Underdog dropped iOS 16 support)
- Aligns with the core value: "Fanatical about the user"

---

## Part 1: Current State Analysis

### 1.1 Project Structure

```
TopDog-iOS/
├── TopDog/                      # Main app target
│   ├── App/                     # App entry, state, router
│   ├── Core/                    # Services, networking, design system
│   ├── Features/                # Auth, tournaments, etc.
│   ├── Models/                  # Data models
│   └── Widgets/                 # Live Activity attributes
├── TopDogWidgetExtension/       # Widget extension (Live Activities)
├── TopDogTests/                 # Unit tests
├── TopDogUITests/               # UI tests
└── project.yml                  # XcodeGen configuration
```

### 1.2 Current Deployment Target

| Target | Current | Proposed |
|--------|---------|----------|
| Main App | iOS 17.0 | iOS 16.0 |
| Widget Extension | iOS 17.0 (via project default) | iOS 16.1 |

### 1.3 iOS 17+ Only Features Currently Used

| Feature | Location | iOS 17+ Requirement | Migration Path |
|---------|----------|---------------------|----------------|
| `@Observable` macro | `AppState.swift`, `AppRouter.swift`, `AuthViewModel.swift` | Yes (Observation framework) | Use Perception library |
| `@Environment(T.self)` | `RootView`, `MainTabView` | Yes (with Observable) | Use Perception's `@Environment` |
| `@State` with Observable | All views with `@Observable` models | Yes | Use Perception's `@Perceptible` |

### 1.4 Features Already iOS 16 Compatible

| Feature | Minimum iOS | Notes |
|---------|-------------|-------|
| Live Activities | iOS 16.1 | Already marked with `@available(iOS 16.1, *)` |
| NavigationStack | iOS 16.0 | Works on iOS 16 |
| SwiftUI basics | iOS 13+ | All standard components work |
| Firebase SDK | iOS 13+ | v10.x fully compatible |
| ActivityKit | iOS 16.1 | Already properly gated |

---

## Part 2: Technical Migration Strategy

### 2.1 Option Analysis

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **A: Perception Library** | Drop-in replacement, minimal code changes, active maintenance | Additional dependency | **Recommended** |
| **B: ObservableObject** | No external dependency | Significant refactoring, worse performance | Not recommended |
| **C: Conditional compilation** | Uses native APIs when available | Complex maintenance, two code paths | Not recommended |

### 2.2 Recommended Approach: Perception Library

[Point-Free's Perception](https://github.com/pointfreeco/swift-perception) backports `@Observable` to iOS 13+.

**Migration pattern:**

```swift
// BEFORE (iOS 17+)
import Observation

@Observable
final class AppState {
    var user: User?
}

struct RootView: View {
    @Environment(AppState.self) var appState
    
    var body: some View {
        // ...
    }
}
```

```swift
// AFTER (iOS 16+)
import Perception

@Perceptible
final class AppState {
    var user: User?
}

struct RootView: View {
    @Environment(AppState.self) var appState
    
    var body: some View {
        WithPerceptionTracking {
            // View content must be wrapped
        }
    }
}
```

---

## Part 3: Implementation Tasks

### Phase 1: Project Configuration (Estimated: Low effort)

#### 1.1 Update XcodeGen Configuration

**File:** `TopDog-iOS/project.yml`

```yaml
# Change this:
options:
  deploymentTarget:
    iOS: "17.0"

# To this:
options:
  deploymentTarget:
    iOS: "16.0"
```

#### 1.2 Add Perception Dependency

**File:** `TopDog-iOS/project.yml`

```yaml
packages:
  Firebase:
    url: https://github.com/firebase/firebase-ios-sdk
    majorVersion: 10.0.0
  # ADD THIS:
  Perception:
    url: https://github.com/pointfreeco/swift-perception
    majorVersion: 1.0.0

targets:
  TopDog:
    dependencies:
      - package: Firebase
        product: FirebaseAuth
      # ... other Firebase products ...
      # ADD THIS:
      - package: Perception
        product: Perception
```

#### 1.3 Regenerate Xcode Project

```bash
cd TopDog-iOS
xcodegen generate
```

---

### Phase 2: Observable Migration (Estimated: Medium effort)

#### 2.1 Files Requiring Migration

| File | Current | Changes Needed |
|------|---------|----------------|
| `TopDog/App/AppState.swift` | `@Observable` | → `@Perceptible` |
| `TopDog/App/AppRouter.swift` | `@Observable` | → `@Perceptible` |
| `TopDog/Features/Auth/ViewModels/AuthViewModel.swift` | `@Observable` | → `@Perceptible`, remove `@available(iOS 17.0, *)` |
| `TopDog/App/TopDogApp.swift` | `@Environment(AppState.self)` | Use Perception's `@Environment` |
| `TopDog/App/RootView` | Uses `@Environment` | Wrap body in `WithPerceptionTracking` |
| `TopDog/Features/Auth/Views/LoginView.swift` | `@State private var viewModel` | Wrap body in `WithPerceptionTracking` |

#### 2.2 Detailed Migration: AppState.swift

```swift
// TopDog/App/AppState.swift

// CHANGE THIS:
import Foundation
import Observation
import Combine

@Observable
final class AppState {
    // ...
}

// TO THIS:
import Foundation
import Perception
import Combine

@Perceptible
final class AppState {
    // Remove the guard check since we now support iOS 16
    private func observeAuthService() {
        // Remove: guard #available(iOS 17.0, *) else { return }
        
        authObservationTask = Task { @MainActor [weak self] in
            // ... rest stays the same
        }
    }
}
```

#### 2.3 Detailed Migration: AppRouter.swift

```swift
// TopDog/App/AppRouter.swift

// CHANGE THIS:
import SwiftUI
import Observation

@Observable
final class AppRouter {
    // ...
}

// TO THIS:
import SwiftUI
import Perception

@Perceptible
final class AppRouter {
    // ... rest stays the same
}
```

#### 2.4 Detailed Migration: AuthViewModel.swift

```swift
// TopDog/Features/Auth/ViewModels/AuthViewModel.swift

// CHANGE THIS:
import Foundation
import SwiftUI
import Observation

@available(iOS 17.0, *)
@Observable
@MainActor
public final class AuthViewModel {
    // ...
}

// TO THIS:
import Foundation
import SwiftUI
import Perception

@Perceptible
@MainActor
public final class AuthViewModel {
    // Remove @available attribute - now supports iOS 16+
    // ... rest stays the same
}
```

#### 2.5 Detailed Migration: Views

All views using `@Environment` with `@Observable` objects or `@State` with observable models need to wrap their body content in `WithPerceptionTracking`:

```swift
// TopDog/App/TopDogApp.swift

import SwiftUI
import FirebaseCore
import Perception  // ADD THIS

@main
struct TopDogApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @State private var appState = AppState()
    @State private var router = AppRouter()
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .environment(router)
                .preferredColorScheme(.dark)
        }
    }
}

struct RootView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router
    
    var body: some View {
        WithPerceptionTracking {  // ADD THIS WRAPPER
            Group {
                if appState.isAuthenticated {
                    MainTabView()
                } else {
                    AuthGateView()
                }
            }
            .animation(.easeInOut, value: appState.isAuthenticated)
        }  // ADD THIS
    }
}
```

```swift
// TopDog/Features/Auth/Views/LoginView.swift

import SwiftUI
import Perception  // ADD THIS

// REMOVE: @available(iOS 17.0, *)
struct LoginView: View {
    @State private var viewModel = AuthViewModel()
    
    var body: some View {
        WithPerceptionTracking {  // ADD THIS WRAPPER
            NavigationStack {
                // ... existing content ...
            }
        }  // ADD THIS
    }
}

#Preview {
    // REMOVE: if #available(iOS 17.0, *) { ... }
    LoginView()
}
```

---

### Phase 3: Live Activity Verification (Estimated: Low effort)

Live Activities already use `@available(iOS 16.1, *)` correctly. Verify:

1. **LiveActivityService.swift** - Already marked `@available(iOS 16.1, *)`
2. **Widget Extension** - Needs explicit deployment target in `project.yml`

#### 3.1 Widget Extension Configuration

```yaml
# TopDog-iOS/project.yml

targets:
  TopDogWidgetExtension:
    type: app-extension
    platform: iOS
    # ADD THIS:
    deploymentTarget:
      iOS: "16.1"
    sources:
      - path: TopDogWidgetExtension
    # ... rest stays the same
```

---

### Phase 4: Testing Strategy (Estimated: Medium effort)

#### 4.1 Simulator Testing Matrix

| Device | iOS Version | Priority | Test Focus |
|--------|-------------|----------|------------|
| iPhone 14 Pro | iOS 17.2 | High | Full feature set, Dynamic Island |
| iPhone 13 | iOS 16.4 | High | Core functionality without iOS 17 features |
| iPhone X | iOS 16.0 | High | Minimum supported version |
| iPhone 8 | iOS 16.0 | High | Draft phone simulation |
| iPhone SE (2nd) | iOS 16.0 | Medium | Small screen |

#### 4.2 Install Additional Simulators

In Xcode:
1. Open **Xcode > Preferences > Components**
2. Download iOS 16.0, iOS 16.4 simulators
3. Create test devices in **Window > Devices and Simulators**

#### 4.3 Test Cases

| Test Area | iOS 16 Specific | iOS 17+ Specific |
|-----------|-----------------|------------------|
| App launch | ✓ | ✓ |
| Auth flow | ✓ | ✓ |
| Navigation | ✓ | ✓ |
| Live Activities | Lock screen only | Dynamic Island + Lock screen |
| Push notifications | ✓ | ✓ |
| Observation/state | Via Perception | Native @Observable |

---

### Phase 5: Update Tests (Estimated: Low effort)

#### 5.1 Remove iOS 17 Guards from Tests

```swift
// TopDogTests/Auth/AuthViewModelTests.swift

// REMOVE any @available(iOS 17.0, *) guards
// Tests should now run on iOS 16+ simulators
```

#### 5.2 Add iOS 16 Test Target

Consider adding a test scheme specifically for iOS 16 validation.

---

## Part 4: Migration Checklist

### Pre-Migration

- [ ] Ensure Xcode 16 is installed (required for App Store as of April 2025)
- [ ] Back up current working state
- [ ] Create feature branch `feature/ios16-support`

### Configuration

- [ ] Update `project.yml` deployment target to iOS 16.0
- [ ] Add Perception package dependency
- [ ] Regenerate Xcode project with `xcodegen generate`

### Code Migration

- [ ] Migrate `AppState.swift` from `@Observable` to `@Perceptible`
- [ ] Migrate `AppRouter.swift` from `@Observable` to `@Perceptible`
- [ ] Migrate `AuthViewModel.swift` from `@Observable` to `@Perceptible`
- [ ] Remove `@available(iOS 17.0, *)` from `AuthViewModel`
- [ ] Remove `@available(iOS 17.0, *)` from `LoginView`
- [ ] Update Preview blocks to remove iOS 17 conditionals
- [ ] Add `WithPerceptionTracking` to all views using `@Environment` or `@State` with perceptible models:
  - [ ] `TopDogApp.swift` (RootView)
  - [ ] `LoginView.swift`
  - [ ] `SignUpView.swift`
  - [ ] `ForgotPasswordView.swift`
  - [ ] `AuthGateView.swift`
  - [ ] `MainTabView.swift`
  - [ ] Any other views using observable state

### Widget Extension

- [ ] Add explicit `deploymentTarget: iOS: "16.1"` to TopDogWidgetExtension
- [ ] Verify Live Activity code still works

### Testing

- [ ] Install iOS 16.0 simulator
- [ ] Install iOS 16.4 simulator
- [ ] Test on iOS 16.0 simulator (minimum)
- [ ] Test on iOS 17.x simulator (current)
- [ ] Test Live Activities on iOS 16.1+
- [ ] Test Dynamic Island on iOS 17+ / iPhone 14 Pro+
- [ ] Run unit tests on iOS 16 target
- [ ] Run UI tests on iOS 16 target

### Documentation

- [ ] Update README with iOS 16+ requirement
- [ ] Update any user-facing documentation
- [ ] Document testing matrix

---

## Part 5: Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Perception library bugs | Low | Medium | Library is actively maintained by Point-Free; fallback to ObservableObject if critical issues |
| Performance regression | Low | Low | Perception uses same observation mechanism; monitor with Instruments |
| Missing WithPerceptionTracking | Medium | Medium | Library provides runtime warnings in debug builds |
| Future iOS compatibility | Low | Low | Perception forwards to native @Observable on iOS 17+ |

---

## Part 6: Alternative Considerations

### 6.1 If Perception Doesn't Work

Fall back to `ObservableObject` pattern:

```swift
// This requires more changes but has no dependencies
import Combine

final class AppState: ObservableObject {
    @Published var user: User?
    @Published var isLoading: Bool = false
    // ... all properties need @Published
}

struct RootView: View {
    @StateObject private var appState = AppState()  // or @EnvironmentObject
    // ...
}
```

### 6.2 If Specific Views Need iOS 17+

For views that truly require iOS 17+ APIs (rare), use conditional:

```swift
struct SomeView: View {
    var body: some View {
        if #available(iOS 17.0, *) {
            // iOS 17+ specific implementation
            NewFancyView()
        } else {
            // iOS 16 fallback
            LegacyView()
        }
    }
}
```

---

## Part 7: PWA Considerations

The PWA (Progressive Web App) already supports older iOS versions:

| Feature | iOS Support | Notes |
|---------|-------------|-------|
| Service Worker | iOS 11.3+ | Basic offline support |
| Push Notifications | iOS 16.4+ | Web Push API |
| Home Screen Install | iOS 11.3+ | Via Safari "Add to Home" |

No changes needed for PWA to support iOS 16.

---

## Part 8: Timeline Estimate

| Phase | Tasks | Estimated Effort |
|-------|-------|------------------|
| Phase 1 | Configuration | 1 hour |
| Phase 2 | Observable Migration | 2-4 hours |
| Phase 3 | Live Activity Verification | 30 minutes |
| Phase 4 | Testing | 2-3 hours |
| Phase 5 | Test Updates | 30 minutes |
| **Total** | | **6-9 hours** |

---

## Appendix A: Files to Modify

### Complete File List

1. `TopDog-iOS/project.yml` - Configuration
2. `TopDog-iOS/TopDog/App/AppState.swift` - Observable → Perceptible
3. `TopDog-iOS/TopDog/App/AppRouter.swift` - Observable → Perceptible
4. `TopDog-iOS/TopDog/App/TopDogApp.swift` - Add Perception import, WithPerceptionTracking
5. `TopDog-iOS/TopDog/Features/Auth/ViewModels/AuthViewModel.swift` - Observable → Perceptible, remove @available
6. `TopDog-iOS/TopDog/Features/Auth/Views/LoginView.swift` - Add WithPerceptionTracking, remove @available
7. `TopDog-iOS/TopDog/Features/Auth/Views/SignUpView.swift` - Add WithPerceptionTracking
8. `TopDog-iOS/TopDog/Features/Auth/Views/ForgotPasswordView.swift` - Add WithPerceptionTracking
9. `TopDog-iOS/TopDog/Features/Auth/Views/AuthGateView.swift` - Add WithPerceptionTracking
10. `TopDog-iOS/TopDog/App/MainTabView.swift` - Add WithPerceptionTracking

### Files That Don't Need Changes

- `TopDog-iOS/TopDog/Core/Services/LiveActivityService.swift` - Already iOS 16.1+ gated
- `TopDog-iOS/TopDog/Core/Services/AuthService.swift` - No Observable usage
- `TopDog-iOS/TopDog/Core/Services/TournamentService.swift` - No Observable usage
- `TopDog-iOS/TopDog/Core/DesignSystem/*` - No Observable usage
- `TopDog-iOS/TopDog/Models/*` - No Observable usage
- `TopDog-iOS/TopDogWidgetExtension/*` - Already iOS 16.1+ gated

---

## Appendix B: Perception Library Reference

### Installation

```swift
// Package.swift or SPM
.package(url: "https://github.com/pointfreeco/swift-perception", from: "1.0.0")
```

### Key APIs

| Perception | Native (iOS 17+) | Purpose |
|------------|------------------|---------|
| `@Perceptible` | `@Observable` | Mark class as observable |
| `WithPerceptionTracking { }` | (automatic) | Enable observation in views |
| `@Perception.Bindable` | `@Bindable` | Create bindings |
| `@ObservationIgnored` | `@ObservationIgnored` | Exclude properties |

### Runtime Warnings

In debug builds, Perception warns if you access perceptible state outside `WithPerceptionTracking`:

```
🟣 Runtime Warning: Perceptible state '\AppState.user' was accessed from a view but is not being tracked.
```

This helps catch missing wrapper blocks during development.

---

## Appendix C: Testing Commands

```bash
# Run tests on specific iOS version
xcodebuild test \
  -project TopDog.xcodeproj \
  -scheme TopDog \
  -destination 'platform=iOS Simulator,name=iPhone X,OS=16.0'

# Run on iOS 17
xcodebuild test \
  -project TopDog.xcodeproj \
  -scheme TopDog \
  -destination 'platform=iOS Simulator,name=iPhone 14 Pro,OS=17.2'
```

---

## Appendix D: Swift Best Practices Reference (LLM Agent Guide)

> **Purpose:** Authoritative Swift coding standards for LLM agents generating iOS code. Follow these rules strictly.

---

### D.1 Naming Rules

#### Case Conventions
```
Types, Protocols     → UpperCamelCase    → UserProfile, Authenticatable
Everything else      → lowerCamelCase    → fetchUser(), isLoading, maxRetries
Acronyms             → Uniform case      → userID, htmlParser, URLSession
```

#### Method Naming by Side Effect
```
NO side effects  → noun phrase      → x.distance(to: y), items.sorted()
HAS side effects → imperative verb  → print(x), items.sort(), cache.clear()
```

#### Mutating vs Nonmutating Pairs
```swift
// Mutating: imperative verb
mutating func sort()
mutating func append(_ item: Element)
mutating func formUnion(_ other: Set)

// Nonmutating: past participle (-ed) or noun
func sorted() -> [Element]
func appending(_ item: Element) -> [Element]
func union(_ other: Set) -> Set
```

#### Parameter Naming
```swift
// CORRECT: Name by ROLE, not type
var greeting = "Hello"              // NOT: var string = "Hello"
func restock(from supplier: Factory) // NOT: func restock(from widgetFactory: Factory)

// CORRECT: Include words to avoid ambiguity
employees.remove(at: index)         // NOT: employees.remove(index)

// CORRECT: Omit needless words
allViews.remove(cancelButton)       // NOT: allViews.removeElement(cancelButton)
```

---

### D.2 Documentation Rules

```swift
/// Returns the user with the given ID.                    ← Summary (required)
///
/// Fetches from cache first, then network if needed.      ← Additional detail (optional)
///
/// - Parameter id: The unique identifier of the user.     ← Parameters
/// - Returns: The user if found, nil otherwise.           ← Return value
/// - Throws: `NetworkError.timeout` if request times out. ← Throws
func fetchUser(id: String) async throws -> User?
```

**Rules:**
- Write doc comment for EVERY public declaration
- Begin with single-sentence summary describing what it does
- Use `/// ` format, NOT `/** */`
- Describe functions as "Returns..." or "Fetches...", NOT "This method returns..."
- Describe properties as nouns: "The user's display name.", NOT "This property is..."

---

### D.3 Code Structure

#### Guard for Early Exit
```swift
// CORRECT: Use guard for preconditions, main logic stays flush-left
func process(values: [Int]) throws -> Int {
    guard let first = values.first else {
        throw ProcessingError.emptyArray
    }
    guard first >= 0 else {
        throw ProcessingError.negativeValue
    }
    
    // Main logic here at base indentation
    return values.reduce(0, +)
}

// AVOID: Nested if statements (pyramid of doom)
func process(values: [Int]) throws -> Int {
    if let first = values.first {
        if first >= 0 {
            return values.reduce(0, +)
        } else {
            throw ProcessingError.negativeValue
        }
    } else {
        throw ProcessingError.emptyArray
    }
}
```

#### For-Where Loops
```swift
// CORRECT
for item in collection where item.isActive {
    process(item)
}

// AVOID
for item in collection {
    if item.isActive {
        process(item)
    }
}
```

#### One Statement Per Line
```swift
// CORRECT
var a = 5
var b = 10

// AVOID
var a = 5; var b = 10
```

---

### D.4 Type Shortcuts

```swift
// ALWAYS use shorthand forms
var items: [String] = []           // NOT: Array<String>
var cache: [String: Int] = [:]     // NOT: Dictionary<String, Int>
var name: String?                  // NOT: Optional<String>

// Exception: When compiler requires long form
let index: Array<Element>.Index    // [Element].Index doesn't compile
```

---

### D.5 Access Control

```swift
// Use EXPLICIT access control for public API
public struct User {
    public let id: String
    public var name: String
    
    private var internalState: Int  // Hide implementation details
    
    public init(id: String, name: String) {
        self.id = id
        self.name = name
        self.internalState = 0
    }
}

// Omit access control for internal implementation (default is internal)
struct InternalHelper {
    var value: Int
}
```

**Rule:** Prefer `private` and `fileprivate` over naming conventions (no underscore prefixes).

---

### D.6 Optionals and Error Handling

#### When to Use Each
```
Optional<T>     → Single, obvious failure state (not found, empty)
throws          → Multiple distinguishable error states
Result<T, E>    → Async code OR need typed errors in switch
```

#### Optional Handling
```swift
// CORRECT: Use optional binding
if let user = fetchUser(id: id) {
    display(user)
}

// CORRECT: Use guard for early exit
guard let user = fetchUser(id: id) else {
    showError("User not found")
    return
}

// CORRECT: Use nil-coalescing for defaults
let name = user?.name ?? "Anonymous"

// AVOID: Force unwrapping (except in tests)
let user = fetchUser(id: id)!  // DANGEROUS
```

#### Error Handling
```swift
// Define specific error types
enum NetworkError: Error {
    case invalidURL
    case timeout
    case serverError(code: Int)
}

// Use do-catch with specific cases
do {
    let data = try await fetchData(from: url)
    process(data)
} catch NetworkError.timeout {
    showRetryDialog()
} catch NetworkError.serverError(let code) {
    log("Server error: \(code)")
} catch {
    showGenericError(error)
}
```

#### Result Type (for async/callbacks)
```swift
func fetch(completion: @escaping (Result<Data, NetworkError>) -> Void) {
    // ...
    completion(.success(data))
    // or
    completion(.failure(.timeout))
}

// Handling
fetch { result in
    switch result {
    case .success(let data):
        process(data)
    case .failure(let error):
        handle(error)
    }
}
```

---

### D.7 Memory Management (ARC)

#### Reference Type Rules
```swift
// Use weak for OPTIONAL back-references (delegates, parent refs)
class Child {
    weak var parent: Parent?  // Breaks retain cycle
}

// Use unowned for NON-OPTIONAL guaranteed-lifetime refs
class Invoice {
    unowned let customer: Customer  // Customer outlives Invoice
}

// Use strong for ownership (parent → child)
class Parent {
    var children: [Child] = []  // Parent owns children
}
```

#### Closure Capture
```swift
// ALWAYS use [weak self] in escaping closures that capture self
networkService.fetch { [weak self] result in
    guard let self else { return }
    self.handleResult(result)
}

// Use [unowned self] ONLY when certain self outlives closure
button.onTap { [unowned self] in
    self.handleTap()
}
```

---

### D.8 Concurrency (async/await)

#### Basic Async Functions
```swift
func fetchUser(id: String) async throws -> User {
    let data = try await networkService.fetch(endpoint: "/users/\(id)")
    return try decoder.decode(User.self, from: data)
}

// Calling
Task {
    do {
        let user = try await fetchUser(id: "123")
        await MainActor.run { updateUI(with: user) }
    } catch {
        await MainActor.run { showError(error) }
    }
}
```

#### Actors for Thread-Safe State
```swift
actor BankAccount {
    private var balance: Double = 0
    
    func deposit(_ amount: Double) {
        balance += amount
    }
    
    func withdraw(_ amount: Double) throws {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        balance -= amount
    }
    
    // nonisolated for methods that don't access state
    nonisolated func accountType() -> String {
        return "Checking"
    }
}

// Access requires await
let account = BankAccount()
await account.deposit(100)
```

#### MainActor for UI
```swift
@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []
    
    func loadItems() async {
        let fetched = await itemService.fetchAll()
        items = fetched  // Safe: already on MainActor
    }
}
```

---

### D.9 SwiftUI Patterns

#### State Management Selection
```
@State              → Simple value types owned by view
@StateObject        → Reference type created BY this view
@ObservedObject     → Reference type passed TO this view
@EnvironmentObject  → Shared across view hierarchy
@Observable (iOS17) → Modern macro-based observation
@Perceptible        → Perception library (iOS 16 backport)
```

#### ViewModel Pattern
```swift
// iOS 17+ with @Observable
@Observable
final class ProfileViewModel {
    var user: User?
    var isLoading = false
    var errorMessage: String?
    
    func loadProfile() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            user = try await userService.fetchCurrentUser()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// View
struct ProfileView: View {
    @State private var viewModel = ProfileViewModel()
    
    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if let user = viewModel.user {
                UserDetailView(user: user)
            }
        }
        .task { await viewModel.loadProfile() }
    }
}
```

#### iOS 16 with Perception
```swift
import Perception

@Perceptible
final class ProfileViewModel {
    var user: User?
    var isLoading = false
}

struct ProfileView: View {
    @State private var viewModel = ProfileViewModel()
    
    var body: some View {
        WithPerceptionTracking {  // REQUIRED wrapper
            // view content
        }
    }
}
```

---

### D.10 Protocol-Oriented Design

#### Prefer Protocols Over Inheritance
```swift
// CORRECT: Protocol with default implementation
protocol Loadable {
    var isLoading: Bool { get set }
    func startLoading()
    func stopLoading()
}

extension Loadable {
    mutating func startLoading() { isLoading = true }
    mutating func stopLoading() { isLoading = false }
}

// Any type can conform
struct UserLoader: Loadable {
    var isLoading = false
}

class DataManager: Loadable {
    var isLoading = false
}
```

#### Protocol Composition
```swift
// Combine protocols for specific requirements
typealias DataSource = Identifiable & Hashable & Codable

func process<T: DataSource>(_ item: T) {
    // Has access to id, hashValue, encode/decode
}
```

#### Dependency Injection via Protocols
```swift
// Define protocol for testability
protocol UserServiceProtocol {
    func fetchUser(id: String) async throws -> User
}

// Production implementation
class UserService: UserServiceProtocol {
    func fetchUser(id: String) async throws -> User {
        // Real network call
    }
}

// Mock for tests
class MockUserService: UserServiceProtocol {
    var mockUser: User?
    func fetchUser(id: String) async throws -> User {
        guard let user = mockUser else { throw TestError.notConfigured }
        return user
    }
}

// ViewModel accepts protocol, not concrete type
class ProfileViewModel {
    private let userService: UserServiceProtocol
    
    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
    }
}
```

---

### D.11 Testing

#### Async Test Structure
```swift
import XCTest

final class UserServiceTests: XCTestCase {
    var sut: UserService!  // System Under Test
    
    override func setUp() {
        super.setUp()
        sut = UserService()
    }
    
    override func tearDown() {
        sut = nil
        super.tearDown()
    }
    
    // Async test - mark as async throws
    func test_fetchUser_returnsUser() async throws {
        let user = try await sut.fetchUser(id: "123")
        
        XCTAssertEqual(user.id, "123")
        XCTAssertNotNil(user.name)
    }
    
    // Test error cases
    func test_fetchUser_throwsOnInvalidID() async {
        do {
            _ = try await sut.fetchUser(id: "")
            XCTFail("Expected error to be thrown")
        } catch {
            XCTAssertTrue(error is ValidationError)
        }
    }
}
```

#### Testing with Mocks
```swift
func test_viewModel_updatesOnFetch() async {
    // Arrange
    let mockService = MockUserService()
    mockService.mockUser = User(id: "1", name: "Test")
    let viewModel = ProfileViewModel(userService: mockService)
    
    // Act
    await viewModel.loadProfile()
    
    // Assert
    XCTAssertEqual(viewModel.user?.name, "Test")
    XCTAssertFalse(viewModel.isLoading)
}
```

---

### D.12 Quick Reference: Do's and Don'ts

| Do | Don't |
|----|-------|
| `guard let x = optional else { return }` | `if optional != nil { let x = optional! }` |
| `items.isEmpty` | `items.count == 0` |
| `for item in items where item.isValid` | `for item in items { if item.isValid {` |
| `[weak self]` in escaping closures | Strong self in long-lived closures |
| `@MainActor` for UI updates | `DispatchQueue.main.async` in async code |
| Protocol-based dependency injection | Hard-coded dependencies |
| `let` for immutable values | `var` for values that don't change |
| Specific error types | Generic `Error` or error codes |
| Short, focused functions | Long functions with multiple responsibilities |
| Documentation on public API | Undocumented public interfaces |

---

### D.13 Code Template: Feature Module

```swift
// MARK: - Model
struct Tournament: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let startDate: Date
    var status: Status
    
    enum Status: String, Codable {
        case upcoming, live, completed
    }
}

// MARK: - Service Protocol
protocol TournamentServiceProtocol {
    func fetchAll() async throws -> [Tournament]
    func fetch(id: String) async throws -> Tournament
}

// MARK: - Service Implementation
final class TournamentService: TournamentServiceProtocol {
    private let networkClient: NetworkClient
    
    init(networkClient: NetworkClient = .shared) {
        self.networkClient = networkClient
    }
    
    func fetchAll() async throws -> [Tournament] {
        try await networkClient.get("/tournaments")
    }
    
    func fetch(id: String) async throws -> Tournament {
        try await networkClient.get("/tournaments/\(id)")
    }
}

// MARK: - ViewModel
@Observable
@MainActor
final class TournamentListViewModel {
    private let service: TournamentServiceProtocol
    
    var tournaments: [Tournament] = []
    var isLoading = false
    var errorMessage: String?
    
    init(service: TournamentServiceProtocol = TournamentService()) {
        self.service = service
    }
    
    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        
        do {
            tournaments = try await service.fetchAll()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - View
struct TournamentListView: View {
    @State private var viewModel = TournamentListViewModel()
    
    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if let error = viewModel.errorMessage {
                    ErrorView(message: error, retryAction: { Task { await viewModel.load() } })
                } else {
                    List(viewModel.tournaments) { tournament in
                        TournamentRow(tournament: tournament)
                    }
                }
            }
            .navigationTitle("Tournaments")
        }
        .task { await viewModel.load() }
    }
}
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-01 | Initial plan |
| 1.1 | 2026-02-01 | Added Appendix D: Swift Best Practices Reference |
