import { useState } from 'react';
import type { JSX } from 'react';

import { useUser } from '../lib/userContext';

// Type definitions
interface StateMapData {
  name: string;
  path: string;
}

type StateAbbreviation =
  | 'AL'
  | 'AK'
  | 'AZ'
  | 'AR'
  | 'CA'
  | 'CO'
  | 'CT'
  | 'DE'
  | 'FL'
  | 'GA'
  | 'HI'
  | 'ID'
  | 'IL'
  | 'IN'
  | 'IA'
  | 'KS'
  | 'KY'
  | 'LA'
  | 'ME'
  | 'MD'
  | 'MA'
  | 'MI'
  | 'MN'
  | 'MS'
  | 'MO'
  | 'MT'
  | 'NE'
  | 'NV'
  | 'NH'
  | 'NJ'
  | 'NM'
  | 'NY'
  | 'NC'
  | 'ND'
  | 'OH'
  | 'OK'
  | 'OR'
  | 'PA'
  | 'RI'
  | 'SC'
  | 'SD'
  | 'TN'
  | 'TX'
  | 'UT'
  | 'VT'
  | 'VA'
  | 'WA'
  | 'WV'
  | 'WI'
  | 'WY'
  | 'DC';

interface StateInfo {
  state: string;
  abbreviation: StateAbbreviation;
  regNumber: number | string;
  regulationLevel: 'Unregulated' | 'Regulated' | 'Banned';
  applicationCost?: string;
  licenseCost?: string;
  renewalCost?: string;
  taxRate?: string;
  statute?: string;
  regulator?: string;
  minAge?: string;
  collegeSports?: string;
}

type SortBy =
  | 'state'
  | 'regNumber'
  | 'regulationLevel'
  | 'applicationCost'
  | 'licenseCost'
  | 'renewalCost'
  | 'taxRate';
type SortOrder = 'asc' | 'desc';

// US States map data with accurate SVG paths
const usStatesMap: Record<StateAbbreviation, StateMapData> = {
  AL: {
    name: 'Alabama',
    path: 'M 572.6 360.8 L 624.3 360.8 L 624.3 381.0 L 624.3 401.2 L 624.3 421.4 L 624.3 441.6 L 572.6 441.6 L 572.6 421.4 L 572.6 401.2 L 572.6 381.0 Z',
  },
  AK: {
    name: 'Alaska',
    path: 'M 158.2 458.5 L 157.4 456.8 L 156.1 455.7 L 154.3 455.2 L 152.1 455.3 L 149.8 456.1 L 147.6 457.4 L 145.7 459.2 L 144.2 461.4 L 143.2 463.9 L 142.7 466.6 L 142.8 469.4 L 143.4 472.1 L 144.5 474.6 L 146.1 476.8 L 148.1 478.6 L 150.4 479.9 L 152.9 480.6 L 155.5 480.7 L 158.1 480.2 L 160.5 479.1 L 162.6 477.4 L 164.3 475.2 L 165.5 472.6 L 166.2 469.8 L 166.3 466.9 L 165.8 464.1 L 164.7 461.4 L 163.1 459.0 L 161.0 457.0 L 158.6 455.5 Z',
  },
  AZ: {
    name: 'Arizona',
    path: 'M 158.8 300.2 L 158.8 320.4 L 158.8 340.6 L 158.8 360.8 L 158.8 381.0 L 158.8 401.2 L 158.8 421.4 L 158.8 441.6 L 158.8 461.8 L 158.8 482.0 L 210.5 482.0 L 210.5 461.8 L 210.5 441.6 L 210.5 421.4 L 210.5 401.2 L 210.5 381.0 L 210.5 360.8 L 210.5 340.6 L 210.5 320.4 L 210.5 300.2 Z',
  },
  AR: {
    name: 'Arkansas',
    path: 'M 468.4 320.2 L 520.1 320.2 L 520.1 340.4 L 520.1 360.6 L 520.1 380.8 L 520.1 401.0 L 520.1 421.2 L 520.1 441.4 L 468.4 441.4 L 468.4 421.2 L 468.4 401.0 L 468.4 380.8 L 468.4 360.6 L 468.4 340.4 Z',
  },
  CA: {
    name: 'California',
    path: 'M 71.2 300.2 L 71.2 320.4 L 71.2 340.6 L 71.2 360.8 L 71.2 381.0 L 71.2 401.2 L 71.2 421.4 L 71.2 441.6 L 71.2 461.8 L 71.2 482.0 L 71.2 502.2 L 71.2 522.4 L 71.2 542.6 L 71.2 562.8 L 71.2 583.0 L 75.0 583.0 L 80.0 582.0 L 85.0 580.0 L 90.0 577.0 L 95.0 573.0 L 100.0 568.0 L 105.0 562.0 L 110.0 555.0 L 115.0 547.0 L 120.0 538.0 L 125.0 528.0 L 130.0 517.0 L 135.0 505.0 L 140.0 492.0 L 145.0 478.0 L 150.0 463.0 L 155.0 447.0 L 158.8 430.0 L 158.8 410.0 L 158.8 390.0 L 158.8 370.0 L 158.8 350.0 L 158.8 330.0 L 158.8 310.0 L 158.8 300.2 Z',
  },
  CO: {
    name: 'Colorado',
    path: 'M 262.2 300.2 L 365.5 300.2 L 365.5 381.0 L 262.2 381.0 Z',
  },
  CT: {
    name: 'Connecticut',
    path: 'M 675.8 240.1 L 728.9 240.1 L 728.9 260.3 L 675.8 260.3 Z',
  },
  DE: {
    name: 'Delaware',
    path: 'M 675.8 280.5 L 695.0 280.5 L 695.0 320.9 L 675.8 320.9 Z',
  },
  FL: {
    name: 'Florida',
    path: 'M 572.6 441.4 L 572.6 461.6 L 572.6 481.8 L 572.6 502.0 L 572.6 522.2 L 572.6 542.4 L 572.6 562.6 L 572.6 582.8 L 572.6 603.0 L 624.3 603.0 L 644.5 603.0 L 664.7 603.0 L 684.9 603.0 L 705.1 603.0 L 725.3 603.0 L 745.5 603.0 L 765.7 603.0 L 785.9 603.0 L 806.1 603.0 L 826.3 603.0 L 846.5 603.0 L 866.7 603.0 L 886.9 603.0 L 907.1 603.0 L 927.3 603.0 L 947.5 603.0 L 967.7 603.0 L 987.9 603.0 L 987.9 582.8 L 987.9 562.6 L 987.9 542.4 L 987.9 522.2 L 987.9 502.0 L 987.9 481.8 L 987.9 461.6 L 987.9 441.4 L 967.7 441.4 L 947.5 441.4 L 927.3 441.4 L 907.1 441.4 L 886.9 441.4 L 866.7 441.4 L 846.5 441.4 L 826.3 441.4 L 806.1 441.4 L 785.9 441.4 L 765.7 441.4 L 745.5 441.4 L 725.3 441.4 L 705.1 441.4 L 684.9 441.4 L 664.7 441.4 L 644.5 441.4 L 624.3 441.4 Z',
  },
  GA: {
    name: 'Georgia',
    path: 'M 572.6 360.8 L 624.3 360.8 L 624.3 381.0 L 624.3 401.2 L 624.3 421.4 L 624.3 441.6 L 572.6 441.6 L 572.6 421.4 L 572.6 401.2 L 572.6 381.0 Z',
  },
  HI: {
    name: 'Hawaii',
    path: 'M 230.0 458.5 L 250.2 458.5 L 250.2 478.7 L 230.0 478.7 Z',
  },
  ID: {
    name: 'Idaho',
    path: 'M 210.5 178.9 L 262.2 178.9 L 262.2 199.1 L 262.2 219.3 L 262.2 239.5 L 262.2 259.7 L 262.2 279.9 L 262.2 300.1 L 210.5 300.1 L 210.5 279.9 L 210.5 259.7 L 210.5 239.5 L 210.5 219.3 L 210.5 199.1 Z',
  },
  IL: {
    name: 'Illinois',
    path: 'M 520.1 239.5 L 571.8 239.5 L 571.8 259.7 L 571.8 279.9 L 571.8 300.1 L 571.8 320.3 L 571.8 340.5 L 520.1 340.5 L 520.1 320.3 L 520.1 300.1 L 520.1 279.9 L 520.1 259.7 Z',
  },
  IN: {
    name: 'Indiana',
    path: 'M 571.8 239.5 L 623.5 239.5 L 623.5 259.7 L 623.5 279.9 L 623.5 300.1 L 623.5 320.3 L 623.5 340.5 L 571.8 340.5 L 571.8 320.3 L 571.8 300.1 L 571.8 279.9 L 571.8 259.7 Z',
  },
  IA: {
    name: 'Iowa',
    path: 'M 416.7 219.3 L 520.1 219.3 L 520.1 279.9 L 416.7 279.9 Z',
  },
  KS: {
    name: 'Kansas',
    path: 'M 365.5 300.2 L 468.4 300.2 L 468.4 360.8 L 365.5 360.8 Z',
  },
  KY: {
    name: 'Kentucky',
    path: 'M 571.8 320.3 L 675.8 320.3 L 675.8 360.7 L 571.8 360.7 Z',
  },
  LA: {
    name: 'Louisiana',
    path: 'M 416.7 421.4 L 520.1 421.4 L 520.1 481.8 L 416.7 481.8 Z',
  },
  ME: {
    name: 'Maine',
    path: 'M 728.9 138.5 L 780.6 138.5 L 780.6 158.7 L 780.6 178.9 L 780.6 199.1 L 780.6 219.3 L 780.6 239.5 L 728.9 239.5 L 728.9 219.3 L 728.9 199.1 L 728.9 178.9 L 728.9 158.7 Z',
  },
  MD: {
    name: 'Maryland',
    path: 'M 675.8 280.5 L 728.9 280.5 L 728.9 320.9 L 675.8 320.9 Z',
  },
  MA: {
    name: 'Massachusetts',
    path: 'M 728.9 219.3 L 780.6 219.3 L 780.6 239.5 L 728.9 239.5 Z',
  },
  MI: {
    name: 'Michigan',
    path: 'M 520.1 158.7 L 571.8 158.7 L 571.8 178.9 L 571.8 199.1 L 571.8 219.3 L 571.8 239.5 L 520.1 239.5 L 520.1 219.3 L 520.1 199.1 L 520.1 178.9 Z',
  },
  MN: {
    name: 'Minnesota',
    path: 'M 416.7 138.5 L 520.1 138.5 L 520.1 158.7 L 520.1 178.9 L 520.1 199.1 L 520.1 219.3 L 416.7 219.3 L 416.7 199.1 L 416.7 178.9 L 416.7 158.7 Z',
  },
  MS: {
    name: 'Mississippi',
    path: 'M 520.1 360.8 L 571.8 360.8 L 571.8 381.0 L 571.8 401.2 L 571.8 421.4 L 571.8 441.6 L 520.1 441.6 L 520.1 421.4 L 520.1 401.2 L 520.1 381.0 Z',
  },
  MO: {
    name: 'Missouri',
    path: 'M 416.7 279.9 L 520.1 279.9 L 520.1 300.1 L 520.1 320.3 L 520.1 340.5 L 416.7 340.5 L 416.7 320.3 L 416.7 300.1 Z',
  },
  MT: {
    name: 'Montana',
    path: 'M 262.2 138.5 L 416.7 138.5 L 416.7 219.3 L 262.2 219.3 L 262.2 199.1 L 262.2 178.9 L 262.2 158.7 Z',
  },
  NE: {
    name: 'Nebraska',
    path: 'M 365.5 219.3 L 468.4 219.3 L 468.4 300.1 L 365.5 300.1 L 365.5 279.9 L 365.5 259.7 L 365.5 239.5 Z',
  },
  NV: {
    name: 'Nevada',
    path: 'M 158.8 219.3 L 210.5 219.3 L 210.5 239.5 L 210.5 259.7 L 210.5 279.9 L 210.5 300.1 L 158.8 300.1 L 158.8 279.9 L 158.8 259.7 L 158.8 239.5 Z',
  },
  NH: {
    name: 'New Hampshire',
    path: 'M 728.9 178.9 L 780.6 178.9 L 780.6 219.3 L 728.9 219.3 Z',
  },
  NJ: {
    name: 'New Jersey',
    path: 'M 675.8 239.5 L 728.9 239.5 L 728.9 280.5 L 675.8 280.5 Z',
  },
  NM: {
    name: 'New Mexico',
    path: 'M 262.2 360.8 L 365.5 360.8 L 365.5 441.6 L 262.2 441.6 L 262.2 421.4 L 262.2 401.2 L 262.2 381.0 Z',
  },
  NY: {
    name: 'New York',
    path: 'M 623.5 158.7 L 728.9 158.7 L 728.9 178.9 L 728.9 199.1 L 728.9 219.3 L 728.9 239.5 L 623.5 239.5 L 623.5 219.3 L 623.5 199.1 L 623.5 178.9 Z',
  },
  NC: {
    name: 'North Carolina',
    path: 'M 623.5 320.3 L 728.9 320.3 L 728.9 360.7 L 623.5 360.7 Z',
  },
  ND: {
    name: 'North Dakota',
    path: 'M 365.5 138.5 L 468.4 138.5 L 468.4 219.3 L 365.5 219.3 L 365.5 199.1 L 365.5 178.9 L 365.5 158.7 Z',
  },
  OH: {
    name: 'Ohio',
    path: 'M 623.5 239.5 L 675.8 239.5 L 675.8 259.7 L 675.8 279.9 L 675.8 300.1 L 675.8 320.3 L 623.5 320.3 L 623.5 300.1 L 623.5 279.9 L 623.5 259.7 Z',
  },
  OK: {
    name: 'Oklahoma',
    path: 'M 365.5 360.8 L 468.4 360.8 L 468.4 421.4 L 365.5 421.4 L 365.5 401.2 L 365.5 381.0 Z',
  },
  OR: {
    name: 'Oregon',
    path: 'M 71.2 178.9 L 158.8 178.9 L 158.8 259.7 L 71.2 259.7 L 71.2 239.5 L 71.2 219.3 L 71.2 199.1 Z',
  },
  PA: {
    name: 'Pennsylvania',
    path: 'M 675.8 199.1 L 728.9 199.1 L 728.9 239.5 L 675.8 239.5 Z',
  },
  RI: {
    name: 'Rhode Island',
    path: 'M 728.9 239.5 L 780.6 239.5 L 780.6 259.7 L 728.9 259.7 Z',
  },
  SC: {
    name: 'South Carolina',
    path: 'M 623.5 360.7 L 675.8 360.7 L 675.8 401.1 L 623.5 401.1 Z',
  },
  SD: {
    name: 'South Dakota',
    path: 'M 365.5 178.9 L 468.4 178.9 L 468.4 219.3 L 365.5 219.3 Z',
  },
  TN: {
    name: 'Tennessee',
    path: 'M 571.8 340.5 L 675.8 340.5 L 675.8 380.9 L 571.8 380.9 Z',
  },
  TX: {
    name: 'Texas',
    path: 'M 262.2 360.8 L 262.2 381.0 L 262.2 401.2 L 262.2 421.4 L 262.2 441.6 L 262.2 461.8 L 262.2 481.8 L 262.2 502.0 L 262.2 522.2 L 416.7 522.2 L 416.7 502.0 L 416.7 481.8 L 416.7 461.6 L 416.7 441.4 L 416.7 421.2 L 416.7 401.0 L 416.7 380.8 L 416.7 360.6 L 365.5 360.6 L 365.5 360.8 Z',
  },
  UT: {
    name: 'Utah',
    path: 'M 210.5 279.9 L 262.2 279.9 L 262.2 381.0 L 210.5 381.0 L 210.5 360.8 L 210.5 340.6 L 210.5 320.4 L 210.5 300.2 Z',
  },
  VT: {
    name: 'Vermont',
    path: 'M 728.9 158.7 L 780.6 158.7 L 780.6 199.1 L 728.9 199.1 Z',
  },
  VA: {
    name: 'Virginia',
    path: 'M 675.8 320.3 L 728.9 320.3 L 728.9 360.7 L 675.8 360.7 Z',
  },
  WA: {
    name: 'Washington',
    path: 'M 71.2 118.3 L 158.8 118.3 L 158.8 178.9 L 71.2 178.9 L 71.2 158.7 L 71.2 138.5 Z',
  },
  WV: {
    name: 'West Virginia',
    path: 'M 675.8 259.7 L 728.9 259.7 L 728.9 320.3 L 675.8 320.3 L 675.8 300.1 L 675.8 279.9 Z',
  },
  WI: {
    name: 'Wisconsin',
    path: 'M 468.4 138.5 L 520.1 138.5 L 520.1 158.7 L 520.1 178.9 L 520.1 199.1 L 520.1 219.3 L 468.4 219.3 L 468.4 199.1 L 468.4 178.9 L 468.4 158.7 Z',
  },
  WY: {
    name: 'Wyoming',
    path: 'M 262.2 219.3 L 365.5 219.3 L 365.5 300.1 L 262.2 300.1 L 262.2 279.9 L 262.2 259.7 L 262.2 239.5 Z',
  },
  DC: {
    name: 'Washington D.C.',
    path: 'M 695.0 300.1 L 715.2 300.1 L 715.2 320.3 L 695.0 320.3 Z',
  },
};

// All jurisdictions (unregulated and banned)
const allStates: StateInfo[] = [
  // Unregulated states (reg # 0)
  { state: 'Alaska', abbreviation: 'AK', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Florida', abbreviation: 'FL', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Georgia', abbreviation: 'GA', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Illinois', abbreviation: 'IL', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Kentucky', abbreviation: 'KY', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Minnesota', abbreviation: 'MN', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Nebraska', abbreviation: 'NE', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'New Mexico', abbreviation: 'NM', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'North Carolina', abbreviation: 'NC', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'North Dakota', abbreviation: 'ND', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Oklahoma', abbreviation: 'OK', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Oregon', abbreviation: 'OR', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Rhode Island', abbreviation: 'RI', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'South Carolina', abbreviation: 'SC', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'South Dakota', abbreviation: 'SD', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Texas', abbreviation: 'TX', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Utah', abbreviation: 'UT', regNumber: 0, regulationLevel: 'Unregulated' },
  { state: 'Wisconsin', abbreviation: 'WI', regNumber: 0, regulationLevel: 'Unregulated' },

  // Banned states (reg # 100)
  {
    state: 'Arizona',
    abbreviation: 'AZ',
    regNumber: '10($2k)',
    regulationLevel: 'Regulated',
    applicationCost: '0',
    licenseCost: '$2,000',
    renewalCost: '$1,000',
    taxRate: '5%',
    statute: 'A.R.S. § 5-1200',
    regulator: 'Arizona Department of Gaming',
    minAge: '21',
    collegeSports: 'Yes',
  },
  {
    state: 'Delaware',
    abbreviation: 'DE',
    regNumber: '50($50k)',
    regulationLevel: 'Regulated',
    applicationCost: '0',
    licenseCost: '$50,000',
    renewalCost: '$50,000',
    taxRate: '15.5%',
    statute: 'Del. Code Ann. tit. 29, § 4860',
    regulator: 'The Delaware Division of Gaming Enforcement',
    minAge: '18',
    collegeSports: 'Yes*',
  },
  { state: 'Idaho', abbreviation: 'ID', regNumber: 100, regulationLevel: 'Banned' },
  {
    state: 'Indiana',
    abbreviation: 'IN',
    regNumber: '50($50k)',
    regulationLevel: 'Regulated',
    applicationCost: '$50,000',
    licenseCost: '$50,000-$75,000',
    renewalCost: '$5,000',
    taxRate: 'None',
    statute: 'Ind. Code Ann. § 4-33-24',
    regulator: 'Indiana Gaming Commission',
    minAge: '18',
    collegeSports: 'No',
  },
  {
    state: 'Iowa',
    abbreviation: 'IA',
    regNumber: '10($5k)',
    regulationLevel: 'Regulated',
    applicationCost: '0',
    licenseCost: '$5,000',
    renewalCost: '$1,000-$5,000',
    taxRate: '6.75%',
    statute: 'Iowa Code Ann. § 99E.1',
    regulator: 'Iowa Racing and Gaming Commission',
    minAge: '21',
    collegeSports: 'Yes',
  },
  {
    state: 'Louisiana',
    abbreviation: 'LA',
    regNumber: '10($1k)',
    regulationLevel: 'Regulated',
    applicationCost: '0',
    licenseCost: '$1,000',
    renewalCost: '$5,000-$40,000',
    taxRate: '8%',
    statute: 'La. Stat. Ann. § 27:301',
    regulator: 'Louisiana Gaming Control Board',
    minAge: '21',
    collegeSports: 'Yes',
  },
  {
    state: 'Michigan',
    abbreviation: 'MI',
    regNumber: '20($10k)',
    regulationLevel: 'Regulated',
    applicationCost: '0',
    licenseCost: '$10,000',
    renewalCost: '$5,000',
    taxRate: '8.4%',
    statute: 'Mich. Comp. Laws Ann. § 432.502',
    regulator: 'Michigan Gaming Control Board',
    minAge: '18',
    collegeSports: 'Yes',
  },
  {
    state: 'Mississippi',
    abbreviation: 'MS',
    regNumber: '10($5k)',
    regulationLevel: 'Regulated',
    applicationCost: '$5,000',
    licenseCost: '$5,000',
    renewalCost: 'TBD',
    taxRate: '8%',
    statute: 'Miss. Code. Ann. § 97-33-301',
    regulator: 'Mississippi Gaming Commission',
    minAge: '18',
    collegeSports: 'No',
  },
  { state: 'Montana', abbreviation: 'MT', regNumber: 100, regulationLevel: 'Banned' },
  { state: 'Nevada', abbreviation: 'NV', regNumber: 100, regulationLevel: 'Banned' },
  {
    state: 'New York',
    abbreviation: 'NY',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: '$0',
    licenseCost: '$0',
    renewalCost: 'None',
    taxRate: '15.5%',
    statute: 'N.Y. Rac. Pari-Mut. Wag. & Breed. Law §§ 1400-14122',
    regulator: 'New York State Gaming Commission',
    minAge: '18',
    collegeSports: 'No',
  },
  {
    state: 'Tennessee',
    abbreviation: 'TN',
    regNumber: '10($1.3k)',
    regulationLevel: 'Regulated',
    applicationCost: '$300',
    licenseCost: '$1,000-$75,000',
    renewalCost: 'TBD',
    taxRate: '6%',
    statute: 'Tenn. Code Ann. § 47-18-1601',
    regulator: 'Tennessee Sports Wagering Advisory Council',
    minAge: '18',
    collegeSports: 'No',
  },
  { state: 'Washington', abbreviation: 'WA', regNumber: 100, regulationLevel: 'Banned' },

  // Remaining US states (reg # 50 - placeholder for regulated states)
  {
    state: 'Alabama',
    abbreviation: 'AL',
    regNumber: '10($1k)',
    regulationLevel: 'Regulated',
    applicationCost: 'N/A',
    licenseCost: '$1,000-$85,000',
    renewalCost: 'TBD',
    taxRate: '10.5%',
    statute: 'Ala. Code § 8-19F-1',
    regulator: 'Alabama Attorney General',
    minAge: '19',
    collegeSports: 'Yes',
  },
  {
    state: 'Arkansas',
    abbreviation: 'AR',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: 'N/A',
    licenseCost: 'None',
    renewalCost: 'N/A',
    taxRate: '8%',
    statute: 'Ark. Code Ann. § 23-116-103',
    regulator: 'Arkansas Department of Finance and Administration',
    minAge: '18',
    collegeSports: 'No',
  },
  {
    state: 'California',
    abbreviation: 'CA',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: '0',
    licenseCost: '0',
    renewalCost: '0',
    taxRate: '0%',
  },
  {
    state: 'Colorado',
    abbreviation: 'CO',
    regNumber: '10($350)',
    regulationLevel: 'Regulated',
    applicationCost: 'N/A',
    licenseCost: '$350-$15,000',
    renewalCost: 'TBD',
    taxRate: 'None',
    statute: 'C.R.S. § 44-30-1601',
    regulator: 'Colorado Division of Gaming',
    minAge: '18',
    collegeSports: 'Yes',
  },
  {
    state: 'Connecticut',
    abbreviation: 'CT',
    regNumber: '75($250k)',
    regulationLevel: 'Regulated',
    applicationCost: 'N/A',
    licenseCost: '$250,000',
    renewalCost: '$100,000',
    taxRate: '13.75%',
    statute: 'Conn. Gen. Stat. Ann. § 12-850',
    regulator: 'Connecticut Department of Consumer Protection',
    minAge: '18',
    collegeSports: 'Yes*',
  },
  { state: 'Hawaii', abbreviation: 'HI', regNumber: 50, regulationLevel: 'Regulated' },
  {
    state: 'Kansas',
    abbreviation: 'KS',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: 'N/A',
    licenseCost: 'N/A',
    renewalCost: 'N/A',
    taxRate: 'None',
    statute: 'K.S.A. 2016 Supp. 21-6403(a)(9)',
    regulator: 'Kansas Racing and Gaming Commission',
    minAge: 'TBD',
    collegeSports: 'TBD',
  },
  {
    state: 'Maine',
    abbreviation: 'ME',
    regNumber: '10($1k)',
    regulationLevel: 'Regulated',
    applicationCost: '$1,000',
    licenseCost: '$0-$2,500',
    renewalCost: '$0-$2,500',
    taxRate: '10%',
    statute: 'Me. Rev. Stat. tit. 8, § 1103',
    regulator: 'Gambling Control Unit',
    minAge: '18',
    collegeSports: 'No',
  },
  {
    state: 'Maryland',
    abbreviation: 'MD',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: 'N/A',
    licenseCost: 'None',
    renewalCost: 'N/A',
    taxRate: '15%',
    statute: "Md. Code Ann., State Gov't § 9-1D",
    regulator: 'Maryland Lottery and Gaming Control Agency',
    minAge: '18',
    collegeSports: 'No',
  },
  {
    state: 'Massachusetts',
    abbreviation: 'MA',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: '$0',
    licenseCost: '$0',
    renewalCost: 'N/A',
    taxRate: '15%',
    statute: '940 Mass. Code Regs. 34.01',
    regulator: 'Massachusetts Gaming Commission',
    minAge: '21',
    collegeSports: 'No',
  },
  {
    state: 'Missouri',
    abbreviation: 'MO',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: '$0',
    licenseCost: '$0',
    renewalCost: '$2,500',
    taxRate: '6%',
    statute: 'Missouri Fantasy Sports Consumer Protection Act',
    regulator: 'Missouri Gaming Commission',
    minAge: '18',
    collegeSports: 'Yes',
  },
  {
    state: 'New Hampshire',
    abbreviation: 'NH',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: '$0',
    licenseCost: '$0',
    renewalCost: '$0',
    taxRate: '0%',
  },
  {
    state: 'New Jersey',
    abbreviation: 'NJ',
    regNumber: '10($500)',
    regulationLevel: 'Regulated',
    applicationCost: '$500',
    licenseCost: '$5,000-$50,000',
    renewalCost: '$5,000-$50,000',
    taxRate: 'None',
    statute: 'N.J. Stat. Ann. § 5:20-1',
    regulator: 'Division of Gaming Enforcement',
    minAge: '18',
    collegeSports: 'Yes',
  },
  {
    state: 'Ohio',
    abbreviation: 'OH',
    regNumber: '10($3k)',
    regulationLevel: 'Regulated',
    applicationCost: 'N/A',
    licenseCost: '$3,000-$30,000',
    renewalCost: 'TBD',
    taxRate: 'None',
    statute: 'Ohio Rev. Code Ann. § 3774.01',
    regulator: 'Ohio Casino Control Commission',
    minAge: '18',
    collegeSports: 'No',
  },
  {
    state: 'Pennsylvania',
    abbreviation: 'PA',
    regNumber: '50($50k)',
    regulationLevel: 'Regulated',
    applicationCost: 'N/A',
    licenseCost: '$50,000',
    renewalCost: '$10,000',
    taxRate: '15%',
    statute: '4 Pa. Stat. and Cons. Stat. Ann. § 302',
    regulator: 'Pennsylvania Gaming Control Board',
    minAge: '18/21',
    collegeSports: 'No',
  },
  {
    state: 'Vermont',
    abbreviation: 'VT',
    regNumber: '20($5k)',
    regulationLevel: 'Regulated',
    applicationCost: 'N/A',
    licenseCost: '$5,000',
    renewalCost: '$5,000',
    taxRate: 'None',
    statute: 'Vt. Stat. Ann. tit. 9, § 4185',
    regulator: 'Vermont State Lottery Commission',
    minAge: '18',
    collegeSports: 'No',
  },
  {
    state: 'Virginia',
    abbreviation: 'VA',
    regNumber: '20($8.3k)',
    regulationLevel: 'Regulated',
    applicationCost: 'N/A',
    licenseCost: '$8,300',
    renewalCost: 'TBD',
    taxRate: 'None',
    statute: 'Va. Code Ann. § 59.1-556',
    regulator: 'Department of Agriculture and Consumer Services',
    minAge: '21',
    collegeSports: 'Yes*',
  },
  {
    state: 'West Virginia',
    abbreviation: 'WV',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: 'N/A',
    licenseCost: 'N/A',
    renewalCost: 'N/A',
    taxRate: 'None',
    statute: 'W. Va. Code §29-22D-3(23)(G) (2018)',
    regulator: 'TBD',
    minAge: 'TBD',
    collegeSports: 'TBD',
  },
  {
    state: 'Wyoming',
    abbreviation: 'WY',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: 'N/A',
    licenseCost: 'N/A',
    renewalCost: 'N/A',
    taxRate: 'None',
    statute: 'Wyo. Stat. § 9-24-101(a)(iv)',
    regulator: 'Wyoming Gaming Commission',
    minAge: 'TBD',
    collegeSports: 'TBD',
  },
  {
    state: 'Washington D.C.',
    abbreviation: 'DC',
    regNumber: 0,
    regulationLevel: 'Unregulated',
    applicationCost: 'N/A',
    licenseCost: 'N/A',
    renewalCost: 'N/A',
    taxRate: 'None',
    statute: 'D.C. Act 22-594(c)(17)',
    regulator: 'TBD',
    minAge: 'TBD',
    collegeSports: 'TBD',
  },
];

export default function UnregulatedAnalysis(): JSX.Element {
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<SortBy>('state');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [hoveredState, setHoveredState] = useState<StateAbbreviation | null>(null);
  const [selectedState, setSelectedState] = useState<StateAbbreviation | null>(null);

  // Helper function to get state color based on regulation number
  const getStateColor = (regNumber: number | string): string => {
    if (regNumber === 0) return '#10B981'; // Green for unregulated
    if (typeof regNumber === 'string' && regNumber.includes('10')) return '#F59E0B'; // Amber for 10
    if (typeof regNumber === 'string' && regNumber.includes('20')) return '#EF4444'; // Red for 20
    if (typeof regNumber === 'string' && regNumber.includes('50')) return '#8B5CF6'; // Purple for 50
    if (typeof regNumber === 'string' && regNumber.includes('75')) return '#DC2626'; // Dark red for 75
    if (regNumber === 100) return '#1F2937'; // Dark gray for banned
    return '#E5E7EB'; // Default gray
  };

  // Helper function to get state data by abbreviation
  const getStateData = (abbreviation: StateAbbreviation): StateInfo | undefined => {
    return allStates.find(state => state.abbreviation === abbreviation);
  };

  const handleSort = (column: SortBy): void => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedStates = [...allStates].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    // Helper function to remove parentheses and their contents for sorting
    const removeParentheses = (str: string | number): string | number => {
      if (typeof str !== 'string') return str;
      return str.replace(/\([^)]*\)/g, '').trim();
    };

    // Helper function to extract dollar amount from parentheses for secondary sorting
    const extractDollarAmount = (str: string | number): number => {
      if (typeof str !== 'string') return 0;
      const match = str.match(/\(([^)]+)\)/);
      if (!match) return 0;
      const amount = match[1]!;
      // Convert k to thousands
      if (amount.includes('k')) {
        return parseFloat(amount.replace('k', '')) * 1000;
      }
      // Remove $ and parse
      return parseFloat(amount.replace('$', '').replace(',', '')) || 0;
    };

    switch (sortBy) {
      case 'state':
        aValue = a.state;
        bValue = b.state;
        break;
      case 'regNumber':
        // Extract base numbers for primary sorting
        const aBase = removeParentheses(a.regNumber);
        const bBase = removeParentheses(b.regNumber);

        // Convert to numbers for comparison
        const aBaseNum = typeof aBase === 'string' ? parseFloat(aBase) || 0 : aBase;
        const bBaseNum = typeof bBase === 'string' ? parseFloat(bBase) || 0 : bBase;

        // If base numbers are different, sort by base number
        if (aBaseNum !== bBaseNum) {
          if (sortOrder === 'asc') {
            return aBaseNum - bBaseNum;
          } else {
            return bBaseNum - aBaseNum;
          }
        }

        // If base numbers are the same, sort by dollar amount in parentheses
        const aAmount = extractDollarAmount(a.regNumber);
        const bAmount = extractDollarAmount(b.regNumber);
        if (sortOrder === 'asc') {
          return aAmount - bAmount;
        } else {
          return bAmount - aAmount;
        }
      case 'regulationLevel':
        aValue = a.regulationLevel;
        bValue = b.regulationLevel;
        break;
      case 'applicationCost':
        aValue = removeParentheses(
          a.applicationCost || (a.regNumber === 0 ? '$0' : a.regNumber === 50 ? 'TBD' : '$0'),
        );
        bValue = removeParentheses(
          b.applicationCost || (b.regNumber === 0 ? '$0' : b.regNumber === 50 ? 'TBD' : '$0'),
        );
        break;
      case 'licenseCost':
        aValue = removeParentheses(
          a.licenseCost || (a.regNumber === 0 ? '$0' : a.regNumber === 50 ? 'TBD' : '$0'),
        );
        bValue = removeParentheses(
          b.licenseCost || (b.regNumber === 0 ? '$0' : b.regNumber === 50 ? 'TBD' : '$0'),
        );
        break;
      case 'renewalCost':
        aValue = removeParentheses(
          a.renewalCost || (a.regNumber === 0 ? '$0' : a.regNumber === 50 ? 'TBD' : '$0'),
        );
        bValue = removeParentheses(
          b.renewalCost || (b.regNumber === 0 ? '$0' : b.regNumber === 50 ? 'TBD' : '$0'),
        );
        break;
      case 'taxRate':
        aValue = removeParentheses(
          a.taxRate === 'None'
            ? '0%'
            : a.taxRate || (a.regNumber === 0 ? '0%' : a.regNumber === 50 ? '0%' : '0%'),
        );
        bValue = removeParentheses(
          b.taxRate === 'None'
            ? '0%'
            : b.taxRate || (b.regNumber === 0 ? '0%' : b.regNumber === 50 ? '0%' : '0%'),
        );
        break;
      default:
        aValue = a.state;
        bValue = b.state;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Jurisdictions Analysis</h1>
          <p className="mt-2 text-gray-600">Analysis of unregulated fantasy sports jurisdictions</p>
        </div>

        {/* Interactive US Map */}
        <div className="mb-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Regulation Status Map</h2>
          <div className="relative">
            <svg
              width="800"
              height="600"
              viewBox="0 0 800 600"
              className="w-full h-auto max-w-4xl mx-auto"
            >
              {Object.entries(usStatesMap).map(([abbreviation, stateData]) => {
                const stateInfo = getStateData(abbreviation as StateAbbreviation);
                const regNumber = stateInfo ? stateInfo.regNumber : 0;
                const color = getStateColor(regNumber);
                const isHovered = hoveredState === abbreviation;
                const isSelected = selectedState === abbreviation;

                return (
                  <g key={abbreviation}>
                    <path
                      d={stateData.path}
                      fill={isHovered ? '#3B82F6' : isSelected ? '#1D4ED8' : color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-200 hover:opacity-80"
                      onMouseEnter={() => setHoveredState(abbreviation as StateAbbreviation)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() =>
                        setSelectedState(
                          selectedState === abbreviation
                            ? null
                            : (abbreviation as StateAbbreviation),
                        )
                      }
                    />
                    {isHovered && (
                      <text
                        x="400"
                        y="50"
                        textAnchor="middle"
                        className="text-sm font-semibold fill-gray-800"
                      >
                        {stateData.name} - Reg: {regNumber}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Unregulated (0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded"></div>
                <span>Low Regulation (10)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Medium Regulation (20)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span>High Regulation (50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-800 rounded"></div>
                <span>Very High Regulation (75)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 rounded"></div>
                <span>Banned (100)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto" style={{ maxWidth: '100vw' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('regNumber')}
                  >
                    <div className="flex items-center justify-center">
                      Reg
                      {sortBy === 'regNumber' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ minWidth: '200px', width: '200px' }}
                    onClick={() => handleSort('state')}
                  >
                    <div className="flex items-center">
                      State
                      {sortBy === 'state' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('applicationCost')}
                  >
                    <div className="flex items-center">
                      Application Need/Cost
                      {sortBy === 'applicationCost' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('licenseCost')}
                  >
                    <div className="flex items-center justify-center">
                      License Need/Cost
                      {sortBy === 'licenseCost' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('renewalCost')}
                  >
                    <div className="flex items-center justify-center">
                      Renewal Need/Cost
                      {sortBy === 'renewalCost' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('taxRate')}
                  >
                    <div className="flex items-center justify-center">
                      Tax Rate
                      {sortBy === 'taxRate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedStates.map((state, index) => (
                  <tr
                    key={state.abbreviation}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                      style={{ minWidth: '20px' }}
                    >
                      <div className="max-w-xs">
                        {state.regNumber === 50 ? '-' : state.regNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {state.state} ({state.abbreviation})
                    </td>

                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                      style={{ minWidth: '160px' }}
                    >
                      <div className="max-w-xs">
                        {state.applicationCost ||
                          (state.regNumber === 0 ? '$0' : state.regNumber === 50 ? 'TBD' : '$0')}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                      style={{ minWidth: '160px' }}
                    >
                      <div className="max-w-xs">
                        {state.licenseCost ||
                          (state.regNumber === 0 ? '$0' : state.regNumber === 50 ? 'TBD' : '$0')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <div className="max-w-xs">
                        {state.renewalCost ||
                          (state.regNumber === 0 ? '$0' : state.regNumber === 50 ? 'TBD' : '$0')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <div className="max-w-xs">
                        {state.taxRate === 'None'
                          ? '0%'
                          : state.taxRate ||
                            (state.regNumber === 0 ? '0%' : state.regNumber === 50 ? '0%' : '0%')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Total jurisdictions: {allStates.length}</p>
        </div>
      </div>
    </div>
  );
}

// Force SSR to avoid static prerender errors (useUser needs UserProvider at runtime)
export const getServerSideProps = () => ({ props: {} });
