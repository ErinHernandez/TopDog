# Payment Integration Priority List

> Philosophy: Fanatical about user experience

---

## PRIORITY 1: Enable in Stripe Dashboard (No Code)

Just toggle on in Stripe Dashboard. Payment Element shows them automatically.

### Europe
- [ ] SEPA Direct Debit
- [ ] iDEAL (Netherlands)
- [ ] Bancontact (Belgium)
- [ ] Sofort (Germany/Austria)
- [ ] Przelewy24 (Poland)
- [ ] Blik (Poland)
- [ ] EPS (Austria)

### Asia-Pacific
- [ ] PayNow (Singapore)
- [ ] FPX (Malaysia)
- [ ] PromptPay (Thailand)
- [ ] GrabPay (Southeast Asia)

### Latin America
- [ ] OXXO (Mexico)
- [ ] Boleto (Brazil)
- [ ] Pix (Brazil)

---

## PRIORITY 2: Multi-Currency Support (Code Changes)

Enable users to see and pay in local currency.

### Currencies to Add
- [ ] EUR (Eurozone)
- [ ] GBP (UK)
- [ ] CAD (Canada)
- [ ] MXN (Mexico)
- [ ] BRL (Brazil)
- [ ] PLN (Poland)
- [ ] SGD (Singapore)
- [ ] MYR (Malaysia)
- [ ] THB (Thailand)

### Code Changes
- [ ] Dynamic currency in payment intents
- [ ] Currency detection by user location
- [ ] Currency-specific minimum amounts
- [ ] Currency formatting in UI
- [ ] Withdrawal currency support

---

## PRIORITY 3: Additional Stripe Methods (Dashboard Toggle)

### North America
- [ ] Cash App Pay (US)
- [ ] Canadian PAD (bank debit)

### Europe - Regional Leaders
- [ ] Swish (Sweden) - 80% of Swedish adults
- [ ] MobilePay (Denmark/Finland) - 75% of Danes
- [ ] Twint (Switzerland) - 80% of Swiss online shops
- [ ] Multibanco (Portugal) - Universal in Portugal
- [ ] MB WAY (Portugal) - Mobile payments

---

## PRIORITY 4: Africa via Paystack (Separate Integration)

Requires Paystack account and SDK integration (Stripe-owned, separate API).

### Countries
- [ ] Nigeria (Cards, Bank Transfer, USSD)
- [ ] South Africa (Cards, EFT)
- [ ] Ghana (Cards, Mobile Money)
- [ ] Kenya (M-Pesa, Cards)

### Currencies
- [ ] NGN (Nigerian Naira)
- [ ] ZAR (South African Rand)
- [ ] GHS (Ghanaian Cedi)
- [ ] KES (Kenyan Shilling)

---

## PRIORITY 5: Southeast Asia Alternatives (Separate Integrations)

Local e-wallets not supported by Stripe. Evaluate market demand first.

### Indonesia (via Xendit or Midtrans)
- [ ] GoPay
- [ ] OVO
- [ ] Dana

### Philippines (via PayMongo)
- [ ] GCash
- [ ] Maya

### Vietnam (Direct integration)
- [ ] MoMo
- [ ] ZaloPay

---

## PRIORITY 6: Additional Currencies (Lower Volume Markets)

Add only if significant user base in these regions.

- [ ] SEK (Sweden)
- [ ] DKK (Denmark)
- [ ] NOK (Norway)
- [ ] CHF (Switzerland)
- [ ] HKD (Hong Kong)
- [ ] NZD (New Zealand)
- [ ] KRW (South Korea)
- [ ] TWD (Taiwan)
- [ ] AED (UAE)
- [ ] ILS (Israel)
- [ ] TRY (Turkey)

---

## DO NOT IMPLEMENT

### BNPL (Buy Now Pay Later)
- ~~Klarna~~ - Regulatory risk for gaming, chargeback risk
- ~~Affirm~~ - Regulatory risk for gaming, chargeback risk
- ~~Afterpay~~ - Regulatory risk for gaming, chargeback risk

*BNPL encourages deposits with money users don't have. Gaming regulators prohibit credit-based deposits in many jurisdictions. High chargeback risk when users lose and stop paying installments.*

### Deprecated
- ~~Giropay~~ (Discontinued Dec 2024)

### Sanctioned Regions
- Russia
- Belarus
- Iran
- North Korea
- Cuba
- Syria
- Crimea

### Excluded Markets (Business Decision)
- China
- Japan
- Australia
- India

---

## COST SUMMARY

| Priority | Effort | Ongoing Cost |
|----------|--------|--------------|
| **P1: Dashboard toggles** | None | +2.5% international |
| **P2: Multi-currency** | ~30 dev hours | +1% conversion |
| **P3: More Stripe methods** | None | Varies by method |
| **P4: Paystack (Africa)** | ~40 dev hours | Paystack fees |
| **P5: SEA alternatives** | ~60 dev hours | Processor fees |
| **P6: More currencies** | ~10 dev hours | +1% conversion |

---

## QUICK START

**Week 1**: Do all of Priority 1 (Stripe Dashboard toggles)
**Week 2-4**: Do Priority 2 (Multi-currency support)
**After that**: Evaluate P3-P6 based on user demand

---

*Created: January 6, 2026*

