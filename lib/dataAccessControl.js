/**
 * Data Access Control System
 * Manages when different types of data can be accessed
 * Protects competitive integrity during active seasons
 */

class DataAccessControl {
  constructor() {
    // Season configuration
    this.seasonConfig = {
      2025: {
        draftPeriodStart: '2025-05-01',
        draftPeriodEnd: '2025-09-05',
        seasonStart: '2025-09-05',
        seasonEnd: '2025-01-13', // Following year
        dataReleaseDate: '2025-01-20' // Week after season ends
      }
    };
  }

  /**
   * Check if we're currently in a restricted period
   */
  isDataRestricted(dataType = 'all', userId = null) {
    const now = new Date();
    const currentSeason = this.getCurrentSeason();
    const config = this.seasonConfig[currentSeason];
    
    if (!config) {
      console.warn(`No season config found for ${currentSeason}`);
      return false; // Default to allowing access if no config
    }

    const draftStart = new Date(config.draftPeriodStart);
    const dataRelease = new Date(config.dataReleaseDate);
    
    // Check if we're in the restricted period (draft period through season end)
    const inRestrictedPeriod = now >= draftStart && now < dataRelease;
    
    if (!inRestrictedPeriod) {
      return false; // Data freely available outside restricted period
    }

    // During restricted period, only personal data is allowed
    if (dataType === 'personal' && userId) {
      return false; // Personal data always allowed
    }

    // All other data types restricted during active season
    return true;
  }

  /**
   * Get data availability message for users
   */
  getDataAvailabilityMessage(dataType) {
    const messages = {
      'tournament': `Tournament data will be generated after the tournament concludes.`,
      'draft': `Historical draft analytics will be available once the tournament is complete.`,
      'player': `Player performance data across tournaments will be compiled after tournament completion.`,
      'aggregated': `League-wide statistics will be available once the tournament concludes.`,
      'all': `This data will be available after the tournament concludes.`
    };

    return messages[dataType] || messages['all'];
  }

  /**
   * Check what data types are currently available
   */
  getAvailableDataTypes(userId = null) {
    const available = [];
    const restricted = [];
    
    const dataTypes = [
      { type: 'personal', label: 'Your Draft History' },
      { type: 'tournament', label: 'Tournament Analytics' },
      { type: 'player', label: 'Player Performance Data' },
      { type: 'aggregated', label: 'League-wide Statistics' }
    ];

    dataTypes.forEach(({ type, label }) => {
      if (this.isDataRestricted(type, userId)) {
        restricted.push({ type, label, reason: this.getDataAvailabilityMessage(type) });
      } else {
        available.push({ type, label });
      }
    });

    return { available, restricted };
  }

  /**
   * Validate export request
   */
  validateExportRequest(exportType, userId, requesterId) {
    // Personal data - only accessible by the user themselves
    if (exportType === 'personal' || exportType === 'user') {
      if (userId !== requesterId) {
        return {
          allowed: false,
          reason: 'You can only export your own personal data.'
        };
      }
      return { allowed: true };
    }

    // All other data types - check restriction period
    if (this.isDataRestricted(exportType, userId)) {
      return {
        allowed: false,
        reason: this.getDataAvailabilityMessage(exportType)
      };
    }

    return { allowed: true };
  }

  /**
   * Get current season year
   */
  getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    
    // If we're in early months, might be previous season
    if (now.getMonth() < 4) { // Before May
      return year; // Still in the season that started previous year
    }
    
    return year;
  }

  /**
   * Get simple status for data availability
   */
  getDataAvailabilityStatus() {
    if (this.isDataRestricted()) {
      return 'Will be generated after tournament completion';
    }
    return 'Available now';
  }

  /**
   * Check if draft period is active
   */
  isDraftPeriodActive() {
    const now = new Date();
    const config = this.seasonConfig[this.getCurrentSeason()];
    
    if (!config) return false;
    
    const draftStart = new Date(config.draftPeriodStart);
    const draftEnd = new Date(config.draftPeriodEnd);
    
    return now >= draftStart && now <= draftEnd;
  }

  /**
   * Check if NFL season is active
   */
  isSeasonActive() {
    const now = new Date();
    const config = this.seasonConfig[this.getCurrentSeason()];
    
    if (!config) return false;
    
    const seasonStart = new Date(config.seasonStart);
    const seasonEnd = new Date(config.seasonEnd);
    
    return now >= seasonStart && now <= seasonEnd;
  }

  /**
   * Get current period status
   */
  getCurrentPeriod() {
    if (this.isDraftPeriodActive()) return 'draft';
    if (this.isSeasonActive()) return 'season';
    if (this.isDataRestricted()) return 'restricted';
    return 'offseason';
  }

  /**
   * Get period-specific messaging
   */
  getPeriodMessage() {
    const period = this.getCurrentPeriod();
    
    const messages = {
      'draft': 'Draft period is active. Only personal draft data is available.',
      'season': 'Tournament is in progress. Historical analytics will be generated after tournament completion.',
      'restricted': 'Tournament data will be generated after tournament completion.',
      'offseason': 'All historical data is now available for export and analysis.'
    };

    return messages[period];
  }
}

// Export restrictions by data type during active season
const DATA_TYPE_RESTRICTIONS = {
  // Always allowed
  'personal': {
    restricted: false,
    description: 'Your own draft picks and performance'
  },
  
  // Restricted during active season
  'tournament': {
    restricted: true,
    description: 'Tournament-wide analytics and ownership data',
    reason: 'Could provide competitive advantages during active play'
  },
  
  'draft': {
    restricted: true, 
    description: 'Historical draft data across all users',
    reason: 'Could reveal opponent tendencies and strategies'
  },
  
  'player': {
    restricted: true,
    description: 'Player performance across all tournaments',
    reason: 'Could influence ongoing draft and roster decisions'
  },
  
  'aggregated': {
    restricted: true,
    description: 'League-wide statistics and trends',
    reason: 'Could provide unfair analytical advantages'
  }
};

const dataAccessControl = new DataAccessControl();

module.exports = {
  DataAccessControl,
  dataAccessControl,
  DATA_TYPE_RESTRICTIONS
};