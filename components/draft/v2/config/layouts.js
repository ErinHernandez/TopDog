/**
 * Layout Configuration System
 * 
 * This allows for easy layout customization and A/B testing:
 * - Predefined layouts for different use cases
 * - Easy element positioning
 * - Component version management
 * - Dynamic layout switching
 */

/**
 * Standard Draft Layout
 * Classic draft room with all features
 */
const standardLayout = {
  name: 'Standard Draft',
  zones: {
    header: [
      {
        id: 'main-navbar',
        type: 'navbar',
        props: {
          showLogo: true,
          showUserInfo: true
        }
      },
      {
        id: 'room-info',
        type: 'room-info',
        props: {
          showTimer: true,
          showPickNumber: true,
          showRound: true
        }
      }
    ],
    sidebar: [
      {
        id: 'player-search',
        type: 'player-search',
        props: {
          showFilters: true,
          showSort: true
        }
      },
      {
        id: 'player-list',
        type: 'player-list',
        props: {
          showPositions: true,
          showADP: true,
          showProjections: true
        }
      }
    ],
    center: [
      {
        id: 'pick-cards',
        type: 'pick-cards',
        props: {
          cardStyle: 'horizontal',
          showTimer: true,
          showPositionBar: true
        }
      }
    ],
    rightPanel: [
      {
        id: 'queue-manager',
        type: 'queue-manager',
        props: {
          allowReorder: true,
          showADP: true
        }
      },
      {
        id: 'team-roster',
        type: 'team-roster',
        props: {
          showPositions: true,
          showStats: true
        }
      },
      {
        id: 'draft-stats',
        type: 'draft-stats',
        props: {
          showPositionBreakdown: true,
          showValuePicks: true
        }
      }
    ]
  }
};

/**
 * Compact Layout
 * Streamlined for mobile or smaller screens
 */
const compactLayout = {
  name: 'Compact Draft',
  zones: {
    header: [
      {
        id: 'compact-navbar',
        type: 'navbar',
        props: {
          compact: true,
          showLogo: false
        }
      }
    ],
    center: [
      {
        id: 'pick-cards-compact',
        type: 'pick-cards',
        props: {
          cardStyle: 'compact',
          showTimer: true,
          hidePositionBar: true
        }
      },
      {
        id: 'player-list-compact',
        type: 'player-list',
        props: {
          compact: true,
          showPositions: false,
          showADP: false
        }
      }
    ],
    footer: [
      {
        id: 'mobile-controls',
        type: 'controls',
        props: {
          mobile: true,
          showQueue: true
        }
      }
    ]
  }
};

/**
 * Board View Layout
 * Full draft board view like FullDraftBoard component
 */
const boardLayout = {
  name: 'Full Board View',
  zones: {
    header: [
      {
        id: 'board-navbar',
        type: 'navbar',
        props: {
          minimal: true
        }
      }
    ],
    center: [
      {
        id: 'full-board',
        type: 'full-board',
        props: {
          showTeamLogos: true,
          showPositionColors: true,
          showStats: true
        }
      }
    ]
  }
};

/**
 * Development Layout
 * For testing new elements and features
 */
const developmentLayout = {
  name: 'Development',
  zones: {
    header: [
      {
        id: 'dev-navbar',
        type: 'navbar',
        props: {
          showDevTools: true
        }
      },
      {
        id: 'dev-tools',
        type: 'dev-tools',
        props: {
          showElementEditor: true,
          showPerformanceMetrics: true
        }
      }
    ],
    sidebar: [
      {
        id: 'dev-player-search',
        type: 'player-search',
        version: 'v2', // Testing new version
        props: {
          experimental: true
        }
      },
      {
        id: 'dev-player-list',
        type: 'player-list',
        props: {
          showDebugInfo: true
        }
      }
    ],
    center: [
      {
        id: 'dev-pick-cards',
        type: 'pick-cards',
        version: 'experimental',
        props: {
          enableAnimations: true,
          showDebugOverlay: true
        }
      }
    ],
    rightPanel: [
      {
        id: 'performance-monitor',
        type: 'performance-monitor',
        props: {
          showMetrics: true,
          showLogs: true
        }
      }
    ]
  }
};

/**
 * Testing Layout
 * For A/B testing different configurations
 */
const testingLayout = {
  name: 'A/B Testing',
  zones: {
    header: [
      {
        id: 'test-navbar',
        type: 'navbar',
        version: 'experimental'
      }
    ],
    center: [
      {
        id: 'test-cards',
        type: 'pick-cards',
        props: {
          // Can easily swap between different card styles
          cardStyle: process.env.NODE_ENV === 'development' ? 'experimental' : 'standard'
        }
      }
    ]
  }
};

/**
 * Simple default layout for V2 draft room
 * This matches the original design we created
 */
export const defaultLayout = {
  navbar: { type: 'navbar', props: { title: 'TopDog Draft Room' } },
  roomInfo: { type: 'room-info', props: {} },
  pickCards: { type: 'pick-cards', props: {} },
  playerList: { type: 'player-list', props: {} },
  queueManager: { type: 'queue-manager', props: {} },
  teamRoster: { type: 'team-roster', props: {} },
  draftStats: { type: 'draft-stats', props: {} },
  chat: { type: 'chat', props: {} },
  controls: { type: 'controls', props: {} },
  settings: { type: 'settings', props: {} },
  devTools: { type: 'dev-tools', props: {} },
  playerSearch: { type: 'player-search', props: {} },
  fullBoard: { type: 'full-board', props: {} },
  playerCard: { type: 'player-card', props: {} },
  rankings: { type: 'rankings', props: {} },
  draftBoard: { type: 'draft-board', props: {} },
  pickHistory: { type: 'pick-history', props: {} },
  draftTimer: { type: 'draft-timer', props: {} },
};

/**
 * Export all layout configurations
 */
export const defaultLayoutConfig = {
  standard: standardLayout,
  compact: compactLayout,
  board: boardLayout,
  development: developmentLayout,
  testing: testingLayout
};

/**
 * Get layout by name
 */
export const getLayoutConfig = (layoutName) => {
  return defaultLayoutConfig[layoutName] || defaultLayoutConfig.standard;
};

/**
 * Merge custom layout with base layout
 */
export const mergeLayoutConfig = (baseLayout, customConfig) => {
  return {
    ...baseLayout,
    zones: {
      ...baseLayout.zones,
      ...customConfig.zones
    }
  };
};

/**
 * Create custom element configuration
 */
export const createElement = (type, props = {}, options = {}) => {
  return {
    id: options.id || `${type}-${Date.now()}`,
    type,
    props,
    version: options.version || 'default',
    ...options
  };
};

/**
 * Layout presets for different scenarios
 */
export const layoutPresets = {
  // For 47k+ draft scale
  highPerformance: {
    ...standardLayout,
    zones: {
      ...standardLayout.zones,
      // Simplified for better performance
      sidebar: [
        {
          id: 'simple-search',
          type: 'player-search',
          props: { minimal: true }
        },
        {
          id: 'simple-list',
          type: 'player-list',
          props: { 
            virtualScrolling: true,
            minimal: true 
          }
        }
      ]
    }
  },
  
  // For mobile devices
  mobile: compactLayout,
  
  // For tournament administration
  admin: {
    ...standardLayout,
    zones: {
      ...standardLayout.zones,
      header: [
        ...standardLayout.zones.header,
        {
          id: 'admin-controls',
          type: 'admin-controls',
          props: {
            showRoomControls: true,
            showUserManagement: true
          }
        }
      ]
    }
  }
};