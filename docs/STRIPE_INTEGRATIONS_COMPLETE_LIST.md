# All Stripe Integrations - Complete List

## How It Works

**Stripe Payment Element** automatically displays relevant payment methods based on:
- User's country (IP-based)
- Transaction currency
- Device (Apple Pay on iOS, etc.)

You enable methods in **Stripe Dashboard → Settings → Payment Methods**. No code changes for most methods.

---

# STRIPE-NATIVE METHODS (Enable in Dashboard)

All of these work with your existing Stripe integration. Just toggle on.

## Already Implemented
| Method | API Name | Status |
|--------|----------|--------|
| Cards (Visa, MC, Amex) | `card` | Live |
| ACH Direct Debit | `us_bank_account` | Live |
| Link | `link` | Live |
| Apple Pay | via `card` | Live |
| Google Pay | via `card` | Live |
| PayPal | `paypal` | Live |

## Priority 1: Core International (Toggle On)
| Method | API Name | Countries | Action |
|--------|----------|-----------|--------|
| SEPA Direct Debit | `sepa_debit` | 36 SEPA countries | Dashboard toggle |
| iDEAL | `ideal` | Netherlands | Dashboard toggle |
| Bancontact | `bancontact` | Belgium | Dashboard toggle |
| Sofort | `sofort` | Germany, Austria | Dashboard toggle |
| Przelewy24 | `p24` | Poland | Dashboard toggle |
| Blik | `blik` | Poland | Dashboard toggle |
| EPS | `eps` | Austria | Dashboard toggle |
| PayNow | `paynow` | Singapore | Dashboard toggle |
| FPX | `fpx` | Malaysia | Dashboard toggle |
| PromptPay | `promptpay` | Thailand | Dashboard toggle |
| GrabPay | `grabpay` | Singapore, MY, PH | Dashboard toggle |
| OXXO | `oxxo` | Mexico | Dashboard toggle |
| Boleto | `boleto` | Brazil | Dashboard toggle |
| Pix | `pix` | Brazil | Dashboard toggle |

## Priority 3: Regional Leaders (Toggle On)
| Method | API Name | Countries | Action |
|--------|----------|-----------|--------|
| Cash App Pay | `cashapp` | US | Dashboard toggle |
| Canadian PAD | `acss_debit` | Canada | Dashboard toggle |
| Swish | `swish` | Sweden | Dashboard toggle |
| MobilePay | `mobilepay` | Denmark, Finland | Dashboard toggle |
| Twint | `twint` | Switzerland | Dashboard toggle |
| Multibanco | `multibanco` | Portugal | Dashboard toggle |
| MB WAY | `mb_way` | Portugal | Dashboard toggle |

---

## Total Stripe-Native Methods

| Category | Count |
|----------|-------|
| Already implemented | 6 |
| Priority 1 (toggle on) | 14 |
| Priority 3 (toggle on) | 7 |
| **Total Stripe methods** | **27** |

---

# CODE CHANGES REQUIRED

These Stripe methods are enabled but need code changes to work properly:

## Multi-Currency Support
| Change | Reason |
|--------|--------|
| Dynamic `currency` parameter | Accept EUR, GBP, CAD, etc. |
| Currency detection | Show local currency to users |
| Currency-specific minimums | €5 ≠ $5 |
| Withdrawal currency | Pay users in local currency |

## Async Payment Handling
| Method | Flow |
|--------|------|
| OXXO | Voucher → User pays at store → Webhook confirms |
| Boleto | Voucher → User pays at bank → Webhook confirms |
| SEPA | Mandate → Debit initiated → Days to confirm |

*These already work via webhooks, just need to handle pending states in UI.*

---

# NOT STRIPE (Separate Integrations)

## Paystack (Africa) - Stripe-Owned, Separate API
| Method | Countries |
|--------|-----------|
| Nigerian Cards | Nigeria |
| Nigerian Bank Transfer | Nigeria |
| USSD | Nigeria |
| M-Pesa | Kenya |
| South African Cards | South Africa |
| Instant EFT | South Africa |
| Ghanaian Cards | Ghana |
| Mobile Money (MTN) | Ghana |

**Integration**: Separate Paystack account + SDK. Not Stripe Payment Element.

## Xendit/Midtrans (Indonesia)
| Method | Notes |
|--------|-------|
| GoPay | Not on Stripe |
| OVO | Not on Stripe |
| Dana | Not on Stripe |

**Integration**: Separate Xendit or Midtrans account.

## PayMongo (Philippines)
| Method | Notes |
|--------|-------|
| GCash | Not on Stripe |
| Maya | Not on Stripe |

**Integration**: Separate PayMongo account.

## Direct Integration (Vietnam)
| Method | Notes |
|--------|-------|
| MoMo | Not on Stripe |
| ZaloPay | Not on Stripe |

**Integration**: Direct API integration with each provider.

---

# SUMMARY

| Category | Count | Effort |
|----------|-------|--------|
| **Stripe-native (dashboard toggle)** | 27 | None |
| **Stripe (needs code for currency)** | 27 | ~30 hours |
| **Paystack (Africa)** | 8 | ~40 hours |
| **Xendit/Midtrans (Indonesia)** | 3 | ~30 hours |
| **PayMongo (Philippines)** | 2 | ~20 hours |
| **Direct (Vietnam)** | 2 | ~40 hours |
| **Total methods** | **42** | |

---

# STRIPE DASHBOARD CHECKLIST

Go to: **Stripe Dashboard → Settings → Payment Methods**

## Toggle On Now (Priority 1)
- [ ] SEPA Direct Debit
- [ ] iDEAL
- [ ] Bancontact
- [ ] Sofort
- [ ] Przelewy24 (P24)
- [ ] Blik
- [ ] EPS
- [ ] PayNow
- [ ] FPX
- [ ] PromptPay
- [ ] GrabPay
- [ ] OXXO
- [ ] Boleto
- [ ] Pix

## Toggle On (Priority 3)
- [ ] Cash App Pay
- [ ] Canadian Pre-authorized Debits
- [ ] Swish
- [ ] MobilePay
- [ ] Twint
- [ ] Multibanco
- [ ] MB WAY

---

# NEVER ENABLE

| Method | Reason |
|--------|--------|
| Klarna | BNPL - regulatory risk |
| Affirm | BNPL - regulatory risk |
| Afterpay | BNPL - regulatory risk |
| Giropay | Discontinued Dec 2024 |

---

*Created: January 6, 2026*

