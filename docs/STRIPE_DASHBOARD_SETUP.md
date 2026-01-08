# Stripe Dashboard Payment Method Setup

This document outlines the payment methods to enable in your Stripe Dashboard.

## How to Enable Payment Methods

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to: **Settings** > **Payment methods**
3. Enable each payment method listed below

---

## Priority 1: Core Global Methods (Enable First)

These should be enabled before going live:

| Method | Region | Dashboard Toggle |
|--------|--------|------------------|
| Card | Global | Already enabled by default |
| Apple Pay | Global | Enable in Apple Pay settings |
| Google Pay | Global | Enable in Google Pay settings |
| Link | Global | Settings > Payment methods > Link |
| PayPal | Global | Settings > Payment methods > PayPal |

---

## Priority 2: Regional Methods

### Europe

| Method | Countries | Dashboard Toggle |
|--------|-----------|------------------|
| SEPA Debit | Eurozone | Settings > Payment methods > SEPA Direct Debit |
| iDEAL | Netherlands | Settings > Payment methods > iDEAL |
| Bancontact | Belgium | Settings > Payment methods > Bancontact |
| Sofort | DE, AT, BE, NL | Settings > Payment methods > Sofort |
| EPS | Austria | Settings > Payment methods > EPS |
| Przelewy24 | Poland | Settings > Payment methods > Przelewy24 |
| BLIK | Poland | Settings > Payment methods > BLIK |
| Swish | Sweden | Settings > Payment methods > Swish |
| MobilePay | Denmark, Finland | Settings > Payment methods > MobilePay |
| Twint | Switzerland | Settings > Payment methods > Twint |
| Multibanco | Portugal | Settings > Payment methods > Multibanco |

### North America

| Method | Countries | Dashboard Toggle |
|--------|-----------|------------------|
| ACH Debit | USA | Settings > Payment methods > ACH Direct Debit |
| Cash App Pay | USA | Settings > Payment methods > Cash App Pay |
| ACSS Debit | Canada | Settings > Payment methods > Pre-authorized debit in Canada |

### Latin America

| Method | Countries | Dashboard Toggle |
|--------|-----------|------------------|
| OXXO | Mexico | Settings > Payment methods > OXXO |
| Boleto | Brazil | Settings > Payment methods > Boleto |
| Pix | Brazil | Settings > Payment methods > Pix |

### Asia-Pacific

| Method | Countries | Dashboard Toggle |
|--------|-----------|------------------|
| PayNow | Singapore | Settings > Payment methods > PayNow |
| FPX | Malaysia | Settings > Payment methods > FPX |
| PromptPay | Thailand | Settings > Payment methods > PromptPay |
| GrabPay | SG, MY, PH | Settings > Payment methods > GrabPay |

---

## Currency Configuration

Ensure your Stripe account can accept payments in these currencies:

- USD, CAD, MXN (Americas)
- EUR, GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN (Europe)
- BRL (Brazil)
- SGD, MYR, THB, PHP (Southeast Asia)

Navigate to: **Settings** > **Business settings** > **Currency**

---

## Testing

After enabling payment methods:

1. Use Stripe test mode to verify each method works
2. Test with the Stripe test cards: https://stripe.com/docs/testing
3. Verify webhook events are being received for each payment type

---

## Notes

- Some payment methods require additional verification or agreements
- BNPL methods (Klarna, Affirm, Afterpay) are intentionally NOT enabled per business decision
- Payment methods will only appear to users in supported countries/currencies

