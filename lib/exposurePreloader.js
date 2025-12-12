import userMetrics from './userMetrics';

class ExposurePreloader {
  constructor() {
    this.isPreloading = false;
    this.preloadPromise = null;
    this.csvUrl = '/33b5de97-dc20-4c7d-919c-b35ca06a3ac9_100fec91-ff4f-4368-bbee-c7fcc07307d2_2025-08-25.csv';
  }

  // Start preloading exposure data in background
  async startPreload() {
    if (this.isPreloading) {
      return this.preloadPromise;
    }

    this.isPreloading = true;
    this.preloadPromise = this.performPreload();
    
    return this.preloadPromise;
  }

  // Perform the actual preload
  async performPreload() {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting exposure data preload...');
      }
      
      // Check if we need to preload based on user activity
      if (!this.shouldPreload()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Skipping preload - not needed based on user activity');
        }
        return null;
      }

      // Check cache first
      const cachedData = userMetrics.getExposureDataCache();
      if (cachedData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Using cached exposure data');
        }
        return cachedData;
      }

      // Fetch and process CSV data
      const response = await fetch(this.csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`);
      }
      
      const csvText = await response.text();
      const processedData = this.processCSVData(csvText);
      
      // Cache the processed data
      userMetrics.saveExposureDataCache(processedData);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Exposure data preloaded and cached successfully');
      }
      return processedData;
      
    } catch (error) {
      console.warn('Exposure data preload failed:', error);
      return null;
    } finally {
      this.isPreloading = false;
    }
  }

  // Determine if we should preload based on user activity
  shouldPreload() {
    try {
      // Always preload if no cache exists
      const cachedData = userMetrics.getExposureDataCache();
      if (!cachedData) {
        return true;
      }

      // Check user activity patterns
      const summary = userMetrics.getActivitySummary();
      
      // Preload if user has recent draft activity
      if (summary.hasRecentActivity) {
        return true;
      }

      // Preload if user has completed drafts before
      if (summary.totalDraftsCompleted > 0) {
        return true;
      }

      // Preload if user has visited exposure page before
      const pageVisits = userMetrics.getMetrics().pageVisits || [];
      const hasVisitedExposure = pageVisits.some(visit => 
        visit.page.includes('/exposure') || visit.page.includes('exposure')
      );
      
      if (hasVisitedExposure) {
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Error checking if should preload:', error);
      return true; // Default to preloading if we can't determine
    }
  }

  // Process CSV data (same logic as exposure.js)
  processCSVData(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    // Parse CSV data
    const picks = lines.slice(1).map(line => {
      const values = line.split(',');
      const pick = {};
      headers.forEach((header, index) => {
        pick[header.trim()] = values[index]?.trim() || '';
      });
      return pick;
    });

    // Group by player and calculate exposure
    const playerMap = new Map();
    const tournamentMap = new Map();
    const teamMap = new Map();

    picks.forEach(pick => {
      const playerName = `${pick['First Name']} ${pick['Last Name']}`;
      const position = pick['Position'];
      const team = pick['Team'];
      const tournament = pick['Tournament Title'];
      const draftId = pick['Draft'];
      const pickNumber = parseInt(pick['Pick Number']) || 0;

      // Track player exposure
      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, {
          name: playerName,
          position: position,
          team: team,
          exposure: 0,
          leagues: 0,
          entryFee: 0,
          tournament: tournament,
          draftStatus: 'post-draft',
          draftIds: new Set(),
          averagePick: 0,
          totalPicks: 0,
          totalEntryFee: 0
        });
      }

      const player = playerMap.get(playerName);
      player.exposure += 1;
      player.draftIds.add(draftId);
      player.totalPicks += pickNumber;
      player.leagues = player.draftIds.size;
      player.averagePick = player.totalPicks / player.exposure;
      
      // Calculate entry fee: user's teams (drafted #) × entry fee per tournament
      const userTeams = 1; // Each pick represents 1 team for this user
      const entryFee = parseFloat(pick['Tournament Entry Fee']) || 0;
      const userEntryFee = userTeams * entryFee;
      player.entryFee += userEntryFee;

      // Track tournament exposure
      if (!tournamentMap.has(tournament)) {
        tournamentMap.set(tournament, {
          name: tournament,
          entries: 0,
          userEntries: 0,
          entryFee: parseFloat(pick['Tournament Entry Fee']) || 0,
          prizes: parseFloat(pick['Tournament Total Prizes']) || 0,
          type: 'BB',
          draftDate: '2024-05-15',
          isPostDraft: true
        });
      }
      tournamentMap.get(tournament).entries += 1;

      // Track team exposure
      if (!teamMap.has(team)) {
        teamMap.set(team, {
          name: team,
          exposure: 0,
          leagues: 0,
          tournament: tournament
        });
      }
      teamMap.get(team).exposure += 1;
    });

    // Convert maps to arrays
    const playerExposure = Array.from(playerMap.values()).map(player => ({
      ...player,
      draftIds: Array.from(player.draftIds)
    }));

    const teamExposure = Array.from(teamMap.values());
    const tournaments = Array.from(tournamentMap.values());

    return {
      playerExposure,
      teamExposure,
      tournaments
    };
  }

  // Get preloaded data (returns cached data if available)
  getPreloadedData() {
    return userMetrics.getExposureDataCache();
  }

  // Force refresh of exposure data
  async forceRefresh() {
    userMetrics.clearExposureDataCache();
    this.isPreloading = false;
    this.preloadPromise = null;
    return this.startPreload();
  }

  // Initialize preloader on page load
  init() {
    // Start preloading after a short delay to not block initial page load
    setTimeout(() => {
      this.startPreload();
    }, 1000);

    // Also preload when user becomes active
    let activityTimeout;
    const handleUserActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        if (!this.isPreloading && !userMetrics.getExposureDataCache()) {
          this.startPreload();
        }
      }, 2000);
    };

    // Listen for user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });
  }
}

// Create singleton instance
const exposurePreloader = new ExposurePreloader();

export default exposurePreloader;
