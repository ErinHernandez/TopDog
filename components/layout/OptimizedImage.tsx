/**
 * OptimizedImage Component
 * High-performance image wrapper using Next.js Image optimization
 * Features: blur placeholder, lazy loading, responsive srcSet, layout stability
 */

import Image, { ImageProps } from 'next/image';
import styles from './OptimizedImage.module.css';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  /** Blur data URL for placeholder (low-quality preview) */
  blurDataURL?: string;
  /** Whether to use placeholder skeleton during load */
  useBlur?: boolean;
  /** CSS class name for container */
  className?: string;
  /** Responsive image sizes for srcSet optimization */
  sizes?: string;
  /** Whether image loads immediately (above fold) */
  priority?: boolean;
}

/**
 * Optimized Image Component
 * Wraps Next.js Image with sensible defaults for gallery/editor use
 *
 * @param props - Image configuration
 * @returns Optimized image with lazy loading and blur support
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/gallery/photo.jpg"
 *   alt="Gallery photo"
 *   width={400}
 *   height={300}
 *   priority={false}
 *   sizes="(max-width: 768px) 100vw, 50vw"
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  blurDataURL,
  useBlur = true,
  className,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  ...props
}: OptimizedImageProps) {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Image
        src={src}
        alt={alt}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        placeholder={useBlur && blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        quality={85}
        {...props}
        style={{
          width: '100%',
          height: 'auto',
        }}
      />
    </div>
  );
}

export default OptimizedImage;
