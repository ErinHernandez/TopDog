# Global Payment Methods - Master Summary

## Philosophy

> **"Fanatical about user experience"**
> 
> All payment decisions prioritize user experience over cost minimization.
> Users should see their local currency, pay exact amounts, and never be surprised by FX fees on their statement.

---

## Overview

This document consolidates all regional payment method research for Stripe integration planning. Using **Stripe Payment Element**, most methods are automatically displayed based on user location.

### Scope
- **Included**: Europe, Americas, Africa, Asia-Pacific, Special Regions
- **Excluded**: China, Japan, Australia, India (per business decision)

### Bottom Line Cost

| Transaction Type | Fee |
|------------------|-----|
| US customer (domestic) | 2.9% + $0.30 |
| Foreign customer (local currency) | 5.4% + $0.30 |
| **Extra cost for foreign** | **+2.5%** |

We absorb the 2.5% to deliver fanatical UX. No surprise fees for users.

### Related Documents
| Document | Coverage |
|----------|----------|
| `EUROPEAN_PAYMENT_METHODS_STRIPE.md` | EU, UK, Scandinavia, Switzerland |
| `AMERICAS_PAYMENT_METHODS_STRIPE.md` | USA, Canada, Mexico, Brazil, Latin America |
| `AFRICA_PAYMENT_METHODS_STRIPE.md` | Nigeria, South Africa, Ghana, Kenya |
| `ASIA_OCEANIA_PAYMENT_METHODS_STRIPE.md` | Southeast Asia, East Asia, New Zealand |
| `SPECIAL_REGIONS_PAYMENT_METHODS_STRIPE.md` | Middle East, Caribbean, Territories, Edge Cases |

---

# EXECUTIVE SUMMARY

## Total Payment Methods Identified

| Category | Count | Notes |
|----------|-------|-------|
| **Stripe-Native** | 45+ | Enable in Dashboard, works with Payment Element |
| **Requires Paystack** | 8 | Africa (Stripe-owned, separate integration) |
| **Requires Alternative** | 15+ | Local e-wallets needing separate processors |
| **Already Implemented** | 6 | Cards, ACH, Link, Apple Pay, Google Pay, PayPal |

## Currencies Required

| Priority | Currencies | Count |
|----------|------------|-------|
| **Already Supported** | USD | 1 |
| **High Priority** | EUR, GBP, CAD | 3 |
| **Medium Priority** | MXN, BRL, PLN, SGD, MYR, THB, HKD, NZD | 8 |
| **Lower Priority** | SEK, DKK, CHF, NOK, NGN, ZAR, GHS, KES, IDR, PHP, VND, KRW, TWD, AED, ILS, TRY | 16 |
| **Total New Currencies** | 27 | |

---

# STRIPE-NATIVE METHODS BY REGION

## Europe (13 methods)

| Method | API Name | Countries | Priority |
|--------|----------|-----------|----------|
| **SEPA Direct Debit** | `sepa_debit` | All SEPA (36 countries) | High |
| **iDEAL** | `ideal` | Netherlands | High |
| **Bancontact** | `bancontact` | Belgium | High |
| **Sofort** | `sofort` | Germany, Austria, Belgium, NL | High |
| **Przelewy24** | `p24` | Poland | High |
| **Blik** | `blik` | Poland | High |
| **EPS** | `eps` | Austria | High |
| **Klarna** | `klarna` | 16 EU countries | Medium |
| **Multibanco** | `multibanco` | Portugal | Medium |
| **Swish** | `swish` | Sweden | Medium |
| **MobilePay** | `mobilepay` | Denmark, Finland | Medium |
| **MB WAY** | `mb_way` | Portugal | Medium |
| **Twint** | `twint` | Switzerland | Medium |

**Note**: Giropay discontinued Dec 2024 - do not implement.

---

## North America (12 methods)

| Method | API Name | Countries | Priority |
|--------|----------|-----------|----------|
| **Cards** | `card` | USA, Canada, Mexico | Implemented |
| **ACH Direct Debit** | `us_bank_account` | USA | Implemented |
| **Link** | `link` | USA, Canada | Implemented |
| **Apple Pay** | via `card` | USA, Canada, Mexico | Implemented |
| **Google Pay** | via `card` | USA, Canada, Mexico | Implemented |
| **PayPal** | `paypal` | Global | Implemented |
| **Affirm** | `affirm` | USA, Canada | Medium |
| **Afterpay** | `afterpay_clearpay` | USA, Canada | Medium |
| **Klarna** | `klarna` | USA, Canada | Medium |
| **Cash App Pay** | `cashapp` | USA | Medium |
| **Canadian PAD** | `acss_debit` | Canada | Medium |
| **Interac** | `interac_present` | Canada | Low |

---

## Latin America (5 methods)

| Method | API Name | Countries | Priority |
|--------|----------|-----------|----------|
| **OXXO** | `oxxo` | Mexico | High |
| **Boleto** | `boleto` | Brazil | High |
| **Pix** | `pix` | Brazil | High |
| **Cards (local)** | `card` | Brazil (Elo, Hipercard) | Medium |
| **Bank Transfer** | `customer_balance` | Mexico | Low |

---

## Asia-Pacific (10 methods) - Excl. China, Japan, Australia, India

| Method | API Name | Countries | Priority |
|--------|----------|-----------|----------|
| **PayNow** | `paynow` | Singapore | High |
| **FPX** | `fpx` | Malaysia | High |
| **PromptPay** | `promptpay` | Thailand | High |
| **GrabPay** | `grabpay` | Singapore, Malaysia, Philippines | High |
| **Cards** | `card` | All countries | High |
| **NZ BECS** | `nz_bank_account` | New Zealand | Medium |
| **Kakao Pay** | Check availability | South Korea | Low |
| **Naver Pay** | Check availability | South Korea | Low |
| **LINE Pay** | Check availability | Taiwan | Low |
| **FPS** | Check availability | Hong Kong | Low |

---

## Middle East (3 methods)

| Method | API Name | Countries | Priority |
|--------|----------|-----------|----------|
| **Cards** | `card` | UAE, Israel | High |
| **Apple Pay** | via `card` | UAE | High |
| **Google Pay** | via `card` | UAE | High |

---

# REQUIRES SEPARATE INTEGRATION

## Africa - Via Paystack (Stripe-owned)

| Method | Countries | Priority |
|--------|-----------|----------|
| **Nigerian Cards** | Nigeria | High |
| **Nigerian Bank Transfer** | Nigeria | High |
| **USSD** | Nigeria | High |
| **M-Pesa** | Kenya | High |
| **South African Cards** | South Africa | High |
| **Instant EFT** | South Africa | High |
| **Ghanaian Mobile Money** | Ghana | High |
| **Ghanaian Cards** | Ghana | Medium |

**Integration**: Paystack is separate API from Stripe main.

---

## Southeast Asia - Via Xendit/Midtrans/PayMongo

| Method | Countries | Processor |
|--------|-----------|-----------|
| **GoPay** | Indonesia | Xendit/Midtrans |
| **OVO** | Indonesia | Xendit/Midtrans |
| **Dana** | Indonesia | Xendit/Midtrans |
| **GCash** | Philippines | PayMongo |
| **Maya** | Philippines | PayMongo |
| **MoMo** | Vietnam | Direct integration |
| **ZaloPay** | Vietnam | Direct integration |
| **Touch 'n Go** | Malaysia | Check availability |

---

# IMPLEMENTATION ROADMAP

## Phase 1: Enable Stripe Dashboard Methods (Week 1-2)

**Zero code changes - just enable in Stripe Dashboard:**

| Region | Methods to Enable |
|--------|-------------------|
| **Europe** | SEPA, iDEAL, Bancontact, Sofort, P24, Blik, EPS |
| **Asia** | PayNow, FPX, PromptPay, GrabPay |
| **LATAM** | OXXO, Boleto, Pix |

**Immediate benefit**: Stripe Payment Element automatically shows these to users in relevant countries.

---

## Phase 2: Multi-Currency Support (Week 2-4)

### UX Goal
Users see prices in their local currency. No mental math. No surprises.

### Code Changes Required

```typescript
// Current (hardcoded USD)
currency: 'usd'

// Updated (dynamic - fanatical UX)
currency: getCurrencyForCountry(userCountry) // 'eur', 'gbp', etc.
```

### Priority Currencies

| Tier | Currencies | Markets | Extra Cost |
|------|------------|---------|------------|
| **Tier 1** | EUR | Eurozone (19 countries) | +2.5% |
| **Tier 1** | GBP | UK | +2.5% |
| **Tier 1** | CAD | Canada | +2.5% |
| **Tier 2** | MXN, BRL | Mexico, Brazil | +2.5% |
| **Tier 2** | PLN | Poland | +2.5% |
| **Tier 2** | SGD, MYR, THB | Southeast Asia | +2.5% |

**Note**: We absorb the extra cost. Users never see USD unless they're in the US.

### Files to Update

- `lib/stripe/stripeService.ts` - Dynamic currency
- `lib/stripe/stripeTypes.ts` - Add currency types
- `pages/api/stripe/payment-intent.ts` - Accept currency param
- `components/vx2/modals/DepositModalVX2.tsx` - Currency display

---

## Phase 3: BNPL Evaluation (Week 4-6)

| Method | Fee | UX Consideration |
|--------|-----|------------------|
| **Affirm** | 5.99% + $0.30 | Users can split large deposits |
| **Afterpay** | 6% + $0.30 | Popular with younger users |
| **Klarna** | Variable | Multiple payment plans |

**UX Lens**: Some users prefer installment options. Higher fees, but if it removes friction for a segment of users, consider it.

**Decision needed**: 
- Do users want to split fantasy deposits into installments?
- Regulatory considerations for gaming
- Higher merchant fees (but UX-first means we'd absorb them)

---

## Phase 4: Africa via Paystack (Week 6-8)

| Task | Description |
|------|-------------|
| Create Paystack account | Separate from Stripe |
| Integrate Paystack SDK | Frontend + webhooks |
| Support African currencies | NGN, ZAR, GHS, KES |
| Handle M-Pesa flow | Push notification confirmation |
| Handle USSD flow | Code-based payment |

---

## Phase 5: Southeast Asia Alternatives (Week 8-12)

| Market | Processor | Methods |
|--------|-----------|---------|
| **Indonesia** | Xendit or Midtrans | GoPay, OVO, Dana |
| **Philippines** | PayMongo | GCash, Maya |
| **Vietnam** | Direct MoMo integration | MoMo, ZaloPay |

**Evaluate**: Is market demand sufficient to justify integration complexity?

---

# PAYMENT ELEMENT CONFIGURATION

## Recommended Setup

```typescript
<PaymentElement 
  options={{
    layout: isMobile ? 'accordion' : 'tabs',
    paymentMethodOrder: [
      // Global
      'card',
      'paypal',
      'link',
      
      // Europe (auto-shown by location)
      'ideal',
      'bancontact', 
      'sepa_debit',
      'sofort',
      'eps',
      'p24',
      'blik',
      
      // Asia (auto-shown by location)
      'grabpay',
      'paynow',
      'fpx',
      'promptpay',
      
      // LATAM (auto-shown by location)
      'oxxo',
      'boleto',
      'pix',
      
      // BNPL (if enabled)
      'affirm',
      'afterpay_clearpay',
      'klarna',
    ],
  }}
/>
```

**Key Point**: You don't show 20+ methods to each user. Stripe automatically filters to show only 5-7 relevant options based on user location.

---

# QUICK REFERENCE

## What Users See by Country (Fanatical UX)

| Country | Currency | Methods Displayed | Experience |
|---------|----------|-------------------|------------|
| **USA** | USD | Card, PayPal, Link, Apple Pay, Google Pay, ACH | Native |
| **UK** | GBP | Card, PayPal, Apple Pay, Google Pay | Sees £, pays £ |
| **Germany** | EUR | Card, Sofort, SEPA, PayPal, Klarna | Sees €, pays € |
| **Netherlands** | EUR | iDEAL, Card, PayPal, Klarna | Sees €, pays € |
| **Belgium** | EUR | Bancontact, Card, SEPA, PayPal | Sees €, pays € |
| **Poland** | PLN | Przelewy24, Blik, Card, PayPal | Sees zł, pays zł |
| **Singapore** | SGD | PayNow, GrabPay, Card, PayPal | Sees S$, pays S$ |
| **Malaysia** | MYR | FPX, GrabPay, Card, PayPal | Sees RM, pays RM |
| **Thailand** | THB | PromptPay, Card, PayPal | Sees ฿, pays ฿ |
| **Mexico** | MXN | OXXO, Card, PayPal | Sees $, pays $ (MXN) |
| **Brazil** | BRL | Pix, Boleto, Card, PayPal | Sees R$, pays R$ |

**Key**: Every user sees their local currency. No surprises. No mental math.

---

## Sanctioned/Restricted - DO NOT SUPPORT

- Russia
- Belarus
- Iran
- North Korea
- Cuba
- Syria
- Crimea

---

## Method Types Summary

| Type | Examples | Settlement |
|------|----------|------------|
| **Cards** | Visa, MC, Amex | 2 days |
| **Bank Redirect** | iDEAL, FPX, Sofort | Immediate |
| **Bank Debit** | SEPA, ACH | 3-14 days |
| **Real-time** | PayNow, PromptPay, Pix | Immediate |
| **Voucher** | OXXO, Boleto | When paid (1-3 days) |
| **Wallet** | PayPal, GrabPay | Immediate |
| **BNPL** | Klarna, Affirm | Immediate to merchant |
| **Mobile Money** | M-Pesa, GCash | Immediate |

---

# COST SUMMARY

## Deposits (Money In)

| Customer | Fee | You Net (on $25) |
|----------|-----|------------------|
| **US (USD)** | 2.9% + $0.30 | $23.97 |
| **International** | 5.4% + $0.30 | $23.35 |
| **Extra for international** | +2.5% | -$0.62 |

## Withdrawals (Money Out)

| Customer | Fee | They Get (on $100) |
|----------|-----|-------------------|
| **US (USD)** | ~0.5% | $100 |
| **International** | ~2% | €100 (local currency) |

### Withdrawal Fee Breakdown

| Component | Domestic | International |
|-----------|----------|---------------|
| Payout to bank | $0.25 + 0.25% | $0.25 + 0.25% |
| Cross-border | - | +0.25% to 1% |
| Currency conversion | - | +1% |
| **Total** | **~0.5%** | **~2%** |

## Complete Cost Picture

| Direction | Domestic | International | Extra |
|-----------|----------|---------------|-------|
| **Deposit** | 2.9% + $0.30 | 5.4% + $0.30 | +2.5% |
| **Withdrawal** | ~0.5% | ~2% | +1.5% |

**UX-First Decision**: We absorb all fees. Users see exact amounts in their currency.

---

## Stripe Fees by Method Type

| Method Type | Typical Fee | Notes |
|-------------|-------------|-------|
| **Cards (domestic)** | 2.9% + $0.30 | US cards |
| **Cards (foreign)** | 5.4% + $0.30 | Includes cross-border + conversion |
| **ACH** | 0.8% (cap $5) | Lower cost |
| **SEPA** | 0.8% (cap €5) | Lower cost |
| **iDEAL** | €0.29 flat | Low cost |
| **Bancontact** | 1.4% + €0.25 | Medium |
| **PayPal** | 3.49% + $0.49 | Higher |
| **BNPL** | 5-6% + $0.30 | Highest |
| **Pix** | 0.99% | Very low |
| **OXXO** | 3% + MXN$10 | Medium |

## Currency Strategy

| Approach | Decision |
|----------|----------|
| Accept local currencies | **Yes** - users see familiar amounts |
| Convert to USD | **Yes** - simplifies accounting |
| Absorb conversion fee | **Yes** - cost of great UX |
| Show USD to foreign users | **Never** - poor experience |

---

# IMPLEMENTATION CHECKLIST

## Stripe Dashboard (No Code)
- [ ] Enable SEPA Direct Debit
- [ ] Enable iDEAL
- [ ] Enable Bancontact
- [ ] Enable Sofort
- [ ] Enable Przelewy24
- [ ] Enable Blik
- [ ] Enable EPS
- [ ] Enable PayNow
- [ ] Enable FPX
- [ ] Enable PromptPay
- [ ] Enable GrabPay
- [ ] Enable OXXO
- [ ] Enable Boleto
- [ ] Enable Pix

## Code Changes
- [ ] Dynamic currency support
- [ ] Currency detection by user location
- [ ] Update minimum amounts per currency
- [ ] Update PaymentMethodType enum
- [ ] Update ALLOWED_PAYMENT_METHODS constant
- [ ] Handle async payment confirmations (webhooks)
- [ ] Currency formatting in UI

## Separate Integrations (If Needed)
- [ ] Paystack for Africa
- [ ] Xendit/Midtrans for Indonesia
- [ ] PayMongo for Philippines
- [ ] MoMo for Vietnam

---

# APPENDIX: ALL CURRENCIES

| Code | Name | Region | Decimals |
|------|------|--------|----------|
| USD | US Dollar | Americas | 2 |
| EUR | Euro | Europe | 2 |
| GBP | British Pound | UK | 2 |
| CAD | Canadian Dollar | Canada | 2 |
| MXN | Mexican Peso | Mexico | 2 |
| BRL | Brazilian Real | Brazil | 2 |
| PLN | Polish Zloty | Poland | 2 |
| SEK | Swedish Krona | Sweden | 2 |
| DKK | Danish Krone | Denmark | 2 |
| NOK | Norwegian Krone | Norway | 2 |
| CHF | Swiss Franc | Switzerland | 2 |
| SGD | Singapore Dollar | Singapore | 2 |
| MYR | Malaysian Ringgit | Malaysia | 2 |
| THB | Thai Baht | Thailand | 2 |
| IDR | Indonesian Rupiah | Indonesia | 0 |
| PHP | Philippine Peso | Philippines | 2 |
| VND | Vietnamese Dong | Vietnam | 0 |
| KRW | Korean Won | South Korea | 0 |
| TWD | Taiwan Dollar | Taiwan | 2 |
| HKD | Hong Kong Dollar | Hong Kong | 2 |
| NZD | New Zealand Dollar | New Zealand | 2 |
| AED | UAE Dirham | UAE | 2 |
| ILS | Israeli Shekel | Israel | 2 |
| TRY | Turkish Lira | Turkey | 2 |
| NGN | Nigerian Naira | Nigeria | 2 |
| ZAR | South African Rand | South Africa | 2 |
| GHS | Ghanaian Cedi | Ghana | 2 |
| KES | Kenyan Shilling | Kenya | 2 |

---

# SUMMARY: THE UX-FIRST APPROACH

| Principle | Implementation |
|-----------|----------------|
| Users see local currency | Always (never show USD to non-US users) |
| Users pay exact amount shown | Always (no FX surprises on statement) |
| Local payment methods | Automatically shown by Stripe Payment Element |
| Conversion fees | We absorb them (+2.5% for foreign) |
| Cross-border fees | We absorb them (unavoidable anyway) |

**The cost of fanatical UX**: ~2.5% extra on foreign transactions.

**The value**: Users trust us. They come back. They don't dispute charges.

---

*Document created: January 6, 2026*
*Master summary of global payment method research*
*Philosophy: Fanatical about user experience*

