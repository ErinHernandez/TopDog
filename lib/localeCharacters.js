// ============================================================================
// LOCALE CHARACTER CONFIGURATION
// ============================================================================
//
// This file controls what characters are accepted for usernames by country.
// It is the SINGLE SOURCE OF TRUTH for approved locations.
//
// RULES:
// 1. Everyone can use standard Western alphabet and numbers (a-z, A-Z, 0-9)
// 2. Countries can use additional characters from their local dialect
// 3. Spaces are NEVER allowed in usernames
//
// CURRENT STATUS: 6 approved countries (Last Updated: January 2026)
// NOTE: United States is handled separately due to state-by-state regulations
//
// ============================================================================
// HOW TO ADD A NEW COUNTRY
// ============================================================================
//
// 1. Add entry to `localeCharacters` object below with:
//    - ISO 3166-1 alpha-2 country code as key (e.g., 'BR' for Brazil)
//    - additionalChars: string of extra characters (use CHARACTER_SETS below)
//    - description: human-readable description
//
// 2. Add entry to `approvedCountries` array with:
//    - code: same ISO code
//    - name: full country name
//    - region: geographic region for grouping
//
// 3. Run validation: node -e "require('./lib/localeCharacters').validateConfiguration()"
//
// EXAMPLE - Adding Brazil:
//
//   // In localeCharacters:
//   'BR': {
//     additionalChars: CHARACTER_SETS.PORTUGUESE,
//     description: 'Brazil - Western alphabet + Portuguese accents'
//   },
//
//   // In approvedCountries:
//   { code: 'BR', name: 'Brazil', region: 'South America' },
//
// ============================================================================

// ============================================================================
// PRE-DEFINED CHARACTER SETS (Use these for consistency)
// ============================================================================
export const CHARACTER_SETS = {
  // No additional characters (English, etc.)
  STANDARD_LATIN: '',
  
  // Romance Languages
  SPANISH: 'áéíóúñü',
  PORTUGUESE: 'ãõáéíóúâêôç',
  FRENCH: 'éèêëàâäôöùûüçîïœæ',
  ITALIAN: 'àèéìíîòóùú',
  
  // Germanic Languages
  GERMAN: 'äöüß',
  DUTCH: 'éèëïóòö',
  
  // Scandinavian
  DANISH_NORWEGIAN: 'æøå',
  SWEDISH: 'åäö',
  FINNISH: 'äöå',
  ICELANDIC: 'áéíóúýþæö',
  
  // Eastern European
  POLISH: 'ąćęłńóśźż',
  CZECH: 'áčďéěíňóřšťúůýž',
  SLOVAK: 'áäčďéíĺľňóôŕšťúýž',
  HUNGARIAN: 'áéíóöőúüű',
  ROMANIAN: 'ăâîșț',
  CROATIAN: 'čćđšž',
  SLOVENIAN: 'čšž',
  ESTONIAN: 'äöõü',
  LATVIAN: 'āčēģīķļņšūž',
  LITHUANIAN: 'ąčęėįšųūž',
  
  // Cyrillic
  RUSSIAN_CYRILLIC: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
  BULGARIAN_CYRILLIC: 'абвгдежзийклмнопрстуфхцчшщъьюя',
  
  // Asian (Latin-based)
  TURKISH: 'çğıöşü',
  VIETNAMESE: 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
  
  // Celtic
  IRISH: 'áéíóú',
  
  // Other
  PAPIAMENTO: 'éèëïóòö', // Aruba, Curacao
};

// ============================================================================
// REGION DEFINITIONS (for organizing countries)
// ============================================================================
export const REGIONS = {
  NORTH_AMERICA: 'North America',
  CARIBBEAN: 'Caribbean',
  CENTRAL_AMERICA: 'Central America',
  SOUTH_AMERICA: 'South America',
  WESTERN_EUROPE: 'Western Europe',
  NORTHERN_EUROPE: 'Northern Europe',
  SOUTHERN_EUROPE: 'Southern Europe',
  EASTERN_EUROPE: 'Eastern Europe',
  ASIA: 'Asia',
  OCEANIA: 'Oceania',
  AFRICA: 'Africa',
  MIDDLE_EAST: 'Middle East',
};

// ============================================================================
// LOCALE CHARACTER MAPPINGS
// ============================================================================

export const localeCharacters = {
  // ============================================================================
  // WESTERN EUROPE
  // ============================================================================
  'IE': {
    additionalChars: CHARACTER_SETS.IRISH,
    description: 'Ireland - Western alphabet + Irish accents'
  },
  'DE': {
    additionalChars: CHARACTER_SETS.GERMAN,
    description: 'Germany - Western alphabet + German umlauts'
  },

  // ============================================================================
  // NORTH AMERICA
  // ============================================================================
  'MX': {
    additionalChars: CHARACTER_SETS.SPANISH,
    description: 'Mexico - Western alphabet + Spanish accents'
  },

  // ============================================================================
  // SOUTH AMERICA
  // ============================================================================
  'BR': {
    additionalChars: CHARACTER_SETS.PORTUGUESE,
    description: 'Brazil - Western alphabet + Portuguese accents'
  },

  // ============================================================================
  // ASIA
  // ============================================================================
  'SG': {
    additionalChars: CHARACTER_SETS.STANDARD_LATIN,
    description: 'Singapore - Standard Western alphabet only'
  },

  // ============================================================================
  // OCEANIA
  // ============================================================================
  'NZ': {
    additionalChars: CHARACTER_SETS.STANDARD_LATIN,
    description: 'New Zealand - Standard Western alphabet only'
  },
};

// Default fallback for countries not in the list
export const defaultLocale = {
  additionalChars: '',
  description: 'Standard Western alphabet only'
};

// ============================================================================
// APPROVED COUNTRIES LIST (for dropdowns, validation, etc.)
// ============================================================================
export const approvedCountries = [
  // ============================================================================
  // WESTERN EUROPE
  // ============================================================================
  { code: 'IE', name: 'Ireland', region: 'Western Europe' },
  { code: 'DE', name: 'Germany', region: 'Western Europe' },
  
  // ============================================================================
  // NORTH AMERICA
  // ============================================================================
  { code: 'MX', name: 'Mexico', region: 'North America' },
  
  // ============================================================================
  // SOUTH AMERICA
  // ============================================================================
  { code: 'BR', name: 'Brazil', region: 'South America' },
  
  // ============================================================================
  // ASIA
  // ============================================================================
  { code: 'SG', name: 'Singapore', region: 'Asia' },
  
  // ============================================================================
  // OCEANIA
  // ============================================================================
  { code: 'NZ', name: 'New Zealand', region: 'Oceania' },
];

// Get approved country codes as a Set for quick lookup
export const approvedCountryCodes = new Set(approvedCountries.map(c => c.code));

// Check if a country is approved
export function isApprovedCountry(countryCode) {
  return approvedCountryCodes.has(countryCode);
}

// Get countries sorted alphabetically by name
export function getApprovedCountriesSorted() {
  return [...approvedCountries].sort((a, b) => a.name.localeCompare(b.name));
}

// Get countries grouped by region
export function getApprovedCountriesByRegion() {
  const grouped = {};
  approvedCountries.forEach(country => {
    if (!grouped[country.region]) {
      grouped[country.region] = [];
    }
    grouped[country.region].push(country);
  });
  return grouped;
}

// Function to get allowed characters for a country
// Always lists standard Western alphabet characters AFTER country-specific characters
// Note: Spaces are explicitly excluded from all character sets
export function getAllowedCharacters(countryCode) {
  const locale = localeCharacters[countryCode] || defaultLocale;
  const standardChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  // Return country-specific characters first, then standard Western alphabet
  // Spaces are not included in any character set
  return locale.additionalChars + standardChars;
}

// Function to get locale description
export function getLocaleDescription(countryCode) {
  const locale = localeCharacters[countryCode] || defaultLocale;
  return locale.description;
}

// ============================================================================
// VALIDATION & UTILITIES (for maintaining data integrity)
// ============================================================================

/**
 * Validate that all approved countries have character mappings and vice versa.
 * Run this after adding new countries to ensure consistency.
 * 
 * Usage: node -e "require('./lib/localeCharacters').validateConfiguration()"
 */
export function validateConfiguration() {
  const errors = [];
  const warnings = [];
  
  // Check all approved countries have locale entries
  approvedCountries.forEach(country => {
    if (!localeCharacters[country.code]) {
      errors.push(`MISSING: Country '${country.code}' (${country.name}) is in approvedCountries but not in localeCharacters`);
    }
  });
  
  // Check all locale entries are in approved countries
  Object.keys(localeCharacters).forEach(code => {
    if (!approvedCountryCodes.has(code)) {
      warnings.push(`ORPHAN: Country '${code}' is in localeCharacters but not in approvedCountries`);
    }
  });
  
  // Check for duplicate country codes
  const seenCodes = new Set();
  approvedCountries.forEach(country => {
    if (seenCodes.has(country.code)) {
      errors.push(`DUPLICATE: Country code '${country.code}' appears multiple times in approvedCountries`);
    }
    seenCodes.add(country.code);
  });
  
  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('Configuration is valid. All countries are properly configured.');
    console.log(`Total approved countries: ${approvedCountries.length}`);
    return true;
  }
  
  if (errors.length > 0) {
    console.error('ERRORS FOUND:');
    errors.forEach(e => console.error(`  - ${e}`));
  }
  
  if (warnings.length > 0) {
    console.warn('WARNINGS:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }
  
  return errors.length === 0;
}

/**
 * Get statistics about the current configuration
 */
export function getConfigurationStats() {
  const byRegion = getApprovedCountriesByRegion();
  const regionCounts = {};
  Object.entries(byRegion).forEach(([region, countries]) => {
    regionCounts[region] = countries.length;
  });
  
  const charSetUsage = {};
  Object.values(localeCharacters).forEach(locale => {
    const chars = locale.additionalChars || '(none)';
    charSetUsage[chars] = (charSetUsage[chars] || 0) + 1;
  });
  
  return {
    totalCountries: approvedCountries.length,
    byRegion: regionCounts,
    countriesWithStandardLatinOnly: Object.values(localeCharacters).filter(l => l.additionalChars === '').length,
    countriesWithAdditionalChars: Object.values(localeCharacters).filter(l => l.additionalChars !== '').length,
  };
}

/**
 * Helper to add a new country (for scripting)
 * Returns the code to add - does not modify the file
 */
export function generateCountryEntry(code, name, region, characterSet = 'STANDARD_LATIN') {
  const chars = CHARACTER_SETS[characterSet] || '';
  const charSetName = characterSet === 'STANDARD_LATIN' ? 'Standard Western alphabet only' : `Western alphabet + ${characterSet.toLowerCase().replace(/_/g, ' ')}`;
  
  return {
    localeEntry: `  '${code}': {
    additionalChars: '${chars}',
    description: '${name} - ${charSetName}'
  },`,
    approvedEntry: `  { code: '${code}', name: '${name}', region: '${region}' },`,
  };
}

/**
 * Check if a country code is valid ISO 3166-1 alpha-2 format
 */
export function isValidCountryCode(code) {
  return typeof code === 'string' && /^[A-Z]{2}$/.test(code);
}

/**
 * Get all countries that use a specific character set
 */
export function getCountriesByCharacterSet(characterSet) {
  const targetChars = CHARACTER_SETS[characterSet];
  if (targetChars === undefined) {
    return [];
  }
  
  return approvedCountries.filter(country => {
    const locale = localeCharacters[country.code];
    return locale && locale.additionalChars === targetChars;
  });
}

/**
 * Suggest a character set for a new country based on language/region
 */
export function suggestCharacterSet(language) {
  const suggestions = {
    'english': 'STANDARD_LATIN',
    'spanish': 'SPANISH',
    'portuguese': 'PORTUGUESE',
    'french': 'FRENCH',
    'german': 'GERMAN',
    'dutch': 'DUTCH',
    'italian': 'ITALIAN',
    'polish': 'POLISH',
    'czech': 'CZECH',
    'hungarian': 'HUNGARIAN',
    'romanian': 'ROMANIAN',
    'russian': 'RUSSIAN_CYRILLIC',
    'turkish': 'TURKISH',
    'swedish': 'SWEDISH',
    'norwegian': 'DANISH_NORWEGIAN',
    'danish': 'DANISH_NORWEGIAN',
    'finnish': 'FINNISH',
    'icelandic': 'ICELANDIC',
  };
  
  return suggestions[language.toLowerCase()] || 'STANDARD_LATIN';
} 