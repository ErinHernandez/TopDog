/**
 * Currency Formatting Utilities
 * 
 * Functions for formatting monetary values consistently.
 * Supports multiple currencies including zero-decimal currencies (JPY, KRW, VND).
 */

// ============================================================================
// ZERO-DECIMAL CURRENCIES
// ============================================================================

// Import from currencyConfig to maintain single source of truth
import { 
  isZeroDecimalCurrency as isZeroDecimalCurrencyFromConfig,
  isThreeDecimalCurrency as isThreeDecimalCurrencyFromConfig,
  getDecimalMultiplier as getDecimalMultiplierFromConfig,
  getCurrencyConfig,
} from '../../../../lib/stripe/currencyConfig';

/**
 * Check if a currency is zero-decimal
 * Re-exports from currencyConfig to maintain consistency
 */
export function isZeroDecimalCurrency(currency: string): boolean {
  return isZeroDecimalCurrencyFromConfig(currency);
}

/**
 * Check if a currency is three-decimal (BHD, JOD, KWD, OMR)
 */
export function isThreeDecimalCurrency(currency: string): boolean {
  return isThreeDecimalCurrencyFromConfig(currency);
}

/**
 * Get the decimal count for a currency
 * 0 for zero-decimal, 2 for standard, 3 for three-decimal
 */
export function getCurrencyDecimals(currency: string): number {
  const config = getCurrencyConfig(currency);
  return config.decimals;
}

// ============================================================================
// CURRENCY SYMBOLS
// ============================================================================

/**
 * Currency symbols for all Stripe-supported currencies
 * Settlement currencies have full config in currencyConfig.ts
 * Display-only currencies just need symbol + locale for formatting
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  // ======== NORTH AMERICA ========
  USD: '$',
  CAD: 'C$',
  MXN: '$',

  // ======== LATIN AMERICA ========
  BRL: 'R$',        // Brazilian Real
  CLP: '$',         // Chilean Peso
  COP: '$',         // Colombian Peso
  PEN: 'S/',        // Peruvian Sol
  ARS: '$',         // Argentine Peso (display only - capital controls)
  BOB: 'Bs',        // Bolivian Boliviano
  CRC: '₡',         // Costa Rican Colon
  GTQ: 'Q',         // Guatemalan Quetzal
  HNL: 'L',         // Honduran Lempira
  NIO: 'C$',        // Nicaraguan Cordoba
  PAB: 'B/.',       // Panamanian Balboa
  PYG: '₲',         // Paraguayan Guarani
  VES: 'Bs.S',      // Venezuelan Bolivar
  
  // ======== CARIBBEAN ========
  DOP: 'RD$',       // Dominican Peso
  UYU: '$U',        // Uruguayan Peso
  JMD: 'J$',        // Jamaican Dollar
  TTD: 'TT$',       // Trinidad Dollar
  BBD: 'Bds$',      // Barbados Dollar
  BSD: 'B$',        // Bahamian Dollar
  BZD: 'BZ$',       // Belize Dollar
  KYD: 'CI$',       // Cayman Islands Dollar
  XCD: 'EC$',       // East Caribbean Dollar
  HTG: 'G',         // Haitian Gourde
  AWG: 'Afl.',      // Aruban Florin
  ANG: 'NAf.',      // Netherlands Antillean Guilder

  // ======== EUROPE - EUROZONE ========
  EUR: '€',

  // ======== EUROPE - NON-EUROZONE ========
  GBP: '£',         // British Pound
  CHF: 'CHF',       // Swiss Franc
  SEK: 'kr',        // Swedish Krona
  NOK: 'kr',        // Norwegian Krone
  DKK: 'kr',        // Danish Krone
  PLN: 'zł',        // Polish Zloty
  CZK: 'Kč',        // Czech Koruna
  HUF: 'Ft',        // Hungarian Forint
  RON: 'lei',       // Romanian Leu
  BGN: 'лв',        // Bulgarian Lev
  HRK: 'kn',        // Croatian Kuna (legacy)
  ISK: 'kr',        // Icelandic Krona
  TRY: '₺',         // Turkish Lira
  RSD: 'дин.',      // Serbian Dinar
  MKD: 'ден',       // Macedonian Denar
  BAM: 'KM',        // Bosnia Mark
  ALL: 'L',         // Albanian Lek
  MDL: 'L',         // Moldovan Leu
  UAH: '₴',         // Ukrainian Hryvnia
  BYN: 'Br',        // Belarusian Ruble
  RUB: '₽',         // Russian Ruble
  GEL: '₾',         // Georgian Lari
  AMD: '֏',         // Armenian Dram
  AZN: '₼',         // Azerbaijani Manat

  // ======== MIDDLE EAST ========
  AED: 'د.إ',       // UAE Dirham
  SAR: '﷼',         // Saudi Riyal
  QAR: 'ر.ق',       // Qatari Riyal
  BHD: '.د.ب',      // Bahraini Dinar
  KWD: 'د.ك',       // Kuwaiti Dinar
  OMR: 'ر.ع.',      // Omani Rial
  JOD: 'د.ا',       // Jordanian Dinar
  ILS: '₪',         // Israeli Shekel
  LBP: 'ل.ل',       // Lebanese Pound
  IQD: 'ع.د',       // Iraqi Dinar
  YER: '﷼',         // Yemeni Rial
  SYP: '£S',        // Syrian Pound

  // ======== AFRICA ========
  ZAR: 'R',         // South African Rand
  NGN: '₦',         // Nigerian Naira
  KES: 'KSh',       // Kenyan Shilling
  GHS: '₵',         // Ghanaian Cedi
  EGP: 'E£',        // Egyptian Pound
  MAD: 'د.م.',      // Moroccan Dirham
  TZS: 'TSh',       // Tanzanian Shilling
  UGX: 'USh',       // Ugandan Shilling
  DZD: 'د.ج',       // Algerian Dinar
  TND: 'د.ت',       // Tunisian Dinar
  XOF: 'CFA',       // West African CFA Franc
  XAF: 'FCFA',      // Central African CFA Franc
  MUR: '₨',         // Mauritian Rupee
  NAD: 'N$',        // Namibian Dollar
  BWP: 'P',         // Botswana Pula
  ZMW: 'ZK',        // Zambian Kwacha
  MWK: 'MK',        // Malawian Kwacha
  MZN: 'MT',        // Mozambican Metical
  AOA: 'Kz',        // Angolan Kwanza
  ETB: 'Br',        // Ethiopian Birr
  RWF: 'FRw',       // Rwandan Franc
  BIF: 'FBu',       // Burundian Franc
  DJF: 'Fdj',       // Djiboutian Franc
  GNF: 'FG',        // Guinean Franc
  KMF: 'CF',        // Comorian Franc
  MGA: 'Ar',        // Malagasy Ariary
  SCR: '₨',         // Seychellois Rupee
  SOS: 'S',         // Somali Shilling
  SDG: '£',         // Sudanese Pound
  SZL: 'E',         // Swazi Lilangeni
  GMD: 'D',         // Gambian Dalasi
  CVE: '$',         // Cape Verdean Escudo
  LRD: 'L$',        // Liberian Dollar
  SLL: 'Le',        // Sierra Leonean Leone
  STD: 'Db',        // Sao Tome Dobra
  LSL: 'M',         // Lesotho Loti

  // ======== ASIA - EAST ========
  JPY: '¥',         // Japanese Yen
  CNY: '¥',         // Chinese Yuan
  KRW: '₩',         // South Korean Won
  TWD: 'NT$',       // New Taiwan Dollar
  HKD: 'HK$',       // Hong Kong Dollar
  MOP: 'MOP$',      // Macanese Pataca
  MNT: '₮',         // Mongolian Tugrik
  KPW: '₩',         // North Korean Won (display only)

  // ======== ASIA - SOUTHEAST ========
  SGD: 'S$',        // Singapore Dollar
  MYR: 'RM',        // Malaysian Ringgit
  THB: '฿',         // Thai Baht
  PHP: '₱',         // Philippine Peso
  IDR: 'Rp',        // Indonesian Rupiah
  VND: '₫',         // Vietnamese Dong
  MMK: 'K',         // Myanmar Kyat
  KHR: '៛',         // Cambodian Riel
  LAK: '₭',         // Lao Kip
  BND: 'B$',        // Brunei Dollar

  // ======== ASIA - SOUTH ========
  INR: '₹',         // Indian Rupee
  LKR: 'Rs',        // Sri Lankan Rupee
  PKR: '₨',         // Pakistani Rupee
  BDT: '৳',         // Bangladeshi Taka
  NPR: '₨',         // Nepalese Rupee
  BTN: 'Nu.',       // Bhutanese Ngultrum
  MVR: 'Rf',        // Maldivian Rufiyaa
  AFN: '؋',         // Afghan Afghani

  // ======== ASIA - CENTRAL ========
  KZT: '₸',         // Kazakhstani Tenge
  UZS: 'soʻm',      // Uzbekistani Som
  KGS: 'сом',       // Kyrgyzstani Som
  TJS: 'SM',        // Tajikistani Somoni
  TMT: 'm',         // Turkmenistani Manat

  // ======== OCEANIA ========
  AUD: 'A$',        // Australian Dollar
  NZD: 'NZ$',       // New Zealand Dollar
  FJD: 'FJ$',       // Fijian Dollar
  PGK: 'K',         // Papua New Guinean Kina
  SBD: 'SI$',       // Solomon Islands Dollar
  TOP: 'T$',        // Tongan Paʻanga
  VUV: 'VT',        // Vanuatu Vatu
  WST: 'WS$',       // Samoan Tala
  XPF: '₣',         // CFP Franc
};

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

// ============================================================================
// TYPES
// ============================================================================

export interface FormatCurrencyOptions {
  /** Currency code (default: USD) */
  currency?: string;
  /** Show cents even for whole dollar amounts */
  showCents?: boolean;
  /** Use compact notation for large numbers (e.g., $1.5M) */
  compact?: boolean;
  /** Include plus sign for positive amounts */
  showPlusSign?: boolean;
  /** Locale for formatting (default: auto-detect from currency) */
  locale?: string;
}

// ============================================================================
// CURRENCY LOCALE MAPPING
// ============================================================================

/**
 * Locale mappings for all Stripe-supported currencies
 * Used for proper number formatting with Intl.NumberFormat
 */
const CURRENCY_LOCALES: Record<string, string> = {
  // ======== NORTH AMERICA ========
  USD: 'en-US',
  CAD: 'en-CA',
  MXN: 'es-MX',

  // ======== LATIN AMERICA ========
  BRL: 'pt-BR',
  CLP: 'es-CL',
  COP: 'es-CO',
  PEN: 'es-PE',
  ARS: 'es-AR',
  BOB: 'es-BO',
  CRC: 'es-CR',
  GTQ: 'es-GT',
  HNL: 'es-HN',
  NIO: 'es-NI',
  PAB: 'es-PA',
  PYG: 'es-PY',
  VES: 'es-VE',

  // ======== CARIBBEAN ========
  DOP: 'es-DO',
  UYU: 'es-UY',
  JMD: 'en-JM',
  TTD: 'en-TT',
  BBD: 'en-BB',
  BSD: 'en-BS',
  BZD: 'en-BZ',
  KYD: 'en-KY',
  XCD: 'en-AG',
  HTG: 'fr-HT',
  AWG: 'nl-AW',
  ANG: 'nl-CW',

  // ======== EUROPE ========
  EUR: 'de-DE',
  GBP: 'en-GB',
  CHF: 'de-CH',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  PLN: 'pl-PL',
  CZK: 'cs-CZ',
  HUF: 'hu-HU',
  RON: 'ro-RO',
  BGN: 'bg-BG',
  HRK: 'hr-HR',
  ISK: 'is-IS',
  TRY: 'tr-TR',
  RSD: 'sr-RS',
  MKD: 'mk-MK',
  BAM: 'bs-BA',
  ALL: 'sq-AL',
  MDL: 'ro-MD',
  UAH: 'uk-UA',
  BYN: 'be-BY',
  RUB: 'ru-RU',
  GEL: 'ka-GE',
  AMD: 'hy-AM',
  AZN: 'az-AZ',

  // ======== MIDDLE EAST ========
  AED: 'ar-AE',
  SAR: 'ar-SA',
  QAR: 'ar-QA',
  BHD: 'ar-BH',
  KWD: 'ar-KW',
  OMR: 'ar-OM',
  JOD: 'ar-JO',
  ILS: 'he-IL',
  LBP: 'ar-LB',
  IQD: 'ar-IQ',
  YER: 'ar-YE',
  SYP: 'ar-SY',

  // ======== AFRICA ========
  ZAR: 'en-ZA',
  NGN: 'en-NG',
  KES: 'sw-KE',
  GHS: 'en-GH',
  EGP: 'ar-EG',
  MAD: 'ar-MA',
  TZS: 'sw-TZ',
  UGX: 'en-UG',
  DZD: 'ar-DZ',
  TND: 'ar-TN',
  XOF: 'fr-SN',
  XAF: 'fr-CM',
  MUR: 'en-MU',
  NAD: 'en-NA',
  BWP: 'en-BW',
  ZMW: 'en-ZM',
  MWK: 'en-MW',
  MZN: 'pt-MZ',
  AOA: 'pt-AO',
  ETB: 'am-ET',
  RWF: 'rw-RW',
  BIF: 'fr-BI',
  DJF: 'fr-DJ',
  GNF: 'fr-GN',
  KMF: 'ar-KM',
  MGA: 'mg-MG',
  SCR: 'fr-SC',
  SOS: 'so-SO',
  SDG: 'ar-SD',
  SZL: 'en-SZ',
  GMD: 'en-GM',
  CVE: 'pt-CV',
  LRD: 'en-LR',
  SLL: 'en-SL',
  STD: 'pt-ST',
  LSL: 'en-LS',

  // ======== ASIA - EAST ========
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  KRW: 'ko-KR',
  TWD: 'zh-TW',
  HKD: 'zh-HK',
  MOP: 'zh-MO',
  MNT: 'mn-MN',
  KPW: 'ko-KP',

  // ======== ASIA - SOUTHEAST ========
  SGD: 'en-SG',
  MYR: 'ms-MY',
  THB: 'th-TH',
  PHP: 'en-PH',
  IDR: 'id-ID',
  VND: 'vi-VN',
  MMK: 'my-MM',
  KHR: 'km-KH',
  LAK: 'lo-LA',
  BND: 'ms-BN',

  // ======== ASIA - SOUTH ========
  INR: 'en-IN',
  LKR: 'si-LK',
  PKR: 'ur-PK',
  BDT: 'bn-BD',
  NPR: 'ne-NP',
  BTN: 'dz-BT',
  MVR: 'dv-MV',
  AFN: 'fa-AF',

  // ======== ASIA - CENTRAL ========
  KZT: 'kk-KZ',
  UZS: 'uz-UZ',
  KGS: 'ky-KG',
  TJS: 'tg-TJ',
  TMT: 'tk-TM',

  // ======== OCEANIA ========
  AUD: 'en-AU',
  NZD: 'en-NZ',
  FJD: 'en-FJ',
  PGK: 'en-PG',
  SBD: 'en-SB',
  TOP: 'to-TO',
  VUV: 'bi-VU',
  WST: 'sm-WS',
  XPF: 'fr-PF',
};

function getLocaleForCurrency(currency: string): string {
  return CURRENCY_LOCALES[currency.toUpperCase()] || 'en-US';
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Format smallest unit to currency string
 * 
 * For standard currencies (USD, EUR, etc.): 2500 cents -> "$25.00"
 * For zero-decimal currencies (JPY, KRW): 2500 -> "¥2,500"
 * For three-decimal currencies (BHD, KWD): 2500 fils -> "BD 2.500"
 * 
 * @param smallestUnit - Amount in smallest unit (cents for USD, yen for JPY, fils for BHD)
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatSmallestUnit(2500, { currency: 'USD' }) // "$25.00"
 * formatSmallestUnit(2500, { currency: 'JPY' }) // "¥2,500"
 * formatSmallestUnit(2500, { currency: 'BHD' }) // "BD 2.500"
 * formatSmallestUnit(2500, { currency: 'USD', showCents: false }) // "$25"
 * formatSmallestUnit(1500000, { currency: 'USD', compact: true }) // "$15K"
 */
export function formatSmallestUnit(
  smallestUnit: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = 'USD',
    showCents = true,
    compact = false,
    showPlusSign = false,
    locale,
  } = options;
  
  const currencyUpper = currency.toUpperCase();
  const decimals = getCurrencyDecimals(currencyUpper);
  
  // Convert to display value based on decimal places
  const divisor = decimals === 0 ? 1 : Math.pow(10, decimals);
  const displayValue = smallestUnit / divisor;
  const isNegative = displayValue < 0;
  const absValue = Math.abs(displayValue);
  
  // Compact formatting for large numbers
  if (compact && absValue >= 1000) {
    const formatted = formatCompactCurrency(absValue);
    const symbol = getCurrencySymbol(currencyUpper);
    const sign = isNegative ? '-' : (showPlusSign && displayValue > 0 ? '+' : '');
    return `${sign}${symbol}${formatted}`;
  }
  
  // Standard formatting using Intl.NumberFormat
  const formatLocale = locale || getLocaleForCurrency(currencyUpper);
  const displayDecimals = decimals === 0 ? 0 : (showCents ? decimals : 0);
  
  const formatter = new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency: currencyUpper,
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
  });
  
  let formatted = formatter.format(absValue);
  
  // Add signs
  if (isNegative) {
    formatted = `-${formatted}`;
  } else if (showPlusSign && displayValue > 0) {
    formatted = `+${formatted}`;
  }
  
  return formatted;
}

/**
 * Format cents to currency string (USD-focused, backward compatible)
 * 
 * @param cents - Amount in cents
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCents(2500) // "$25.00"
 * formatCents(2500, { showCents: false }) // "$25"
 * formatCents(1500000, { compact: true }) // "$15K"
 */
export function formatCents(
  cents: number,
  options: FormatCurrencyOptions = {}
): string {
  return formatSmallestUnit(cents, options);
}

/**
 * Format display amount to currency string
 * 
 * @param displayAmount - Amount in display format (e.g., 25.00 for $25)
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatDisplayAmount(
  displayAmount: number,
  options: FormatCurrencyOptions = {}
): string {
  const currency = (options.currency || 'USD').toUpperCase();
  const decimals = getCurrencyDecimals(currency);
  
  // Convert to smallest unit based on decimal places
  const multiplier = decimals === 0 ? 1 : Math.pow(10, decimals);
  const smallestUnit = Math.round(displayAmount * multiplier);
  
  return formatSmallestUnit(smallestUnit, options);
}

/**
 * Format dollars to currency string (backward compatible alias)
 * 
 * @param dollars - Amount in dollars
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatDollars(
  dollars: number,
  options: FormatCurrencyOptions = {}
): string {
  return formatDisplayAmount(dollars, options);
}

/**
 * Format large currency values in compact notation
 * 
 * @param value - Value in display units
 * @returns Compact formatted string (without currency symbol)
 * 
 * @example
 * formatCompactCurrency(1500000) // "1.5M"
 * formatCompactCurrency(2500) // "2.5K"
 */
export function formatCompactCurrency(value: number): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000_000) {
    const billions = absValue / 1_000_000_000;
    return `${billions.toFixed(billions < 10 ? 1 : 0)}B`;
  }
  
  if (absValue >= 1_000_000) {
    const millions = absValue / 1_000_000;
    return `${millions.toFixed(millions < 10 ? 1 : 0)}M`;
  }
  
  if (absValue >= 1_000) {
    const thousands = absValue / 1_000;
    return `${thousands.toFixed(thousands < 10 ? 1 : 0)}K`;
  }
  
  return absValue.toString();
}

/**
 * Parse a currency string to smallest unit
 * 
 * @param value - Currency string (e.g., "$25.00", "25", "$2M")
 * @param currency - Currency code for proper parsing
 * @returns Amount in smallest unit, or null if invalid
 */
export function parseCurrency(value: string, currency: string = 'USD'): number | null {
  if (!value) return null;
  
  const currencyUpper = currency.toUpperCase();
  const decimals = getCurrencyDecimals(currencyUpper);
  const multiplier = decimals === 0 ? 1 : Math.pow(10, decimals);
  
  // Remove currency symbols, commas, and whitespace
  let cleaned = value.replace(/[$€£¥₩฿₱₫₹₺₴₦₵﷼,\s]/g, '').trim();
  // Also remove common multi-char symbols
  cleaned = cleaned.replace(/^(C\$|A\$|NZ\$|S\$|HK\$|NT\$|R\$|RD\$|\$U|J\$|TT\$)/i, '');
  
  // Handle compact notation
  const multipliers: Record<string, number> = {
    'k': 1_000,
    'K': 1_000,
    'm': 1_000_000,
    'M': 1_000_000,
    'b': 1_000_000_000,
    'B': 1_000_000_000,
  };
  
  const lastChar = cleaned.slice(-1);
  if (multipliers[lastChar]) {
    const numPart = parseFloat(cleaned.slice(0, -1));
    if (isNaN(numPart)) return null;
    const displayValue = numPart * multipliers[lastChar];
    return Math.round(displayValue * multiplier);
  }
  
  // Standard parsing
  const numValue = parseFloat(cleaned);
  if (isNaN(numValue)) return null;
  
  return Math.round(numValue * multiplier);
}

/**
 * Convert smallest unit to display amount
 * Handles zero-decimal, two-decimal, and three-decimal currencies
 */
export function toDisplayAmount(smallestUnit: number, currency: string = 'USD'): number {
  const decimals = getCurrencyDecimals(currency);
  const divisor = decimals === 0 ? 1 : Math.pow(10, decimals);
  return smallestUnit / divisor;
}

/**
 * Convert display amount to smallest unit
 * Handles zero-decimal, two-decimal, and three-decimal currencies
 */
export function toSmallestUnit(displayAmount: number, currency: string = 'USD'): number {
  const decimals = getCurrencyDecimals(currency);
  const multiplier = decimals === 0 ? 1 : Math.pow(10, decimals);
  return Math.round(displayAmount * multiplier);
}
