/**
 * Currency Icons Configuration
 * 
 * Maps currency codes to their icon resources (SVG paths, icon library references, etc.)
 * Used for displaying currency icons in the UI.
 * 
 * Includes all currencies from CURRENCY_SYMBOLS for comprehensive display support.
 */

import { getCurrencySymbol } from '../../components/vx2/utils/formatting/currency';

// ============================================================================
// TYPES
// ============================================================================

export interface CurrencyIconConfig {
  /** Currency code (ISO 4217) */
  code: string;
  /** Path to icon file (relative to /public/icons/currencies/) */
  iconPath?: string;
  /** Icons8 icon name (if using Icons8 library) */
  icons8Name?: string;
  /** Font Awesome icon class (if using Font Awesome) */
  fontAwesome?: string;
  /** Material Icons name (if using Material Icons) */
  materialIcon?: string;
  /** Unicode symbol for fallback */
  unicode: string;
  /** Alternative: URL to external icon */
  iconUrl?: string;
}

// ============================================================================
// CURRENCY ICON MAPPINGS
// ============================================================================

/**
 * Currency icon configurations.
 * Icons should be placed in /public/icons/currencies/ as SVG files.
 * 
 * Naming convention: currency-[code].svg (e.g., currency-usd.svg)
 */
export const CURRENCY_ICONS: Record<string, CurrencyIconConfig> = {
  // North America
  USD: {
    code: 'USD',
    iconPath: '/icons/currencies/currency-usd.svg',
    icons8Name: 'dollar',
    fontAwesome: 'fa-dollar-sign',
    materialIcon: 'attach_money',
    unicode: '$',
  },
  CAD: {
    code: 'CAD',
    iconPath: '/icons/currencies/currency-cad.svg',
    icons8Name: 'canadian-dollar',
    unicode: 'C$',
  },
  MXN: {
    code: 'MXN',
    iconPath: '/icons/currencies/currency-mxn.svg',
    icons8Name: 'mexican-peso',
    unicode: '$',
  },

  // Europe - Eurozone
  EUR: {
    code: 'EUR',
    iconPath: '/icons/currencies/currency-eur.svg',
    icons8Name: 'euro',
    fontAwesome: 'fa-euro-sign',
    materialIcon: 'euro_symbol',
    unicode: '€',
  },

  // Europe - Non-Eurozone
  GBP: {
    code: 'GBP',
    iconPath: '/icons/currencies/currency-gbp.svg',
    icons8Name: 'pound',
    fontAwesome: 'fa-pound-sign',
    materialIcon: 'currency_pound',
    unicode: '£',
  },
  CHF: {
    code: 'CHF',
    iconPath: '/icons/currencies/currency-chf.svg',
    icons8Name: 'swiss-franc',
    unicode: 'CHF',
  },
  SEK: {
    code: 'SEK',
    iconPath: '/icons/currencies/currency-sek.svg',
    icons8Name: 'swedish-krona',
    unicode: 'kr',
  },
  NOK: {
    code: 'NOK',
    iconPath: '/icons/currencies/currency-nok.svg',
    icons8Name: 'norwegian-krone',
    unicode: 'kr',
  },
  DKK: {
    code: 'DKK',
    iconPath: '/icons/currencies/currency-dkk.svg',
    icons8Name: 'danish-krone',
    unicode: 'kr',
  },
  PLN: {
    code: 'PLN',
    iconPath: '/icons/currencies/currency-pln.svg',
    icons8Name: 'polish-zloty',
    unicode: 'zł',
  },
  CZK: {
    code: 'CZK',
    iconPath: '/icons/currencies/currency-czk.svg',
    icons8Name: 'czech-koruna',
    unicode: 'Kč',
  },
  HUF: {
    code: 'HUF',
    iconPath: '/icons/currencies/currency-huf.svg',
    icons8Name: 'hungarian-forint',
    unicode: 'Ft',
  },
  RON: {
    code: 'RON',
    iconPath: '/icons/currencies/currency-ron.svg',
    icons8Name: 'romanian-leu',
    unicode: 'lei',
  },
  BGN: {
    code: 'BGN',
    iconPath: '/icons/currencies/currency-bgn.svg',
    icons8Name: 'bulgarian-lev',
    unicode: 'лв',
  },
  HRK: {
    code: 'HRK',
    iconPath: '/icons/currencies/currency-hrk.svg',
    icons8Name: 'croatian-kuna',
    unicode: 'kn',
  },

  // Latin America
  BRL: {
    code: 'BRL',
    iconPath: '/icons/currencies/currency-brl.svg',
    icons8Name: 'brazilian-real',
    unicode: 'R$',
  },
  CLP: {
    code: 'CLP',
    iconPath: '/icons/currencies/currency-clp.svg',
    icons8Name: 'chilean-peso',
    unicode: '$',
  },
  COP: {
    code: 'COP',
    iconPath: '/icons/currencies/currency-cop.svg',
    icons8Name: 'colombian-peso',
    unicode: '$',
  },
  PEN: {
    code: 'PEN',
    iconPath: '/icons/currencies/currency-pen.svg',
    icons8Name: 'peruvian-sol',
    unicode: 'S/',
  },
  DOP: {
    code: 'DOP',
    iconPath: '/icons/currencies/currency-dop.svg',
    icons8Name: 'dominican-peso',
    unicode: 'RD$',
  },
  UYU: {
    code: 'UYU',
    iconPath: '/icons/currencies/currency-uyu.svg',
    icons8Name: 'uruguayan-peso',
    unicode: '$U',
  },

  // Asia-Pacific
  SGD: {
    code: 'SGD',
    iconPath: '/icons/currencies/currency-sgd.svg',
    icons8Name: 'singapore-dollar',
    unicode: 'S$',
  },
  MYR: {
    code: 'MYR',
    iconPath: '/icons/currencies/currency-myr.svg',
    icons8Name: 'malaysian-ringgit',
    unicode: 'RM',
  },
  THB: {
    code: 'THB',
    iconPath: '/icons/currencies/currency-thb.svg',
    icons8Name: 'thai-baht',
    unicode: '฿',
  },
  PHP: {
    code: 'PHP',
    iconPath: '/icons/currencies/currency-php.svg',
    icons8Name: 'philippine-peso',
    unicode: '₱',
  },
  IDR: {
    code: 'IDR',
    iconPath: '/icons/currencies/currency-idr.svg',
    icons8Name: 'indonesian-rupiah',
    unicode: 'Rp',
  },
  VND: {
    code: 'VND',
    iconPath: '/icons/currencies/currency-vnd.svg',
    icons8Name: 'vietnamese-dong',
    unicode: '₫',
  },
  KRW: {
    code: 'KRW',
    iconPath: '/icons/currencies/currency-krw.svg',
    icons8Name: 'south-korean-won',
    fontAwesome: 'fa-won-sign',
    materialIcon: 'currency_won',
    unicode: '₩',
  },
  TWD: {
    code: 'TWD',
    iconPath: '/icons/currencies/currency-twd.svg',
    icons8Name: 'taiwan-dollar',
    unicode: 'NT$',
  },
  HKD: {
    code: 'HKD',
    iconPath: '/icons/currencies/currency-hkd.svg',
    icons8Name: 'hong-kong-dollar',
    unicode: 'HK$',
  },
  NZD: {
    code: 'NZD',
    iconPath: '/icons/currencies/currency-nzd.svg',
    icons8Name: 'new-zealand-dollar',
    unicode: 'NZ$',
  },
  AUD: {
    code: 'AUD',
    iconPath: '/icons/currencies/currency-aud.svg',
    icons8Name: 'australian-dollar',
    unicode: 'A$',
  },
  JPY: {
    code: 'JPY',
    iconPath: '/icons/currencies/currency-jpy.svg',
    icons8Name: 'yen',
    fontAwesome: 'fa-yen-sign',
    materialIcon: 'currency_yen',
    unicode: '¥',
  },

  // Middle East
  AED: {
    code: 'AED',
    iconPath: '/icons/currencies/currency-aed.svg',
    icons8Name: 'uae-dirham',
    unicode: 'د.إ',
  },
  SAR: {
    code: 'SAR',
    iconPath: '/icons/currencies/currency-sar.svg',
    icons8Name: 'saudi-riyal',
    unicode: '﷼',
  },
  QAR: {
    code: 'QAR',
    iconPath: '/icons/currencies/currency-qar.svg',
    icons8Name: 'qatari-riyal',
    unicode: 'ر.ق',
  },
  BHD: {
    code: 'BHD',
    iconPath: '/icons/currencies/currency-bhd.svg',
    icons8Name: 'bahraini-dinar',
    unicode: '.د.ب',
  },
  KWD: {
    code: 'KWD',
    iconPath: '/icons/currencies/currency-kwd.svg',
    icons8Name: 'kuwaiti-dinar',
    unicode: 'د.ك',
  },
  OMR: {
    code: 'OMR',
    iconPath: '/icons/currencies/currency-omr.svg',
    icons8Name: 'omani-rial',
    unicode: 'ر.ع.',
  },
  JOD: {
    code: 'JOD',
    iconPath: '/icons/currencies/currency-jod.svg',
    icons8Name: 'jordanian-dinar',
    unicode: 'د.ا',
  },

  // South Asia
  INR: {
    code: 'INR',
    iconPath: '/icons/currencies/currency-inr.svg',
    icons8Name: 'indian-rupee',
    fontAwesome: 'fa-rupee-sign',
    materialIcon: 'currency_rupee',
    unicode: '₹',
  },
  LKR: {
    code: 'LKR',
    iconPath: '/icons/currencies/currency-lkr.svg',
    icons8Name: 'sri-lankan-rupee',
    unicode: 'Rs',
  },

  // Europe - Additional
  ISK: {
    code: 'ISK',
    iconPath: '/icons/currencies/currency-isk.svg',
    icons8Name: 'icelandic-krona',
    unicode: 'kr',
  },
  TRY: {
    code: 'TRY',
    iconPath: '/icons/currencies/currency-try.svg',
    icons8Name: 'turkish-lira',
    unicode: '₺',
  },

  // Africa
  MAD: {
    code: 'MAD',
    iconPath: '/icons/currencies/currency-mad.svg',
    icons8Name: 'moroccan-dirham',
    unicode: 'د.م.',
  },
  TZS: {
    code: 'TZS',
    iconPath: '/icons/currencies/currency-tzs.svg',
    icons8Name: 'tanzanian-shilling',
    unicode: 'TSh',
  },
  UGX: {
    code: 'UGX',
    iconPath: '/icons/currencies/currency-ugx.svg',
    icons8Name: 'ugandan-shilling',
    unicode: 'USh',
  },
  ZAR: {
    code: 'ZAR',
    iconPath: '/icons/currencies/currency-zar.svg',
    icons8Name: 'south-african-rand',
    unicode: 'R',
  },
  KES: {
    code: 'KES',
    iconPath: '/icons/currencies/currency-kes.svg',
    icons8Name: 'kenyan-shilling',
    unicode: 'KSh',
  },
  NGN: {
    code: 'NGN',
    iconPath: '/icons/currencies/currency-ngn.svg',
    icons8Name: 'nigerian-naira',
    unicode: '₦',
  },
  GHS: {
    code: 'GHS',
    iconPath: '/icons/currencies/currency-ghs.svg',
    icons8Name: 'ghanaian-cedi',
    unicode: '₵',
  },
  EGP: {
    code: 'EGP',
    iconPath: '/icons/currencies/currency-egp.svg',
    icons8Name: 'egyptian-pound',
    unicode: 'E£',
  },

  // Caribbean
  JMD: {
    code: 'JMD',
    iconPath: '/icons/currencies/currency-jmd.svg',
    icons8Name: 'jamaican-dollar',
    unicode: 'J$',
  },
  TTD: {
    code: 'TTD',
    iconPath: '/icons/currencies/currency-ttd.svg',
    icons8Name: 'trinidad-dollar',
    unicode: 'TT$',
  },

  // ============================================================================
  // ADDITIONAL CURRENCIES FROM CURRENCY_SYMBOLS
  // ============================================================================
  // These currencies are supported for display/formatting but may not support deposits

  // Latin America - Additional
  ARS: {
    code: 'ARS',
    iconPath: '/icons/currencies/currency-ars.svg',
    unicode: '$',
  },
  BOB: {
    code: 'BOB',
    iconPath: '/icons/currencies/currency-bob.svg',
    unicode: 'Bs',
  },
  CRC: {
    code: 'CRC',
    iconPath: '/icons/currencies/currency-crc.svg',
    unicode: '₡',
  },
  GTQ: {
    code: 'GTQ',
    iconPath: '/icons/currencies/currency-gtq.svg',
    unicode: 'Q',
  },
  HNL: {
    code: 'HNL',
    iconPath: '/icons/currencies/currency-hnl.svg',
    unicode: 'L',
  },
  NIO: {
    code: 'NIO',
    iconPath: '/icons/currencies/currency-nio.svg',
    unicode: 'C$',
  },
  PAB: {
    code: 'PAB',
    iconPath: '/icons/currencies/currency-pab.svg',
    unicode: 'B/.',
  },
  PYG: {
    code: 'PYG',
    iconPath: '/icons/currencies/currency-pyg.svg',
    unicode: '₲',
  },
  VES: {
    code: 'VES',
    iconPath: '/icons/currencies/currency-ves.svg',
    unicode: 'Bs.S',
  },

  // Caribbean - Additional
  BBD: {
    code: 'BBD',
    iconPath: '/icons/currencies/currency-bbd.svg',
    unicode: 'Bds$',
  },
  BSD: {
    code: 'BSD',
    iconPath: '/icons/currencies/currency-bsd.svg',
    unicode: 'B$',
  },
  BZD: {
    code: 'BZD',
    iconPath: '/icons/currencies/currency-bzd.svg',
    unicode: 'BZ$',
  },
  KYD: {
    code: 'KYD',
    iconPath: '/icons/currencies/currency-kyd.svg',
    unicode: 'CI$',
  },
  XCD: {
    code: 'XCD',
    iconPath: '/icons/currencies/currency-xcd.svg',
    unicode: 'EC$',
  },
  HTG: {
    code: 'HTG',
    iconPath: '/icons/currencies/currency-htg.svg',
    unicode: 'G',
  },
  AWG: {
    code: 'AWG',
    iconPath: '/icons/currencies/currency-awg.svg',
    unicode: 'Afl.',
  },
  ANG: {
    code: 'ANG',
    iconPath: '/icons/currencies/currency-ang.svg',
    unicode: 'NAf.',
  },

  // Europe - Additional
  RSD: {
    code: 'RSD',
    iconPath: '/icons/currencies/currency-rsd.svg',
    unicode: 'дин.',
  },
  MKD: {
    code: 'MKD',
    iconPath: '/icons/currencies/currency-mkd.svg',
    unicode: 'ден',
  },
  BAM: {
    code: 'BAM',
    iconPath: '/icons/currencies/currency-bam.svg',
    unicode: 'KM',
  },
  ALL: {
    code: 'ALL',
    iconPath: '/icons/currencies/currency-all.svg',
    unicode: 'L',
  },
  MDL: {
    code: 'MDL',
    iconPath: '/icons/currencies/currency-mdl.svg',
    unicode: 'L',
  },
  UAH: {
    code: 'UAH',
    iconPath: '/icons/currencies/currency-uah.svg',
    unicode: '₴',
  },
  BYN: {
    code: 'BYN',
    iconPath: '/icons/currencies/currency-byn.svg',
    unicode: 'Br',
  },
  RUB: {
    code: 'RUB',
    iconPath: '/icons/currencies/currency-rub.svg',
    unicode: '₽',
  },
  GEL: {
    code: 'GEL',
    iconPath: '/icons/currencies/currency-gel.svg',
    unicode: '₾',
  },
  AMD: {
    code: 'AMD',
    iconPath: '/icons/currencies/currency-amd.svg',
    unicode: '֏',
  },
  AZN: {
    code: 'AZN',
    iconPath: '/icons/currencies/currency-azn.svg',
    unicode: '₼',
  },

  // Middle East - Additional
  ILS: {
    code: 'ILS',
    iconPath: '/icons/currencies/currency-ils.svg',
    unicode: '₪',
  },
  LBP: {
    code: 'LBP',
    iconPath: '/icons/currencies/currency-lbp.svg',
    unicode: 'ل.ل',
  },
  IQD: {
    code: 'IQD',
    iconPath: '/icons/currencies/currency-iqd.svg',
    unicode: 'ع.د',
  },
  YER: {
    code: 'YER',
    iconPath: '/icons/currencies/currency-yer.svg',
    unicode: '﷼',
  },
  SYP: {
    code: 'SYP',
    iconPath: '/icons/currencies/currency-syp.svg',
    unicode: '£S',
  },

  // Africa - Additional
  DZD: {
    code: 'DZD',
    iconPath: '/icons/currencies/currency-dzd.svg',
    unicode: 'د.ج',
  },
  TND: {
    code: 'TND',
    iconPath: '/icons/currencies/currency-tnd.svg',
    unicode: 'د.ت',
  },
  XOF: {
    code: 'XOF',
    iconPath: '/icons/currencies/currency-xof.svg',
    unicode: 'CFA',
  },
  XAF: {
    code: 'XAF',
    iconPath: '/icons/currencies/currency-xaf.svg',
    unicode: 'FCFA',
  },
  MUR: {
    code: 'MUR',
    iconPath: '/icons/currencies/currency-mur.svg',
    unicode: '₨',
  },
  NAD: {
    code: 'NAD',
    iconPath: '/icons/currencies/currency-nad.svg',
    unicode: 'N$',
  },
  BWP: {
    code: 'BWP',
    iconPath: '/icons/currencies/currency-bwp.svg',
    unicode: 'P',
  },
  ZMW: {
    code: 'ZMW',
    iconPath: '/icons/currencies/currency-zmw.svg',
    unicode: 'ZK',
  },
  MWK: {
    code: 'MWK',
    iconPath: '/icons/currencies/currency-mwk.svg',
    unicode: 'MK',
  },
  MZN: {
    code: 'MZN',
    iconPath: '/icons/currencies/currency-mzn.svg',
    unicode: 'MT',
  },
  AOA: {
    code: 'AOA',
    iconPath: '/icons/currencies/currency-aoa.svg',
    unicode: 'Kz',
  },
  ETB: {
    code: 'ETB',
    iconPath: '/icons/currencies/currency-etb.svg',
    unicode: 'Br',
  },
  RWF: {
    code: 'RWF',
    iconPath: '/icons/currencies/currency-rwf.svg',
    unicode: 'FRw',
  },
  BIF: {
    code: 'BIF',
    iconPath: '/icons/currencies/currency-bif.svg',
    unicode: 'FBu',
  },
  DJF: {
    code: 'DJF',
    iconPath: '/icons/currencies/currency-djf.svg',
    unicode: 'Fdj',
  },
  GNF: {
    code: 'GNF',
    iconPath: '/icons/currencies/currency-gnf.svg',
    unicode: 'FG',
  },
  KMF: {
    code: 'KMF',
    iconPath: '/icons/currencies/currency-kmf.svg',
    unicode: 'CF',
  },
  MGA: {
    code: 'MGA',
    iconPath: '/icons/currencies/currency-mga.svg',
    unicode: 'Ar',
  },
  SCR: {
    code: 'SCR',
    iconPath: '/icons/currencies/currency-scr.svg',
    unicode: '₨',
  },
  SOS: {
    code: 'SOS',
    iconPath: '/icons/currencies/currency-sos.svg',
    unicode: 'S',
  },
  SDG: {
    code: 'SDG',
    iconPath: '/icons/currencies/currency-sdg.svg',
    unicode: '£',
  },
  SZL: {
    code: 'SZL',
    iconPath: '/icons/currencies/currency-szl.svg',
    unicode: 'E',
  },
  GMD: {
    code: 'GMD',
    iconPath: '/icons/currencies/currency-gmd.svg',
    unicode: 'D',
  },
  CVE: {
    code: 'CVE',
    iconPath: '/icons/currencies/currency-cve.svg',
    unicode: '$',
  },
  LRD: {
    code: 'LRD',
    iconPath: '/icons/currencies/currency-lrd.svg',
    unicode: 'L$',
  },
  SLL: {
    code: 'SLL',
    iconPath: '/icons/currencies/currency-sll.svg',
    unicode: 'Le',
  },
  STD: {
    code: 'STD',
    iconPath: '/icons/currencies/currency-std.svg',
    unicode: 'Db',
  },
  LSL: {
    code: 'LSL',
    iconPath: '/icons/currencies/currency-lsl.svg',
    unicode: 'M',
  },

  // Asia - East - Additional
  CNY: {
    code: 'CNY',
    iconPath: '/icons/currencies/currency-cny.svg',
    unicode: '¥',
  },
  MOP: {
    code: 'MOP',
    iconPath: '/icons/currencies/currency-mop.svg',
    unicode: 'MOP$',
  },
  MNT: {
    code: 'MNT',
    iconPath: '/icons/currencies/currency-mnt.svg',
    unicode: '₮',
  },
  KPW: {
    code: 'KPW',
    iconPath: '/icons/currencies/currency-kpw.svg',
    unicode: '₩',
  },

  // Asia - Southeast - Additional
  MMK: {
    code: 'MMK',
    iconPath: '/icons/currencies/currency-mmk.svg',
    unicode: 'K',
  },
  KHR: {
    code: 'KHR',
    iconPath: '/icons/currencies/currency-khr.svg',
    unicode: '៛',
  },
  LAK: {
    code: 'LAK',
    iconPath: '/icons/currencies/currency-lak.svg',
    unicode: '₭',
  },
  BND: {
    code: 'BND',
    iconPath: '/icons/currencies/currency-bnd.svg',
    unicode: 'B$',
  },

  // Asia - South - Additional
  PKR: {
    code: 'PKR',
    iconPath: '/icons/currencies/currency-pkr.svg',
    unicode: '₨',
  },
  BDT: {
    code: 'BDT',
    iconPath: '/icons/currencies/currency-bdt.svg',
    unicode: '৳',
  },
  NPR: {
    code: 'NPR',
    iconPath: '/icons/currencies/currency-npr.svg',
    unicode: '₨',
  },
  BTN: {
    code: 'BTN',
    iconPath: '/icons/currencies/currency-btn.svg',
    unicode: 'Nu.',
  },
  MVR: {
    code: 'MVR',
    iconPath: '/icons/currencies/currency-mvr.svg',
    unicode: 'Rf',
  },
  AFN: {
    code: 'AFN',
    iconPath: '/icons/currencies/currency-afn.svg',
    unicode: '؋',
  },

  // Asia - Central
  KZT: {
    code: 'KZT',
    iconPath: '/icons/currencies/currency-kzt.svg',
    unicode: '₸',
  },
  UZS: {
    code: 'UZS',
    iconPath: '/icons/currencies/currency-uzs.svg',
    unicode: 'soʻm',
  },
  KGS: {
    code: 'KGS',
    iconPath: '/icons/currencies/currency-kgs.svg',
    unicode: 'сом',
  },
  TJS: {
    code: 'TJS',
    iconPath: '/icons/currencies/currency-tjs.svg',
    unicode: 'SM',
  },
  TMT: {
    code: 'TMT',
    iconPath: '/icons/currencies/currency-tmt.svg',
    unicode: 'm',
  },

  // Oceania - Additional
  FJD: {
    code: 'FJD',
    iconPath: '/icons/currencies/currency-fjd.svg',
    unicode: 'FJ$',
  },
  PGK: {
    code: 'PGK',
    iconPath: '/icons/currencies/currency-pgk.svg',
    unicode: 'K',
  },
  SBD: {
    code: 'SBD',
    iconPath: '/icons/currencies/currency-sbd.svg',
    unicode: 'SI$',
  },
  TOP: {
    code: 'TOP',
    iconPath: '/icons/currencies/currency-top.svg',
    unicode: 'T$',
  },
  VUV: {
    code: 'VUV',
    iconPath: '/icons/currencies/currency-vuv.svg',
    unicode: 'VT',
  },
  WST: {
    code: 'WST',
    iconPath: '/icons/currencies/currency-wst.svg',
    unicode: 'WS$',
  },
  XPF: {
    code: 'XPF',
    iconPath: '/icons/currencies/currency-xpf.svg',
    unicode: '₣',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get currency icon configuration
 */
export function getCurrencyIcon(currency: string): CurrencyIconConfig | null {
  return CURRENCY_ICONS[currency.toUpperCase()] || null;
}

/**
 * Get currency icon path
 */
export function getCurrencyIconPath(currency: string): string | null {
  const config = getCurrencyIcon(currency);
  return config?.iconPath || null;
}

/**
 * Get currency Unicode symbol (fallback)
 * Falls back to CURRENCY_SYMBOLS if not in CURRENCY_ICONS
 */
export function getCurrencyUnicode(currency: string): string {
  const config = getCurrencyIcon(currency);
  if (config?.unicode) {
    return config.unicode;
  }
  // Fallback to CURRENCY_SYMBOLS
  const symbol = getCurrencySymbol(currency);
  return symbol !== currency.toUpperCase() ? symbol : currency;
}

/**
 * Check if currency has an icon available
 * Returns true if currency is in CURRENCY_ICONS (has icon file)
 * Note: All currencies in CURRENCY_SYMBOLS will have fallback Unicode support
 */
export function hasCurrencyIcon(currency: string): boolean {
  return currency.toUpperCase() in CURRENCY_ICONS;
}

/**
 * Check if currency is supported (has symbol in CURRENCY_SYMBOLS)
 */
export function isCurrencySupported(currency: string): boolean {
  const symbol = getCurrencySymbol(currency);
  return symbol !== currency.toUpperCase();
}

/**
 * Get all currencies with icon support (icon files available)
 */
export function getCurrenciesWithIcons(): string[] {
  return Object.keys(CURRENCY_ICONS);
}

/**
 * Get all supported currencies (from CURRENCY_SYMBOLS)
 * This includes all currencies that can be displayed/formatted
 */
export function getAllSupportedCurrencies(): string[] {
  // This will be populated by reading CURRENCY_SYMBOLS
  // For now, return currencies from CURRENCY_ICONS
  // The icon generation script will handle adding all currencies
  return Object.keys(CURRENCY_ICONS);
}

