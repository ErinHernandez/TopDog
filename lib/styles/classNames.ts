/**
 * Class Name Utilities
 *
 * Utilities for conditionally joining class names.
 * Similar to the popular `clsx` or `classnames` packages but lightweight.
 *
 * @example
 * // Basic usage
 * cn('base', 'extra') => 'base extra'
 *
 * // Conditional with boolean
 * cn('base', isActive && 'active') => 'base active' or 'base'
 *
 * // Conditional with object
 * cn('base', { active: isActive, disabled: isDisabled })
 *
 * // With CSS Modules
 * cn(styles.button, styles.primary, { [styles.loading]: isLoading })
 */

/**
 * Possible class value types
 */
type ClassValue =
  | string
  | undefined
  | null
  | false
  | 0
  | 0n
  | Record<string, boolean | undefined | null>;

/**
 * Conditionally join class names together
 *
 * @param classes - Class values to join
 * @returns Joined class string
 *
 * @example
 * // Strings
 * cn('foo', 'bar') // => 'foo bar'
 *
 * // Conditional strings
 * cn('base', isActive && 'active', isDisabled && 'disabled')
 *
 * // Object syntax
 * cn('base', { active: true, disabled: false }) // => 'base active'
 *
 * // Mixed
 * cn('base', condition && 'conditional', { variant: true })
 */
export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];

  for (const cls of classes) {
    // Skip falsy values (undefined, null, false, 0, '')
    if (!cls) continue;

    if (typeof cls === 'string') {
      // Direct string class
      result.push(cls);
    } else if (typeof cls === 'object') {
      // Object with boolean values
      for (const [key, value] of Object.entries(cls)) {
        if (value) {
          result.push(key);
        }
      }
    }
  }

  return result.join(' ');
}

/**
 * Type-safe variant helper for component variants
 *
 * @example
 * const buttonVariants = createVariants({
 *   base: 'btn',
 *   variants: {
 *     size: { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' },
 *     color: { primary: 'btn-primary', secondary: 'btn-secondary' },
 *   },
 *   defaultVariants: { size: 'md', color: 'primary' },
 * });
 *
 * buttonVariants({ size: 'lg' }) // => 'btn btn-lg btn-primary'
 */
export function createVariants<
  TVariants extends Record<string, Record<string, string>>
>(config: {
  base?: string;
  variants: TVariants;
  defaultVariants?: {
    [K in keyof TVariants]?: keyof TVariants[K];
  };
}) {
  return (
    props?: {
      [K in keyof TVariants]?: keyof TVariants[K];
    }
  ): string => {
    const classes: string[] = [];

    // Add base class
    if (config.base) {
      classes.push(config.base);
    }

    // Process each variant
    for (const [variantName, variantOptions] of Object.entries(
      config.variants
    )) {
      const selectedValue =
        props?.[variantName as keyof typeof props] ??
        config.defaultVariants?.[variantName as keyof TVariants];

      if (selectedValue && variantOptions[selectedValue as string]) {
        classes.push(variantOptions[selectedValue as string]!);
      }
    }

    return classes.join(' ');
  };
}

/**
 * Merge CSS Module classes with conditional classes
 * Useful when you have a base CSS Module class and want to add conditional classes
 *
 * @example
 * const className = mergeStyles(
 *   styles.button,
 *   isActive && styles.active,
 *   isDisabled && styles.disabled
 * );
 */
export function mergeStyles(
  baseClass: string,
  ...conditionals: (string | undefined | false | null)[]
): string {
  return cn(baseClass, ...conditionals);
}

/**
 * Create a class name string from an array of potential classes
 * Filters out falsy values automatically
 *
 * @example
 * classes(['base', condition && 'conditional', undefined, 'always'])
 * // => 'base conditional always' or 'base always'
 */
export function classes(
  classArray: (string | undefined | false | null)[]
): string {
  return classArray.filter(Boolean).join(' ');
}

// Default export for convenience
export default cn;
