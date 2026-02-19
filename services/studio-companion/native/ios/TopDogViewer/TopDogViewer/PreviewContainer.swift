/// TopDog Studio — Preview Container
///
/// The main view that displays dynamically injected SwiftUI components.
/// Shows a loading state while waiting for code injection, an error state
/// for build failures, and the rendered component on success.
///
/// This view observes the WebSocketManager for code changes and
/// delegates rendering to ComponentRenderer.

import SwiftUI

/// Main container view for rendering injected components
struct PreviewContainer: View {
    @EnvironmentObject var wsManager: WebSocketManager

    var body: some View {
        ZStack {
            // Background
            Color(uiColor: .systemGroupedBackground)
                .ignoresSafeArea()

            switch wsManager.connectionState {
            case .disconnected:
                DisconnectedView()

            case .connecting:
                ConnectingView()

            case .connected:
                if let code = wsManager.currentCode,
                   let componentId = wsManager.currentComponentId {
                    ComponentRendererView(
                        componentId: componentId,
                        code: code,
                        buildStatus: wsManager.buildStatus
                    )
                } else {
                    WaitingForCodeView()
                }
            }
        }
    }
}

// MARK: - State Views

/// Shown when disconnected from companion service
struct DisconnectedView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text("Disconnected")
                .font(.title2.bold())

            Text("Waiting for connection to\nTopDog Studio companion service...")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

/// Shown while connecting
struct ConnectingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)

            Text("Connecting...")
                .font(.title3)
                .foregroundColor(.secondary)
        }
    }
}

/// Shown when connected but no code has been injected yet
struct WaitingForCodeView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.badge.arrow.up")
                .font(.system(size: 48))
                .foregroundColor(.accentColor)

            Text("Ready")
                .font(.title2.bold())

            Text("Connected to TopDog Studio.\nDesign a component in the Studio\nto see it rendered here.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

/// Renders the injected component or shows build status
struct ComponentRendererView: View {
    let componentId: String
    let code: String
    let buildStatus: BuildStatus

    var body: some View {
        VStack(spacing: 0) {
            // Status bar
            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 8, height: 8)

                Text(statusText)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Text(componentId)
                    .font(.caption.monospaced())
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color(uiColor: .secondarySystemGroupedBackground))

            // Component render area
            GeometryReader { geometry in
                ScrollView {
                    VStack {
                        // Placeholder: In Phase 5D, this will use dlopen to load
                        // the dynamically compiled component
                        ComponentPlaceholder(code: code, size: geometry.size)
                    }
                    .frame(minWidth: geometry.size.width, minHeight: geometry.size.height)
                }
            }
        }
    }

    private var statusColor: Color {
        switch buildStatus {
        case .idle: return .gray
        case .building: return .orange
        case .success: return .green
        case .error: return .red
        }
    }

    private var statusText: String {
        switch buildStatus {
        case .idle: return "Idle"
        case .building: return "Building..."
        case .success(_, let duration): return String(format: "Built in %.1fs", duration)
        case .error(_, let message): return "Error: \(message)"
        }
    }
}

/// Placeholder for dynamically rendered component
/// In Phase 5D, this will be replaced with actual dynamic rendering
struct ComponentPlaceholder: View {
    let code: String
    let size: CGSize

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "swift")
                .font(.system(size: 32))
                .foregroundColor(.orange)

            Text("Component Preview")
                .font(.headline)

            Text("Code received (\(code.count) characters)")
                .font(.caption)
                .foregroundColor(.secondary)

            // Show first few lines of code as preview
            Text(String(code.prefix(200)))
                .font(.system(.caption, design: .monospaced))
                .lineLimit(8)
                .padding(8)
                .background(Color(uiColor: .tertiarySystemGroupedBackground))
                .cornerRadius(8)
        }
        .padding()
    }
}

#Preview {
    PreviewContainer()
        .environmentObject(WebSocketManager.shared)
}
