# Currency Icons Quick Start

> Quick reference for replacing placeholder icons with real currency icons

## Current Status

✅ **141/141 placeholder icons** - All functional, ready to be replaced  
⏳ **0/141 real icons** - Ready to add designed icons

## Fast Track: Get Real Icons

### Step 1: Download Icons (5 minutes)

**Best Free Source**: Hexmos
1. Visit: https://hexmos.com/freedevtools/svg_icons/currency/
2. Download SVG files for major currencies
3. Save to a temporary folder

**Fill Gaps**: SVG Repo
1. Visit: https://www.svgrepo.com/vectors/currency/symbol/
2. Search for missing currencies
3. Download SVG format

### Step 2: Prepare Icons (2 minutes)

```bash
# Ensure correct naming: currency-[code].svg (lowercase)
# Example: currency-usd.svg, currency-eur.svg

# Check your downloaded icons
node scripts/replace-currency-icons.js --check-source ./downloaded-icons
```

### Step 3: Replace Icons (1 minute)

```bash
# Backup current icons (optional but recommended)
node scripts/replace-currency-icons.js --backup

# Copy new icons
cp downloaded-icons/*.svg public/icons/currencies/

# Validate
node scripts/validate-currency-icons.js
```

### Step 4: Test (2 minutes)

1. Open app → CurrencySelector
2. Verify icons display correctly
3. Check different sizes work

**Done!** 🎉

## Icon Sources (Priority Order)

1. **Hexmos** (Free, 19 major currencies)
   - https://hexmos.com/freedevtools/svg_icons/currency/
   
2. **SVG Repo** (Free, extensive coverage)
   - https://www.svgrepo.com/vectors/currency/symbol/
   
3. **Icons8** (Free with attribution or paid)
   - https://icons8.com/icons/set/currency

## Helper Commands

```bash
# List all placeholder icons
node scripts/replace-currency-icons.js --list-placeholders

# Check source directory
node scripts/replace-currency-icons.js --check-source ./my-icons

# Create backup
node scripts/replace-currency-icons.js --backup

# Validate all icons
node scripts/replace-currency-icons.js --validate
```

## Requirements

- **Naming**: `currency-[code].svg` (lowercase code)
- **Format**: SVG
- **Size**: 24x24px viewBox
- **Color**: Use `currentColor` for theming
- **Location**: `public/icons/currencies/`

## Full Guide

See `docs/CURRENCY_ICONS_DOWNLOAD_GUIDE.md` for detailed instructions.

---

**Status**: Ready to replace placeholders with real icons  
**Placeholders**: 141/141 functional  
**Real Icons**: 0/141 (to be added)

