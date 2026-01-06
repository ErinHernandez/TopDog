# Asia & Oceania Payment Methods - Stripe Integration Plan

## Overview

This document lists payment methods for Asia and Oceania supported by Stripe Payment Element, **excluding China, Japan, Australia, and India**. Southeast Asia has strong e-wallet adoption with fragmented local e-wallet markets.

---

# SOUTHEAST ASIA

## Tier 1: High Priority (Major markets, Stripe-supported)

### Singapore

#### 1. Singapore Cards (SGD)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | SGD (Singapore Dollar) |
| **Card types** | Visa, Mastercard, American Express, JCB |
| **Payment type** | Credit/Debit cards |
| **Notes** | High card penetration |

#### 2. PayNow
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `paynow` |
| **Currency** | SGD |
| **Payment type** | Real-time bank transfer (QR code) |
| **Settlement** | Immediate |
| **Notes** | Pay via mobile number or NRIC/FIN; very popular |

#### 3. GrabPay (Singapore)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `grabpay` |
| **Currency** | SGD |
| **Payment type** | Digital wallet |
| **Settlement** | Immediate |
| **Users** | Millions across Southeast Asia |
| **Notes** | Popular ride-hailing app wallet |

---

### Malaysia

#### 4. Malaysian Cards (MYR)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | MYR (Malaysian Ringgit) |
| **Card types** | Visa, Mastercard, American Express |
| **Payment type** | Credit/Debit cards |

#### 5. FPX (Financial Process Exchange)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `fpx` |
| **Currency** | MYR |
| **Payment type** | Bank redirect / Online banking |
| **Settlement** | Immediate |
| **Banks** | 20+ Malaysian banks supported |
| **Market share** | Primary online payment method |
| **Notes** | Essential for Malaysia; direct bank payment |

#### 6. GrabPay (Malaysia)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `grabpay` |
| **Currency** | MYR |
| **Payment type** | Digital wallet |
| **Notes** | Same GrabPay, different currency |

#### 7. Touch 'n Go eWallet
| Attribute | Value |
|-----------|-------|
| **Integration** | Limited/Check availability |
| **Currency** | MYR |
| **Payment type** | Digital wallet |
| **Users** | 16M+ users |
| **Notes** | Extremely popular; may need separate integration |

---

### Thailand

#### 8. Thai Cards (THB)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | THB (Thai Baht) |
| **Card types** | Visa, Mastercard, JCB |
| **Payment type** | Credit/Debit cards |

#### 9. PromptPay
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `promptpay` |
| **Currency** | THB |
| **Payment type** | Real-time bank transfer (QR code) |
| **Settlement** | Immediate |
| **Users** | 70M+ registered users |
| **Notes** | National QR payment system; essential for Thailand |

#### 10. TrueMoney Wallet
| Attribute | Value |
|-----------|-------|
| **Integration** | Check Stripe availability |
| **Currency** | THB |
| **Payment type** | Digital wallet |
| **Notes** | Popular Thai e-wallet; may need separate integration |

---

### Indonesia

#### 11. Indonesian Cards (IDR)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | IDR (Indonesian Rupiah) |
| **Card types** | Visa, Mastercard |
| **Payment type** | Credit/Debit cards |
| **Notes** | Lower card penetration; e-wallets more popular |

#### 12. GoPay
| Attribute | Value |
|-----------|-------|
| **Integration** | Limited Stripe support |
| **Currency** | IDR |
| **Payment type** | Digital wallet |
| **Users** | 30M+ users |
| **Notes** | Gojek's wallet; dominant in Indonesia |

#### 13. OVO
| Attribute | Value |
|-----------|-------|
| **Integration** | Limited Stripe support |
| **Currency** | IDR |
| **Payment type** | Digital wallet |
| **Users** | 115M+ downloads |
| **Notes** | Major Indonesian e-wallet |

#### 14. Dana
| Attribute | Value |
|-----------|-------|
| **Integration** | Limited Stripe support |
| **Currency** | IDR |
| **Payment type** | Digital wallet |
| **Notes** | Popular Indonesian e-wallet |

#### 15. Bank Transfer (Indonesia)
| Attribute | Value |
|-----------|-------|
| **Integration** | Via virtual account |
| **Currency** | IDR |
| **Payment type** | Bank transfer |
| **Notes** | Common for larger purchases |

---

### Philippines

#### 16. Philippine Cards (PHP)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | PHP (Philippine Peso) |
| **Card types** | Visa, Mastercard |
| **Payment type** | Credit/Debit cards |
| **Notes** | Lower card penetration |

#### 17. GCash
| Attribute | Value |
|-----------|-------|
| **Integration** | Check Stripe availability |
| **Currency** | PHP |
| **Payment type** | Digital wallet |
| **Users** | 80M+ users |
| **Market share** | Dominant e-wallet in Philippines |
| **Notes** | Essential for Philippines; may need separate integration |

#### 18. Maya (formerly PayMaya)
| Attribute | Value |
|-----------|-------|
| **Integration** | Check Stripe availability |
| **Currency** | PHP |
| **Payment type** | Digital wallet |
| **Users** | 50M+ users |
| **Notes** | Second largest e-wallet in Philippines |

#### 19. GrabPay (Philippines)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `grabpay` |
| **Currency** | PHP |
| **Payment type** | Digital wallet |

---

### Vietnam

#### 20. Vietnamese Cards (VND)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | VND (Vietnamese Dong) |
| **Card types** | Visa, Mastercard |
| **Payment type** | Credit/Debit cards |
| **Notes** | Growing card adoption |

#### 21. MoMo
| Attribute | Value |
|-----------|-------|
| **Integration** | Not via Stripe (separate integration) |
| **Currency** | VND |
| **Payment type** | Digital wallet |
| **Users** | 31M+ users |
| **Market share** | Dominant e-wallet in Vietnam |
| **Notes** | Essential for Vietnam; requires separate integration |

#### 22. ZaloPay
| Attribute | Value |
|-----------|-------|
| **Integration** | Not via Stripe |
| **Currency** | VND |
| **Payment type** | Digital wallet |
| **Notes** | Second largest Vietnamese e-wallet |

---

# EAST ASIA (Excluding China & Japan)

## South Korea

#### 23. Korean Cards (KRW)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | KRW (Korean Won) |
| **Card types** | Visa, Mastercard, Samsung Card, BC Card |
| **Payment type** | Credit/Debit cards |
| **Notes** | Very high card usage |

#### 24. Kakao Pay
| Attribute | Value |
|-----------|-------|
| **Integration** | Check Stripe availability |
| **Currency** | KRW |
| **Payment type** | Digital wallet |
| **Users** | 37M+ users |
| **Notes** | KakaoTalk's payment system; hugely popular |

#### 25. Naver Pay
| Attribute | Value |
|-----------|-------|
| **Integration** | Check Stripe availability |
| **Currency** | KRW |
| **Payment type** | Digital wallet |
| **Users** | 30M+ users |
| **Notes** | Naver's payment platform |

#### 26. Samsung Pay
| Attribute | Value |
|-----------|-------|
| **Integration** | Via card tokenization |
| **Currency** | KRW |
| **Payment type** | Digital wallet |
| **Notes** | Works with Stripe via card network |

---

## Taiwan

#### 27. Taiwan Cards (TWD)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | TWD (Taiwan Dollar) |
| **Card types** | Visa, Mastercard, JCB |
| **Payment type** | Credit/Debit cards |

#### 28. LINE Pay (Taiwan)
| Attribute | Value |
|-----------|-------|
| **Integration** | Check Stripe availability |
| **Currency** | TWD |
| **Payment type** | Digital wallet |
| **Notes** | Very popular in Taiwan |

#### 29. JKOPay
| Attribute | Value |
|-----------|-------|
| **Integration** | Check Stripe availability |
| **Currency** | TWD |
| **Payment type** | Digital wallet |
| **Notes** | Popular Taiwanese e-wallet |

---

## Hong Kong

#### 30. Hong Kong Cards (HKD)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | HKD (Hong Kong Dollar) |
| **Card types** | Visa, Mastercard, American Express, UnionPay |
| **Payment type** | Credit/Debit cards |
| **Notes** | High card penetration |

#### 31. Octopus
| Attribute | Value |
|-----------|-------|
| **Integration** | Limited Stripe support |
| **Currency** | HKD |
| **Payment type** | Stored value card / e-wallet |
| **Notes** | Iconic HK payment card; limited online integration |

#### 32. FPS (Faster Payment System)
| Attribute | Value |
|-----------|-------|
| **Integration** | Check Stripe availability |
| **Currency** | HKD |
| **Payment type** | Real-time bank transfer |
| **Notes** | HK's instant payment system |

---

# OCEANIA (Excluding Australia)

## New Zealand

#### 33. New Zealand Cards (NZD)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | NZD (New Zealand Dollar) |
| **Card types** | Visa, Mastercard, American Express |
| **Payment type** | Credit/Debit cards |
| **Notes** | Primary payment method |

#### 34. NZ BECS Direct Debit
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `nz_bank_account` |
| **Currency** | NZD |
| **Payment type** | Bank debit |
| **Settlement** | 3-4 business days |
| **Notes** | For recurring payments |

#### 39. POLi
| Attribute | Value |
|-----------|-------|
| **Integration** | Not via Stripe (separate integration) |
| **Currency** | NZD, AUD |
| **Payment type** | Online banking |
| **Notes** | Popular in NZ/AU; requires separate integration |

---

## Pacific Islands

Limited Stripe support in Pacific Island nations. Most transactions via:
- International credit cards (USD, AUD, NZD)
- Bank transfers

---

# Summary by Country

| Country | Stripe Support | Key Methods | Priority |
|---------|---------------|-------------|----------|
| **Singapore** | Full | Cards, PayNow, GrabPay | High |
| **Malaysia** | Full | Cards, FPX, GrabPay | High |
| **Thailand** | Full | Cards, PromptPay | High |
| **Indonesia** | Partial | Cards (e-wallets need alternatives) | High |
| **Philippines** | Partial | Cards, GrabPay (GCash needs alternative) | High |
| **Vietnam** | Partial | Cards (MoMo needs alternative) | Medium |
| **South Korea** | Partial | Cards (Kakao/Naver need alternatives) | Medium |
| **Taiwan** | Partial | Cards (LINE Pay check availability) | Medium |
| **Hong Kong** | Full | Cards | High |
| **New Zealand** | Full | Cards, BECS Direct Debit | High |

---

## Implementation Checklist

### Phase 1: Core Stripe-Supported Methods
- [ ] Enable PayNow (Singapore) in Stripe Dashboard
- [ ] Enable FPX (Malaysia) in Stripe Dashboard
- [ ] Enable PromptPay (Thailand) in Stripe Dashboard
- [ ] Enable GrabPay in Stripe Dashboard
- [ ] Enable NZ BECS Direct Debit

### Phase 2: Currency Support
- [ ] Support SGD (Singapore Dollar)
- [ ] Support MYR (Malaysian Ringgit)
- [ ] Support THB (Thai Baht)
- [ ] Support IDR (Indonesian Rupiah)
- [ ] Support PHP (Philippine Peso)
- [ ] Support VND (Vietnamese Dong)
- [ ] Support KRW (Korean Won)
- [ ] Support TWD (Taiwan Dollar)
- [ ] Support HKD (Hong Kong Dollar)
- [ ] Support NZD (New Zealand Dollar)

### Phase 3: Evaluate Alternative Integrations
For e-wallets not directly supported by Stripe:
- [ ] GCash (Philippines) - evaluate direct integration
- [ ] Maya (Philippines) - evaluate direct integration
- [ ] GoPay/OVO/Dana (Indonesia) - evaluate Xendit/Midtrans
- [ ] MoMo (Vietnam) - evaluate direct integration
- [ ] Touch 'n Go (Malaysia) - evaluate availability
- [ ] Kakao Pay / Naver Pay (Korea) - evaluate direct integration

---

## Technical Notes

### Payment Element Configuration (Asia/Oceania)
```typescript
<PaymentElement 
  options={{
    layout: 'tabs',
    paymentMethodOrder: [
      'card',
      'grabpay',      // SEA
      'paynow',       // Singapore
      'fpx',          // Malaysia
      'promptpay',    // Thailand
      // Others auto-ordered by relevance
    ],
  }}
/>
```

### QR Code Payment Flows
Several Asian methods use QR codes:
- **PayNow** (Singapore): Display QR, customer scans with bank app
- **PromptPay** (Thailand): Display QR, customer scans with bank app

### Currency Units
| Currency | Unit | Multiplier |
|----------|------|------------|
| SGD | Cents | 100 cents = 1 SGD |
| MYR | Sen | 100 sen = 1 MYR |
| THB | Satang | 100 satang = 1 THB |
| IDR | None | Amount in IDR (no decimals) |
| PHP | Centavos | 100 centavos = 1 PHP |
| VND | None | Amount in VND (no decimals) |
| KRW | None | Amount in KRW (no decimals) |
| HKD | Cents | 100 cents = 1 HKD |
| NZD | Cents | 100 cents = 1 NZD |

---

## Key Considerations

### 1. E-Wallet Fragmentation
Southeast Asia has highly fragmented e-wallet markets:
- Each country has 2-5 dominant local wallets
- GrabPay is the only cross-border wallet with good Stripe support
- May need multiple integrations for full coverage

### 2. QR Code Payments
Very popular in Asia (PayNow, PromptPay):
- Requires displaying QR codes
- Customer scans with banking/wallet app
- Webhook confirms payment

### 3. Indonesia E-Wallet Challenge
- Card penetration is low
- GoPay, OVO, Dana dominate
- Stripe support limited; consider Xendit or Midtrans

### 4. Currency Considerations
- IDR, VND, KRW have no decimal places
- Large numbers (e.g., 100,000 IDR)
- Different minimum amounts per currency

---

## Alternative Payment Processors

For markets with limited Stripe support:

| Processor | Best For | Countries |
|-----------|----------|-----------|
| **Xendit** | Indonesia, Philippines | SEA focus |
| **Midtrans** | Indonesia | Local specialist |
| **2C2P** | Thailand, SEA | Regional coverage |
| **PayMongo** | Philippines | Local specialist |

---

## References

- [Stripe Payment Methods Overview](https://docs.stripe.com/payments/payment-methods/overview)
- [Stripe FPX (Malaysia)](https://docs.stripe.com/payments/fpx)
- [Stripe PromptPay (Thailand)](https://docs.stripe.com/payments/promptpay)
- [Stripe PayNow (Singapore)](https://docs.stripe.com/payments/paynow)
- [Stripe GrabPay](https://docs.stripe.com/payments/grabpay)

---

*Document created: January 6, 2026*
*For integration planning purposes*
*Note: Several Southeast Asian e-wallets require alternative integrations*

