/**
 * WebViewController with Dynamic Island Alert Support
 * 
 * Complete WebView controller with draft alert message handler integration.
 * 
 * USAGE:
 * 1. Add this file to your iOS app's main target
 * 2. Import DraftAlertManager (ensure it's in the same target)
 * 3. Use this controller or copy the integration code to your existing controller
 */

import UIKit
import WebKit
import Foundation

/// Complete WebView controller with Dynamic Island alert support
/// 
/// This controller handles all WebView functionality and integrates
/// the draft alert message handler for Dynamic Island notifications.
@available(iOS 16.1, *)
class WebViewController: UIViewController, WKScriptMessageHandler {
    
    // MARK: - Properties
    
    var webView: WKWebView!
    private var url: URL?
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadInitialURL()
    }
    
    deinit {
        // Remove message handler to prevent retain cycles
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "draftAlert")
    }
    
    // MARK: - Setup
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        let contentController = WKUserContentController()
        
        // Register draft alert message handler
        contentController.add(self, name: "draftAlert")
        
        configuration.userContentController = contentController
        
        // Additional WebView configuration
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        
        view.addSubview(webView)
    }
    
    private func loadInitialURL() {
        // Load your app's URL
        // Example: url = URL(string: "https://your-app-url.com")
        if let url = url {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
    
    // MARK: - WKScriptMessageHandler
    
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        // Handle draft alert messages
        guard message.name == "draftAlert" else {
            return
        }
        
        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String,
              action == "showAlert",
              let alertData = body["alert"] as? [String: Any] else {
            print("[DraftAlerts] Invalid message format: \(message.body)")
            return
        }
        
        // Parse alert data
        guard let typeString = alertData["type"] as? String,
              let type = DraftAlertManager.AlertType(rawValue: typeString),
              let messageText = alertData["message"] as? String,
              let roomId = alertData["roomId"] as? String,
              let timestamp = alertData["timestamp"] as? TimeInterval else {
            print("[DraftAlerts] Missing required alert data: \(alertData)")
            return
        }
        
        // Show the alert in Dynamic Island
        Task { @MainActor in
            let data = DraftAlertManager.AlertData(
                type: type,
                message: messageText,
                roomId: roomId,
                timestamp: timestamp
            )
            
            do {
                try await DraftAlertManager.shared.showAlert(data)
                print("[DraftAlerts] ✅ Alert shown: \(type.rawValue) - \(messageText)")
            } catch {
                print("[DraftAlerts] ❌ Failed to show alert: \(error)")
            }
        }
    }
}

// MARK: - WKNavigationDelegate

@available(iOS 16.1, *)
extension WebViewController: WKNavigationDelegate {
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("[WebView] Page loaded successfully")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[WebView] Navigation failed: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("[WebView] Provisional navigation failed: \(error.localizedDescription)")
    }
}
