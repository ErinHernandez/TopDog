# iOS Services

**For:** Subagent building network, auth, and platform services  
**Output:** `TopDog/Core/Services/` and `TopDog/Core/Networking/` files

---

## §1 API Client

Create `Networking/APIClient.swift`:

```swift
// TopDog/Core/Networking/APIClient.swift
import Foundation

actor APIClient {
    static let shared = APIClient()
    
    private let baseURL: String
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    init() {
        #if DEBUG
        self.baseURL = "http://localhost:3000/api"
        #else
        self.baseURL = "https://topdog.dog/api"
        #endif
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - Generic Request
    
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        var urlComponents = URLComponents(string: "\(baseURL)\(endpoint)")!
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            throw AppError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add auth token
        if let token = await AuthService.shared.idToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add body
        if let body = body {
            request.httpBody = try encoder.encode(body)
        }
        
        // Execute
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AppError.invalidResponse
        }
        
        // Handle status codes
        switch httpResponse.statusCode {
        case 200..<300:
            return try decoder.decode(T.self, from: data)
        case 401:
            throw AppError.sessionExpired
        case 403:
            throw AppError.forbidden
        case 404:
            throw AppError.notFound
        case 400..<500:
            if let errorResponse = try? decoder.decode(APIErrorResponse.self, from: data) {
                throw AppError.server(message: errorResponse.message)
            }
            throw AppError.clientError(statusCode: httpResponse.statusCode)
        case 500..<600:
            throw AppError.serverError(statusCode: httpResponse.statusCode)
        default:
            throw AppError.unknown
        }
    }
    
    // MARK: - Convenience Methods
    
    func get<T: Decodable>(_ endpoint: String, query: [URLQueryItem]? = nil) async throws -> T {
        try await request(endpoint: endpoint, method: .get, queryItems: query)
    }
    
    func post<T: Decodable>(_ endpoint: String, body: Encodable? = nil) async throws -> T {
        try await request(endpoint: endpoint, method: .post, body: body)
    }
    
    func put<T: Decodable>(_ endpoint: String, body: Encodable? = nil) async throws -> T {
        try await request(endpoint: endpoint, method: .put, body: body)
    }
    
    func delete<T: Decodable>(_ endpoint: String) async throws -> T {
        try await request(endpoint: endpoint, method: .delete)
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}
```

---

## §2 Auth Service

Create `Services/AuthService.swift`:

```swift
// TopDog/Core/Services/AuthService.swift
import Foundation
import FirebaseAuth
import AuthenticationServices

@Observable
class AuthService {
    static let shared = AuthService()
    
    private(set) var user: FirebaseAuth.User?
    private(set) var isAuthenticated = false
    private(set) var isLoading = true
    private(set) var error: AppError?
    
    private var authStateListener: AuthStateDidChangeListenerHandle?
    
    private init() {
        setupAuthStateListener()
    }
    
    private func setupAuthStateListener() {
        authStateListener = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.user = user
            self?.isAuthenticated = user != nil
            self?.isLoading = false
        }
    }
    
    // MARK: - Token
    
    var idToken: String? {
        get async {
            try? await user?.getIDToken()
        }
    }
    
    // MARK: - Email Auth
    
    func signIn(email: String, password: String) async throws {
        isLoading = true
        error = nil
        
        do {
            try await Auth.auth().signIn(withEmail: email, password: password)
        } catch let authError as NSError {
            error = mapFirebaseError(authError)
            throw error!
        }
        
        isLoading = false
    }
    
    func signUp(email: String, password: String) async throws {
        isLoading = true
        error = nil
        
        do {
            try await Auth.auth().createUser(withEmail: email, password: password)
        } catch let authError as NSError {
            error = mapFirebaseError(authError)
            throw error!
        }
        
        isLoading = false
    }
    
    func sendPasswordReset(email: String) async throws {
        do {
            try await Auth.auth().sendPasswordReset(withEmail: email)
        } catch let authError as NSError {
            throw mapFirebaseError(authError)
        }
    }
    
    // MARK: - Apple Sign In
    
    func signInWithApple(credential: ASAuthorizationAppleIDCredential, nonce: String) async throws {
        guard let appleIDToken = credential.identityToken,
              let idTokenString = String(data: appleIDToken, encoding: .utf8) else {
            throw AppError.invalidCredentials
        }
        
        let firebaseCredential = OAuthProvider.appleCredential(
            withIDToken: idTokenString,
            rawNonce: nonce,
            fullName: credential.fullName
        )
        
        try await Auth.auth().signIn(with: firebaseCredential)
    }
    
    // MARK: - Sign Out
    
    func signOut() throws {
        try Auth.auth().signOut()
    }
    
    // MARK: - Error Mapping
    
    private func mapFirebaseError(_ error: NSError) -> AppError {
        let code = AuthErrorCode(rawValue: error.code)
        
        switch code {
        case .wrongPassword, .invalidEmail:
            return .invalidCredentials
        case .emailAlreadyInUse:
            return .emailAlreadyInUse
        case .weakPassword:
            return .weakPassword
        case .userNotFound:
            return .userNotFound
        case .networkError:
            return .networkUnavailable
        case .tooManyRequests:
            return .tooManyRequests
        default:
            return .authError(message: error.localizedDescription)
        }
    }
}
```

---

## §3 Draft Room Service

Create `Services/DraftRoomService.swift`:

```swift
// TopDog/Core/Services/DraftRoomService.swift
import Foundation
import FirebaseFirestore

@Observable
class DraftRoomService {
    private let db = Firestore.firestore()
    private var listeners: [ListenerRegistration] = []
    
    var draftRoom: DraftRoom?
    var picks: [DraftPick] = []
    var availablePlayers: [Player] = []
    var isLoading = false
    var error: AppError?
    
    // MARK: - Subscribe to Draft Room
    
    func subscribe(roomId: String) {
        unsubscribe() // Clear any existing listeners
        isLoading = true
        
        // Listen to draft room document
        let roomListener = db.collection("draftRooms")
            .document(roomId)
            .addSnapshotListener { [weak self] snapshot, error in
                if let error = error {
                    self?.error = .firestoreError(message: error.localizedDescription)
                    return
                }
                
                guard let data = snapshot?.data() else { return }
                
                do {
                    self?.draftRoom = try Firestore.Decoder().decode(DraftRoom.self, from: data)
                    self?.isLoading = false
                } catch {
                    self?.error = .decodingError
                }
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
                
                // Update available players
                self?.updateAvailablePlayers()
            }
        listeners.append(picksListener)
    }
    
    func unsubscribe() {
        listeners.forEach { $0.remove() }
        listeners.removeAll()
        draftRoom = nil
        picks = []
    }
    
    // MARK: - Available Players
    
    private var allPlayers: [Player] = []
    
    func loadPlayers() async {
        do {
            let response: [Player] = try await APIClient.shared.get("/players")
            allPlayers = response
            updateAvailablePlayers()
        } catch {
            self.error = error as? AppError ?? .unknown
        }
    }
    
    private func updateAvailablePlayers() {
        let draftedIds = Set(picks.map { $0.player.id })
        availablePlayers = allPlayers.filter { !draftedIds.contains($0.id) }
    }
    
    // MARK: - Make Pick
    
    func makePick(playerId: String) async throws {
        guard let roomId = draftRoom?.id else {
            throw AppError.draftNotFound
        }
        
        let body = ["playerId": playerId]
        let _: MakePickResponse = try await APIClient.shared.post("/draft/\(roomId)/pick", body: body)
        
        Haptics.pickMade()
    }
    
    // MARK: - Computed State
    
    var isMyTurn: Bool {
        guard let room = draftRoom else { return false }
        return room.participantOnClock()?.isUser == true
    }
    
    var currentParticipant: Participant? {
        draftRoom?.participantOnClock()
    }
    
    var userParticipant: Participant? {
        draftRoom?.participants.first { $0.isUser }
    }
    
    func userPicksAway() -> Int? {
        guard let room = draftRoom,
              let userIndex = userParticipant?.index else { return nil }
        
        for pickNum in room.currentPickNumber...room.totalPicks {
            let participantIndex = room.participantIndexForPick(pickNum)
            if participantIndex == userIndex {
                return pickNum - room.currentPickNumber
            }
        }
        return nil
    }
    
    func rosterFor(participantId: String) -> [Position: [Player]] {
        let participantPicks = picks.filter { $0.participantId == participantId }
        return Dictionary(grouping: participantPicks.map(\.player), by: \.position)
    }
}
```

---

## §4 Tournament Service

Create `Services/TournamentService.swift`:

```swift
// TopDog/Core/Services/TournamentService.swift
import Foundation

@Observable
class TournamentService {
    static let shared = TournamentService()
    
    var tournaments: [Tournament] = []
    var featuredTournament: Tournament?
    var isLoading = false
    var error: AppError?
    
    private init() {}
    
    // MARK: - Fetch Tournaments
    
    func fetchTournaments() async {
        isLoading = true
        error = nil
        
        do {
            let response: TournamentsResponse = try await APIClient.shared.get("/tournaments")
            tournaments = response.tournaments
            featuredTournament = tournaments.first { $0.status == .open }
            isLoading = false
        } catch {
            self.error = error as? AppError ?? .unknown
            isLoading = false
        }
    }
    
    // MARK: - Join Tournament
    
    func joinTournament(
        tournamentId: String,
        entries: Int,
        draftSpeed: DraftSpeed
    ) async throws -> String {
        let body: [String: Any] = [
            "tournamentId": tournamentId,
            "entries": entries,
            "draftSpeed": draftSpeed.rawValue
        ]
        
        let response: JoinDraftResponse = try await APIClient.shared.post(
            "/tournaments/\(tournamentId)/join",
            body: body
        )
        
        return response.roomId
    }
}
```

---

## §5 Push Notifications

Create `Services/NotificationService.swift`:

```swift
// TopDog/Core/Services/NotificationService.swift
import Foundation
import UserNotifications
import FirebaseMessaging

class NotificationService: NSObject {
    static let shared = NotificationService()
    
    private override init() {
        super.init()
    }
    
    // MARK: - Setup
    
    func setup() {
        UNUserNotificationCenter.current().delegate = self
        Messaging.messaging().delegate = self
        
        // Define notification categories
        let pickAction = UNNotificationAction(
            identifier: "OPEN_DRAFT",
            title: "Open Draft",
            options: [.foreground]
        )
        
        let draftCategory = UNNotificationCategory(
            identifier: "DRAFT_PICK",
            actions: [pickAction],
            intentIdentifiers: [],
            options: []
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([draftCategory])
    }
    
    // MARK: - Request Permission
    
    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
            
            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            
            return granted
        } catch {
            return false
        }
    }
    
    // MARK: - Handle Token
    
    func updateFCMToken(_ token: String) async {
        // Send to your backend
        do {
            let _: EmptyResponse = try await APIClient.shared.post(
                "/user/fcm-token",
                body: ["token": token]
            )
        } catch {
            print("Failed to update FCM token: \(error)")
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationService: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        
        guard let type = userInfo["type"] as? String else { return }
        
        switch type {
        case "on_the_clock", "picks_away", "draft_starting":
            if let roomId = userInfo["roomId"] as? String {
                await MainActor.run {
                    AppRouter.shared.navigate(to: .draftRoom(roomId: roomId))
                }
            }
        default:
            break
        }
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        return [.banner, .sound, .badge]
    }
}

// MARK: - MessagingDelegate

extension NotificationService: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        
        Task {
            await updateFCMToken(token)
        }
    }
}

struct EmptyResponse: Codable {}
```

---

## §6 Live Activities

Create `Services/LiveActivityService.swift`:

```swift
// TopDog/Core/Services/LiveActivityService.swift
import ActivityKit
import Foundation

@available(iOS 16.1, *)
class LiveActivityService {
    static let shared = LiveActivityService()
    
    private var currentActivity: Activity<DraftTimerAttributes>?
    
    private init() {}
    
    // MARK: - Start Activity
    
    func startDraftActivity(
        tournamentName: String,
        roomId: String,
        pickNumber: Int,
        round: Int,
        pickInRound: Int,
        timeRemaining: Int,
        isMyTurn: Bool
    ) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("Live Activities not enabled")
            return
        }
        
        // End any existing activity
        endActivity()
        
        let attributes = DraftTimerAttributes(
            tournamentName: tournamentName,
            roomId: roomId
        )
        
        let state = DraftTimerAttributes.ContentState(
            timeRemaining: timeRemaining,
            pickNumber: pickNumber,
            round: round,
            pickInRound: pickInRound,
            isMyTurn: isMyTurn,
            currentPlayerName: nil,
            currentPlayerPosition: nil
        )
        
        do {
            currentActivity = try Activity.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil),
                pushType: .token
            )
            
            // Send push token to backend
            Task {
                if let token = currentActivity?.pushToken {
                    await sendPushToken(token, for: roomId)
                }
            }
        } catch {
            print("Failed to start Live Activity: \(error)")
        }
    }
    
    // MARK: - Update Activity
    
    func updateActivity(
        timeRemaining: Int,
        pickNumber: Int,
        round: Int,
        pickInRound: Int,
        isMyTurn: Bool,
        currentPlayerName: String? = nil,
        currentPlayerPosition: String? = nil
    ) {
        let state = DraftTimerAttributes.ContentState(
            timeRemaining: timeRemaining,
            pickNumber: pickNumber,
            round: round,
            pickInRound: pickInRound,
            isMyTurn: isMyTurn,
            currentPlayerName: currentPlayerName,
            currentPlayerPosition: currentPlayerPosition
        )
        
        Task {
            await currentActivity?.update(
                ActivityContent(state: state, staleDate: nil)
            )
        }
    }
    
    // MARK: - End Activity
    
    func endActivity() {
        Task {
            await currentActivity?.end(nil, dismissalPolicy: .immediate)
            currentActivity = nil
        }
    }
    
    // MARK: - Push Token
    
    private func sendPushToken(_ token: Data, for roomId: String) async {
        let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
        
        do {
            let _: EmptyResponse = try await APIClient.shared.post(
                "/draft/\(roomId)/live-activity-token",
                body: ["token": tokenString]
            )
        } catch {
            print("Failed to send Live Activity push token: \(error)")
        }
    }
}
```

Create `LiveActivities/DraftTimerAttributes.swift`:

```swift
// TopDog/LiveActivities/DraftTimerAttributes.swift
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
        
        var pickNumberString: String {
            String(format: "%d.%02d", round, pickInRound)
        }
        
        var timerFormatted: String {
            if timeRemaining >= 3600 {
                let hours = timeRemaining / 3600
                let minutes = (timeRemaining % 3600) / 60
                return String(format: "%d:%02d", hours, minutes)
            } else if timeRemaining >= 60 {
                let minutes = timeRemaining / 60
                let seconds = timeRemaining % 60
                return String(format: "%d:%02d", minutes, seconds)
            } else {
                return "\(timeRemaining)"
            }
        }
    }
    
    var tournamentName: String
    var roomId: String
}
```

---

## §7 Acceptance Criteria

After implementing all services:

1. [ ] API requests include auth token when available
2. [ ] Firestore listeners properly cleaned up on unsubscribe
3. [ ] Firebase Auth state changes update `isAuthenticated`
4. [ ] Push notification permission request works
5. [ ] Deep link handling navigates to correct screens
6. [ ] Live Activity starts/updates/ends correctly
7. [ ] Error mapping provides user-friendly messages
8. [ ] All async operations handle errors gracefully
