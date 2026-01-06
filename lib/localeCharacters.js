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
// CURRENT STATUS: 49 approved countries (Last Updated: January 2026)
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
  // NORTH AMERICA
  // ============================================================================
  'US': {
    additionalChars: '',
    description: 'United States - Standard Western alphabet only'
  },
  'CA': {
    additionalChars: 'éèêëàâäôöùûüçîï',
    description: 'Canada - Western alphabet + French accents'
  },
  'MX': {
    additionalChars: 'áéíóúñü',
    description: 'Mexico - Western alphabet + Spanish accents'
  },
  'PR': {
    additionalChars: 'áéíóúñü',
    description: 'Puerto Rico - Western alphabet + Spanish accents'
  },

  // ============================================================================
  // CARIBBEAN
  // ============================================================================
  'AW': {
    additionalChars: 'éèëïóòö',
    description: 'Aruba - Western alphabet + Dutch/Papiamento accents'
  },
  'BM': {
    additionalChars: '',
    description: 'Bermuda - Standard Western alphabet only'
  },
  'CW': {
    additionalChars: 'éèëïóòö',
    description: 'Curacao - Western alphabet + Dutch/Papiamento accents'
  },
  'DO': {
    additionalChars: 'áéíóúñü',
    description: 'Dominican Republic - Western alphabet + Spanish accents'
  },
  'GD': {
    additionalChars: '',
    description: 'Grenada - Standard Western alphabet only'
  },
  'HT': {
    additionalChars: 'éèêëàâäôöùûüçîï',
    description: 'Haiti - Western alphabet + French/Creole accents'
  },
  'JM': {
    additionalChars: '',
    description: 'Jamaica - Standard Western alphabet only'
  },
  'MQ': {
    additionalChars: 'éèêëàâäôöùûüçîïœæ',
    description: 'Martinique - Western alphabet + French accents'
  },
  'TT': {
    additionalChars: '',
    description: 'Trinidad and Tobago - Standard Western alphabet only'
  },

  // ============================================================================
  // CENTRAL AMERICA
  // ============================================================================
  'BZ': {
    additionalChars: '',
    description: 'Belize - Standard Western alphabet only'
  },
  'CR': {
    additionalChars: 'áéíóúñü',
    description: 'Costa Rica - Western alphabet + Spanish accents'
  },
  'SV': {
    additionalChars: 'áéíóúñü',
    description: 'El Salvador - Western alphabet + Spanish accents'
  },
  'GT': {
    additionalChars: 'áéíóúñü',
    description: 'Guatemala - Western alphabet + Spanish accents'
  },
  'HN': {
    additionalChars: 'áéíóúñü',
    description: 'Honduras - Western alphabet + Spanish accents'
  },
  'NI': {
    additionalChars: 'áéíóúñü',
    description: 'Nicaragua - Western alphabet + Spanish accents'
  },
  'PA': {
    additionalChars: 'áéíóúñü',
    description: 'Panama - Western alphabet + Spanish accents'
  },

  // ============================================================================
  // SOUTH AMERICA
  // ============================================================================
  'BO': {
    additionalChars: 'áéíóúñü',
    description: 'Bolivia - Western alphabet + Spanish accents'
  },
  'CL': {
    additionalChars: 'áéíóúñü',
    description: 'Chile - Western alphabet + Spanish accents'
  },
  'CO': {
    additionalChars: 'áéíóúñü',
    description: 'Colombia - Western alphabet + Spanish accents'
  },
  'GY': {
    additionalChars: '',
    description: 'Guyana - Standard Western alphabet only'
  },
  'PE': {
    additionalChars: 'áéíóúñü',
    description: 'Peru - Western alphabet + Spanish accents'
  },
  'SR': {
    additionalChars: 'éèëïóòö',
    description: 'Suriname - Western alphabet + Dutch accents'
  },
  'UY': {
    additionalChars: 'áéíóúñü',
    description: 'Uruguay - Western alphabet + Spanish accents'
  },
  'VE': {
    additionalChars: 'áéíóúñü',
    description: 'Venezuela - Western alphabet + Spanish accents'
  },

  // ============================================================================
  // WESTERN EUROPE
  // ============================================================================
  'AT': {
    additionalChars: 'äöüß',
    description: 'Austria - Western alphabet + German umlauts'
  },
  'DE': {
    additionalChars: 'äöüß',
    description: 'Germany - Western alphabet + German umlauts'
  },
  'FR': {
    additionalChars: 'éèêëàâäôöùûüçîïœæ',
    description: 'France - Western alphabet + French accents'
  },
  'IE': {
    additionalChars: 'áéíóú',
    description: 'Ireland - Western alphabet + Irish accents'
  },
  'LU': {
    additionalChars: 'éèêëàâäôöùûüçîïäöüß',
    description: 'Luxembourg - Western alphabet + French/German accents'
  },
  'PT': {
    additionalChars: 'ãõáéíóúâêôç',
    description: 'Portugal - Western alphabet + Portuguese accents'
  },

  // ============================================================================
  // NORTHERN EUROPE (SCANDINAVIA)
  // ============================================================================
  'DK': {
    additionalChars: 'æøå',
    description: 'Denmark - Western alphabet + Danish characters'
  },
  'FI': {
    additionalChars: 'äöå',
    description: 'Finland - Western alphabet + Finnish characters'
  },
  'IS': {
    additionalChars: 'áéíóúýþæö',
    description: 'Iceland - Western alphabet + Icelandic characters'
  },
  'NO': {
    additionalChars: 'æøå',
    description: 'Norway - Western alphabet + Norwegian characters'
  },
  'SE': {
    additionalChars: 'åäö',
    description: 'Sweden - Western alphabet + Swedish characters'
  },

  // ============================================================================
  // SOUTHERN EUROPE
  // ============================================================================
  'CY': {
    additionalChars: '',
    description: 'Cyprus - Standard Western alphabet only'
  },
  'ES': {
    additionalChars: 'áéíóúñü',
    description: 'Spain - Western alphabet + Spanish accents'
  },
  'GR': {
    additionalChars: '',
    description: 'Greece - Standard Western alphabet only'
  },

  // ============================================================================
  // EASTERN EUROPE
  // ============================================================================
  'BG': {
    additionalChars: 'абвгдежзийклмнопрстуфхцчшщъьюя',
    description: 'Bulgaria - Western alphabet + Bulgarian Cyrillic'
  },
  'CZ': {
    additionalChars: 'áčďéěíňóřšťúůýž',
    description: 'Czech Republic - Western alphabet + Czech characters'
  },
  'EE': {
    additionalChars: 'äöõü',
    description: 'Estonia - Western alphabet + Estonian characters'
  },
  'HR': {
    additionalChars: 'čćđšž',
    description: 'Croatia - Western alphabet + Croatian characters'
  },
  'HU': {
    additionalChars: 'áéíóöőúüű',
    description: 'Hungary - Western alphabet + Hungarian characters'
  },
  'LT': {
    additionalChars: 'ąčęėįšųūž',
    description: 'Lithuania - Western alphabet + Lithuanian characters'
  },
  'LV': {
    additionalChars: 'āčēģīķļņšūž',
    description: 'Latvia - Western alphabet + Latvian characters'
  },
  'PL': {
    additionalChars: 'ąćęłńóśźż',
    description: 'Poland - Western alphabet + Polish characters'
  },
  'RO': {
    additionalChars: 'ăâîșț',
    description: 'Romania - Western alphabet + Romanian characters'
  },
  'SI': {
    additionalChars: 'čšž',
    description: 'Slovenia - Western alphabet + Slovenian characters'
  },
  'SK': {
    additionalChars: 'áäčďéíĺľňóôŕšťúýž',
    description: 'Slovakia - Western alphabet + Slovak characters'
  },

  // ============================================================================
  // ASIA
  // ============================================================================
  'ID': {
    additionalChars: '',
    description: 'Indonesia - Standard Western alphabet only'
  },
  'MM': {
    additionalChars: '',
    description: 'Myanmar - Standard Western alphabet only'
  },
  'MN': {
    additionalChars: '',
    description: 'Mongolia - Standard Western alphabet only'
  },
  'MY': {
    additionalChars: '',
    description: 'Malaysia - Standard Western alphabet only'
  },
  'SG': {
    additionalChars: '',
    description: 'Singapore - Standard Western alphabet only'
  },

  // ============================================================================
  // OCEANIA
  // ============================================================================
  'AU': {
    additionalChars: '',
    description: 'Australia - Standard Western alphabet only'
  },
  'NZ': {
    additionalChars: '',
    description: 'New Zealand - Standard Western alphabet only'
  }
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
  // North America
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'CA', name: 'Canada', region: 'North America' },
  { code: 'MX', name: 'Mexico', region: 'North America' },
  { code: 'PR', name: 'Puerto Rico', region: 'North America' },
  
  // Caribbean
  { code: 'AW', name: 'Aruba', region: 'Caribbean' },
  { code: 'BM', name: 'Bermuda', region: 'Caribbean' },
  { code: 'CW', name: 'Curacao', region: 'Caribbean' },
  { code: 'DO', name: 'Dominican Republic', region: 'Caribbean' },
  { code: 'GD', name: 'Grenada', region: 'Caribbean' },
  { code: 'HT', name: 'Haiti', region: 'Caribbean' },
  { code: 'JM', name: 'Jamaica', region: 'Caribbean' },
  { code: 'MQ', name: 'Martinique', region: 'Caribbean' },
  { code: 'TT', name: 'Trinidad and Tobago', region: 'Caribbean' },
  
  // Central America
  { code: 'BZ', name: 'Belize', region: 'Central America' },
  { code: 'CR', name: 'Costa Rica', region: 'Central America' },
  { code: 'SV', name: 'El Salvador', region: 'Central America' },
  { code: 'GT', name: 'Guatemala', region: 'Central America' },
  { code: 'HN', name: 'Honduras', region: 'Central America' },
  { code: 'NI', name: 'Nicaragua', region: 'Central America' },
  { code: 'PA', name: 'Panama', region: 'Central America' },
  
  // South America
  { code: 'BO', name: 'Bolivia', region: 'South America' },
  { code: 'CL', name: 'Chile', region: 'South America' },
  { code: 'CO', name: 'Colombia', region: 'South America' },
  { code: 'GY', name: 'Guyana', region: 'South America' },
  { code: 'PE', name: 'Peru', region: 'South America' },
  { code: 'SR', name: 'Suriname', region: 'South America' },
  { code: 'UY', name: 'Uruguay', region: 'South America' },
  { code: 'VE', name: 'Venezuela', region: 'South America' },
  
  // Western Europe
  { code: 'AT', name: 'Austria', region: 'Western Europe' },
  { code: 'DE', name: 'Germany', region: 'Western Europe' },
  { code: 'FR', name: 'France', region: 'Western Europe' },
  { code: 'IE', name: 'Ireland', region: 'Western Europe' },
  { code: 'LU', name: 'Luxembourg', region: 'Western Europe' },
  { code: 'PT', name: 'Portugal', region: 'Western Europe' },
  
  // Northern Europe (Scandinavia)
  { code: 'DK', name: 'Denmark', region: 'Northern Europe' },
  { code: 'FI', name: 'Finland', region: 'Northern Europe' },
  { code: 'IS', name: 'Iceland', region: 'Northern Europe' },
  { code: 'NO', name: 'Norway', region: 'Northern Europe' },
  { code: 'SE', name: 'Sweden', region: 'Northern Europe' },
  
  // Southern Europe
  { code: 'CY', name: 'Cyprus', region: 'Southern Europe' },
  { code: 'ES', name: 'Spain', region: 'Southern Europe' },
  { code: 'GR', name: 'Greece', region: 'Southern Europe' },
  
  // Eastern Europe
  { code: 'BG', name: 'Bulgaria', region: 'Eastern Europe' },
  { code: 'CZ', name: 'Czech Republic', region: 'Eastern Europe' },
  { code: 'EE', name: 'Estonia', region: 'Eastern Europe' },
  { code: 'HR', name: 'Croatia', region: 'Eastern Europe' },
  { code: 'HU', name: 'Hungary', region: 'Eastern Europe' },
  { code: 'LT', name: 'Lithuania', region: 'Eastern Europe' },
  { code: 'LV', name: 'Latvia', region: 'Eastern Europe' },
  { code: 'PL', name: 'Poland', region: 'Eastern Europe' },
  { code: 'RO', name: 'Romania', region: 'Eastern Europe' },
  { code: 'SI', name: 'Slovenia', region: 'Eastern Europe' },
  { code: 'SK', name: 'Slovakia', region: 'Eastern Europe' },
  
  // Asia
  { code: 'ID', name: 'Indonesia', region: 'Asia' },
  { code: 'MY', name: 'Malaysia', region: 'Asia' },
  { code: 'MM', name: 'Myanmar', region: 'Asia' },
  { code: 'MN', name: 'Mongolia', region: 'Asia' },
  { code: 'SG', name: 'Singapore', region: 'Asia' },
  
  // Oceania
  { code: 'AU', name: 'Australia', region: 'Oceania' },
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