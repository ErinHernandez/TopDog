// ============================================================================
// VIP ACCOUNT MANAGER
// ============================================================================
//
// Handles VIP-specific account operations including:
// - Merging existing accounts with reserved VIP usernames
// - Finding potential VIP matches among existing users
// - Username migration with full audit trail
// - Notification to users about username changes
//
// ============================================================================

import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  writeBatch,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { 
  checkVIPReservation, 
  claimVIPUsername,
  getAllVIPReservations,
  sanitizeUsername,
} from './usernameValidation';
import { UserRegistrationService } from './userRegistration';

// ============================================================================
// TYPES
// ============================================================================

/**
 * @typedef {Object} MergeRequest
 * @property {string} id - Unique merge request ID
 * @property {string} uid - User's Firebase UID
 * @property {string} currentUsername - User's current username
 * @property {string} reservedUsername - The VIP username reserved for them
 * @property {string} reservedFor - Who the username was reserved for
 * @property {string} status - 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled'
 * @property {string} requestedBy - Admin who initiated the merge
 * @property {Date} requestedAt - When the merge was requested
 * @property {string|null} approvedBy - Admin who approved (if different from requester)
 * @property {Date|null} approvedAt - When approved
 * @property {Date|null} completedAt - When merge was completed
 * @property {string|null} rejectedReason - Reason if rejected
 * @property {string} notes - Additional notes
 * @property {boolean} userNotified - Whether user has been notified
 * @property {boolean} userAccepted - Whether user accepted the change (if required)
 */

/**
 * @typedef {Object} UsernameChangeAudit
 * @property {string} uid - User's Firebase UID
 * @property {string} oldUsername - Previous username
 * @property {string} newUsername - New username
 * @property {string} changeType - 'vip_merge' | 'user_request' | 'admin_override'
 * @property {string} changedBy - Who made the change
 * @property {Date} changedAt - When the change was made
 * @property {string} reason - Reason for the change
 * @property {Object} metadata - Additional context
 */

// ============================================================================
// VIP ACCOUNT MANAGER CLASS
// ============================================================================

export class VIPAccountManager {
  
  // ==========================================================================
  // FIND POTENTIAL VIP MATCHES
  // ==========================================================================
  
  /**
   * Find existing users who might be the intended recipient of a VIP reservation
   * Searches by email, display name patterns, and other identifiers
   * 
   * @param {string} reservedUsername - The reserved VIP username
   * @param {Object} searchCriteria - Criteria to match users
   * @param {string} [searchCriteria.email] - Email to search for
   * @param {string} [searchCriteria.displayNameContains] - Partial display name match
   * @param {string} [searchCriteria.usernameContains] - Partial username match
   * @returns {Promise<{ matches: Array, reservation: Object }>}
   */
  static async findPotentialVIPMatches(reservedUsername, searchCriteria = {}) {
    try {
      const normalizedReserved = reservedUsername.toUpperCase().trim();
      
      // Get the VIP reservation
      const vipCheck = checkVIPReservation(normalizedReserved);
      if (!vipCheck.isReserved) {
        return { 
          success: false, 
          error: 'No VIP reservation found for this username',
          matches: [] 
        };
      }
      
      if (vipCheck.reservation.claimed) {
        return { 
          success: false, 
          error: 'This VIP username has already been claimed',
          matches: [],
          reservation: vipCheck.reservation
        };
      }
      
      const matches = [];
      const usersRef = collection(db, 'users');
      
      // Search by email if provided
      if (searchCriteria.email) {
        const emailQuery = query(usersRef, where('email', '==', searchCriteria.email.toLowerCase()));
        const emailResults = await getDocs(emailQuery);
        emailResults.forEach(doc => {
          matches.push({
            ...doc.data(),
            matchReason: 'email_match',
            matchConfidence: 'high'
          });
        });
      }
      
      // Search by partial username match
      if (searchCriteria.usernameContains) {
        const allUsers = await getDocs(usersRef);
        const searchTerm = searchCriteria.usernameContains.toUpperCase();
        
        allUsers.forEach(doc => {
          const userData = doc.data();
          if (userData.username && 
              userData.username.includes(searchTerm) &&
              !matches.find(m => m.uid === userData.uid)) {
            matches.push({
              ...userData,
              matchReason: 'username_partial_match',
              matchConfidence: 'medium'
            });
          }
        });
      }
      
      // Search by display name
      if (searchCriteria.displayNameContains) {
        const allUsers = await getDocs(usersRef);
        const searchTerm = searchCriteria.displayNameContains.toLowerCase();
        
        allUsers.forEach(doc => {
          const userData = doc.data();
          if (userData.displayName && 
              userData.displayName.toLowerCase().includes(searchTerm) &&
              !matches.find(m => m.uid === userData.uid)) {
            matches.push({
              ...userData,
              matchReason: 'display_name_match',
              matchConfidence: 'medium'
            });
          }
        });
      }
      
      return {
        success: true,
        matches,
        reservation: vipCheck.reservation,
        totalFound: matches.length
      };
      
    } catch (error) {
      console.error('Error finding VIP matches:', error);
      return {
        success: false,
        error: error.message,
        matches: []
      };
    }
  }
  
  /**
   * Get all unclaimed VIP reservations with potential user matches
   * Useful for admin dashboard to review pending VIP assignments
   * 
   * @returns {Promise<Array<{ reservation: Object, potentialMatches: Array }>>}
   */
  static async getUnclaimedVIPsWithMatches() {
    try {
      const unclaimed = getAllVIPReservations({ unclaimedOnly: true });
      const results = [];
      
      for (const reservation of unclaimed) {
        // Try to find matches based on the "reservedFor" field
        const nameParts = reservation.reservedFor.split(/[-\s]+/);
        const potentialMatches = [];
        
        // Search for each name part
        for (const part of nameParts) {
          if (part.length >= 3) {
            const matches = await this.findPotentialVIPMatches(reservation.username, {
              usernameContains: part,
              displayNameContains: part
            });
            
            if (matches.success && matches.matches.length > 0) {
              potentialMatches.push(...matches.matches);
            }
          }
        }
        
        // Deduplicate matches
        const uniqueMatches = potentialMatches.filter((match, index, self) =>
          index === self.findIndex(m => m.uid === match.uid)
        );
        
        results.push({
          reservation,
          potentialMatches: uniqueMatches,
          matchCount: uniqueMatches.length
        });
      }
      
      return {
        success: true,
        results,
        totalUnclaimed: unclaimed.length,
        withMatches: results.filter(r => r.matchCount > 0).length
      };
      
    } catch (error) {
      console.error('Error getting unclaimed VIPs with matches:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }
  
  // ==========================================================================
  // MERGE REQUESTS
  // ==========================================================================
  
  /**
   * Create a merge request to assign a VIP username to an existing user
   * 
   * @param {Object} params
   * @param {string} params.uid - User's Firebase UID
   * @param {string} params.reservedUsername - The VIP username to assign
   * @param {string} params.requestedBy - Admin making the request
   * @param {string} [params.notes] - Additional notes
   * @param {boolean} [params.requireUserAcceptance] - Whether user must accept
   * @returns {Promise<{ success: boolean, mergeRequest?: MergeRequest, error?: string }>}
   */
  static async createMergeRequest({
    uid,
    reservedUsername,
    requestedBy,
    notes = '',
    requireUserAcceptance = false
  }) {
    try {
      const normalizedReserved = reservedUsername.toUpperCase().trim();
      
      // Validate VIP reservation exists and is unclaimed
      const vipCheck = checkVIPReservation(normalizedReserved);
      if (!vipCheck.isReserved) {
        return { success: false, error: 'No VIP reservation found for this username' };
      }
      if (vipCheck.reservation.claimed) {
        return { success: false, error: 'This VIP username has already been claimed' };
      }
      
      // Get user's current profile
      const userResult = await UserRegistrationService.getUserProfile(uid);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const currentUsername = userResult.userProfile.username;
      
      // Check for existing active merge request (pending or approved)
      const existingRequest = await this.getMergeRequestByUid(uid, { activeOnly: true });
      if (existingRequest) {
        const statusMessage = existingRequest.status === 'approved' 
          ? 'User already has an approved merge request awaiting acceptance'
          : 'User already has a pending merge request';
        return { 
          success: false, 
          error: statusMessage,
          existingRequest 
        };
      }
      
      // Create merge request
      const mergeRequestId = `merge_${uid}_${Date.now()}`;
      const mergeRequest = {
        id: mergeRequestId,
        uid,
        currentUsername,
        reservedUsername: normalizedReserved,
        reservedFor: vipCheck.reservation.reservedFor,
        status: 'pending',
        requestedBy,
        requestedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
        completedAt: null,
        rejectedReason: null,
        notes,
        requireUserAcceptance,
        userNotified: false,
        userAccepted: !requireUserAcceptance, // Auto-accept if not required
      };
      
      // Save to Firestore
      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      await setDoc(mergeRequestRef, {
        ...mergeRequest,
        requestedAt: serverTimestamp(),
      });
      
      console.log(`Merge request created: ${mergeRequestId}`);
      
      return {
        success: true,
        mergeRequest
      };
      
    } catch (error) {
      console.error('Error creating merge request:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get merge request by user UID
   * @param {string} uid - User ID to search for
   * @param {Object} [options] - Query options
   * @param {boolean} [options.activeOnly=true] - If true, only return non-terminal states (pending, approved)
   * @param {string[]} [options.statuses] - Specific statuses to query for (overrides activeOnly)
   */
  static async getMergeRequestByUid(uid, options = {}) {
    try {
      const { activeOnly = true, statuses } = options;
      const mergeRequestsRef = collection(db, 'merge_requests');
      
      // Determine which statuses to query
      // Terminal states: 'completed', 'rejected', 'cancelled'
      // Active states: 'pending', 'approved'
      let statusFilter;
      if (statuses && statuses.length > 0) {
        statusFilter = statuses;
      } else if (activeOnly) {
        // Include both pending and approved to prevent duplicate requests
        statusFilter = ['pending', 'approved'];
      } else {
        // Return any merge request (for historical lookup)
        statusFilter = null;
      }
      
      let q;
      if (statusFilter) {
        q = query(mergeRequestsRef, where('uid', '==', uid), where('status', 'in', statusFilter));
      } else {
        q = query(mergeRequestsRef, where('uid', '==', uid));
      }
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      return snapshot.docs[0].data();
    } catch (error) {
      console.error('Error getting merge request:', error);
      return null;
    }
  }
  
  /**
   * Get all merge requests with optional filters
   */
  static async getAllMergeRequests(filters = {}) {
    try {
      const mergeRequestsRef = collection(db, 'merge_requests');
      let q = mergeRequestsRef;
      
      if (filters.status) {
        q = query(mergeRequestsRef, where('status', '==', filters.status));
      }
      
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => doc.data());
      
      return {
        success: true,
        requests,
        total: requests.length
      };
    } catch (error) {
      console.error('Error getting merge requests:', error);
      return {
        success: false,
        error: error.message,
        requests: []
      };
    }
  }
  
  /**
   * Approve a merge request (if different admin than requester)
   */
  static async approveMergeRequest(mergeRequestId, approvedBy) {
    try {
      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);
      
      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }
      
      const mergeRequest = mergeRequestDoc.data();
      
      if (mergeRequest.status !== 'pending') {
        return { success: false, error: `Merge request is ${mergeRequest.status}, not pending` };
      }
      
      await setDoc(mergeRequestRef, {
        ...mergeRequest,
        status: 'approved',
        approvedBy,
        approvedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error approving merge request:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Reject a merge request
   */
  static async rejectMergeRequest(mergeRequestId, rejectedBy, reason) {
    try {
      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);
      
      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }
      
      const mergeRequest = mergeRequestDoc.data();
      
      if (mergeRequest.status !== 'pending' && mergeRequest.status !== 'approved') {
        return { success: false, error: `Cannot reject - status is ${mergeRequest.status}` };
      }
      
      await setDoc(mergeRequestRef, {
        ...mergeRequest,
        status: 'rejected',
        rejectedReason: reason,
        rejectedBy,
        rejectedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting merge request:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================================================
  // EXECUTE MERGE
  // ==========================================================================
  
  /**
   * Execute the username merge - this is the main function that changes the username
   * 
   * @param {string} mergeRequestId - The merge request to execute
   * @param {string} executedBy - Admin executing the merge
   * @returns {Promise<{ success: boolean, audit?: UsernameChangeAudit, error?: string }>}
   */
  static async executeMerge(mergeRequestId, executedBy) {
    try {
      // Get merge request
      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);
      
      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }
      
      const mergeRequest = mergeRequestDoc.data();
      
      // Validate status
      if (mergeRequest.status !== 'pending' && mergeRequest.status !== 'approved') {
        return { success: false, error: `Cannot execute - status is ${mergeRequest.status}` };
      }
      
      // Validate user acceptance if required
      if (mergeRequest.requireUserAcceptance && !mergeRequest.userAccepted) {
        return { success: false, error: 'User has not accepted the username change' };
      }
      
      const { uid, currentUsername, reservedUsername } = mergeRequest;
      
      // Start batch write for atomic operation
      const batch = writeBatch(db);
      
      // 1. Update user profile with new username
      const userRef = doc(db, 'users', uid);
      batch.update(userRef, {
        username: reservedUsername,
        previousUsername: currentUsername,
        usernameChangedAt: serverTimestamp(),
        usernameChangeReason: 'vip_merge',
        updatedAt: serverTimestamp(),
      });
      
      // 2. Update usernames collection - release old, claim new
      const oldUsernameRef = doc(db, 'usernames', currentUsername);
      const newUsernameRef = doc(db, 'usernames', reservedUsername);
      
      // Release old username (mark as available or delete)
      batch.update(oldUsernameRef, {
        releasedAt: serverTimestamp(),
        releasedReason: 'vip_merge',
        previousOwner: uid,
        uid: null, // No longer owned
      });
      
      // Claim new username
      batch.set(newUsernameRef, {
        uid,
        username: reservedUsername,
        reservedAt: serverTimestamp(),
        claimedVia: 'vip_merge',
        previousUsername: currentUsername,
      });
      
      // 3. Create audit record
      const auditId = `audit_${uid}_${Date.now()}`;
      const auditRef = doc(db, 'username_change_audit', auditId);
      const auditRecord = {
        id: auditId,
        uid,
        oldUsername: currentUsername,
        newUsername: reservedUsername,
        changeType: 'vip_merge',
        changedBy: executedBy,
        changedAt: serverTimestamp(),
        reason: `VIP merge: ${mergeRequest.reservedFor}`,
        mergeRequestId,
        metadata: {
          reservedFor: mergeRequest.reservedFor,
          requestedBy: mergeRequest.requestedBy,
          requestedAt: mergeRequest.requestedAt,
        }
      };
      batch.set(auditRef, auditRecord);
      
      // 4. Update merge request status
      batch.update(mergeRequestRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        completedBy: executedBy,
      });
      
      // Commit all changes atomically
      await batch.commit();
      
      // 5. Claim the VIP username in the in-memory reservation system
      // IMPORTANT: This must happen AFTER batch.commit() succeeds to ensure
      // consistency between the database and in-memory state
      claimVIPUsername(reservedUsername, uid);
      
      console.log(`VIP merge completed: ${currentUsername} -> ${reservedUsername} for UID ${uid}`);
      
      return {
        success: true,
        audit: {
          ...auditRecord,
          changedAt: new Date()
        },
        oldUsername: currentUsername,
        newUsername: reservedUsername
      };
      
    } catch (error) {
      console.error('Error executing merge:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Quick merge - create and immediately execute a merge (for admin convenience)
   * Use with caution - bypasses approval workflow
   * 
   * @param {Object} params
   * @param {string} params.uid - User's Firebase UID  
   * @param {string} params.reservedUsername - The VIP username to assign
   * @param {string} params.adminId - Admin performing the merge
   * @param {string} [params.notes] - Notes for the audit trail
   * @returns {Promise<{ success: boolean, audit?: UsernameChangeAudit, error?: string }>}
   */
  static async quickMerge({ uid, reservedUsername, adminId, notes = '' }) {
    // Create the merge request
    const createResult = await this.createMergeRequest({
      uid,
      reservedUsername,
      requestedBy: adminId,
      notes: `Quick merge: ${notes}`,
      requireUserAcceptance: false
    });
    
    if (!createResult.success) {
      return createResult;
    }
    
    // Immediately execute
    return this.executeMerge(createResult.mergeRequest.id, adminId);
  }
  
  // ==========================================================================
  // USER ACCEPTANCE
  // ==========================================================================
  
  /**
   * User accepts the username change (when requireUserAcceptance is true)
   */
  static async userAcceptsMerge(mergeRequestId, uid) {
    try {
      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);
      
      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }
      
      const mergeRequest = mergeRequestDoc.data();
      
      // Verify this is the right user
      if (mergeRequest.uid !== uid) {
        return { success: false, error: 'This merge request is not for this user' };
      }
      
      if (mergeRequest.status !== 'pending' && mergeRequest.status !== 'approved') {
        return { success: false, error: `Cannot accept - status is ${mergeRequest.status}` };
      }
      
      await setDoc(mergeRequestRef, {
        ...mergeRequest,
        userAccepted: true,
        userAcceptedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error accepting merge:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * User declines the username change
   */
  static async userDeclinesMerge(mergeRequestId, uid, reason = '') {
    try {
      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);
      
      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }
      
      const mergeRequest = mergeRequestDoc.data();
      
      if (mergeRequest.uid !== uid) {
        return { success: false, error: 'This merge request is not for this user' };
      }
      
      await setDoc(mergeRequestRef, {
        ...mergeRequest,
        status: 'cancelled',
        userAccepted: false,
        userDeclinedAt: serverTimestamp(),
        userDeclineReason: reason,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error declining merge:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================================================
  // NOTIFICATIONS
  // ==========================================================================
  
  /**
   * Mark user as notified about the pending merge
   */
  static async markUserNotified(mergeRequestId, notificationMethod = 'email') {
    try {
      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      
      await setDoc(mergeRequestRef, {
        userNotified: true,
        userNotifiedAt: serverTimestamp(),
        notificationMethod,
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error('Error marking user notified:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get pending merge request for a user (for showing in their UI)
   */
  static async getPendingMergeForUser(uid) {
    try {
      const mergeRequestsRef = collection(db, 'merge_requests');
      const q = query(
        mergeRequestsRef, 
        where('uid', '==', uid),
        where('status', 'in', ['pending', 'approved']),
        where('requireUserAcceptance', '==', true),
        where('userAccepted', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { hasPending: false };
      }
      
      return {
        hasPending: true,
        mergeRequest: snapshot.docs[0].data()
      };
    } catch (error) {
      console.error('Error getting pending merge for user:', error);
      return { hasPending: false, error: error.message };
    }
  }
  
  // ==========================================================================
  // AUDIT & HISTORY
  // ==========================================================================
  
  /**
   * Get username change history for a user
   */
  static async getUsernameChangeHistory(uid) {
    try {
      const auditRef = collection(db, 'username_change_audit');
      const q = query(auditRef, where('uid', '==', uid));
      const snapshot = await getDocs(q);
      
      const history = snapshot.docs.map(doc => doc.data());
      history.sort((a, b) => b.changedAt - a.changedAt);
      
      return {
        success: true,
        history,
        totalChanges: history.length
      };
    } catch (error) {
      console.error('Error getting username change history:', error);
      return {
        success: false,
        error: error.message,
        history: []
      };
    }
  }
  
  /**
   * Get all username changes (for admin audit)
   */
  static async getAllUsernameChanges(filters = {}) {
    try {
      const auditRef = collection(db, 'username_change_audit');
      let q = auditRef;
      
      if (filters.changeType) {
        q = query(auditRef, where('changeType', '==', filters.changeType));
      }
      
      const snapshot = await getDocs(q);
      const changes = snapshot.docs.map(doc => doc.data());
      changes.sort((a, b) => b.changedAt - a.changedAt);
      
      return {
        success: true,
        changes,
        total: changes.length
      };
    } catch (error) {
      console.error('Error getting all username changes:', error);
      return {
        success: false,
        error: error.message,
        changes: []
      };
    }
  }
  
  // ==========================================================================
  // STATISTICS
  // ==========================================================================
  
  /**
   * Get VIP merge statistics
   */
  static async getMergeStatistics() {
    try {
      const mergeRequestsRef = collection(db, 'merge_requests');
      const snapshot = await getDocs(mergeRequestsRef);
      
      const requests = snapshot.docs.map(doc => doc.data());
      
      const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        completed: requests.filter(r => r.status === 'completed').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length,
        awaitingUserAcceptance: requests.filter(r => 
          r.requireUserAcceptance && !r.userAccepted && 
          (r.status === 'pending' || r.status === 'approved')
        ).length,
      };
      
      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error getting merge statistics:', error);
      return {
        success: false,
        error: error.message,
        stats: {}
      };
    }
  }
}

export default VIPAccountManager;

