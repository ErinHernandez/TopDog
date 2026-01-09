#!/bin/bash

# Download Country and State Flags
# Country flags from flagcdn.com
# State flags from various sources

set -e

COUNTRIES_DIR="public/flags/countries"
STATES_DIR="public/flags/states"

# Create directories
mkdir -p "$COUNTRIES_DIR"
mkdir -p "$STATES_DIR"

echo "Downloading country flags..."

# Common countries from flags.ts
COUNTRIES=(
  "us" "ca" "mx" "gb" "de" "fr" "es" "it" "pt" "nl" "be" "ch" "at" "se" "no" "dk" "fi" "ie" "pl" "cz" "gr" "tr" "ru" "ua" "jp" "cn" "kr" "in" "au" "nz" "br" "ar" "cl" "co" "pe" "za" "eg" "ng" "ke" "il" "ae" "sa" "sg" "my" "th" "vn" "ph" "id" "pk"
)

for code in "${COUNTRIES[@]}"; do
  echo "Downloading $code..."
  curl -s -f -k -o "$COUNTRIES_DIR/${code}.svg" "https://flagcdn.com/${code}.svg" || echo "Failed to download $code"
done

echo ""
echo "Downloading US state flags..."

# US States (all 50 + DC)
STATES=(
  "al" "ak" "az" "ar" "ca" "co" "ct" "de" "fl" "ga"
  "hi" "id" "il" "in" "ia" "ks" "ky" "la" "me" "md"
  "ma" "mi" "mn" "ms" "mo" "mt" "ne" "nv" "nh" "nj"
  "nm" "ny" "nc" "nd" "oh" "ok" "or" "pa" "ri" "sc"
  "sd" "tn" "tx" "ut" "vt" "va" "wa" "wv" "wi" "wy"
  "dc"
)

# Using a public API for state flags
# Alternative: https://raw.githubusercontent.com/CivilServiceUSA/us-states/master/images/flags/
for state in "${STATES[@]}"; do
  echo "Downloading US-${state}..."
  # Try multiple sources
  curl -s -f -k -o "$STATES_DIR/${state}.svg" "https://raw.githubusercontent.com/CivilServiceUSA/us-states/master/images/flags/${state}-large.svg" || \
  curl -s -f -k -o "$STATES_DIR/${state}.svg" "https://flagcdn.com/us-${state}.svg" || \
  echo "Failed to download US-${state}"
done

echo ""
echo "Flag download complete!"
echo "Country flags: $(ls -1 $COUNTRIES_DIR | wc -l) files"
echo "State flags: $(ls -1 $STATES_DIR | wc -l) files"
