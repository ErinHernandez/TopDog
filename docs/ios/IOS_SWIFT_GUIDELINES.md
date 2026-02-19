# iOS Swift Coding Guidelines

**For:** All iOS development on TopDog  
**Status:** Active  
**Reference:** Apple's official Swift API Design Guidelines

---

## Core Principles

1. **Clarity at point of use** - Most important goal
2. **Clarity over brevity** - Don't sacrifice readability
3. **Document every public declaration**
4. **Prefer value types** - Use structs over classes by default
5. **SwiftLint compatible** - Code should pass standard rules

---

## Naming Conventions

### Types & Protocols
- Use `UpperCamelCase`: `PlayerProfile`, `LeagueManager`, `Scoreable`
- Protocols describing capability use -able/-ible: `Equatable`, `Sendable`
- Protocols describing what something is use nouns: `Collection`, `Sequence`

### Everything Else
- Use `lowerCamelCase`: `playerScore`, `fetchLeagueData()`, `isActive`
- Acronyms uniform case: `userID`, `parseJSON`, `httpResponse`

### Methods & Functions
- Side effects → imperative verb: `player.updateScore()`, `league.reset()`
- No side effects → noun phrase: `player.formattedName`, `league.standings`
- Boolean properties read as assertions: `isEmpty`, `hasPlayers`, `canTrade`

### Mutating vs Non-Mutating Pairs

```swift
// Verb-based: mutating is imperative, non-mutating adds -ed/-ing
x.sort()              // mutates
z = x.sorted()        // returns new

x.append(y)           // mutates
z = x.appending(y)    // returns new

// Noun-based: non-mutating is noun, mutating adds form-
x = y.union(z)        // returns new
y.formUnion(z)        // mutates
```

### Argument Labels

```swift
// Omit when args can't be distinguished
min(x, y)
zip(sequence1, sequence2)

// Omit for value-preserving type conversions
Int64(someUInt32)
String(playerID)

// Include for narrowing conversions
UInt32(truncating: largeValue)

// First arg of preposition gets label
player.move(to: position)
roster.remove(at: index)
```

---

## Code Patterns

### Prefer Value Types

```swift
// ✅ Good - struct for data models
struct Player {
    let id: UUID
    var name: String
    var points: Int
}

// ✅ Good - enum for finite states
enum DraftStatus {
    case pending
    case inProgress(round: Int)
    case completed
}

// Use class only when you need:
// - Identity (===)
// - Inheritance
// - Shared mutable state (consider actor instead)
```

### Modern Concurrency (Swift 6+)

```swift
// ✅ Use async/await
func fetchPlayer(id: UUID) async throws -> Player {
    let data = try await networkService.fetch(endpoint: .player(id))
    return try JSONDecoder().decode(Player.self, from: data)
}

// ✅ Use actors for shared mutable state
actor LeagueStore {
    private var leagues: [UUID: League] = [:]

    func add(_ league: League) {
        leagues[league.id] = league
    }

    func get(_ id: UUID) -> League? {
        leagues[id]
    }
}

// ✅ Mark types as Sendable when thread-safe
struct PlayerScore: Sendable {
    let playerID: UUID
    let week: Int
    let points: Double
}
```

### Error Handling

```swift
// Define specific errors
enum LeagueError: Error, LocalizedError {
    case playerNotFound(UUID)
    case rosterFull(maxSize: Int)
    case tradeDeadlinePassed

    var errorDescription: String? {
        switch self {
        case .playerNotFound(let id):
            return "Player \(id) not found"
        case .rosterFull(let max):
            return "Roster is full (max \(max) players)"
        case .tradeDeadlinePassed:
            return "Trade deadline has passed"
        }
    }
}

// Use Result for async callbacks if not using async/await
func fetchRoster(completion: @escaping (Result<Roster, LeagueError>) -> Void)
```

### Optionals

```swift
// ✅ Use guard for early exit
func processPlayer(_ player: Player?) throws -> Stats {
    guard let player else {
        throw LeagueError.playerNotFound
    }
    return calculateStats(for: player)
}

// ✅ Use optional chaining
let teamName = player?.team?.name ?? "Free Agent"

// ✅ Use map/flatMap for transformations
let scores = players.compactMap { $0.weeklyScore }
```

---

## Package.swift Template

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "FantasyFootball",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "FantasyFootball", targets: ["FantasyFootball"])
    ],
    dependencies: [
        // Add dependencies here
    ],
    targets: [
        .target(
            name: "FantasyFootball",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency")
            ]
        ),
        .testTarget(
            name: "FantasyFootballTests",
            dependencies: ["FantasyFootball"]
        )
    ]
)
```

---

## Testing

```swift
import Testing

@Test("Player scores update correctly")
func playerScoreUpdate() {
    var player = Player(name: "Test", points: 0)
    player.addPoints(15)
    #expect(player.points == 15)
}

@Test("Cannot exceed roster limit", arguments: [8, 10, 12])
func rosterLimit(maxSize: Int) throws {
    var roster = Roster(maxSize: maxSize)
    for i in 0..<maxSize {
        try roster.add(Player(name: "Player \(i)"))
    }
    #expect(throws: LeagueError.rosterFull(maxSize: maxSize)) {
        try roster.add(Player(name: "Extra"))
    }
}
```

---

## Quick Reference

| Pattern | Example |
|---------|---------|
| Factory method | `makeIterator()`, `makePlayer()` |
| Boolean property | `isEmpty`, `hasPlayers`, `canTrade` |
| Computed property | `formattedScore`, `displayName` |
| Mutating method | `reset()`, `updateScore(_:)` |
| Non-mutating method | `sorted()`, `filtered(by:)` |
| Async method | `func fetch() async throws` |
| Type conversion | `String(playerID)`, `Double(score)` |

---

## Related Documents

- [IOS_MASTER_PLAN.md](./IOS_MASTER_PLAN.md) - Overall iOS implementation plan
- [IOS_DATA_MODELS.md](./IOS_DATA_MODELS.md) - Swift data model definitions
- [IOS_DESIGN_SYSTEM.md](./IOS_DESIGN_SYSTEM.md) - UI components and design tokens
- [IOS_SERVICES.md](./IOS_SERVICES.md) - Firebase, API, and service implementations
