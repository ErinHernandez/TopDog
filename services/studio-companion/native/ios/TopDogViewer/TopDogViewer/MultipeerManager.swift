/**
 * TopDog Studio — MultipeerConnectivity Manager
 *
 * Wraps Apple's MultipeerConnectivity framework for local peer-to-peer
 * collaboration over Bluetooth, WiFi Direct, and peer-to-peer WiFi.
 *
 * Architecture:
 *  - Advertises as "topdog-studio" service type
 *  - Discovers nearby peers and auto-connects
 *  - Bridges Yjs binary updates between connected peers
 *  - Relays updates to/from the companion WebSocket for web↔native sync
 *
 * Data flow: Web App → WebSocket → CompanionServer → MultipeerManager → Nearby iOS/Mac
 */

import Foundation
import MultipeerConnectivity
import Combine

// MARK: - MultipeerManager

@MainActor
class MultipeerManager: NSObject, ObservableObject {

    // MARK: Configuration

    static let serviceType = "topdog-studio"

    // MARK: Published State

    @Published var connectedPeers: [MCPeerID] = []
    @Published var isAdvertising: Bool = false
    @Published var isBrowsing: Bool = false

    // MARK: Private Properties

    private let myPeerId: MCPeerID
    private let session: MCSession
    private let advertiser: MCNearbyServiceAdvertiser
    private let browser: MCNearbyServiceBrowser

    /// Callback for received Yjs updates
    var onYjsUpdate: ((Data) -> Void)?

    /// Callback for peer connection state changes
    var onPeerStateChanged: ((MCPeerID, MCSessionState) -> Void)?

    // MARK: Initialization

    override init() {
        let deviceName = ProcessInfo.processInfo.hostName
        self.myPeerId = MCPeerID(displayName: deviceName)
        self.session = MCSession(
            peer: myPeerId,
            securityIdentity: nil,
            encryptionPreference: .required
        )
        self.advertiser = MCNearbyServiceAdvertiser(
            peer: myPeerId,
            discoveryInfo: ["app": "topdog-studio", "version": "1"],
            serviceType: MultipeerManager.serviceType
        )
        self.browser = MCNearbyServiceBrowser(
            peer: myPeerId,
            serviceType: MultipeerManager.serviceType
        )

        super.init()

        session.delegate = self
        advertiser.delegate = self
        browser.delegate = self
    }

    // MARK: - Public Methods

    /// Start advertising and browsing for peers
    func start() {
        guard !isAdvertising else { return }

        advertiser.startAdvertisingPeer()
        browser.startBrowsingForPeers()
        isAdvertising = true
        isBrowsing = true

        NSLog("[MultipeerManager] Started advertising and browsing")
    }

    /// Stop advertising and browsing
    func stop() {
        advertiser.stopAdvertisingPeer()
        browser.stopBrowsingForPeers()
        session.disconnect()
        isAdvertising = false
        isBrowsing = false
        connectedPeers = []

        NSLog("[MultipeerManager] Stopped")
    }

    /// Send a Yjs update to all connected peers
    func sendYjsUpdate(_ data: Data) {
        guard !connectedPeers.isEmpty else { return }

        // Prefix with message type byte (0x01 = Yjs update)
        var message = Data([0x01])
        message.append(data)

        do {
            try session.send(message, toPeers: session.connectedPeers, with: .reliable)
        } catch {
            NSLog("[MultipeerManager] Failed to send Yjs update: \(error)")
        }
    }

    /// Send an awareness update to all connected peers
    func sendAwarenessUpdate(_ data: Data) {
        guard !connectedPeers.isEmpty else { return }

        // Prefix with message type byte (0x02 = awareness update)
        var message = Data([0x02])
        message.append(data)

        do {
            try session.send(message, toPeers: session.connectedPeers, with: .reliable)
        } catch {
            NSLog("[MultipeerManager] Failed to send awareness update: \(error)")
        }
    }

    /// Send raw data to a specific peer
    func sendToPeer(_ data: Data, peer: MCPeerID) {
        do {
            try session.send(data, toPeers: [peer], with: .reliable)
        } catch {
            NSLog("[MultipeerManager] Failed to send to peer \(peer.displayName): \(error)")
        }
    }
}

// MARK: - MCSessionDelegate

extension MultipeerManager: MCSessionDelegate {

    nonisolated func session(
        _ session: MCSession,
        peer peerID: MCPeerID,
        didChange state: MCSessionState
    ) {
        let stateStr: String
        switch state {
        case .notConnected: stateStr = "disconnected"
        case .connecting: stateStr = "connecting"
        case .connected: stateStr = "connected"
        @unknown default: stateStr = "unknown"
        }

        NSLog("[MultipeerManager] Peer \(peerID.displayName) -> \(stateStr)")

        Task { @MainActor in
            self.connectedPeers = session.connectedPeers
            self.onPeerStateChanged?(peerID, state)
        }
    }

    nonisolated func session(
        _ session: MCSession,
        didReceive data: Data,
        fromPeer peerID: MCPeerID
    ) {
        guard data.count > 1 else { return }

        let messageType = data[0]
        let payload = data.subdata(in: 1..<data.count)

        switch messageType {
        case 0x01: // Yjs update
            Task { @MainActor in
                self.onYjsUpdate?(payload)
            }
        case 0x02: // Awareness update
            // Forward to the awareness handler (same as Yjs update for now)
            Task { @MainActor in
                self.onYjsUpdate?(payload)
            }
        default:
            NSLog("[MultipeerManager] Unknown message type: \(messageType)")
        }
    }

    nonisolated func session(
        _ session: MCSession,
        didReceive stream: InputStream,
        withName streamName: String,
        fromPeer peerID: MCPeerID
    ) {
        // Not used for Yjs sync
    }

    nonisolated func session(
        _ session: MCSession,
        didStartReceivingResourceWithName resourceName: String,
        fromPeer peerID: MCPeerID,
        with progress: Progress
    ) {
        // Not used for Yjs sync
    }

    nonisolated func session(
        _ session: MCSession,
        didFinishReceivingResourceWithName resourceName: String,
        fromPeer peerID: MCPeerID,
        at localURL: URL?,
        withError error: Error?
    ) {
        // Not used for Yjs sync
    }
}

// MARK: - MCNearbyServiceAdvertiserDelegate

extension MultipeerManager: MCNearbyServiceAdvertiserDelegate {

    nonisolated func advertiser(
        _ advertiser: MCNearbyServiceAdvertiser,
        didReceiveInvitationFromPeer peerID: MCPeerID,
        withContext context: Data?,
        invitationHandler: @escaping (Bool, MCSession?) -> Void
    ) {
        NSLog("[MultipeerManager] Received invitation from \(peerID.displayName)")
        // Auto-accept invitations from TopDog peers
        Task { @MainActor in
            invitationHandler(true, self.session)
        }
    }

    nonisolated func advertiser(
        _ advertiser: MCNearbyServiceAdvertiser,
        didNotStartAdvertisingPeer error: Error
    ) {
        NSLog("[MultipeerManager] Failed to advertise: \(error)")
    }
}

// MARK: - MCNearbyServiceBrowserDelegate

extension MultipeerManager: MCNearbyServiceBrowserDelegate {

    nonisolated func browser(
        _ browser: MCNearbyServiceBrowser,
        foundPeer peerID: MCPeerID,
        withDiscoveryInfo info: [String: String]?
    ) {
        // Verify it's a TopDog Studio peer
        guard info?["app"] == "topdog-studio" else { return }

        NSLog("[MultipeerManager] Found peer: \(peerID.displayName)")

        // Auto-invite (use deterministic ordering to avoid duplicate connections)
        Task { @MainActor in
            if self.myPeerId.displayName < peerID.displayName {
                browser.invitePeer(peerID, to: self.session, withContext: nil, timeout: 30)
            }
        }
    }

    nonisolated func browser(
        _ browser: MCNearbyServiceBrowser,
        lostPeer peerID: MCPeerID
    ) {
        NSLog("[MultipeerManager] Lost peer: \(peerID.displayName)")
    }

    nonisolated func browser(
        _ browser: MCNearbyServiceBrowser,
        didNotStartBrowsingForPeers error: Error
    ) {
        NSLog("[MultipeerManager] Failed to browse: \(error)")
    }
}
