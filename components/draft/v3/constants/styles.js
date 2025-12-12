/**
 * Draft Room V3 - Style Constants
 * 
 * CSS classes, animations, and styling specifications
 * that maintain the exact visual behavior.
 */

export const CSS_CLASSES = {
  // Main layout classes
  MAIN_CONTAINER: 'min-h-screen bg-[#101927] text-white overflow-x-auto zoom-resistant',
  ZOOM_STABLE: 'zoom-stable',
  ZOOM_RESISTANT: 'zoom-resistant',

  // Horizontal picks bar
  PICKS_CONTAINER: 'relative zoom-resistant',
  PICKS_SCROLL: 'flex overflow-x-auto custom-scrollbar zoom-resistant',
  
  // Fixed elements
  ON_CLOCK_CARD: 'inline-block rounded-lg p-4 shadow-lg transition-all duration-1000 bg-white/10',
  FULL_BOARD_BTN: 'px-4 py-3 font-bold rounded-lg transition-colors text-sm text-center block',
  AUTODRAFT_CONTAINER: 'rounded-lg border-l-4 border-[#2DE2C5] bg-white/10 flex flex-col',

  // Three column layout
  THREE_COL_CONTAINER: 'flex w-[1400px]',
  QUEUE_CONTAINER: 'bg-white/10 p-4 z-30 flex flex-col rounded-lg',
  QUEUE_HEADER: 'flex items-center justify-between bg-white/10 rounded font-bold text-xs mb-2 px-3',
  QUEUE_ITEM: 'rounded cursor-move hover:bg-white/10 transition-all relative overflow-hidden',

  // Available players
  PLAYER_ROW: 'flex items-center justify-between rounded p-2.5 transition-colors player-row',
  PLAYER_ROW_HOVER: 'hover:bg-white/10',
  PLAYER_ROW_DISABLED: 'bg-red-500/20 opacity-60',

  // Position filters
  POSITION_BTN: 'px-4 py-2 rounded font-bold text-sm',
  POSITION_BTN_HOVER: 'text-white hover:bg-white/20',

  // Sorting buttons
  SORT_BTN: 'px-0 py-0 rounded font-bold text-base text-white hover:bg-white/20 transition-colors',

  // Draft actions
  DRAFT_BTN_ACTIVE: 'bg-[#60A5FA] text-[#000F55] hover:bg-[#2DE2C5] disabled:opacity-50',
  DRAFT_BTN_QUEUE: 'bg-yellow-500 text-[#000F55] hover:bg-yellow-400 opacity-50',
  QUEUE_BTN: 'px-2 py-1 rounded bg-[#2DE2C5] text-[#000F55] text-xs font-bold hover:bg-[#60A5FA] transition-colors'
};

export const ANIMATIONS = {
  // Timer countdown animations
  COUNTDOWN: {
    duration: 'duration-1000',
    easing: 'ease-out',
    transform: 'transition-all duration-1000 ease-out'
  },

  // Clock card animations  
  CLOCK_CARD: {
    transition: 'transition-all duration-1000',
    opacity: 'opacity-1'
  },

  // Player row hover effects
  PLAYER_HOVER: {
    transition: 'transition-colors',
    border: 'transition: border-color 0.2s ease'
  },

  // Button interactions
  BUTTON_HOVER: {
    transition: 'transition-colors',
    transform: 'hover:scale-105'
  },

  // Drag and drop
  DRAG_ITEM: {
    transform: 'transform transition-transform',
    shadow: 'shadow-lg'
  }
};

export const SCROLL_BEHAVIOR = {
  // Horizontal picks scrolling
  PICKS_SCROLL: {
    scrollSnapType: 'x mandatory',
    scrollBehavior: 'smooth',
    scrollPaddingLeft: '0',
    scrollPaddingRight: '0'
  },

  // Queue scrolling
  QUEUE_SCROLL: {
    overflowY: 'auto',
    minHeight: '60px',
    position: 'relative'
  },

  // Available players scrolling
  PLAYERS_SCROLL: {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 400px)'
  }
};

export const BORDERS = {
  // Standard borders
  STANDARD: '1px solid rgba(255, 255, 255, 0.1)',
  CLOCK_BORDER: '2px solid #FBBF25',
  AUTODRAFT_LEFT: '4px solid #2DE2C5',
  BUTTON_BORDER: '1px solid rgba(128, 128, 128, 0.4)',

  // Hover border colors (dynamic)
  POSITION_HOVER: 'transparent', // Will be set to position color on hover
};

export const BACKGROUNDS = {
  // Main backgrounds
  MAIN_BG: '#101927',
  OVERLAY_BG: 'bg-white/10',
  
  // Modal backgrounds
  MODAL_OVERLAY: 'bg-black bg-opacity-50',
  MODAL_CONTENT: 'bg-gray-900',

  // Button backgrounds
  FULL_BOARD_BTN: '#6b7280',
  DRAFT_BTN: '#60A5FA',
  QUEUE_BTN: '#2DE2C5',
  YELLOW_BTN: '#F59E0B'
};

export const TEXT_COLORS = {
  // Primary text
  PRIMARY: 'text-white',
  SECONDARY: 'text-gray-300',
  MUTED: 'text-gray-400',

  // Special text colors
  CLOCK_TITLE: 'text-white',
  CLOCK_PICKER: 'text-white',
  AUTODRAFT_LABEL: 'text-[#60A5FA]',
  
  // Button text
  DRAFT_BTN_TEXT: 'text-[#000F55]',
  LIGHT_BTN_TEXT: 'text-white'
};

export const FONTS = {
  // Font weights
  BOLD: 'font-bold',
  SEMIBOLD: 'font-semibold',
  NORMAL: 'font-normal',

  // Font sizes
  XS: 'text-xs',
  SM: 'text-sm', 
  BASE: 'text-base',
  LG: 'text-lg',
  XL: 'text-xl',
  XXL: 'text-2xl',

  // Special fonts
  MONO: 'font-mono' // For ADP display
};

export const SPACING = {
  // Gaps
  PICKS_GAP: '4.5px',
  COLUMN_GAP: 'gap-2',
  BUTTON_GAP: 'gap-6',

  // Padding
  CARD_PADDING: 'p-4',
  BUTTON_PADDING: 'px-4 py-2',
  SMALL_PADDING: 'px-2 py-1',

  // Margins
  CLOCK_MARGIN: 'mb-3',
  BUTTON_MARGIN: 'mb-2',
  SECTION_MARGIN: 'mb-4'
};

export const SHADOWS = {
  // Card shadows
  CARD_SHADOW: 'shadow-lg',
  MODAL_SHADOW: 'shadow-xl',
  
  // Button shadows
  BUTTON_SHADOW: 'shadow-md',
  
  // Hover shadows
  HOVER_SHADOW: 'hover:shadow-xl'
};

export const OPACITY = {
  // Standard opacity levels
  FULL: 'opacity-100',
  HIGH: 'opacity-75',
  MEDIUM: 'opacity-60',
  LOW: 'opacity-50',
  DISABLED: 'opacity-30',
  
  // Background opacities
  BG_LIGHT: 'bg-white/10',
  BG_HEAVY: 'bg-white/20'
};

// Z-index management for proper layering
export const Z_INDEX = {
  BACKGROUND: 1,
  CONTENT: 2,
  QUEUE: 30,
  MODAL_OVERLAY: 50,
  DIVIDER: 100,
  TOOLTIP: 9999
};

export default CSS_CLASSES;
