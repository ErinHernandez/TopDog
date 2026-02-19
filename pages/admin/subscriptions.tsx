import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { getServerSideProps as _getServerSideProps } from '@/lib/auth/withServerAuth';
import styles from '@/styles/subscriptions.module.css';

export const getServerSideProps = _getServerSideProps;
import type { SubscriptionOverviewStats, SubscriptionEvent } from '@/lib/studio/subscription/types';

interface SubscriptionsPageState {
  stats: SubscriptionOverviewStats | null;
  loading: boolean;
  error: string | null;
}

export default function SubscriptionsPage() {
  const { user, getIdToken } = useAuth();
  const [state, setState] = useState<SubscriptionsPageState>({
    stats: null,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      const token = await user.getIdToken(false);
      if (!token) {
        throw new Error('Failed to get auth token');
      }

      const response = await fetch('/api/studio/admin/subscriptions/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription overview: ${response.statusText}`);
      }

      const data: SubscriptionOverviewStats = await response.json();
      setState({
        stats: data,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription data';
      console.error('[SubscriptionsPage] Fetch error:', errorMessage);
      setState({
        stats: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatEventType = (type: SubscriptionEvent['type']): string => {
    const typeMap: Record<SubscriptionEvent['type'], string> = {
      created: 'Created',
      updated: 'Updated',
      canceled: 'Canceled',
      upgraded: 'Upgraded',
      downgraded: 'Downgraded',
    };
    return typeMap[type];
  };

  const getEventTypeClassName = (type: SubscriptionEvent['type']): string => {
    const classMap: Record<SubscriptionEvent['type'], string> = {
      created: styles.eventTypeCreated,
      updated: styles.eventTypeUpdated,
      canceled: styles.eventTypeCanceled,
      upgraded: styles.eventTypeUpgraded,
      downgraded: styles.eventTypeDowngraded,
    };
    return classMap[type];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute>
      <main className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Subscriptions</h1>
          <p className={styles.subtitle}>Overview of subscription tiers and recent activity</p>
        </div>

        {state.error && (
          <div className={styles.errorState}>
            {state.error}
          </div>
        )}

        {state.loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Loading subscription data...</span>
          </div>
        ) : state.stats ? (
          <>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <p className={styles.summaryCardLabel}>Total Users</p>
                <p className={styles.summaryCardValue}>{state.stats.totalUsers}</p>
              </div>

              <div className={styles.summaryCard}>
                <p className={styles.summaryCardLabel}>Pro Subscribers</p>
                <p className={styles.summaryCardValue}>{state.stats.proCount}</p>
                <p className={styles.summaryCardSubtext}>
                  {state.stats.totalUsers > 0
                    ? `${((state.stats.proCount / state.stats.totalUsers) * 100).toFixed(1)}% of users`
                    : 'No users'}
                </p>
              </div>

              <div className={styles.summaryCard}>
                <p className={styles.summaryCardLabel}>Team Subscribers</p>
                <p className={styles.summaryCardValue}>{state.stats.teamCount}</p>
                <p className={styles.summaryCardSubtext}>
                  {state.stats.totalUsers > 0
                    ? `${((state.stats.teamCount / state.stats.totalUsers) * 100).toFixed(1)}% of users`
                    : 'No users'}
                </p>
              </div>

              <div className={styles.summaryCard}>
                <p className={styles.summaryCardLabel}>Monthly Recurring Revenue</p>
                <p className={styles.summaryCardValue}>{formatCurrency(state.stats.mrr)}</p>
              </div>
            </div>

            <div className={styles.eventsSection}>
              <h2 className={styles.sectionTitle}>Recent Subscription Events</h2>

              {state.stats.recentEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyStateText}>No subscription events yet</p>
                </div>
              ) : (
                <div className={styles.eventsList}>
                  {state.stats.recentEvents.map((event) => (
                    <div key={event.id} className={styles.eventItem}>
                      <div className={`${styles.eventTypeIcon} ${getEventTypeClassName(event.type)}`}>
                        {event.type === 'created' && '+'}
                        {event.type === 'updated' && '~'}
                        {event.type === 'canceled' && 'X'}
                        {event.type === 'upgraded' && '▲'}
                        {event.type === 'downgraded' && '▼'}
                      </div>
                      <div className={styles.eventContent}>
                        <div className={styles.eventTitle}>
                          {formatEventType(event.type)}
                          {event.previousTier && event.newTier && event.previousTier !== event.newTier && (
                            <span className={styles.eventMeta}>
                              {' '}from {event.previousTier} to {event.newTier}
                            </span>
                          )}
                          {!event.previousTier && ` to ${event.newTier}`}
                        </div>
                        <div className={styles.eventMeta}>
                          User: {event.userId}
                        </div>
                      </div>
                      <div className={styles.eventTime}>{formatDate(event.timestamp)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </ProtectedRoute>
  );
}
