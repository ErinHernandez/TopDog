import { doc, runTransaction, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserLocations } from './types';

export interface GeolocationResult {
  country: { code: string; name: string } | null;
  state: { code: string; name: string } | null;
  error?: string;
}

export async function detectLocation(): Promise<GeolocationResult> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return { country: null, state: null, error: 'Server-side execution not supported' };
  }

  // Try ipapi.co first (1000 requests/day free)
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://ipapi.co/json/', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      if (data.country_code) {
        return {
          country: { code: data.country_code, name: data.country_name || data.country_code },
          state:
            data.country_code === 'US' && data.region_code
              ? { code: data.region_code, name: data.region || data.region_code }
              : null,
        };
      }
    }
  } catch (e) {
    // Log but continue to fallback
    console.log('ipapi.co failed, trying fallback:', e instanceof Error ? e.message : 'Unknown error');
  }

  // Fallback to BigDataCloud
  try {
    // First get the client IP
    const ipController = new AbortController();
    const ipTimeoutId = setTimeout(() => ipController.abort(), 10000);
    
    const ipResponse = await fetch('https://api.bigdatacloud.net/data/client-ip', {
      signal: ipController.signal,
    });
    
    clearTimeout(ipTimeoutId);
    
    if (!ipResponse.ok) {
      throw new Error('Failed to get IP');
    }
    
    const ipData = await ipResponse.json();
    
    // Then get location by IP
    const geoController = new AbortController();
    const geoTimeoutId = setTimeout(() => geoController.abort(), 10000);
    
    const geoResponse = await fetch(
      `https://api.bigdatacloud.net/data/country-by-ip?ip=${ipData.ipString}`,
      {
        signal: geoController.signal,
      }
    );
    
    clearTimeout(geoTimeoutId);
    
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      
      if (geoData.country?.isoAlpha2) {
        const stateCode = geoData.location?.principalSubdivisionCode?.split('-')[1];
        
        return {
          country: {
            code: geoData.country.isoAlpha2,
            name: geoData.country.name || geoData.country.isoAlpha2,
          },
          state:
            geoData.country.isoAlpha2 === 'US' && stateCode
              ? {
                  code: stateCode,
                  name: geoData.location?.principalSubdivision || stateCode,
                }
              : null,
        };
      }
    }
  } catch (e) {
    console.log('BigDataCloud fallback failed:', e instanceof Error ? e.message : 'Unknown error');
  }

  // Final fallback: try ipinfo.io
  try {
    const infoController = new AbortController();
    const infoTimeoutId = setTimeout(() => infoController.abort(), 10000);
    
    const response = await fetch('https://ipinfo.io/json', {
      headers: { Accept: 'application/json' },
      signal: infoController.signal,
    });
    
    clearTimeout(infoTimeoutId);

    if (response.ok) {
      const data = await response.json();
      
      if (data.country) {
        // ipinfo.io uses lowercase country codes, convert to uppercase
        const countryCode = data.country.toUpperCase();
        const stateCode = data.region; // e.g., "CA" for California
        
        return {
          country: {
            code: countryCode,
            name: data.country_name || countryCode,
          },
          state:
            countryCode === 'US' && stateCode
              ? { code: stateCode, name: data.region || stateCode }
              : null,
        };
      }
    }
  } catch (e) {
    console.log('ipinfo.io fallback failed:', e instanceof Error ? e.message : 'Unknown error');
  }

  // All methods failed
  console.error('All location detection methods failed');
  return { country: null, state: null, error: 'All detection methods failed' };
}

export async function recordLocationVisit(
  userId: string,
  location: GeolocationResult
): Promise<void> {
  if (!location.country) return;

  const docRef = doc(db, 'userLocations', userId);
  const now = Timestamp.now();

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    const data: UserLocations = docSnap.exists()
      ? (docSnap.data() as UserLocations)
      : {
          userId,
          countries: [],
          states: [],
          consentGiven: true,
          updatedAt: now,
        };

    // Update or add country
    const countryIdx = data.countries.findIndex(
      (c) => c.code === location.country!.code
    );
    if (countryIdx >= 0) {
      data.countries[countryIdx].lastSeen = now;
      data.countries[countryIdx].visitCount++;
    } else {
      data.countries.push({
        code: location.country!.code,
        name: location.country!.name,
        firstSeen: now,
        lastSeen: now,
        visitCount: 1,
      });
    }

    // Update or add US state if present
    if (location.state) {
      const stateIdx = data.states.findIndex((s) => s.code === location.state!.code);
      if (stateIdx >= 0) {
        data.states[stateIdx].lastSeen = now;
        data.states[stateIdx].visitCount++;
      } else {
        data.states.push({
          code: location.state!.code,
          name: location.state!.name,
          firstSeen: now,
          lastSeen: now,
          visitCount: 1,
        });
      }
    }

    data.updatedAt = now;
    transaction.set(docRef, data);
  });
}

export async function hasLocationConsent(userId: string): Promise<boolean> {
  const docRef = doc(db, 'userLocations', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() && docSnap.data()?.consentGiven === true;
}

export async function grantLocationConsent(userId: string): Promise<void> {
  const docRef = doc(db, 'userLocations', userId);
  await setDoc(docRef, { consentGiven: true, updatedAt: Timestamp.now() }, { merge: true });
}
