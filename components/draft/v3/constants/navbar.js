/**
 * Draft Room V3 - Navbar Constants
 * 
 * Draft room navbar has tournament-specific theming that changes
 * year to year. This centralizes all navbar styling for easy updates.
 */

/**
 * Current tournament navbar theme
 * Update these values for new tournaments/years
 */
export const CURRENT_TOURNAMENT_NAVBAR = {
  // Background styling
  background: {
    image: 'url(/texture_reduced_highlights.png)',
    repeat: 'no-repeat',
    position: 'center center',
    size: 'cover',
    fallbackColor: '#5f7a7a', // Teal-gray fallback
  },
  
  // Dimensions and positioning
  layout: {
    position: 'relative',
    minWidth: '100vw',
    width: '100vw',
    overflow: 'visible',
    marginLeft: '0'
  },
  
  // Text and element colors
  colors: {
    text: 'text-black',
    shadow: 'shadow-lg'
  }
};

/**
 * Easy tournament switching - just update ACTIVE_TOURNAMENT
 */
export const TOURNAMENT_THEMES = {
  // Current 2024 theme
  MAIN_2024: {
    name: '2024 Main Tournament',
    background: {
      image: 'url(/texture_reduced_highlights.png)',
      repeat: 'no-repeat',
      position: 'center center',
      size: 'cover',
      fallbackColor: '#5f7a7a'
    },
    colors: {
      text: 'text-black',
      shadow: 'shadow-lg'
    }
  },
  
  // Example future tournament themes
  SPRING_2025: {
    name: '2025 Spring Tournament',
    background: {
      image: 'url(/spring_2025_texture.png)',
      repeat: 'no-repeat', 
      position: 'center center',
      size: 'cover',
      fallbackColor: '#4a90e2' // Spring blue
    },
    colors: {
      text: 'text-white',
      shadow: 'shadow-xl'
    }
  },
  
  FALL_2025: {
    name: '2025 Fall Tournament',
    background: {
      image: 'url(/fall_2025_texture.png)',
      repeat: 'no-repeat',
      position: 'center center', 
      size: 'cover',
      fallbackColor: '#8b4513' // Fall brown
    },
    colors: {
      text: 'text-cream',
      shadow: 'shadow-lg'
    }
  },
  
  // Special tournament example
  PLAYOFFS_2024: {
    name: '2024 Playoffs Special',
    background: {
      image: 'url(/playoffs_gold_texture.png)',
      repeat: 'no-repeat',
      position: 'center center',
      size: 'cover', 
      fallbackColor: '#ffd700' // Gold
    },
    colors: {
      text: 'text-black',
      shadow: 'shadow-2xl'
    }
  }
};

/**
 * ACTIVE TOURNAMENT - Change this to switch themes
 * This is the single point of control for tournament theming
 */
export const ACTIVE_TOURNAMENT = TOURNAMENT_THEMES['MAIN_2024'];

/**
 * Generate navbar styles for current tournament
 */
export const NAVBAR_STYLES = {
  header: {
    className: 'w-full z-50',
    style: {
      backgroundImage: ACTIVE_TOURNAMENT.background.image,
      backgroundRepeat: ACTIVE_TOURNAMENT.background.repeat,
      backgroundPosition: ACTIVE_TOURNAMENT.background.position,
      backgroundSize: ACTIVE_TOURNAMENT.background.size,
      backgroundColor: ACTIVE_TOURNAMENT.background.fallbackColor,
      position: 'relative',
      minWidth: '100vw',
      overflow: 'visible'
    }
  },
  
  nav: {
    className: `${ACTIVE_TOURNAMENT.colors.shadow} ${ACTIVE_TOURNAMENT.colors.text}`,
    style: {
      backgroundImage: ACTIVE_TOURNAMENT.background.image,
      backgroundRepeat: ACTIVE_TOURNAMENT.background.repeat,
      backgroundPosition: ACTIVE_TOURNAMENT.background.position,
      backgroundSize: ACTIVE_TOURNAMENT.background.size,
      width: '100vw',
      marginLeft: '0',
      position: 'relative',
      minWidth: '100vw',
      overflow: 'visible'
    }
  }
};

/**
 * Dropdown section backgrounds (special About section styling)
 */
export const DROPDOWN_STYLES = {
  aboutSection: {
    title: {
      className: 'text-xs font-semibold mb-2',
      style: {
        position: 'relative',
        overflow: 'visible',
        background: 'url(/wr_blue.png) no-repeat center center',
        backgroundSize: 'cover',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }
    }
  }
};

/**
 * Helper functions for tournament management
 */
export const TOURNAMENT_HELPERS = {
  /**
   * Switch to a different tournament theme
   */
  switchTournament: (tournamentKey) => {
    if (TOURNAMENT_THEMES[tournamentKey]) {
      // In a real app, this would update context/state
      console.log(`Switching to tournament: ${TOURNAMENT_THEMES[tournamentKey].name}`);
      return TOURNAMENT_THEMES[tournamentKey];
    }
    console.warn(`Tournament theme '${tournamentKey}' not found`);
    return ACTIVE_TOURNAMENT;
  },
  
  /**
   * Get all available tournament themes
   */
  getAvailableThemes: () => {
    return Object.keys(TOURNAMENT_THEMES).map(key => ({
      key,
      name: TOURNAMENT_THEMES[key].name
    }));
  },
  
  /**
   * Validate tournament theme structure
   */
  validateTheme: (theme) => {
    const required = ['name', 'background', 'colors'];
    const backgroundRequired = ['image', 'repeat', 'position', 'size', 'fallbackColor'];
    const colorsRequired = ['text', 'shadow'];
    
    const hasRequired = required.every(key => theme[key]);
    const hasBackgroundKeys = backgroundRequired.every(key => theme.background?.[key]);
    const hasColorKeys = colorsRequired.every(key => theme.colors?.[key]);
    
    return hasRequired && hasBackgroundKeys && hasColorKeys;
  },
  
  /**
   * Get current tournament info
   */
  getCurrentTournament: () => {
    return {
      name: ACTIVE_TOURNAMENT.name,
      fallbackColor: ACTIVE_TOURNAMENT.background.fallbackColor,
      textColor: ACTIVE_TOURNAMENT.colors.text
    };
  }
};

/**
 * Development helpers for testing themes
 */
export const DEV_NAVBAR_HELPERS = {
  /**
   * Preview all tournament themes (development only)
   */
  previewAllThemes: () => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🎨 Tournament Navbar Themes');
      Object.entries(TOURNAMENT_THEMES).forEach(([key, theme]) => {
        console.log(`${key}:`, {
          name: theme.name,
          background: theme.background.fallbackColor,
          textColor: theme.colors.text
        });
      });
      console.groupEnd();
    }
  },
  
  /**
   * Test theme switching
   */
  testThemeSwitch: (tournamentKey) => {
    if (process.env.NODE_ENV === 'development') {
      const theme = TOURNAMENT_HELPERS.switchTournament(tournamentKey);
      console.log(`🔄 Theme switched to: ${theme.name}`);
      return theme;
    }
  }
};

export default NAVBAR_STYLES;
