/**
 * LocationIntegrityService
 *
 * Unified location data collection for:
 * - User research (geographic patterns)
 * - Integrity analysis (co-location detection)
 * - County badges (DISABLED - infrastructure remains for future use)
 *
 * NOTE: County badges are disabled indefinitely. County data is still collected
 * in pickLocations for research/integrity, but badges are not created for users.
 *
 * This service REPLACES:
 * - lib/location/* (deprecated)
 * - lib/customization/geolocation.ts (deprecated)
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  Timestamp,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';

import { createScopedLogger } from '@/lib/clientLogger';
import { db } from '@/lib/firebase';

const logger = createScopedLogger('[LocationIntegrity]');
import type {
  LocationData,
  PickLocationData,
  PickLocationRecord,
  ProximityFlags,
} from './types';

// === LOCAL TYPES ===

/**
 * Admin level from BigDataCloud reverse geocode response
 */
interface AdminLevel {
  adminLevel: number;
  name?: string;
  description?: string;
}

/**
 * Badge entry stored in userBadges collection
 */
interface BadgeEntry {
  code: string;
  name?: string;
  firstEarned: ReturnType<typeof Timestamp.now>;
  lastUpdated: ReturnType<typeof Timestamp.now>;
  count: number;
  lastSeen?: ReturnType<typeof Timestamp.now>;
  pickCount?: number;
}

/**
 * User badges document structure
 */
interface UserBadges {
  countries: BadgeEntry[];
  states: BadgeEntry[];
  counties: BadgeEntry[];
  divisions: BadgeEntry[];
}

// === CONSTANTS ===

const FIFTY_FEET_IN_METERS = 15.24;
const EARTH_RADIUS_METERS = 6371000;

// Feature flags
const COUNTY_BADGES_ENABLED = false; // Disabled indefinitely - infrastructure remains for future use
const DIVISION_BADGES_ENABLED = false; // Disabled indefinitely - infrastructure remains for future use

// === MAIN SERVICE ===

export class LocationIntegrityService {
  /**
   * Record location data for a pick
   * Called on every pick submission
   * 
   * NOTE: This method should be called server-side. Location data should
   * be captured client-side and sent with the pick request.
   */
  async recordPickLocation(data: PickLocationData): Promise<PickLocationRecord> {
    const { draftId, pickNumber, userId, location, deviceId } = data;

    // 1. Reverse geocode to get county/state/country
    const geoData = await this.reverseGeocode(location.lat, location.lng);

    // 2. Get other drafters' locations and compute proximity flags
    const proximityFlags = await this.computeProximityFlags(
      draftId,
      userId,
      location
    );

    // 3. Update draft location state (for next proximity check)
    await this.updateDraftLocationState(draftId, userId, location, pickNumber);

    // 4. Build and write pick location document
    const docId = `${draftId}_${pickNumber}_${userId}`;
    const record: PickLocationRecord = {
      id: docId,
      draftId,
      pickNumber,
      userId,
      timestamp: Timestamp.now(),
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      ipAddress: location.ipAddress,
      countyCode: geoData.countyCode,
      countryCode: geoData.countryCode,
      stateCode: geoData.stateCode,
      divisionCode: geoData.divisionCode,
      divisionName: geoData.divisionName,
      divisionType: geoData.divisionType,
      within50ft: proximityFlags.within50ft,
      sameIp: proximityFlags.sameIp,
      deviceId,
      createdAt: Timestamp.now(),
    };

    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    await setDoc(doc(db, 'pickLocations', docId), record);

    // 5. Record collusion flags (if any proximity detected)
    // NOTE: This is completely non-blocking. Drafts are NEVER stopped for collusion.
    // All flagging is passive - data is recorded for post-draft review only.
    if (proximityFlags.within50ft.length > 0 || proximityFlags.sameIp.length > 0) {
      const { collusionFlagService } = await import('./CollusionFlagService');
      collusionFlagService.recordProximityFlag({
        draftId,
        pickNumber,
        triggeringUserId: userId,
        within50ft: proximityFlags.within50ft,
        sameIp: proximityFlags.sameIp,
      }).catch((error) => {
        // Log but don't fail the pick location recording
        // Drafts always proceed normally regardless of flagging errors
        logger.error('Failed to record collusion flag', error instanceof Error ? error : new Error(String(error)));
      });
    }

    // 6. Queue badge update (async, non-blocking)
    this.queueBadgeUpdate(userId, geoData).catch((error) => {
      logger.error('Failed to queue badge update', error instanceof Error ? error : new Error(String(error)));
    });

    return record;
  }

  /**
   * Get current location from browser (CLIENT-SIDE ONLY)
   * 
   * This method uses browser Geolocation API and should only be called
   * from client-side code. The location should then be sent to the server
   * with the pick submission.
   */
  async getCurrentLocation(): Promise<LocationData> {
    if (typeof window === 'undefined') {
      throw new Error('getCurrentLocation() can only be called client-side');
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Get IP address
          const ipAddress = await this.getIpAddress();

          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            ipAddress,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to get county/state/country/division
   */
  private async reverseGeocode(lat: number, lng: number): Promise<{
    countyCode: string | null;
    countryCode: string;
    stateCode: string | null;
    divisionCode: string | null;
    divisionName: string | null;
    divisionType: import('./types').DivisionType | null;
  }> {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error(`Geocode failed: ${response.status}`);
      }

      const data = await response.json();

      const countryCode = data.countryCode || 'UNKNOWN';
      let stateCode: string | null = null;
      let countyCode: string | null = null;
      let divisionCode: string | null = null;
      let divisionName: string | null = null;
      let divisionType: import('./types').DivisionType | null = null;

      // Extract state code for US
      if (countryCode === 'US' && data.principalSubdivisionCode) {
        stateCode = data.principalSubdivisionCode.replace('US-', '');
      }

      // Extract county for US
      if (countryCode === 'US' && stateCode) {
        const adminLevels: AdminLevel[] = data.localityInfo?.administrative || [];
        const countyLevel = adminLevels.find((level) =>
          level.adminLevel === 2 ||
          level.description?.toLowerCase().includes('county')
        );

        if (countyLevel?.name) {
          const countyName = countyLevel.name.replace(/ County$/i, '').trim();
          const fipsCode = await this.lookupCountyFips(stateCode, countyName);
          if (fipsCode) {
            countyCode = `US-${stateCode}-${fipsCode}`;
          }
        }
      }

      // Extract international division (non-US only)
      if (countryCode !== 'US' && data.principalSubdivisionCode) {
        // Build ISO 3166-2 code
        divisionCode = `${countryCode}-${data.principalSubdivisionCode}`;
        divisionName = data.principalSubdivision || null;
        
        // Get division type for country
        const { getDivisionTypeForCountry } = await import('./divisionTypes');
        divisionType = getDivisionTypeForCountry(countryCode);
      }

      return { 
        countyCode, 
        countryCode, 
        stateCode,
        divisionCode,
        divisionName,
        divisionType,
      };
    } catch (error) {
      logger.error('Reverse geocode error', error instanceof Error ? error : new Error(String(error)));
      return {
        countyCode: null,
        countryCode: 'UNKNOWN',
        stateCode: null,
        divisionCode: null,
        divisionName: null,
        divisionType: null,
      };
    }
  }

  /**
   * Compute proximity flags by comparing to other drafters
   */
  private async computeProximityFlags(
    draftId: string,
    currentUserId: string,
    currentLocation: LocationData
  ): Promise<ProximityFlags> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const within50ft: string[] = [];
    const sameIp: string[] = [];

    // Get draft location state
    const stateRef = doc(db, 'draftLocationState', draftId);
    const stateSnap = await getDoc(stateRef);

    if (!stateSnap.exists()) {
      return { within50ft, sameIp };
    }

    const state = stateSnap.data();
    const locations = state.locations || {};

    // Compare against each other drafter
    for (const [userId, locData] of Object.entries(locations)) {
      if (userId === currentUserId) continue;

      const otherLoc = locData as { lat: number; lng: number; ipAddress: string };

      // Check distance
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        otherLoc.lat,
        otherLoc.lng
      );

      if (distance <= FIFTY_FEET_IN_METERS) {
        within50ft.push(userId);
      }

      // Check IP
      if (currentLocation.ipAddress === otherLoc.ipAddress) {
        sameIp.push(userId);
      }
    }

    return { within50ft, sameIp };
  }

  /**
   * Update ephemeral draft location state
   */
  private async updateDraftLocationState(
    draftId: string,
    userId: string,
    location: LocationData,
    pickNumber: number
  ): Promise<void> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const stateRef = doc(db, 'draftLocationState', draftId);

    await runTransaction(db, async (transaction) => {
      const stateSnap = await transaction.get(stateRef);

      if (!stateSnap.exists()) {
        // Create new state document
        transaction.set(stateRef, {
          draftId,
          locations: {
            [userId]: {
              lat: location.lat,
              lng: location.lng,
              ipAddress: location.ipAddress,
              lastPickNumber: pickNumber,
              timestamp: Timestamp.now(),
            }
          },
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update existing
        transaction.update(stateRef, {
          [`locations.${userId}`]: {
            lat: location.lat,
            lng: location.lng,
            ipAddress: location.ipAddress,
            lastPickNumber: pickNumber,
            timestamp: Timestamp.now(),
          },
          updatedAt: serverTimestamp(),
        });
      }
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get user's IP address (CLIENT-SIDE ONLY)
   */
  private async getIpAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'UNKNOWN';
    } catch {
      return 'UNKNOWN';
    }
  }

  /**
   * Look up county FIPS code from state and county name
   */
  private async lookupCountyFips(stateCode: string, countyName: string): Promise<string | null> {
    // Import from county data module
    const { getCountyFipsCode } = await import('./countyData');
    return getCountyFipsCode(stateCode, countyName);
  }

  /**
   * Queue badge update (non-blocking)
   */
  private async queueBadgeUpdate(
    userId: string,
    geoData: { 
      countyCode: string | null; 
      countryCode: string; 
      stateCode: string | null;
      divisionCode: string | null;
      divisionName: string | null;
      divisionType: import('./types').DivisionType | null;
    }
  ): Promise<void> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const badgeRef = doc(db, 'userBadges', userId);

    await runTransaction(db, async (transaction) => {
      const badgeSnap = await transaction.get(badgeRef);
      const now = Timestamp.now();

      let badges: UserBadges;

      if (!badgeSnap.exists()) {
        badges = { countries: [], states: [], counties: [], divisions: [] };
      } else {
        const data = badgeSnap.data();
        badges = {
          countries: data.countries || [],
          states: data.states || [],
          counties: data.counties || [],
          divisions: data.divisions || [],
        };
      }

      // Update country badge
      if (geoData.countryCode && geoData.countryCode !== 'UNKNOWN') {
        const countryIdx = badges.countries.findIndex(b => b.code === geoData.countryCode);
        if (countryIdx >= 0) {
          badges.countries[countryIdx]!.lastSeen = now;
          badges.countries[countryIdx]!.pickCount = (badges.countries[countryIdx]!.pickCount || 0) + 1;
        } else {
          badges.countries.push({
            code: geoData.countryCode,
            name: await this.getCountryName(geoData.countryCode),
            firstEarned: now,
            lastUpdated: now,
            count: 1,
            lastSeen: now,
            pickCount: 1,
          });
        }
      }

      // Update state badge (US only)
      if (geoData.stateCode) {
        const stateCode = `US-${geoData.stateCode}`;
        const stateIdx = badges.states.findIndex(b => b.code === stateCode);
        if (stateIdx >= 0) {
          badges.states[stateIdx]!.lastSeen = now;
          badges.states[stateIdx]!.pickCount = (badges.states[stateIdx]!.pickCount || 0) + 1;
        } else {
          badges.states.push({
            code: stateCode,
            name: await this.getStateName(geoData.stateCode),
            firstEarned: now,
            lastUpdated: now,
            count: 1,
            lastSeen: now,
            pickCount: 1,
          });
        }
      }

      // Update county badge (US only)
      // DISABLED: County badges are disabled indefinitely. Infrastructure remains for future use.
      // County data is still collected in pickLocations for research/integrity purposes,
      // but badges are not created or updated for users.
      if (COUNTY_BADGES_ENABLED && geoData.countyCode) {
        const countyIdx = badges.counties.findIndex(b => b.code === geoData.countyCode);
        if (countyIdx >= 0) {
          badges.counties[countyIdx]!.lastSeen = now;
          badges.counties[countyIdx]!.pickCount = (badges.counties[countyIdx]!.pickCount || 0) + 1;
        } else {
          badges.counties.push({
            code: geoData.countyCode,
            name: await this.getCountyName(geoData.countyCode),
            firstEarned: now,
            lastUpdated: now,
            count: 1,
            lastSeen: now,
            pickCount: 1,
          });
        }
      }
      // Note: badges.counties array is still saved to maintain data structure,
      // but it will remain empty/unchanged while COUNTY_BADGES_ENABLED is false

      // Update division badge (non-US only)
      // DISABLED: Division badges are disabled indefinitely. Infrastructure remains for future use.
      // Division data is still collected in pickLocations for research/integrity purposes,
      // but badges are not created or updated for users.
      if (DIVISION_BADGES_ENABLED && geoData.divisionCode && geoData.countryCode !== 'US') {
        const divIdx = badges.divisions.findIndex(d => d.code === geoData.divisionCode);
        if (divIdx >= 0) {
          badges.divisions[divIdx]!.lastSeen = now;
          badges.divisions[divIdx]!.pickCount = (badges.divisions[divIdx]!.pickCount || 0) + 1;
        } else {
          badges.divisions.push({
            code: geoData.divisionCode,
            name: geoData.divisionName || await this.getDivisionName(geoData.divisionCode),
            firstEarned: now,
            lastUpdated: now,
            count: 1,
            lastSeen: now,
            pickCount: 1,
          });
        }
      }
      // Note: badges.divisions array is still saved to maintain data structure,
      // but it will remain empty/unchanged while DIVISION_BADGES_ENABLED is false

      transaction.set(badgeRef, {
        userId,
        countries: badges.countries,
        states: badges.states,
        counties: badges.counties,
        divisions: badges.divisions,
        updatedAt: now,
        createdAt: badgeSnap.exists() ? badgeSnap.data().createdAt : now,
      });
    });
  }

  /**
   * Get country name from code
   */
  private async getCountryName(code: string): Promise<string> {
    const { COUNTRY_NAMES } = await import('./locationNames');
    return COUNTRY_NAMES[code] || code;
  }

  /**
   * Get state name from code
   */
  private async getStateName(code: string): Promise<string> {
    const { US_STATE_NAMES } = await import('./locationNames');
    return US_STATE_NAMES[code] || code;
  }

  /**
   * Get county name from code
   */
  private async getCountyName(code: string): Promise<string> {
    const { getCountyNameFromCode } = await import('./countyData');
    return getCountyNameFromCode(code) || code;
  }

  /**
   * Get division name from code
   */
  private async getDivisionName(code: string): Promise<string> {
    const { getDivisionName } = await import('./divisionNames');
    return getDivisionName(code) || code;
  }

  /**
   * Clean up draft location state after draft completes
   */
  async cleanupDraftState(draftId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const stateRef = doc(db, 'draftLocationState', draftId);
    await deleteDoc(stateRef);
  }
}

// Singleton export
export const locationIntegrityService = new LocationIntegrityService();
