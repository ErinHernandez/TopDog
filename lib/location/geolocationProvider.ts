/**
 * Geolocation Provider
 * 
 * Provides location detection through multiple methods:
 * 1. Browser Geolocation API (requires user permission, high accuracy)
 * 2. IP-based geolocation (no permission needed, medium accuracy)
 * 
 * Only tracks country/state level - never precise coordinates.
 */

import { createScopedLogger } from '@/lib/clientLogger';

import type { GeoLocation } from './types';

const logger = createScopedLogger('[GeolocationProvider]');

// ============================================================================
// BROWSER GEOLOCATION
// ============================================================================

/**
 * Get location using Browser Geolocation API + reverse geocoding
 * Requires user permission, provides high accuracy
 */
export async function getBrowserLocation(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use BigDataCloud's free reverse geocoding service
          // No API key required, generous rate limits
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            resolve(null);
            return;
          }
          
          const data = await response.json();
          
          resolve({
            countryCode: data.countryCode || '',
            countryName: data.countryName || '',
            stateCode: data.principalSubdivisionCode?.replace(`${data.countryCode}-`, ''),
            stateName: data.principalSubdivision,
            source: 'browser',
            accuracy: 'high',
          });
        } catch (error: unknown) {
          logger.error('Reverse geocoding failed', error instanceof Error ? error : new Error(String(error)));
          resolve(null);
        }
      },
      (error: GeolocationPositionError) => {
        // User denied permission or other error
        logger.debug('Browser geolocation failed', { message: error.message });
        resolve(null);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false, // We only need country/state level
        maximumAge: 1000 * 60 * 60, // Cache for 1 hour
      }
    );
  });
}

// ============================================================================
// IP-BASED GEOLOCATION
// ============================================================================

/**
 * Get location using IP-based geolocation
 * No user permission required, medium accuracy
 * Uses ipapi.co as primary, BigDataCloud as fallback
 */
export async function getIPLocation(): Promise<GeoLocation | null> {
  // Try ipapi.co first (1000 requests/day free)
  try {
    const response = await fetch('https://ipapi.co/json/', {
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.country_code) {
        return {
          countryCode: data.country_code,
          countryName: data.country_name || '',
          stateCode: data.country_code === 'US' ? data.region_code : undefined,
          stateName: data.country_code === 'US' ? data.region : undefined,
          source: 'ip',
          accuracy: 'medium',
        };
      }
    }
  } catch (error: unknown) {
    logger.debug('ipapi.co failed, trying fallback', { error: error instanceof Error ? error.message : String(error) });
  }
  
  // Fallback to BigDataCloud
  try {
    const ipResponse = await fetch('https://api.bigdatacloud.net/data/client-ip');
    if (!ipResponse.ok) return null;
    
    const ipData = await ipResponse.json();
    
    const geoResponse = await fetch(
      `https://api.bigdatacloud.net/data/country-by-ip?ip=${ipData.ipString}`
    );
    
    if (!geoResponse.ok) return null;
    
    const geoData = await geoResponse.json();
    
    return {
      countryCode: geoData.country?.isoAlpha2 || '',
      countryName: geoData.country?.name || '',
      stateCode: geoData.location?.principalSubdivisionCode?.split('-')[1],
      stateName: geoData.location?.principalSubdivision,
      source: 'ip',
      accuracy: 'low',
    };
  } catch (error: unknown) {
    logger.error('All IP geolocation methods failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

// ============================================================================
// COMBINED LOCATION DETECTION
// ============================================================================

/**
 * Get current location using best available method
 * Tries browser geolocation first, falls back to IP-based
 */
export async function getCurrentLocation(): Promise<GeoLocation | null> {
  // Try browser geolocation first (more accurate)
  const browserLoc = await getBrowserLocation();
  if (browserLoc && browserLoc.countryCode) {
    return browserLoc;
  }
  
  // Fall back to IP-based
  return getIPLocation();
}

/**
 * Get location silently (IP-only, no permission prompts)
 * Use this for background tracking when consent is already granted
 */
export async function getLocationSilent(): Promise<GeoLocation | null> {
  return getIPLocation();
}

// ============================================================================
// LOCATION UTILITIES
// ============================================================================

/**
 * Format location code for storage
 * Countries: "US", "CA", etc.
 * US States: "US-CA", "US-NY", etc.
 */
export function formatLocationCode(location: GeoLocation): string {
  if (location.countryCode === 'US' && location.stateCode) {
    return `US-${location.stateCode}`;
  }
  return location.countryCode;
}

/**
 * Check if location looks valid
 */
export function isValidLocation(location: GeoLocation | null): location is GeoLocation {
  return Boolean(
    location && 
    location.countryCode && 
    location.countryCode.length === 2
  );
}
