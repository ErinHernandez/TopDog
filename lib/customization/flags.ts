export function getFlagUrl(code: string): string {
  // County format: "US-{stateCode}-{fipsCode}"
  if (/^US-[A-Z]{2}-\d{5}$/.test(code)) {
    return `/badges/county/${code}.svg`;
  }

  // US State format: "US-{stateCode}"
  if (code.match(/^US-[A-Z]{2}$/)) {
    return `/flags/states/${code.slice(3).toLowerCase()}.svg`;
  }

  // International Division format: "{countryCode}-{subdivisionCode}" (ISO 3166-2)
  // Must be checked AFTER US state (both are XX-YY format)
  if (code.match(/^[A-Z]{2}-[A-Z0-9]{1,3}$/) && !code.startsWith('US-')) {
    return `/badges/division/${code}.svg`;
  }

  // Country format: "{countryCode}"
  return `/flags/countries/${code.toLowerCase()}.svg`;
}

export function parseFlagCode(code: string): { type: 'country' | 'state' | 'county' | 'division'; code: string } {
  // County codes: US-{stateCode}-{fipsCode}
  if (/^US-[A-Z]{2}-\d{5}$/.test(code)) {
    return { type: 'county', code };
  }
  // US State codes: US-{stateCode}
  if (code.match(/^US-[A-Z]{2}$/)) {
    return { type: 'state', code: code.slice(3) };
  }
  // International Division codes: {countryCode}-{subdivisionCode} (ISO 3166-2)
  if (code.match(/^[A-Z]{2}-[A-Z0-9]{1,3}$/) && !code.startsWith('US-')) {
    return { type: 'division', code };
  }
  return { type: 'country', code };
}

export function getFlagDisplayName(code: string): string {
  // County codes: US-{stateCode}-{fipsCode}
  if (/^US-[A-Z]{2}-\d{5}$/.test(code)) {
    // Try to get county name from integrity service
    // For now, extract state and show code - can be enhanced later
    const parts = code.split('-');
    if (parts.length === 3) {
      const stateCode = parts[1];
      const fipsCode = parts[2];
      // Import county name lookup (async, but this is sync function)
      // For now, return a formatted version
      return `${stateCode} County ${fipsCode}`;
    }
    return code;
  }
  // US State codes: US-{stateCode}
  if (code.match(/^US-[A-Z]{2}$/)) {
    return US_STATE_NAMES[code.slice(3)] ?? code;
  }
  // International Division codes: {countryCode}-{subdivisionCode} (ISO 3166-2)
  if (code.match(/^[A-Z]{2}-[A-Z0-9]{1,3}$/) && !code.startsWith('US-')) {
    // Try to get division name
    try {
      // Dynamic import to avoid circular dependencies
      const { getDivisionName } = require('@/lib/integrity/divisionNames');
      return getDivisionName(code) || code;
    } catch {
      return code;
    }
  }
  return COUNTRY_NAMES[code] ?? code;
}

export const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington D.C.',
};

// Export COUNTRY_NAMES for use in FlagGrid
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', GB: 'United Kingdom',
  DE: 'Germany', FR: 'France', ES: 'Spain', IT: 'Italy', PT: 'Portugal',
  NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', AT: 'Austria',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', IE: 'Ireland',
  PL: 'Poland', CZ: 'Czech Republic', GR: 'Greece', TR: 'Turkey',
  RU: 'Russia', UA: 'Ukraine', JP: 'Japan', CN: 'China', KR: 'South Korea',
  IN: 'India', AU: 'Australia', NZ: 'New Zealand', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', ZA: 'South Africa', EG: 'Egypt',
  NG: 'Nigeria', KE: 'Kenya', IL: 'Israel', AE: 'United Arab Emirates',
  SA: 'Saudi Arabia', SG: 'Singapore', MY: 'Malaysia', TH: 'Thailand',
  VN: 'Vietnam', PH: 'Philippines', ID: 'Indonesia', PK: 'Pakistan',
};
