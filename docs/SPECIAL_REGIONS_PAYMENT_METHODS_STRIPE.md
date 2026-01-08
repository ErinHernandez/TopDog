# Special Regions & Edge Cases - Payment Methods

## Overview

This document covers payment methods for regions and scenarios not covered in our main regional documents:
- Middle East
- Eastern Europe & Turkey
- Caribbean & Central America
- British & French Overseas Territories
- Special Cases (Antarctica, Maritime, Military, etc.)
- Restricted/Sanctioned Regions

---

# MIDDLE EAST

## Tier 1: Stripe-Supported Countries

### United Arab Emirates (UAE)

#### 1. UAE Cards (AED)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | AED (UAE Dirham) |
| **Card types** | Visa, Mastercard, American Express |
| **Notes** | High card penetration; expat-heavy market |

#### 2. Apple Pay / Google Pay
| Attribute | Value |
|-----------|-------|
| **Stripe support** | Yes |
| **Currency** | AED, USD |
| **Notes** | Popular in UAE, especially Dubai |

### Israel

#### 3. Israeli Cards (ILS)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | ILS (Israeli Shekel) |
| **Card types** | Visa, Mastercard, American Express, Isracard |
| **Notes** | Isracard is major local network |

### Saudi Arabia

| Attribute | Value |
|-----------|-------|
| **Stripe support** | Limited/Expanding |
| **Currency** | SAR (Saudi Riyal) |
| **Local methods** | Mada (domestic debit), STC Pay, Apple Pay |
| **Notes** | Mada cards dominant; may need local processor |

### Other Middle East

| Country | Stripe Support | Local Methods |
|---------|---------------|---------------|
| **Qatar** | Limited | Cards, NAPS |
| **Kuwait** | Limited | KNET (dominant), Cards |
| **Bahrain** | Limited | BenefitPay, Cards |
| **Oman** | Limited | Cards |
| **Jordan** | Limited | Cards, eFAWATEERcom |
| **Lebanon** | Limited | Cards (economic crisis impact) |

---

# EASTERN EUROPE & TURKEY

## Turkey

#### 4. Turkish Cards (TRY)
| Attribute | Value |
|-----------|-------|
| **Stripe API name** | `card` |
| **Currency** | TRY (Turkish Lira) |
| **Card types** | Visa, Mastercard, Troy (domestic) |
| **Notes** | Troy is major domestic network; currency volatility |

#### 5. BKM Express
| Attribute | Value |
|-----------|-------|
| **Integration** | Not via Stripe |
| **Currency** | TRY |
| **Payment type** | Digital wallet |
| **Notes** | Popular Turkish digital wallet; separate integration |

## Restricted/Sanctioned Regions

| Region | Status | Notes |
|--------|--------|-------|
| **Russia** | NOT SUPPORTED | Sanctions; Stripe suspended operations |
| **Belarus** | NOT SUPPORTED | Sanctions |
| **Iran** | NOT SUPPORTED | Sanctions |
| **North Korea** | NOT SUPPORTED | Sanctions |
| **Cuba** | NOT SUPPORTED | Sanctions |
| **Syria** | NOT SUPPORTED | Sanctions |
| **Crimea** | NOT SUPPORTED | Sanctions |

### Ukraine
| Attribute | Value |
|-----------|-------|
| **Stripe support** | Yes (with limitations) |
| **Currency** | UAH (Ukrainian Hryvnia) |
| **Notes** | Stripe supports Ukraine; wartime considerations |

---

# CARIBBEAN

## Stripe-Supported Caribbean

| Country | Currency | Stripe Support | Notes |
|---------|----------|----------------|-------|
| **Jamaica** | JMD | Yes | Cards primary |
| **Trinidad & Tobago** | TTD | Yes | Cards primary |
| **Bahamas** | BSD | Limited | BSD pegged to USD |
| **Barbados** | BBD | Limited | Cards primary |
| **Dominican Republic** | DOP | Limited | Cards, bank transfers |
| **Puerto Rico** | USD | Full (US territory) | Same as US mainland |
| **US Virgin Islands** | USD | Full (US territory) | Same as US mainland |

## Not Directly Supported

| Territory | Currency | Alternative |
|-----------|----------|-------------|
| **Cuba** | CUP | Sanctioned - NOT SUPPORTED |
| **Haiti** | HTG | Limited options |
| **Cayman Islands** | KYD | British territory; cards work |
| **British Virgin Islands** | USD | British territory; cards work |
| **Aruba** | AWG | Cards via international networks |
| **Curacao** | ANG | Cards via international networks |

---

# CENTRAL AMERICA

| Country | Currency | Stripe Support | Local Methods |
|---------|----------|----------------|---------------|
| **Costa Rica** | CRC | Limited | Cards, SINPE Movil |
| **Panama** | USD | Limited | Cards (USD economy) |
| **Guatemala** | GTQ | Limited | Cards |
| **El Salvador** | USD | Limited | Cards, Bitcoin (legal tender) |
| **Honduras** | HNL | Limited | Cards |
| **Nicaragua** | NIO | Limited | Cards |
| **Belize** | BZD | Limited | Cards |

### Special Note: El Salvador
| Attribute | Value |
|-----------|-------|
| **Currencies** | USD, Bitcoin (BTC) |
| **Notes** | Bitcoin is legal tender; unique market |

---

# BRITISH OVERSEAS TERRITORIES & CROWN DEPENDENCIES

## Crown Dependencies (Full Stripe Support via UK)

| Territory | Currency | Status |
|-----------|----------|--------|
| **Gibraltar** | GIP (pegged to GBP) | Stripe supported |
| **Jersey** | JEP (pegged to GBP) | Stripe supported |
| **Guernsey** | GGP (pegged to GBP) | Stripe supported |
| **Isle of Man** | IMP (pegged to GBP) | Stripe supported |

## British Overseas Territories

| Territory | Currency | Status |
|-----------|----------|--------|
| **Bermuda** | BMD | Cards work; limited Stripe |
| **Cayman Islands** | KYD | Cards work; financial hub |
| **British Virgin Islands** | USD | Cards work |
| **Turks & Caicos** | USD | Cards work |
| **Falkland Islands** | FKP | Very limited |
| **Montserrat** | XCD | Very limited |
| **Anguilla** | XCD | Very limited |

---

# FRENCH OVERSEAS TERRITORIES

| Territory | Currency | Status |
|-----------|----------|--------|
| **Martinique** | EUR | Full Stripe (French department) |
| **Guadeloupe** | EUR | Full Stripe (French department) |
| **French Guiana** | EUR | Full Stripe (French department) |
| **Reunion** | EUR | Full Stripe (French department) |
| **Mayotte** | EUR | Full Stripe (French department) |
| **Saint Martin (FR)** | EUR | Full Stripe (French department) |
| **French Polynesia** | XPF | Limited |
| **New Caledonia** | XPF | Limited |
| **Saint Pierre & Miquelon** | EUR | Limited |

---

# SPECIAL CASES

## Antarctica

| Attribute | Value |
|-----------|-------|
| **Currency** | USD (de facto) |
| **Population** | ~1,000-5,000 (seasonal researchers) |
| **Payment methods** | International credit cards (Visa, MC) |
| **Internet** | Satellite (limited bandwidth) |
| **Stations** | McMurdo (ATM), Palmer (cashless), South Pole (cash only) |

### How Scientists Pay Online:
1. **Home country cards** - Use cards issued from their home country
2. **Satellite internet** - Limited bandwidth via satellite links
3. **VPN considerations** - May appear to be in home country
4. **Pre-deployment** - Most purchases made before deployment
5. **Station accounts** - Some purchases charged to station accounts

**Recommendation**: Accept international cards; USD pricing; no special integration needed.

---

## International Waters / Maritime

| Scenario | Payment Method | Notes |
|----------|----------------|-------|
| **Cruise ships** | Onboard account + cards | USD settlement |
| **Commercial vessels** | Crew remittance services | Remitly, Western Union |
| **Private yachts** | International cards | Owner's home country |
| **Research vessels** | Institution accounts | Pre-arranged |
| **Fishing vessels** | Cash, cards at port | Limited at-sea needs |

### How Sailors Pay Online:
1. **Satellite internet** - Starlink Maritime, Inmarsat
2. **Home country cards** - Cards from country of residence
3. **Shore leave** - Most purchases made in port
4. **Remittance services** - For sending money home
5. **Ship's slop chest** - Onboard purchases charged to wages

**Recommendation**: Accept international cards; no special integration needed.

---

## Military Personnel Abroad

| Scenario | Payment Method | Notes |
|----------|----------------|-------|
| **US Military (APO/FPO)** | US cards, USD | Treated as US address |
| **UK Military (BFPO)** | UK cards, GBP | Treated as UK address |
| **NATO bases** | Home country cards | Multiple nationalities |
| **Deployed locations** | International cards | Standard processing |

### APO/FPO Addresses:
- US military mail uses APO (Army/Air Post Office) or FPO (Fleet Post Office)
- Billing address: Treated as US domestic
- **No special payment integration needed**

**Recommendation**: Accept standard cards; works normally.

---

## Space (International Space Station)

| Attribute | Value |
|-----------|-------|
| **Population** | 6-7 astronauts |
| **Internet** | Yes (via ground stations) |
| **Currency** | Home country |
| **Payment** | Home country cards |

### How Astronauts Pay:
1. Astronauts maintain home country bank accounts
2. Internet access available (limited bandwidth)
3. Family/agents handle most transactions
4. Purchases are rare during missions

**Recommendation**: No special integration needed; edge case.

---

## Digital Nomads & Expats

### Common Challenges:
| Issue | Description | Solution |
|-------|-------------|----------|
| **VPN blocking** | Payment fails due to VPN | Allow known VPN ranges or use device fingerprinting |
| **Location mismatch** | Card country ≠ IP location | Accept international cards regardless of IP |
| **Address verification** | No permanent address | Flexible address requirements |
| **Currency mismatch** | Earning in one currency, spending in another | Multi-currency support |

### Recommendations:
1. **Don't block VPNs** for payment (many legitimate users)
2. **Accept international cards** from any supported country
3. **Don't require billing address** to match IP location
4. **Support major currencies** (USD, EUR, GBP minimum)

---

## Refugee Camps & Humanitarian Contexts

| Scenario | Payment Method | Notes |
|----------|----------------|-------|
| **UNHCR camps** | Cash, mobile money | Limited infrastructure |
| **Aid workers** | Home country cards | International staff |
| **Local population** | Mobile money, cash | Varies by region |

**Note**: Not typically a target market for fantasy sports, but relevant for understanding global payment landscape.

---

# CRYPTOCURRENCY CONSIDERATIONS

## Stripe Crypto Support

| Feature | Status |
|---------|--------|
| **USDC (Stablecoin)** | Stripe supports USDC payouts |
| **Bitcoin** | Not directly supported for payments |
| **Ethereum** | Not directly supported for payments |
| **Crypto on-ramp** | Stripe has crypto on-ramp product |

### When Crypto Might Be Relevant:
1. **Sanctioned regions** - NOT RECOMMENDED (compliance issues)
2. **Unbanked users** - Alternative, but complex
3. **El Salvador** - Bitcoin is legal tender
4. **Stablecoin payouts** - For contractor payments

**Recommendation**: Stick with traditional payment methods; crypto adds compliance complexity without significant benefit for this use case.

---

# IMPLEMENTATION SUMMARY

## Regions Requiring No Special Integration

These regions work with standard international card acceptance:

| Region | Notes |
|--------|-------|
| Antarctica | USD cards, satellite internet |
| International Waters | USD cards, satellite internet |
| Military Bases | Home country cards |
| Space Station | Home country cards (edge case) |
| British Crown Dependencies | UK Stripe account works |
| French DOM-TOM | French Stripe account works |

## Regions Requiring Evaluation

| Region | Consideration |
|--------|---------------|
| **Middle East** | UAE supported; others need evaluation |
| **Turkey** | Stripe supported; Troy cards consideration |
| **Caribbean** | US territories covered; others limited |
| **Central America** | Limited Stripe support; evaluate demand |

## Regions NOT Supported (Sanctions/Restrictions)

Do NOT attempt to process payments from:
- Russia
- Belarus
- Iran
- North Korea
- Cuba
- Syria
- Crimea

---

# CURRENCIES SUMMARY (All Regions)

| Currency | Code | Region |
|----------|------|--------|
| UAE Dirham | AED | Middle East |
| Israeli Shekel | ILS | Middle East |
| Saudi Riyal | SAR | Middle East |
| Turkish Lira | TRY | Turkey |
| Ukrainian Hryvnia | UAH | Eastern Europe |
| Jamaican Dollar | JMD | Caribbean |
| Trinidad Dollar | TTD | Caribbean |
| Costa Rican Colon | CRC | Central America |
| Gibraltar Pound | GIP | British Territory |
| CFP Franc | XPF | French Pacific |

---

# KEY TAKEAWAYS

1. **Most edge cases are non-issues** - International cards work globally via satellite internet

2. **USD is universal** - Antarctica, ships, military all use USD

3. **Don't over-engineer** - Scientists in Antarctica use the same Visa card as everyone else

4. **VPNs are legitimate** - Don't block payments from VPN users

5. **Sanctions are serious** - Never process payments from sanctioned regions

6. **Middle East opportunity** - UAE is Stripe-supported and has high purchasing power

7. **Caribbean limited** - Outside US territories, Stripe support is patchy

8. **Crypto not needed** - Traditional payments cover edge cases adequately

---

## References

- [Stripe Supported Countries](https://stripe.com/global)
- [US Antarctic Program Participant Guide](https://www.usap.gov)
- [OFAC Sanctions List](https://ofac.treasury.gov/sanctions-programs-and-country-information)

---

*Document created: January 6, 2026*
*For integration planning purposes*

