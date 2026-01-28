/**
 * PaymentMethodsModalVX2 - Payment Method Management
 * 
 * Allows users to:
 * - View saved payment methods
 * - Add new payment methods
 * - Set default payment method
 * - Remove payment methods
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../core/constants/sizes';
import { Close, Plus } from '../components/icons';
import { StripeProvider } from '../providers/StripeProvider';
import { createScopedLogger } from '../../../lib/clientLogger';

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
      color: TEXT_COLORS.primary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: TEXT_COLORS.muted,
      },
    },
    invalid: {
      color: STATE_COLORS.error,
      iconColor: STATE_COLORS.error,
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
  
  const color = brandColors[brand.toLowerCase()] || TEXT_COLORS.muted;
  
  return (
    <div 
      className="w-10 h-6 rounded flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: color, color: '#fff' }}
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
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.modal }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-xl overflow-hidden"
        style={{ backgroundColor: BG_COLORS.secondary }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: BORDER_COLORS.default }}
        >
          <h2 
            className="font-semibold"
            style={{ fontSize: `${TYPOGRAPHY.fontSize.lg}px`, color: TEXT_COLORS.primary }}
          >
            Payment Methods
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <span style={{ color: TEXT_COLORS.muted, display: 'inline-block' }}>
              <Close className="w-5 h-5" />
            </span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment methods list */}
              {paymentMethods.length === 0 && !showAddForm && (
                <div className="text-center py-8">
                  <p style={{ color: TEXT_COLORS.muted }}>No saved payment methods</p>
                </div>
              )}
              
              {paymentMethods.map(method => (
                <div 
                  key={method.id}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ 
                    backgroundColor: BG_COLORS.tertiary,
                    border: `1px solid ${method.isDefault ? STATE_COLORS.active : BORDER_COLORS.default}`,
                  }}
                >
                  <CardBrandIcon brand={method.card.brand} />
                  
                  <div className="flex-1">
                    <p style={{ color: TEXT_COLORS.primary }}>
                      {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} ****{method.card.last4}
                    </p>
                    <p style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>
                      Expires {method.card.expMonth}/{method.card.expYear}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {method.isDefault ? (
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
                      >
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="px-2 py-1 rounded text-xs"
                        style={{ 
                          backgroundColor: 'transparent',
                          border: `1px solid ${BORDER_COLORS.default}`,
                          color: TEXT_COLORS.secondary,
                        }}
                      >
                        Set Default
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(method.id)}
                      disabled={deletingId === method.id}
                      className="p-2 rounded hover:bg-white/10"
                      style={{ color: STATE_COLORS.error }}
                    >
                      {deletingId === method.id ? (
                        <span className="animate-spin w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full block" />
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
                  className="p-4 rounded-lg space-y-4"
                  style={{ backgroundColor: BG_COLORS.tertiary }}
                >
                  <div 
                    className="p-3 rounded-lg"
                    style={{ 
                      backgroundColor: BG_COLORS.primary,
                      border: `1px solid ${BORDER_COLORS.default}`,
                    }}
                  >
                    <CardElement options={CARD_ELEMENT_OPTIONS} />
                  </div>
                  
                  {error && (
                    <p style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                      {error}
                    </p>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setError(null);
                      }}
                      className="flex-1 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${BORDER_COLORS.default}`,
                        color: TEXT_COLORS.primary,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCard}
                      disabled={isAdding}
                      className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: isAdding ? BG_COLORS.tertiary : STATE_COLORS.active,
                        color: isAdding ? TEXT_COLORS.muted : '#000',
                      }}
                    >
                      {isAdding ? (
                        <>
                          <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
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
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg"
                  style={{
                    backgroundColor: BG_COLORS.tertiary,
                    border: `1px dashed ${BORDER_COLORS.default}`,
                    color: TEXT_COLORS.secondary,
                  }}
                >
                  <Plus className="w-4 h-4" />
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
      createSetupIntent();
    }
  }, [isOpen, userId, userEmail, createSetupIntent]);

  useEffect(() => {
    if (!isOpen) {
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

