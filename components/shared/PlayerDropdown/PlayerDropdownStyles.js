/**
 * PlayerDropdownStyles - Shared Styling Constants
 * 
 * Maintains identical styling to the draft room player dropdown
 * across all usage contexts.
 */

import { createTeamGradient } from '../../../lib/gradientUtils';

export const DROPDOWN_STYLES = {
  // Main player row (clickable)
  PLAYER_ROW: {
    className: "flex items-center active:bg-white/5 hover:bg-white/3 relative overflow-hidden border-b border-white/10 cursor-pointer transition-colors duration-200",
    style: {
      minHeight: '40px',
      height: '40px',
      backgroundColor: '#1f2833',
      zIndex: 1,
    }
  },

  // Expanded dropdown content
  DROPDOWN_CONTENT: {
    className: "relative w-full rounded-lg overflow-hidden",
    getStyle: (player) => ({
      zIndex: 9998,
      background: createTeamGradient(player.team).firstGradient,
      border: `2px solid ${createTeamGradient(player.team).primaryColor}`,
      marginTop: '4px',
      marginBottom: '14px',
      minHeight: '200px',
    })
  },

  // Player name styling
  PLAYER_NAME: {
    className: "font-medium text-white",
    style: {
      fontSize: '13px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      marginLeft: '-20px'
    }
  },

  // Player info (team, bye week)
  PLAYER_INFO: {
    className: "text-xs text-gray-400",
    style: {
      fontSize: '11.5px',
      marginTop: '1px',
      marginLeft: '-20px',
      display: 'flex',
      alignItems: 'center'
    }
  },

  // Rank column
  RANK_COLUMN: {
    className: "text-center text-xs font-sans text-gray-400 relative z-10",
    style: {
      fontSize: '13px',
      width: '28px',
      paddingLeft: '4px',
      paddingRight: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative'
    }
  },

  // ADP display
  ADP_DISPLAY: {
    className: "text-center",
    style: {
      minWidth: '45px'
    },
    headerStyle: {
      fontSize: '12px'
    },
    valueStyle: {
      fontSize: '14px'
    }
  },

  // Projection display
  PROJECTION_DISPLAY: {
    className: "text-center",
    style: {
      minWidth: '40px'
    },
    headerStyle: {
      fontSize: '12px'
    },
    valueStyle: {
      fontSize: '14px'
    }
  },

  // Draft button
  DRAFT_BUTTON: {
    className: "py-2 rounded text-xs font-bold",
    getStyle: (isMyTurn) => ({
      backgroundColor: isMyTurn ? '#ef4444' : '#6B7280',
      color: '#000000',
      opacity: isMyTurn ? 1 : 0.7,
      paddingLeft: '17px',
      paddingRight: '17px',
      zIndex: 10
    })
  },

  // Queue button
  QUEUE_BUTTON: {
    className: "py-1 rounded text-xs font-bold transition-colors",
    style: {
      backgroundColor: '#2DE2C5',
      color: '#000F55',
      paddingLeft: '8px',
      paddingRight: '8px',
      zIndex: 10
    }
  },

  // Stats table headers
  STATS_HEADER: {
    className: "relative px-0 text-gray-400 font-medium text-base",
    style: {
      height: '36px',
      paddingTop: '8px',
      paddingBottom: '8px',
      fontSize: '14px'
    }
  },

  // Stats table rows
  STATS_ROW: {
    className: "text-white text-sm flex items-center relative",
    style: {
      height: '24px',
      paddingTop: '0px',
      paddingBottom: '0px',
      fontSize: '13px'
    }
  }
};

export const DROPDOWN_ANIMATIONS = {
  // Smooth expand/collapse
  EXPAND: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2, ease: 'easeInOut' }
  },

  // Hover effects
  HOVER: {
    scale: 1.01,
    transition: { duration: 0.1 }
  }
};

export const DROPDOWN_DIMENSIONS = {
  // Row heights
  PLAYER_ROW_HEIGHT: 40,
  EXPANDED_BASE_HEIGHT: 100,
  STATS_ROW_HEIGHT: 12,
  STATS_HEADER_HEIGHT: 18,

  // Widths
  RANK_COLUMN_WIDTH: '10%',
  PLAYER_INFO_WIDTH: '60%',
  ACTIONS_WIDTH: '30%',

  // Spacing
  MARGIN_TOP: 14,
  MARGIN_BOTTOM: 14,
  PADDING_HORIZONTAL: 12,
  PADDING_VERTICAL: 8
};

// Position-specific styling
export const POSITION_STYLES = {
  QB: {
    borderColor: '#F472B6',
    backgroundColor: 'rgba(244, 114, 182, 0.1)'
  },
  RB: {
    borderColor: '#0fba80',
    backgroundColor: 'rgba(15, 186, 128, 0.1)'
  },
  WR: {
    borderColor: '#4285F4',
    backgroundColor: 'rgba(66, 133, 244, 0.1)'
  },
  TE: {
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.1)'
  }
};

// Mobile-specific adjustments
export const MOBILE_ADJUSTMENTS = {
  TOUCH_TARGET_MIN: '44px',
  FONT_SIZE_ADJUSTMENT: 1.1, // Slightly larger for mobile
  PADDING_ADJUSTMENT: 1.2,   // More padding for touch
};

// Context-specific overrides
export const CONTEXT_OVERRIDES = {
  // Draft room context
  DRAFT_ROOM: {
    showDraftButton: true,
    showQueueButton: true,
    showFullStats: true,
    enableHover: true
  },

  // Profile/team management context
  TEAM_MANAGEMENT: {
    showDraftButton: false,
    showQueueButton: false,
    showFullStats: false,
    enableHover: true,
    // Trades are never allowed
  },

  // Rankings page context
  RANKINGS: {
    showDraftButton: false,
    showQueueButton: false,
    showFullStats: true,
    enableHover: false,
    showRankingControls: true
  },

  // Mobile contexts
  MOBILE_DRAFT: {
    showDraftButton: true,
    showQueueButton: true,
    showFullStats: true,
    enableHover: true,
    fontSize: 'mobile',
    touchOptimized: true
  }
};
