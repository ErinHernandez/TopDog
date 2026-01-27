/**
 * Mobile Components Index
 * 
 * Central export for all mobile components organized by category
 * 
 * @deprecated This module is deprecated. Use components from @/components/vx2/ instead.
 * See docs/MOBILE_UI_OWNERSHIP.md for migration guide.
 * 
 * Migration timeline:
 * - Q2 2026: Identify all usages
 * - Q3 2026: Migrate to vx2
 * - Q4 2026: Remove this directory
 */

// Layout
export { default as MobileLayout } from './MobileLayout';
export { MobileHeader, MobileScrollContent, MobileCenteredContent, MobileLoading, MobileComingSoon } from './MobileLayout';
export type { 
  MobileLayoutProps, 
  MobileHeaderProps, 
  MobileScrollContentProps, 
  MobileCenteredContentProps, 
  MobileLoadingProps, 
  MobileComingSoonProps 
} from './MobileLayout';
export { default as MobileFooter } from './MobileFooter';
export type { MobileTabId, MobileFooterProps } from './MobileFooter';

// Tabs
export { LobbyTab, LiveDraftsTab, MyTeamsTab, ExposureTab, ProfileTab } from './tabs';

// Modals
export { TournamentRulesModal } from './modals';

// Shared Components
export { 
  MobilePhoneFrame, 
  MobilePhoneContent,
  MobileFooterBase, 
  FOOTER_ICONS,
  PaymentMethodIcon,
  CardBrandIcon,
  CardBrandGrid,
} from './shared';

// Page Content Components
export { 
  PaymentPageContent, 
  ProfileCustomizationContent,
  DepositHistoryContent,
  RankingsContent,
  MobileHomeContent,
} from './pages';

// Standalone Components
export { default as DraftBoardModal } from './DraftBoardModal';
export { default as ExposureReportMobile } from './ExposureReportMobile';
export { default as PlayerRankingsMobile } from './PlayerRankingsMobile';
export { default as TournamentCardMobile } from './TournamentCardMobile';
export { default as TournamentModalMobile } from './TournamentModalMobile';
