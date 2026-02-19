# Americas Payment Methods - Stripe Integration Plan

## Overview

This document lists all North and South American payment methods supported by Stripe Payment Element for future integration. Using Stripe Payment Element, these methods will be automatically displayed to users based on their location.

---

# NORTH AMERICA

## Tier 1: High Priority (Core methods, already partially implemented)

### 1. Credit/Debit Cards
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Countries** | USA, Canada, Mexico |
| **Currency** | USD, CAD, MXN |
| **Card brands** | Visa, Mastercard, American Express, Discover, Diners Club, JCB, UnionPay |
| **Settlement** | 2 business days |
| **Typical fees** | 2.9% + $0.30 (US) |
| **Status** | Already implemented |

### 2. ACH Direct Debit
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `us_bank_account` |
| **Countries** | USA |
| **Currency** | USD |
| **Payment type** | Bank debit |
| **Settlement** | 4-5 business days |
| **Typical fees** | 0.8% capped at $5 |
| **Use case** | Large transactions, recurring payments, B2B |
| **Notes** | Lower fees than cards; requires verification |
| **Status** | Already implemented |

### 3. Link (Stripe)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `link` |
| **Countries** | USA, Canada |
| **Currency** | USD, CAD |
| **Payment type** | Saved payment accelerator |
| **Settlement** | Same as underlying method |
| **Typical fees** | Same as card (no additional fee) |
| **Use case** | Faster checkout for returning customers |
| **Notes** | Stripe's one-click checkout; saves card details |
| **Status** | Already implemented |

### 4. Apple Pay
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `apple_pay` (via card) |
| **Countries** | USA, Canada, Mexico |
| **Currency** | USD, CAD, MXN |
| **Payment type** | Digital wallet |
| **Settlement** | 2 business days |
| **Typical fees** | Same as card |
| **Notes** | Auto-displayed on iOS/Safari devices |
| **Status** | Already implemented |

### 5. Google Pay
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `google_pay` (via card) |
| **Countries** | USA, Canada, Mexico |
| **Currency** | USD, CAD, MXN |
| **Payment type** | Digital wallet |
| **Settlement** | 2 business days |
| **Typical fees** | Same as card |
| **Notes** | Auto-displayed on Android/Chrome |
| **Status** | Already implemented |

### 6. PayPal
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `paypal` |
| **Countries** | USA, Canada, Mexico + 200 countries |
| **Currency** | Multi-currency |
| **Payment type** | Digital wallet |
| **Settlement** | Immediate |
| **Typical fees** | 3.49% + $0.49 (PayPal via Stripe) |
| **Notes** | Widely trusted; guest checkout available |
| **Status** | Already implemented |

---

## Tier 2: Medium Priority (Recommended additions)

### 7. Affirm
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `affirm` |
| **Countries** | USA, Canada |
| **Currency** | USD, CAD |
| **Payment type** | Buy Now Pay Later (BNPL) |
| **Settlement** | Immediate (Affirm pays merchant) |
| **Typical fees** | 5.99% + $0.30 |
| **Min/Max** | $50 - $30,000 |
| **Notes** | Popular for larger purchases; 0% APR options available |

### 8. Afterpay / Clearpay
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `afterpay_clearpay` |
| **Countries** | USA, Canada |
| **Currency** | USD, CAD |
| **Payment type** | Buy Now Pay Later (BNPL) |
| **Settlement** | Immediate |
| **Typical fees** | 6% + $0.30 |
| **Min/Max** | $1 - $2,000 |
| **Notes** | Pay in 4 installments; popular with younger demographics |

### 9. Klarna (North America)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `klarna` |
| **Countries** | USA, Canada |
| **Currency** | USD, CAD |
| **Payment type** | Buy Now Pay Later (BNPL) |
| **Settlement** | Immediate |
| **Typical fees** | Variable |
| **Notes** | Multiple payment plans; Pay in 4, Pay in 30 days |

### 10. Cash App Pay
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `cashapp` |
| **Countries** | USA |
| **Currency** | USD |
| **Payment type** | Digital wallet / Real-time |
| **Settlement** | Immediate |
| **Typical fees** | 2.9% + $0.30 |
| **Users** | 50M+ active users |
| **Notes** | Popular among younger US demographics |

### 11. Canadian Pre-Authorized Debits (PAD)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `acss_debit` |
| **Countries** | Canada |
| **Currency** | CAD |
| **Payment type** | Bank debit |
| **Settlement** | 5 business days |
| **Typical fees** | 0.8% capped at CAD $5 |
| **Use case** | Recurring payments in Canada |
| **Notes** | Canadian equivalent of ACH |

### 12. Interac (Canada)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `interac_present` (in-person) |
| **Countries** | Canada |
| **Currency** | CAD |
| **Payment type** | Debit network |
| **Notes** | Primarily for in-person; limited online support via Stripe |

---

# SOUTH AMERICA / LATIN AMERICA

## Tier 1: High Priority (Major markets)

### 13. OXXO (Mexico)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `oxxo` |
| **Countries** | Mexico |
| **Currency** | MXN |
| **Payment type** | Cash voucher |
| **Settlement** | When customer pays (1-3 days typical) |
| **Typical fees** | 3% + MXN $10 |
| **Market share** | Essential for unbanked Mexican customers |
| **Notes** | Customer pays at 19,000+ OXXO stores; voucher expires in 1-3 days |

### 14. Boleto Bancario (Brazil)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `boleto` |
| **Countries** | Brazil |
| **Currency** | BRL |
| **Payment type** | Bank slip / Voucher |
| **Settlement** | When customer pays (up to 3 days) |
| **Typical fees** | Variable |
| **Market share** | ~15% of Brazilian e-commerce |
| **Notes** | Customer pays at banks, ATMs, or online banking; essential for Brazil |

### 15. Pix (Brazil)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `pix` |
| **Countries** | Brazil |
| **Currency** | BRL |
| **Payment type** | Instant bank transfer |
| **Settlement** | Immediate |
| **Typical fees** | 0.99% |
| **Market share** | Fastest-growing payment method in Brazil |
| **Notes** | Real-time payments via QR code or key; 140M+ users |

---

## Tier 2: Medium Priority (Secondary markets)

### 16. Mexico Bank Transfer (SPEI)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `customer_balance` (bank transfer) |
| **Countries** | Mexico |
| **Currency** | MXN |
| **Payment type** | Bank transfer |
| **Settlement** | 1-2 business days |
| **Notes** | Direct bank transfers via SPEI network |

### 17. Local Cards (Brazil)
| Attribute | Value |
|-----------|-------|
| **Card networks** | Elo, Hipercard |
| **Countries** | Brazil |
| **Currency** | BRL |
| **Payment type** | Local debit/credit cards |
| **Notes** | Brazilian domestic card networks; enable via Stripe Dashboard |

---

## Tier 3: Consider for Future (Expansion markets)

### 18. PSE - Pagos Seguros en Linea (Colombia)
| Attribute | Value |
|-----------|-------|
| **Countries** | Colombia |
| **Currency** | COP |
| **Payment type** | Bank transfer |
| **Notes** | Primary online payment method in Colombia |

### 19. Rapipago / Pago Facil (Argentina)
| Attribute | Value |
|-----------|-------|
| **Countries** | Argentina |
| **Currency** | ARS |
| **Payment type** | Cash voucher |
| **Notes** | Popular cash payment networks in Argentina |

### 20. Mercado Pago
| Attribute | Value |
|-----------|-------|
| **Countries** | Argentina, Brazil, Chile, Colombia, Mexico, Peru, Uruguay |
| **Currency** | Multi-currency |
| **Payment type** | Digital wallet |
| **Notes** | Not directly through Stripe; separate integration required |

---

## Summary by Country

| Country | Recommended Methods | Priority |
|---------|---------------------|----------|
| **USA** | Card, ACH, Link, Apple Pay, Google Pay, PayPal, Affirm, Afterpay, Cash App | High |
| **Canada** | Card, PAD, Link, Apple Pay, Google Pay, PayPal, Affirm, Afterpay, Interac | High |
| **Mexico** | Card, OXXO, Apple Pay, Google Pay, PayPal, Bank Transfer | High |
| **Brazil** | Card, Pix, Boleto, Elo, Hipercard, Apple Pay, Google Pay | High |
| **Colombia** | Card, PSE, PayPal | Medium |
| **Argentina** | Card, Rapipago, Pago Facil, PayPal | Low |
| **Chile** | Card, PayPal | Medium |
| **Peru** | Card, PayPal | Medium |

---

## Implementation Checklist

### Phase 1: Already Implemented (Verify working)
- [x] Credit/Debit Cards
- [x] ACH Direct Debit (US)
- [x] Link
- [x] Apple Pay
- [x] Google Pay
- [x] PayPal

### Phase 2: BNPL (If fits business model)
- [ ] Enable Affirm in Stripe Dashboard
- [ ] Enable Afterpay/Clearpay in Stripe Dashboard
- [ ] Enable Klarna in Stripe Dashboard
- [ ] Evaluate BNPL fit for fantasy sports deposits

### Phase 3: US Additions
- [ ] Enable Cash App Pay in Stripe Dashboard

### Phase 4: Canada Additions
- [ ] Enable Canadian PAD (acss_debit) in Stripe Dashboard

### Phase 5: Mexico Market
- [ ] Enable OXXO in Stripe Dashboard
- [ ] Support MXN currency
- [ ] Configure voucher expiration handling

### Phase 6: Brazil Market
- [ ] Enable Pix in Stripe Dashboard
- [ ] Enable Boleto in Stripe Dashboard
- [ ] Enable Elo and Hipercard cards
- [ ] Support BRL currency
- [ ] Handle async payment confirmation (Boleto)

### Code Changes Required
- [ ] Support MXN currency for Mexico
- [ ] Support BRL currency for Brazil
- [ ] Support CAD currency for Canada (if not already)
- [ ] Handle voucher-based payment flows (OXXO, Boleto)
- [ ] Handle async payment confirmation webhooks
- [ ] Update minimum amounts per currency

---

## Technical Notes

### Payment Element Configuration (Americas)
```typescript
<PaymentElement 
  options={{
    layout: 'tabs',
    paymentMethodOrder: [
      'card',
      'link',
      'paypal',
      'us_bank_account',  // ACH
      'affirm',
      'afterpay_clearpay',
      'cashapp',
      'oxxo',            // Mexico - auto-shown
      'boleto',          // Brazil - auto-shown
      'pix',             // Brazil - auto-shown
    ],
  }}
/>
```

### Async Payment Methods
Some methods require special handling for delayed payment confirmation:

| Method | Flow |
|--------|------|
| **OXXO** | Create intent -> Customer gets voucher -> Pays at store -> Webhook confirms |
| **Boleto** | Create intent -> Customer gets slip -> Pays at bank -> Webhook confirms |
| **ACH** | Create intent -> Verify bank -> Debit initiated -> 4-5 days to confirm |

### Currency Support Required
| Currency | Countries |
|----------|-----------|
| USD | USA |
| CAD | Canada |
| MXN | Mexico |
| BRL | Brazil |

### BNPL Considerations
Buy Now Pay Later services have specific requirements:
- Higher merchant fees (5-6%)
- Minimum transaction amounts
- Product category restrictions
- Age verification requirements
- May not be suitable for gambling/gaming in some jurisdictions

---

## References

- [Stripe Payment Method Support](https://docs.stripe.com/payments/payment-methods/payment-method-support)
- [Stripe Payment Element Docs](https://docs.stripe.com/payments/payment-element)
- [Stripe Pricing](https://stripe.com/pricing)
- [Stripe OXXO](https://docs.stripe.com/payments/oxxo)
- [Stripe Boleto](https://docs.stripe.com/payments/boleto)
- [Stripe Pix](https://docs.stripe.com/payments/pix)

---

*Document created: January 6, 2026*
*For integration planning purposes*

