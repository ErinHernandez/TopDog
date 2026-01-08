# Currency Icons

This directory contains SVG icon files for all supported currencies.

## File Naming Convention

Icons should be named: `currency-[code].svg` (lowercase currency code)

Examples:
- `currency-usd.svg` - US Dollar
- `currency-eur.svg` - Euro
- `currency-gbp.svg` - British Pound

## Icon Specifications

- **Format**: SVG (preferred) or PNG
- **Size**: 24x24px viewBox (recommended: `0 0 24 24`)
- **Style**: Consistent across all icons
- **Optimization**: Run SVGO before committing
- **File Size**: <5KB per icon (ideal)

## Adding Icons

1. Download or create icon for currency
2. Optimize with SVGO: `npx svgo currency-[code].svg`
3. Verify icon displays correctly at 16px, 24px, and 32px
4. Run validation: `node scripts/validate-currency-icons.js`

## Current Status

- **Total Currencies**: 141 (all currencies in CURRENCY_SYMBOLS)
- **Icons Available**: 141/141 ✅
- **Transaction Currencies**: 54 (full deposit/withdrawal support)
- **Display-Only Currencies**: 87 (formatting/display support)
- **Icon Type**: Placeholder SVG icons (Unicode symbols)
- **File Size**: ~356 bytes average (very optimized, ~50KB total)
- **Status**: Functional placeholders - ready for official icons

### Icon Generation

Icons were generated using `scripts/generate-currency-icons.js` which creates SVG files with Unicode currency symbols. These are functional placeholders that work immediately.

**To replace with official icons:**
1. Download official icons from Icons8, Flaticon, or design custom
2. Replace files in this directory
3. Maintain naming: `currency-[code].svg`
4. Run validation: `node scripts/validate-currency-icons.js`

## Validation

Run the validation script to check icon status:
```bash
node scripts/validate-currency-icons.js
```

