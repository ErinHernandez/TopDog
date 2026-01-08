# Latin America Payment Coverage Analysis
## North & South America (Excluding US & Canada)

> **Date**: January 2025  
> **Last Updated**: January 2026  
> **Purpose**: Comprehensive analysis of payment coverage for Mexico, Central America, and South America

---

## IMPLEMENTATION STATUS

| Currency | Country | Local Payment Methods | Status |
|----------|---------|----------------------|--------|
| **MXN** | Mexico | OXXO (cash voucher) | ✅ Implemented |
| **BRL** | Brazil | Pix (instant), Boleto (bank slip) | ✅ Implemented |
| **CLP** | Chile | Cards | ✅ Implemented |
| **COP** | Colombia | Cards | ✅ Implemented |
| **PEN** | Peru | Cards | ✅ Implemented |

---

## EXECUTIVE SUMMARY

### Stripe Support Status

| Region | Stripe Support | Primary Markets | Status |
|--------|---------------|-----------------|--------|
| **Mexico** | ✅ Full Support | OXXO, Cards, Bank Transfers | ✅ Implemented |
| **Brazil** | ✅ Full Support (via EBANX for Pix) | Pix, Boleto, Cards | ✅ Implemented |
| **Chile** | ✅ Full Support | Cards | ✅ Implemented |
| **Colombia** | ⚠️ Limited | Cards | ✅ Implemented |
| **Peru** | ⚠️ Limited | Cards | ✅ Implemented |
| **Central America** | ⚠️ Limited | Cards, PayPal | Cards via USD |
| **South America (Other)** | ⚠️ Limited | Cards, PayPal | Cards via USD |

### Key Findings

1. **Stripe Direct Support**: Only **Mexico** and **Brazil** have full Stripe support
2. **Market Size**: Brazil and Mexico represent ~70% of LATAM e-commerce
3. **Payment Preferences**: Credit cards dominate (50%+), but local methods are essential
4. **Gap**: Most Central/South American countries rely on PayPal or international cards

---

## TIER 1: FULL STRIPE SUPPORT

### 🇲🇽 Mexico

**Stripe Status**: ✅ Full support (operates in Mexico)

#### Payment Methods Available

| Method | Stripe API | Market Share | Priority | Status |
|--------|-----------|--------------|----------|--------|
| **Credit/Debit Cards** | `card` | ~60% | High | ✅ Implemented |
| **OXXO** | `oxxo` | ~25% | **Critical** | ✅ Implemented |
| **Apple Pay** | `apple_pay` | Growing | High | ✅ Implemented |
| **Google Pay** | `google_pay` | Growing | High | ✅ Implemented |
| **PayPal** | `paypal` | ~10% | Medium | ✅ Implemented |
| **Bank Transfer (SPEI)** | Limited | ~5% | Low | ⚠️ Not Available |

#### OXXO Details

- **What it is**: Cash voucher payment at 19,000+ OXXO convenience stores
- **Why critical**: Essential for unbanked/underbanked customers (~40% of population)
- **Flow**: Customer gets voucher → Pays at OXXO store → Webhook confirms payment
- **Fees**: 3% + MXN $10 (~$0.50 USD)
- **Expiration**: 1-3 days
- **Settlement**: When customer pays (1-3 days typical)

#### "Meses Sin Intereses" (Interest-Free Installments)

- **What it is**: Installment plans for credit cards (3, 6, 12, 18, 24 months)
- **Market preference**: Very popular in Mexico
- **Stripe support**: Available via card installments feature
- **Consideration**: May require separate configuration

#### Currency: MXN (Mexican Peso)

- **Status**: ⚠️ Not yet supported in codebase
- **Min amount**: MXN $100 (~$5 USD)
- **Max amount**: MXN $2,000,000 (~$100,000 USD)

#### Implementation Checklist

- [ ] Enable OXXO in Stripe Dashboard
- [ ] Add MXN currency support to `currencyConfig.ts`
- [ ] Implement voucher handling (display voucher URL, expiration)
- [ ] Handle async payment confirmation webhooks
- [ ] Test "meses sin intereses" if offering installments

---

### 🇧🇷 Brazil

**Stripe Status**: ✅ Full support (Pix via EBANX partnership)

#### Payment Methods Available

| Method | Stripe API | Market Share | Priority | Status |
|--------|-----------|--------------|----------|--------|
| **Pix** | `pix` | ~40% (fastest growing) | **Critical** | ✅ Implemented |
| **Credit/Debit Cards** | `card` | ~50% | High | ✅ Implemented |
| **Boleto Bancário** | `boleto` | ~15% | **Critical** | ✅ Implemented |
| **Elo Cards** | `card` (enable Elo) | ~20% | High | ⏳ Enable in Dashboard |
| **Hipercard** | `card` (enable Hipercard) | ~5% | Medium | ⏳ Enable in Dashboard |
| **Apple Pay** | `apple_pay` | Growing | High | ✅ Implemented |
| **Google Pay** | `google_pay` | Growing | High | ✅ Implemented |

#### Pix Details

- **What it is**: Instant payment system by Central Bank of Brazil (launched 2020)
- **Why critical**: 
  - 70%+ of adult population actively uses it
  - R$2.5 trillion per month in transactions (July 2024)
  - 24/7 instant transfers, no fees for consumers
- **Flow**: QR code or payment key → Instant transfer → Immediate confirmation
- **Fees**: 0.99% (very low!)
- **Settlement**: Immediate
- **Stripe integration**: Via EBANX partnership (settlement in merchant's currency)

#### Boleto Bancário Details

- **What it is**: Bank slip/voucher payment system
- **Why critical**: Essential for unbanked customers and large purchases
- **Flow**: Customer gets slip → Pays at bank/ATM/online → Webhook confirms (up to 3 days)
- **Fees**: Variable (typically 1-3%)
- **Settlement**: When customer pays (up to 3 days)
- **Market share**: ~15% of Brazilian e-commerce

#### Local Card Networks

- **Elo**: Brazilian domestic card network (~20% market share)
- **Hipercard**: Regional Brazilian card network (~5% market share)
- **Action**: Enable in Stripe Dashboard → Settings → Payment Methods

#### Currency: BRL (Brazilian Real)

- **Status**: ⚠️ Not yet supported in codebase
- **Min amount**: BRL $5.00 (~$1 USD)
- **Max amount**: BRL $1,000,000 (~$200,000 USD)

#### Implementation Checklist

- [ ] Enable Pix in Stripe Dashboard (via EBANX)
- [ ] Enable Boleto in Stripe Dashboard
- [ ] Enable Elo and Hipercard card networks
- [ ] Add BRL currency support to `currencyConfig.ts`
- [ ] Implement Pix QR code display (instant payment)
- [ ] Implement Boleto voucher handling (async payment)
- [ ] Handle async payment confirmation webhooks
- [ ] Test Pix instant payment flow

---

## TIER 2: LIMITED STRIPE SUPPORT

### Central America

**Stripe Status**: ⚠️ Limited (cards work, but no local methods)

| Country | Currency | Stripe Support | Available Methods | Notes |
|---------|----------|----------------|-------------------|-------|
| **Costa Rica** | CRC | Limited | Cards, PayPal | SINPE Movil (local) not via Stripe |
| **Panama** | USD | Limited | Cards, PayPal | USD economy - easier |
| **Guatemala** | GTQ | Limited | Cards, PayPal | |
| **El Salvador** | USD | Limited | Cards, PayPal, Bitcoin | Bitcoin is legal tender |
| **Honduras** | HNL | Limited | Cards, PayPal | |
| **Nicaragua** | NIO | Limited | Cards, PayPal | |
| **Belize** | BZD | Limited | Cards, PayPal | |

#### Recommendations

- **Current**: Accept international cards and PayPal
- **Future**: Consider local payment processors for:
  - **Costa Rica**: SINPE Movil integration
  - **El Salvador**: Bitcoin payment support (if regulatory compliance allows)

---

### South America (Other Countries)

**Stripe Status**: ⚠️ Limited (cards work, but no local methods)

| Country | Currency | Stripe Support | Available Methods | Local Methods (Not via Stripe) |
|---------|----------|----------------|-------------------|-------------------------------|
| **Colombia** | COP | Limited | Cards, PayPal | PSE (Pagos Seguros en Línea) |
| **Argentina** | ARS | Limited | Cards, PayPal | Rapipago, Pago Fácil, Mercado Pago |
| **Chile** | CLP | Limited | Cards, PayPal | Mercado Pago |
| **Peru** | PEN | Limited | Cards, PayPal | Yape (20M+ users), Mercado Pago |
| **Uruguay** | UYU | Limited | Cards, PayPal | Mercado Pago |
| **Paraguay** | PYG | Limited | Cards, PayPal | |
| **Bolivia** | BOB | Limited | Cards, PayPal | Yape (Peru-based, expanding) |
| **Ecuador** | USD | Limited | Cards, PayPal | USD economy - easier |
| **Venezuela** | VES | Limited | Cards, PayPal | High inflation, regulatory issues |
| **Guyana** | GYD | Limited | Cards, PayPal | |
| **Suriname** | SRD | Limited | Cards, PayPal | |

#### Key Local Payment Methods (Not via Stripe)

##### Colombia: PSE (Pagos Seguros en Línea)
- **What it is**: Bank transfer system for online payments
- **Market share**: Primary online payment method
- **Integration**: Requires separate processor (not Stripe)
- **Priority**: Medium (if targeting Colombia)

##### Argentina: Rapipago / Pago Fácil
- **What it is**: Cash voucher payment networks
- **Market share**: Popular for cash-based payments
- **Integration**: Requires separate processor (not Stripe)
- **Priority**: Low (high inflation, regulatory complexity)

##### Peru/Bolivia: Yape
- **What it is**: Instant mobile payment app (Banco de Crédito del Perú)
- **Users**: 20M+ across Peru and Bolivia (2025)
- **Features**: Instant, commission-free P2P transfers
- **Integration**: Requires separate processor (not Stripe)
- **Priority**: Medium (if targeting Peru/Bolivia)

##### Mercado Pago
- **What it is**: Digital wallet by MercadoLibre (Latin America's largest e-commerce)
- **Countries**: Argentina, Brazil, Chile, Colombia, Mexico, Peru, Uruguay
- **Market share**: Dominant in many markets
- **Integration**: Separate integration required (not via Stripe)
- **Priority**: High (if serious about LATAM expansion)

#### Recommendations

**Current Strategy**:
1. Accept international cards (works everywhere)
2. Accept PayPal (broad coverage)
3. Monitor demand by country

**Future Strategy** (if market demand justifies):
1. **Colombia**: Integrate PSE via local processor
2. **Peru/Bolivia**: Integrate Yape via local processor
3. **Multi-country**: Consider Mercado Pago integration
4. **Argentina**: Evaluate regulatory environment before investing

---

## PAYMENT METHOD ADOPTION STATISTICS

### Overall LATAM E-commerce Payment Methods (2022-2024)

| Payment Method | Market Share | Growth Trend |
|----------------|--------------|--------------|
| **Credit Cards** | 50%+ | Stable |
| **Debit Cards** | 15-20% | Growing |
| **Digital Wallets** | 10-15% | Growing rapidly |
| **Bank Transfers** | 5-10% | Growing (Pix impact) |
| **Cash Vouchers** | 10-15% | Declining (but still important) |
| **BNPL** | 2-5% | Growing (300% growth in 2022) |

### Country-Specific Insights

#### Brazil
- **Credit Cards**: 50%+ of e-commerce
- **Pix**: 40%+ and growing (70%+ of adults use it)
- **Boleto**: 15% (declining but still important)
- **Key Insight**: Only ~10% of Brazilian cards enabled for international purchases → Local methods essential

#### Mexico
- **Credit Cards**: 60%+ of e-commerce
- **OXXO**: 25% (critical for unbanked)
- **Bank Transfers**: 5%
- **Key Insight**: 40% of population unbanked/underbanked → OXXO essential

#### Colombia
- **Credit Cards**: 50%+ of e-commerce
- **PSE**: 30%+ (primary local method)
- **Key Insight**: PSE is preferred over cards for many transactions

#### Argentina
- **Credit Cards**: 40%+ of e-commerce
- **Cash Vouchers**: 20%+ (Rapipago, Pago Fácil)
- **Mercado Pago**: 15%+
- **Key Insight**: High inflation and currency volatility complicate payments

---

## STRIPE FEES & COSTS

### Mexico (MXN)

| Method | Fee | Notes |
|--------|-----|-------|
| **Cards (domestic)** | 3.6% + MXN $3 | Standard |
| **Cards (international)** | 5.4% + MXN $3 | Cross-border |
| **OXXO** | 3% + MXN $10 | Cash voucher |
| **PayPal** | 3.49% + $0.49 | Via Stripe |

### Brazil (BRL)

| Method | Fee | Notes |
|--------|-----|-------|
| **Cards (domestic)** | 4.99% + BRL $0.39 | Standard |
| **Cards (international)** | 6.4% + BRL $0.39 | Cross-border |
| **Pix** | 0.99% | Very low! (via EBANX) |
| **Boleto** | Variable (1-3%) | Typically 1.5-2% |
| **PayPal** | 3.49% + $0.49 | Via Stripe |

### Other Countries (International Cards)

| Method | Fee | Notes |
|--------|-----|-------|
| **Cards (international)** | 5.4% + $0.30 | Cross-border + conversion |
| **PayPal** | 3.49% + $0.49 | Via Stripe |

**Key Insight**: Pix (0.99%) is significantly cheaper than cards (4.99%+) in Brazil!

---

## IMPLEMENTATION PRIORITY

### Phase 1: High Priority (Immediate)

1. **Mexico - OXXO**
   - Enable in Stripe Dashboard
   - Add MXN currency support
   - Implement voucher handling
   - **Impact**: Unlocks 25% of Mexican e-commerce market

2. **Brazil - Pix**
   - Enable via EBANX in Stripe Dashboard
   - Add BRL currency support
   - Implement QR code display
   - **Impact**: Unlocks 40%+ of Brazilian e-commerce market

3. **Brazil - Boleto**
   - Enable in Stripe Dashboard
   - Implement voucher handling
   - **Impact**: Unlocks 15% of Brazilian e-commerce market

### Phase 2: Medium Priority (Next 3-6 months)

4. **Brazil - Local Card Networks**
   - Enable Elo and Hipercard
   - **Impact**: Unlocks 25% of Brazilian card market

5. **Monitor Central America Demand**
   - Track transaction volume by country
   - Evaluate local processor integration if demand justifies

### Phase 3: Low Priority (Future)

6. **Colombia - PSE** (if demand justifies separate integration)
7. **Peru/Bolivia - Yape** (if demand justifies separate integration)
8. **Mercado Pago** (if serious about multi-country LATAM expansion)

---

## REGULATORY CONSIDERATIONS

### Mexico
- ✅ Stable regulatory environment
- ✅ Stripe fully licensed
- ✅ No major restrictions

### Brazil
- ✅ Stable regulatory environment
- ✅ Stripe fully licensed
- ✅ Pix regulated by Central Bank of Brazil
- ⚠️ Local entity may be required for certain operations

### Central America
- ⚠️ Varies by country
- ⚠️ Some countries have limited financial infrastructure
- ⚠️ El Salvador: Bitcoin legal tender (unique regulatory situation)

### South America (Other)
- ⚠️ Argentina: High inflation, currency controls, regulatory complexity
- ⚠️ Venezuela: Sanctions, high inflation, regulatory issues
- ⚠️ Colombia/Chile/Peru: Generally stable, but local payment methods may require local entities

---

## RECOMMENDATIONS

### Immediate Actions

1. **Enable OXXO for Mexico** (highest ROI)
   - Unlocks 25% of Mexican market
   - Relatively simple implementation
   - Critical for unbanked customers

2. **Enable Pix for Brazil** (highest ROI)
   - Unlocks 40%+ of Brazilian market
   - Lowest fees (0.99%)
   - Fastest growing payment method

3. **Enable Boleto for Brazil** (high ROI)
   - Unlocks 15% of Brazilian market
   - Essential for unbanked customers

### Strategic Considerations

1. **Market Focus**: Brazil and Mexico represent ~70% of LATAM e-commerce
2. **Local Methods Essential**: Only ~10% of Brazilian cards work internationally
3. **Cost Efficiency**: Pix (0.99%) is much cheaper than cards (4.99%+)
4. **User Experience**: Local methods preferred by consumers

### Future Expansion

- **Monitor demand** in Central/South America before investing in local processors
- **Consider Mercado Pago** if serious about multi-country LATAM expansion
- **Evaluate regulatory environment** before entering Argentina/Venezuela

---

## REFERENCES

- [Stripe Mexico](https://stripe.com/en-at/newsroom/news/stripe-and-mexico)
- [Stripe Pix via EBANX](https://business.ebanx.com/en/press-room/press-releases/stripe-users-can-now-accept-pix-in-brazil-via-ebanx)
- [Stripe OXXO Documentation](https://docs.stripe.com/payments/oxxo)
- [Stripe Boleto Documentation](https://docs.stripe.com/payments/boleto)
- [Stripe Pix Documentation](https://docs.stripe.com/payments/pix)
- [Pix Wikipedia](https://en.wikipedia.org/wiki/Pix_%28payment_system%29)
- [Yape Wikipedia](https://en.wikipedia.org/wiki/Yape_%28payment%29)

---

*Document created: January 2025*  
*Last updated: January 2025*  
*Based on codebase analysis and web research*

