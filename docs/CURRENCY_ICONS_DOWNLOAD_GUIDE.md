# Currency Icons Download & Replacement Guide

> Step-by-step guide to replace placeholder icons with designed currency icons

## Current Status

- **Placeholder Icons**: 141/141 functional (Unicode symbols in SVG)
- **Designed Icons**: 0/141 (ready to be added)
- **System**: Production-ready, will automatically use new icons when replaced

## Recommended Icon Sources

### 🏆 Top Recommendations

#### 1. **Hexmos Free Currency Icons** (Best for Free)
- **URL**: https://hexmos.com/freedevtools/svg_icons/currency/
- **Coverage**: 19 major currencies (USD, EUR, GBP, JPY, CNY, etc.)
- **License**: Free
- **Format**: SVG
- **Quality**: Professional, consistent style
- **Best For**: Major currencies (USD, EUR, GBP, JPY, CNY, INR, etc.)

#### 2. **SVG Repo Currency Icons** (Best Coverage)
- **URL**: https://www.svgrepo.com/vectors/currency/symbol/
- **Coverage**: Extensive collection
- **License**: Free (check individual licenses)
- **Format**: SVG
- **Quality**: Varies, but good selection
- **Best For**: Finding specific currency symbols

#### 3. **Icons8 Currency Icons** (Premium Quality)
- **URL**: https://icons8.com/icons/set/currency
- **Coverage**: Most major currencies
- **License**: Free with attribution OR paid commercial license
- **Format**: SVG, PNG (multiple sizes)
- **Quality**: Professional, consistent
- **Best For**: Production-ready icons with consistent style

#### 4. **Flaticon Currency Icons**
- **URL**: https://www.flaticon.com/search?word=currency
- **Coverage**: Good selection
- **License**: Free with attribution OR premium license
- **Format**: SVG, PNG
- **Quality**: Professional
- **Best For**: Alternative source if Icons8 doesn't have specific currency

### Additional Sources

#### 5. **Iconfinder**
- **URL**: https://www.iconfinder.com/icons/2449488/currency_currency_symbol_dollar_money_united_states_icon
- **Coverage**: Premium icons
- **License**: Paid (various licenses)
- **Format**: SVG, PNG
- **Quality**: High quality, customizable

#### 6. **Font Awesome / Material Icons** (Limited)
- **Coverage**: Only major currencies (USD, EUR, GBP, JPY, INR, etc.)
- **Format**: Font icons (can be converted to SVG)
- **Best For**: Major currencies only

## Replacement Process

### Option A: Manual Download & Replace (Recommended for Quality Control)

#### Step 1: Download Icons

1. **Start with Major Currencies** (Priority 1 - 54 transaction currencies):
   - Visit Hexmos: https://hexmos.com/freedevtools/svg_icons/currency/
   - Download SVG files for: USD, EUR, GBP, JPY, CAD, AUD, CHF, etc.
   - Save with naming: `currency-[code].svg` (e.g., `currency-usd.svg`)

2. **Fill Gaps with SVG Repo**:
   - Visit: https://www.svgrepo.com/vectors/currency/symbol/
   - Search for missing currencies
   - Download and save with correct naming

3. **Use Icons8 for Remaining**:
   - Visit: https://icons8.com/icons/set/currency
   - Search for specific currency codes
   - Download SVG format

#### Step 2: Prepare Icons

1. **Standardize Format**:
   ```bash
   # Ensure all SVGs have:
   # - viewBox="0 0 24 24" (or similar square viewBox)
   # - width="24" height="24"
   # - fill="currentColor" (for color customization)
   ```

2. **Optimize Icons**:
   ```bash
   # Install SVGO if not already installed
   npm install -g svgo
   
   # Optimize all icons
   svgo -f public/icons/currencies --multipass
   ```

3. **Verify Naming**:
   - All files must be: `currency-[code].svg`
   - Code must be lowercase (e.g., `currency-usd.svg`, not `currency-USD.svg`)
   - Match exactly with `currencyIcons.ts` configuration

#### Step 3: Replace Placeholder Icons

1. **Backup Current Icons** (optional):
   ```bash
   cp -r public/icons/currencies public/icons/currencies-backup
   ```

2. **Replace Icons**:
   ```bash
   # Copy new icons to directory
   cp /path/to/downloaded/icons/*.svg public/icons/currencies/
   ```

3. **Validate**:
   ```bash
   node scripts/validate-currency-icons.js
   ```

#### Step 4: Test

1. **Visual Check**:
   - Open app and check CurrencySelector
   - Verify icons display correctly
   - Check different sizes (16px, 24px, 32px)

2. **Fallback Test**:
   - Temporarily rename one icon file
   - Verify fallback to Unicode symbol works

3. **Performance Check**:
   - Check bundle size impact
   - Verify lazy loading works
   - Test on slow connection

### Option B: Automated Script (Coming Soon)

A helper script is available to assist with downloading and replacing icons:

```bash
# Run the replacement helper
node scripts/replace-currency-icons.js --source hexmos --currencies USD,EUR,GBP
```

**Note**: This script will be created to help automate the process while maintaining quality control.

## Icon Requirements

### Technical Requirements

- **Format**: SVG (preferred) or PNG
- **Size**: 24x24px (or scalable SVG with viewBox)
- **Naming**: `currency-[code].svg` (lowercase code)
- **Color**: Use `currentColor` or `fill="currentColor"` for theme support
- **File Size**: <10KB per icon (preferably <5KB)
- **ViewBox**: `0 0 24 24` (standardized)

### Style Requirements

- **Consistency**: All icons should have similar style
- **Clarity**: Symbols should be recognizable at small sizes
- **Simplicity**: Avoid overly complex designs
- **Accessibility**: High contrast, clear symbols

## Priority Order

### Phase 1: Transaction Currencies (54 currencies)
These are the most important as they're used for deposits/withdrawals:
- USD, EUR, GBP, JPY, CAD, AUD, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN, HRK, ISK, TRY, BRL, CLP, COP, PEN, DOP, UYU, SGD, MYR, THB, PHP, IDR, VND, KRW, TWD, HKD, NZD, AED, SAR, QAR, BHD, KWD, OMR, JOD, INR, LKR, MAD, TZS, UGX, ZAR, KES, NGN, GHS, EGP, JMD, TTD

### Phase 2: Major Display Currencies (30 currencies)
Common currencies used for display/formatting:
- CNY, ILS, PKR, BDT, NPR, ARS, RUB, UAH, BYN, GEL, AMD, AZN, LBP, IQD, YER, SYP, DZD, TND, XOF, XAF, MUR, NAD, BWP, ZMW, MWK, MZN, AOA, ETB, RWF, BIF

### Phase 3: Remaining Display Currencies (57 currencies)
All other currencies in CURRENCY_SYMBOLS

## Quality Checklist

Before replacing icons, verify:

- [ ] Icon matches currency symbol correctly
- [ ] File is properly named: `currency-[code].svg`
- [ ] SVG is valid (opens in browser/editor)
- [ ] Icon scales properly (test at 16px, 24px, 32px)
- [ ] Uses `currentColor` for theming
- [ ] File size is reasonable (<10KB)
- [ ] Style is consistent with other icons
- [ ] Icon is recognizable at small sizes

## Validation

After replacing icons:

```bash
# Run validation
node scripts/validate-currency-icons.js

# Expected output:
# ✅ Valid icons: 141/141
# ❌ Missing icons: 0
# ⚠️  Invalid icons: 0
```

## Troubleshooting

### Icon Not Displaying
1. Check file name matches exactly (case-sensitive)
2. Verify file exists in `/public/icons/currencies/`
3. Check browser console for 404 errors
4. Verify SVG is valid (open in browser)

### Icon Looks Wrong
1. Check SVG viewBox matches standard (0 0 24 24)
2. Verify fill color is `currentColor`
3. Check icon isn't too complex for small sizes

### Performance Issues
1. Optimize SVGs with SVGO
2. Check total bundle size
3. Verify lazy loading is working

## Next Steps

1. **Start with Phase 1** (54 transaction currencies)
2. **Download from Hexmos** for major currencies
3. **Fill gaps** with SVG Repo or Icons8
4. **Validate** after each batch
5. **Test** in application
6. **Repeat** for Phase 2 and Phase 3

## Resources

- **Validation Script**: `scripts/validate-currency-icons.js`
- **Icon Config**: `lib/stripe/currencyIcons.ts`
- **Component**: `components/vx2/components/CurrencyIcon.tsx`
- **Icon Directory**: `public/icons/currencies/`

---

**Last Updated**: [Current Date]
**Status**: Ready for icon replacement
**Placeholder Icons**: 141/141 functional
**Designed Icons**: 0/141 (to be added)

