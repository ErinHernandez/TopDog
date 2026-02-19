/// TopDog Studio — WebSocket Manager
///
/// Manages the WebSocket connection between the iOS viewer app and the
/// companion service. Handles:
///   - Connection lifecycle with auto-reconnect
///   - Message parsing and routing
///   - Heartbeat (ping/pong)
///   - Code injection message handling
///
/// Uses URLSessionWebSocketTask for native WebSocket support (iOS 13+).

import Foundation
import Combine

/// Connection state for the WebSocket
enum ConnectionState: String, Equatable {
    case disconnected
    case connecting
    case connected
}

/// Build status for the current component
enum BuildStatus: Equatable {
    case idle
    case building(componentId: String)
    case success(componentId: String, duration: TimeInterval)
    case error(componentId: String, message: String)
}

/// A message received from the companion service
struct CompanionMessage: Decodable {
    let type: String
    let componentId: String?
    let languageId: String?
    let code: String?
    let props: [String: AnyCodable]?
    let message: String?
    let duration: Double?
    let errors: [BuildErrorInfo]?
}

/// Build error detail
struct BuildErrorInfo: Decodable {
    let file: String
    let line: Int
    let column: Int
    let message: String
    let severity: String
}

/// Type-erased Codable wrapper for JSON values
struct AnyCodable: Decodable {
    let value: Any

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let string = try? container.decode(String.self) {
            value = string
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else {
            value = ""
        }
    }
}

/// Manages the WebSocket connection to the TopDog companion service
@MainActor
final class WebSocketManager: ObservableObject {
    static let shared = WebSocketManager()

    // MARK: - Published State

    @Published var connectionState: ConnectionState = .disconnected
    @Published var buildStatus: BuildStatus = .idle
    @Published var currentCode: String?
    @Published var currentComponentId: String?
    @Published var currentProps: [String: Any] = [:]

    // MARK: - Configuration

    /// WebSocket URL — defaults to localhost; override via launch argument or env var
    private let wsURL: URL

    /// Reconnect delay in seconds (exponential backoff)
    private var reconnectDelay: TimeInterval = 1.0
    private let maxReconnectDelay: TimeInterval = 30.0

    /// Heartbeat interval in seconds
    private let heartbeatInterval: TimeInterval = 5.0

    // MARK: - Private State

    private var urlSession: URLSession?
    private var webSocketTask: URLSessionWebSocketTask?
    private var heartbeatTimer: Timer?
    private var reconnectTimer: Timer?
    private var isManuallyDisconnected = false

    // MARK: - Initialization

    init(url: URL? = nil) {
        // Check for environment variable or launch argument override
        let host = ProcessInfo.processInfo.environment["TOPDOG_COMPANION_HOST"] ?? "localhost"
        let port = ProcessInfo.processInfo.environment["TOPDOG_COMPANION_PORT"] ?? "9828"
        self.wsURL = url ?? URL(string: "ws://\(host):\(port)")!
    }

    // MARK: - Connection Lifecycle

    /// Establish WebSocket connection to the companion service
    func connect() {
        guard connectionState == .disconnected else { return }
        isManuallyDisconnected = false

        connectionState = .connecting
        let session = URLSession(configuration: .default)
        urlSession = session

        let task = session.webSocketTask(with: wsURL)
        webSocketTask = task
        task.resume()

        connectionState = .connected
        reconnectDelay = 1.0 // reset backoff on successful connect

        startHeartbeat()
        receiveMessage()

        // Announce ourselves to the companion
        send(["type": "register", "platform": "ios", "appVersion": "1.0.0"])
    }

    /// Gracefully disconnect
    func disconnect() {
        isManuallyDisconnected = true
        tearDown()
    }

    /// Clean up all resources
    private func tearDown() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
        reconnectTimer?.invalidate()
        reconnectTimer = nil

        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        urlSession?.invalidateAndCancel()
        urlSession = nil

        connectionState = .disconnected
    }

    /// Schedule auto-reconnect with exponential backoff
    private func scheduleReconnect() {
        guard !isManuallyDisconnected else { return }

        reconnectTimer = Timer.scheduledTimer(withTimeInterval: reconnectDelay, repeats: false) { [weak self] _ in
            Task { @MainActor in
                self?.connect()
            }
        }

        // Exponential backoff with cap
        reconnectDelay = min(reconnectDelay * 2, maxReconnectDelay)
    }

    // MARK: - Heartbeat

    private func startHeartbeat() {
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: heartbeatInterval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.send(["type": "ping"])
            }
        }
    }

    // MARK: - Message Handling

    /// Listen for incoming WebSocket messages
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            Task { @MainActor in
                switch result {
                case .success(let message):
                    switch message {
                    case .string(let text):
                        self?.handleTextMessage(text)
                    case .data(let data):
                        if let text = String(data: data, encoding: .utf8) {
                            self?.handleTextMessage(text)
                        }
                    @unknown default:
                        break
                    }
                    // Continue listening
                    self?.receiveMessage()

                case .failure(let error):
                    print("[TopDogViewer] WebSocket error: \(error.localizedDescription)")
                    self?.tearDown()
                    self?.scheduleReconnect()
                }
            }
        }
    }

    /// Parse and route an incoming JSON message
    private func handleTextMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }

        do {
            let message = try JSONDecoder().decode(CompanionMessage.self, from: data)
            routeMessage(message)
        } catch {
            print("[TopDogViewer] Failed to decode message: \(error)")
        }
    }

    /// Route a decoded message to the appropriate handler
    private func routeMessage(_ message: CompanionMessage) {
        switch message.type {
        case "pong":
            // Heartbeat acknowledged — no action needed
            break

        case "inject-code":
            guard let componentId = message.componentId,
                  let code = message.code else { return }

            currentComponentId = componentId
            currentCode = code
            if let props = message.props {
                currentProps = props.mapValues { $0.value }
            }
            buildStatus = .building(componentId: componentId)

        case "hot-reload":
            guard let componentId = message.componentId,
                  let code = message.code else { return }

            currentCode = code
            buildStatus = .building(componentId: componentId)

        case "set-props":
            if let props = message.props {
                currentProps = props.mapValues { $0.value }
            }

        case "build-complete":
            if let componentId = message.componentId,
               let duration = message.duration {
                buildStatus = .success(componentId: componentId, duration: duration)
            }

        case "build-error":
            if let componentId = message.componentId,
               let errors = message.errors,
               let firstError = errors.first {
                buildStatus = .error(componentId: componentId, message: firstError.message)
            }

        default:
            print("[TopDogViewer] Unhandled message type: \(message.type)")
        }
    }

    // MARK: - Sending Messages

    /// Send a JSON message to the companion service
    func send(_ payload: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let text = String(data: data, encoding: .utf8) else { return }

        webSocketTask?.send(.string(text)) { error in
            if let error = error {
                print("[TopDogViewer] Send error: \(error.localizedDescription)")
            }
        }
    }

    /// Notify companion that a component has finished rendering
    func sendRenderComplete(componentId: String, success: Bool) {
        send([
            "type": "render-complete",
            "componentId": componentId,
            "success": success,
        ])
    }
}
