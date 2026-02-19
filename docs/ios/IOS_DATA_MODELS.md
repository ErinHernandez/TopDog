# iOS Data Models

**For:** Subagent creating Swift Codable structs  
**Output:** `TopDog/Models/` files  
**Reference:** Web types in `lib/types/`

---

## §1 Player Models

Create `Models/Player.swift`:

```swift
// TopDog/Models/Player.swift
import Foundation
import SwiftUI

// MARK: - Position Enum

enum Position: String, Codable, CaseIterable, Identifiable {
    case qb = "QB"
    case rb = "RB"
    case wr = "WR"
    case te = "TE"
    case flex = "FLEX"
    case bench = "BN"
    
    var id: String { rawValue }
    
    var color: Color {
        switch self {
        case .qb: return Color(hex: "#F472B6")
        case .rb: return Color(hex: "#0fba80")
        case .wr: return Color(hex: "#FBBF25")
        case .te: return Color(hex: "#7C3AED")
        case .flex, .bench: return Color(hex: "#6B7280")
        }
    }
    
    var displayName: String {
        rawValue
    }
}

// MARK: - Player

struct Player: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let firstName: String
    let lastName: String
    let position: Position
    let team: String // 3-letter code (e.g., "CIN")
    let byeWeek: Int
    let adp: Double
    let projectedPoints: Double
    let rank: Int
    let headshotURL: String?
    
    // Optional stats (loaded on expand)
    var stats: PlayerStats?
    
    // Computed
    var fullName: String { "\(firstName) \(lastName)" }
    var positionTeam: String { "\(position.rawValue) - \(team)" }
    var byeWeekFormatted: String { "(\(byeWeek))" }
    
    // Hashable (exclude stats for comparison)
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Player, rhs: Player) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Player Stats

struct PlayerStats: Codable {
    let seasons: [SeasonStats]
    let projected: ProjectedStats?
}

struct SeasonStats: Codable, Identifiable {
    let year: Int
    let games: Int
    
    // Passing (QB)
    let completions: Int?
    let attempts: Int?
    let passingYards: Int?
    let passingTDs: Int?
    let interceptions: Int?
    let sacks: Int?
    
    // Rushing (RB, QB)
    let carries: Int?
    let rushingYards: Int?
    let rushingTDs: Int?
    let fumbles: Int?
    
    // Receiving (WR, TE, RB)
    let receptions: Int?
    let targets: Int?
    let receivingYards: Int?
    let receivingTDs: Int?
    
    var id: Int { year }
    
    // Computed
    var completionPercentage: Double? {
        guard let comp = completions, let att = attempts, att > 0 else { return nil }
        return Double(comp) / Double(att) * 100
    }
    
    var yardsPerCarry: Double? {
        guard let yards = rushingYards, let car = carries, car > 0 else { return nil }
        return Double(yards) / Double(car)
    }
    
    var yardsPerReception: Double? {
        guard let yards = receivingYards, let rec = receptions, rec > 0 else { return nil }
        return Double(yards) / Double(rec)
    }
}

struct ProjectedStats: Codable {
    let points: Double
    let passingYards: Int?
    let passingTDs: Int?
    let rushingYards: Int?
    let rushingTDs: Int?
    let receptions: Int?
    let receivingYards: Int?
    let receivingTDs: Int?
}
```

---

## §2 Tournament Models

Create `Models/Tournament.swift`:

```swift
// TopDog/Models/Tournament.swift
import Foundation

// MARK: - Tournament

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
    let startTime: Date?
    let logoURL: String?
    let backgroundURL: String?
    
    // Computed formatters
    var entryFeeFormatted: String {
        formatCurrency(entryFeeCents)
    }
    
    var firstPlaceFormatted: String {
        formatLargeCurrency(firstPlacePrizeCents)
    }
    
    var totalPrizeFormatted: String {
        formatLargeCurrency(totalPrizeCents)
    }
    
    var entriesFormatted: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: currentEntries)) ?? "\(currentEntries)"
    }
    
    var hasUnlimitedEntries: Bool {
        maxEntries == 0
    }
    
    var fillPercentage: Double {
        guard maxEntries > 0 else { return 0 }
        return min(Double(currentEntries) / Double(maxEntries), 1.0)
    }
    
    // Helpers
    private func formatCurrency(_ cents: Int) -> String {
        let dollars = Double(cents) / 100
        if dollars == floor(dollars) {
            return "$\(Int(dollars))"
        }
        return String(format: "$%.2f", dollars)
    }
    
    private func formatLargeCurrency(_ cents: Int) -> String {
        let dollars = cents / 100
        if dollars >= 1_000_000 {
            return String(format: "$%.1fM", Double(dollars) / 1_000_000)
        } else if dollars >= 1_000 {
            return "$\(dollars / 1000)K"
        }
        return "$\(dollars)"
    }
}

// MARK: - Enums

enum DraftSpeed: String, Codable {
    case fast = "fast"      // 30 seconds per pick
    case slow = "slow"      // 12 hours per pick
    
    var pickTimeSeconds: Int {
        switch self {
        case .fast: return 30
        case .slow: return 43200 // 12 hours
        }
    }
    
    var displayName: String {
        switch self {
        case .fast: return "Fast (30s)"
        case .slow: return "Slow (12hr)"
        }
    }
}

enum TournamentStatus: String, Codable {
    case open = "open"
    case filling = "filling"
    case full = "full"
    case drafting = "drafting"
    case complete = "complete"
}
```

---

## §3 Draft Room Models

Create `Models/DraftRoom.swift`:

```swift
// TopDog/Models/DraftRoom.swift
import Foundation

// MARK: - Draft Room

struct DraftRoom: Codable, Identifiable {
    let id: String
    let tournamentId: String
    let tournamentTitle: String
    var status: DraftRoomStatus
    var currentPickNumber: Int
    let totalPicks: Int // typically 216 (12 × 18)
    let pickTimeSeconds: Int
    let participants: [Participant]
    var picks: [DraftPick]
    
    // Computed
    var teamCount: Int { participants.count }
    var roundsCount: Int { totalPicks / teamCount }
    
    var currentRound: Int {
        (currentPickNumber - 1) / teamCount + 1
    }
    
    var currentPickInRound: Int {
        let pickInRound = (currentPickNumber - 1) % teamCount
        // Snake draft: even rounds are reversed
        if currentRound % 2 == 0 {
            return teamCount - pickInRound
        }
        return pickInRound + 1
    }
    
    var isComplete: Bool {
        currentPickNumber > totalPicks
    }
    
    func participantOnClock() -> Participant? {
        guard !isComplete else { return nil }
        let index = participantIndexForPick(currentPickNumber)
        return participants.first { $0.index == index }
    }
    
    func participantIndexForPick(_ pickNumber: Int) -> Int {
        let round = (pickNumber - 1) / teamCount + 1
        let pickInRound = (pickNumber - 1) % teamCount
        // Snake draft
        if round % 2 == 0 {
            return teamCount - 1 - pickInRound
        }
        return pickInRound
    }
    
    func pickNumberString(_ pickNumber: Int) -> String {
        let round = (pickNumber - 1) / teamCount + 1
        let pickInRound = (pickNumber - 1) % teamCount + 1
        return String(format: "%d.%02d", round, pickInRound)
    }
}

// MARK: - Draft Room Status

enum DraftRoomStatus: String, Codable {
    case waiting = "waiting"
    case countdown = "countdown"
    case active = "active"
    case paused = "paused"
    case complete = "complete"
}

// MARK: - Participant

struct Participant: Codable, Identifiable, Hashable {
    let id: String
    let odaId: String // TopDog user ID
    let username: String
    let index: Int // 0-11 for position in draft order
    let isUser: Bool // Is this the current user?
    let borderColor: String? // User's custom border color
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Participant, rhs: Participant) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Draft Pick

struct DraftPick: Codable, Identifiable {
    let id: String
    let pickNumber: Int
    let round: Int
    let pickInRound: Int
    let participantId: String
    let participantIndex: Int
    let player: Player
    let timestamp: Date
    
    var pickNumberString: String {
        String(format: "%d.%02d", round, pickInRound)
    }
}

// MARK: - Timer State

enum TimerState {
    case idle
    case active(remaining: Int)
    case warning(remaining: Int)  // <= 10 seconds
    case critical(remaining: Int) // <= 5 seconds
    case grace                    // Expired, in grace period
    case autopick                 // Grace expired, auto-picking
    
    var isUrgent: Bool {
        switch self {
        case .warning, .critical, .grace, .autopick:
            return true
        default:
            return false
        }
    }
}
```

---

## §4 User Models

Create `Models/User.swift`:

```swift
// TopDog/Models/User.swift
import Foundation

// MARK: - User

struct User: Codable, Identifiable {
    let id: String
    let email: String?
    let username: String
    let balanceCents: Int
    let createdAt: Date
    let emailVerified: Bool
    let phoneNumber: String?
    let phoneVerified: Bool
    
    var balanceFormatted: String {
        String(format: "$%.2f", Double(balanceCents) / 100)
    }
    
    var hasBalance: Bool {
        balanceCents > 0
    }
}

// MARK: - User Profile

struct UserProfile: Codable {
    let userId: String
    var displayName: String?
    var avatarURL: String?
    var country: String?
    var preferences: UserPreferences
    
    // Stats
    var tournamentsEntered: Int
    var totalWinningsCents: Int
    
    var totalWinningsFormatted: String {
        String(format: "$%.2f", Double(totalWinningsCents) / 100)
    }
}

// MARK: - User Preferences

struct UserPreferences: Codable {
    var draftAlerts: DraftAlertPreferences
    var biometricsEnabled: Bool
    var hapticFeedbackEnabled: Bool
}

struct DraftAlertPreferences: Codable {
    var roomFilled: Bool
    var draftStarting: Bool
    var twoPicksAway: Bool
    var onTheClock: Bool
    var tenSecondsRemaining: Bool
    var slowDraftEmailUpdates: Bool
    
    static let `default` = DraftAlertPreferences(
        roomFilled: true,
        draftStarting: true,
        twoPicksAway: true,
        onTheClock: true,
        tenSecondsRemaining: true,
        slowDraftEmailUpdates: true
    )
}
```

---

## §5 Queue Models

Create `Models/DraftQueue.swift`:

```swift
// TopDog/Models/DraftQueue.swift
import Foundation

// MARK: - Queued Player

struct QueuedPlayer: Codable, Identifiable {
    let id: String // Same as player.id
    let player: Player
    let queuedAt: Date
    var queuePosition: Int
}

// MARK: - Draft Queue State (Persisted)

struct DraftQueueState: Codable {
    let draftRoomId: String
    var players: [QueuedPlayer]
    let updatedAt: Date
    
    init(draftRoomId: String, players: [QueuedPlayer] = []) {
        self.draftRoomId = draftRoomId
        self.players = players
        self.updatedAt = Date()
    }
    
    mutating func add(_ player: Player) {
        guard !players.contains(where: { $0.id == player.id }) else { return }
        let queued = QueuedPlayer(
            id: player.id,
            player: player,
            queuedAt: Date(),
            queuePosition: players.count
        )
        players.append(queued)
        reindex()
    }
    
    mutating func remove(_ playerId: String) {
        players.removeAll { $0.id == playerId }
        reindex()
    }
    
    mutating func move(from source: Int, to destination: Int) {
        guard source != destination,
              source >= 0, source < players.count,
              destination >= 0, destination < players.count else { return }
        let player = players.remove(at: source)
        players.insert(player, at: destination)
        reindex()
    }
    
    mutating func moveToTop(_ playerId: String) {
        guard let index = players.firstIndex(where: { $0.id == playerId }),
              index > 0 else { return }
        let player = players.remove(at: index)
        players.insert(player, at: 0)
        reindex()
    }
    
    private mutating func reindex() {
        for i in 0..<players.count {
            players[i].queuePosition = i
        }
    }
    
    func contains(_ playerId: String) -> Bool {
        players.contains { $0.id == playerId }
    }
    
    var topPlayer: Player? {
        players.first?.player
    }
}
```

---

## §6 API Response Models

Create `Models/APIResponses.swift`:

```swift
// TopDog/Models/APIResponses.swift
import Foundation

// MARK: - Generic Response Wrapper

struct APIResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let error: APIErrorResponse?
}

struct APIErrorResponse: Codable {
    let code: String
    let message: String
}

// MARK: - Tournaments List

struct TournamentsResponse: Codable {
    let tournaments: [Tournament]
}

// MARK: - Draft Room Join

struct JoinDraftResponse: Codable {
    let roomId: String
    let participantId: String
}

// MARK: - Make Pick

struct MakePickResponse: Codable {
    let success: Bool
    let pick: DraftPick?
}

// MARK: - User Balance

struct BalanceResponse: Codable {
    let balanceCents: Int
}
```

---

## §7 Acceptance Criteria

After implementing all models:

1. [ ] All structs conform to `Codable`
2. [ ] All structs with collections conform to `Identifiable`
3. [ ] Position enum has correct color values
4. [ ] Currency formatting matches web (e.g., "$2.1M", "$25")
5. [ ] Date fields use proper `Date` type (not String)
6. [ ] Snake draft logic is correct in `DraftRoom`
7. [ ] Queue operations (add, remove, reorder) work correctly
8. [ ] All computed properties compile without errors
