/**
 * Firestore Triggers for Draft Alerts
 * 
 * CRITICAL: These triggers fire automatically when draft documents change.
 * This ensures notifications are sent even if the triggering user goes offline.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
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

    console.log(`[DraftTrigger] Draft ${draftId} updated`);

    // 1. Check for "On The Clock" Change
    // Detect when currentPicker changes (user's turn starts)
    const newCurrentPicker = getCurrentPicker(newData);
    const oldCurrentPicker = getCurrentPicker(previousData);

    if (newCurrentPicker && newCurrentPicker !== oldCurrentPicker) {
      console.log(`[DraftTrigger] New picker: ${newCurrentPicker}`);
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
      console.log(`[DraftTrigger] Draft ${draftId} started`);
      
      // Send to all participants
      const participants = newData.participants || [];
      const userIds = participants.map((p: any) => 
        typeof p === 'string' ? p : p.userId || p.id
      ).filter(Boolean);

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
    const maxParticipants = newData.settings?.maxParticipants || newData.maxParticipants || 12;
    const newParticipantCount = (newData.participants || []).length;
    const oldParticipantCount = (previousData.participants || []).length;

    if (
      newParticipantCount === maxParticipants &&
      oldParticipantCount < maxParticipants
    ) {
      console.log(`[DraftTrigger] Room ${draftId} filled`);
      
      // Send to all participants
      const participants = newData.participants || [];
      const userIds = participants.map((p: any) => 
        typeof p === 'string' ? p : p.userId || p.id
      ).filter(Boolean);

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
function getCurrentPicker(draftData: any): string | null {
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
      console.warn(`[DraftTrigger] User ${userId} not found`);
      return;
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;
    const fcmEnabled = userData?.fcmEnabled !== false; // Default to true
    const preferences = userData?.preferences?.draftAlerts || {};

    // Check if FCM is enabled
    if (!fcmEnabled || !fcmToken) {
      console.log(`[DraftTrigger] FCM disabled or no token for user ${userId}`);
      return;
    }

    // Check user preferences for this alert type
    const alertPreferenceKey = getAlertPreferenceKey(payload.type);
    if (preferences[alertPreferenceKey] === false) {
      console.log(`[DraftTrigger] Alert ${payload.type} disabled for user ${userId}`);
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
    console.log(`[DraftTrigger] ✅ Push sent to ${userId}: ${response}`);
  } catch (error: any) {
    console.error(`[DraftTrigger] ❌ Failed to send to ${userId}:`, error);

    // Handle invalid token cleanup
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      console.log(`[DraftTrigger] Removing invalid token for user ${userId}`);
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
