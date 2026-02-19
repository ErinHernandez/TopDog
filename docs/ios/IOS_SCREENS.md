# iOS Screens Specification

**For:** Subagent building screen views  
**Output:** `TopDog/Features/*/Views/` files  
**Reference:** `docs/UI_SPEC.md` for complete visual specs and screenshots

---

## §TabBar - Main Tab Bar

Create a custom tab bar (not SwiftUI's native `TabView`).

### Specification

| Property | Value |
|----------|-------|
| Height | 56px + home indicator |
| Background | #000000 |
| Border top | 1px #374151 |
| Icon size | 24px |
| Label size | 10px |
| Active color | #1DA1F2 |
| Inactive color | #9CA3AF |

### Tabs

| Tab | Icon | Label |
|-----|------|-------|
| 1 | `house.fill` | Lobby |
| 2 | `bolt.fill` | Live Drafts |
| 3 | `person.2.fill` | Teams |
| 4 | `chart.bar.fill` | Exposure |
| 5 | `person.fill` | Profile |

### Code

```swift
// Features/Shell/Views/TDTabBar.swift
struct TDTabBar: View {
    @Binding var selectedTab: AppTab
    var liveDraftsBadge: Int = 0
    
    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                TDTabItem(
                    tab: tab,
                    isSelected: selectedTab == tab,
                    badge: tab == .liveDrafts ? liveDraftsBadge : 0
                )
                .onTapGesture {
                    Haptics.tabSwitch()
                    selectedTab = tab
                }
            }
        }
        .frame(height: TouchTarget.large)
        .background(Color.td.tabBarBackground)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color.td.tabBarBorder),
            alignment: .top
        )
    }
}

struct TDTabItem: View {
    let tab: AppTab
    let isSelected: Bool
    var badge: Int = 0
    
    var body: some View {
        VStack(spacing: 4) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: tab.icon)
                    .font(.system(size: DraftLayout.footerIconSize))
                
                if badge > 0 {
                    Text("\(badge)")
                        .font(.system(size: 10.5, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(minWidth: 18, minHeight: 18)
                        .background(Color.td.navbarSolid)
                        .clipShape(Circle())
                        .offset(x: 10, y: -8)
                }
            }
            
            Text(tab.label)
                .font(.system(size: 10))
        }
        .foregroundColor(isSelected ? Color.td.tabBarIconActive : Color.td.tabBarIconInactive)
        .frame(maxWidth: .infinity)
    }
}

enum AppTab: String, CaseIterable {
    case lobby, liveDrafts, teams, exposure, profile
    
    var icon: String {
        switch self {
        case .lobby: return "house.fill"
        case .liveDrafts: return "bolt.fill"
        case .teams: return "person.2.fill"
        case .exposure: return "chart.bar.fill"
        case .profile: return "person.fill"
        }
    }
    
    var label: String {
        switch self {
        case .lobby: return "Lobby"
        case .liveDrafts: return "Live Drafts"
        case .teams: return "Teams"
        case .exposure: return "Exposure"
        case .profile: return "Profile"
        }
    }
}
```

---

## §Auth - Authentication Screens

### Auth Gate

Shows login if not authenticated, otherwise shows main app.

```swift
// Features/Auth/Views/AuthGateView.swift
struct AuthGateView: View {
    @State private var authService = AuthService.shared
    
    var body: some View {
        Group {
            if authService.isLoading {
                LoadingView()
            } else if authService.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
    }
}
```

### Login Screen

| Element | Specification |
|---------|--------------|
| Background | #101927 |
| Logo | TopDog "D" logo, centered, ~80px |
| Email field | TDTextField, icon: envelope |
| Password field | TDTextField, secure, icon: lock |
| Remember me | Checkbox + label |
| Sign In button | TDButton primary, large |
| Forgot password | Text link, centered |
| Sign up link | "Don't have an account? Sign Up" |

```swift
// Features/Auth/Views/LoginView.swift
struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var rememberMe = false
    @State private var isLoading = false
    @State private var error: AppError?
    @State private var showForgotPassword = false
    @State private var showSignUp = false
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            
            // Logo
            Image("topdog_logo")
                .resizable()
                .scaledToFit()
                .frame(height: 80)
                .padding(.bottom, Spacing.xxxl)
            
            // Form
            VStack(spacing: Spacing.lg) {
                TDTextField(
                    placeholder: "Email or phone number",
                    text: $email,
                    icon: "envelope",
                    keyboardType: .emailAddress
                )
                
                TDTextField(
                    placeholder: "Password",
                    text: $password,
                    isSecure: true,
                    icon: "lock"
                )
                
                // Remember me + Forgot password
                HStack {
                    Toggle(isOn: $rememberMe) {
                        Text("Remember me")
                            .font(.td.bodySM)
                            .foregroundColor(.td.textSecondary)
                    }
                    .toggleStyle(CheckboxToggleStyle())
                    
                    Spacer()
                    
                    Button("Forgot password?") {
                        showForgotPassword = true
                    }
                    .font(.td.bodySM)
                    .foregroundColor(.td.navbarSolid)
                }
            }
            .padding(.horizontal, Spacing.xl)
            
            Spacer()
            
            // Buttons
            VStack(spacing: Spacing.lg) {
                TDButton(
                    title: "Sign In",
                    style: .primary,
                    size: .large,
                    isLoading: isLoading,
                    isDisabled: email.isEmpty || password.isEmpty
                ) {
                    signIn()
                }
                
                // Sign up link
                HStack(spacing: 4) {
                    Text("Don't have an account?")
                        .foregroundColor(.td.textSecondary)
                    Button("Sign Up") {
                        showSignUp = true
                    }
                    .foregroundColor(.td.navbarSolid)
                }
                .font(.td.bodySM)
            }
            .padding(.horizontal, Spacing.xl)
            .padding(.bottom, Spacing.xxl)
        }
        .background(Color.td.bgPrimary)
        .sheet(isPresented: $showForgotPassword) {
            ForgotPasswordView()
        }
        .fullScreenCover(isPresented: $showSignUp) {
            SignUpView()
        }
    }
    
    private func signIn() {
        isLoading = true
        Task {
            do {
                try await AuthService.shared.signIn(email: email, password: password)
            } catch let err as AppError {
                error = err
            }
            isLoading = false
        }
    }
}
```

---

## §Lobby - Tournament Lobby

### Lobby View

Single featured tournament card filling the screen.

```swift
// Features/Lobby/Views/LobbyView.swift
struct LobbyView: View {
    @State private var tournamentService = TournamentService.shared
    @State private var showJoinSheet = false
    
    var body: some View {
        ZStack {
            Color.td.bgPrimary.ignoresSafeArea()
            
            if tournamentService.isLoading {
                TournamentCardSkeleton()
            } else if let tournament = tournamentService.featuredTournament {
                TournamentCardV3(
                    tournament: tournament,
                    onJoin: { showJoinSheet = true }
                )
                .padding(Spacing.lg)
            } else {
                EmptyStateView(
                    icon: "trophy",
                    title: "No Tournaments",
                    message: "Check back soon for new tournaments"
                )
            }
        }
        .sheet(isPresented: $showJoinSheet) {
            if let tournament = tournamentService.featuredTournament {
                JoinTournamentSheet(tournament: tournament)
            }
        }
        .task {
            await tournamentService.fetchTournaments()
        }
    }
}
```

### Tournament Card V3

| Element | Value |
|---------|-------|
| Min height | 650px |
| Padding | 21px |
| Border | ~4px blue (#1E3A5F) |
| Border radius | 16px |
| Background | #0a0a1a or tiled /wr_blue.png |

**Layout (top to bottom):**
1. Title: 46px black weight, uppercase, centered, 12px top margin
2. Spacer: min 24px
3. Logo: max 72px height, centered
4. Spacer: flex
5. Progress bar: 8px height
6. Join button: 57px height, 12px radius
7. Stats row: 48px height, 3 columns

```swift
// Features/Lobby/Views/TournamentCardV3.swift
struct TournamentCardV3: View {
    let tournament: Tournament
    let onJoin: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            // Title
            TournamentTitle(title: tournament.title)
                .padding(.top, Spacing.md)
            
            Spacer(minLength: Spacing.xl)
            
            // Logo
            AsyncImage(url: URL(string: tournament.logoURL ?? "")) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image("globe_placeholder")
                    .resizable()
                    .scaledToFit()
            }
            .frame(maxHeight: 72)
            
            Spacer()
            
            // Bottom section
            VStack(spacing: Spacing.lg) {
                // Progress bar
                if tournament.maxEntries > 0 {
                    TournamentProgressBar(
                        current: tournament.currentEntries,
                        max: tournament.maxEntries
                    )
                }
                
                // Join button
                TDButton(
                    title: "Join Tournament",
                    style: .primary,
                    size: .large
                ) {
                    onJoin()
                }
                
                // Stats row
                TournamentStatsRow(
                    entryFee: tournament.entryFeeFormatted,
                    entries: tournament.entriesFormatted,
                    firstPlace: tournament.firstPlaceFormatted
                )
            }
        }
        .padding(21)
        .frame(minHeight: 650)
        .background(Color(hex: "#0a0a1a"))
        .overlay(
            RoundedRectangle(cornerRadius: CornerRadius.xl)
                .stroke(Color(hex: "#1E3A5F"), lineWidth: 4)
        )
        .cornerRadius(CornerRadius.xl)
    }
}

struct TournamentTitle: View {
    let title: String
    
    var body: some View {
        Text(title.uppercased())
            .font(.system(size: 46, weight: .black))
            .foregroundColor(.white)
            .multilineTextAlignment(.center)
            .shadow(color: .black.opacity(0.5), radius: 4, x: 2, y: 2)
    }
}

struct TournamentProgressBar: View {
    let current: Int
    let max: Int
    
    var percentage: Double {
        guard max > 0 else { return 0 }
        return min(Double(current) / Double(max), 1.0)
    }
    
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                // Background
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.td.bgSecondary)
                
                // Fill
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.white.opacity(0.9))
                    .frame(width: geo.size.width * percentage)
            }
        }
        .frame(height: 8)
    }
}

struct TournamentStatsRow: View {
    let entryFee: String
    let entries: String
    let firstPlace: String
    
    var body: some View {
        HStack(spacing: Spacing.xl) {
            StatColumn(value: entryFee, label: "ENTRY")
            StatColumn(value: entries, label: "ENTRIES")
            StatColumn(value: firstPlace, label: "1ST PLACE")
        }
        .frame(height: 48)
    }
}

struct StatColumn: View {
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
            Text(label)
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.td.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }
}
```

---

## §DraftRoom - Draft Room

### Draft Room View

Main container coordinating all draft room components.

**Layout (top to bottom):**
1. Status bar: 26px content + safe area
2. Picks bar: 130px (conditional)
3. Tab content: flex
4. Footer tabs: 56px

```swift
// Features/DraftRoom/Views/DraftRoomView.swift
struct DraftRoomView: View {
    let roomId: String
    
    @State private var draftService = DraftRoomService()
    @State private var selectedTab: DraftTab = .players
    @State private var showExitConfirm = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Status bar
            DraftStatusBar(
                timer: draftService.draftRoom?.pickTimeSeconds ?? 30,
                isMyTurn: draftService.isMyTurn,
                onBack: { showExitConfirm = true }
            )
            
            // Picks bar (show on Players tab or when my turn)
            if selectedTab == .players || draftService.isMyTurn {
                PicksBar(
                    picks: draftService.picks,
                    participants: draftService.draftRoom?.participants ?? [],
                    currentPickNumber: draftService.draftRoom?.currentPickNumber ?? 1,
                    isMyTurn: draftService.isMyTurn
                )
            }
            
            // Tab content
            Group {
                switch selectedTab {
                case .players:
                    PlayerListView(
                        players: draftService.availablePlayers,
                        isMyTurn: draftService.isMyTurn,
                        onDraft: { player in
                            Task { try? await draftService.makePick(playerId: player.id) }
                        }
                    )
                case .queue:
                    QueueView()
                case .rosters:
                    RosterView(
                        participants: draftService.draftRoom?.participants ?? [],
                        picks: draftService.picks
                    )
                case .board:
                    DraftBoardView(
                        room: draftService.draftRoom,
                        picks: draftService.picks
                    )
                case .info:
                    DraftInfoView()
                }
            }
            .frame(maxHeight: .infinity)
            
            // Footer
            DraftFooter(selectedTab: $selectedTab)
        }
        .background(Color.td.bgPrimary)
        .ignoresSafeArea(.container, edges: .bottom)
        .onAppear {
            draftService.subscribe(roomId: roomId)
            Task { await draftService.loadPlayers() }
        }
        .onDisappear {
            draftService.unsubscribe()
        }
        .confirmationDialog("Leave Draft?", isPresented: $showExitConfirm) {
            Button("Leave Draft Room", role: .cancel) {
                AppRouter.shared.dismissDraftRoom()
            }
            Button("Withdraw Entry", role: .destructive) {
                // Handle withdrawal
            }
            Button("Stay", role: .cancel) {}
        }
    }
}

enum DraftTab: String, CaseIterable {
    case players, queue, rosters, board, info
}
```

### Player List View

| Element | Value |
|---------|-------|
| Filter bar height | 48px |
| Filter button width | 64px |
| Search bar height | 44px |
| Row height | 64px |
| Row padding X | 12px |

```swift
// Features/DraftRoom/Views/PlayerListView.swift
struct PlayerListView: View {
    let players: [Player]
    let isMyTurn: Bool
    let onDraft: (Player) -> Void
    
    @State private var searchText = ""
    @State private var selectedPositions: Set<Position> = []
    @State private var sortBy: SortOption = .adp
    @State private var expandedPlayerId: String?
    
    var filteredPlayers: [Player] {
        var result = players
        
        // Filter by search
        if !searchText.isEmpty {
            result = result.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.team.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // Filter by position
        if !selectedPositions.isEmpty {
            result = result.filter { selectedPositions.contains($0.position) }
        }
        
        // Sort
        switch sortBy {
        case .adp: result.sort { $0.adp < $1.adp }
        case .rank: result.sort { $0.rank < $1.rank }
        case .projected: result.sort { $0.projectedPoints > $1.projectedPoints }
        }
        
        return result
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Position filters
            PositionFilterBar(
                selectedPositions: $selectedPositions,
                positionCounts: countByPosition()
            )
            
            // Search bar
            SearchBar(text: $searchText)
            
            // Column headers
            ColumnHeaders(sortBy: $sortBy)
            
            // Player list
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(filteredPlayers) { player in
                        PlayerRow(
                            player: player,
                            isExpanded: expandedPlayerId == player.id,
                            isMyTurn: isMyTurn,
                            onTap: { toggleExpand(player.id) },
                            onDraft: { onDraft(player) }
                        )
                        
                        Divider()
                            .background(Color.td.borderDefault)
                    }
                }
            }
        }
    }
    
    private func toggleExpand(_ id: String) {
        withAnimation(.easeInOut(duration: 0.2)) {
            expandedPlayerId = expandedPlayerId == id ? nil : id
        }
    }
    
    private func countByPosition() -> [Position: Int] {
        Dictionary(grouping: players, by: \.position)
            .mapValues { $0.count }
    }
}

enum SortOption {
    case adp, rank, projected
}
```

### Player Row

```swift
// Features/DraftRoom/Views/PlayerRow.swift
struct PlayerRow: View {
    let player: Player
    let isExpanded: Bool
    let isMyTurn: Bool
    let onTap: () -> Void
    let onDraft: () -> Void
    
    @State private var isQueued = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Main row
            HStack(spacing: Spacing.sm) {
                // ADP
                Text(String(format: "%.1f", player.adp))
                    .font(.system(size: 14))
                    .foregroundColor(.td.textSecondary)
                    .frame(width: 50, alignment: .leading)
                
                // Player info
                VStack(alignment: .leading, spacing: 4) {
                    Text(player.name)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.td.textPrimary)
                    
                    HStack(spacing: 4) {
                        PositionBadge(position: player.position.rawValue)
                        Text("\(player.team) \(player.byeWeekFormatted)")
                            .font(.system(size: 12))
                            .foregroundColor(.td.textSecondary)
                    }
                }
                
                Spacer()
                
                // Queue button
                Button(action: toggleQueue) {
                    Image(systemName: isQueued ? "checkmark" : "plus")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(isQueued ? .td.stateSuccess : .td.textSecondary)
                        .frame(width: 32, height: 32)
                        .background(Color.td.bgTertiary)
                        .clipShape(Circle())
                }
                
                // Projected
                Text("\(Int(player.projectedPoints))")
                    .font(.system(size: 14))
                    .foregroundColor(.td.textPrimary)
                    .frame(width: 50)
                
                // Rank
                Text("\(player.rank)")
                    .font(.system(size: 14))
                    .foregroundColor(.td.textSecondary)
                    .frame(width: 50)
            }
            .frame(height: DraftLayout.playerRowHeight)
            .padding(.horizontal, DraftLayout.playerRowPaddingX)
            .background(Color.td.bgCard)
            .contentShape(Rectangle())
            .onTapGesture(perform: onTap)
            
            // Expanded card
            if isExpanded {
                PlayerExpandedCard(
                    player: player,
                    isMyTurn: isMyTurn,
                    onDraft: onDraft
                )
            }
        }
    }
    
    private func toggleQueue() {
        Haptics.queueAdd()
        isQueued.toggle()
        // Update queue service
    }
}
```

### Draft Footer

```swift
// Features/DraftRoom/Views/DraftFooter.swift
struct DraftFooter: View {
    @Binding var selectedTab: DraftTab
    
    var body: some View {
        HStack(spacing: 0) {
            ForEach(DraftTab.allCases, id: \.self) { tab in
                DraftFooterItem(
                    tab: tab,
                    isSelected: selectedTab == tab
                )
                .onTapGesture {
                    Haptics.tabSwitch()
                    selectedTab = tab
                }
            }
        }
        .frame(height: DraftLayout.footerHeight)
        .background(Color.td.bgPrimary)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color.td.borderDefault),
            alignment: .top
        )
    }
}

struct DraftFooterItem: View {
    let tab: DraftTab
    let isSelected: Bool
    
    var icon: String {
        switch tab {
        case .players: return "person.fill"
        case .queue: return "plus"
        case .rosters: return "list.bullet"
        case .board: return "square.grid.3x3.fill"
        case .info: return "info.circle.fill"
        }
    }
    
    var label: String {
        switch tab {
        case .players: return "Players"
        case .queue: return "Queue"
        case .rosters: return "Roster"
        case .board: return "Board"
        case .info: return "Info"
        }
    }
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: DraftLayout.footerIconSize))
            Text(label)
                .font(.system(size: 10))
        }
        .foregroundColor(isSelected ? .td.navbarSolid : .td.textMuted)
        .frame(maxWidth: .infinity)
    }
}
```

---

## §Exposure - Exposure Tab

### Exposure View

| Element | Value |
|---------|-------|
| Search bar | 44px height |
| Position filters | 4 buttons, ~32-36px height |
| Row height | ~56px |
| Column header | "EXP%" right aligned |

```swift
// Features/Exposure/Views/ExposureView.swift
struct ExposureView: View {
    @State private var searchText = ""
    @State private var selectedPosition: Position?
    @State private var exposureData: [PlayerExposure] = []
    
    var filteredData: [PlayerExposure] {
        var result = exposureData
        
        if !searchText.isEmpty {
            result = result.filter {
                $0.player.name.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        if let pos = selectedPosition {
            result = result.filter { $0.player.position == pos }
        }
        
        return result.sorted { $0.percentage > $1.percentage }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Search
            SearchBar(text: $searchText)
                .padding(.horizontal, Spacing.lg)
                .padding(.vertical, Spacing.sm)
            
            // Position filters
            HStack(spacing: Spacing.sm) {
                ForEach([Position.qb, .rb, .wr, .te], id: \.self) { pos in
                    ExposureFilterButton(
                        position: pos,
                        isSelected: selectedPosition == pos
                    ) {
                        selectedPosition = selectedPosition == pos ? nil : pos
                    }
                }
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.bottom, Spacing.sm)
            
            // Header
            HStack {
                Spacer()
                Text("EXP%")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.td.textMuted)
            }
            .padding(.horizontal, Spacing.lg)
            .padding(.vertical, Spacing.sm)
            
            // List
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(filteredData) { exposure in
                        ExposureRow(exposure: exposure)
                        Divider().background(Color.td.borderDefault)
                    }
                }
            }
        }
        .background(Color.td.bgPrimary)
    }
}

struct ExposureRow: View {
    let exposure: PlayerExposure
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(exposure.player.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.td.textPrimary)
                
                HStack(spacing: 4) {
                    PositionBadge(position: exposure.player.position.rawValue, size: .small)
                    Text(exposure.player.team)
                        .font(.system(size: 12))
                        .foregroundColor(.td.textSecondary)
                }
            }
            
            Spacer()
            
            Text("\(Int(exposure.percentage))%")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.td.textPrimary)
        }
        .padding(.horizontal, Spacing.lg)
        .frame(height: 56)
    }
}

struct PlayerExposure: Identifiable {
    let id: String
    let player: Player
    let percentage: Double
    let teamCount: Int
}
```

---

## §Profile - Profile Tab

### Profile View

| Element | Description |
|---------|-------------|
| Avatar box | Customizable player card preview |
| Balance | Large text + Deposit button |
| Menu items | List of settings options |

```swift
// Features/Profile/Views/ProfileView.swift
struct ProfileView: View {
    @State private var user: User?
    @State private var showSettings = false
    @State private var showDeposit = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.xl) {
                // Avatar box
                AvatarBox()
                    .padding(.horizontal, Spacing.lg)
                
                // Balance + Deposit
                BalanceCard(
                    balance: user?.balanceFormatted ?? "$0.00",
                    onDeposit: { showDeposit = true }
                )
                .padding(.horizontal, Spacing.lg)
                
                // Menu items
                VStack(spacing: 0) {
                    ProfileMenuItem(icon: "creditcard", title: "Payment Methods")
                    ProfileMenuItem(icon: "list.number", title: "Rankings")
                    ProfileMenuItem(icon: "paintbrush", title: "Customization")
                    ProfileMenuItem(icon: "slider.horizontal.3", title: "Autodraft Limits")
                    ProfileMenuItem(icon: "person", title: "Profile") {
                        showSettings = true
                    }
                    ProfileMenuItem(icon: "clock", title: "Deposit History")
                }
            }
            .padding(.vertical, Spacing.lg)
        }
        .background(Color.td.bgPrimary)
        .sheet(isPresented: $showSettings) {
            SettingsSheet()
        }
        .sheet(isPresented: $showDeposit) {
            DepositSheet()
        }
    }
}

struct ProfileMenuItem: View {
    let icon: String
    let title: String
    var action: (() -> Void)? = nil
    
    var body: some View {
        Button(action: { action?() }) {
            HStack(spacing: Spacing.md) {
                Image(systemName: icon)
                    .frame(width: 24)
                    .foregroundColor(.td.textSecondary)
                
                Text(title)
                    .font(.td.body)
                    .foregroundColor(.td.textPrimary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.td.textMuted)
            }
            .padding(.horizontal, Spacing.lg)
            .frame(height: TouchTarget.comfort)
        }
    }
}
```

---

## Acceptance Criteria

For each screen:

1. [ ] Layout matches web screenshots exactly
2. [ ] All spacing uses design system tokens
3. [ ] Colors match design system
4. [ ] Touch targets meet 44px minimum
5. [ ] Loading states show skeletons
6. [ ] Error states show ErrorView
7. [ ] Haptic feedback on all interactive elements
8. [ ] Safe areas handled correctly
