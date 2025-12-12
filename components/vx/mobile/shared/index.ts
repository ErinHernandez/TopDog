/**
 * VX Mobile Shared Components
 * 
 * Centralized exports for shared mobile components
 */

// Phone Frame
export { default as MobilePhoneFrameVX } from './MobilePhoneFrameVX';
export { MobilePhoneContentVX } from './MobilePhoneFrameVX';
export type { MobilePhoneFrameVXProps, MobilePhoneContentVXProps } from './MobilePhoneFrameVX';

// Layout
export { default as MobileLayoutVX } from './MobileLayoutVX';
export { 
  MobileScrollContentVX, 
  MobileCenteredContentVX,
  MobileLoadingVX,
  MobileComingSoonVX
} from './MobileLayoutVX';
export type { MobileLayoutVXProps, AppTab } from './MobileLayoutVX';

// Header (Legacy)
export { default as MobileHeaderVX } from './MobileHeaderVX';
export type { MobileHeaderVXProps } from './MobileHeaderVX';

// App Header (Production-Grade - Preferred)
export { default as AppHeaderVX, APP_HEADER_CONSTANTS } from './AppHeaderVX';
export type { AppHeaderVXProps } from './AppHeaderVX';

// Footer (App Navigation)
export { default as MobileFooterAppVX } from './MobileFooterAppVX';
export type { MobileFooterAppVXProps } from './MobileFooterAppVX';

