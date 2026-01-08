# Payment Provider Research

Enterprise grade. Fanatical about UX. Take your time, quality over speed. Think longer before responding.

This document provides comprehensive research on payment providers for international market expansion beyond Stripe and Paystack.

---

## Table of Contents

1. [Provider Summary](#provider-summary)
2. [Flutterwave (Africa - Tabled)](#flutterwave-africa---tabled)
3. [PayMongo (Philippines)](#paymongo-philippines)
4. [Xendit (Indonesia/Southeast Asia)](#xendit-indonesiasoutheast-asia)
5. [Security Comparison](#security-comparison)
6. [Integration Complexity](#integration-complexity)
7. [Fee Structures](#fee-structures)
8. [Recommendation](#recommendation)

---

## Provider Summary

| Provider | Region | Market Size | Security Record | Risk Level | Priority |
|----------|--------|-------------|-----------------|------------|----------|
| PayMongo | Philippines | ~$90M | Clean | Lowest | 1st |
| Xendit | Indonesia | ~$189M | Clean | Low | 2nd |
| Flutterwave | Africa (34 countries) | ~$500M+ | Poor (3 breaches) | High | Tabled |

---

## Flutterwave (Africa - Tabled)

**Status: TABLED due to security concerns**

### Company Background

- **Founded**: 2016 in Lagos, Nigeria
- **Headquarters**: San Francisco, CA (with major operations in Lagos)
- **Coverage**: 34+ African countries
- **Valuation**: ~$3B (as of 2022 Series D)
- **Key Investors**: Tiger Global, Avenir Growth, DST Global

### Security Incidents - CRITICAL CONCERNS

| Incident | Date | Amount Lost | Status |
|----------|------|-------------|--------|
| Unauthorized transfers | Feb 2023 | ~$7M (2.9B NGN) | Company claims no customer funds lost |
| POS transaction breach | Oct 2023 | ~$24M across 6,000 accounts | Under investigation |
| Platform breach | Apr 2024 | ~$7M (11B NGN) | Ongoing recovery efforts |
| Kenya regulatory issues | 2022 | N/A | Account freeze, later cleared |

### Risk Assessment

- **Pattern**: Three major incidents in 18 months suggests systemic vulnerabilities
- **Response**: Company consistently claims "no customer funds lost" but disputed
- **Certifications**: PCI-DSS Level 1 and ISO 27001 certified (did not prevent breaches)

### Why Tabled

Given the philosophy of "Enterprise grade. Fanatical about UX. Take your time, quality over speed. Think longer before responding", Flutterwave's security track record makes it unsuitable for immediate integration. The pattern of breaches suggests underlying infrastructure issues that certifications alone haven't addressed.

**Recommendation**: Revisit in 12-18 months if security track record improves.

---

## PayMongo (Philippines)

**Status: APPROVED - Highest Priority**

### Company Background

- **Founded**: 2019 in Manila, Philippines
- **Founders**: Francis Plaza, Jaime Hing, Luis Sia
- **Accelerator**: Y Combinator (W2019)
- **Coverage**: Philippines only (deep local integration)
- **Key Investors**: Stripe (strategic), Y Combinator, Global Founders Capital
- **Licensed By**: Bangko Sentral ng Pilipinas (BSP)

### Market Context

- Philippines population: ~115 million
- Online gambling market: ~$90M
- E-wallet penetration: 60%+ of online transactions
- Credit card penetration: ~15%

### Payment Methods Supported

| Method | Market Share | Processing Time | Description |
|--------|--------------|-----------------|-------------|
| **GCash** | ~55% of e-wallets | Instant | Globe Telecom wallet, 75M+ users |
| **Maya (PayMaya)** | ~30% of e-wallets | Instant | PLDT/Smart wallet |
| **GrabPay** | ~10% of e-wallets | Instant | Grab super-app wallet |
| **Cards** | ~15% of online | Instant | Visa/Mastercard |
| **Bank Transfer** | Traditional | 1-24 hours | InstaPay/PESONet rails |

### How It Works

PayMongo uses a two-step Source -> Payment flow:

```
1. Create Source
   - User selects payment method (GCash, Maya, card)
   - PayMongo returns source object with redirect URL

2. User Authorization
   - For e-wallets: User redirected to GCash/Maya app
   - User authenticates with MPIN/biometrics
   - Funds reserved in wallet

3. Create Payment
   - After source.chargeable webhook, create payment
   - Funds transferred to merchant

4. Confirmation
   - payment.paid webhook fires
   - Update user balance
```

### GCash Integration (Critical - 75M users)

```typescript
// GCash flow example
const source = await paymongo.createSource({
  amount: amountInCentavos,
  currency: 'PHP',
  type: 'gcash',
  redirect: {
    success: 'https://yoursite.com/success',
    failed: 'https://yoursite.com/failed'
  }
});

// User redirected to source.redirect.checkout_url
// On return, verify via webhook or API
```

### Security Profile

**Strengths:**
- PCI-DSS Level 1 certified
- BSP-regulated electronic money issuer
- Stripe strategic investment (security knowledge transfer)
- Y Combinator network/reputation
- No public security incidents reported
- Youngest of the three = modern architecture

**Technical Security:**
- Public/Secret key pair authentication
- Webhook signatures (HMAC-SHA256)
- Source verification before charging
- Idempotency key support

**Risk Level**: LOWEST - BSP regulated, Stripe-backed, clean record, modern codebase

### API Patterns

**Authentication:**
```
Authorization: Basic base64(secret_key:)
```

**Create Source:**
```
POST https://api.paymongo.com/v1/sources
```

**Create Payment:**
```
POST https://api.paymongo.com/v1/payments
```

**Webhook Events:**
- `source.chargeable` - Source ready to be charged
- `payment.paid` - Payment successful
- `payment.failed` - Payment failed

### Withdrawals

PayMongo supports payouts via:
- InstaPay (instant, up to PHP 50,000)
- PESONet (batch, no limit)
- Direct bank transfer

### Fee Structure

| Method | Fee | Notes |
|--------|-----|-------|
| Cards (Local) | 3.5% + PHP 15 | Visa/Mastercard |
| Cards (International) | 3.5% + PHP 15 | Additional FX fees apply |
| GCash | 2.5% | Lowest fee |
| Maya | 2.5% | Lowest fee |
| GrabPay | 2.5% | Lowest fee |

---

## Xendit (Indonesia/Southeast Asia)

**Status: APPROVED - Second Priority**

### Company Background

- **Founded**: 2015 in Jakarta, Indonesia
- **Founders**: Moses Lo, Tessa Wijaya
- **Accelerator**: Y Combinator
- **Coverage**: Indonesia, Philippines, Vietnam, Thailand, Malaysia
- **Valuation**: ~$1B (unicorn as of 2021)
- **Key Investors**: Accel, Tiger Global, Amundi, Insight Partners
- **Licensed By**: Bank Indonesia, BSP (Philippines), State Bank of Vietnam

### Market Context

- Indonesia population: ~275 million
- Online gambling market: ~$189M
- Credit card penetration: <10%
- Bank account penetration: ~70%
- E-wallet penetration: 35%+ of mobile payments

### Payment Methods Supported

| Method | Market Share | Processing Time | Description |
|--------|--------------|-----------------|-------------|
| **Virtual Accounts** | 60%+ of online | Real-time | Unique bank account for each transaction |
| **E-Wallets (OVO)** | ~35% of mobile | Instant | Major e-wallet, Grab partnership |
| **E-Wallets (GoPay)** | ~30% of mobile | Instant | Gojek super-app wallet |
| **E-Wallets (DANA)** | ~20% of mobile | Instant | Alibaba-backed wallet |
| **E-Wallets (ShopeePay)** | ~15% of mobile | Instant | Shopee ecosystem |
| **Retail (Alfamart/Indomaret)** | ~5% | 1-24 hours | Cash at convenience stores |
| **QRIS** | Growing | Instant | National QR standard |
| **Cards** | <10% | Instant | Low adoption |

### How Virtual Accounts Work (Critical - 60%+ of payments)

Virtual Accounts are the primary payment method in Indonesia because:
- No credit card required (most Indonesians don't have one)
- Uses existing banking infrastructure
- Near-universal acceptance (anyone with a bank account)

```
Flow:
1. User initiates deposit
2. Xendit generates unique 16-digit account number
3. Account is valid for X hours (configurable)
4. User transfers exact amount via mobile banking
5. Xendit receives interbank notification
6. Webhook fires to your server
7. You credit user balance
```

```typescript
// Virtual Account creation
const va = await xendit.createVirtualAccount({
  external_id: 'deposit_123',
  bank_code: 'BCA', // or MANDIRI, BRI, BNI, PERMATA
  name: 'User Name',
  expected_amount: 500000, // IDR
  expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
  is_single_use: true
});

// User receives VA number like: 8810123456789012
// User transfers via mobile banking app
// Webhook: fva_paid callback
```

### E-Wallet Integration

```typescript
// E-Wallet charge
const charge = await xendit.createEWalletCharge({
  reference_id: 'deposit_123',
  currency: 'IDR',
  amount: 50000,
  checkout_method: 'ONE_TIME_PAYMENT',
  channel_code: 'ID_OVO', // or ID_GOPAY, ID_DANA, ID_SHOPEEPAY
  channel_properties: {
    mobile_number: '+62812xxxxxxxx'
  }
});

// For OVO: User receives push notification to approve
// For GoPay/DANA/ShopeePay: User redirected to app
```

### Security Profile

**Strengths:**
- PCI-DSS Level 1 certified
- ISO 27001 certified
- Bank Indonesia regulated (strict oversight)
- No major public security breaches reported
- Backed by reputable institutional investors

**Technical Security:**
- API keys with IP whitelisting
- Webhook signature verification (HMAC-SHA256)
- Callback URL validation
- Request expiry (anti-replay)

**Risk Level**: LOW - Bank Indonesia regulated, clean track record

### API Patterns

**Authentication:**
```
Authorization: Basic base64(secret_key:)
```

**Virtual Account:**
```
POST https://api.xendit.co/callback_virtual_accounts
```

**E-Wallet:**
```
POST https://api.xendit.co/ewallets/charges
```

**Disbursement (Withdrawals):**
```
POST https://api.xendit.co/disbursements
```

**Webhook Events:**
- `fva_paid` - Virtual Account paid
- `ewallet.capture` - E-wallet payment captured
- `disbursement` - Disbursement status update

### Withdrawals

Xendit supports disbursements to:
- All Indonesian banks (BCA, Mandiri, BRI, BNI, etc.)
- E-wallets (OVO, DANA)
- Processing: Instant for major banks, 1-2 hours for others

### Fee Structure

| Method | Fee | Notes |
|--------|-----|-------|
| Virtual Account | IDR 4,500 flat | Extremely low |
| OVO | 1.5% | |
| GoPay | 2% | |
| DANA | 1.5% | |
| ShopeePay | 2% | |
| Disbursement | IDR 5,500 flat | Withdrawal fee |

### Currency Notes

IDR has no decimal places. All amounts are whole numbers.

```typescript
// Correct
const amount = 500000; // IDR 500,000

// Wrong
const amount = 5000.00; // No decimals in IDR
```

---

## Security Comparison

| Factor | PayMongo | Xendit | Flutterwave |
|--------|----------|--------|-------------|
| PCI-DSS Level 1 | Yes | Yes | Yes |
| ISO 27001 | N/A | Yes | Yes |
| Security Breaches | 0 | 0 | 3+ |
| Regulatory Body | BSP | Bank Indonesia | Mixed |
| Stripe Backing | Yes | No | No |
| API Age | 2019 (modern) | 2015 (mature) | 2016 (legacy issues) |

**Verdict**: PayMongo and Xendit are safe choices. Flutterwave is not recommended.

---

## Integration Complexity

| Aspect | PayMongo | Xendit |
|--------|----------|--------|
| API Style | REST, JSON:API | REST, JSON |
| Documentation | Excellent | Excellent |
| SDK Quality | Good (official) | Excellent (official) |
| Test Mode | Full sandbox | Full sandbox |
| Webhook Reliability | High | High |
| Support | Email, Chat | Email, Slack |
| Estimated Hours | ~30 | ~40 |

**PayMongo is simpler** due to:
- Fewer payment method variations
- Simpler two-step flow
- Better documentation for Philippines-specific methods

**Xendit is more complex** due to:
- Multiple Virtual Account bank integrations
- Multiple e-wallet integrations
- More webhook event types

---

## Fee Structures

### Deposit Fees (Paid by Platform)

| Provider | Cards | E-Wallets | Bank Transfer |
|----------|-------|-----------|---------------|
| PayMongo | 3.5% + PHP 15 | 2.5% | 1% |
| Xendit | 2.9% | 1.5-2% | IDR 4,500 flat |
| Stripe | 2.9% + $0.30 | N/A | Varies |
| Paystack | 1.5% + NGN 100 | N/A | 1.5% |

### Withdrawal Fees

| Provider | Method | Fee |
|----------|--------|-----|
| PayMongo | InstaPay | PHP 15 |
| PayMongo | PESONet | PHP 10 |
| Xendit | Bank | IDR 5,500 |
| Xendit | E-Wallet | 0.5% |

---

## Recommendation

### Implementation Order

1. **PayMongo (Philippines)** - Start here
   - Lowest risk (Stripe-backed, BSP regulated)
   - Simpler integration (~30 hours)
   - $90M market
   - GCash has 75M users - massive reach

2. **Xendit (Indonesia)** - Second
   - Clean security record
   - $189M market - largest opportunity
   - More complex but well-documented
   - ~40 hours integration

3. **Flutterwave (Africa)** - Tabled
   - Security concerns too significant
   - Revisit after 12-18 months of clean operation
   - Current Paystack coverage handles key African markets

### Risk Mitigation

For both PayMongo and Xendit:
- Implement idempotency keys on all transactions
- Verify all webhooks with signatures
- Log all API interactions
- Daily reconciliation
- Start with lower deposit limits ($500)
- Monitor for anomalies in first 90 days

---

## Appendix: Environment Variables

```env
# PayMongo (Philippines)
PAYMONGO_SECRET_KEY=sk_live_xxx
PAYMONGO_PUBLIC_KEY=pk_live_xxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxx

# Xendit (Indonesia)
XENDIT_SECRET_KEY=xnd_production_xxx
XENDIT_PUBLIC_KEY=xnd_public_production_xxx
XENDIT_WEBHOOK_TOKEN=xxx
XENDIT_CALLBACK_URL=https://yoursite.com/api/xendit/webhook
```

---

*Document created: January 2026*
*Last updated: January 2026*

