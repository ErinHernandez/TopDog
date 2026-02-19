# iOS Infrastructure

**For:** Subagent building navigation, errors, and App Store prep  
**Output:** `TopDog/App/`, `TopDog/Core/Utilities/`, and app configuration

---

## §1 App Shell

### App Entry Point

Create `App/TopDogApp.swift`:

```swift
// TopDog/App/TopDogApp.swift
import SwiftUI
import FirebaseCore

@main
struct TopDogApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @State private var appState = AppState.shared
    @State private var router = AppRouter.shared
    
    var body: some Scene {
        WindowGroup {
            AuthGateView()
                .environment(appState)
                .environment(router)
                .onOpenURL { url in
                    router.handleDeepLink(url)
                }
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        FirebaseApp.configure()
        NotificationService.shared.setup()
        return true
    }
    
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        // FCM handles this via swizzling
    }
}
```

### App State

Create `App/AppState.swift`:

```swift
// TopDog/App/AppState.swift
import SwiftUI

@Observable
class AppState {
    static let shared = AppState()
    
    // User
    var currentUser: User?
    var userProfile: UserProfile?
    
    // Balance
    var balanceCents: Int = 0
    var balanceFormatted: String {
        String(format: "$%.2f", Double(balanceCents) / 100)
    }
    
    // Connectivity
    var isOnline = true
    
    // Feature flags
    var features: FeatureFlags = .default
    
    private init() {}
    
    func refreshUser() async {
        // Fetch latest user data
    }
    
    func refreshBalance() async {
        // Fetch latest balance
    }
}

struct FeatureFlags {
    var liveActivitiesEnabled: Bool
    var slowDraftsEnabled: Bool
    var applePayEnabled: Bool
    
    static let `default` = FeatureFlags(
        liveActivitiesEnabled: true,
        slowDraftsEnabled: true,
        applePayEnabled: true
    )
}
```

### App Router

Create `App/AppRouter.swift`:

```swift
// TopDog/App/AppRouter.swift
import SwiftUI

@Observable
class AppRouter {
    static let shared = AppRouter()
    
    // Tab navigation
    var selectedTab: AppTab = .lobby
    
    // Stack navigation (within tabs)
    var navigationPath = NavigationPath()
    
    // Modal presentations
    var activeSheet: Sheet?
    var activeFullScreenCover: FullScreenCover?
    var activeAlert: AlertConfig?
    
    private init() {}
    
    // MARK: - Sheet Types
    
    enum Sheet: Identifiable {
        case joinTournament(Tournament)
        case deposit
        case withdraw
        case settings
        case playerDetail(Player)
        
        var id: String {
            switch self {
            case .joinTournament(let t): return "join-\(t.id)"
            case .deposit: return "deposit"
            case .withdraw: return "withdraw"
            case .settings: return "settings"
            case .playerDetail(let p): return "player-\(p.id)"
            }
        }
    }
    
    // MARK: - Full Screen Cover Types
    
    enum FullScreenCover: Identifiable {
        case draftRoom(roomId: String)
        case auth
        case tutorial
        
        var id: String {
            switch self {
            case .draftRoom(let id): return "draft-\(id)"
            case .auth: return "auth"
            case .tutorial: return "tutorial"
            }
        }
    }
    
    // MARK: - Navigation Methods
    
    func navigate(to cover: FullScreenCover) {
        activeFullScreenCover = cover
    }
    
    func present(_ sheet: Sheet) {
        activeSheet = sheet
    }
    
    func dismiss() {
        if activeSheet != nil {
            activeSheet = nil
        } else if activeFullScreenCover != nil {
            activeFullScreenCover = nil
        }
    }
    
    func dismissDraftRoom() {
        activeFullScreenCover = nil
        selectedTab = .lobby
    }
    
    func switchTab(_ tab: AppTab) {
        Haptics.tabSwitch()
        selectedTab = tab
    }
    
    // MARK: - Deep Link Handling
    
    func handleDeepLink(_ url: URL) {
        // Handle custom scheme: topdog://
        if url.scheme == "topdog" {
            handleCustomScheme(url)
            return
        }
        
        // Handle universal links: https://topdog.dog/...
        handleUniversalLink(url)
    }
    
    private func handleCustomScheme(_ url: URL) {
        let path = url.host ?? ""
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        
        switch path {
        case "lobby":
            selectedTab = .lobby
            
        case "draft":
            if let roomId = pathComponents.first {
                navigate(to: .draftRoom(roomId: roomId))
            }
            
        case "teams":
            selectedTab = .teams
            
        case "deposit":
            present(.deposit)
            
        default:
            break
        }
    }
    
    private func handleUniversalLink(_ url: URL) {
        let path = url.path
        
        if path.hasPrefix("/draft/") {
            let roomId = String(path.dropFirst("/draft/".count))
            navigate(to: .draftRoom(roomId: roomId))
        } else if path.hasPrefix("/tournament/") {
            selectedTab = .lobby
        }
    }
}

// MARK: - Alert Config

struct AlertConfig: Identifiable {
    let id = UUID()
    let title: String
    let message: String
    let primaryButton: AlertButton
    var secondaryButton: AlertButton?
    
    struct AlertButton {
        let title: String
        let role: ButtonRole?
        let action: () -> Void
        
        static func `default`(_ title: String, action: @escaping () -> Void) -> AlertButton {
            AlertButton(title: title, role: nil, action: action)
        }
        
        static func destructive(_ title: String, action: @escaping () -> Void) -> AlertButton {
            AlertButton(title: title, role: .destructive, action: action)
        }
        
        static func cancel(_ title: String = "Cancel") -> AlertButton {
            AlertButton(title: title, role: .cancel, action: {})
        }
    }
}
```

---

## §2 Error Handling

Create `Core/Utilities/AppError.swift`:

```swift
// TopDog/Core/Utilities/AppError.swift
import Foundation

enum AppError: LocalizedError, Identifiable {
    var id: String { localizedDescription }
    
    // Network
    case networkUnavailable
    case timeout
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int)
    case clientError(statusCode: Int)
    
    // Auth
    case notAuthenticated
    case sessionExpired
    case invalidCredentials
    case emailAlreadyInUse
    case weakPassword
    case userNotFound
    case tooManyRequests
    case authError(message: String)
    
    // Draft
    case draftNotFound
    case notYourTurn
    case playerAlreadyDrafted
    case invalidPick
    case draftComplete
    
    // Payment
    case insufficientBalance
    case paymentFailed(reason: String)
    
    // Data
    case decodingError
    case notFound
    case forbidden
    
    // Firebase
    case firestoreError(message: String)
    
    // Server message
    case server(message: String)
    
    // Generic
    case unknown
    
    // MARK: - LocalizedError
    
    var errorDescription: String? {
        switch self {
        case .networkUnavailable:
            return "No internet connection"
        case .timeout:
            return "Request timed out"
        case .serverError(let code):
            return "Server error (\(code))"
        case .sessionExpired:
            return "Your session has expired"
        case .invalidCredentials:
            return "Invalid email or password"
        case .emailAlreadyInUse:
            return "Email already in use"
        case .weakPassword:
            return "Password is too weak"
        case .userNotFound:
            return "Account not found"
        case .tooManyRequests:
            return "Too many attempts. Try again later"
        case .notYourTurn:
            return "It's not your turn to pick"
        case .playerAlreadyDrafted:
            return "This player has already been drafted"
        case .insufficientBalance:
            return "Insufficient balance"
        case .server(let message):
            return message
        case .authError(let message):
            return message
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
        case .invalidCredentials:
            return "Check your email and password"
        case .insufficientBalance:
            return "Add funds to continue"
        case .tooManyRequests:
            return "Wait a few minutes before trying again"
        default:
            return "Please try again"
        }
    }
    
    var isRecoverable: Bool {
        switch self {
        case .networkUnavailable, .timeout, .serverError:
            return true
        default:
            return false
        }
    }
}
```

### Error View Component

Create `Core/DesignSystem/Components/ErrorView.swift`:

```swift
// TopDog/Core/DesignSystem/Components/ErrorView.swift
import SwiftUI

struct ErrorView: View {
    let error: AppError
    var onRetry: (() -> Void)?
    var onDismiss: (() -> Void)?
    
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
                if let onDismiss = onDismiss {
                    TDButton(title: "Dismiss", style: .secondary) {
                        onDismiss()
                    }
                }
                
                if let onRetry = onRetry, error.isRecoverable {
                    TDButton(title: "Try Again", style: .primary) {
                        onRetry()
                    }
                }
            }
        }
        .padding(Spacing.xl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.td.bgPrimary)
    }
}
```

---

## §3 Deep Links

### Universal Links Configuration

Create `apple-app-site-association` (deploy to `https://topdog.dog/.well-known/`):

```json
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
          "/invite/*",
          "/deposit",
          "/profile"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAMID.dog.topdog.app"]
  }
}
```

### URL Scheme (Info.plist)

Add to `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>topdog</string>
        </array>
        <key>CFBundleURLName</key>
        <string>dog.topdog.app</string>
    </dict>
</array>
```

### Associated Domains (Entitlements)

Add to `TopDog.entitlements`:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:topdog.dog</string>
    <string>webcredentials:topdog.dog</string>
</array>
```

---

## §4 App Store Checklist

### Required App Icons

Create all sizes in `Assets.xcassets/AppIcon.appiconset/`:

| Size | Scale | Filename |
|------|-------|----------|
| 1024×1024 | 1x | AppStore.png |
| 180×180 | 3x | iPhone-60@3x.png |
| 120×120 | 2x | iPhone-60@2x.png |
| 167×167 | 2x | iPad-83.5@2x.png |
| 152×152 | 2x | iPad-76@2x.png |
| 120×120 | 3x | iPhone-40@3x.png |
| 80×80 | 2x | iPhone-40@2x.png |
| 87×87 | 3x | iPhone-29@3x.png |
| 58×58 | 2x | iPhone-29@2x.png |
| 60×60 | 3x | iPhone-20@3x.png |
| 40×40 | 2x | iPhone-20@2x.png |

### Screenshot Sizes

| Device | Size | Count |
|--------|------|-------|
| iPhone 6.7" (15 Pro Max) | 1290×2796 | 5-10 |
| iPhone 6.5" (11 Pro Max) | 1284×2778 | 5-10 |
| iPhone 5.5" (8 Plus) | 1242×2208 | 5-10 |
| iPad Pro 12.9" | 2048×2732 | 5-10 (if supporting iPad) |

### App Store Metadata

```yaml
App Name: TopDog Fantasy (30 chars max)
Subtitle: Best Ball Draft Contests (30 chars max)

Primary Category: Sports
Secondary Category: Games > Strategy

Keywords (100 chars, comma-separated):
fantasy football,best ball,draft,NFL,contests,prizes,daily fantasy,DFS,dynasty,redraft

Promotional Text (170 chars, can change anytime):
Join the best ball revolution. Draft your team, watch the magic happen, win big prizes.

Description (4000 chars):
[Compelling description covering:]
- What is TopDog (best ball fantasy football)
- Key features (live drafts, Dynamic Island, buttery smooth UX)
- Prize opportunities
- Why players love it

What's New (4000 chars per version):
[Release notes for each version]

Support URL: https://topdog.dog/support
Marketing URL: https://topdog.dog
Privacy Policy URL: https://topdog.dog/privacy
```

### Required Capabilities

Enable in Xcode → Signing & Capabilities:

- [ ] Push Notifications
- [ ] Sign in with Apple
- [ ] Associated Domains
- [ ] App Groups (for Widget/Live Activity data)
- [ ] Background Modes → Remote notifications

### Certificates & Profiles

| Certificate | Purpose |
|-------------|---------|
| Apple Development | Local development builds |
| Apple Distribution | App Store & TestFlight |
| Apple Push Services | Push notifications |

| Profile | Purpose |
|---------|---------|
| TopDog Dev | Development provisioning |
| TopDog AdHoc | TestFlight internal testing |
| TopDog App Store | App Store distribution |

### App Review Preparation

1. **Demo Account**
   - Create test account for Apple reviewers
   - Pre-fund with test balance
   - Document credentials in App Store Connect

2. **Notes for Reviewers**
   ```
   Demo Account:
   Email: reviewer@topdog.dog
   Password: [secure password]
   
   This account has $100 test balance for trying deposit/withdrawal flows.
   Live drafts run every hour - the app will show available rooms.
   ```

3. **Export Compliance**
   - Does your app use encryption? Yes (HTTPS)
   - Is it exempt? Yes (standard HTTPS/TLS)

4. **Content Rights**
   - If using NFL player names/images, document licensing

---

## §5 Info.plist Configuration

Key entries for `Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
    </dict>
    
    <!-- Camera (if needed for profile photos) -->
    <key>NSCameraUsageDescription</key>
    <string>TopDog needs camera access to take profile photos</string>
    
    <!-- Photo Library -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>TopDog needs photo library access to select profile photos</string>
    
    <!-- Face ID -->
    <key>NSFaceIDUsageDescription</key>
    <string>Use Face ID to securely sign in to TopDog</string>
    
    <!-- Background Modes -->
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
    </array>
    
    <!-- Supported Orientations -->
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
    
    <!-- Launch Screen -->
    <key>UILaunchScreen</key>
    <dict>
        <key>UIColorName</key>
        <string>LaunchBackground</string>
        <key>UIImageName</key>
        <string>LaunchLogo</string>
    </dict>
</dict>
</plist>
```

---

## Acceptance Criteria

1. [ ] App launches without crashes
2. [ ] Deep links navigate to correct screens
3. [ ] Universal links work from Safari
4. [ ] Push notifications request permission
5. [ ] Error states show user-friendly messages
6. [ ] All App Store assets meet size requirements
7. [ ] Info.plist has all required keys
8. [ ] Entitlements configured for all capabilities
