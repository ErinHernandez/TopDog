/**
 * DraftAlertManager - Manages temporary alert activities for Dynamic Island
 * 
 * Shows brief alerts in Dynamic Island for draft events
 */

import Foundation
import ActivityKit
import UIKit

@available(iOS 16.1, *)
@MainActor
class DraftAlertManager {
    static let shared = DraftAlertManager()
    
    private var currentAlert: Activity<DraftAlertAttributes>?
    
    private init() {}
    
    enum AlertType: String, Codable {
        case roomFilled = "room_filled"
        case draftStarting = "draft_starting"
        case twoPicksAway = "two_picks_away"
        case onTheClock = "on_the_clock"
        case tenSecondsRemaining = "ten_seconds_remaining"
    }
    
    struct AlertData: Codable {
        let type: AlertType
        let message: String
        let roomId: String
        let timestamp: TimeInterval
    }
    
    func showAlert(_ data: AlertData) async throws {
        // End any existing alert
        if let existing = currentAlert {
            await endAlert()
        }
        
        // Check availability
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            throw DraftAlertError.notAvailable
        }
        
        // Create attributes
        let attributes = DraftAlertAttributes(
            roomId: data.roomId,
            alertType: data.type
        )
        
        // Create content state
        let contentState = DraftAlertAttributes.ContentState(
            message: data.message,
            timestamp: data.timestamp
        )
        
        // Start alert activity
        let activity = try Activity<DraftAlertAttributes>.request(
            attributes: attributes,
            contentState: contentState,
            pushType: nil
        )
        
        currentAlert = activity
        
        // Auto-dismiss after 5 seconds
        Task {
            try? await Task.sleep(nanoseconds: 5_000_000_000) // 5 seconds
            await endAlert()
        }
    }
    
    func endAlert() async {
        guard let alert = currentAlert else { return }
        await alert.end(dismissalPolicy: .immediate, using: alert.contentState)
        currentAlert = nil
    }
}

enum DraftAlertError: Error {
    case notAvailable
    case failedToStart(Error)
}
