import { OverlayPattern } from './types';
import { getFlagUrl } from './flags';

interface Position {
  x: number;
  y: number;
}

export function generateOverlayStyle(
  imageUrl: string,
  pattern: OverlayPattern,
  size: number,
  position?: Position
): React.CSSProperties {
  const sizePercent = `${size}%`;

  switch (pattern) {
    case 'single':
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: sizePercent,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };

    case 'single-flipped':
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: sizePercent,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transform: 'rotate(180deg)',
      };

    case 'tiled':
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: `${Math.max(size * 0.3, 10)}%`,
        backgroundRepeat: 'repeat',
      };

    case 'scattered':
      return generateScatteredStyle(imageUrl, size);

    case 'placement':
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: sizePercent,
        backgroundPosition: `${position?.x ?? 50}% ${position?.y ?? 50}%`,
        backgroundRepeat: 'no-repeat',
      };

    default:
      return {};
  }
}

function generateScatteredStyle(imageUrl: string, size: number): React.CSSProperties {
  const positions = ['10% 15%', '75% 25%', '40% 60%', '85% 70%', '20% 85%', '60% 10%'];
  const itemSize = `${Math.max(size * 0.25, 8)}%`;

  return {
    backgroundImage: positions.map(() => `url(${imageUrl})`).join(', '),
    backgroundPosition: positions.join(', '),
    backgroundSize: positions.map(() => itemSize).join(', '),
    backgroundRepeat: 'no-repeat',
  };
}

export function generateBackgroundStyle(
  backgroundType: 'none' | 'flag' | 'solid',
  flagCode?: string,
  solidColor?: string
): React.CSSProperties {
  switch (backgroundType) {
    case 'flag':
      if (!flagCode) return {};
      const flagUrl = getFlagUrl(flagCode);
      return {
        backgroundImage: `url(${flagUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };

    case 'solid':
      return {
        backgroundColor: solidColor ?? '#ffffff',
      };

    case 'none':
    default:
      return {};
  }
}
