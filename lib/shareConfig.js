/**
 * Share Configuration System
 * 
 * Centralized configuration for different types of shareable content
 * across the mobile application
 */

// Base share data generator
const createShareData = (type, data = {}) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://topdog.dog';
  
  switch (type) {
    case 'draftBoard':
      return {
        title: `${data.teamName || 'My'} Draft Board - TopDog.dog`,
        text: `Check out this draft board from ${data.teamName || 'TopDog'}! See the picks, strategy, and analysis.`,
        url: data.url || `${baseUrl}/draft-board/${data.draftId || ''}`,
        hashtags: ['TopDog', 'DraftBoard', 'FantasyFootball', 'BestBall']
      };

    case 'team':
      return {
        title: `${data.teamName || 'My Team'} - TopDog.dog`,
        text: `Check out my fantasy team "${data.teamName}" with ${data.playerCount || 'amazing'} players! Built for the ${data.tournament || 'TopDog International'}.`,
        url: data.url || `${baseUrl}/teams/${data.teamId || ''}`,
        hashtags: ['TopDog', 'FantasyTeam', 'BestBall', 'FantasyFootball']
      };

    case 'roster':
      return {
        title: `${data.teamName || 'My Team'} Roster - TopDog.dog`,
        text: data.rosterText || `Check out my "${data.teamName}" roster! 🏈\n\nFeaturing ${data.playerCount || 'amazing'} players in the ${data.tournament || 'TopDog International'} tournament.`,
        url: data.url || `${baseUrl}/teams/${data.teamId || ''}`,
        hashtags: ['TopDog', 'Roster', 'FantasyTeam', 'BestBall']
      };

    case 'player':
      return {
        title: `${data.playerName || 'Player'} Stats - TopDog.dog`,
        text: `Check out ${data.playerName}'s fantasy stats and projections! ${data.position} for ${data.team}.`,
        url: data.url || `${baseUrl}/players/${data.playerId || ''}`,
        hashtags: ['TopDog', 'PlayerStats', 'FantasyFootball', data.playerName?.replace(/\s+/g, '')]
      };

    case 'exposureReport':
      return {
        title: 'My Exposure Report - TopDog.dog',
        text: `Check out my player exposure across ${data.teamCount || 'multiple'} teams! See which players I'm targeting most.`,
        url: data.url || `${baseUrl}/exposure`,
        hashtags: ['TopDog', 'ExposureReport', 'FantasyStrategy', 'BestBall']
      };

    case 'tournament':
      return {
        title: `${data.tournamentName || 'Tournament'} - TopDog.dog`,
        text: `Join me in the ${data.tournamentName || 'TopDog International'}! ${data.entryFee ? `$${data.entryFee} entry` : 'Free to play'} with ${data.totalPrize ? `$${data.totalPrize} in prizes` : 'amazing prizes'}!`,
        url: data.url || `${baseUrl}/tournaments/${data.tournamentId || ''}`,
        hashtags: ['TopDog', 'Tournament', 'FantasyFootball', 'BestBall']
      };

    case 'draft':
      return {
        title: 'Live Draft - TopDog.dog',
        text: `I'm drafting live right now! Come watch the action in ${data.tournamentName || 'the TopDog International'}.`,
        url: data.url || `${baseUrl}/draft/${data.draftId || ''}`,
        hashtags: ['TopDog', 'LiveDraft', 'FantasyFootball', 'BestBall']
      };

    case 'achievement':
      return {
        title: `Achievement Unlocked - TopDog.dog`,
        text: `I just ${data.achievement || 'achieved something awesome'} on TopDog! ${data.description || ''}`,
        url: data.url || baseUrl,
        hashtags: ['TopDog', 'Achievement', 'FantasyFootball', 'BestBall']
      };

    case 'leaderboard':
      return {
        title: `Leaderboard - TopDog.dog`,
        text: `Check out the current leaderboard! ${data.position ? `I'm ranked #${data.position}` : 'See where you stand'} in ${data.tournamentName || 'the competition'}.`,
        url: data.url || `${baseUrl}/leaderboard/${data.tournamentId || ''}`,
        hashtags: ['TopDog', 'Leaderboard', 'FantasyFootball', 'Competition']
      };

    case 'app':
      return {
        title: 'TopDog.dog - Best Ball Fantasy Football',
        text: 'Join me on TopDog.dog for the ultimate best ball fantasy football experience! Draft once, compete all season.',
        url: baseUrl,
        hashtags: ['TopDog', 'FantasyFootball', 'BestBall', 'DraftKings']
      };

    default:
      return {
        title: data.title || 'TopDog.dog',
        text: data.text || 'Check this out on TopDog.dog!',
        url: data.url || baseUrl,
        hashtags: ['TopDog']
      };
  }
};

// Share type configurations with specific behaviors
export const SHARE_TYPES = {
  DRAFT_BOARD: 'draftBoard',
  TEAM: 'team',
  ROSTER: 'roster',
  PLAYER: 'player',
  EXPOSURE_REPORT: 'exposureReport',
  TOURNAMENT: 'tournament',
  DRAFT: 'draft',
  ACHIEVEMENT: 'achievement',
  LEADERBOARD: 'leaderboard',
  APP: 'app',
  CUSTOM: 'custom',
  // Image share types (for analytics tracking)
  DRAFT_BOARD_IMAGE: 'draftBoardImage',
  ROSTER_IMAGE: 'rosterImage',
};

// Platform-specific share configurations
export const PLATFORM_CONFIGS = {
  twitter: {
    maxTextLength: 280,
    hashtagLimit: 2,
    urlShortening: true
  },
  facebook: {
    maxTextLength: 63206,
    hashtagLimit: 30,
    urlShortening: false
  },
  instagram: {
    maxTextLength: 2200,
    hashtagLimit: 30,
    urlShortening: false
  },
  linkedin: {
    maxTextLength: 3000,
    hashtagLimit: 3,
    urlShortening: false
  },
  native: {
    maxTextLength: null,
    hashtagLimit: null,
    urlShortening: false
  }
};

// Main share data generator function
export const generateShareData = (type, data = {}, platform = 'native') => {
  const shareData = createShareData(type, data);
  const platformConfig = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.native;
  
  // Apply platform-specific modifications
  if (platformConfig.maxTextLength && shareData.text.length > platformConfig.maxTextLength) {
    shareData.text = shareData.text.substring(0, platformConfig.maxTextLength - 3) + '...';
  }
  
  if (platformConfig.hashtagLimit && shareData.hashtags) {
    shareData.hashtags = shareData.hashtags.slice(0, platformConfig.hashtagLimit);
  }
  
  // Add hashtags to text for platforms that support them
  if (platform === 'twitter' || platform === 'instagram') {
    const hashtags = shareData.hashtags?.map(tag => `#${tag}`).join(' ') || '';
    if (hashtags) {
      const maxTextWithHashtags = platformConfig.maxTextLength - hashtags.length - 1;
      if (shareData.text.length > maxTextWithHashtags) {
        shareData.text = shareData.text.substring(0, maxTextWithHashtags - 3) + '...';
      }
      shareData.text += ` ${hashtags}`;
    }
  }
  
  return shareData;
};

// Helper function to get share URL for specific platforms
export const getPlatformShareUrl = (shareData, platform) => {
  const encodedText = encodeURIComponent(shareData.text);
  const encodedUrl = encodeURIComponent(shareData.url);
  const encodedTitle = encodeURIComponent(shareData.title);
  
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`;
    
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    
    case 'reddit':
      return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    
    default:
      return shareData.url;
  }
};

// Analytics tracking for shares
export const trackShare = (type, platform, success = true) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share', {
      content_type: type,
      method: platform,
      success: success
    });
  }
  
  // Console log for development
  console.log(`Share tracked: ${type} via ${platform} - ${success ? 'success' : 'failed'}`);
};

export default {
  SHARE_TYPES,
  generateShareData,
  getPlatformShareUrl,
  trackShare
};
