# Currency Icons Implementation Guide

> Philosophy: Enterprise grade. Fanatical about UX. Take your time, quality over speed. Think longer before responding.

## Overview

This guide explains how to implement currency icons for all 141 supported currencies in the TopDog platform. Currency icons are visual representations of currency symbols (€, $, £, ¥, etc.) that enhance user experience and make currency selection more intuitive.

**Currency Support**:
- **54 currencies**: Full transaction support (deposits/withdrawals) - defined in `currencyConfig.ts`
- **141 currencies**: Display/formatting support - defined in `CURRENCY_SYMBOLS`
- **All 141 currencies**: Have icon support with fallback to Unicode symbols

## Files Created

1. **`docs/CURRENCY_ICONS_RESOURCES.md`** - Comprehensive resource list with official sources for all 54 currencies
2. **`lib/stripe/currencyIcons.ts`** - TypeScript configuration mapping currencies to icon resources

## Quick Start

### Step 1: Download Currency Icons

Choose one of these options:

#### Option A: Icons8 (Recommended)
1. Visit https://icons8.com/icons/set/currency
2. Download icons for all 54 currencies
3. Save as SVG files in `/public/icons/currencies/`
4. Naming: `currency-[code].svg` (e.g., `currency-usd.svg`)

#### Option B: Custom SVG Icons
1. Design custom currency symbol icons
2. Ensure consistent style and sizing
3. Save as SVG in `/public/icons/currencies/`

#### Option C: Font-Based Icons (Current)
- Already implemented using Unicode symbols
- No additional assets needed
- Less visually distinctive

### Step 2: Verify Icon Files

Ensure all 141 currency icons exist:
- `/public/icons/currencies/currency-usd.svg`
- `/public/icons/currencies/currency-eur.svg`
- `/public/icons/currencies/currency-gbp.svg`
- `/public/icons/currencies/currency-cny.svg`
- `/public/icons/currencies/currency-ils.svg`
- ... (all 141 currencies)

Run validation: `node scripts/validate-currency-icons.js`

### Step 3: Update CurrencySelector Component

The `CurrencySelector` component currently displays currency symbols. To add icons:

```typescript
import { getCurrencyIconPath, getCurrencyUnicode } from '../../../lib/stripe/currencyIcons';

// In the component:
const iconPath = getCurrencyIconPath(currency);
const fallbackSymbol = getCurrencyUnicode(currency);

// Display icon:
{iconPath ? (
  <img src={iconPath} alt={currency} className="w-6 h-6" />
) : (
  <span>{fallbackSymbol}</span>
)}
```

## Currency Icon Sources

### Primary Sources

1. **Icons8** (https://icons8.com/icons/set/currency)
   - Professional, consistent style
   - Free with attribution or paid license
   - SVG and PNG formats available

2. **Flaticon** (https://www.flaticon.com/search?word=currency)
   - Large collection
   - Free with attribution or premium license

3. **Font Awesome** (Limited)
   - Available for: USD, EUR, GBP, JPY, KRW, INR
   - Font-based icons

4. **Material Icons** (Limited)
   - Available for: USD, EUR, GBP, JPY, KRW, INR
   - Font-based icons

### Custom Design

For currencies without icon library support:
- Design custom SVG icons based on Unicode symbols
- Maintain consistent style across all icons
- Ensure icons are recognizable at small sizes (16x16 to 32x32px)

## Implementation Details

### File Structure

```
public/
  icons/
    currencies/
      currency-usd.svg
      currency-eur.svg
      currency-gbp.svg
      ... (54 total)
```

### TypeScript Configuration

The `currencyIcons.ts` file provides:
- Icon path mappings
- Fallback Unicode symbols
- Helper functions for icon retrieval

### Usage Example

```typescript
import { 
  getCurrencyIconPath, 
  getCurrencyUnicode,
  hasCurrencyIcon 
} from '@/lib/stripe/currencyIcons';

// Check if icon exists
if (hasCurrencyIcon('USD')) {
  const iconPath = getCurrencyIconPath('USD'); // '/icons/currencies/currency-usd.svg'
  const fallback = getCurrencyUnicode('USD'); // '$'
}
```

## All 54 Currencies

### North America (3)
- USD, CAD, MXN

### Europe (13)
- EUR, GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN, HRK, ISK, TRY

### Latin America (6)
- BRL, CLP, COP, PEN, DOP, UYU

### Asia-Pacific (11)
- SGD, MYR, THB, PHP, IDR, VND, KRW, TWD, HKD, NZD, AUD, JPY

### Middle East (7)
- AED, SAR, QAR, BHD, KWD, OMR, JOD

### South Asia (2)
- INR, LKR

### Africa (6)
- MAD, TZS, UGX, ZAR, KES, NGN, GHS, EGP

### Caribbean (2)
- JMD, TTD

## Testing Checklist

- [ ] All 54 currency icons display correctly
- [ ] Fallback to Unicode symbol when icon missing
- [ ] Icons are crisp at all sizes (16px, 24px, 32px, 48px)
- [ ] Icons maintain aspect ratio
- [ ] Loading states handled gracefully
- [ ] Error states show fallback symbol
- [ ] Icons accessible (alt text, ARIA labels)
- [ ] Consistent styling across all icons

## Legal Considerations

- **Icons8**: Free with attribution link or paid license
- **Flaticon**: Free with attribution or premium license
- **Font Awesome**: Free tier available, Pro for commercial
- **Custom Icons**: Full ownership, no attribution needed
- **Unicode Symbols**: Public domain, free to use

## Next Steps

1. Download or create currency icons for all 54 currencies
2. Place icons in `/public/icons/currencies/`
3. Update `CurrencySelector` component to use icons
4. Test across all currencies
5. Optimize SVG files for web (SVGO)
6. Add loading/error states
7. Update documentation

## References

- **Resource Document**: `docs/CURRENCY_ICONS_RESOURCES.md`
- **Configuration File**: `lib/stripe/currencyIcons.ts`
- **Currency Config**: `lib/stripe/currencyConfig.ts`
- **Icons8**: https://icons8.com/icons/set/currency
- **Unicode Currency Symbols**: https://www.unicode.org/charts/PDF/U20A0.pdf

