/**
 * Division Type Mapping
 *
 * Maps country codes to their administrative division type.
 * Used for display purposes ("Province" vs "State" vs "Region").
 */

import type { DivisionType } from './types';

const DIVISION_TYPE_BY_COUNTRY: Record<string, DivisionType> = {
  // Provinces
  'CA': 'province',  // Canada
  'CN': 'province',  // China
  'ZA': 'province',  // South Africa
  'NL': 'province',  // Netherlands
  'BE': 'province',  // Belgium
  'AR': 'province',  // Argentina
  'PK': 'province',  // Pakistan

  // States
  'AU': 'state',     // Australia
  'BR': 'state',     // Brazil
  'MX': 'state',     // Mexico
  'IN': 'state',     // India
  'DE': 'state',     // Germany (Länder)
  'NG': 'state',     // Nigeria
  'MY': 'state',     // Malaysia

  // Regions
  'FR': 'region',    // France
  'IT': 'region',    // Italy
  'ES': 'region',    // Spain (autonomous communities)
  'CL': 'region',    // Chile
  'PE': 'region',    // Peru
  'PH': 'region',    // Philippines

  // UK constituent countries
  'GB': 'country',   // United Kingdom

  // Prefectures
  'JP': 'prefecture', // Japan

  // Territories (handled as special cases within countries)
};

export function getDivisionTypeForCountry(countryCode: string): DivisionType {
  return DIVISION_TYPE_BY_COUNTRY[countryCode] || 'other';
}

export function getDivisionTypeLabel(type: DivisionType): string {
  const labels: Record<DivisionType, string> = {
    province: 'Province',
    state: 'State',
    region: 'Region',
    country: 'Country',
    prefecture: 'Prefecture',
    territory: 'Territory',
    district: 'District',
    other: 'Division',
  };
  return labels[type];
}
