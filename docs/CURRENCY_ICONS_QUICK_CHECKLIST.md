# Currency Icons Quick Review Checklist

> Quick reference checklist for reviewing currency icon implementation

## Pre-Review Setup

- [ ] Run validation script: `node scripts/validate-currency-icons.js`
- [ ] Review `docs/CURRENCY_ICONS_RESOURCES.md`
- [ ] Review `docs/CURRENCY_ICONS_IMPLEMENTATION_GUIDE.md`
- [ ] Review `lib/stripe/currencyIcons.ts`

## Configuration Review

### Currency Coverage
- [ ] All 54 currencies from `currencyConfig.ts` are in `currencyIcons.ts`
- [ ] All 141 currencies from `CURRENCY_SYMBOLS` have icon support
- [ ] No missing currencies
- [ ] No duplicate entries
- [ ] Currency codes match ISO 4217

### Icon Paths
- [ ] All paths follow: `/icons/currencies/currency-[code].svg`
- [ ] No typos in currency codes
- [ ] Paths are consistent

### Unicode Fallbacks
- [ ] All currencies have Unicode symbols
- [ ] Symbols are correct
- [ ] Match symbols in `currencyConfig.ts`
- [ ] Special characters properly encoded

## Asset Review

### Icon Files
- [ ] Icon directory exists: `/public/icons/currencies/`
- [ ] All 141 icon files exist (all currencies in CURRENCY_SYMBOLS)
- [ ] Files are named correctly: `currency-[code].svg`
- [ ] All files are valid SVG
- [ ] File sizes are reasonable (<10KB each, ~356 bytes average)

### Icon Quality
- [ ] Icons are recognizable
- [ ] Icons are consistent in style
- [ ] Icons work at small sizes (16px)
- [ ] Icons are optimized (SVGO)

## Code Review

### TypeScript Configuration
- [ ] `currencyIcons.ts` has no TypeScript errors
- [ ] All types are correct
- [ ] Helper functions work correctly
- [ ] Exports are correct

### Component Integration
- [ ] `CurrencyIcon` component exists (if created)
- [ ] `CurrencySelector` uses icons (if updated)
- [ ] Fallback mechanism works
- [ ] Error handling implemented

## Testing

### Functionality
- [ ] All 54 currencies display icons
- [ ] Fallback to Unicode works
- [ ] Error handling works
- [ ] Loading states work

### Visual
- [ ] Icons display correctly
- [ ] Icons scale properly
- [ ] No layout shift
- [ ] Consistent styling

### Accessibility
- [ ] Icons have alt text
- [ ] Icons have ARIA labels
- [ ] Screen reader compatible
- [ ] High contrast mode works

### Browser Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Performance

- [ ] Icons load quickly
- [ ] No performance regressions
- [ ] Bundle size impact is minimal
- [ ] Lazy loading implemented (if needed)

## Documentation

- [ ] Implementation guide is complete
- [ ] Resource list is accurate
- [ ] Code is documented
- [ ] Examples are provided

## Quick Commands

```bash
# Validate icons (should show 141 currencies)
node scripts/validate-currency-icons.js

# Check TypeScript
npx tsc --noEmit lib/stripe/currencyIcons.ts

# Check for linting errors
npx eslint lib/stripe/currencyIcons.ts

# Count currency icons (should be 141)
ls -1 public/icons/currencies/*.svg | wc -l
```

## Common Issues

### Missing Icons
- **Symptom**: Validation script reports missing files
- **Fix**: Download/create missing icon files
- **Check**: Verify naming convention

### Invalid SVG
- **Symptom**: Validation script reports invalid files
- **Fix**: Check SVG structure, run SVGO
- **Check**: File encoding, XML structure

### TypeScript Errors
- **Symptom**: Type errors in `currencyIcons.ts`
- **Fix**: Check types, imports, exports
- **Check**: Match `currencyConfig.ts` structure

### Component Not Updated
- **Symptom**: Icons don't display in UI
- **Fix**: Update `CurrencySelector` to use icons
- **Check**: Import paths, component props

## Review Status

- [ ] Configuration reviewed
- [ ] Assets reviewed
- [ ] Code reviewed
- [ ] Testing completed
- [ ] Documentation reviewed
- [ ] Ready for implementation

---

**Last Updated**: [Current Date]
**Reviewer**: [Name]

