/**
 * VX Tabs Component
 * 
 * Tab navigation for switching between views.
 * Supports icons, badges, and different styles.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BRAND_COLORS, TEXT_COLORS, BG_COLORS } from '../constants/colors';
import { PLATFORM, TOUCH_TARGETS } from '../constants/sizes';
import { TRANSITION } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export interface Tab {
  /** Unique tab identifier */
  id: string;
  /** Tab label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional badge count */
  badge?: number;
  /** Disabled state */
  disabled?: boolean;
}

export interface TabsProps {
  /** Array of tabs */
  tabs: Tab[];
  /** Currently active tab id */
  activeTab: string;
  /** Callback when tab changes */
  onChange: (tabId: string) => void;
  /** Tab style variant */
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  /** Full width tabs */
  fullWidth?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

export interface TabPanelProps {
  /** Tab id this panel belongs to */
  tabId: string;
  /** Currently active tab */
  activeTab: string;
  /** Panel content */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES = {
  sm: {
    height: '32px',
    fontSize: '12px',
    padding: '0 12px',
    iconSize: '14px',
  },
  md: {
    height: TOUCH_TARGETS.min,
    fontSize: '14px',
    padding: '0 16px',
    iconSize: '16px',
  },
  lg: {
    height: TOUCH_TARGETS.comfort,
    fontSize: '16px',
    padding: '0 20px',
    iconSize: '18px',
  },
};

// ============================================================================
// TABS COMPONENT
// ============================================================================

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  size = 'md',
  className = '',
}: TabsProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const sizeStyle = SIZE_STYLES[size];

  // Update indicator position for underline variant
  useEffect(() => {
    if (variant === 'underline' && containerRef.current) {
      const activeButton = containerRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
      if (activeButton) {
        setIndicatorStyle({
          width: `${activeButton.offsetWidth}px`,
          transform: `translateX(${activeButton.offsetLeft}px)`,
        });
      }
    }
  }, [activeTab, variant, tabs]);

  const getTabStyles = (tab: Tab, isActive: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      height: sizeStyle.height,
      padding: sizeStyle.padding,
      fontSize: sizeStyle.fontSize,
      fontWeight: isActive ? 600 : 500,
      transition: TRANSITION.fast,
      cursor: tab.disabled ? 'not-allowed' : 'pointer',
      opacity: tab.disabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'pills':
        return {
          ...base,
          backgroundColor: isActive ? BRAND_COLORS.primary : 'transparent',
          color: isActive ? '#000' : TEXT_COLORS.secondary,
          borderRadius: '9999px',
        };
      case 'underline':
        return {
          ...base,
          backgroundColor: 'transparent',
          color: isActive ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
          borderBottom: 'none',
        };
      case 'enclosed':
        return {
          ...base,
          backgroundColor: isActive ? BG_COLORS.secondary : 'transparent',
          color: isActive ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
          borderRadius: `${PLATFORM.ios.borderRadius} ${PLATFORM.ios.borderRadius} 0 0`,
          borderBottom: isActive ? 'none' : `1px solid ${BG_COLORS.elevated}`,
        };
      default:
        return {
          ...base,
          backgroundColor: isActive ? BG_COLORS.elevated : 'transparent',
          color: isActive ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
          borderRadius: PLATFORM.ios.borderRadius,
        };
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    gap: variant === 'pills' ? '4px' : variant === 'underline' ? '0' : '2px',
    position: 'relative',
    ...(variant === 'underline' && {
      borderBottom: `1px solid ${BG_COLORS.elevated}`,
    }),
    ...(variant === 'enclosed' && {
      borderBottom: `1px solid ${BG_COLORS.elevated}`,
      marginBottom: '-1px',
    }),
  };

  return (
    <div
      ref={containerRef}
      className={`${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}
      style={containerStyles}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            className={`inline-flex items-center justify-center gap-2 ${fullWidth ? 'flex-1' : ''}`}
            style={getTabStyles(tab, isActive)}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
          >
            {tab.icon && (
              <span style={{ width: sizeStyle.iconSize, height: sizeStyle.iconSize }}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: isActive ? 'rgba(0,0,0,0.2)' : BG_COLORS.elevated,
                  color: isActive && variant === 'pills' ? '#000' : TEXT_COLORS.primary,
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
      
      {/* Animated underline indicator */}
      {variant === 'underline' && (
        <div
          className="absolute bottom-0 h-0.5"
          style={{
            backgroundColor: BRAND_COLORS.primary,
            transition: TRANSITION.fast,
            ...indicatorStyle,
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// TAB PANEL
// ============================================================================

export function TabPanel({
  tabId,
  activeTab,
  children,
  className = '',
}: TabPanelProps): React.ReactElement | null {
  if (tabId !== activeTab) return null;

  return (
    <div
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      aria-labelledby={tabId}
      className={className}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SEGMENTED CONTROL (iOS-style)
// ============================================================================

export interface SegmentedControlProps {
  /** Options */
  options: Array<{ value: string; label: string }>;
  /** Selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Size */
  size?: 'sm' | 'md';
  /** Full width */
  fullWidth?: boolean;
  /** Custom className */
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const sizeStyle = size === 'sm' 
    ? { height: '28px', fontSize: '12px', padding: '0 10px' }
    : { height: '32px', fontSize: '13px', padding: '0 12px' };

  useEffect(() => {
    if (containerRef.current) {
      const activeIndex = options.findIndex(o => o.value === value);
      const segmentWidth = 100 / options.length;
      setIndicatorStyle({
        width: `${segmentWidth}%`,
        transform: `translateX(${activeIndex * 100}%)`,
      });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={`relative p-0.5 rounded-lg ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}
      style={{ backgroundColor: BG_COLORS.elevated }}
      role="radiogroup"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-md"
        style={{
          backgroundColor: BG_COLORS.secondary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: TRANSITION.fast,
          ...indicatorStyle,
        }}
      />
      
      {/* Options */}
      <div className={`relative flex ${fullWidth ? 'w-full' : ''}`}>
        {options.map((option) => {
          const isActive = option.value === value;
          
          return (
            <button
              key={option.value}
              className="flex-1 flex items-center justify-center relative z-10"
              style={{
                height: sizeStyle.height,
                padding: sizeStyle.padding,
                fontSize: sizeStyle.fontSize,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
                transition: TRANSITION.fast,
              }}
              onClick={() => onChange(option.value)}
              role="radio"
              aria-checked={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

