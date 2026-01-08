# European Payment Methods - Stripe Integration Plan

## Overview

This document lists all European payment methods supported by Stripe Payment Element for future integration. Using Stripe Payment Element (Option 1), these methods will be automatically displayed to users based on their location.

---

## Tier 1: High Priority (High adoption, major markets)

### 1. SEPA Direct Debit
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `sepa_debit` |
| **Countries** | All 36 SEPA countries (EU + EEA + Switzerland, Monaco, etc.) |
| **Currency** | EUR |
| **Payment type** | Bank debit (recurring-friendly) |
| **Settlement** | 5-14 business days |
| **Typical fees** | 0.8% capped at EUR 5 |
| **Use case** | Subscriptions, recurring payments |
| **Notes** | Excellent for recurring billing across Europe |

### 2. iDEAL
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `ideal` |
| **Countries** | Netherlands |
| **Currency** | EUR |
| **Payment type** | Bank redirect |
| **Settlement** | Immediate |
| **Typical fees** | EUR 0.29 per transaction |
| **Market share** | ~70% of Dutch e-commerce |
| **Notes** | Essential for Netherlands market |

### 3. Bancontact
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `bancontact` |
| **Countries** | Belgium |
| **Currency** | EUR |
| **Payment type** | Card/Bank redirect |
| **Settlement** | Immediate |
| **Typical fees** | 1.4% + EUR 0.25 |
| **Market share** | 15M+ active users |
| **Notes** | Leading payment method in Belgium |

### 4. Sofort
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `sofort` |
| **Countries** | Germany, Austria, Belgium, Netherlands, Spain, Italy |
| **Currency** | EUR |
| **Payment type** | Bank redirect |
| **Settlement** | 2-14 business days |
| **Typical fees** | 1.4% + EUR 0.25 |
| **Notes** | Instant bank transfer, popular in DACH region |

### 5. Przelewy24 (P24)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `p24` |
| **Countries** | Poland |
| **Currency** | PLN, EUR |
| **Payment type** | Bank redirect |
| **Settlement** | Immediate |
| **Typical fees** | 2.2% |
| **Notes** | Major Polish payment method |

### 6. Blik
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `blik` |
| **Countries** | Poland |
| **Currency** | PLN |
| **Payment type** | Mobile payment (6-digit code) |
| **Settlement** | Immediate |
| **Typical fees** | 1.9% |
| **Notes** | Fast-growing Polish mobile payment |

### 7. EPS
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `eps` |
| **Countries** | Austria |
| **Currency** | EUR |
| **Payment type** | Bank redirect |
| **Settlement** | Immediate |
| **Typical fees** | 1.6% |
| **Notes** | Preferred Austrian online payment |

---

## Tier 2: Medium Priority (Regional importance)

### 8. Klarna
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `klarna` |
| **Countries** | Austria, Belgium, Denmark, Finland, France, Germany, Ireland, Italy, Netherlands, Norway, Poland, Portugal, Spain, Sweden, Switzerland, UK |
| **Currency** | Multi-currency |
| **Payment type** | Buy Now Pay Later (BNPL) |
| **Settlement** | Immediate (Klarna pays merchant) |
| **Typical fees** | Variable by country/product |
| **Notes** | BNPL leader in Europe; consider if fits business model |

### 9. Multibanco
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `multibanco` |
| **Countries** | Portugal |
| **Currency** | EUR |
| **Payment type** | Bank reference (voucher) |
| **Settlement** | When customer pays (up to 7 days) |
| **Typical fees** | 2% |
| **Notes** | Integral to Portuguese banking |

### 10. Swish
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `swish` |
| **Countries** | Sweden |
| **Currency** | SEK |
| **Payment type** | Mobile payment |
| **Settlement** | Immediate |
| **Typical fees** | 2.9% + SEK 1.80 |
| **Notes** | Dominant in Sweden |

### 11. MobilePay
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `mobilepay` |
| **Countries** | Denmark, Finland |
| **Currency** | DKK, EUR |
| **Payment type** | Mobile payment |
| **Settlement** | Immediate |
| **Typical fees** | 1% |
| **Notes** | Popular Scandinavian mobile wallet |

### 12. MB WAY
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `mb_way` |
| **Countries** | Portugal |
| **Currency** | EUR |
| **Payment type** | Mobile payment |
| **Settlement** | Immediate |
| **Typical fees** | 2% |
| **Notes** | Growing Portuguese mobile payment |

### 13. Twint
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `twint` |
| **Countries** | Switzerland |
| **Currency** | CHF |
| **Payment type** | Mobile payment |
| **Settlement** | Immediate |
| **Typical fees** | 1.3% |
| **Market share** | ~80% of Swiss online shops |
| **Notes** | Dominant Swiss mobile payment |

---

## Tier 3: Consider for Future (Lower priority or deprecated)

### 14. Giropay (DEPRECATED)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `giropay` |
| **Countries** | Germany |
| **Status** | DEPRECATED - Ended December 31, 2024 |
| **Replacement** | Wero (monitor adoption) |
| **Notes** | Do NOT implement - service discontinued |

### 15. PayPal (Already planned)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `paypal` |
| **Countries** | All European countries |
| **Currency** | Multi-currency |
| **Payment type** | Digital wallet |
| **Notes** | Already in your integration plan |

---

## Summary by Country

| Country | Recommended Methods | Priority |
|---------|---------------------|----------|
| **Netherlands** | iDEAL, SEPA, Card, PayPal | High |
| **Belgium** | Bancontact, SEPA, Card, PayPal | High |
| **Germany** | Sofort, SEPA, Card, PayPal, Klarna | High |
| **Austria** | EPS, Sofort, SEPA, Card, PayPal | High |
| **Poland** | Przelewy24, Blik, Card, PayPal | High |
| **Portugal** | Multibanco, MB WAY, SEPA, Card | Medium |
| **Sweden** | Swish, Card, Klarna, PayPal | Medium |
| **Denmark** | MobilePay, Card, PayPal | Medium |
| **Finland** | MobilePay, Card, PayPal | Medium |
| **Switzerland** | Twint, Card, PayPal | Medium |
| **France** | SEPA, Card, PayPal, Klarna | Medium |
| **Spain** | SEPA, Card, PayPal | Medium |
| **Italy** | SEPA, Card, PayPal | Medium |
| **Ireland** | SEPA, Card, PayPal | Medium |
| **Other EU** | SEPA, Card, PayPal | Standard |

---

## Implementation Checklist

### Phase 1: Core European Methods
- [ ] Enable SEPA Direct Debit in Stripe Dashboard
- [ ] Enable iDEAL in Stripe Dashboard
- [ ] Enable Bancontact in Stripe Dashboard
- [ ] Enable Przelewy24 in Stripe Dashboard
- [ ] Enable Blik in Stripe Dashboard
- [ ] Enable EPS in Stripe Dashboard
- [ ] Enable Sofort in Stripe Dashboard

### Phase 2: Scandinavian & Swiss Markets
- [ ] Enable Swish in Stripe Dashboard
- [ ] Enable MobilePay in Stripe Dashboard
- [ ] Enable Twint in Stripe Dashboard

### Phase 3: Portuguese Market
- [ ] Enable Multibanco in Stripe Dashboard
- [ ] Enable MB WAY in Stripe Dashboard

### Phase 4: BNPL (If applicable)
- [ ] Evaluate Klarna fit for business model
- [ ] Enable Klarna if approved

### Code Changes Required
- [ ] Support EUR currency in payment intents
- [ ] Support PLN currency for Poland
- [ ] Support SEK currency for Sweden
- [ ] Support DKK currency for Denmark
- [ ] Support CHF currency for Switzerland
- [ ] Update `PaymentMethodType` in `lib/stripe/stripeTypes.ts`
- [ ] Update `ALLOWED_PAYMENT_METHODS` in `pages/api/stripe/payment-intent.ts`
- [ ] Configure Payment Element with `paymentMethodOrder`
- [ ] Add currency detection based on user location
- [ ] Update minimum amounts per currency

---

## Technical Notes

### Payment Element Configuration
```typescript
// Payment Element automatically shows relevant methods based on:
// - Customer location (IP-based)
// - Transaction currency
// - Payment method availability
// - Device capabilities (Apple Pay, Google Pay)

<PaymentElement 
  options={{
    layout: 'tabs', // or 'accordion' for mobile
    paymentMethodOrder: [
      'card',
      'paypal',
      'ideal',
      'bancontact',
      'sofort',
      'sepa_debit',
      'eps',
      'p24',
      'blik',
      // Others auto-ordered by relevance
    ],
  }}
/>
```

### Currency Support Required
| Currency | Countries |
|----------|-----------|
| EUR | Most EU countries |
| PLN | Poland |
| SEK | Sweden |
| DKK | Denmark |
| CHF | Switzerland |
| NOK | Norway |
| GBP | UK |

### Stripe Dashboard Settings
1. Go to Stripe Dashboard > Settings > Payment methods
2. Enable each method individually
3. Payment Element will automatically display enabled methods

---

## References

- [Stripe Payment Method Support](https://docs.stripe.com/payments/payment-methods/payment-method-support)
- [Stripe Payment Element Docs](https://docs.stripe.com/payments/payment-element)
- [Stripe Pricing](https://stripe.com/pricing)

---

*Document created: January 6, 2026*
*For integration planning purposes*

