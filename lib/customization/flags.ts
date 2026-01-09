export function getFlagUrl(code: string): string {
  if (code.startsWith('US-')) {
    return `/flags/states/${code.slice(3).toLowerCase()}.svg`;
  }
  return `/flags/countries/${code.toLowerCase()}.svg`;
}

export function parseFlagCode(code: string): { type: 'country' | 'state'; code: string } {
  if (code.startsWith('US-')) {
    return { type: 'state', code: code.slice(3) };
  }
  return { type: 'country', code };
}

export function getFlagDisplayName(code: string): string {
  if (code.startsWith('US-')) {
    return US_STATE_NAMES[code.slice(3)] ?? code;
  }
  return COUNTRY_NAMES[code] ?? code;
}

const US_STATE_NAMES: Record<string, string> = {
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

const COUNTRY_NAMES: Record<string, string> = {
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
