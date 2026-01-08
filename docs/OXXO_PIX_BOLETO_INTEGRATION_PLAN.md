# OXXO, Pix, and Boleto Integration Plan
## Mexico & Brazil Payment Methods

> **Philosophy**: Enterprise grade. Fanatical about UX. Use a deterministic, precise approach. Be thorough, take your time, quality over speed.

---

## EXECUTIVE SUMMARY

### Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Currency Config (MXN, BRL)** | ✅ Complete | Already in `currencyConfig.ts` |
| **Payment Method Types** | ✅ Complete | `oxxo`, `pix`, `boleto` in `stripeTypes.ts` |
| **Payment Intent API** | ✅ Partial | Methods in allowed list, needs voucher display |
| **Webhook Handler** | ✅ Complete | Handles async payments, voucher URLs |
| **Stripe Service** | ✅ Complete | NextAction handling for OXXO/Boleto |
| **Stripe Dashboard** | ❌ Not Enabled | Toggle these on |
| **Deposit Modal UI** | ❌ Not Started | Needs voucher display flow |
| **Async Payment Status** | ❌ Not Started | User-facing pending payment UI |

### Estimated Effort

| Task | Effort | Priority |
|------|--------|----------|
| Stripe Dashboard Setup | 30 min | **Critical** |
| Deposit Modal Updates | 4-6 hours | **Critical** |
| Pending Payment UI | 2-3 hours | **Critical** |
| Testing | 4-6 hours | **Critical** |
| Documentation | 1-2 hours | Medium |
| **Total** | **12-18 hours** | |

---

## PHASE 1: STRIPE DASHBOARD SETUP (30 min)

### Step 1: Enable Payment Methods

**Location**: Stripe Dashboard → Settings → Payment Methods

| Method | Toggle | Currency | Notes |
|--------|--------|----------|-------|
| **OXXO** | ✅ Enable | MXN | Mexico only |
| **Pix** | ✅ Enable | BRL | Brazil only (via EBANX) |
| **Boleto** | ✅ Enable | BRL | Brazil only |

### Step 2: Configure OXXO Settings

**Location**: Stripe Dashboard → Settings → Payment Methods → OXXO

```
Voucher Expiration: 3 days (recommended)
Statement Descriptor: TopDog Fantasy Sports
```

### Step 3: Configure Boleto Settings

**Location**: Stripe Dashboard → Settings → Payment Methods → Boleto

```
Voucher Expiration: 3 days (recommended)  
Statement Descriptor: TopDog Fantasy Sports
```

### Step 4: Configure Pix Settings

**Location**: Stripe Dashboard → Settings → Payment Methods → Pix

```
QR Code Expiration: 24 hours (recommended)
Statement Descriptor: TopDog Fantasy Sports
```

### Step 5: Verify Currencies

**Location**: Stripe Dashboard → Settings → Currencies

- [x] Verify MXN is enabled
- [x] Verify BRL is enabled

---

## PHASE 2: BACKEND VERIFICATION (Already Complete)

### 2.1 Currency Configuration ✅

File: `lib/stripe/currencyConfig.ts`

```typescript
// MXN - Already configured (lines 61-71)
MXN: {
  code: 'MXN',
  symbol: '$',
  name: 'Mexican Peso',
  decimals: 2,
  minAmountSmallestUnit: 10000,    // $100.00 MXN (~$5 USD)
  maxAmountSmallestUnit: 200000000, // $2,000,000.00 MXN
  stripeMinimum: 1000,
  countries: ['MX'],
  locale: 'es-MX',
},

// BRL - Already configured (lines 213-223)
BRL: {
  code: 'BRL',
  symbol: 'R$',
  name: 'Brazilian Real',
  decimals: 2,
  minAmountSmallestUnit: 2500,     // R$25.00
  maxAmountSmallestUnit: 5000000,  // R$50,000.00
  stripeMinimum: 50,
  countries: ['BR'],
  locale: 'pt-BR',
},
```

### 2.2 Payment Method Types ✅

File: `lib/stripe/stripeTypes.ts`

```typescript
// Already includes (lines 203-207):
// Latin America
| 'oxxo'
| 'boleto'
| 'pix'
```

### 2.3 Payment Intent API ✅

File: `pages/api/stripe/payment-intent.ts`

```typescript
// Already includes in ALL_PAYMENT_METHODS (lines 106-108):
// Latin America
'oxxo',
'boleto',
'pix',

// Already includes in getAllowedPaymentMethods (lines 198-207):
// Mexico
if (currencyUpper === 'MXN' && countryUpper === 'MX') {
  methods.push('oxxo');
}

// Brazil
if (currencyUpper === 'BRL' && countryUpper === 'BR') {
  methods.push('boleto', 'pix');
}
```

### 2.4 Stripe Service ✅

File: `lib/stripe/stripeService.ts`

```typescript
// Already handles OXXO/Boleto next_action (lines 307-327):
// Handle OXXO voucher
if (paymentIntent.next_action.oxxo_display_details) {
  response.nextAction.voucherUrl = ...
  response.nextAction.expiresAt = ...
}

// Handle Boleto voucher
if (paymentIntent.next_action.boleto_display_details) {
  response.nextAction.voucherUrl = ...
  response.nextAction.expiresAt = ...
}
```

### 2.5 Webhook Handler ✅

File: `pages/api/stripe/webhook.ts`

```typescript
// Already handles (lines 390-461):
case 'payment_intent.requires_action':
  return await handlePaymentIntentRequiresAction(...)

// Handles OXXO voucher URL (lines 406-411)
// Handles Boleto voucher URL (lines 414-419)
// Stores voucherUrl and expiresAt in transaction
```

---

## PHASE 3: FRONTEND IMPLEMENTATION (4-6 hours)

### 3.1 Update Deposit Modal for Async Payments

File: `components/vx2/modals/DepositModalVX2.tsx`

#### Add New Step: Voucher Display

```typescript
type DepositStep = 'amount' | 'method' | 'confirm' | 'processing' | 'voucher' | 'success' | 'error';

interface VoucherInfo {
  type: 'oxxo' | 'boleto' | 'pix';
  voucherUrl: string;
  expiresAt: string;
  amount: number;
  currency: string;
}
```

#### Voucher Step Component

Create new component: `components/vx2/modals/VoucherStep.tsx`

```typescript
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

interface VoucherStepProps {
  type: 'oxxo' | 'boleto' | 'pix';
  voucherUrl: string;
  expiresAt: string;
  amount: number;
  currency: string;
  onClose: () => void;
  onViewVoucher: () => void;
}

export function VoucherStep({
  type,
  voucherUrl,
  expiresAt,
  amount,
  currency,
  onClose,
  onViewVoucher,
}: VoucherStepProps): React.ReactElement {
  const config = getVoucherConfig(type);
  const formattedAmount = formatSmallestUnit(amount, { currency });
  const expiresDate = new Date(expiresAt);
  const timeRemaining = formatTimeRemaining(expiresDate);
  
  return (
    <div className="space-y-6 text-center">
      {/* Header */}
      <div>
        <div className="text-4xl mb-4">{config.icon}</div>
        <h3 className="text-xl font-semibold" style={{ color: TEXT_COLORS.primary }}>
          {config.title}
        </h3>
        <p style={{ color: TEXT_COLORS.secondary }}>
          {formattedAmount}
        </p>
      </div>
      
      {/* Expiration Warning */}
      <div 
        className="p-4 rounded-lg"
        style={{ 
          backgroundColor: `${STATE_COLORS.warning}15`,
          border: `1px solid ${STATE_COLORS.warning}40`,
        }}
      >
        <p style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: TEXT_COLORS.primary }}>
          Expires in: {timeRemaining}
        </p>
        <p style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: TEXT_COLORS.muted }}>
          {expiresDate.toLocaleString()}
        </p>
      </div>
      
      {/* Instructions */}
      <div className="text-left p-4 bg-gray-800 rounded-lg">
        <p className="font-medium mb-2" style={{ color: TEXT_COLORS.primary }}>
          How to complete your payment:
        </p>
        <ol className="list-decimal list-inside space-y-2" style={{ color: TEXT_COLORS.secondary }}>
          {config.instructions.map((instruction, i) => (
            <li key={i}>{instruction}</li>
          ))}
        </ol>
      </div>
      
      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onViewVoucher}
          className="w-full py-3 px-4 rounded-lg font-medium"
          style={{
            backgroundColor: STATE_COLORS.success,
            color: '#fff',
          }}
        >
          {config.buttonText}
        </button>
        
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-lg font-medium"
          style={{
            backgroundColor: BG_COLORS.elevated,
            color: TEXT_COLORS.secondary,
          }}
        >
          I'll Pay Later
        </button>
      </div>
      
      {/* Note */}
      <p style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: TEXT_COLORS.muted }}>
        Your balance will be credited once payment is confirmed.
        This usually takes a few minutes to a few hours.
      </p>
    </div>
  );
}

function getVoucherConfig(type: 'oxxo' | 'boleto' | 'pix') {
  switch (type) {
    case 'oxxo':
      return {
        icon: '🏪',
        title: 'Pay at OXXO',
        buttonText: 'View Voucher',
        instructions: [
          'Click "View Voucher" to see your payment barcode',
          'Take the voucher (or screenshot) to any OXXO store',
          'Tell the cashier you want to pay an OXXO Pay voucher',
          'Pay in cash',
          'Your deposit will be credited within minutes',
        ],
      };
    case 'boleto':
      return {
        icon: '🏦',
        title: 'Pay with Boleto',
        buttonText: 'View Boleto',
        instructions: [
          'Click "View Boleto" to see your bank slip',
          'Pay at any bank, ATM, or through online banking',
          'You can also pay at lottery outlets (Lotéricas)',
          'Your deposit will be credited within 1-2 business days',
        ],
      };
    case 'pix':
      return {
        icon: '📱',
        title: 'Pay with Pix',
        buttonText: 'View QR Code',
        instructions: [
          'Click "View QR Code" to see your Pix code',
          'Open your banking app and select Pix',
          'Scan the QR code or copy the Pix key',
          'Confirm the payment in your app',
          'Your deposit will be credited instantly',
        ],
      };
  }
}

function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${minutes}m`;
}
```

### 3.2 Update Deposit Modal Flow

File: `components/vx2/modals/DepositModalVX2.tsx`

#### Handle Next Action Response

```typescript
// In the payment submission handler:

const handleSubmit = async () => {
  setStep('processing');
  
  try {
    const response = await fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amountCents: selectedAmount,
        currency: currency.toLowerCase(),
        country: userCountry,
        userId,
        email: userEmail,
        paymentMethodTypes: getPaymentMethodsForCountry(userCountry, currency),
        // ... other fields
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Payment failed');
    }
    
    // Check for async payment (OXXO, Boleto, Pix)
    if (data.nextAction?.voucherUrl) {
      setVoucherInfo({
        type: getPaymentType(currency, userCountry),
        voucherUrl: data.nextAction.voucherUrl,
        expiresAt: data.nextAction.expiresAt,
        amount: selectedAmount,
        currency,
      });
      setStep('voucher');
      return;
    }
    
    // Handle redirect (iDEAL, Bancontact, etc.)
    if (data.nextAction?.redirectUrl) {
      window.location.href = data.nextAction.redirectUrl;
      return;
    }
    
    // Standard card payment - confirm with Stripe
    const { error } = await stripe.confirmPayment({
      clientSecret: data.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/deposit/success`,
      },
    });
    
    if (error) {
      throw error;
    }
    
    setStep('success');
  } catch (error) {
    setErrorMessage(error.message);
    setStep('error');
  }
};

function getPaymentType(currency: string, country: string): 'oxxo' | 'boleto' | 'pix' {
  if (currency === 'MXN' && country === 'MX') return 'oxxo';
  if (currency === 'BRL' && country === 'BR') return 'pix'; // Default to Pix for Brazil
  return 'boleto';
}
```

### 3.3 Payment Method Selection by Country

```typescript
// Add to DepositModalVX2.tsx

interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'instant' | 'async' | 'redirect';
}

function getPaymentMethodsForCountry(country: string, currency: string): PaymentMethodOption[] {
  const methods: PaymentMethodOption[] = [
    // Always available
    { id: 'card', name: 'Card', description: 'Visa, Mastercard, Amex', icon: '💳', type: 'instant' },
  ];
  
  // Mexico
  if (country === 'MX' && currency === 'MXN') {
    methods.push({
      id: 'oxxo',
      name: 'OXXO',
      description: 'Pay in cash at OXXO stores',
      icon: '🏪',
      type: 'async',
    });
  }
  
  // Brazil
  if (country === 'BR' && currency === 'BRL') {
    methods.push(
      {
        id: 'pix',
        name: 'Pix',
        description: 'Instant bank transfer',
        icon: '📱',
        type: 'instant',
      },
      {
        id: 'boleto',
        name: 'Boleto',
        description: 'Pay at bank or online',
        icon: '🏦',
        type: 'async',
      }
    );
  }
  
  return methods;
}
```

---

## PHASE 4: PENDING PAYMENTS UI (2-3 hours)

### 4.1 Pending Payments Component

Create: `components/vx2/account/PendingPayments.tsx`

```typescript
/**
 * PendingPayments - Display pending async payments
 * 
 * Shows:
 * - Pending OXXO vouchers (with link to view)
 * - Pending Boleto payments (with link to view)
 * - Pending Pix payments (with QR code link)
 * - Expiration countdown
 * - Cancel option (for expired/unwanted)
 */

interface PendingPayment {
  id: string;
  type: 'oxxo' | 'boleto' | 'pix';
  amount: number;
  currency: string;
  voucherUrl: string;
  expiresAt: string;
  createdAt: string;
}

interface PendingPaymentsProps {
  userId: string;
}

export function PendingPayments({ userId }: PendingPaymentsProps): React.ReactElement {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPendingPayments();
  }, [userId]);
  
  const fetchPendingPayments = async () => {
    try {
      const response = await fetch(`/api/user/pending-payments?userId=${userId}`);
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (payments.length === 0) {
    return null; // Don't show anything if no pending payments
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" style={{ color: TEXT_COLORS.primary }}>
        Pending Deposits
      </h3>
      
      {payments.map((payment) => (
        <PendingPaymentCard 
          key={payment.id} 
          payment={payment}
          onRefresh={fetchPendingPayments}
        />
      ))}
    </div>
  );
}

function PendingPaymentCard({ payment, onRefresh }: { 
  payment: PendingPayment; 
  onRefresh: () => void;
}): React.ReactElement {
  const config = getPaymentTypeConfig(payment.type);
  const isExpired = new Date(payment.expiresAt) < new Date();
  const timeRemaining = formatTimeRemaining(new Date(payment.expiresAt));
  
  return (
    <div 
      className="p-4 rounded-lg"
      style={{ 
        backgroundColor: BG_COLORS.elevated,
        border: isExpired 
          ? `1px solid ${STATE_COLORS.error}40`
          : `1px solid ${BORDER_COLORS.default}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="font-medium" style={{ color: TEXT_COLORS.primary }}>
              {config.name}
            </p>
            <p style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: TEXT_COLORS.muted }}>
              {formatSmallestUnit(payment.amount, { currency: payment.currency })}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          {isExpired ? (
            <span 
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: `${STATE_COLORS.error}20`, color: STATE_COLORS.error }}
            >
              Expired
            </span>
          ) : (
            <span 
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: `${STATE_COLORS.warning}20`, color: STATE_COLORS.warning }}
            >
              Expires in {timeRemaining}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        {!isExpired && (
          <a
            href={payment.voucherUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 px-4 rounded text-center font-medium"
            style={{
              backgroundColor: STATE_COLORS.success,
              color: '#fff',
            }}
          >
            {config.buttonText}
          </a>
        )}
        
        <button
          onClick={() => handleCancel(payment.id, onRefresh)}
          className="py-2 px-4 rounded font-medium"
          style={{
            backgroundColor: BG_COLORS.primary,
            color: TEXT_COLORS.secondary,
          }}
        >
          {isExpired ? 'Dismiss' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

function getPaymentTypeConfig(type: 'oxxo' | 'boleto' | 'pix') {
  switch (type) {
    case 'oxxo':
      return { icon: '🏪', name: 'OXXO Payment', buttonText: 'View Voucher' };
    case 'boleto':
      return { icon: '🏦', name: 'Boleto Payment', buttonText: 'View Boleto' };
    case 'pix':
      return { icon: '📱', name: 'Pix Payment', buttonText: 'View QR Code' };
  }
}
```

### 4.2 API Endpoint for Pending Payments

Create: `pages/api/user/pending-payments.ts`

```typescript
/**
 * Pending Payments API
 * 
 * GET: Fetch user's pending async payments (OXXO, Boleto, Pix)
 * DELETE: Cancel a pending payment
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId required' });
  }
  
  if (req.method === 'GET') {
    try {
      // Query pending transactions with voucher URLs
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        where('voucherUrl', '!=', null),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return res.status(200).json({ payments });
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      return res.status(500).json({ error: 'Failed to fetch pending payments' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

---

## PHASE 5: TESTING (4-6 hours)

### 5.1 Stripe Test Mode Configuration

Use Stripe test mode with these test scenarios:

#### OXXO Test Cases

```javascript
// Test card for OXXO simulation
// In test mode, OXXO payments succeed automatically after creation

// Create payment intent with OXXO
const response = await fetch('/api/stripe/payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    amountCents: 10000, // 100 MXN
    currency: 'mxn',
    country: 'MX',
    userId: 'test-user',
    paymentMethodTypes: ['oxxo'],
  }),
});

// Response should include:
// - nextAction.voucherUrl (hosted voucher page)
// - nextAction.expiresAt (expiration timestamp)
```

#### Pix Test Cases

```javascript
// Pix test mode automatically succeeds
// Create payment intent with Pix
const response = await fetch('/api/stripe/payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    amountCents: 2500, // R$25.00
    currency: 'brl',
    country: 'BR',
    userId: 'test-user',
    paymentMethodTypes: ['pix'],
  }),
});

// Response should include QR code or redirect
```

#### Boleto Test Cases

```javascript
// Boleto test mode - simulate success/failure
// Create payment intent with Boleto
const response = await fetch('/api/stripe/payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    amountCents: 5000, // R$50.00
    currency: 'brl',
    country: 'BR',
    userId: 'test-user',
    paymentMethodTypes: ['boleto'],
  }),
});

// Response should include:
// - nextAction.voucherUrl (hosted Boleto PDF)
// - nextAction.expiresAt (expiration timestamp)
```

### 5.2 Test Checklist

#### OXXO (Mexico)

- [ ] Create payment intent with MXN currency
- [ ] Verify voucher URL is returned
- [ ] Verify voucher displays correctly
- [ ] Verify expiration is shown
- [ ] Verify webhook handles `payment_intent.requires_action`
- [ ] Verify webhook handles `payment_intent.succeeded` (simulate payment)
- [ ] Verify balance is credited after payment
- [ ] Verify transaction record is created with currency
- [ ] Verify pending payment shows in user account

#### Pix (Brazil)

- [ ] Create payment intent with BRL currency
- [ ] Verify QR code/redirect is returned
- [ ] Verify instant payment flow works
- [ ] Verify webhook handles `payment_intent.succeeded`
- [ ] Verify balance is credited immediately
- [ ] Verify transaction record is created with currency

#### Boleto (Brazil)

- [ ] Create payment intent with BRL currency
- [ ] Verify voucher URL is returned (PDF)
- [ ] Verify voucher displays correctly
- [ ] Verify expiration is shown
- [ ] Verify webhook handles `payment_intent.requires_action`
- [ ] Verify webhook handles `payment_intent.succeeded` (simulate payment)
- [ ] Verify balance is credited after payment
- [ ] Verify transaction record is created with currency
- [ ] Verify pending payment shows in user account

#### Edge Cases

- [ ] Expired voucher handling
- [ ] User cancels pending payment
- [ ] Payment fails after voucher issued
- [ ] Currency mismatch prevention
- [ ] Minimum amount validation (per currency)

---

## PHASE 6: MONITORING & ALERTS

### 6.1 Payment Event Logging

Already implemented in webhook handler. Verify logging for:

```typescript
// Events to monitor:
'payment_requires_action'  // Voucher generated
'payment_processing'       // Payment being processed
'payment_succeeded'        // Payment complete
'payment_failed'           // Payment failed
```

### 6.2 Dashboard Metrics

Add to analytics dashboard:

- Pending payments count by type (OXXO, Boleto, Pix)
- Pending payment conversion rate (voucher → paid)
- Average time to payment (voucher issued → paid)
- Expired voucher rate

---

## IMPLEMENTATION CHECKLIST

### Pre-Implementation

- [ ] Review this plan with team
- [ ] Ensure Stripe test mode API keys are configured
- [ ] Ensure webhook endpoint is accessible

### Stripe Dashboard (30 min)

- [ ] Enable OXXO in Stripe Dashboard
- [ ] Enable Pix in Stripe Dashboard
- [ ] Enable Boleto in Stripe Dashboard
- [ ] Configure voucher expiration settings
- [ ] Verify MXN and BRL currencies are enabled

### Backend (Already Complete - Verify)

- [ ] Verify currencyConfig.ts has MXN and BRL
- [ ] Verify payment-intent.ts allows oxxo, pix, boleto
- [ ] Verify webhook.ts handles requires_action event
- [ ] Verify stripeService.ts returns nextAction info

### Frontend (4-6 hours)

- [ ] Create VoucherStep component
- [ ] Update DepositModalVX2 with voucher flow
- [ ] Add payment method selection for MX/BR
- [ ] Create PendingPayments component
- [ ] Create pending-payments API endpoint
- [ ] Add pending payments to account page

### Testing (4-6 hours)

- [ ] Test OXXO flow in Stripe test mode
- [ ] Test Pix flow in Stripe test mode
- [ ] Test Boleto flow in Stripe test mode
- [ ] Test webhook events
- [ ] Test edge cases

### Documentation (1-2 hours)

- [ ] Update user-facing payment method docs
- [ ] Update internal API documentation
- [ ] Document troubleshooting steps

### Go-Live

- [ ] Enable in production Stripe Dashboard
- [ ] Monitor first transactions
- [ ] Verify webhooks are working
- [ ] Monitor error rates

---

## ROLLBACK PLAN

If issues arise after deployment:

1. **Immediate**: Disable payment methods in Stripe Dashboard
2. **Investigation**: Review webhook logs and error tracking
3. **Fix**: Address issues in code
4. **Re-enable**: Gradually re-enable after fix

---

## REFERENCES

- [Stripe OXXO Documentation](https://docs.stripe.com/payments/oxxo)
- [Stripe Pix Documentation](https://docs.stripe.com/payments/pix)
- [Stripe Boleto Documentation](https://docs.stripe.com/payments/boleto)
- [Stripe Webhook Events](https://docs.stripe.com/webhooks/payment-intents)

---

*Document created: January 2025*  
*Estimated implementation time: 12-18 hours*

