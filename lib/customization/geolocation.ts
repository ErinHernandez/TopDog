import { doc, runTransaction, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserLocations } from './types';

export interface GeolocationResult {
  country: { code: string; name: string } | null;
  state: { code: string; name: string } | null;
  error?: string;
}

export async function detectLocation(): Promise<GeolocationResult> {
  try {
    // Using ipapi.co - free tier allows 1000 requests/day
    // Alternative: https://ipinfo.io/json or https://api.bigdatacloud.net/data/country-by-ip
    const response = await fetch('https://ipapi.co/json/', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      country: data.country_code
        ? { code: data.country_code, name: data.country_name }
        : null,
      state:
        data.country_code === 'US' && data.region_code
          ? { code: data.region_code, name: data.region }
          : null,
    };
  } catch (e) {
    console.error('Location detection failed:', e);
    return { country: null, state: null, error: 'Detection failed' };
  }
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
