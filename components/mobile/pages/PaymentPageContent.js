/**
 * PaymentPageContent - Mobile Payment Methods Content
 *
 * Extracted from pages/mobile-payment.js for maintainability.
 * Contains all the UI and logic for the payment methods page.
 */

import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { createScopedLogger } from '../../../lib/clientLogger';
import { getOrderedPaymentMethods, PAYMENT_METHOD_DETAILS } from '../../../lib/paymentMethodConfig';
import MobilePhoneFrame, { MobilePhoneContent } from '../shared/MobilePhoneFrame';
import PaymentMethodIcon, { CardBrandIcon } from '../shared/PaymentMethodIcon';

const logger = createScopedLogger('[PaymentPage]');

export default function PaymentPageContent() {
  const router = useRouter();
  const [userCountry, setUserCountry] = useState('US');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [savedMethods, setSavedMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleMethodsCount, setVisibleMethodsCount] = useState(6);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const country = 'US';
        setUserCountry(country);
        const methods = getOrderedPaymentMethods(country);
        setPaymentMethods(methods);
        
        // Load saved payment methods (mock data)
        setSavedMethods([
          {
            id: 'card_1',
            type: 'stripe',
            last4: '4242',
            brand: 'visa',
            isDefault: true
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        logger.error('Error loading payment methods', error);
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  // Reset visible methods count when navigating away
  useEffect(() => {
    const handleRouteChange = () => {
      setVisibleMethodsCount(6);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router]);

  const getMethodDisplayName = (methodId) => {
    if (typeof methodId !== 'string') return 'Unknown Payment Method';
    const details = PAYMENT_METHOD_DETAILS[methodId];
    return details?.name || methodId.replace('_', ' ').toUpperCase();
  };

  const handleAddPaymentMethod = (methodId) => {
    alert(`Adding ${getMethodDisplayName(methodId)} - Integration coming soon!`);
  };

  const handleRemovePaymentMethod = (methodId) => {
    setSavedMethods(prev => prev.filter(method => method.id !== methodId));
  };

  const handleSetDefault = (methodId) => {
    setSavedMethods(prev => prev.map(method => ({
      ...method,
      isDefault: method.id === methodId
    })));
  };

  if (loading) {
    return (
      <MobilePhoneFrame>
        <MobilePhoneContent className="items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-400">Loading payment methods...</p>
        </MobilePhoneContent>
      </MobilePhoneFrame>
    );
  }

  return (
    <MobilePhoneFrame>
      <MobilePhoneContent>
        {/* Mobile Header */}
        <div 
          className="text-white px-4 h-16 flex items-center justify-between flex-shrink-0"
          style={{
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover'
          }}
        >
          <div className="w-10"></div>
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="TopDog.dog Logo"
              width={128}
              height={64}
              className="h-16 w-auto"
            />
          </div>
          <button
            onClick={() => router.push('/mobile?tab=Profile')}
            className="p-1 hover:bg-black/20 rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Payment Methods Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 mobile-no-scrollbar">
          {/* Saved Payment Methods */}
          {savedMethods.length > 0 && (
            <SavedMethodsList 
              methods={savedMethods}
              onSetDefault={handleSetDefault}
              onRemove={handleRemovePaymentMethod}
            />
          )}

          {/* Available Payment Methods */}
          <AvailableMethodsList
            methods={paymentMethods}
            savedMethods={savedMethods}
            visibleCount={visibleMethodsCount}
            onAdd={handleAddPaymentMethod}
            onShowMore={() => setVisibleMethodsCount(prev => prev + 6)}
            onShowLess={() => setVisibleMethodsCount(6)}
            getDisplayName={getMethodDisplayName}
          />

          {/* Security Notice */}
          <SecurityNotice />
        </div>
      </MobilePhoneContent>
    </MobilePhoneFrame>
  );
}

/**
 * SavedMethodsList - Displays user's saved payment methods
 */
function SavedMethodsList({ methods, onSetDefault, onRemove }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Your Payment Methods</h2>
      <div className="space-y-3">
        {methods.map(method => (
          <div key={method.id} className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3">
                  {method.type === 'stripe' 
                    ? <CardBrandIcon brand={method.brand} /> 
                    : <PaymentMethodIcon methodId={method.type} />
                  }
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {method.brand?.toUpperCase()} **** {method.last4}
                  </div>
                  {method.isDefault && (
                    <div className="text-xs text-green-400">Default</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!method.isDefault && (
                  <button
                    onClick={() => onSetDefault(method.id)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => onRemove(method.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AvailableMethodsList - Displays available payment methods to add
 */
function AvailableMethodsList({ 
  methods, 
  savedMethods, 
  visibleCount, 
  onAdd, 
  onShowMore, 
  onShowLess,
  getDisplayName 
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Add Payment Method</h2>
      
      <div className="space-y-3">
        {methods.slice(0, visibleCount).map(methodId => {
          const isAlreadySaved = methodId !== 'stripe' && savedMethods.some(saved => saved.type === methodId);
          
          return (
            <button
              key={methodId}
              onClick={() => onAdd(methodId)}
              disabled={isAlreadySaved}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                isAlreadySaved 
                  ? 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed'
                  : 'bg-gray-800 border-gray-600 hover:border-blue-500 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3">
                    <PaymentMethodIcon methodId={methodId} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{getDisplayName(methodId)}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {isAlreadySaved ? (
                    <span className="text-green-400 text-xs">Added</span>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Show More/Less Buttons */}
      {methods.length > visibleCount && (
        <button
          onClick={onShowMore}
          className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
        >
          <span className="mr-2">Show More Payment Methods</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      
      {visibleCount >= methods.length && methods.length > 6 && (
        <button
          onClick={onShowLess}
          className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
        >
          <span className="mr-2">Show Less Payment Methods</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * SecurityNotice - Payment security information
 */
function SecurityNotice() {
  return (
    <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
      <div className="flex items-start">
        <svg className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <div className="font-medium text-blue-400 mb-1 text-sm">Secure Payments</div>
          <div className="text-xs text-gray-300">
            All payment methods are secured with enterprise-grade encryption and fraud detection. 
            Your financial information is never stored on our servers.
          </div>
        </div>
      </div>
    </div>
  );
}

