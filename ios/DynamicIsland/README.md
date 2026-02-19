# Dynamic Island Implementation for Draft Timer

This directory contains the iOS implementation for Dynamic Island and Live Activities support for the TopDog draft timer.

## Overview

The Dynamic Island implementation provides three distinct states:

1. **In-Draft State**: When the user is actively in the draft room (app in foreground)
2. **Out-of-Draft State**: When the user is in the app but not in an active draft
3. **Out-of-App-During-Live-Draft State**: When the user leaves the app but a draft is still live (uses Live Activities)

## Requirements

- iOS 16.1+ (for Live Activities)
- iPhone 14 Pro+ (for Dynamic Island - earlier devices show Live Activities in status bar)
- Xcode 14.1+
- Widget Extension target
- ActivityKit framework

## File Structure

```
ios/DynamicIsland/
├── README.md
├── Widgets/
│   └── DraftTimerActivityWidget.swift      # Live Activity widget definition
└── Managers/
    └── DraftTimerActivityManager.swift     # Activity management logic
```

## Setup Instructions

### 1. Add Widget Extension

1. In Xcode, go to File > New > Target
2. Select "Widget Extension"
3. Name it "TopDogWidgets" (or similar)
4. Set deployment target to iOS 16.1+

### 2. Enable Live Activities

1. Select your widget extension target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Live Activities"

### 5. Add Files to Project

1. Copy `DraftTimerActivityWidget.swift` to your Widget Extension target
2. Copy `DraftTimerActivityManager.swift` to your main app target
3. Ensure both files are added to the appropriate targets

### 4. Configure Info.plist

Add to your widget extension's `Info.plist`:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
<key>NSSupportsLiveActivitiesFrequentUpdates</key>
<true/>
```

## Usage

### Starting a Live Activity

```swift
import ActivityKit

let manager = DraftTimerActivityManager.shared

try manager.startActivity(
    roomId: "room-123",
    roomName: "My Draft Room",
    secondsRemaining: 30,
    totalSeconds: 30,
    isMyTurn: true,
    currentPickNumber: 1,
    totalPicks: 216,
    currentDrafter: "You",
    status: .active
)
```

### Updating a Live Activity

```swift
try await manager.updateActivity(
    secondsRemaining: 25,
    isMyTurn: true,
    currentPickNumber: 1,
    status: .active
)
```

### Ending a Live Activity

```swift
await manager.endActivity(reason: .immediate)
```

## Integration with React Native / Web

If you're using React Native or a web wrapper:

### 1. Native Bridge (iOS)

Create a bridge module to communicate between React Native and Swift:

```swift
@objc(DynamicIslandManager)
class DynamicIslandManager: NSObject {
    @objc static func requiresMainQueueSetup() -> Bool { return true }
    
    @objc func startActivity(
        roomId: String,
        roomName: String,
        secondsRemaining: Int,
        totalSeconds: Int,
        isMyTurn: Bool,
        currentPickNumber: Int,
        totalPicks: Int,
        currentDrafter: String,
        status: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Convert status string to enum
        let draftStatus = DraftStatus(rawValue: status) ?? .active
        
        Task { @MainActor in
            do {
                try DraftTimerActivityManager.shared.startActivity(
                    roomId: roomId,
                    roomName: roomName,
                    secondsRemaining: secondsRemaining,
                    totalSeconds: totalSeconds,
                    isMyTurn: isMyTurn,
                    currentPickNumber: currentPickNumber,
                    totalPicks: totalPicks,
                    currentDrafter: currentDrafter,
                    status: draftStatus
                )
                resolver(nil)
            } catch {
                rejecter("START_FAILED", error.localizedDescription, error)
            }
        }
    }
    
    // Similar for update and end...
}
```

### 2. JavaScript/TypeScript Bridge

Use the existing `lib/dynamicIsland.ts` module which already has the bridge structure in place.

## State Management

### In-Draft State
- **When**: User is in the draft room (app foreground)
- **Dynamic Island**: Shows compact/minimal timer view
- **Action**: App controls Dynamic Island directly (if supported) or Live Activity

### Out-of-Draft State
- **When**: User is in app but not in a draft
- **Dynamic Island**: Not displayed (normal status bar)
- **Action**: No Live Activity running

### Out-of-App-During-Live-Draft State
- **When**: User left app but draft is active
- **Dynamic Island**: Shows expanded Live Activity
- **Action**: Live Activity updates via push notifications or background refresh

## Design Guidelines

### Dynamic Island Views

1. **Compact View** (minimized):
   - Icon on left (clock for user's turn, person for others)
   - Timer on right (with urgency color)

2. **Expanded View** (when tapped):
   - Leading: Icon and drafter name
   - Trailing: Timer and pick number
   - Bottom: Progress bar and last pick info

3. **Minimal View** (smallest):
   - Colored dot indicating status (red=critical, orange=warning, blue=normal)

### Urgency Colors

- **Critical** (≤5 seconds): Red
- **Warning** (≤10 seconds): Orange
- **Normal** (>10 seconds): Blue or system color

## Testing

### Simulator Testing

1. Run on iPhone 14 Pro simulator (or later)
2. Start a draft and leave the app
3. Dynamic Island should appear in simulator
4. Tap to expand and verify all views

### Device Testing

1. Deploy to physical iPhone 14 Pro or later
2. Test all three states
3. Verify Live Activity updates in real-time
4. Test background updates when app is closed

## Limitations

1. **Device Support**: Dynamic Island only on iPhone 14 Pro+. Earlier devices show Live Activities in notification center
2. **Update Frequency**: Live Activities have rate limits (recommended: <4 updates per minute)
3. **Background Updates**: Requires server-side push or background tasks
4. **Battery**: Frequent updates can impact battery life

## Troubleshooting

### Activity Not Starting

- Check Live Activities are enabled in Settings > [Your App] > Live Activities
- Verify deployment target is iOS 16.1+
- Ensure Widget Extension target is properly configured

### Updates Not Appearing

- Check update frequency (may be throttled)
- Verify activity is still active (not ended)
- Check console for error messages

### Dynamic Island Not Showing

- Verify device is iPhone 14 Pro or later
- Check if Dynamic Island is enabled in Settings
- Ensure Live Activity is active and visible

## Resources

- [Apple: Live Activities Documentation](https://developer.apple.com/documentation/activitykit)
- [Apple: Dynamic Island Documentation](https://developer.apple.com/documentation/widgetkit/live-activities)
- [WWDC 2022: Live Activities](https://developer.apple.com/videos/play/wwdc2022/10148/)
