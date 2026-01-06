# Vecteezy Currency Icons Download Guide

> Step-by-step guide to download and use currency icons from Vecteezy

## Vecteezy Currency Icon Set

**Link**: https://www.vecteezy.com/vector-art/6229459-money-symbol-black-circle-set-on-white-international-currency-icon-set

**Description**: International currency icon set with money symbols in black circles on white background. Professional, consistent design.

## Download Process

### Step 1: Access the Page

1. Visit: https://www.vecteezy.com/vector-art/6229459-money-symbol-black-circle-set-on-white-international-currency-icon-set
2. You may need to create a free Vecteezy account (if prompted)

### Step 2: Download the Set

1. Click the **"Download"** button
2. Choose **SVG** format (recommended for web)
3. Alternative formats: AI (Adobe Illustrator), EPS
4. Save the downloaded file

### Step 3: Extract Icons

The download will likely be:
- A ZIP file containing multiple SVG files, OR
- A single SVG file with multiple icons, OR
- An AI/EPS file that needs to be exported

**If ZIP file**:
```bash
# Extract the ZIP
unzip ~/Downloads/currency-icons-vecteezy.zip -d ~/Downloads/currency-icons-vecteezy/

# Check contents
ls ~/Downloads/currency-icons-vecteezy/
```

**If single SVG with multiple icons**:
- You'll need to split it into individual files
- Use a tool like Inkscape, Illustrator, or online SVG splitter

**If AI/EPS file**:
- Open in Adobe Illustrator or Inkscape
- Export each currency as individual SVG file

### Step 4: Prepare Icons

#### A. Rename Files

All icons must be named: `currency-[code].svg` (lowercase code)

Example:
- `dollar.svg` → `currency-usd.svg`
- `euro.svg` → `currency-eur.svg`
- `yen.svg` → `currency-jpy.svg`
- `pound.svg` → `currency-gbp.svg`

#### B. Optimize Icons

1. **Ensure proper viewBox**:
   ```xml
   <svg viewBox="0 0 24 24" width="24" height="24">
   ```

2. **Use currentColor for theming**:
   ```xml
   <!-- Replace black fills with currentColor -->
   fill="currentColor"
   ```

3. **Remove fixed colors** (if you want theme support):
   ```bash
   # Use SVGO or manual editing
   # Replace: fill="#000000" with fill="currentColor"
   # Replace: fill="black" with fill="currentColor"
   ```

#### C. Check Icon Requirements

- [ ] Format: SVG
- [ ] Naming: `currency-[code].svg` (lowercase)
- [ ] ViewBox: `0 0 24 24` (or similar square)
- [ ] Color: Uses `currentColor` for theming
- [ ] Size: <10KB per icon

### Step 5: Validate Before Replacing

```bash
# Check your prepared icons
node scripts/replace-currency-icons.js --check-source ~/Downloads/currency-icons-vecteezy

# This will show:
# - Which currencies you have
# - Which are missing
# - Any naming issues
```

### Step 6: Replace Icons

```bash
# 1. Backup current icons (optional but recommended)
node scripts/replace-currency-icons.js --backup

# 2. Copy new icons
cp ~/Downloads/currency-icons-vecteezy/currency-*.svg public/icons/currencies/

# 3. Validate replacement
node scripts/validate-currency-icons.js
```

### Step 7: Test

1. Open your application
2. Navigate to CurrencySelector
3. Verify icons display correctly
4. Check different sizes (16px, 24px, 32px)
5. Verify theming works (if using currentColor)

## Icon Processing Script

If you need to process multiple icons, here's a helper script:

```bash
#!/bin/bash
# process-vecteezy-icons.sh

SOURCE_DIR="$1"
TARGET_DIR="public/icons/currencies"

# Ensure target exists
mkdir -p "$TARGET_DIR"

# Process each SVG
for file in "$SOURCE_DIR"/*.svg; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    
    # Extract currency code from filename (adjust pattern as needed)
    # Example: dollar.svg -> currency-usd.svg
    # You may need to manually map filenames to currency codes
    
    # For now, just copy and rename manually
    echo "Processing: $filename"
  fi
done
```

## Manual Mapping

Vecteezy icons may have names like:
- `dollar.svg` → `currency-usd.svg`
- `euro.svg` → `currency-eur.svg`
- `yen.svg` → `currency-jpy.svg`
- `pound.svg` → `currency-gbp.svg`
- `rupee.svg` → `currency-inr.svg`
- `won.svg` → `currency-krw.svg`
- etc.

**Create a mapping file** to help rename:
```json
{
  "dollar": "usd",
  "euro": "eur",
  "yen": "jpy",
  "pound": "gbp",
  "rupee": "inr",
  "won": "krw",
  "yuan": "cny",
  "peso": "mxn",
  "real": "brl",
  "rand": "zar"
}
```

## Color Customization

Vecteezy icons come with black fills. To support theming:

1. **Replace black with currentColor**:
   ```bash
   # Using sed (macOS/Linux)
   find ~/Downloads/currency-icons-vecteezy -name "*.svg" -exec sed -i '' 's/fill="#000000"/fill="currentColor"/g' {} \;
   find ~/Downloads/currency-icons-vecteezy -name "*.svg" -exec sed -i '' 's/fill="black"/fill="currentColor"/g' {} \;
   ```

2. **Or use SVGO** with a plugin to replace colors

## License Check

⚠️ **Important**: Check the Vecteezy license:
- Free license: Usually requires attribution
- Premium license: No attribution needed
- Verify commercial use is allowed

## Troubleshooting

### Icons Not Displaying
- Check filename matches exactly: `currency-[code].svg` (lowercase)
- Verify file is in `public/icons/currencies/`
- Check SVG is valid (open in browser)

### Icons Too Dark/Black
- Replace `fill="#000000"` with `fill="currentColor"`
- This allows theming with CSS

### Wrong Size
- Ensure viewBox is `0 0 24 24`
- Remove fixed width/height attributes
- Keep only viewBox for scaling

## Next Steps

After replacing icons:
1. ✅ Run validation: `node scripts/validate-currency-icons.js`
2. ✅ Test in application
3. ✅ Fill any missing currencies from other sources
4. ✅ Optimize with SVGO if needed

---

**Source**: Vecteezy  
**License**: Check Vecteezy license terms  
**Format**: SVG (recommended)  
**Style**: Black circle design, consistent

