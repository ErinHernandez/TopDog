/**
 * Currency Configuration
 * 
 * Centralized configuration for all supported currencies.
 * Includes Stripe minimums, decimal handling, and country mappings.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CurrencyConfig {
  /** ISO 4217 currency code */
  code: string;
  /** Currency symbol for display */
  symbol: string;
  /** Full currency name */
  name: string;
  /** Number of decimal places (0 for JPY, KRW, VND) */
  decimals: number;
  /** Minimum deposit in smallest unit (cents/pence/etc) */
  minAmountSmallestUnit: number;
  /** Maximum deposit in smallest unit */
  maxAmountSmallestUnit: number;
  /** Stripe's minimum charge in smallest unit */
  stripeMinimum: number;
  /** Countries that use this currency (ISO 3166-1 alpha-2) */
  countries: string[];
  /** Locale for formatting (e.g., 'en-US', 'de-DE') */
  locale: string;
}

// ============================================================================
// CURRENCY DEFINITIONS
// ============================================================================

export const CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
  // North America
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    minAmountSmallestUnit: 500,      // $5.00
    maxAmountSmallestUnit: 1000000,  // $10,000.00
    stripeMinimum: 50,               // $0.50
    countries: ['US', 'PR'],
    locale: 'en-US',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimals: 2,
    minAmountSmallestUnit: 700,      // C$7.00 (~$5 USD)
    maxAmountSmallestUnit: 1400000,  // C$14,000.00
    stripeMinimum: 50,
    countries: ['CA'],
    locale: 'en-CA',
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    decimals: 2,
    minAmountSmallestUnit: 10000,    // $100.00 MXN (~$5 USD)
    maxAmountSmallestUnit: 200000000, // $2,000,000.00 MXN
    stripeMinimum: 1000,
    countries: ['MX'],
    locale: 'es-MX',
  },

  // Europe - Eurozone
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    minAmountSmallestUnit: 500,      // €5.00
    maxAmountSmallestUnit: 1000000,  // €10,000.00
    stripeMinimum: 50,
    countries: [
      'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'FI', 'IE',
      'LU', 'GR', 'SI', 'SK', 'EE', 'LV', 'LT', 'CY', 'MT',
    ],
    locale: 'de-DE',
  },

  // Europe - Non-Eurozone
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    minAmountSmallestUnit: 400,      // £4.00
    maxAmountSmallestUnit: 800000,   // £8,000.00
    stripeMinimum: 30,
    countries: ['GB'],
    locale: 'en-GB',
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimals: 2,
    minAmountSmallestUnit: 500,      // CHF 5.00
    maxAmountSmallestUnit: 1000000,  // CHF 10,000.00
    stripeMinimum: 50,
    countries: ['CH', 'LI'],
    locale: 'de-CH',
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    decimals: 2,
    minAmountSmallestUnit: 5000,     // 50.00 kr
    maxAmountSmallestUnit: 10000000, // 100,000.00 kr
    stripeMinimum: 300,
    countries: ['SE'],
    locale: 'sv-SE',
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    decimals: 2,
    minAmountSmallestUnit: 5000,     // 50.00 kr
    maxAmountSmallestUnit: 10000000, // 100,000.00 kr
    stripeMinimum: 300,
    countries: ['NO'],
    locale: 'nb-NO',
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    name: 'Danish Krone',
    decimals: 2,
    minAmountSmallestUnit: 3500,     // 35.00 kr
    maxAmountSmallestUnit: 7000000,  // 70,000.00 kr
    stripeMinimum: 250,
    countries: ['DK'],
    locale: 'da-DK',
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    name: 'Polish Zloty',
    decimals: 2,
    minAmountSmallestUnit: 2000,     // 20.00 zł
    maxAmountSmallestUnit: 4000000,  // 40,000.00 zł
    stripeMinimum: 200,
    countries: ['PL'],
    locale: 'pl-PL',
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    name: 'Czech Koruna',
    decimals: 2,
    minAmountSmallestUnit: 12000,    // 120.00 Kč
    maxAmountSmallestUnit: 24000000, // 240,000.00 Kč
    stripeMinimum: 1500,
    countries: ['CZ'],
    locale: 'cs-CZ',
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    name: 'Hungarian Forint',
    decimals: 2,
    minAmountSmallestUnit: 180000,   // 1,800.00 Ft
    maxAmountSmallestUnit: 360000000, // 3,600,000.00 Ft
    stripeMinimum: 17500,
    countries: ['HU'],
    locale: 'hu-HU',
  },
  RON: {
    code: 'RON',
    symbol: 'lei',
    name: 'Romanian Leu',
    decimals: 2,
    minAmountSmallestUnit: 2500,     // 25.00 lei
    maxAmountSmallestUnit: 5000000,  // 50,000.00 lei
    stripeMinimum: 200,
    countries: ['RO'],
    locale: 'ro-RO',
  },
  BGN: {
    code: 'BGN',
    symbol: 'лв',
    name: 'Bulgarian Lev',
    decimals: 2,
    minAmountSmallestUnit: 1000,     // 10.00 лв
    maxAmountSmallestUnit: 2000000,  // 20,000.00 лв
    stripeMinimum: 100,
    countries: ['BG'],
    locale: 'bg-BG',
  },
  HRK: {
    code: 'HRK',
    symbol: 'kn',
    name: 'Croatian Kuna',
    decimals: 2,
    minAmountSmallestUnit: 3500,     // 35.00 kn (Note: Croatia adopted EUR Jan 2023)
    maxAmountSmallestUnit: 7000000,  // 70,000.00 kn
    stripeMinimum: 350,
    countries: ['HR'],
    locale: 'hr-HR',
  },

  // Latin America
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    decimals: 2,
    minAmountSmallestUnit: 2500,     // R$25.00
    maxAmountSmallestUnit: 5000000,  // R$50,000.00
    stripeMinimum: 50,
    countries: ['BR'],
    locale: 'pt-BR',
  },
  CLP: {
    code: 'CLP',
    symbol: '$',
    name: 'Chilean Peso',
    decimals: 0,                      // Zero-decimal currency
    minAmountSmallestUnit: 5000,     // $5,000 CLP (~$5 USD)
    maxAmountSmallestUnit: 10000000, // $10,000,000 CLP
    stripeMinimum: 500,
    countries: ['CL'],
    locale: 'es-CL',
  },
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Colombian Peso',
    decimals: 2,
    minAmountSmallestUnit: 2000000,  // $20,000 COP (~$5 USD)
    maxAmountSmallestUnit: 4000000000, // $40,000,000 COP
    stripeMinimum: 200000,
    countries: ['CO'],
    locale: 'es-CO',
  },
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    name: 'Peruvian Sol',
    decimals: 2,
    minAmountSmallestUnit: 2000,     // S/20.00 (~$5 USD)
    maxAmountSmallestUnit: 4000000,  // S/40,000.00
    stripeMinimum: 200,
    countries: ['PE'],
    locale: 'es-PE',
  },
  
  // Caribbean
  DOP: {
    code: 'DOP',
    symbol: 'RD$',
    name: 'Dominican Peso',
    decimals: 2,
    minAmountSmallestUnit: 30000,    // RD$300.00 (~$5 USD)
    maxAmountSmallestUnit: 6000000,  // RD$60,000.00
    stripeMinimum: 3000,
    countries: ['DO'],
    locale: 'es-DO',
  },
  UYU: {
    code: 'UYU',
    symbol: '$U',
    name: 'Uruguayan Peso',
    decimals: 2,
    minAmountSmallestUnit: 20000,    // $U200.00 (~$5 USD)
    maxAmountSmallestUnit: 4000000,  // $U40,000.00
    stripeMinimum: 2000,
    countries: ['UY'],
    locale: 'es-UY',
  },

  // Asia-Pacific
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimals: 2,
    minAmountSmallestUnit: 700,      // S$7.00
    maxAmountSmallestUnit: 1400000,  // S$14,000.00
    stripeMinimum: 50,
    countries: ['SG'],
    locale: 'en-SG',
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    name: 'Malaysian Ringgit',
    decimals: 2,
    minAmountSmallestUnit: 2500,     // RM25.00
    maxAmountSmallestUnit: 5000000,  // RM50,000.00
    stripeMinimum: 200,
    countries: ['MY'],
    locale: 'ms-MY',
  },
  THB: {
    code: 'THB',
    symbol: '฿',
    name: 'Thai Baht',
    decimals: 2,
    minAmountSmallestUnit: 20000,    // ฿200.00
    maxAmountSmallestUnit: 40000000, // ฿400,000.00
    stripeMinimum: 1000,
    countries: ['TH'],
    locale: 'th-TH',
  },
  PHP: {
    code: 'PHP',
    symbol: '₱',
    name: 'Philippine Peso',
    decimals: 2,
    minAmountSmallestUnit: 30000,    // ₱300.00
    maxAmountSmallestUnit: 60000000, // ₱600,000.00
    stripeMinimum: 2000,
    countries: ['PH'],
    locale: 'en-PH',
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    decimals: 0,                      // Zero-decimal currency
    minAmountSmallestUnit: 80000,    // Rp 80,000
    maxAmountSmallestUnit: 160000000, // Rp 160,000,000
    stripeMinimum: 10000,
    countries: ['ID'],
    locale: 'id-ID',
  },
  VND: {
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    decimals: 0,                      // Zero-decimal currency
    minAmountSmallestUnit: 130000,   // 130,000 ₫
    maxAmountSmallestUnit: 260000000, // 260,000,000 ₫
    stripeMinimum: 10000,
    countries: ['VN'],
    locale: 'vi-VN',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    decimals: 0,                      // Zero-decimal currency
    minAmountSmallestUnit: 7000,     // ₩7,000
    maxAmountSmallestUnit: 14000000, // ₩14,000,000
    stripeMinimum: 500,
    countries: ['KR'],
    locale: 'ko-KR',
  },
  TWD: {
    code: 'TWD',
    symbol: 'NT$',
    name: 'New Taiwan Dollar',
    decimals: 2,
    minAmountSmallestUnit: 16000,    // NT$160.00
    maxAmountSmallestUnit: 32000000, // NT$320,000.00
    stripeMinimum: 1000,
    countries: ['TW'],
    locale: 'zh-TW',
  },
  HKD: {
    code: 'HKD',
    symbol: 'HK$',
    name: 'Hong Kong Dollar',
    decimals: 2,
    minAmountSmallestUnit: 4000,     // HK$40.00
    maxAmountSmallestUnit: 8000000,  // HK$80,000.00
    stripeMinimum: 400,
    countries: ['HK'],
    locale: 'zh-HK',
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    decimals: 2,
    minAmountSmallestUnit: 800,      // NZ$8.00
    maxAmountSmallestUnit: 1600000,  // NZ$16,000.00
    stripeMinimum: 50,
    countries: ['NZ'],
    locale: 'en-NZ',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimals: 2,
    minAmountSmallestUnit: 800,      // A$8.00
    maxAmountSmallestUnit: 1600000,  // A$16,000.00
    stripeMinimum: 50,
    countries: ['AU'],
    locale: 'en-AU',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,                      // Zero-decimal currency
    minAmountSmallestUnit: 750,      // ¥750 (~$5 USD)
    maxAmountSmallestUnit: 1500000,  // ¥1,500,000
    stripeMinimum: 50,
    countries: ['JP'],
    locale: 'ja-JP',
  },

  // Middle East
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimals: 2,
    minAmountSmallestUnit: 1850,     // 18.50 AED (~$5 USD)
    maxAmountSmallestUnit: 3700000,  // 37,000 AED
    stripeMinimum: 200,
    countries: ['AE'],
    locale: 'ar-AE',
  },
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    name: 'Saudi Riyal',
    decimals: 2,
    minAmountSmallestUnit: 1900,     // 19.00 SAR (~$5 USD)
    maxAmountSmallestUnit: 3800000,  // 38,000 SAR
    stripeMinimum: 200,
    countries: ['SA'],
    locale: 'ar-SA',
  },
  QAR: {
    code: 'QAR',
    symbol: 'ر.ق',
    name: 'Qatari Riyal',
    decimals: 2,
    minAmountSmallestUnit: 1850,     // 18.50 QAR (~$5 USD)
    maxAmountSmallestUnit: 3700000,  // 37,000 QAR
    stripeMinimum: 100,
    countries: ['QA'],
    locale: 'ar-QA',
  },
  BHD: {
    code: 'BHD',
    symbol: '.د.ب',
    name: 'Bahraini Dinar',
    decimals: 3,                      // Three-decimal currency
    minAmountSmallestUnit: 1900,     // 1.900 BHD (~$5 USD)
    maxAmountSmallestUnit: 3800000,  // 3,800 BHD
    stripeMinimum: 100,
    countries: ['BH'],
    locale: 'ar-BH',
  },
  KWD: {
    code: 'KWD',
    symbol: 'د.ك',
    name: 'Kuwaiti Dinar',
    decimals: 3,                      // Three-decimal currency (highest value currency)
    minAmountSmallestUnit: 1550,     // 1.550 KWD (~$5 USD)
    maxAmountSmallestUnit: 3100000,  // 3,100 KWD
    stripeMinimum: 100,
    countries: ['KW'],
    locale: 'ar-KW',
  },
  OMR: {
    code: 'OMR',
    symbol: 'ر.ع.',
    name: 'Omani Rial',
    decimals: 3,                      // Three-decimal currency
    minAmountSmallestUnit: 1950,     // 1.950 OMR (~$5 USD)
    maxAmountSmallestUnit: 3900000,  // 3,900 OMR
    stripeMinimum: 100,
    countries: ['OM'],
    locale: 'ar-OM',
  },
  JOD: {
    code: 'JOD',
    symbol: 'د.ا',
    name: 'Jordanian Dinar',
    decimals: 3,                      // Three-decimal currency
    minAmountSmallestUnit: 3550,     // 3.550 JOD (~$5 USD)
    maxAmountSmallestUnit: 7100000,  // 7,100 JOD
    stripeMinimum: 100,
    countries: ['JO'],
    locale: 'ar-JO',
  },

  // South Asia
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimals: 2,
    minAmountSmallestUnit: 42000,    // ₹420.00 (~$5 USD)
    maxAmountSmallestUnit: 84000000, // ₹840,000
    stripeMinimum: 5000,
    countries: ['IN'],
    locale: 'en-IN',
  },
  LKR: {
    code: 'LKR',
    symbol: 'Rs',
    name: 'Sri Lankan Rupee',
    decimals: 2,
    minAmountSmallestUnit: 150000,   // Rs 1,500.00 (~$5 USD)
    maxAmountSmallestUnit: 30000000, // Rs 300,000
    stripeMinimum: 10000,
    countries: ['LK'],
    locale: 'si-LK',
  },

  // Europe - Additional
  ISK: {
    code: 'ISK',
    symbol: 'kr',
    name: 'Icelandic Krona',
    decimals: 0,                      // Zero-decimal currency
    minAmountSmallestUnit: 700,      // 700 ISK (~$5 USD)
    maxAmountSmallestUnit: 1400000,  // 1,400,000 ISK
    stripeMinimum: 50,
    countries: ['IS'],
    locale: 'is-IS',
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    decimals: 2,
    minAmountSmallestUnit: 17000,    // ₺170.00 (~$5 USD, volatile)
    maxAmountSmallestUnit: 3400000,  // ₺34,000
    stripeMinimum: 1500,
    countries: ['TR'],
    locale: 'tr-TR',
  },

  // Africa
  MAD: {
    code: 'MAD',
    symbol: 'د.م.',
    name: 'Moroccan Dirham',
    decimals: 2,
    minAmountSmallestUnit: 5000,     // 50.00 MAD (~$5 USD)
    maxAmountSmallestUnit: 1000000,  // 10,000 MAD
    stripeMinimum: 500,
    countries: ['MA'],
    locale: 'ar-MA',
  },
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Tanzanian Shilling',
    decimals: 2,
    minAmountSmallestUnit: 1250000,  // 12,500.00 TZS (~$5 USD)
    maxAmountSmallestUnit: 250000000, // 2,500,000 TZS
    stripeMinimum: 100000,
    countries: ['TZ'],
    locale: 'sw-TZ',
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    decimals: 0,                      // Zero-decimal currency
    minAmountSmallestUnit: 18500,    // 18,500 UGX (~$5 USD)
    maxAmountSmallestUnit: 37000000, // 37,000,000 UGX
    stripeMinimum: 1000,
    countries: ['UG'],
    locale: 'en-UG',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    decimals: 2,
    minAmountSmallestUnit: 9000,     // R90.00 (~$5 USD)
    maxAmountSmallestUnit: 1800000,  // R18,000
    stripeMinimum: 800,
    countries: ['ZA'],
    locale: 'en-ZA',
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    decimals: 2,
    minAmountSmallestUnit: 75000,    // KSh 750.00 (~$5 USD)
    maxAmountSmallestUnit: 15000000, // KSh 150,000
    stripeMinimum: 5000,
    countries: ['KE'],
    locale: 'sw-KE',
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    decimals: 2,
    minAmountSmallestUnit: 750000,   // ₦7,500.00 (~$5 USD)
    maxAmountSmallestUnit: 150000000, // ₦1,500,000
    stripeMinimum: 50000,
    countries: ['NG'],
    locale: 'en-NG',
  },
  GHS: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghanaian Cedi',
    decimals: 2,
    minAmountSmallestUnit: 6000,     // ₵60.00 (~$5 USD)
    maxAmountSmallestUnit: 1200000,  // ₵12,000
    stripeMinimum: 500,
    countries: ['GH'],
    locale: 'en-GH',
  },
  EGP: {
    code: 'EGP',
    symbol: 'E£',
    name: 'Egyptian Pound',
    decimals: 2,
    minAmountSmallestUnit: 25000,    // E£250.00 (~$5 USD)
    maxAmountSmallestUnit: 5000000,  // E£50,000
    stripeMinimum: 2000,
    countries: ['EG'],
    locale: 'ar-EG',
  },

  // Caribbean
  JMD: {
    code: 'JMD',
    symbol: 'J$',
    name: 'Jamaican Dollar',
    decimals: 2,
    minAmountSmallestUnit: 78000,    // J$780.00 (~$5 USD)
    maxAmountSmallestUnit: 15600000, // J$156,000
    stripeMinimum: 5000,
    countries: ['JM'],
    locale: 'en-JM',
  },
  TTD: {
    code: 'TTD',
    symbol: 'TT$',
    name: 'Trinidad Dollar',
    decimals: 2,
    minAmountSmallestUnit: 3400,     // TT$34.00 (~$5 USD)
    maxAmountSmallestUnit: 680000,   // TT$6,800
    stripeMinimum: 300,
    countries: ['TT'],
    locale: 'en-TT',
  },
};

// ============================================================================
// COUNTRY TO CURRENCY MAPPING
// ============================================================================

/**
 * Maps ISO 3166-1 alpha-2 country codes to their primary currency.
 * Used for automatic currency detection based on user location.
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {};

// Build country to currency mapping from CURRENCY_CONFIG
Object.values(CURRENCY_CONFIG).forEach(config => {
  config.countries.forEach(country => {
    COUNTRY_TO_CURRENCY[country] = config.code;
  });
});

// ============================================================================
// ZERO-DECIMAL CURRENCIES
// ============================================================================

/**
 * Currencies that don't use decimal places.
 * For these, amounts are already in the smallest unit (e.g., 1000 JPY, not 1000 cents).
 */
export const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',  // Burundian Franc
  'CLP',  // Chilean Peso
  'DJF',  // Djiboutian Franc
  'GNF',  // Guinean Franc
  'IDR',  // Indonesian Rupiah
  'ISK',  // Icelandic Krona
  'JPY',  // Japanese Yen
  'KMF',  // Comorian Franc
  'KRW',  // South Korean Won
  'MGA',  // Malagasy Ariary
  'PYG',  // Paraguayan Guarani
  'RWF',  // Rwandan Franc
  'UGX',  // Ugandan Shilling
  'VND',  // Vietnamese Dong
  'VUV',  // Vanuatu Vatu
  'XAF',  // Central African CFA Franc
  'XOF',  // West African CFA Franc
  'XPF',  // CFP Franc
]);

/**
 * Currencies that use 3 decimal places.
 * For these, smallest unit = amount * 1000.
 */
export const THREE_DECIMAL_CURRENCIES = new Set([
  'BHD',  // Bahraini Dinar
  'JOD',  // Jordanian Dinar
  'KWD',  // Kuwaiti Dinar
  'OMR',  // Omani Rial
]);

/**
 * Check if a currency is zero-decimal
 */
export function isZeroDecimalCurrency(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase());
}

/**
 * Check if a currency is three-decimal
 */
export function isThreeDecimalCurrency(currency: string): boolean {
  return THREE_DECIMAL_CURRENCIES.has(currency.toUpperCase());
}

// ============================================================================
// SELECTABLE CURRENCIES
// ============================================================================

/**
 * All currencies available for user selection.
 */
export const SELECTABLE_CURRENCIES = Object.keys(CURRENCY_CONFIG);

/**
 * Currencies available for non-US users (all currencies).
 */
export const NON_US_SELECTABLE_CURRENCIES = Object.keys(CURRENCY_CONFIG);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get currency config for a given currency code.
 * Returns USD config if currency not found.
 */
export function getCurrencyConfig(currency: string): CurrencyConfig {
  return CURRENCY_CONFIG[currency.toUpperCase()] as CurrencyConfig || CURRENCY_CONFIG.USD;
}

/**
 * Get currency for a given country code.
 * Returns 'USD' if country not found.
 */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'USD';
}

/**
 * Get the decimal multiplier for a currency.
 * Zero-decimal: 1, Two-decimal: 100, Three-decimal: 1000
 */
export function getDecimalMultiplier(currency: string): number {
  const config = getCurrencyConfig(currency);
  return Math.pow(10, config.decimals);
}

/**
 * Convert display amount to smallest unit (cents, fils, etc.)
 * Handles zero-decimal and three-decimal currencies correctly.
 * 
 * @param displayAmount - Amount in display format (e.g., 25.00 for $25)
 * @param currency - Currency code
 * @returns Amount in smallest unit (e.g., 2500 cents for USD, 25000 fils for BHD)
 */
export function toSmallestUnit(displayAmount: number, currency: string): number {
  return Math.round(displayAmount * getDecimalMultiplier(currency));
}

/**
 * Convert smallest unit to display amount.
 * Handles zero-decimal and three-decimal currencies correctly.
 * 
 * @param smallestUnit - Amount in smallest unit (e.g., 2500 cents)
 * @param currency - Currency code
 * @returns Amount in display format (e.g., 25.00)
 */
export function toDisplayAmount(smallestUnit: number, currency: string): number {
  return smallestUnit / getDecimalMultiplier(currency);
}

/**
 * Validate amount against currency-specific minimums and maximums.
 * 
 * @param amountSmallestUnit - Amount in smallest unit
 * @param currency - Currency code
 * @returns Object with isValid and error message if invalid
 */
export function validateAmount(
  amountSmallestUnit: number,
  currency: string
): { isValid: boolean; error?: string } {
  const config = getCurrencyConfig(currency);
  
  if (amountSmallestUnit < config.minAmountSmallestUnit) {
    const minDisplay = toDisplayAmount(config.minAmountSmallestUnit, currency);
    return {
      isValid: false,
      error: `Minimum deposit is ${config.symbol}${minDisplay.toLocaleString()}`,
    };
  }
  
  if (amountSmallestUnit > config.maxAmountSmallestUnit) {
    const maxDisplay = toDisplayAmount(config.maxAmountSmallestUnit, currency);
    return {
      isValid: false,
      error: `Maximum deposit is ${config.symbol}${maxDisplay.toLocaleString()}`,
    };
  }
  
  return { isValid: true };
}

/**
 * Get currency options for dropdown display.
 */
export function getCurrencyOptions(): Array<{ value: string; label: string; symbol: string }> {
  return Object.values(CURRENCY_CONFIG).map(config => ({
    value: config.code,
    label: `${config.symbol} ${config.name} (${config.code})`,
    symbol: config.symbol,
  }));
}

