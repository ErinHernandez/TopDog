/**
 * Firestore Triggers for Draft Alerts
 * 
 * CRITICAL: These triggers fire automatically when draft documents change.
 * This ensures notifications are sent even if the triggering user goes offline.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const logger = functions.logger;

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Participant data structure from draft document
 */
interface DraftParticipant {
  userId?: string;
  id?: string;
}

/**
 * Draft document data structure
 */
interface DraftData {
  name?: string;
  status?: string;
  currentPicker?: string | DraftParticipant;
  currentPickNumber?: number;
  draftOrder?: (string | DraftParticipant)[];
  participants?: (string | DraftParticipant)[];
  settings?: {
    maxParticipants?: number;
  };
  maxParticipants?: number;
}

/**
 * Trigger when a draft document is updated
 * 
 * This fires automatically whenever the draft document changes,
 * regardless of whether the triggering user is online or not.
 */
export const onDraftUpdate = functions.firestore
  .document('drafts/{draftId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    const draftId = context.params.draftId;

    logger.info(`[DraftTrigger] Draft ${draftId} updated`);

    // 1. Check for "On The Clock" Change
    // Detect when currentPicker changes (user's turn starts)
    const newCurrentPicker = getCurrentPicker(newData);
    const oldCurrentPicker = getCurrentPicker(previousData);

    if (newCurrentPicker && newCurrentPicker !== oldCurrentPicker) {
      logger.info(`[DraftTrigger] New picker: ${newCurrentPicker}`);
      await sendPushToUser(newCurrentPicker, {
        title: 'You are on the clock!',
        body: `It's your turn in ${newData.name || 'the draft'}`,
        type: 'on_the_clock',
        roomId: draftId,
        draftName: newData.name,
      });
    }

    // 2. Check for "Draft Started"
    if (newData.status === 'active' && previousData.status === 'waiting') {
      logger.info(`[DraftTrigger] Draft ${draftId} started`);
      
      // Send to all participants
      const participants = (newData as DraftData).participants || [];
      const userIds = participants.map((p: string | DraftParticipant) =>
        typeof p === 'string' ? p : p.userId || p.id
      ).filter(Boolean) as string[];

      await Promise.all(
        userIds.map((userId: string) =>
          sendPushToUser(userId, {
            title: 'Draft Starting!',
            body: `The draft "${newData.name || 'room'}" is now active`,
            type: 'draft_starting',
            roomId: draftId,
            draftName: newData.name,
          })
        )
      );
    }

    // 3. Check for "Room Filled"
    const draftDataTyped = newData as DraftData;
    const maxParticipants = draftDataTyped.settings?.maxParticipants || draftDataTyped.maxParticipants || 12;
    const newParticipantCount = (draftDataTyped.participants || []).length;
    const oldParticipantCount = ((previousData as DraftData).participants || []).length;

    if (
      newParticipantCount === maxParticipants &&
      oldParticipantCount < maxParticipants
    ) {
      logger.info(`[DraftTrigger] Room ${draftId} filled`);

      // Send to all participants
      const participants = draftDataTyped.participants || [];
      const userIds = participants.map((p: string | DraftParticipant) =>
        typeof p === 'string' ? p : p.userId || p.id
      ).filter(Boolean) as string[];

      await Promise.all(
        userIds.map((userId: string) =>
          sendPushToUser(userId, {
            title: 'Draft Room Filled!',
            body: `The draft "${newData.name || 'room'}" is full and will start soon`,
            type: 'room_filled',
            roomId: draftId,
            draftName: newData.name,
          })
        )
      );
    }

    // 4. Check for "Two Picks Away"
    // This requires calculating picksUntilMyTurn for each participant
    // Implementation depends on your draft order logic
    // For now, we'll handle this in a separate trigger or calculate in the function

    // 5. Check for "10 Seconds Remaining"
    // This requires timer state in the draft document
    // If you store timerSeconds in Firestore, check here
    // Otherwise, handle client-side only
  });

/**
 * Get current picker from draft data
 * 
 * Adapt this to match your actual draft document structure
 */
function getCurrentPicker(draftData: DraftData): string | null {
  // Option 1: If you store currentPicker directly
  if (draftData.currentPicker) {
    return typeof draftData.currentPicker === 'string'
      ? draftData.currentPicker
      : draftData.currentPicker.userId || draftData.currentPicker.id;
  }

  // Option 2: If you calculate from currentPickNumber and draftOrder
  if (draftData.currentPickNumber && draftData.draftOrder) {
    const pickIndex = (draftData.currentPickNumber - 1) % draftData.draftOrder.length;
    const pickerId = draftData.draftOrder[pickIndex];
    return typeof pickerId === 'string' ? pickerId : pickerId?.userId || pickerId?.id;
  }

  // Option 3: If you use participants array with order
  if (draftData.currentPickNumber && draftData.participants) {
    const pickIndex = (draftData.currentPickNumber - 1) % draftData.participants.length;
    const participant = draftData.participants[pickIndex];
    return typeof participant === 'string'
      ? participant
      : participant?.userId || participant?.id;
  }

  return null;
}

/**
 * Helper function to send push notification to a user
 */
async function sendPushToUser(
  userId: string,
  payload: {
    title: string;
    body: string;
    type: string;
    roomId: string;
    draftName?: string;
  }
): Promise<void> {
  try {
    // Get user's FCM token and preferences
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    
    if (!userDoc.exists) {
      logger.warn(`[DraftTrigger] User ${userId} not found`);
      return;
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;
    const fcmEnabled = userData?.fcmEnabled !== false; // Default to true
    const preferences = userData?.preferences?.draftAlerts || {};

    // Check if FCM is enabled
    if (!fcmEnabled || !fcmToken) {
      logger.info(`[DraftTrigger] FCM disabled or no token for user ${userId}`);
      return;
    }

    // Check user preferences for this alert type
    const alertPreferenceKey = getAlertPreferenceKey(payload.type);
    if (preferences[alertPreferenceKey] === false) {
      logger.info(`[DraftTrigger] Alert ${payload.type} disabled for user ${userId}`);
      return;
    }

    // Build FCM message
    const fcmMessage: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        roomId: payload.roomId,
        url: `/draft/topdog/${payload.roomId}`,
        draftName: payload.draftName || '',
        timestamp: Date.now().toString(),
      },
      // iOS-specific (APNs)
      apns: {
        payload: {
          aps: {
            sound: payload.type === 'on_the_clock' ? 'default' : undefined,
            badge: 1,
            'content-available': 1,
          },
        },
      },
      // Web/Android-specific
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          requireInteraction: payload.type === 'on_the_clock',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: `/draft/topdog/${payload.roomId}`,
        },
      },
      android: {
        priority: 'high',
        notification: {
          sound: payload.type === 'on_the_clock' ? 'default' : undefined,
          channelId: 'draft_alerts',
        },
      },
    };

    // Send push notification
    const response = await admin.messaging().send(fcmMessage);
    logger.info(`[DraftTrigger] ✅ Push sent to ${userId}: ${response}`);
  } catch (error: unknown) {
    logger.error(`[DraftTrigger] ❌ Failed to send to ${userId}:`, error);

    // Handle invalid token cleanup
    const fcmError = error as { code?: string };
    if (
      fcmError.code === 'messaging/invalid-registration-token' ||
      fcmError.code === 'messaging/registration-token-not-registered'
    ) {
      logger.info(`[DraftTrigger] Removing invalid token for user ${userId}`);
      await admin.firestore().doc(`users/${userId}`).update({
        fcmToken: admin.firestore.FieldValue.delete(),
        fcmEnabled: false,
      });
    }
  }
}

/**
 * Map alert type to preference key
 */
function getAlertPreferenceKey(alertType: string): string {
  const mapping: Record<string, string> = {
    room_filled: 'roomFilled',
    draft_starting: 'draftStarting',
    two_picks_away: 'twoPicksAway',
    on_the_clock: 'onTheClock',
    ten_seconds_remaining: 'tenSecondsRemaining',
  };
  return mapping[alertType] || alertType;
}
