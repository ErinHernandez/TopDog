# Dynamic Island Alert System - iOS Integration

## Overview

This directory contains the iOS native implementation for Dynamic Island alerts. Alerts are temporary notifications that appear briefly in Dynamic Island, distinct from the persistent Live Activity timer.

## Files

- `Managers/DraftAlertManager.swift` - Manages alert lifecycle
- `Widgets/DraftAlertWidget.swift` - Widget views for each alert type

## Setup

### 1. Add Widget Extension Target

If not already created:

1. In Xcode, go to File > New > Target
2. Select "Widget Extension"
3. Name it "TopDogWidgets" (or use existing)
4. Set deployment target to iOS 16.1+

### 2. Enable Live Activities

1. Select your widget extension target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Live Activities"

### 3. Add Files to Project

1. Copy `DraftAlertManager.swift` to your main app target
2. Copy `DraftAlertWidget.swift` to your Widget Extension target
3. Ensure both files are added to the appropriate targets

### 4. Configure Info.plist

Add to your widget extension's `Info.plist`:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
<key>NSSupportsLiveActivitiesFrequentUpdates</key>
<true/>
```

### 5. Add WebView Message Handler

In your WebView configuration (likely `WebViewController.swift` or similar):

```swift
// ADD to your WKWebView configuration
let contentController = WKUserContentController()
contentController.add(self, name: "draftAlert")

// ADD this protocol conformance and method
extension WebViewController: WKScriptMessageHandler {
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "draftAlert",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String,
              action == "showAlert",
              let alertData = body["alert"] as? [String: Any] else {
            return
        }
        
        // Parse alert data
        guard let typeString = alertData["type"] as? String,
              let type = DraftAlertManager.AlertType(rawValue: typeString),
              let message = alertData["message"] as? String,
              let roomId = alertData["roomId"] as? String,
              let timestamp = alertData["timestamp"] as? TimeInterval else {
            return
        }
        
        // Show the alert
        Task { @MainActor in
            let data = DraftAlertManager.AlertData(
                type: type,
                message: message,
                roomId: roomId,
                timestamp: timestamp
            )
            try? await DraftAlertManager.shared.showAlert(data)
        }
    }
}
```

## Usage

Alerts are automatically triggered from the web app via the `draftAlert` message handler. No manual Swift code is needed - the web app handles all alert triggering logic.

## Alert Types

1. **Room Filled** - Green icon, person.3.fill
2. **Draft Starting** - Blue icon, play.circle.fill
3. **Two Picks Away** - Orange icon, 2.circle.fill
4. **On The Clock** - Red icon, clock.fill
5. **10 Seconds Remaining** - Red icon, timer

## Testing

Test on a physical iPhone 14 Pro or later running iOS 16.1+:
1. Build and run the app
2. Join a draft room
3. Trigger each alert condition
4. Verify alerts appear in Dynamic Island
5. Verify alerts auto-dismiss after 5 seconds
