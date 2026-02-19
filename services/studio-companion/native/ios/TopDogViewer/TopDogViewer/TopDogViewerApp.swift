/// TopDog Studio — iOS Companion Viewer App
///
/// Minimal SwiftUI app that connects to the TopDog Studio companion service
/// via WebSocket and renders dynamically injected UI components.
///
/// Architecture:
///   TopDogViewerApp → WebSocketManager → PreviewContainer → ComponentRenderer
///
/// The app establishes a WebSocket connection to the companion service running
/// on the host machine (ws://HOST:9828). When the Studio sends an `inject-code`
/// message, the app compiles and renders the SwiftUI component dynamically.

import SwiftUI

@main
struct TopDogViewerApp: App {
    @StateObject private var wsManager = WebSocketManager.shared

    var body: some Scene {
        WindowGroup {
            PreviewContainer()
                .environmentObject(wsManager)
                .onAppear {
                    wsManager.connect()
                }
        }
    }
}
