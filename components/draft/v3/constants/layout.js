/**
 * Draft Room V3 - Layout Constants
 * 
 * These exact measurements preserve the pixel-perfect design
 * refined over months of careful adjustments.
 * 
 * DO NOT MODIFY these values without visual verification.
 */

export const LAYOUT = {
  // Main container dimensions - Fixed layout for precise control
  MAIN_CONTAINER: {
    width: '1391px',
    minWidth: '1391px',
    maxWidth: '1391px',
    backgroundColor: '#101927',
    minHeight: '1500px',
    className: 'min-h-screen bg-[#101927] text-white overflow-x-auto zoom-resistant'
  },

  // Horizontal scrolling picks bar at top
  HORIZONTAL_PICKS: {
    container: {
      position: 'relative',
      width: '100vw',
      left: '0',
      right: '0',
      marginLeft: '0',
      marginRight: '0',
      transform: 'translateZ(0)',
      paddingTop: '30px',
      paddingBottom: '30px',
      paddingLeft: '0',
      paddingRight: '0',
      backgroundColor: '#101927'
    },
    scrollArea: {
      height: '256px',
      gap: '4.5px',
      paddingRight: '0',
      paddingBottom: '0',
      transform: 'translateZ(0)',
      minWidth: '100%',
      paddingLeft: '0',
      overflowX: 'auto',
      overflowY: 'visible',
      scrollSnapType: 'x mandatory',
      scrollBehavior: 'smooth',
      display: 'flex',
      flexDirection: 'row'
    },
    card: {
      width: '158px',
      height: '70.875px',
      marginBottom: '12px',
      padding: '2px'
    },
    playerDisplay: {
      paddingBottom: '20px',
      position: 'relative'
    },
    timer: {
      transform: 'scale(0.9)',
      position: 'absolute',
      bottom: '28px',
      left: '50%',
      marginLeft: '2.5px',
      transform: 'translateX(-50%) scale(0.9)'
    }
  },

  // Fixed positioned elements (absolute positioning for pixel control)
  FIXED_ELEMENTS: {
    // "ON THE CLOCK" container
    ON_THE_CLOCK: {
      position: 'absolute',
      top: '0px',
      left: '45.5px',
      width: 288,
      minWidth: 288,
      maxWidth: 288,
      height: '100px',
      minHeight: '100px',
      maxHeight: '100px',
      border: '2px solid #FBBF25',
      className: 'inline-block rounded-lg p-4 shadow-lg transition-all duration-1000 bg-white/10'
    },

    // Full Draft Board button
    FULL_BOARD_BUTTON: {
      position: 'absolute',
      top: '118px',
      left: '45.5px',
      marginBottom: '18px',
      width: '288px',
      backgroundColor: '#6b7280',
      border: '1px solid rgba(128, 128, 128, 0.4)',
      color: '#fff'
    },

    // Autodraft container
    AUTODRAFT: {
      position: 'absolute',
      top: '182px',
      left: '45.5px',
      width: '174px',
      height: '90px',
      minHeight: '90px',
      maxHeight: '90px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderLeft: '4px solid #2DE2C5',
      className: 'rounded-lg border-l-4 border-[#2DE2C5] bg-white/10 flex flex-col'
    },

    // Picks Away Calendar
    PICKS_AWAY: {
      position: 'absolute',
      top: '182px',
      left: '215.5px',
      paddingLeft: '16px',
      paddingRight: '32px'
    },

    // Main content container
    MAIN_CONTENT: {
      position: 'fixed',
      left: '0px',
      top: '380px',
      width: '100vw',
      bottom: '0px',
      paddingLeft: '20px'
    }
  },

  // Three column layout within main content
  THREE_COLUMN: {
    container: {
      marginLeft: '36px',
      marginTop: '18px',
      width: '1400px',
      className: 'flex w-[1400px]'
    },

    // Left sidebar - Your Queue
    YOUR_QUEUE: {
      position: 'absolute',
      top: '290px',
      left: '45.5px',
      marginLeft: '-17px',
      width: '288px',
      height: '797px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      className: 'bg-white/10 p-4 z-30 flex flex-col rounded-lg',
      header: {
        className: 'flex items-center justify-between bg-white/10 rounded font-bold text-xs mb-2 px-3'
      },
      item: {
        minHeight: '45px',
        height: '50px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        className: 'rounded cursor-move hover:bg-white/10 transition-all relative overflow-hidden'
      }
    },

    // Center column - Available Players
    AVAILABLE_PLAYERS: {
      container: {
        className: 'flex-1 mx-4'
      },
      filters: {
        marginBottom: '8px'
      },
      playerRow: {
        className: 'flex items-center justify-between rounded p-2.5 transition-colors player-row',
        border: '1px solid transparent',
        transition: 'border-color 0.2s ease'
      },
      adpColumn: {
        width: '40px',
        minHeight: '32px'
      },
      rankColumn: {
        width: '40px',
        minHeight: '32px'
      }
    },

    // Right column - Your Team
    YOUR_TEAM: {
      className: 'w-80 flex flex-col flex-shrink-0'
    }
  }
};

// Position filter button specifications
export const POSITION_FILTERS = {
  button: {
    width: '80px',
    minHeight: '32px',
    borderWidth: '1px',
    className: 'px-4 py-2 rounded font-bold text-sm'
  },
  spacing: {
    marginLeft: '15px', // For ADP button
    marginLeft2: '30px' // For Rankings button
  }
};

// Gradient overlay specifications for player cards
export const GRADIENTS = {
  // First gradient (0px to 135px)
  FIRST_GRADIENT_WIDTH: 135,
  
  // Second gradient (135px to 175px)  
  SECOND_GRADIENT_WIDTH: 40,
  
  // Color stop calculations
  COLOR_STOPS: 200, // 200 stops over 40px = 0.2px intervals
  
  // Divider line
  DIVIDER: {
    width: '1px',
    height: '130%',
    position: 'absolute',
    left: '61px',
    top: '-15%',
    zIndex: 100
  }
};

// Exact measurements for various UI elements
export const MEASUREMENTS = {
  // Button margins and positioning
  AUTODRAFT_LABEL: {
    marginTop: '8px',
    marginLeft: '12px'
  },
  AUTODRAFT_CONTENT: {
    marginTop: '8px',
    marginLeft: '12px',
    marginRight: '12px'
  },
  AUTODRAFT_PLAYER: {
    marginTop: '-12px'
  },

  // Clock display positioning
  CLOCK_TITLE: {
    marginTop: '-0.5em'
  },
  CLOCK_CONTENT: {
    marginLeft: '-4px'
  },

  // Player name truncation
  PLAYER_NAME: {
    marginTop: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },

  // Team display
  TEAM_POSITION: {
    marginTop: '4px',
    whiteSpace: 'nowrap'
  }
};

export default LAYOUT;
