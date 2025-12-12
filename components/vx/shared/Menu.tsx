/**
 * VX Menu/Dropdown Component
 * 
 * Dropdown menus for actions and selections.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TEXT_COLORS, BG_COLORS } from '../constants/colors';
import { TRANSITION } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
}

export interface MenuProps {
  trigger: React.ReactElement;
  items: MenuItem[];
  onSelect: (itemId: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

// ============================================================================
// MENU COMPONENT
// ============================================================================

export default function Menu({
  trigger,
  items,
  onSelect,
  align = 'left',
  className = '',
}: MenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = useCallback((itemId: string) => {
    onSelect(itemId);
    setIsOpen(false);
  }, [onSelect]);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute z-50 mt-1 py-1 rounded-lg shadow-lg ${className}`}
          style={{
            minWidth: '160px',
            backgroundColor: BG_COLORS.elevated,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
          }}
          role="menu"
        >
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                style={{
                  color: item.destructive ? '#EF4444' : TEXT_COLORS.primary,
                  backgroundColor: 'transparent',
                  transition: TRANSITION.fast,
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => !item.disabled && handleSelect(item.id)}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && (
                  <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
                )}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs" style={{ color: TEXT_COLORS.muted }}>
                    {item.shortcut}
                  </span>
                )}
              </button>
              {item.divider && (
                <div
                  className="my-1 mx-2 h-px"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ACTION MENU
// ============================================================================

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  onSelect: (itemId: string) => void;
  className?: string;
}

export function ActionMenu({
  items,
  onSelect,
  className = '',
}: ActionMenuProps): React.ReactElement {
  return (
    <div className={`flex gap-2 ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          className="flex flex-col items-center gap-1 p-3 rounded-lg"
          style={{
            backgroundColor: BG_COLORS.elevated,
            transition: TRANSITION.fast,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = BG_COLORS.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = BG_COLORS.elevated;
          }}
          onClick={() => onSelect(item.id)}
        >
          <span
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ color: item.color || TEXT_COLORS.primary }}
          >
            {item.icon}
          </span>
          <span className="text-xs" style={{ color: TEXT_COLORS.secondary }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

