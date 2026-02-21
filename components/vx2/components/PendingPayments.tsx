/**
 * PendingPayments - Display pending async payments (OXXO, Boleto, Pix)
 *
 * Shows user their pending payments awaiting completion:
 * - OXXO vouchers (Mexico) - pay at store
 * - Boleto bank slips (Brazil) - pay at bank
 * - Pix QR codes (Brazil) - scan to pay
 *
 * Features:
 * - Expiration countdown
 * - View voucher/QR code
 * - Cancel pending payment
 * - Refresh status
 *
 * Migrated to Zero-Runtime CSS for CSP compliance.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../lib/clientLogger';
import { formatSmallestUnit } from '../utils/formatting';

import styles from './PendingPayments.module.css';

const logger = createScopedLogger('[PendingPayments]');

// ============================================================================
// TYPES
// ============================================================================

export type PendingPaymentType = 'oxxo' | 'boleto' | 'pix';

export interface PendingPayment {
  id: string;
  type: PendingPaymentType;
  amount: number;
  currency: string;
  voucherUrl: string;
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'expired' | 'cancelled';
}

export interface PendingPaymentsProps {
  userId: string;
  onPaymentComplete?: (paymentId: string) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPaymentTypeLabel(type: PendingPaymentType): string {
  switch (type) {
    case 'oxxo':
      return 'OXXO';
    case 'boleto':
      return 'Boleto';
    case 'pix':
      return 'Pix';
    default:
      return 'Payment';
  }
}

function getPaymentTypeDescription(type: PendingPaymentType): string {
  switch (type) {
    case 'oxxo':
      return 'Pay at any OXXO store';
    case 'boleto':
      return 'Pay at bank or lottery outlet';
    case 'pix':
      return 'Scan QR code with banking app';
    default:
      return 'Complete payment';
  }
}

function getPaymentTypeIcon(type: PendingPaymentType): string {
  switch (type) {
    case 'oxxo':
      return '🏪';
    case 'boleto':
      return '🏦';
    case 'pix':
      return '📱';
    default:
      return '💳';
  }
}

function formatTimeRemaining(expiresAt: string): {
  text: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
} {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) {
    return { text: 'Expired', isExpiringSoon: false, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const isExpiringSoon = hours < 6;

  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return { text: `${days} day${days > 1 ? 's' : ''}`, isExpiringSoon: false, isExpired: false };
  }

  if (hours > 0) {
    return { text: `${hours}h ${minutes}m`, isExpiringSoon, isExpired: false };
  }

  return { text: `${minutes} min`, isExpiringSoon: true, isExpired: false };
}

// ============================================================================
// PAYMENT CARD COMPONENT
// ============================================================================

interface PaymentCardProps {
  payment: PendingPayment;
  onViewVoucher: (payment: PendingPayment) => void;
  onCancel: (paymentId: string) => void;
  isCancelling: boolean;
}

function PaymentCard({
  payment,
  onViewVoucher,
  onCancel,
  isCancelling,
}: PaymentCardProps): React.ReactElement {
  const [isMounted, setIsMounted] = useState(false);

  // Track mount state to prevent hydration mismatch with Date.now()
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use safe placeholder during SSR/initial render, then calculate after mount
  const timeInfo = isMounted
    ? formatTimeRemaining(payment.expiresAt)
    : { text: '—', isExpiringSoon: false, isExpired: false };
  const isDisabled = timeInfo.isExpired || payment.status !== 'pending';

  return (
    <div className={cn(styles.card, isDisabled && styles.disabled)}>
      <div className={styles.cardContent}>
        {/* Icon */}
        <div
          className={styles.paymentIcon}
          role="img"
          aria-label={getPaymentTypeLabel(payment.type)}
        >
          {getPaymentTypeIcon(payment.type)}
        </div>

        {/* Content */}
        <div className={styles.cardBody}>
          <div className={styles.cardHeader}>
            <h4 className={styles.cardTitle}>{getPaymentTypeLabel(payment.type)}</h4>
            <span className={styles.cardAmount}>
              {formatSmallestUnit(payment.amount, { currency: payment.currency })}
            </span>
          </div>

          <p className={styles.cardDescription}>{getPaymentTypeDescription(payment.type)}</p>

          {/* Expiration */}
          <div className={styles.expirationContainer}>
            <span className={styles.expirationLabel}>
              {timeInfo.isExpired ? 'Expired' : 'Expires in:'}
            </span>
            {!timeInfo.isExpired && (
              <span
                className={cn(
                  styles.expirationBadge,
                  timeInfo.isExpiringSoon && styles.expiringSoon,
                )}
              >
                {timeInfo.text}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              onClick={() => onViewVoucher(payment)}
              disabled={isDisabled}
              className={styles.viewButton}
            >
              View {payment.type === 'pix' ? 'QR Code' : 'Voucher'}
            </button>

            <button
              onClick={() => onCancel(payment.id)}
              disabled={isDisabled || isCancelling}
              className={cn(styles.cancelButton, isCancelling && styles.cancelling)}
            >
              {isCancelling ? '...' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PendingPayments({
  userId,
  onPaymentComplete,
}: PendingPaymentsProps): React.ReactElement | null {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Ref to prevent race conditions in cancel handler
  const cancellingRef = useRef<string | null>(null);

  // Fetch pending payments
  const fetchPayments = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/stripe/pending-payments?userId=${userId}`);
      const data = await response.json();

      if (data.ok && data.data?.payments) {
        setPayments(data.data.payments);
      } else {
        setError(data.error?.message || 'Failed to load pending payments');
      }
    } catch (err) {
      logger.error('Failed to fetch pending payments', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(fetchPayments, 60000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  // View voucher
  const handleViewVoucher = useCallback((payment: PendingPayment) => {
    window.open(payment.voucherUrl, '_blank', 'noopener,noreferrer');
  }, []);

  // Cancel payment
  const handleCancel = useCallback(
    async (paymentId: string) => {
      if (cancellingRef.current) return;

      cancellingRef.current = paymentId;
      setCancellingId(paymentId);

      try {
        const response = await fetch('/api/stripe/cancel-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentId, userId }),
        });

        const data = await response.json();

        if (data.ok) {
          setPayments(prev => prev.filter(p => p.id !== paymentId));
          logger.debug('Payment cancelled', { paymentId });
        } else {
          const error = new Error(data.error || 'Failed to cancel payment');
          logger.error('Failed to cancel payment', error);
        }
      } catch (err) {
        logger.error('Cancel payment error', err);
      } finally {
        cancellingRef.current = null;
        setCancellingId(null);
      }
    },
    [userId],
  );

  // Filter to only show pending/active payments
  const activePayments = payments.filter(
    p => p.status === 'pending' && new Date(p.expiresAt) > new Date(),
  );

  // Don't render if no pending payments
  if (!isLoading && activePayments.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h3>Pending Deposits</h3>
            <p>Complete these payments to add funds</p>
          </div>

          <button
            onClick={fetchPayments}
            disabled={isLoading}
            className={styles.refreshButton}
            aria-label="Refresh"
          >
            <svg
              className={cn(styles.spinIcon, isLoading && styles.spinning)}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <span className={styles.spinner} />
          </div>
        ) : error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : (
          activePayments.map(payment => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onViewVoucher={handleViewVoucher}
              onCancel={handleCancel}
              isCancelling={cancellingId === payment.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default PendingPayments;
