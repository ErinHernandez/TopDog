/**
 * Notification Repository
 *
 * Typed repository for notifications collection
 */

import { where, orderBy, Timestamp } from 'firebase/firestore';

import { getFirebaseAdapter } from '@/lib/firebase/firebaseAdapter';

import { BaseRepository } from './baseRepository';

/**
 * Notification document type
 */
export interface FirestoreNotification {
  id: string;
  userId: string;
  type: 'draft' | 'tournament' | 'transaction' | 'system' | 'alert';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp | Date;
  readAt?: Timestamp | Date;
}

/**
 * Repository for notification documents (/notifications/{notificationId})
 */
class NotificationRepository extends BaseRepository<FirestoreNotification> {
  constructor() {
    super('notifications', getFirebaseAdapter());
  }

  /**
   * Get a notification by ID
   */
  async getById(notificationId: string): Promise<FirestoreNotification | null> {
    return this.get(notificationId);
  }

  /**
   * Get unread notifications for a user
   */
  async getUnread(userId: string): Promise<FirestoreNotification[]> {
    return this.query(
      [
        where('userId', '==', userId),
        where('read', '==', false),
      ],
      {
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: 50,
      }
    );
  }

  /**
   * Get all notifications for a user
   */
  async getByUser(userId: string, limit: number = 100): Promise<FirestoreNotification[]> {
    return this.queryWhere('userId', '==', userId, {
      orderByField: 'createdAt',
      orderDirection: 'desc',
      limitCount: limit,
    });
  }

  /**
   * Get notifications by type
   */
  async getByType(userId: string, type: string): Promise<FirestoreNotification[]> {
    return this.query(
      [
        where('userId', '==', userId),
        where('type', '==', type),
      ],
      {
        orderByField: 'createdAt',
        orderDirection: 'desc',
      }
    );
  }

  /**
   * Create a new notification
   */
  async createNotification(data: Omit<FirestoreNotification, 'id'>): Promise<string> {
    return this.create(data as FirestoreNotification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.update(notificationId, {
      read: true,
      readAt: new Date(),
    } as Partial<FirestoreNotification>);
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const unread = await this.getUnread(userId);

    if (unread.length > 0) {
      const operations = unread.map(notif => ({
        type: 'update' as const,
        collection: 'notifications',
        docId: notif.id,
        data: {
          read: true,
          readAt: new Date(),
        },
      }));

      // Use batch write from adapter
      await this.getAdapter().batchWrite(operations);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.delete(notificationId);
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const notifications = await this.getByUser(userId, 1000);

    if (notifications.length > 0) {
      const operations = notifications.map(notif => ({
        type: 'delete' as const,
        collection: 'notifications',
        docId: notif.id,
      }));

      // Use batch write from adapter
      await this.getAdapter().batchWrite(operations);
    }
  }
}

// Singleton instance
let notificationRepositoryInstance: NotificationRepository | null = null;

/**
 * Get the singleton NotificationRepository instance
 */
export function getNotificationRepository(): NotificationRepository {
  if (!notificationRepositoryInstance) {
    notificationRepositoryInstance = new NotificationRepository();
  }
  return notificationRepositoryInstance;
}

// Default export
export const notificationRepository = getNotificationRepository();
