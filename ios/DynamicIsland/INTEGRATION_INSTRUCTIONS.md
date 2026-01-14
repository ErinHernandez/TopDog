# iOS WebView Integration - Complete Instructions

## Option 1: Use the Complete WebViewController (Recommended)

If you don't have an existing WebView controller, use the provided `WebViewController.swift`:

1. **Add to Xcode:**
   - Drag `WebViewController.swift` into your main app target
   - Ensure it's added to the correct target (not Widget Extension)

2. **Import Required Files:**
   - Ensure `DraftAlertManager.swift` is in the same target
   - The controller will automatically use it

3. **Use in Your App:**
   ```swift
   import UIKit
   
   class AppDelegate: UIResponder, UIApplicationDelegate {
       var window: UIWindow?
       
       func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
           let window = UIWindow(frame: UIScreen.main.bounds)
           let webViewController = WebViewController()
           // Set your app URL
           webViewController.url = URL(string: "https://your-app-url.com")
           window.rootViewController = webViewController
           window.makeKeyAndVisible()
           self.window = window
           return true
       }
   }
   ```

4. **Build and Test:**
   - Build the app
   - Run on iPhone 14 Pro+ (iOS 16.1+)
   - Test alert functionality

---

## Option 2: Integrate into Existing WebView Controller

If you already have a WebView controller, follow these steps:

### Step 1: Add Message Handler Registration

Find where you configure your `WKWebView` (usually in `viewDidLoad()`):

```swift
// Find this code (or similar):
let configuration = WKWebViewConfiguration()
let contentController = WKUserContentController()

// ADD THIS LINE:
contentController.add(self, name: "draftAlert")

configuration.userContentController = contentController
webView = WKWebView(frame: view.bounds, configuration: configuration)
```

### Step 2: Add Protocol Conformance

Add `WKScriptMessageHandler` to your view controller:

```swift
// Change this:
class YourViewController: UIViewController {

// To this:
class YourViewController: UIViewController, WKScriptMessageHandler {
```

### Step 3: Add Message Handler Method

Add this extension to your view controller file:

```swift
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
```

### Step 4: Clean Up on Deinit

Add cleanup in your `deinit` method:

```swift
deinit {
    // Remove message handler to prevent retain cycles
    webView?.configuration.userContentController.removeScriptMessageHandler(forName: "draftAlert")
}
```

---

## Verification Checklist

After integration, verify:

- [ ] `DraftAlertManager.swift` is in main app target
- [ ] `DraftAlertWidget.swift` is in Widget Extension target
- [ ] Live Activities capability enabled in Widget Extension
- [ ] Message handler registered: `contentController.add(self, name: "draftAlert")`
- [ ] ViewController conforms to `WKScriptMessageHandler`
- [ ] Message handler method implemented
- [ ] Cleanup in `deinit` method

---

## Testing

1. **Build the app** on iPhone 14 Pro+ (iOS 16.1+)
2. **Open a draft room** in the web app
3. **Trigger alerts** by:
   - Filling the room
   - Starting the draft
   - Getting 2 picks away
   - Going on the clock
   - Timer hitting 10 seconds
4. **Verify** alerts appear in Dynamic Island
5. **Check console** for `[DraftAlerts]` log messages

---

## Troubleshooting

### Alerts Not Appearing

1. **Check console logs:**
   - Look for `[DraftAlerts]` messages
   - Verify message format is correct

2. **Verify Live Activities:**
   - Widget Extension has Live Activities capability
   - Info.plist has `NSSupportsLiveActivities = true`

3. **Check device:**
   - iPhone 14 Pro or later
   - iOS 16.1 or later
   - Live Activities enabled in Settings

### Message Handler Not Called

1. **Verify registration:**
   - `contentController.add(self, name: "draftAlert")` is called
   - Called before WebView loads content

2. **Check protocol conformance:**
   - ViewController conforms to `WKScriptMessageHandler`
   - Method signature matches exactly

3. **Test message sending:**
   - Add console log in handler
   - Verify web app is sending messages

---

## Complete Code Reference

See `INTEGRATION_COMPLETE.swift` for complete copy-paste ready code with all steps.
