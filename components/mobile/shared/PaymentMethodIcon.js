/**
 * PaymentMethodIcon - Payment method logo/icon renderer
 * 
 * Extracted from mobile-payment.js for reusability.
 * Renders official payment method logos with fallbacks.
 */

import React from 'react';

// Card brand logo URLs (from Stripe)
const CARD_LOGOS = {
  visa: 'https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg',
  mastercard: 'https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg',
  amex: 'https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg',
  discover: 'https://js.stripe.com/v3/fingerprinted/img/discover-ac52cd46f89fa40a29a0bfb954e33173.svg',
};

// Payment method logo configurations
const PAYMENT_METHOD_LOGOS = {
  paypal: {
    src: 'https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png',
    alt: 'PayPal',
    fallbackColor: '#003087',
    fallbackText: 'PP'
  },
  applepay: {
    src: 'https://developer.apple.com/apple-pay/marketing/shared/apple-pay-mark.svg',
    alt: 'Apple Pay',
    fallbackColor: '#000000',
    fallbackText: 'AP'
  },
  googlepay: {
    src: 'https://developers.google.com/pay/api/web/guides/brand-guidelines/assets/google-pay-mark.svg',
    alt: 'Google Pay',
    fallbackColor: '#4285f4',
    fallbackText: 'GP'
  },
  flutterwave: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Flutterwave_Logo.svg/320px-Flutterwave_Logo.svg.png',
    alt: 'Flutterwave',
    fallbackColor: '#f5a623',
    fallbackText: 'FW'
  },
  paystack: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Paystack_Logo.svg/320px-Paystack_Logo.svg.png',
    alt: 'Paystack',
    fallbackColor: '#0ba4db',
    fallbackText: 'PS'
  },
  mpesa: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/320px-M-PESA_LOGO-01.svg.png',
    alt: 'M-Pesa',
    fallbackColor: '#4caf50',
    fallbackText: 'M'
  },
  adyen: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Adyen_corporate_logo.svg/320px-Adyen_corporate_logo.svg.png',
    alt: 'Adyen',
    fallbackColor: '#0abf53',
    fallbackText: 'A'
  },
  mtn_money: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/MTN_Logo.svg/320px-MTN_Logo.svg.png',
    alt: 'MTN Mobile Money',
    fallbackColor: '#ffcc00',
    fallbackText: 'MTN',
    textColor: '#000'
  }
};

/**
 * CardBrandIcon - Renders a single card brand logo
 */
export function CardBrandIcon({ brand, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-8 h-6',
    lg: 'w-12 h-9'
  };
  
  const logoStyle = `${sizeClasses[size]} object-contain`;
  const normalizedBrand = brand?.toLowerCase();
  
  if (normalizedBrand === 'american express') {
    return <img src={CARD_LOGOS.amex} alt="American Express" className={logoStyle} />;
  }
  
  if (CARD_LOGOS[normalizedBrand]) {
    return <img src={CARD_LOGOS[normalizedBrand]} alt={brand} className={logoStyle} />;
  }
  
  // Fallback for unknown brands
  return (
    <div className={`${sizeClasses[size]} bg-gray-600 rounded flex items-center justify-center`}>
      <span className="text-white font-bold text-xs">?</span>
    </div>
  );
}

/**
 * CardBrandGrid - Shows all supported card brands in a grid
 */
export function CardBrandGrid() {
  return (
    <div className="grid grid-cols-2 gap-1 w-fit">
      <img src={CARD_LOGOS.visa} alt="Visa" className="w-4 h-3 object-contain" />
      <img src={CARD_LOGOS.mastercard} alt="Mastercard" className="w-4 h-3 object-contain" />
      <img src={CARD_LOGOS.amex} alt="American Express" className="w-4 h-3 object-contain" />
      <img src={CARD_LOGOS.discover} alt="Discover" className="w-4 h-3 object-contain" />
    </div>
  );
}

/**
 * PaymentMethodIcon - Main component for rendering payment method logos
 */
export default function PaymentMethodIcon({ methodId, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  if (typeof methodId !== 'string') {
    return (
      <div className={`${sizeClasses[size]} bg-gray-600 rounded flex items-center justify-center text-white text-xs`}>
        ?
      </div>
    );
  }
  
  // Special case for stripe - show card grid
  if (methodId === 'stripe') {
    return <CardBrandGrid />;
  }
  
  const config = PAYMENT_METHOD_LOGOS[methodId];
  
  if (!config) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-600 rounded flex items-center justify-center`}>
        <span className="text-white font-bold text-xs">?</span>
      </div>
    );
  }
  
  const handleError = (e) => {
    // Replace with fallback on error
    // SECURITY: Using textContent instead of innerHTML to prevent XSS
    const fallback = document.createElement('div');
    fallback.className = `${sizeClasses[size]} rounded flex items-center justify-center`;
    fallback.style.backgroundColor = config.fallbackColor;
    
    const span = document.createElement('span');
    span.className = 'font-bold text-xs';
    span.style.color = config.textColor || '#fff';
    span.textContent = config.fallbackText; // Safe: textContent prevents XSS
    fallback.appendChild(span);
    
    e.target.parentNode.replaceChild(fallback, e.target);
  };
  
  return (
    <img 
      src={config.src}
      alt={config.alt}
      className={`${sizeClasses[size]} object-contain rounded`}
      onError={handleError}
    />
  );
}

