#!/bin/bash
# optimize-public-images.sh
#
# Converts large PNGs in public/ to WebP format for significant size savings.
# WebP typically achieves 25-35% smaller files than PNG with equivalent quality.
#
# Prerequisites:
#   brew install cwebp  (macOS)
#   apt install webp     (Linux)
#
# Usage:
#   ./scripts/optimize-public-images.sh          # Dry run (preview only)
#   ./scripts/optimize-public-images.sh --apply   # Actually convert files
#
# After conversion, update image references in components to use .webp sources.
# Next.js Image component with formats: ['image/webp'] in next.config.mjs
# handles this automatically for <Image> components.

set -euo pipefail

DRY_RUN=true
if [[ "${1:-}" == "--apply" ]]; then
  DRY_RUN=false
fi

PUBLIC_DIR="$(dirname "$0")/../public"
MIN_SIZE_KB=500
QUALITY=85

echo "=== Public Image Optimization ==="
echo "Directory: $PUBLIC_DIR"
echo "Min size threshold: ${MIN_SIZE_KB}KB"
echo "WebP quality: $QUALITY"
echo "Mode: $(if $DRY_RUN; then echo 'DRY RUN'; else echo 'APPLY'; fi)"
echo ""

total_saved=0
count=0

while IFS= read -r -d '' png_file; do
  size_bytes=$(stat -f%z "$png_file" 2>/dev/null || stat -c%s "$png_file" 2>/dev/null)
  size_kb=$((size_bytes / 1024))

  if [[ $size_kb -lt $MIN_SIZE_KB ]]; then
    continue
  fi

  webp_file="${png_file%.png}.webp"

  if $DRY_RUN; then
    echo "[WOULD CONVERT] $png_file (${size_kb}KB)"
    count=$((count + 1))
  else
    if command -v cwebp &>/dev/null; then
      cwebp -q $QUALITY "$png_file" -o "$webp_file" 2>/dev/null
      new_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
      saved=$(( (size_bytes - new_size) / 1024 ))
      total_saved=$((total_saved + saved))
      count=$((count + 1))
      echo "[CONVERTED] $png_file (${size_kb}KB → $((new_size / 1024))KB, saved ${saved}KB)"
    else
      echo "ERROR: cwebp not found. Install with: brew install webp"
      exit 1
    fi
  fi
done < <(find "$PUBLIC_DIR" -name "*.png" -print0)

echo ""
echo "=== Summary ==="
echo "Files to convert: $count"
if ! $DRY_RUN; then
  echo "Total saved: $((total_saved / 1024))MB"
fi
echo ""
echo "Next steps after conversion:"
echo "  1. Update component image src references to use .webp"
echo "  2. Keep original PNGs as fallback (or use <picture> element)"
echo "  3. Test all pages for visual regressions"
