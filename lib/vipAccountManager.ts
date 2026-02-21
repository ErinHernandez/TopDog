/**
 * VIP Account Manager
 *
 * Handles VIP-specific account operations including:
 * - Merging existing accounts with reserved VIP usernames
 * - Finding potential VIP matches among existing users
 * - Username migration with full audit trail
 * - Notification to users about username changes
 */

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
  limit,
  startAfter,
  orderBy,
  type DocumentData,
  type Timestamp,
  type Query,
  type CollectionReference,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { createScopedLogger } from './clientLogger';
import { db } from './firebase';
import { toMillis } from './firebaseTimestamp';

// Note: 'in' operator is used inline in queries via where clause with array syntax
import {
  checkVIPReservation,
  claimVIPUsername,
  getAllVIPReservations,
  sanitizeUsername,
  type VIPReservation,
  type VIPReservationCheckResult,
  type VIPReservationFilters,
} from './usernameValidation';
import { UserRegistrationService, type GetUserProfileResult } from './userRegistration';

const logger = createScopedLogger('[VIPAccountManager]');

// ============================================================================
// TYPES
// ============================================================================

export type MergeRequestStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
export type ChangeType = 'vip_merge' | 'user_request' | 'admin_override';

export interface MergeRequest {
  id: string;
  uid: string;
  currentUsername: string;
  reservedUsername: string;
  reservedFor: string;
  status: MergeRequestStatus;
  requestedBy: string;
  requestedAt: Date | Timestamp;
  approvedBy: string | null;
  approvedAt: Date | Timestamp | null;
  completedAt: Date | Timestamp | null;
  completedBy?: string;
  rejectedReason: string | null;
  rejectedBy?: string;
  rejectedAt?: Date | Timestamp;
  notes: string;
  requireUserAcceptance: boolean;
  userNotified: boolean;
  userAccepted: boolean;
  userAcceptedAt?: Date | Timestamp;
  userDeclinedAt?: Date | Timestamp;
  userDeclineReason?: string;
  userNotifiedAt?: Date | Timestamp;
  notificationMethod?: string;
}

export interface UsernameChangeAudit {
  id: string;
  uid: string;
  oldUsername: string;
  newUsername: string;
  changeType: ChangeType;
  changedBy: string;
  changedAt: Date | Timestamp;
  reason: string;
  mergeRequestId?: string;
  metadata?: {
    reservedFor?: string;
    requestedBy?: string;
    requestedAt?: Date | Timestamp;
    [key: string]: unknown;
  };
}

export interface SearchCriteria {
  email?: string;
  displayNameContains?: string;
  usernameContains?: string;
}

export interface VIPMatch {
  uid?: string;
  username?: string;
  displayName?: string;
  email?: string;
  matchReason: string;
  matchConfidence: 'high' | 'medium' | 'low';
  [key: string]: unknown;
}

export interface FindVIPMatchesResult {
  success: boolean;
  error?: string;
  matches: VIPMatch[];
  reservation?: VIPReservation;
  totalFound?: number;
}

export interface UnclaimedVIPWithMatches {
  reservation: VIPReservation;
  potentialMatches: VIPMatch[];
  matchCount: number;
}

export interface GetUnclaimedVIPsResult {
  success: boolean;
  error?: string;
  results: UnclaimedVIPWithMatches[];
  totalUnclaimed?: number;
  withMatches?: number;
}

export interface CreateMergeRequestParams {
  uid: string;
  reservedUsername: string;
  requestedBy: string;
  notes?: string;
  requireUserAcceptance?: boolean;
}

export interface CreateMergeRequestResult {
  success: boolean;
  mergeRequest?: MergeRequest;
  error?: string;
  existingRequest?: MergeRequest;
}

export interface GetMergeRequestOptions {
  activeOnly?: boolean;
  statuses?: MergeRequestStatus[];
}

export interface GetAllMergeRequestsFilters {
  status?: MergeRequestStatus;
}

export interface GetAllMergeRequestsResult {
  success: boolean;
  requests: MergeRequest[];
  total: number;
  error?: string;
}

export interface ApproveMergeRequestResult {
  success: boolean;
  error?: string;
}

export interface RejectMergeRequestResult {
  success: boolean;
  error?: string;
}

export interface ExecuteMergeResult {
  success: boolean;
  audit?: UsernameChangeAudit;
  oldUsername?: string;
  newUsername?: string;
  error?: string;
}

export interface QuickMergeParams {
  uid: string;
  reservedUsername: string;
  adminId: string;
  notes?: string;
}

export interface UserAcceptsMergeResult {
  success: boolean;
  error?: string;
}

export interface UserDeclinesMergeResult {
  success: boolean;
  error?: string;
}

export interface MarkUserNotifiedResult {
  success: boolean;
  error?: string;
}

export interface GetPendingMergeResult {
  hasPending: boolean;
  mergeRequest?: MergeRequest;
  error?: string;
}

export interface GetUsernameChangeHistoryResult {
  success: boolean;
  history: UsernameChangeAudit[];
  totalChanges: number;
  error?: string;
}

export interface GetAllUsernameChangesFilters {
  changeType?: ChangeType;
}

export interface GetAllUsernameChangesResult {
  success: boolean;
  changes: UsernameChangeAudit[];
  total: number;
  error?: string;
}

export interface MergeStatistics {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  cancelled: number;
  awaitingUserAcceptance: number;
}

export interface GetMergeStatisticsResult {
  success: boolean;
  stats: MergeStatistics;
  error?: string;
}

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
   */
  static async findPotentialVIPMatches(
    reservedUsername: string,
    searchCriteria: SearchCriteria = {},
  ): Promise<FindVIPMatchesResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const normalizedReserved = reservedUsername.toLowerCase().trim();

      // Get the VIP reservation
      const vipCheck = await checkVIPReservation(normalizedReserved);
      if (!vipCheck.isReserved) {
        return {
          success: false,
          error: 'No VIP reservation found for this username',
          matches: [],
        };
      }

      if (vipCheck.reservation?.claimed) {
        return {
          success: false,
          error: 'This VIP username has already been claimed',
          matches: [],
          reservation: vipCheck.reservation,
        };
      }

      const matches: VIPMatch[] = [];
      const usersRef = collection(db, 'users');

      // Search by email if provided (limit to 10 - email should be unique)
      if (searchCriteria.email) {
        const emailQuery = query(
          usersRef,
          where('email', '==', searchCriteria.email.toLowerCase()),
          limit(10),
        );
        const emailResults = await getDocs(emailQuery);
        emailResults.forEach(doc => {
          matches.push({
            ...doc.data(),
            matchReason: 'email_match',
            matchConfidence: 'high',
          } as VIPMatch);
        });
      }

      // Search by partial username match
      // NOTE: This performs a client-side filter. For production scale, consider
      // using Firestore full-text search extensions or Algolia
      if (searchCriteria.usernameContains) {
        const searchTerm = searchCriteria.usernameContains.toUpperCase();
        const MAX_USERS_TO_SCAN = 1000; // Limit to prevent runaway queries

        // Paginate through users in batches
        let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let scannedCount = 0;

        while (scannedCount < MAX_USERS_TO_SCAN) {
          const batchSize = Math.min(500, MAX_USERS_TO_SCAN - scannedCount);
          let batchQuery = query(usersRef, orderBy('uid'), limit(batchSize));
          if (lastDoc) {
            batchQuery = query(usersRef, orderBy('uid'), startAfter(lastDoc), limit(batchSize));
          }

          const batch = await getDocs(batchQuery);
          if (batch.empty) break;

          batch.forEach(doc => {
            const userData = doc.data();
            if (
              userData.username &&
              userData.username.includes(searchTerm) &&
              !matches.find(m => m.uid === userData.uid)
            ) {
              matches.push({
                ...userData,
                matchReason: 'username_partial_match',
                matchConfidence: 'medium',
              } as VIPMatch);
            }
          });

          lastDoc = batch.docs[batch.docs.length - 1] || null;
          scannedCount += batch.size;

          if (batch.size < batchSize) break; // No more documents
        }
      }

      // Search by display name
      // NOTE: This performs a client-side filter. For production scale, consider
      // using Firestore full-text search extensions or Algolia
      if (searchCriteria.displayNameContains) {
        const searchTerm = searchCriteria.displayNameContains.toLowerCase();
        const MAX_USERS_TO_SCAN = 1000; // Limit to prevent runaway queries

        // Paginate through users in batches
        let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        let scannedCount = 0;

        while (scannedCount < MAX_USERS_TO_SCAN) {
          const batchSize = Math.min(500, MAX_USERS_TO_SCAN - scannedCount);
          let batchQuery = query(usersRef, orderBy('uid'), limit(batchSize));
          if (lastDoc) {
            batchQuery = query(usersRef, orderBy('uid'), startAfter(lastDoc), limit(batchSize));
          }

          const batch = await getDocs(batchQuery);
          if (batch.empty) break;

          batch.forEach(doc => {
            const userData = doc.data();
            if (
              userData.displayName &&
              userData.displayName.toLowerCase().includes(searchTerm) &&
              !matches.find(m => m.uid === userData.uid)
            ) {
              matches.push({
                ...userData,
                matchReason: 'display_name_match',
                matchConfidence: 'medium',
              } as VIPMatch);
            }
          });

          lastDoc = batch.docs[batch.docs.length - 1] || null;
          scannedCount += batch.size;

          if (batch.size < batchSize) break; // No more documents
        }
      }

      return {
        success: true,
        matches,
        reservation: vipCheck.reservation,
        totalFound: matches.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error finding VIP matches',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return {
        success: false,
        error: errorMessage,
        matches: [],
      };
    }
  }

  /**
   * Get all unclaimed VIP reservations with potential user matches
   * Useful for admin dashboard to review pending VIP assignments
   * Uses batch queries with 'in' operator to avoid N+1 patterns
   */
  static async getUnclaimedVIPsWithMatches(): Promise<GetUnclaimedVIPsResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const filters: VIPReservationFilters = { unclaimedOnly: true };
      const unclaimed = await getAllVIPReservations(filters);
      const results: UnclaimedVIPWithMatches[] = [];

      // Step 1: Collect all unique name parts from all reservations
      const allNameParts = new Set<string>();
      for (const reservation of unclaimed) {
        const nameParts = reservation.reservedFor.split(/[-\s]+/);
        nameParts.forEach(part => {
          if (part.length >= 3) {
            allNameParts.add(part.toUpperCase());
          }
        });
      }

      // Step 2: Batch query all users matching any name part
      const allMatches = new Map<string, VIPMatch>(); // uid -> VIPMatch
      const usersRef = collection(db, 'users');

      if (allNameParts.size > 0) {
        // Process name parts in chunks of 30 (Firestore 'in' operator limit)
        const namePartsArray = Array.from(allNameParts);
        for (let i = 0; i < namePartsArray.length; i += 30) {
          const chunk = namePartsArray.slice(i, i + 30)!;

          // Query for users with username containing any of these parts
          const usernameQuery = query(
            usersRef,
            where('username', '>=', chunk[0]!.toUpperCase()),
            limit(1000),
          );
          const usernameResults = await getDocs(usernameQuery);

          usernameResults.forEach(doc => {
            const userData = doc.data();
            const username = userData.username?.toUpperCase() || '';

            // Client-side filter: check if username contains any name part
            for (const part of chunk) {
              if (username.includes(part)) {
                if (!allMatches.has(userData.uid)) {
                  allMatches.set(userData.uid, {
                    ...userData,
                    matchReason: 'username_partial_match',
                    matchConfidence: 'medium',
                  } as VIPMatch);
                }
                break;
              }
            }
          });

          // Query for users with display name containing any of these parts
          const displayNameQuery = query(usersRef, limit(1000));
          const displayNameResults = await getDocs(displayNameQuery);

          displayNameResults.forEach(doc => {
            const userData = doc.data();
            const displayName = userData.displayName?.toLowerCase() || '';

            // Client-side filter: check if display name contains any name part
            for (const part of chunk) {
              if (displayName.includes(part.toLowerCase())) {
                if (!allMatches.has(userData.uid)) {
                  allMatches.set(userData.uid, {
                    ...userData,
                    matchReason: 'display_name_match',
                    matchConfidence: 'medium',
                  } as VIPMatch);
                }
                break;
              }
            }
          });
        }
      }

      // Step 3: Match results in memory to reservations
      for (const reservation of unclaimed) {
        const nameParts = reservation.reservedFor.split(/[-\s]+/).map(p => p.toUpperCase());
        const potentialMatches: VIPMatch[] = [];

        // Find all matches that contain any of this reservation's name parts
        for (const [uid, match] of allMatches) {
          const username = match.username?.toUpperCase() ?? '';
          const displayName = match.displayName?.toLowerCase() ?? '';

          let isMatch = false;
          for (const part of nameParts) {
            if (username.includes(part) || displayName.includes(part.toLowerCase())) {
              isMatch = true;
              break;
            }
          }

          if (isMatch && !potentialMatches.find(m => m.uid === uid)) {
            potentialMatches.push(match);
          }
        }

        results.push({
          reservation,
          potentialMatches,
          matchCount: potentialMatches.length,
        });
      }

      return {
        success: true,
        results,
        totalUnclaimed: unclaimed.length,
        withMatches: results.filter(r => r.matchCount > 0).length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error getting unclaimed VIPs with matches',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return {
        success: false,
        error: errorMessage,
        results: [],
      };
    }
  }

  // ==========================================================================
  // MERGE REQUESTS
  // ==========================================================================

  /**
   * Create a merge request to assign a VIP username to an existing user
   */
  static async createMergeRequest({
    uid,
    reservedUsername,
    requestedBy,
    notes = '',
    requireUserAcceptance = false,
  }: CreateMergeRequestParams): Promise<CreateMergeRequestResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const normalizedReserved = reservedUsername.toLowerCase().trim();

      // Validate VIP reservation exists and is unclaimed
      const vipCheck = await checkVIPReservation(normalizedReserved);
      if (!vipCheck.isReserved) {
        return { success: false, error: 'No VIP reservation found for this username' };
      }
      if (vipCheck.reservation?.claimed) {
        return { success: false, error: 'This VIP username has already been claimed' };
      }

      // Get user's current profile
      const userResult: GetUserProfileResult = await UserRegistrationService.getUserProfile(uid);
      if (!userResult.success || !userResult.userProfile) {
        return { success: false, error: 'User not found' };
      }

      const currentUsername = userResult.userProfile.username;

      // Check for existing active merge request (pending or approved)
      const existingRequest = await this.getMergeRequestByUid(uid, { activeOnly: true });
      if (existingRequest) {
        const statusMessage =
          existingRequest.status === 'approved'
            ? 'User already has an approved merge request awaiting acceptance'
            : 'User already has a pending merge request';
        return {
          success: false,
          error: statusMessage,
          existingRequest,
        };
      }

      // Create merge request
      const mergeRequestId = `merge_${uid}_${Date.now()}`;
      const mergeRequest: MergeRequest = {
        id: mergeRequestId,
        uid,
        currentUsername,
        reservedUsername: normalizedReserved,
        reservedFor: vipCheck.reservation?.reservedFor || '',
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

      logger.info('Merge request created', { mergeRequestId });

      return {
        success: true,
        mergeRequest,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error creating merge request',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get merge request by user UID
   */
  static async getMergeRequestByUid(
    uid: string,
    options: GetMergeRequestOptions = {},
  ): Promise<MergeRequest | null> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const { activeOnly = true, statuses } = options;
      const mergeRequestsRef = collection(db, 'merge_requests');

      // Determine which statuses to query
      // Terminal states: 'completed', 'rejected', 'cancelled'
      // Active states: 'pending', 'approved'
      let statusFilter: MergeRequestStatus[] | null = null;
      if (statuses && statuses.length > 0) {
        statusFilter = statuses;
      } else if (activeOnly) {
        // Include both pending and approved to prevent duplicate requests
        statusFilter = ['pending', 'approved'];
      }

      let q;
      if (statusFilter) {
        q = query(mergeRequestsRef, where('uid', '==', uid), where('status', 'in', statusFilter));
      } else {
        q = query(mergeRequestsRef, where('uid', '==', uid), limit(100));
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0]!.data() as MergeRequest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error getting merge request',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return null;
    }
  }

  /**
   * Get all merge requests with optional filters
   */
  static async getAllMergeRequests(
    filters: GetAllMergeRequestsFilters = {},
  ): Promise<GetAllMergeRequestsResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const mergeRequestsRef = collection(db, 'merge_requests');
      let q: Query | CollectionReference = mergeRequestsRef;

      if (filters.status) {
        q = query(mergeRequestsRef, where('status', '==', filters.status), limit(500));
      } else {
        q = query(mergeRequestsRef, limit(500));
      }

      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => doc.data() as MergeRequest);

      return {
        success: true,
        requests,
        total: requests.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error getting merge requests',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return {
        success: false,
        error: errorMessage,
        requests: [],
        total: 0,
      };
    }
  }

  /**
   * Approve a merge request (if different admin than requester)
   */
  static async approveMergeRequest(
    mergeRequestId: string,
    approvedBy: string,
  ): Promise<ApproveMergeRequestResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);

      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }

      const mergeRequest = mergeRequestDoc.data() as MergeRequest;

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error approving merge request',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Reject a merge request
   */
  static async rejectMergeRequest(
    mergeRequestId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<RejectMergeRequestResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);

      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }

      const mergeRequest = mergeRequestDoc.data() as MergeRequest;

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error rejecting merge request',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return { success: false, error: errorMessage };
    }
  }

  // ==========================================================================
  // EXECUTE MERGE
  // ==========================================================================

  /**
   * Execute the username merge - this is the main function that changes the username
   */
  static async executeMerge(
    mergeRequestId: string,
    executedBy: string,
  ): Promise<ExecuteMergeResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      // Get merge request
      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);

      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }

      const mergeRequest = mergeRequestDoc.data() as MergeRequest;

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
      const auditRecord: UsernameChangeAudit = {
        id: auditId,
        uid,
        oldUsername: currentUsername,
        newUsername: reservedUsername,
        changeType: 'vip_merge',
        changedBy: executedBy,
        changedAt: serverTimestamp() as unknown as Timestamp,
        reason: `VIP merge: ${mergeRequest.reservedFor}`,
        mergeRequestId,
        metadata: {
          reservedFor: mergeRequest.reservedFor,
          requestedBy: mergeRequest.requestedBy,
          requestedAt: mergeRequest.requestedAt,
        },
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

      logger.info('VIP merge completed', {
        oldUsername: currentUsername,
        newUsername: reservedUsername,
        uid,
      });

      return {
        success: true,
        audit: {
          ...auditRecord,
          changedAt: new Date(),
        },
        oldUsername: currentUsername,
        newUsername: reservedUsername,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error executing merge',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Quick merge - create and immediately execute a merge (for admin convenience)
   * Use with caution - bypasses approval workflow
   */
  static async quickMerge({
    uid,
    reservedUsername,
    adminId,
    notes = '',
  }: QuickMergeParams): Promise<ExecuteMergeResult> {
    // Create the merge request
    const createResult = await this.createMergeRequest({
      uid,
      reservedUsername,
      requestedBy: adminId,
      notes: `Quick merge: ${notes}`,
      requireUserAcceptance: false,
    });

    if (!createResult.success || !createResult.mergeRequest) {
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
  static async userAcceptsMerge(
    mergeRequestId: string,
    uid: string,
  ): Promise<UserAcceptsMergeResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);

      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }

      const mergeRequest = mergeRequestDoc.data() as MergeRequest;

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error accepting merge',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * User declines the username change
   */
  static async userDeclinesMerge(
    mergeRequestId: string,
    uid: string,
    reason: string = '',
  ): Promise<UserDeclinesMergeResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);
      const mergeRequestDoc = await getDoc(mergeRequestRef);

      if (!mergeRequestDoc.exists()) {
        return { success: false, error: 'Merge request not found' };
      }

      const mergeRequest = mergeRequestDoc.data() as MergeRequest;

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error declining merge',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return { success: false, error: errorMessage };
    }
  }

  // ==========================================================================
  // NOTIFICATIONS
  // ==========================================================================

  /**
   * Mark user as notified about the pending merge
   */
  static async markUserNotified(
    mergeRequestId: string,
    notificationMethod: string = 'email',
  ): Promise<MarkUserNotifiedResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const mergeRequestRef = doc(db, 'merge_requests', mergeRequestId);

      await setDoc(
        mergeRequestRef,
        {
          userNotified: true,
          userNotifiedAt: serverTimestamp(),
          notificationMethod,
        },
        { merge: true },
      );

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error marking user notified',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get pending merge request for a user (for showing in their UI)
   */
  static async getPendingMergeForUser(uid: string): Promise<GetPendingMergeResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const mergeRequestsRef = collection(db, 'merge_requests');
      const q = query(
        mergeRequestsRef,
        where('uid', '==', uid),
        where('status', 'in', ['pending', 'approved']),
        where('requireUserAcceptance', '==', true),
        where('userAccepted', '==', false),
        limit(10), // Should only have one pending at a time
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { hasPending: false };
      }

      return {
        hasPending: true,
        mergeRequest: snapshot.docs[0]!.data() as MergeRequest,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error getting pending merge for user',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return { hasPending: false, error: errorMessage };
    }
  }

  // ==========================================================================
  // AUDIT & HISTORY
  // ==========================================================================

  /**
   * Get username change history for a user
   */
  static async getUsernameChangeHistory(uid: string): Promise<GetUsernameChangeHistoryResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const auditRef = collection(db, 'username_change_audit');
      const q = query(auditRef, where('uid', '==', uid), limit(100));
      const snapshot = await getDocs(q);

      const history = snapshot.docs.map(doc => doc.data() as UsernameChangeAudit);
      history.sort((a, b) => {
        const aTime = toMillis(a.changedAt);
        const bTime = toMillis(b.changedAt);
        return bTime - aTime;
      });

      return {
        success: true,
        history,
        totalChanges: history.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error getting username change history',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return {
        success: false,
        error: errorMessage,
        history: [],
        totalChanges: 0,
      };
    }
  }

  /**
   * Get all username changes (for admin audit)
   */
  static async getAllUsernameChanges(
    filters: GetAllUsernameChangesFilters = {},
  ): Promise<GetAllUsernameChangesResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const auditRef = collection(db, 'username_change_audit');
      let q: Query | CollectionReference = auditRef;

      if (filters.changeType) {
        q = query(auditRef, where('changeType', '==', filters.changeType), limit(500));
      } else {
        q = query(auditRef, limit(500));
      }

      const snapshot = await getDocs(q);
      const changes = snapshot.docs.map(doc => doc.data() as UsernameChangeAudit);
      changes.sort((a, b) => {
        const aTime = toMillis(a.changedAt);
        const bTime = toMillis(b.changedAt);
        return bTime - aTime;
      });

      return {
        success: true,
        changes,
        total: changes.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error getting all username changes',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return {
        success: false,
        error: errorMessage,
        changes: [],
        total: 0,
      };
    }
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get VIP merge statistics
   */
  static async getMergeStatistics(): Promise<GetMergeStatisticsResult> {
    try {
      if (!db) {
        throw new Error('Firebase db not initialized');
      }

      const mergeRequestsRef = collection(db, 'merge_requests');
      // Limit statistics query - for exact counts, use Firestore aggregation queries
      const snapshot = await getDocs(query(mergeRequestsRef, limit(500)));

      const requests = snapshot.docs.map(doc => doc.data() as MergeRequest);

      const stats: MergeStatistics = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        completed: requests.filter(r => r.status === 'completed').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length,
        awaitingUserAcceptance: requests.filter(
          r =>
            r.requireUserAcceptance &&
            !r.userAccepted &&
            (r.status === 'pending' || r.status === 'approved'),
        ).length,
      };

      return {
        success: true,
        stats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        'Error getting merge statistics',
        error instanceof Error ? error : new Error(errorMessage),
      );
      return {
        success: false,
        error: errorMessage,
        stats: {
          total: 0,
          pending: 0,
          approved: 0,
          completed: 0,
          rejected: 0,
          cancelled: 0,
          awaitingUserAcceptance: 0,
        },
      };
    }
  }
}

export default VIPAccountManager;
