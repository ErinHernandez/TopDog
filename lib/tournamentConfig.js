// Tournament configuration and templates for development
export const tournamentTemplates = {
  topdog: {
    name: 'the TopDog',
    description: 'The premier fantasy football tournament with massive payouts',
    entryFee: 20,
    maxEntries: 1000,
    prizePool: 15000000,
    format: 'Best Ball',
    leagueSize: 12,
    status: 'launched',
    features: ['snake-draft', 'best-ball', 'auto-lineup', 'tournament-advancement'],
    scoring: {
      reception: 0.5,
      receivingTD: 6.0,
      receivingYard: 0.1,
      rushingTD: 6.0,
      rushingYard: 0.1,
      passingYard: 0.04,
      passingTD: 4.0,
      interception: -1.0,
      twoPointConversion: 2.0,
      fumbleLost: -2.0
    },
    roster: {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 1,
      FLEX: 1,
      BENCH: 10
    },
    schedule: [
      { round: 'Qualifiers', weeks: 'Weeks 1-14' },
      { round: 'Quarterfinals', weeks: 'Week 15' },
      { round: 'Semifinals', weeks: 'Week 16' },
      { round: 'Championship', weeks: 'Week 17' }
    ]
  },

};

// Development tournament templates
export const devTournamentTemplates = {
  dynasty: {
    name: 'Dynasty League',
    description: 'Multi-year dynasty fantasy football league',
    entryFee: 100,
    maxEntries: 500,
    prizePool: 50000,
    format: 'Dynasty',
    leagueSize: 12,
    status: 'development',
    features: ['dynasty', 'keeper-league', 'rookie-draft', 'trading', 'waivers'],
    notes: 'Need to implement dynasty-specific features like rookie drafts, trading system, and keeper mechanics',
    scoring: {
      reception: 0.5,
      receivingTD: 6.0,
      receivingYard: 0.1,
      rushingTD: 6.0,
      rushingYard: 0.1,
      passingYard: 0.04,
      passingTD: 4.0,
      interception: -1.0,
      twoPointConversion: 2.0,
      fumbleLost: -2.0
    },
    roster: {
      QB: 2,
      RB: 4,
      WR: 6,
      TE: 2,
      FLEX: 2,
      BENCH: 15,
      TAXI: 5
    }
  },
  guillotine: {
    name: 'Guillotine League',
    description: 'Elimination-style fantasy football league',
    entryFee: 50,
    maxEntries: 200,
    prizePool: 10000,
    format: 'Guillotine',
    leagueSize: 18,
    status: 'development',
    features: ['elimination', 'weekly-cuts', 'auction-bidding', 'survival'],
    notes: 'Need to implement elimination mechanics, weekly auction bidding for dropped players, and survival tracking',
    scoring: {
      reception: 0.5,
      receivingTD: 6.0,
      receivingYard: 0.1,
      rushingTD: 6.0,
      rushingYard: 0.1,
      passingYard: 0.04,
      passingTD: 4.0,
      interception: -1.0,
      twoPointConversion: 2.0,
      fumbleLost: -2.0
    },
    roster: {
      QB: 1,
      RB: 2,
      WR: 2,
      TE: 1,
      FLEX: 1,
      BENCH: 5
    }
  },
  auction: {
    name: 'Auction Draft League',
    description: 'Auction-style draft fantasy football league',
    entryFee: 75,
    maxEntries: 300,
    prizePool: 22500,
    format: 'Auction Draft',
    leagueSize: 12,
    status: 'development',
    features: ['auction-draft', 'salary-cap', 'nominations', 'bidding'],
    notes: 'Need to implement auction draft interface, bidding system, salary cap management, and nomination mechanics',
    scoring: {
      reception: 0.5,
      receivingTD: 6.0,
      receivingYard: 0.1,
      rushingTD: 6.0,
      rushingYard: 0.1,
      passingYard: 0.04,
      passingTD: 4.0,
      interception: -1.0,
      twoPointConversion: 2.0,
      fumbleLost: -2.0
    },
    roster: {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 1,
      FLEX: 1,
      BENCH: 10
    }
  }
};

// Tournament status options
export const tournamentStatuses = [
  { value: 'development', label: 'Development', color: '#fbbf24' },
  { value: 'testing', label: 'Testing', color: '#3b82f6' },
  { value: 'ready', label: 'Ready for Launch', color: '#10b981' },
  { value: 'launched', label: 'Launched', color: '#8b5cf6' },
  { value: 'paused', label: 'Paused', color: '#ef4444' }
];

// Tournament format options
export const tournamentFormats = [
  'Best Ball',
  'SuperFlex',
  'Dynasty',
  'Redraft',
  'Guillotine',
  'Auction Draft',
  'Keeper League',
  'IDP (Individual Defensive Players)'
];

// Feature flags for development
export const featureFlags = {
  // Core features
  snakeDraft: true,
  bestBall: true,
  autoLineup: true,
  tournamentAdvancement: true,
  
  // Development features
  superflex: false,
  dynasty: false,
  auctionDraft: false,
  guillotine: false,
  trading: false,
  waivers: false,
  idp: false,
  
  // Advanced features
  liveScoring: false,
  mobileApp: false,
  socialFeatures: false,
  analytics: false,
  
  // Data source flags
  useFirebaseTeams: false,  // Toggle Teams Tab data source (false = mock data, true = Firebase)
};

// Helper functions
export const getTournamentConfig = (tournamentType) => {
  return tournamentTemplates[tournamentType] || null;
};

export const getDevTournamentConfig = (tournamentType) => {
  return devTournamentTemplates[tournamentType] || null;
};

export const isFeatureEnabled = (feature) => {
  return featureFlags[feature] || false;
};

export const getStatusColor = (status) => {
  const statusConfig = tournamentStatuses.find(s => s.value === status);
  return statusConfig ? statusConfig.color : '#6b7280';
}; 