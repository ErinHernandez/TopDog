/**
 * PaymentMethodsModalVX2 - Payment Method Management
 * 
 * Allows users to:
 * - View saved payment methods
 * - Add new payment methods
 * - Set default payment method
 * - Remove payment methods
 */

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import React, { useState, useEffect, useCallback } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../lib/clientLogger';
import { Close, Plus } from '../components/icons';
import { StripeProvider } from '../providers/StripeProvider';


import styles from './PaymentMethodsModalVX2.module.css';

const logger = createScopedLogger('[PaymentMethodsModal]');

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentMethodsModalVX2Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding?: string;
  };
  isDefault: boolean;
}

// ============================================================================
// CARD ELEMENT OPTIONS
// ============================================================================

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: 'var(--text-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 'var(--font-size-sm)',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: 'var(--text-muted)',
      },
    },
    invalid: {
      color: 'var(--color-state-error)',
      iconColor: 'var(--color-state-error)',
    },
  },
  hidePostalCode: false,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CardBrandIcon({ brand }: { brand: string }): React.ReactElement {
  const brandColors: Record<string, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#006FCF',
    discover: '#FF6000',
  };

  const color = brandColors[brand.toLowerCase()] || 'var(--text-muted)';

  return (
    <div
      className={styles.cardBrandIcon}
      data-brand={brand.toLowerCase()}
      style={{ '--brand-color': color } as React.CSSProperties}
    >
      {brand.slice(0, 4).toUpperCase()}
    </div>
  );
}

function TrashIcon(): React.ReactElement {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

// ============================================================================
// MAIN MODAL CONTENT
// ============================================================================

interface ModalContentProps extends PaymentMethodsModalVX2Props {
  clientSecret?: string;
}

function ModalContent({
  isOpen,
  onClose,
  userId,
  userEmail,
  clientSecret,
}: ModalContentProps): React.ReactElement | null {
  const stripe = useStripe();
  const elements = useElements();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stripe/payment-methods?userId=${userId}`);
      const data = await response.json();

      if (data.success && data.data?.paymentMethods) {
        setPaymentMethods(data.data.paymentMethods);
      }
    } catch (err) {
      logger.error('Failed to load payment methods', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load payment methods
  useEffect(() => {
    if (isOpen && userId) {
      loadPaymentMethods();
    }
  }, [isOpen, userId, loadPaymentMethods]);
  
  const handleAddCard = async () => {
    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready');
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card input not ready');
      return;
    }
    
    setIsAdding(true);
    setError(null);
    
    try {
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: userEmail,
            },
          },
        }
      );
      
      if (confirmError) {
        throw new Error(confirmError.message);
      }
      
      if (setupIntent?.status === 'succeeded') {
        // Reload payment methods
        await loadPaymentMethods();
        setShowAddForm(false);
        cardElement.clear();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add card';
      setError(message);
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, paymentMethodId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(prev => 
          prev.map(pm => ({
            ...pm,
            isDefault: pm.id === paymentMethodId,
          }))
        );
      }
    } catch (err) {
      logger.error('Failed to set default', err);
    }
  };
  
  const handleDelete = async (paymentMethodId: string) => {
    setDeletingId(paymentMethodId);
    try {
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, paymentMethodId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
      }
    } catch (err) {
      logger.error('Failed to delete payment method', err);
    } finally {
      setDeletingId(null);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div
      className={styles.modalContainer}
    >
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={styles.modal}
      >
        {/* Header */}
        <div
          className={styles.header}
        >
          <h2
            className={styles.headerTitle}
          >
            Payment Methods
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            <span className={styles.closeIcon}>
              <Close className="w-5 h-5" />
            </span>
          </button>
        </div>
        
        {/* Content */}
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <span className={styles.spinner} />
            </div>
          ) : (
            <div className={styles.methodsList}>
              {/* Payment methods list */}
              {paymentMethods.length === 0 && !showAddForm && (
                <div className={styles.emptyState}>
                  <p>No saved payment methods</p>
                </div>
              )}
              
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  className={cn(styles.methodCard, method.isDefault && styles.methodCardDefault)}
                >
                  <CardBrandIcon brand={method.card.brand} />

                  <div className={styles.methodCardInfo}>
                    <p
                      className={styles.methodCardBrand}
                    >
                      {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} ****{method.card.last4}
                    </p>
                    <p
                      className={styles.methodCardExpiry}
                    >
                      Expires {method.card.expMonth}/{method.card.expYear}
                    </p>
                  </div>

                  <div className={styles.methodCardActions}>
                    {method.isDefault ? (
                      <span
                        className={styles.defaultBadge}
                      >
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className={styles.setDefaultButton}
                      >
                        Set Default
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(method.id)}
                      disabled={deletingId === method.id}
                      className={styles.deleteButton}
                    >
                      {deletingId === method.id ? (
                        <span className={styles.deleteSpinner} />
                      ) : (
                        <TrashIcon />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add new card form */}
              {showAddForm ? (
                <div
                  className={styles.addCardForm}
                >
                  <div
                    className={styles.cardInputContainer}
                  >
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                  </div>

                  {error && (
                    <p
                      className={styles.errorMessage}
                    >
                      {error}
                    </p>
                  )}

                  <div className={styles.formActions}>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setError(null);
                      }}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCard}
                      disabled={isAdding}
                      className={cn(styles.addButton, isAdding && styles.addButtonLoading)}
                    >
                      {isAdding ? (
                        <>
                          <span className={styles.addButtonSpinner} />
                          Adding...
                        </>
                      ) : (
                        'Add Card'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className={styles.addNewCardButton}
                >
                  <Plus className={styles.addIcon} />
                  Add New Card
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function PaymentMethodsModalVX2(props: PaymentMethodsModalVX2Props): React.ReactElement | null {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { isOpen, userId, userEmail } = props;

  const createSetupIntent = useCallback(async () => {
    try {
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      });

      const data = await response.json();

      if (data.success && data.data?.clientSecret) {
        setClientSecret(data.data.clientSecret);
      }
    } catch (err) {
      logger.error('Failed to create setup intent', err);
    }
  }, [userId, userEmail]);

  // Create setup intent when modal opens and user wants to add a card
  useEffect(() => {
    if (isOpen && userId && userEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      createSetupIntent();
    }
  }, [isOpen, userId, userEmail, createSetupIntent]);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setClientSecret(null);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <StripeProvider clientSecret={clientSecret || undefined}>
      <ModalContent {...props} clientSecret={clientSecret || undefined} />
    </StripeProvider>
  );
}

export default PaymentMethodsModalVX2;

