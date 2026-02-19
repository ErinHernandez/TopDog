# Official Currency Icons/Logos Resources

> Philosophy: Enterprise grade. Fanatical about UX. Use a deterministic, precise approach. Be thorough, take your time, quality over speed.

This document provides official sources and resources for currency icons, logos, and symbols for all 141 supported currencies in the TopDog platform.

**Note**: The platform supports 54 currencies for deposits/withdrawals (in `currencyConfig.ts`) and 141 currencies for display/formatting (in `CURRENCY_SYMBOLS`). All 141 currencies have icon support.

## Overview

Currency icons should be the official currency symbols/logos, not country flags. These can be:
- Stylized currency symbol graphics (€, $, £, ¥, etc.)
- Official currency logos from central banks
- Currency symbol icons from icon libraries
- Unicode currency symbols rendered as icons

## Recommended Sources for Currency Icons

### 🏆 Top Recommendations

### 1. **Hexmos Free Currency Icons** ⭐ BEST FREE SOURCE
- **URL**: https://hexmos.com/freedevtools/svg_icons/currency/
- **Coverage**: 19 major currencies (USD, EUR, GBP, JPY, CNY, INR, etc.)
- **License**: Free
- **Format**: SVG
- **Quality**: Professional, consistent style
- **Best For**: Major currencies - start here!

### 2. **SVG Repo Currency Icons** ⭐ BEST COVERAGE
- **URL**: https://www.svgrepo.com/vectors/currency/symbol/
- **Coverage**: Extensive collection of currency symbols
- **License**: Free (check individual licenses)
- **Format**: SVG
- **Quality**: Varies, but good selection
- **Best For**: Finding specific currency symbols

### 3. **Icons8 Currency Icons** ⭐ PREMIUM QUALITY
- **URL**: https://icons8.com/icons/set/currency
- **Coverage**: Most major currencies
- **License**: Free with attribution OR paid commercial license
- **Format**: SVG, PNG (multiple sizes)
- **Quality**: Professional, consistent
- **Best For**: Production-ready icons with consistent style

### 4. **Flaticon Currency Icons**
- **URL**: https://www.flaticon.com/search?word=currency
- **Coverage**: Good selection
- **License**: Free with attribution OR premium license
- **Format**: SVG, PNG
- **Quality**: Professional
- **Best For**: Alternative source if Icons8 doesn't have specific currency

### Additional Sources

### 5. **Font Awesome / Material Icons** (Limited Coverage)
- **Font Awesome**: `fa-dollar-sign`, `fa-euro-sign`, `fa-pound-sign`, `fa-yen-sign`, `fa-rupee-sign`, `fa-won-sign`
- **Material Icons**: `attach_money`, `euro_symbol`, `currency_pound`, `currency_yen`, `currency_rupee`, `currency_won`
- **Coverage**: Only major currencies
- **Format**: Font icons (can be converted to SVG)
- **Best For**: Major currencies only

### 2. **Official Central Bank Currency Logos**
- **Source**: Individual central bank websites
- **Format**: PNG/SVG logos
- **Usage**: For official/formal contexts
- **Note**: May require permission for commercial use

### 3. **Unicode Currency Symbols (Current Implementation)**
- **Source**: Unicode Standard
- **Format**: Font-based symbols
- **Usage**: Already implemented in CurrencySelector
- **Reference**: https://www.unicode.org/charts/PDF/U20A0.pdf

### 4. **Currency Symbol Graphics**
- **Wikimedia Commons**: Currency symbol graphics
- **Pixabay**: Free currency symbol vectors
- **Shutterstock**: Premium currency icons (requires license)

## Currency List with Official Icon Resources

### North America (3 currencies)

#### USD - US Dollar
- **Symbol**: $
- **Unicode**: U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/dollar
  - Font Awesome: `fa-dollar-sign`
  - Material Icons: `attach_money`
- **Official**: Federal Reserve (https://www.federalreserve.gov/)

#### CAD - Canadian Dollar
- **Symbol**: C$
- **Unicode**: U+0024 (with country prefix)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/canadian-dollar
  - Custom: C$ symbol graphic
- **Official**: Bank of Canada (https://www.bankofcanada.ca/)

#### MXN - Mexican Peso
- **Symbol**: $
- **Unicode**: U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/mexican-peso
  - Custom: MXN or $M symbol graphic
- **Official**: Banco de México (https://www.banxico.org.mx/)

### Europe - Eurozone (1 currency)

#### EUR - Euro
- **Symbol**: €
- **Unicode**: U+20AC
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/euro
  - Font Awesome: `fa-euro-sign`
  - Material Icons: `euro_symbol`
  - Official ECB logo: https://www.ecb.europa.eu/ecb/logo/html/index.en.html
- **Official**: European Central Bank (https://www.ecb.europa.eu/)

### Europe - Non-Eurozone (11 currencies)

#### GBP - British Pound
- **Symbol**: £
- **Unicode**: U+00A3
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/pound
  - Font Awesome: `fa-pound-sign`
  - Material Icons: `currency_pound`
- **Official**: Bank of England (https://www.bankofengland.co.uk/)

#### CHF - Swiss Franc
- **Symbol**: CHF
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/swiss-franc
  - Custom: CHF text logo or Fr. symbol
- **Official**: Swiss National Bank (https://www.snb.ch/)

#### SEK - Swedish Krona
- **Symbol**: kr
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/swedish-krona
  - Custom: kr symbol graphic
- **Official**: Sveriges Riksbank (https://www.riksbank.se/)

#### NOK - Norwegian Krone
- **Symbol**: kr
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/norwegian-krone
  - Custom: kr symbol graphic
- **Official**: Norges Bank (https://www.norges-bank.no/)

#### DKK - Danish Krone
- **Symbol**: kr
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/danish-krone
  - Custom: kr symbol graphic
- **Official**: Danmarks Nationalbank (https://www.nationalbanken.dk/)

#### PLN - Polish Zloty
- **Symbol**: zł
- **Unicode**: U+007A U+0142
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/polish-zloty
  - Custom: zł symbol graphic
- **Official**: Narodowy Bank Polski (https://www.nbp.pl/)

#### CZK - Czech Koruna
- **Symbol**: Kč
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/czech-koruna
  - Custom: Kč symbol graphic
- **Official**: Česká národní banka (https://www.cnb.cz/)

#### HUF - Hungarian Forint
- **Symbol**: Ft
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/hungarian-forint
  - Custom: Ft symbol graphic
- **Official**: Magyar Nemzeti Bank (https://www.mnb.hu/)

#### RON - Romanian Leu
- **Symbol**: lei
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/romanian-leu
  - Custom: lei symbol graphic
- **Official**: Banca Națională a României (https://www.bnr.ro/)

#### BGN - Bulgarian Lev
- **Symbol**: лв
- **Unicode**: No single symbol (uses Cyrillic)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/bulgarian-lev
  - Custom: лв symbol graphic
- **Official**: Българска народна банка (https://www.bnb.bg/)

#### HRK - Croatian Kuna
- **Symbol**: kn
- **Unicode**: No single symbol (uses letters)
- **Note**: Croatia adopted EUR in January 2023
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/croatian-kuna
  - Custom: kn symbol graphic
- **Official**: Hrvatska narodna banka (https://www.hnb.hr/)

### Latin America (5 currencies)

#### BRL - Brazilian Real
- **Symbol**: R$
- **Unicode**: U+0052 U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/brazilian-real
  - Custom: R$ symbol graphic
- **Official**: Banco Central do Brasil (https://www.bcb.gov.br/)

#### CLP - Chilean Peso
- **Symbol**: $
- **Unicode**: U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/chilean-peso
  - Custom: CLP or $ symbol graphic
- **Official**: Banco Central de Chile (https://www.bcentral.cl/)

#### COP - Colombian Peso
- **Symbol**: $
- **Unicode**: U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/colombian-peso
  - Custom: COP or $ symbol graphic
- **Official**: Banco de la República (https://www.banrep.gov.co/)

#### PEN - Peruvian Sol
- **Symbol**: S/
- **Unicode**: U+0053 U+002F
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/peruvian-sol
  - Custom: S/ symbol graphic
- **Official**: Banco Central de Reserva del Perú (https://www.bcrp.gob.pe/)

#### DOP - Dominican Peso
- **Symbol**: RD$
- **Unicode**: U+0052 U+0044 U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/dominican-peso
  - Custom: RD$ symbol graphic
- **Official**: Banco Central de la República Dominicana (https://www.bancentral.gov.do/)

#### UYU - Uruguayan Peso
- **Symbol**: $U
- **Unicode**: U+0024 U+0055
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/uruguayan-peso
  - Custom: $U symbol graphic
- **Official**: Banco Central del Uruguay (https://www.bcu.gub.uy/)

### Asia-Pacific (11 currencies)

#### SGD - Singapore Dollar
- **Symbol**: S$
- **Unicode**: U+0053 U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/singapore-dollar
  - Custom: S$ symbol graphic
- **Official**: Monetary Authority of Singapore (https://www.mas.gov.sg/)

#### MYR - Malaysian Ringgit
- **Symbol**: RM
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/malaysian-ringgit
  - Custom: RM symbol graphic
- **Official**: Bank Negara Malaysia (https://www.bnm.gov.my/)

#### THB - Thai Baht
- **Symbol**: ฿
- **Unicode**: U+0E3F
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/thai-baht
  - Custom: ฿ symbol graphic
- **Official**: Bank of Thailand (https://www.bot.or.th/)

#### PHP - Philippine Peso
- **Symbol**: ₱
- **Unicode**: U+20B1
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/philippine-peso
  - Custom: ₱ symbol graphic
- **Official**: Bangko Sentral ng Pilipinas (https://www.bsp.gov.ph/)

#### IDR - Indonesian Rupiah
- **Symbol**: Rp
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/indonesian-rupiah
  - Custom: Rp symbol graphic
- **Official**: Bank Indonesia (https://www.bi.go.id/)

#### VND - Vietnamese Dong
- **Symbol**: ₫
- **Unicode**: U+20AB
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/vietnamese-dong
  - Custom: ₫ symbol graphic
- **Official**: State Bank of Vietnam (https://www.sbv.gov.vn/)

#### KRW - South Korean Won
- **Symbol**: ₩
- **Unicode**: U+20A9
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/south-korean-won
  - Font Awesome: `fa-won-sign`
  - Material Icons: `currency_won`
  - Custom: ₩ symbol graphic
- **Official**: Bank of Korea (https://www.bok.or.kr/)

#### TWD - New Taiwan Dollar
- **Symbol**: NT$
- **Unicode**: U+004E U+0054 U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/taiwan-dollar
  - Custom: NT$ symbol graphic
- **Official**: Central Bank of the Republic of China (Taiwan) (https://www.cbc.gov.tw/)

#### HKD - Hong Kong Dollar
- **Symbol**: HK$
- **Unicode**: U+0048 U+004B U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/hong-kong-dollar
  - Custom: HK$ symbol graphic
- **Official**: Hong Kong Monetary Authority (https://www.hkma.gov.hk/)

#### NZD - New Zealand Dollar
- **Symbol**: NZ$
- **Unicode**: U+004E U+005A U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/new-zealand-dollar
  - Custom: NZ$ symbol graphic
- **Official**: Reserve Bank of New Zealand (https://www.rbnz.govt.nz/)

#### AUD - Australian Dollar
- **Symbol**: A$
- **Unicode**: U+0041 U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/australian-dollar
  - Custom: A$ symbol graphic
- **Official**: Reserve Bank of Australia (https://www.rba.gov.au/)

#### JPY - Japanese Yen
- **Symbol**: ¥
- **Unicode**: U+00A5
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/yen
  - Font Awesome: `fa-yen-sign`
  - Material Icons: `currency_yen`
  - Custom: ¥ symbol graphic
- **Official**: Bank of Japan (https://www.boj.or.jp/)

### Middle East (7 currencies)

#### AED - UAE Dirham
- **Symbol**: د.إ
- **Unicode**: U+062F U+002E U+0625
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/uae-dirham
  - Custom: د.إ symbol graphic
- **Official**: Central Bank of the UAE (https://www.centralbank.ae/)

#### SAR - Saudi Riyal
- **Symbol**: ﷼
- **Unicode**: U+FDFC
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/saudi-riyal
  - Custom: ﷼ symbol graphic
  - Official: Saudi Central Bank unveiled new sign in 2025
- **Official**: Saudi Central Bank (https://www.sama.gov.sa/)

#### QAR - Qatari Riyal
- **Symbol**: ر.ق
- **Unicode**: U+0631 U+002E U+0642
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/qatari-riyal
  - Custom: ر.ق symbol graphic
- **Official**: Qatar Central Bank (https://www.qcb.gov.qa/)

#### BHD - Bahraini Dinar
- **Symbol**: .د.ب
- **Unicode**: U+002E U+062F U+002E U+0628
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/bahraini-dinar
  - Custom: .د.ب symbol graphic
- **Official**: Central Bank of Bahrain (https://www.cbb.gov.bh/)

#### KWD - Kuwaiti Dinar
- **Symbol**: د.ك
- **Unicode**: U+062F U+002E U+0643
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/kuwaiti-dinar
  - Custom: د.ك symbol graphic
- **Official**: Central Bank of Kuwait (https://www.cbk.gov.kw/)

#### OMR - Omani Rial
- **Symbol**: ر.ع.
- **Unicode**: U+0631 U+002E U+0639 U+002E
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/omani-rial
  - Custom: ر.ع. symbol graphic
  - Official: Central Bank of Oman introduced official sign
- **Official**: Central Bank of Oman (https://www.cbo.gov.om/)

#### JOD - Jordanian Dinar
- **Symbol**: د.ا
- **Unicode**: U+062F U+002E U+0627
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/jordanian-dinar
  - Custom: د.ا symbol graphic
- **Official**: Central Bank of Jordan (https://www.cbj.gov.jo/)

### South Asia (2 currencies)

#### INR - Indian Rupee
- **Symbol**: ₹
- **Unicode**: U+20B9
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/indian-rupee
  - Font Awesome: `fa-rupee-sign`
  - Material Icons: `currency_rupee`
  - Custom: ₹ symbol graphic
- **Official**: Reserve Bank of India (https://www.rbi.org.in/)

#### LKR - Sri Lankan Rupee
- **Symbol**: Rs
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/sri-lankan-rupee
  - Custom: Rs symbol graphic
- **Official**: Central Bank of Sri Lanka (https://www.cbsl.gov.lk/)

### Europe - Additional (2 currencies)

#### ISK - Icelandic Krona
- **Symbol**: kr
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/icelandic-krona
  - Custom: kr symbol graphic
- **Official**: Central Bank of Iceland (https://www.cb.is/)

#### TRY - Turkish Lira
- **Symbol**: ₺
- **Unicode**: U+20BA
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/turkish-lira
  - Custom: ₺ symbol graphic
  - Official: Central Bank of Turkey introduced in 2012
- **Official**: Central Bank of the Republic of Turkey (https://www.tcmb.gov.tr/)

### Africa (6 currencies)

#### MAD - Moroccan Dirham
- **Symbol**: د.م.
- **Unicode**: U+062F U+002E U+0645 U+002E
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/moroccan-dirham
  - Custom: د.م. symbol graphic
- **Official**: Bank Al-Maghrib (https://www.bkam.ma/)

#### TZS - Tanzanian Shilling
- **Symbol**: TSh
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/tanzanian-shilling
  - Custom: TSh symbol graphic
- **Official**: Bank of Tanzania (https://www.bot.go.tz/)

#### UGX - Ugandan Shilling
- **Symbol**: USh
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/ugandan-shilling
  - Custom: USh symbol graphic
- **Official**: Bank of Uganda (https://www.bou.or.ug/)

#### ZAR - South African Rand
- **Symbol**: R
- **Unicode**: No single symbol (uses letter)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/south-african-rand
  - Custom: R symbol graphic
- **Official**: South African Reserve Bank (https://www.resbank.co.za/)

#### KES - Kenyan Shilling
- **Symbol**: KSh
- **Unicode**: No single symbol (uses letters)
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/kenyan-shilling
  - Custom: KSh symbol graphic
- **Official**: Central Bank of Kenya (https://www.centralbank.go.ke/)

#### NGN - Nigerian Naira
- **Symbol**: ₦
- **Unicode**: U+20A6
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/nigerian-naira
  - Custom: ₦ symbol graphic
- **Official**: Central Bank of Nigeria (https://www.cbn.gov.ng/)

#### GHS - Ghanaian Cedi
- **Symbol**: ₵
- **Unicode**: U+20B5
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/ghanaian-cedi
  - Custom: ₵ symbol graphic
- **Official**: Bank of Ghana (https://www.bog.gov.gh/)

#### EGP - Egyptian Pound
- **Symbol**: E£
- **Unicode**: U+0045 U+00A3
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/egyptian-pound
  - Custom: E£ symbol graphic
- **Official**: Central Bank of Egypt (https://www.cbe.org.eg/)

### Caribbean (2 currencies)

#### JMD - Jamaican Dollar
- **Symbol**: J$
- **Unicode**: U+004A U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/jamaican-dollar
  - Custom: J$ symbol graphic
- **Official**: Bank of Jamaica (https://www.boj.org.jm/)

#### TTD - Trinidad Dollar
- **Symbol**: TT$
- **Unicode**: U+0054 U+0054 U+0024
- **Icon Sources**:
  - Icons8: https://icons8.com/icons/set/trinidad-dollar
  - Custom: TT$ symbol graphic
- **Official**: Central Bank of Trinidad and Tobago (https://www.central-bank.org.tt/)

## Implementation Recommendations

### Option 1: Icons8 Currency Icons (Recommended)
- **Source**: https://icons8.com/icons/set/currency
- **License**: Free with attribution or paid for commercial use
- **Format**: SVG, PNG
- **Coverage**: Most major currencies
- **Quality**: Professional, consistent style

### Option 2: Custom Currency Symbol Graphics
- **Source**: Design custom icons based on Unicode symbols
- **Format**: SVG (scalable, crisp at any size)
- **Style**: Consistent design language matching TopDog brand
- **Location**: `/public/icons/currencies/`

### Option 3: Font-Based Currency Symbols (Current)
- **Source**: Unicode symbols via fonts
- **Format**: Text-based (already implemented)
- **Pros**: No assets needed, always crisp
- **Cons**: Less visually distinctive

### Option 4: Hybrid Approach (Best UX)
- **Display**: Stylized currency icon + currency code + symbol
- **Example**: [€ icon] EUR (€)
- **Implementation**: Icon library + current symbol display

## Recommended Asset Sources

### Icons8 Currency Icons
- **Base URL**: `https://icons8.com/icons/set/[currency-name]`
- **License**: Free with attribution link or paid license
- **Format**: SVG, PNG (multiple sizes)
- **Naming**: `currency-[code].svg` (e.g., `currency-usd.svg`)

### Flaticon Currency Icons
- **URL**: https://www.flaticon.com/search?word=currency
- **License**: Free with attribution or premium license
- **Format**: SVG, PNG

### Font Awesome Currency Icons
- **Available Icons**: 
  - `fa-dollar-sign` (USD)
  - `fa-euro-sign` (EUR)
  - `fa-pound-sign` (GBP)
  - `fa-yen-sign` (JPY)
  - `fa-won-sign` (KRW)
  - `fa-rupee-sign` (INR)
- **Format**: Font-based (SVG icons available)

### Material Icons Currency Symbols
- **Available Icons**:
  - `attach_money` (USD)
  - `euro_symbol` (EUR)
  - `currency_pound` (GBP)
  - `currency_yen` (JPY)
  - `currency_won` (KRW)
  - `currency_rupee` (INR)
- **Format**: Font-based (SVG icons available)

## Asset Organization

```
public/
  icons/
    currencies/
      usd.svg
      eur.svg
      gbp.svg
      jpy.svg
      ... (54 total)
```

## Next Steps

1. **Download currency icons** from Icons8 or create custom SVG icons
2. **Create CurrencyIcon component** that displays the icon + code + symbol
3. **Update CurrencySelector** to use currency icons instead of just symbols
4. **Test across all 54 currencies** for visual consistency
5. **Optimize assets** (SVG optimization, ensure consistent sizing)

## Legal Considerations

- **Icons8**: Free with attribution link or paid license for commercial use
- **Flaticon**: Free with attribution or premium license
- **Font Awesome**: Free tier available, Pro for commercial
- **Custom Icons**: Full ownership, no attribution needed
- **Unicode Symbols**: Free to use (public domain)

## References

- ISO 4217 Currency Codes: https://www.iso.org/iso-4217-currency-codes.html
- Unicode Currency Symbols: https://www.unicode.org/charts/PDF/U20A0.pdf
- XE Currency Symbols: https://www.xe.com/symbols.php
- Icons8 Currency Icons: https://icons8.com/icons/set/currency
- Flaticon Currency Icons: https://www.flaticon.com/search?word=currency
