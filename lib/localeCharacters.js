// Locale-specific character mappings
// This file controls what characters are accepted for usernames in different countries
// Rule 1: Everyone can use standard western alphabet and numbers (a-z, A-Z, 0-9)
// Rule 2: Countries can use additional characters from their local dialect

export const localeCharacters = {
  // Example mappings - replace with actual country codes and character sets
  'US': {
    additionalChars: '', // US only gets standard western alphabet
    description: 'United States - Standard Western alphabet only'
  },
  'CA': {
    additionalChars: 'éèêëàâäôöùûüçîï', // French accents for Canada (no apostrophes)
    description: 'Canada - Western alphabet + French accents (no apostrophes)'
  },
  'FR': {
    additionalChars: 'éèêëàâäôöùûüçîïœæ', // French accents (no apostrophes)
    description: 'France - Western alphabet + French accents (no apostrophes)'
  },
  'DE': {
    additionalChars: 'äöüß', // German umlauts
    description: 'Germany - Western alphabet + German umlauts'
  },
  'ES': {
    additionalChars: 'áéíóúñü', // Spanish accents
    description: 'Spain - Western alphabet + Spanish accents'
  },
  'RU': {
    additionalChars: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя', // Cyrillic alphabet
    description: 'Russia - Western alphabet + Cyrillic characters'
  },
  'JP': {
    additionalChars: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ', // Hiragana
    description: 'Japan - Western alphabet + Hiragana characters'
  },
  'KR': {
    additionalChars: '가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허기니디리미비시이지치키티피히구누두루무부수우주추쿠투푸후그느드르므브스으즈츠크트프흐기니디리미비시이지치키티피히', // Korean Hangul
    description: 'Korea - Western alphabet + Korean Hangul'
  },
  'MX': {
    additionalChars: 'áéíóúñü¡¿', // Spanish accents and punctuation for Mexico
    description: 'Mexico - Western alphabet + Spanish accents'
  },
  'TR': {
    additionalChars: 'çğıöşü', // Turkish characters
    description: 'Turkey - Western alphabet + Turkish characters'
  },
  'SE': {
    additionalChars: 'åäö', // Swedish characters
    description: 'Sweden - Western alphabet + Swedish characters'
  },
  'NO': {
    additionalChars: 'æøå', // Norwegian characters
    description: 'Norway - Western alphabet + Norwegian characters'
  },
  'DK': {
    additionalChars: 'æøå', // Danish characters
    description: 'Denmark - Western alphabet + Danish characters'
  },
  'FI': {
    additionalChars: 'äöå', // Finnish characters
    description: 'Finland - Western alphabet + Finnish characters'
  },
  'PL': {
    additionalChars: 'ąćęłńóśźż', // Polish characters
    description: 'Poland - Western alphabet + Polish characters'
  },
  'CZ': {
    additionalChars: 'áčďéěíňóřšťúůýž', // Czech characters
    description: 'Czech Republic - Western alphabet + Czech characters'
  },
  'SK': {
    additionalChars: 'áäčďéíĺľňóôŕšťúýž', // Slovak characters
    description: 'Slovakia - Western alphabet + Slovak characters'
  },
  'HU': {
    additionalChars: 'áéíóöőúüű', // Hungarian characters
    description: 'Hungary - Western alphabet + Hungarian characters'
  },
  'RO': {
    additionalChars: 'ăâîșț', // Romanian characters
    description: 'Romania - Western alphabet + Romanian characters'
  },
  'BG': {
    additionalChars: 'абвгдежзийклмнопрстуфхцчшщъьюя', // Bulgarian Cyrillic
    description: 'Bulgaria - Western alphabet + Bulgarian Cyrillic'
  },
  'HR': {
    additionalChars: 'čćđšž', // Croatian characters
    description: 'Croatia - Western alphabet + Croatian characters'
  },
  'SI': {
    additionalChars: 'čšž', // Slovenian characters
    description: 'Slovenia - Western alphabet + Slovenian characters'
  },
  'EE': {
    additionalChars: 'äöõü', // Estonian characters
    description: 'Estonia - Western alphabet + Estonian characters'
  },
  'LV': {
    additionalChars: 'āčēģīķļņšūž', // Latvian characters
    description: 'Latvia - Western alphabet + Latvian characters'
  },
  'LT': {
    additionalChars: 'ąčęėįšųūž', // Lithuanian characters
    description: 'Lithuania - Western alphabet + Lithuanian characters'
  }
};

// Default fallback for countries not in the list
export const defaultLocale = {
  additionalChars: '',
  description: 'Standard Western alphabet only'
};

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