/**
 * DraftTimerActivityWidget - Live Activity Widget for Dynamic Island
 * 
 * Provides Live Activity support for draft timer when app is in background.
 * This displays in Dynamic Island on iPhone 14 Pro+ and as Live Activity on other devices.
 * 
 * Requirements:
 * - iOS 16.1+
 * - WidgetKit framework
 * - ActivityKit framework
 * 
 * Usage:
 * 1. Add Widget Extension target to your Xcode project
 * 2. Set deployment target to iOS 16.1+
 * 3. Enable Live Activities capability
 * 4. Import this file into your widget extension
 */

import WidgetKit
import ActivityKit
import SwiftUI

// ============================================================================
// ACTIVITY ATTRIBUTES
// ============================================================================

@available(iOS 16.1, *)
struct DraftTimerActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// Seconds remaining on timer
        var secondsRemaining: Int
        
        /// Total seconds for pick
        var totalSeconds: Int
        
        /// Whether it's the user's turn
        var isMyTurn: Bool
        
        /// Current pick number
        var currentPickNumber: Int
        
        /// Total picks in draft
        var totalPicks: Int
        
        /// Current drafter name
        var currentDrafter: String
        
        /// Draft status
        var status: DraftStatus
        
        /// Last picked player name (optional)
        var lastPickedPlayer: String?
    }
    
    /// Room ID for the draft
    var roomId: String
    
    /// Draft room name
    var roomName: String
}

enum DraftStatus: String, Codable {
    case preDraft = "pre_draft"
    case active = "active"
    case paused = "paused"
    case completed = "completed"
    case expired = "expired"
}

// ============================================================================
// LIVE ACTIVITY WIDGET
// ============================================================================

@available(iOS 16.1, *)
@main
struct DraftTimerActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DraftTimerActivityAttributes.self) { context in
            // Lock screen / Dynamic Island expanded view
            LockScreenLiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded region (when user taps Dynamic Island)
                DynamicIslandExpandedRegion(.leading) {
                    DynamicIslandExpandedLeadingView(context: context)
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    DynamicIslandExpandedTrailingView(context: context)
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    DynamicIslandExpandedBottomView(context: context)
                }
            } compactLeading: {
                // Compact leading (left side when minimized)
                CompactLeadingView(context: context)
            } compactTrailing: {
                // Compact trailing (right side when minimized)
                CompactTrailingView(context: context)
            } minimal: {
                // Minimal view (smallest state)
                MinimalView(context: context)
            }
            .widgetURL(URL(string: "topdog://draft/\(context.attributes.roomId)"))
        }
    }
}

// ============================================================================
// VIEW COMPONENTS
// ============================================================================

@available(iOS 16.1, *)
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<DraftTimerActivityAttributes>
    
    var body: some View {
        HStack(spacing: 12) {
            // Timer display
            VStack(alignment: .leading, spacing: 4) {
                if context.state.isMyTurn {
                    Text("Your Turn!")
                        .font(.headline)
                        .foregroundColor(.red)
                } else {
                    Text("\(context.state.currentDrafter) picking...")
                        .font(.headline)
                        .foregroundColor(.primary)
                }
                
                HStack(spacing: 8) {
                    Text("\(context.state.secondsRemaining)s")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(timerColor)
                    
                    // Progress bar
                    ProgressView(value: Double(context.state.secondsRemaining), total: Double(context.state.totalSeconds))
                        .progressViewStyle(LinearProgressViewStyle(tint: timerColor))
                }
            }
            
            Spacer()
            
            // Pick info
            VStack(alignment: .trailing, spacing: 4) {
                Text("Pick \(context.state.currentPickNumber)/\(context.state.totalPicks)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(context.attributes.roomName)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    private var timerColor: Color {
        let seconds = context.state.secondsRemaining
        if seconds <= 5 {
            return .red
        } else if seconds <= 10 {
            return .orange
        } else if context.state.isMyTurn {
            return .blue
        } else {
            return .primary
        }
    }
}

// Dynamic Island - Expanded Leading
@available(iOS 16.1, *)
struct DynamicIslandExpandedLeadingView: View {
    let context: ActivityViewContext<DraftTimerActivityAttributes>
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if context.state.isMyTurn {
                Image(systemName: "clock.fill")
                    .foregroundColor(.red)
                    .font(.title2)
                Text("Your Turn!")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Image(systemName: "person.fill")
                    .foregroundColor(.blue)
                    .font(.title2)
                Text("\(context.state.currentDrafter)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// Dynamic Island - Expanded Trailing
@available(iOS 16.1, *)
struct DynamicIslandExpandedTrailingView: View {
    let context: ActivityViewContext<DraftTimerActivityAttributes>
    
    var body: some View {
        VStack(alignment: .trailing, spacing: 4) {
            Text("\(context.state.secondsRemaining)s")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundColor(timerColor)
            
            Text("Pick \(context.state.currentPickNumber)/\(context.state.totalPicks)")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
    
    private var timerColor: Color {
        let seconds = context.state.secondsRemaining
        if seconds <= 5 {
            return .red
        } else if seconds <= 10 {
            return .orange
        } else {
            return .primary
        }
    }
}

// Dynamic Island - Expanded Bottom
@available(iOS 16.1, *)
struct DynamicIslandExpandedBottomView: View {
    let context: ActivityViewContext<DraftTimerActivityAttributes>
    
    var body: some View {
        VStack(spacing: 8) {
            // Progress bar
            ProgressView(value: Double(context.state.secondsRemaining), total: Double(context.state.totalSeconds))
                .progressViewStyle(LinearProgressViewStyle(tint: timerColor))
                .frame(height: 4)
            
            // Last picked player (if available)
            if let lastPicked = context.state.lastPickedPlayer {
                Text("Last pick: \(lastPicked)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private var timerColor: Color {
        let seconds = context.state.secondsRemaining
        if seconds <= 5 {
            return .red
        } else if seconds <= 10 {
            return .orange
        } else {
            return .blue
        }
    }
}

// Dynamic Island - Compact Leading
@available(iOS 16.1, *)
struct CompactLeadingView: View {
    let context: ActivityViewContext<DraftTimerActivityAttributes>
    
    var body: some View {
        Image(systemName: context.state.isMyTurn ? "clock.fill" : "person.fill")
            .foregroundColor(timerColor)
    }
    
    private var timerColor: Color {
        let seconds = context.state.secondsRemaining
        if seconds <= 5 {
            return .red
        } else if seconds <= 10 {
            return .orange
        } else {
            return .blue
        }
    }
}

// Dynamic Island - Compact Trailing
@available(iOS 16.1, *)
struct CompactTrailingView: View {
    let context: ActivityViewContext<DraftTimerActivityAttributes>
    
    var body: some View {
        Text("\(context.state.secondsRemaining)s")
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .foregroundColor(timerColor)
            .monospacedDigit()
    }
    
    private var timerColor: Color {
        let seconds = context.state.secondsRemaining
        if seconds <= 5 {
            return .red
        } else if seconds <= 10 {
            return .orange
        } else {
            return .primary
        }
    }
}

// Dynamic Island - Minimal
@available(iOS 16.1, *)
struct MinimalView: View {
    let context: ActivityViewContext<DraftTimerActivityAttributes>
    
    var body: some View {
        ZStack {
            Circle()
                .fill(timerColor)
                .frame(width: 8, height: 8)
        }
    }
    
    private var timerColor: Color {
        let seconds = context.state.secondsRemaining
        if seconds <= 5 {
            return .red
        } else if seconds <= 10 {
            return .orange
        } else {
            return .blue
        }
    }
}
