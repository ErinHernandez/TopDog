import { Timestamp } from 'firebase/firestore';

export interface UserLocations {
  userId: string;
  countries: LocationRecord[];
  states: LocationRecord[];
  updatedAt: Timestamp;
  consentGiven: boolean;
}

export interface LocationRecord {
  code: string;
  name: string;
  firstSeen: Timestamp;
  lastSeen: Timestamp;
  visitCount: number;
}

export interface CustomizationPreferences {
  borderColor: string;
  backgroundType: 'none' | 'flag' | 'solid';
  backgroundFlagCode?: string;
  backgroundSolidColor?: string;
  overlayEnabled: boolean;
  overlayImageId: string;
  overlayPattern: OverlayPattern;
  overlaySize: number;
  overlayPositionX?: number;
  overlayPositionY?: number;
}

export type OverlayPattern = 
  | 'single' 
  | 'single-flipped' 
  | 'scattered' 
  | 'tiled' 
  | 'placement';

export interface FlagOption {
  code: string;
  name: string;
  type: 'country' | 'state';
}

export const DEFAULT_PREFERENCES: CustomizationPreferences = {
  borderColor: '#9CA3AF',
  backgroundType: 'none',
  overlayEnabled: false,
  overlayImageId: 'hotdog',
  overlayPattern: 'single',
  overlaySize: 50,
};
