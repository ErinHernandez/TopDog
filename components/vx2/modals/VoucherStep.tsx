/**
 * VoucherStep - Display payment voucher for async payment methods
 * 
 * For OXXO (Mexico):
 * - Display barcode voucher
 * - Show expiration (3 days)
 * - Instructions to pay at OXXO store
 * 
 * For Boleto (Brazil):
 * - Display bank slip
 * - Show expiration (3 days)
 * - Instructions to pay at bank/ATM/online
 * 
 * For Pix (Brazil):
 * - Display QR code
 * - Show expiration (24 hours)
 * - Instructions to scan with banking app
 */

import React from 'react';

import { cn } from '@/lib/styles';

import { formatSmallestUnit } from '../utils/formatting';

import styles from './VoucherStep.module.css';

// ============================================================================
// TYPES
// ============================================================================

export type AsyncPaymentType = 'oxxo' | 'boleto' | 'pix';

export interface VoucherInfo {
  type: AsyncPaymentType;
  voucherUrl: string;
  expiresAt: string;
  amount: number;
  currency: string;
}

export interface VoucherStepProps {
  voucherInfo: VoucherInfo;
  onClose: () => void;
  onViewVoucher: () => void;
}

// ============================================================================
// VOUCHER CONFIGURATION
// ============================================================================

interface VoucherConfig {
  icon: string;
  title: string;
  subtitle: string;
  buttonText: string;
  instructions: string[];
  confirmationNote: string;
}

function getVoucherConfig(type: AsyncPaymentType): VoucherConfig {
  switch (type) {
    case 'oxxo':
      return {
        icon: '🏪',
        title: 'Pay at OXXO',
        subtitle: 'Cash payment at any OXXO store',
        buttonText: 'View Payment Voucher',
        instructions: [
          'Click the button below to view your payment voucher',
          'Take the voucher (printed or on your phone) to any OXXO store',
          'Tell the cashier you want to pay an "OXXO Pay" voucher',
          'Pay the exact amount shown in cash',
          'Keep your receipt as proof of payment',
        ],
        confirmationNote: 'Your deposit will be credited within a few minutes after payment.',
      };
    case 'boleto':
      return {
        icon: '🏦',
        title: 'Pay with Boleto',
        subtitle: 'Bank slip payment',
        buttonText: 'View Boleto',
        instructions: [
          'Click the button below to view your Boleto bank slip',
          'You can pay at any bank branch, ATM, or through online banking',
          'Lottery outlets (Loterias) also accept Boleto payments',
          'Make sure to pay before the expiration date',
          'Keep your payment confirmation',
        ],
        confirmationNote: 'Your deposit will be credited within 1-2 business days after payment.',
      };
    case 'pix':
      return {
        icon: '📱',
        title: 'Pay with Pix',
        subtitle: 'Instant bank transfer',
        buttonText: 'View Pix QR Code',
        instructions: [
          'Click the button below to view your Pix QR code',
          'Open your banking app and select "Pix"',
          'Choose "Pay with QR Code" and scan the code',
          'Or copy the Pix key and paste in your app',
          'Confirm the payment in your banking app',
        ],
        confirmationNote: 'Your deposit will be credited instantly after payment.',
      };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes} minutes`;
}

function isExpiringSoon(expiresAt: string): boolean {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  const hoursRemaining = diff / (1000 * 60 * 60);
  return hoursRemaining < 6;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VoucherStep({
  voucherInfo,
  onClose,
  onViewVoucher,
}: VoucherStepProps): React.ReactElement {
  const config = getVoucherConfig(voucherInfo.type);
  const timeRemaining = formatTimeRemaining(voucherInfo.expiresAt);
  const expiringSoon = isExpiringSoon(voucherInfo.expiresAt);
  const expiresDate = new Date(voucherInfo.expiresAt);
  
  const handleViewVoucher = () => {
    // Open voucher URL in new tab
    window.open(voucherInfo.voucherUrl, '_blank', 'noopener,noreferrer');
    onViewVoucher();
  };
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div
          className={styles.icon}
          role="img"
          aria-label={config.title}
        >
          {config.icon}
        </div>
        <h3
          className={styles.title}
        >
          {config.title}
        </h3>
        <p
          className={styles.subtitle}
        >
          {config.subtitle}
        </p>
      </div>
      
      {/* Amount */}
      <div
        className={styles.amountBox}
      >
        <p
          className={styles.amountValue}
        >
          {formatSmallestUnit(voucherInfo.amount, { currency: voucherInfo.currency })}
        </p>
        <p
          className={styles.amountLabel}
        >
          Amount to pay
        </p>
      </div>
      
      {/* Expiration Warning */}
      <div
        className={cn(styles.expirationBox, {
          [styles.expiring as string]: expiringSoon,
          [styles.warning as string]: !expiringSoon,
        })}
      >
        <div className={styles.expirationHeader}>
          <span
            className={styles.expirationLabel}
          >
            Expires in:
          </span>
          <span
            className={cn(styles.expirationTime, {
              [styles.expiring as string]: expiringSoon,
              [styles.warning as string]: !expiringSoon,
            })}
          >
            {timeRemaining}
          </span>
        </div>
        <p
          className={styles.expirationDate}
        >
          {expiresDate.toLocaleString()}
        </p>
      </div>
      
      {/* Instructions */}
      <div
        className={styles.instructionsBox}
      >
        <p
          className={styles.instructionsTitle}
        >
          How to complete your payment:
        </p>
        <ol
          className={styles.instructionsList}
        >
          {config.instructions.map((instruction, index) => (
            <li
              key={index}
              className={styles.instructionItem}
            >
              <span
                className={styles.instructionNumber}
              >
                {index + 1}
              </span>
              <span>{instruction}</span>
            </li>
          ))}
        </ol>
      </div>
      
      {/* Actions */}
      <div className={styles.actionsContainer}>
        <button
          onClick={handleViewVoucher}
          className={styles.primaryButton}
        >
          <svg
            className={styles.buttonIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          {config.buttonText}
        </button>

        <button
          onClick={onClose}
          className={styles.secondaryButton}
        >
          I&apos;ll Pay Later
        </button>
      </div>

      {/* Confirmation Note */}
      <p
        className={styles.confirmationNote}
      >
        {config.confirmationNote}
      </p>
    </div>
  );
}

export default VoucherStep;

