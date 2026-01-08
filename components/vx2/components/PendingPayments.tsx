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
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { TYPOGRAPHY, RADIUS, SPACING } from '../core/constants/sizes';
import { formatSmallestUnit } from '../utils/formatting';
import { createScopedLogger } from '../../../lib/clientLogger';

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
    case 'oxxo': return 'OXXO';
    case 'boleto': return 'Boleto';
    case 'pix': return 'Pix';
    default: return 'Payment';
  }
}

function getPaymentTypeDescription(type: PendingPaymentType): string {
  switch (type) {
    case 'oxxo': return 'Pay at any OXXO store';
    case 'boleto': return 'Pay at bank or lottery outlet';
    case 'pix': return 'Scan QR code with banking app';
    default: return 'Complete payment';
  }
}

function getPaymentTypeIcon(type: PendingPaymentType): string {
  switch (type) {
    case 'oxxo': return '🏪';
    case 'boleto': return '🏦';
    case 'pix': return '📱';
    default: return '💳';
  }
}

function formatTimeRemaining(expiresAt: string): { text: string; isExpiringSoon: boolean; isExpired: boolean } {
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
  const timeInfo = formatTimeRemaining(payment.expiresAt);
  const isDisabled = timeInfo.isExpired || payment.status !== 'pending';
  
  return (
    <div 
      className="p-4 rounded-lg"
      style={{ 
        backgroundColor: BG_COLORS.tertiary,
        border: `1px solid ${isDisabled ? BORDER_COLORS.default : BORDER_COLORS.subtle}`,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div 
          className="text-3xl flex-shrink-0"
          role="img"
          aria-label={getPaymentTypeLabel(payment.type)}
        >
          {getPaymentTypeIcon(payment.type)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 
              className="font-semibold truncate"
              style={{ color: TEXT_COLORS.primary }}
            >
              {getPaymentTypeLabel(payment.type)}
            </h4>
            <span 
              className="font-bold flex-shrink-0"
              style={{ color: STATE_COLORS.success }}
            >
              {formatSmallestUnit(payment.amount, { currency: payment.currency })}
            </span>
          </div>
          
          <p 
            className="text-sm mb-2"
            style={{ color: TEXT_COLORS.secondary }}
          >
            {getPaymentTypeDescription(payment.type)}
          </p>
          
          {/* Expiration */}
          <div className="flex items-center gap-2 mb-3">
            <span 
              className="text-xs"
              style={{ color: TEXT_COLORS.muted }}
            >
              {timeInfo.isExpired ? 'Expired' : 'Expires in:'}
            </span>
            {!timeInfo.isExpired && (
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ 
                  backgroundColor: timeInfo.isExpiringSoon 
                    ? `${STATE_COLORS.error}20`
                    : `${STATE_COLORS.warning}20`,
                  color: timeInfo.isExpiringSoon 
                    ? STATE_COLORS.error 
                    : STATE_COLORS.warning,
                }}
              >
                {timeInfo.text}
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewVoucher(payment)}
              disabled={isDisabled}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: isDisabled ? BG_COLORS.elevated : STATE_COLORS.success,
                color: isDisabled ? TEXT_COLORS.muted : '#fff',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              View {payment.type === 'pix' ? 'QR Code' : 'Voucher'}
            </button>
            
            <button
              onClick={() => onCancel(payment.id)}
              disabled={isDisabled || isCancelling}
              className="py-2 px-3 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: BG_COLORS.elevated,
                color: TEXT_COLORS.secondary,
                border: `1px solid ${BORDER_COLORS.default}`,
                cursor: isDisabled || isCancelling ? 'not-allowed' : 'pointer',
                opacity: isCancelling ? 0.5 : 1,
              }}
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
  // Uses ref to prevent race conditions from stale closures
  const handleCancel = useCallback(async (paymentId: string) => {
    // Use ref for guard check to avoid stale closure issues
    if (cancellingRef.current) return;
    
    // Set both ref and state atomically
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
        // Remove from local state
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
  }, [userId]);
  
  // Filter to only show pending/active payments
  const activePayments = payments.filter(p => 
    p.status === 'pending' && new Date(p.expiresAt) > new Date()
  );
  
  // Don't render if no pending payments
  if (!isLoading && activePayments.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: BG_COLORS.secondary }}
    >
      {/* Header */}
      <div 
        className="p-4 border-b"
        style={{ borderColor: BORDER_COLORS.default }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 
              className="font-semibold"
              style={{ 
                fontSize: `${TYPOGRAPHY.fontSize.lg}px`, 
                color: TEXT_COLORS.primary 
              }}
            >
              Pending Deposits
            </h3>
            <p 
              className="text-sm mt-0.5"
              style={{ color: TEXT_COLORS.secondary }}
            >
              Complete these payments to add funds
            </p>
          </div>
          
          <button
            onClick={fetchPayments}
            disabled={isLoading}
            className="p-2 rounded-lg transition-all"
            style={{ 
              backgroundColor: BG_COLORS.tertiary,
              color: TEXT_COLORS.secondary,
            }}
            aria-label="Refresh"
          >
            <svg 
              className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
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
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span 
              className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full"
              style={{ color: STATE_COLORS.active }}
            />
          </div>
        ) : error ? (
          <div 
            className="text-center py-6"
            style={{ color: STATE_COLORS.error }}
          >
            {error}
          </div>
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

