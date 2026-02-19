# Manual Currency Icons Download Guide

> Step-by-step guide to manually download and replace currency icons

## Current Status

- **Placeholder Icons**: 141/141 functional (ready to replace)
- **Real Icons**: 0/141 (to be downloaded)

## Quick Process (10-15 minutes)

### Step 1: Download Icons from Vecteezy (RECOMMENDED - 5 min)

1. **Visit**: https://www.vecteezy.com/vector-art/6229459-money-symbol-black-circle-set-on-white-international-currency-icon-set
2. **Create free account** (if needed)
3. **Download** SVG format
4. **Extract** and save to folder like `~/Downloads/currency-icons-vecteezy/`
5. **Rename** files to `currency-[code].svg` format

**Vecteezy Set**: International currency icon set with consistent black circle design

**See**: `docs/CURRENCY_ICONS_VECTEEZY_GUIDE.md` for detailed instructions

### Alternative: Download from Hexmos (5 min)

1. **Visit**: https://hexmos.com/freedevtools/svg_icons/currency/
2. **Download** all available SVG files
3. **Save** to a folder like `~/Downloads/currency-icons/`

**Available on Hexmos** (19 major currencies):
- USD, EUR, GBP, JPY, CNY, INR, AUD, CAD, CHF, HKD, SGD, NZD, KRW, MXN, BRL, ZAR, TRY, RUB, SEK

### Step 2: Fill Gaps from SVG Repo (5 min)

1. **Visit**: https://www.svgrepo.com/vectors/currency/symbol/
2. **Search** for missing currencies (e.g., "PKR", "ILS", "BDT")
3. **Download** SVG format
4. **Save** to same folder

### Step 3: Prepare and Replace (2 min)

```bash
# 1. Check what you downloaded
node scripts/replace-currency-icons.js --check-source ~/Downloads/currency-icons

# 2. Backup current icons (optional)
node scripts/replace-currency-icons.js --backup

# 3. Copy new icons (ensure naming is correct: currency-[code].svg)
cp ~/Downloads/currency-icons/*.svg public/icons/currencies/

# 4. Validate
node scripts/validate-currency-icons.js
```

### Step 4: Test (1 min)

1. Open app → Check CurrencySelector
2. Verify icons display correctly

## Detailed Instructions

### Option A: Hexmos (Best for Major Currencies)

**URL**: https://hexmos.com/freedevtools/svg_icons/currency/

**Steps**:
1. Visit the page
2. Scroll through available currencies
3. Click each currency icon
4. Download as SVG
5. Rename to: `currency-[code].svg` (e.g., `currency-usd.svg`)

**Coverage**: ~19 major currencies

### Option B: SVG Repo (Best Coverage)

**URL**: https://www.svgrepo.com/vectors/currency/symbol/

**Steps**:
1. Visit the page
2. Use search: type currency code (e.g., "PKR", "ILS")
3. Click on icon
4. Click "Download SVG"
5. Rename to: `currency-[code].svg`

**Coverage**: Extensive, but requires searching

### Option C: Icons8 (Premium Quality)

**URL**: https://icons8.com/icons/set/currency

**Steps**:
1. Visit the page
2. Search for currency (e.g., "dollar", "euro")
3. Select icon
4. Choose "SVG" format
5. Download (may require account for free download)
6. Rename to: `currency-[code].svg`

**Coverage**: Most major currencies

### Option D: Flaticon (Alternative)

**URL**: https://www.flaticon.com/search?word=currency

**Steps**:
1. Visit the page
2. Search for specific currency
3. Download SVG
4. Rename to: `currency-[code].svg`

## Naming Requirements

**Critical**: All icons MUST be named exactly:
```
currency-[code].svg
```

Where `[code]` is the **lowercase** currency code:
- ✅ `currency-usd.svg`
- ✅ `currency-eur.svg`
- ✅ `currency-pkr.svg`
- ❌ `currency-USD.svg` (wrong case)
- ❌ `usd.svg` (missing prefix)
- ❌ `USD.svg` (wrong format)

## Icon Requirements

Before replacing, ensure icons meet these requirements:

- [ ] **Format**: SVG (not PNG, JPG, etc.)
- [ ] **Naming**: `currency-[code].svg` (lowercase)
- [ ] **ViewBox**: Should have `viewBox="0 0 24 24"` (or similar)
- [ ] **Color**: Uses `currentColor` or `fill="currentColor"` for theming
- [ ] **Size**: Reasonable file size (<10KB, preferably <5KB)
- [ ] **Valid**: Opens correctly in browser/editor

## Validation Commands

```bash
# Check what you downloaded
node scripts/replace-currency-icons.js --check-source ~/Downloads/currency-icons

# List all placeholders (what needs replacing)
node scripts/replace-currency-icons.js --list-placeholders

# Validate after replacing
node scripts/validate-currency-icons.js
```

## Priority Order

### Phase 1: Transaction Currencies (54) - HIGH PRIORITY

These are used for deposits/withdrawals:

USD, EUR, GBP, JPY, CAD, AUD, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN, HRK, ISK, TRY, BRL, CLP, COP, PEN, DOP, UYU, SGD, MYR, THB, PHP, IDR, VND, KRW, TWD, HKD, NZD, AED, SAR, QAR, BHD, KWD, OMR, JOD, INR, LKR, MAD, TZS, UGX, ZAR, KES, NGN, GHS, EGP, JMD, TTD

### Phase 2: Major Display Currencies (30) - MEDIUM PRIORITY

Common currencies for display:

CNY, ILS, PKR, BDT, NPR, ARS, RUB, UAH, BYN, GEL, AMD, AZN, LBP, IQD, YER, SYP, DZD, TND, XOF, XAF, MUR, NAD, BWP, ZMW, MWK, MZN, AOA, ETB, RWF, BIF

### Phase 3: Remaining (57) - LOW PRIORITY

All other currencies in CURRENCY_SYMBOLS

## Troubleshooting

### Icon Not Displaying

1. **Check filename**: Must be exactly `currency-[code].svg` (lowercase)
2. **Check location**: Must be in `public/icons/currencies/`
3. **Check SVG validity**: Open file in browser to verify
4. **Check browser console**: Look for 404 errors

### Icon Looks Wrong

1. **Check viewBox**: Should be `0 0 24 24` or similar square
2. **Check fill color**: Should use `currentColor` for theming
3. **Check complexity**: Icon might be too detailed for small sizes

### File Size Too Large

1. **Optimize with SVGO**:
   ```bash
   npm install -g svgo
   svgo -f public/icons/currencies --multipass
   ```

## Quick Reference

**Icon Directory**: `public/icons/currencies/`  
**Naming Pattern**: `currency-[code].svg`  
**Validation**: `node scripts/validate-currency-icons.js`  
**Helper Script**: `node scripts/replace-currency-icons.js --help`

---

**Status**: Ready for manual download  
**Estimated Time**: 10-15 minutes for major currencies  
**Difficulty**: Easy (just download and copy files)

