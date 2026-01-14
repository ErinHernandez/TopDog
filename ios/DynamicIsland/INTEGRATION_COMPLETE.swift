/**
 * COMPLETE iOS Integration Code for Dynamic Island Alerts
 * 
 * Copy and paste this code into your iOS app's WebView controller.
 * This file contains everything needed for the integration.
 * 
 * INSTRUCTIONS:
 * 1. Find your WebView controller (e.g., ViewController.swift, WebViewController.swift)
 * 2. Add the code from "STEP 1" to your WKWebView configuration
 * 3. Add the code from "STEP 2" as an extension to your view controller
 * 4. Ensure DraftAlertManager.swift is in your main app target
 * 5. Build and test
 */

import WebKit
import Foundation

// ============================================================================
// STEP 1: Add to your WKWebView configuration
// ============================================================================
/*
 
 // In your viewDidLoad() or wherever you configure WKWebView:
 
 let configuration = WKWebViewConfiguration()
 let contentController = WKUserContentController()
 
 // ADD THIS LINE - Register the message handler
 contentController.add(self, name: "draftAlert")
 
 configuration.userContentController = contentController
 webView = WKWebView(frame: view.bounds, configuration: configuration)
 
 */

// ============================================================================
// STEP 2: Add this extension to your ViewController
// ============================================================================
/*
 
 extension YourViewController: WKScriptMessageHandler {
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
             print("[DraftAlerts] Invalid message format")
             return
         }
         
         // Parse alert data
         guard let typeString = alertData["type"] as? String,
               let type = DraftAlertManager.AlertType(rawValue: typeString),
               let messageText = alertData["message"] as? String,
               let roomId = alertData["roomId"] as? String,
               let timestamp = alertData["timestamp"] as? TimeInterval else {
             print("[DraftAlerts] Missing required alert data")
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
                 print("[DraftAlerts] ✅ Alert shown: \(type.rawValue)")
             } catch {
                 print("[DraftAlerts] ❌ Failed to show alert: \(error)")
             }
         }
     }
 }
 
 */

// ============================================================================
// STEP 3: Ensure your ViewController conforms to WKScriptMessageHandler
// ============================================================================
/*
 
 // Add this to your ViewController class declaration:
 class YourViewController: UIViewController, WKScriptMessageHandler {
     // ... your existing code ...
 }
 
 */

// ============================================================================
// STEP 4: Clean up message handler on deinit
// ============================================================================
/*
 
 deinit {
     // Remove message handler to prevent retain cycles
     webView?.configuration.userContentController.removeScriptMessageHandler(forName: "draftAlert")
 }
 
 */
