# Africa Payment Methods - Stripe Integration Plan

## Overview

Stripe's direct presence in Africa is limited compared to other regions. Most African payment processing is handled through **Paystack** (acquired by Stripe in 2020) and Stripe's extended network. This document outlines available options and considerations for African markets.

---

## Stripe Support Status in Africa

### Direct/Extended Network Support
| Country | Support Type | Payment Processing | Notes |
|---------|-------------|-------------------|-------|
| **South Africa** | Extended Network | Yes | Via Paystack partnership |
| **Nigeria** | Extended Network | Yes | Merchant of record solution |
| **Ghana** | Extended Network | Yes | Via Paystack |
| **Kenya** | Extended Network | Yes | Via Paystack |
| **Cote d'Ivoire** | Extended Network | Limited | Via partnerships |
| **Egypt** | Tax Support Only | Limited | Stripe Tax available |

### Stripe Tax Support (19 Countries)
Tax compliance support available (not full payment processing):
- Angola, Benin, Burkina Faso, Cameroon, Cape Verde
- Democratic Republic of Congo, Egypt, Ethiopia, Guinea
- Kenya, Mauritania, Morocco, Nigeria, Senegal
- South Africa, Tanzania, Uganda, Zambia, Zimbabwe

---

# TIER 1: Primary Markets (Stripe/Paystack Support)

## Nigeria

### 1. Nigerian Cards (Naira)
| Attribute | Value |
|-----------|-------|
| **Integration** | Stripe Extended Network / Paystack |
| **Currency** | NGN (Nigerian Naira) |
| **Card types** | Visa, Mastercard, Verve (local) |
| **Payment type** | Credit/Debit cards |
| **Notes** | Verve is a major local card network |

### 2. Nigerian Bank Transfer
| Attribute | Value |
|-----------|-------|
| **Integration** | Stripe Extended Network / Paystack |
| **Currency** | NGN |
| **Payment type** | Direct bank transfer |
| **Settlement** | Instant to 1 business day |
| **Notes** | Popular for larger transactions |

### 3. USSD
| Attribute | Value |
|-----------|-------|
| **Integration** | Paystack |
| **Currency** | NGN |
| **Payment type** | Mobile code-based payment |
| **Notes** | Works without internet; dial code to pay |

### 4. Mobile Money (Nigeria)
| Attribute | Value |
|-----------|-------|
| **Integration** | Paystack |
| **Currency** | NGN |
| **Providers** | OPay, PalmPay, Kuda |
| **Notes** | Growing rapidly in Nigeria |

---

## South Africa

### 5. South African Cards (ZAR)
| Attribute | Value |
|-----------|-------|
| **Integration** | Stripe Extended Network / Paystack |
| **Currency** | ZAR (South African Rand) |
| **Card types** | Visa, Mastercard, American Express |
| **Payment type** | Credit/Debit cards |
| **Notes** | Primary online payment method |

### 6. EFT (Electronic Funds Transfer)
| Attribute | Value |
|-----------|-------|
| **Integration** | Paystack |
| **Currency** | ZAR |
| **Payment type** | Bank transfer |
| **Settlement** | 1-2 business days |
| **Notes** | Common for B2B and larger purchases |

### 7. Instant EFT
| Attribute | Value |
|-----------|-------|
| **Integration** | Paystack (via Ozow, PayFast) |
| **Currency** | ZAR |
| **Payment type** | Real-time bank transfer |
| **Settlement** | Immediate |
| **Notes** | Instant bank-to-bank payments |

---

## Ghana

### 8. Ghanaian Cards (GHS)
| Attribute | Value |
|-----------|-------|
| **Integration** | Paystack |
| **Currency** | GHS (Ghanaian Cedi) |
| **Card types** | Visa, Mastercard |
| **Payment type** | Credit/Debit cards |

### 9. Mobile Money (Ghana)
| Attribute | Value |
|-----------|-------|
| **Integration** | Paystack |
| **Currency** | GHS |
| **Providers** | MTN Mobile Money, Vodafone Cash, AirtelTigo Money |
| **Payment type** | Mobile wallet |
| **Market share** | Very high - primary payment method |
| **Notes** | Essential for Ghana market |

---

## Kenya

### 10. Kenyan Cards (KES)
| Attribute | Value |
|-----------|-------|
| **Integration** | Paystack |
| **Currency** | KES (Kenyan Shilling) |
| **Card types** | Visa, Mastercard |
| **Payment type** | Credit/Debit cards |

### 11. M-Pesa
| Attribute | Value |
|-----------|-------|
| **Integration** | Paystack |
| **Currency** | KES |
| **Payment type** | Mobile money |
| **Users** | 30M+ active users in Kenya |
| **Market share** | Dominant - ~96% of mobile payments |
| **Notes** | ESSENTIAL for Kenya; most used payment method |

---

# TIER 2: Secondary Markets

## Egypt

### 12. Egyptian Cards
| Attribute | Value |
|-----------|-------|
| **Integration** | Limited (via international cards) |
| **Currency** | EGP (Egyptian Pound) |
| **Card types** | Visa, Mastercard |
| **Notes** | International cards work; local processing limited |

### 13. Fawry
| Attribute | Value |
|-----------|-------|
| **Integration** | Not via Stripe (requires separate integration) |
| **Currency** | EGP |
| **Payment type** | Cash voucher / Bill payment |
| **Notes** | Major Egyptian payment network; consider separate integration |

---

## Rwanda

### 14. MTN Mobile Money (Rwanda)
| Attribute | Value |
|-----------|-------|
| **Integration** | Limited Stripe support |
| **Currency** | RWF (Rwandan Franc) |
| **Payment type** | Mobile money |
| **Notes** | Growing fintech hub; may need alternative processor |

---

# TIER 3: Alternative Integration Required

For countries without Stripe/Paystack support, consider:

### Alternative Payment Processors

| Processor | Countries Covered | Notes |
|-----------|------------------|-------|
| **Paystack** | Nigeria, Ghana, South Africa, Kenya | Stripe-owned; primary recommendation |
| **Flutterwave** | 34 African countries | Major alternative; wide coverage |
| **Chipper Cash** | Nigeria, Ghana, Kenya, Uganda, Tanzania, Rwanda, South Africa | P2P and merchant payments |
| **DPO Group** | 20+ African countries | Enterprise-focused |
| **Cellulant** | 35 African countries | Mobile money specialist |

### Mobile Money Networks by Country

| Country | Primary Mobile Money | Secondary |
|---------|---------------------|-----------|
| **Kenya** | M-Pesa (Safaricom) | Airtel Money |
| **Tanzania** | M-Pesa, Tigo Pesa | Airtel Money |
| **Uganda** | MTN Mobile Money | Airtel Money |
| **Ghana** | MTN Mobile Money | Vodafone Cash |
| **Nigeria** | OPay, PalmPay | Paga |
| **Rwanda** | MTN Mobile Money | Airtel Money |
| **Zambia** | MTN Mobile Money | Airtel Money |
| **Zimbabwe** | EcoCash | OneMoney |

---

## Summary by Country

| Country | Stripe Support | Recommended Methods | Priority |
|---------|---------------|---------------------|----------|
| **Nigeria** | Extended Network | Cards, Bank Transfer, USSD, Mobile Money | High |
| **South Africa** | Extended Network | Cards, EFT, Instant EFT | High |
| **Ghana** | Paystack | Cards, Mobile Money (MTN) | High |
| **Kenya** | Paystack | M-Pesa, Cards | High |
| **Egypt** | Tax Only | International Cards (limited) | Medium |
| **Tanzania** | Tax Only | Requires Flutterwave/alternative | Low |
| **Uganda** | Tax Only | Requires Flutterwave/alternative | Low |
| **Rwanda** | None | Requires Flutterwave/alternative | Low |

---

## Implementation Checklist

### Phase 1: Paystack Integration (Stripe-owned)
- [ ] Set up Paystack account (separate from main Stripe)
- [ ] Enable Nigerian payment methods
- [ ] Enable South African payment methods
- [ ] Enable Ghanaian payment methods
- [ ] Enable Kenyan payment methods (M-Pesa)

### Phase 2: Currency Support
- [ ] Support NGN (Nigerian Naira)
- [ ] Support ZAR (South African Rand)
- [ ] Support GHS (Ghanaian Cedi)
- [ ] Support KES (Kenyan Shilling)

### Phase 3: Evaluate Alternative Processors
- [ ] Evaluate Flutterwave for broader African coverage
- [ ] Assess market demand for additional African countries
- [ ] Consider Cellulant for mobile money focus

### Code Changes Required
- [ ] Integrate Paystack SDK/API alongside Stripe
- [ ] Support multiple African currencies
- [ ] Handle mobile money payment flows
- [ ] Handle USSD payment confirmation
- [ ] Implement Paystack webhooks

---

## Technical Notes

### Paystack Integration
Paystack is separate from Stripe's main API but owned by Stripe. Integration requires:

```javascript
// Paystack is a separate integration from Stripe
// Different API, different dashboard, different SDK

// Paystack Inline (Frontend)
const handler = PaystackPop.setup({
  key: 'pk_live_xxxxx',
  email: customer.email,
  amount: amountInKobo, // Nigerian: kobo (100 kobo = 1 NGN)
  currency: 'NGN', // or 'GHS', 'ZAR', 'KES'
  callback: function(response) {
    // Payment complete
  },
});
handler.openIframe();
```

### Currency Units
| Currency | Unit | Multiplier |
|----------|------|------------|
| NGN | Kobo | 100 kobo = 1 NGN |
| ZAR | Cents | 100 cents = 1 ZAR |
| GHS | Pesewas | 100 pesewas = 1 GHS |
| KES | Cents | 100 cents = 1 KES |

### Mobile Money Flow
1. Customer initiates payment
2. Customer receives push notification on phone
3. Customer enters PIN to confirm
4. Payment confirmed via webhook
5. Async confirmation required

### USSD Flow (Nigeria)
1. Customer initiates payment
2. System generates USSD code (e.g., *737*xxx#)
3. Customer dials code on phone
4. Customer follows prompts and enters PIN
5. Payment confirmed via webhook

---

## Key Considerations

### 1. Paystack vs Stripe
- Paystack is Stripe-owned but **separate integration**
- Different API keys, different dashboard
- Cannot use Stripe Payment Element for African local methods
- Must integrate Paystack separately

### 2. Mobile Money Dominance
- In many African countries, mobile money > cards
- M-Pesa in Kenya is essentially mandatory
- MTN Mobile Money dominant in Ghana
- Unbanked population relies on mobile money

### 3. Currency Volatility
- African currencies can be volatile
- Consider pricing strategies
- NGN, ZAR, GHS subject to fluctuations

### 4. Regulatory Environment
- Nigeria: CBN regulations on forex
- Kenya: Strong mobile money regulation
- South Africa: Well-established banking regulation
- Varies significantly by country

### 5. Internet Connectivity
- USSD works without internet (Nigeria)
- Mobile money works on basic phones
- Consider low-bandwidth solutions

---

## Recommended Approach

### If targeting Africa seriously:
1. **Integrate Paystack** for Nigeria, Ghana, South Africa, Kenya
2. **Consider Flutterwave** for broader coverage (34 countries)
3. **Prioritize mobile money** - it's essential, not optional
4. **Support USSD** for Nigeria

### If Africa is secondary market:
1. Accept international cards only (USD/EUR)
2. Use Stripe's extended network where available
3. Defer local payment methods to Phase 2/3

---

## References

- [Paystack Documentation](https://paystack.com/docs)
- [Stripe Nigeria](https://docs.stripe.com/payments/countries/nigeria)
- [Flutterwave](https://flutterwave.com)
- [M-Pesa API](https://developer.safaricom.co.ke)

---

*Document created: January 6, 2026*
*For integration planning purposes*
*Note: Africa requires Paystack integration separate from main Stripe*

