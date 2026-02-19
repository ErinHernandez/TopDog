/**
 * MCM (Mid-Century Modern) design tokens for dev-only surfaces:
 * TopDog Design Catalog, wireframes, and extraction tooling.
 *
 * NOT used by production app UI. Production tokens live in
 * styles/tokens.css and components/vx2/core/constants/colors.ts.
 */

export const MCM = {
  bg: '#0A0A0B',
  surface: '#141416',
  line: '#2A2A2E',
  lineActive: '#4A4A50',
  text: '#F0F0F0',
  textMuted: '#888888',
  textDim: '#555555',
  orange: '#FF6B4A',
  teal: '#4ECDC4',
  gold: '#F4B942',
  coral: '#FF8A80',
  sage: '#95D5B2',
} as const;

export type MCMCategory = 'auth' | 'main' | 'draft' | 'tournament' | 'settings';

export interface ScreenDefinition {
  id: string;
  name: string;
  description: string;
  category: MCMCategory;
}

export const SCREENS: ScreenDefinition[] = [
  { id: 'login', name: 'Login', description: 'User authentication', category: 'auth' },
  { id: 'signup', name: 'Sign Up', description: 'New user registration', category: 'auth' },
  { id: 'lobby', name: 'Lobby', description: 'Contest browser', category: 'main' },
  { id: 'myteams', name: 'My Teams', description: 'User teams list', category: 'main' },
  { id: 'draftroom', name: 'Draft Room', description: 'Live drafting', category: 'draft' },
  { id: 'profile', name: 'Profile', description: 'User profile', category: 'settings' },
  { id: 'settings', name: 'Settings', description: 'App settings', category: 'settings' },
];

export function getColorForType(type: string): string {
  switch (type.toLowerCase()) {
    case 'button': return MCM.orange;
    case 'textfield':
    case 'securefield': return MCM.teal;
    case 'text':
    case 'label': return MCM.gold;
    case 'image':
    case 'icon': return MCM.coral;
    case 'tab':
    case 'tabbar': return MCM.sage;
    case 'card': return MCM.teal;
    case 'progress': return MCM.orange;
    case 'badge': return MCM.gold;
    case 'list': return MCM.lineActive;
    case 'link': return MCM.textMuted;
    case 'checkbox': return MCM.lineActive;
    case 'segmented': return MCM.sage;
    case 'toggle': return MCM.teal;
    default: return MCM.lineActive;
  }
}

export function getCategoryColor(category: MCMCategory): string {
  switch (category) {
    case 'auth': return MCM.coral;
    case 'main': return MCM.teal;
    case 'draft': return MCM.orange;
    case 'tournament': return MCM.gold;
    case 'settings': return MCM.sage;
    default: return MCM.lineActive;
  }
}
