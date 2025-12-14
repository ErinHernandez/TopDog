# Mobile Share System Documentation

## Overview

The mobile share system provides a comprehensive, reusable architecture for sharing different types of content across the TopDog mobile application. The system includes native mobile sharing, platform-specific sharing, and clipboard fallbacks.

## Architecture Components

### 1. ShareButton Component (`/components/mobile/ShareButton.js`)
- **Purpose**: Simple, reusable share button matching the uploaded design
- **Features**: Native sharing, clipboard fallback, loading states, customizable styling
- **Icon**: Simple upload arrow (box with arrow pointing up) matching the provided image

### 2. ShareModal Component (`/components/mobile/ShareModal.js`)
- **Purpose**: Full-featured sharing modal with multiple platform options
- **Features**: Native sharing, social media platforms, copy link, preview
- **Platforms**: Twitter, Facebook, WhatsApp, LinkedIn, plus native sharing

### 3. Share Configuration (`/lib/shareConfig.js`)
- **Purpose**: Centralized configuration for different shareable content types
- **Features**: Pre-configured share data for teams, players, tournaments, etc.
- **Platform optimization**: Text length limits, hashtag handling, URL formatting

### 4. useShare Hook (`/hooks/useShare.js`)
- **Purpose**: React hook for easy share functionality integration
- **Features**: Quick share, modal management, platform-specific sharing

## Usage Examples

### Basic Share Button
```jsx
import ShareButton from '../components/mobile/ShareButton';

<ShareButton
  shareData={{
    title: "My Team - TopDog.dog",
    text: "Check out my fantasy team!",
    url: "https://topdog.dog/teams/123"
  }}
  size="md"
  variant="default"
/>
```

### Using Share Types
```jsx
import { SHARE_TYPES, generateShareData } from '../lib/shareConfig';

const shareData = generateShareData(SHARE_TYPES.TEAM, {
  teamName: "My Championship Team",
  teamId: "123",
  playerCount: 18,
  tournament: "TopDog International"
});
```

### Share Modal
```jsx
import ShareModal from '../components/mobile/ShareModal';

<ShareModal
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
  shareType={SHARE_TYPES.TEAM}
  shareData={{ teamName: "My Team", teamId: "123" }}
  title="Share Team"
/>
```

### Using the Hook
```jsx
import { useShare } from '../hooks/useShare';
import { SHARE_TYPES } from '../lib/shareConfig';

const { quickShare, openShareModal } = useShare();

// Quick share (native or clipboard)
const handleQuickShare = async () => {
  const result = await quickShare(SHARE_TYPES.TEAM, {
    teamName: "My Team",
    teamId: "123"
  });
  
  if (result.success) {
    console.log(`Shared via ${result.method}`);
  }
};

// Open full modal
const handleModalShare = () => {
  openShareModal(SHARE_TYPES.TEAM, {
    teamName: "My Team",
    teamId: "123"
  });
};
```

## Share Types Available

### Pre-configured Types
- `SHARE_TYPES.TEAM` - Fantasy teams
- `SHARE_TYPES.PLAYER` - Individual players
- `SHARE_TYPES.DRAFT_BOARD` - Draft boards
- `SHARE_TYPES.TOURNAMENT` - Tournaments
- `SHARE_TYPES.EXPOSURE_REPORT` - Exposure reports
- `SHARE_TYPES.DRAFT` - Live drafts
- `SHARE_TYPES.ACHIEVEMENT` - Achievements
- `SHARE_TYPES.LEADERBOARD` - Leaderboards
- `SHARE_TYPES.APP` - General app sharing

### Custom Share Data
```jsx
// For custom content not covered by pre-configured types
<ShareButton
  shareData={{
    title: "Custom Title",
    text: "Custom description",
    url: "https://custom-url.com",
    hashtags: ['TopDog', 'Custom']
  }}
/>
```

## Button Variants and Sizes

### Sizes
- `sm` - Small (24x24px)
- `md` - Medium (32x32px) - Default
- `lg` - Large (40x40px)
- `xl` - Extra Large (48x48px)

### Variants
- `default` - Gray with hover (matches existing UI)
- `primary` - Blue accent
- `secondary` - Subtle gray
- `accent` - Teal accent
- `pill` - Button with background and padding
- `outline` - Outlined button style

## Mobile Optimizations

### Native Sharing
- Automatically detects and uses `navigator.share()` when available
- Falls back to clipboard copy with user feedback
- Handles share cancellation gracefully

### Touch-Friendly Design
- Minimum 44px touch targets
- Proper spacing and padding
- Visual feedback on interaction

### Scrollbar Hiding
- All scrollable areas hide scrollbars on mobile [[memory:9102895]]
- Maintains scroll functionality while keeping clean UI

## Platform-Specific Features

### Twitter
- Character limit handling (280 chars)
- Hashtag optimization (max 2)
- URL shortening consideration

### Facebook
- Open Graph optimization
- Large text limit support
- Rich preview generation

### WhatsApp/Telegram
- Message format optimization
- URL and text combination

### Native Mobile
- iOS/Android share sheet integration
- App-specific sharing options
- System-level share targets

## Implementation in Existing Components

### My Teams Mobile Section
The share system has been implemented in:
1. **Team Cards**: Small share buttons on each team card
2. **Team Detail View**: Medium share button in header
3. **Share Data**: Includes team name, player count, tournament info

### Integration Pattern
```jsx
// 1. Import components
import ShareButton from '../components/mobile/ShareButton';
import { SHARE_TYPES } from '../lib/shareConfig';

// 2. Add to component
<ShareButton
  shareData={{
    title: `${team.name} - TopDog.dog`,
    text: `Check out my fantasy team "${team.name}" with ${playerCount} players!`,
    url: `${window.location.origin}/teams/${team.id}`,
    teamName: team.name,
    teamId: team.id,
    playerCount: playerCount,
    tournament: 'TopDog International'
  }}
  size="sm"
  variant="default"
  onShareSuccess={(method) => console.log(`Shared via ${method}`)}
  onShareError={(error) => console.error('Share failed:', error)}
/>
```

## Future Enhancements

### Planned Features
1. **Analytics Integration**: Track share success/failure rates
2. **Deep Linking**: Better URL generation for app-to-app sharing
3. **Image Sharing**: Support for sharing screenshots/images
4. **Custom Platforms**: Easy addition of new sharing platforms
5. **Offline Support**: Queue shares when offline

### Extension Points
- Add new share types in `shareConfig.js`
- Add new platforms in `ShareModal.js`
- Create specialized share buttons for specific content types
- Integrate with analytics platforms for tracking

## Best Practices

### When to Use Each Component
- **ShareButton**: Quick, inline sharing without modal
- **ShareModal**: When you want to give users multiple sharing options
- **useShare Hook**: When you need programmatic control over sharing

### Performance Considerations
- Share buttons are lightweight and can be used liberally
- Share modals are lazy-loaded and only render when open
- Share data generation is optimized for mobile performance

### Accessibility
- All buttons include proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast support

This system provides a solid foundation for sharing across the mobile app while maintaining consistency and providing excellent user experience.
