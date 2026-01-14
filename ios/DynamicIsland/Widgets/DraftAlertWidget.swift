/**
 * DraftAlertWidget - Widget for temporary draft alerts
 */

import WidgetKit
import ActivityKit
import SwiftUI

@available(iOS 16.1, *)
struct DraftAlertAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var message: String
        var timestamp: TimeInterval
    }
    
    var roomId: String
    var alertType: DraftAlertManager.AlertType
}

@available(iOS 16.1, *)
@main
struct DraftAlertWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DraftAlertAttributes.self) { context in
            // Lock screen view
            LockScreenAlertView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    AlertIconView(type: context.attributes.alertType)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    AlertMessageView(message: context.state.message)
                }
            } compactLeading: {
                AlertIconView(type: context.attributes.alertType)
            } compactTrailing: {
                AlertMessageView(message: context.state.message)
            } minimal: {
                Image(systemName: "bell.fill")
                    .foregroundColor(.blue)
            }
        }
    }
}

@available(iOS 16.1, *)
struct LockScreenAlertView: View {
    let context: ActivityViewContext<DraftAlertAttributes>
    
    var body: some View {
        HStack {
            AlertIconView(type: context.attributes.alertType)
            Text(context.state.message)
                .font(.headline)
            Spacer()
        }
        .padding()
    }
}

@available(iOS 16.1, *)
struct AlertIconView: View {
    let type: DraftAlertManager.AlertType
    
    var body: some View {
        Image(systemName: iconName)
            .foregroundColor(iconColor)
            .font(.title2)
    }
    
    private var iconName: String {
        switch type {
        case .roomFilled: return "person.3.fill"
        case .draftStarting: return "play.circle.fill"
        case .twoPicksAway: return "2.circle.fill"
        case .onTheClock: return "clock.fill"
        case .tenSecondsRemaining: return "timer"
        }
    }
    
    private var iconColor: Color {
        switch type {
        case .roomFilled: return .green
        case .draftStarting: return .blue
        case .twoPicksAway: return .orange
        case .onTheClock: return .red
        case .tenSecondsRemaining: return .red
        }
    }
}

@available(iOS 16.1, *)
struct AlertMessageView: View {
    let message: String
    
    var body: some View {
        Text(message)
            .font(.caption)
            .lineLimit(1)
            .truncationMode(.tail)
    }
}
