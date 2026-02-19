/**
 * DraftTimerActivityManager - Manages Live Activities for Draft Timer
 * 
 * Handles starting, updating, and ending Live Activities for draft timer.
 * Integrates with the main app to sync draft state with Dynamic Island.
 * 
 * Usage:
 * ```swift
 * let manager = DraftTimerActivityManager()
 * 
 * // Start activity
 * try await manager.startActivity(roomId: "room123", roomName: "My Draft", ...)
 * 
 * // Update activity
 * try await manager.updateActivity(secondsRemaining: 25, isMyTurn: true, ...)
 * 
 * // End activity
 * await manager.endActivity()
 * ```
 */

import Foundation
import ActivityKit
import UIKit

@available(iOS 16.1, *)
@MainActor
class DraftTimerActivityManager {
    private var currentActivity: Activity<DraftTimerActivityAttributes>?
    
    // ============================================================================
    // SINGLETON
    // ============================================================================
    
    static let shared = DraftTimerActivityManager()
    
    private init() {}
    
    // ============================================================================
    // PERMISSIONS
    // ============================================================================
    
    /// Check if Live Activities are available
    var isLiveActivityAvailable: Bool {
        return ActivityAuthorizationInfo().areActivitiesEnabled
    }
    
    /// Check if Live Activities are enabled
    var areActivitiesEnabled: Bool {
        return ActivityAuthorizationInfo().areActivitiesEnabled
    }
    
    /// Request Live Activity authorization
    func requestAuthorization() async -> Bool {
        // Live Activities authorization is automatic - no explicit request needed
        // But we should check if user has enabled them in Settings
        return areActivitiesEnabled
    }
    
    // ============================================================================
    // ACTIVITY MANAGEMENT
    // ============================================================================
    
    /// Start a new Live Activity for draft timer
    func startActivity(
        roomId: String,
        roomName: String,
        secondsRemaining: Int,
        totalSeconds: Int,
        isMyTurn: Bool,
        currentPickNumber: Int,
        totalPicks: Int,
        currentDrafter: String,
        status: DraftStatus
    ) throws {
        // End any existing activity first
        if let existing = currentActivity {
            Task {
                await endActivity()
            }
        }
        
        // Check availability
        guard isLiveActivityAvailable else {
            throw DraftTimerActivityError.notAvailable
        }
        
        // Create attributes
        let attributes = DraftTimerActivityAttributes(
            roomId: roomId,
            roomName: roomName
        )
        
        // Create content state
        let contentState = DraftTimerActivityAttributes.ContentState(
            secondsRemaining: secondsRemaining,
            totalSeconds: totalSeconds,
            isMyTurn: isMyTurn,
            currentPickNumber: currentPickNumber,
            totalPicks: totalPicks,
            currentDrafter: currentDrafter,
            status: status,
            lastPickedPlayer: nil
        )
        
        // Start activity
        do {
            let activity = try Activity<DraftTimerActivityAttributes>.request(
                attributes: attributes,
                contentState: contentState,
                pushType: nil
            )
            
            currentActivity = activity
            
            print("[DraftTimerActivity] Started activity for room: \(roomId)")
        } catch {
            print("[DraftTimerActivity] Failed to start activity: \(error)")
            throw DraftTimerActivityError.failedToStart(error)
        }
    }
    
    /// Update the current Live Activity
    func updateActivity(
        secondsRemaining: Int? = nil,
        totalSeconds: Int? = nil,
        isMyTurn: Bool? = nil,
        currentPickNumber: Int? = nil,
        totalPicks: Int? = nil,
        currentDrafter: String? = nil,
        status: DraftStatus? = nil,
        lastPickedPlayer: String? = nil
    ) async throws {
        guard let activity = currentActivity else {
            throw DraftTimerActivityError.noActiveActivity
        }
        
        // Get current state
        var newState = activity.contentState
        
        // Update provided fields
        if let secondsRemaining = secondsRemaining {
            newState.secondsRemaining = secondsRemaining
        }
        if let totalSeconds = totalSeconds {
            newState.totalSeconds = totalSeconds
        }
        if let isMyTurn = isMyTurn {
            newState.isMyTurn = isMyTurn
        }
        if let currentPickNumber = currentPickNumber {
            newState.currentPickNumber = currentPickNumber
        }
        if let totalPicks = totalPicks {
            newState.totalPicks = totalPicks
        }
        if let currentDrafter = currentDrafter {
            newState.currentDrafter = currentDrafter
        }
        if let status = status {
            newState.status = status
        }
        if let lastPickedPlayer = lastPickedPlayer {
            newState.lastPickedPlayer = lastPickedPlayer
        }
        
        // Update activity
        await activity.update(using: newState)
        
        print("[DraftTimerActivity] Updated activity: \(newState.secondsRemaining)s remaining")
    }
    
    /// End the current Live Activity
    func endActivity(reason: ActivityUIDismissalPolicy = .immediate) async {
        guard let activity = currentActivity else {
            return
        }
        
        let finalState = activity.contentState
        await activity.end(dismissalPolicy: reason, using: finalState)
        
        currentActivity = nil
        
        print("[DraftTimerActivity] Ended activity")
    }
    
    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    
    /// Check if there's an active activity
    var hasActiveActivity: Bool {
        return currentActivity != nil
    }
    
    /// Get current activity state
    var currentState: DraftTimerActivityAttributes.ContentState? {
        return currentActivity?.contentState
    }
}

// ============================================================================
// ERRORS
// ============================================================================

enum DraftTimerActivityError: Error {
    case notAvailable
    case failedToStart(Error)
    case noActiveActivity
    case updateFailed(Error)
}

// ============================================================================
// DRAFT TIMER OBSERVER (for integration with app)
// ============================================================================

/// Observer protocol for draft timer state changes
protocol DraftTimerObserver: AnyObject {
    func draftTimerDidUpdate(_ state: DraftTimerState)
    func draftTimerDidExpire()
    func draftTimerDidPause()
    func draftTimerDidResume()
}

struct DraftTimerState {
    let secondsRemaining: Int
    let totalSeconds: Int
    let isMyTurn: Bool
    let currentPickNumber: Int
    let totalPicks: Int
    let currentDrafter: String
    let status: DraftStatus
    let roomId: String
    let roomName: String
}

// Observer manager for coordinating between draft room and Live Activity
@available(iOS 16.1, *)
@MainActor
class DraftTimerObserverManager {
    static let shared = DraftTimerObserverManager()
    
    private weak var observer: DraftTimerObserver?
    private let activityManager = DraftTimerActivityManager.shared
    
    private init() {}
    
    func setObserver(_ observer: DraftTimerObserver) {
        self.observer = observer
    }
    
    func updateTimerState(_ state: DraftTimerState) {
        // Update Live Activity
        Task {
            if activityManager.hasActiveActivity {
                do {
                    try await activityManager.updateActivity(
                        secondsRemaining: state.secondsRemaining,
                        totalSeconds: state.totalSeconds,
                        isMyTurn: state.isMyTurn,
                        currentPickNumber: state.currentPickNumber,
                        totalPicks: state.totalPicks,
                        currentDrafter: state.currentDrafter,
                        status: state.status
                    )
                } catch {
                    print("[DraftTimerObserver] Failed to update activity: \(error)")
                }
            } else if state.status == .active {
                // Start new activity if not active
                do {
                    try activityManager.startActivity(
                        roomId: state.roomId,
                        roomName: state.roomName,
                        secondsRemaining: state.secondsRemaining,
                        totalSeconds: state.totalSeconds,
                        isMyTurn: state.isMyTurn,
                        currentPickNumber: state.currentPickNumber,
                        totalPicks: state.totalPicks,
                        currentDrafter: state.currentDrafter,
                        status: state.status
                    )
                } catch {
                    print("[DraftTimerObserver] Failed to start activity: \(error)")
                }
            }
        }
        
        // Notify observer
        observer?.draftTimerDidUpdate(state)
    }
    
    func timerExpired() {
        observer?.draftTimerDidExpire()
    }
    
    func timerPaused() {
        Task {
            try? await activityManager.updateActivity(status: .paused)
        }
        observer?.draftTimerDidPause()
    }
    
    func timerResumed() {
        Task {
            try? await activityManager.updateActivity(status: .active)
        }
        observer?.draftTimerDidResume()
    }
    
    func draftEnded() {
        Task {
            await activityManager.endActivity(reason: .immediate)
        }
    }
}
