/**
 * SearchBar - V3 Advanced Search Component
 * Smart search with suggestions, tags, and filtering
 */

import React, { useState, useRef, useEffect } from 'react';
import { theme } from '../../../lib/theme';

const SearchBar = ({
  placeholder = "Search...",
  value = "",
  onChange,
  onSearch,
  suggestions = [],
  selectedTags = [],
  onTagAdd,
  onTagRemove,
  onClear,
  showSuggestions = false,
  onSuggestionsToggle,
  className = "",
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        onSuggestionsToggle?.(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onSuggestionsToggle]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange?.(newValue);
    onSuggestionsToggle?.(newValue.length >= 2);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (value.length >= 2) {
      onSuggestionsToggle?.(true);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay to allow suggestion clicks
    setTimeout(() => {
      onSuggestionsToggle?.(false);
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.(value);
    }
    if (e.key === 'Escape') {
      onSuggestionsToggle?.(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onTagAdd?.(suggestion);
    onChange?.('');
    onSuggestionsToggle?.(false);
    inputRef.current?.focus();
  };

  const handleTagRemove = (tag) => {
    onTagRemove?.(tag);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChange?.('');
    onClear?.();
    onSuggestionsToggle?.(false);
    inputRef.current?.focus();
  };

  const containerStyles = {
    position: 'relative',
    minHeight: '44px'
  };

  const inputContainerStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(31, 41, 55, 0.7)',
    border: `1px solid ${isFocused ? theme.colors.accent.teal : theme.colors.border.primary}`,
    borderRadius: theme.borderRadius.lg,
    padding: '8px 12px',
    minHeight: '44px',
    transition: 'border-color 0.2s ease'
  };

  const tagStyles = {
    display: 'flex',
    alignItems: 'center',
    background: theme.colors.accent.teal,
    color: theme.colors.text.primary,
    padding: '4px 8px',
    borderRadius: theme.borderRadius.sm,
    fontSize: '12px',
    fontWeight: theme.typography.fontWeight.medium
  };

  const inputStyles = {
    flex: '1',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: theme.colors.text.primary,
    fontSize: '16px',
    minWidth: '120px'
  };

  const suggestionsStyles = {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    marginTop: '4px',
    background: theme.colors.background.tertiary,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.lg,
    zIndex: theme.zIndex.dropdown,
    maxHeight: '240px',
    overflowY: 'auto'
  };

  return (
    <div className={className} style={containerStyles}>
      {/* Main Input Container */}
      <div style={inputContainerStyles}>
        {/* Selected Tags */}
        {selectedTags.map((tag, index) => (
          <div key={`${tag}-${index}`} style={tagStyles}>
            <span>{tag}</span>
            <button
              onClick={() => handleTagRemove(tag)}
              className="ml-2 text-white hover:text-gray-200 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={inputStyles}
        />

        {/* Clear Button */}
        {(value || selectedTags.length > 0) && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-white transition-colors ml-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} style={suggestionsStyles}>
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              onClick={() => handleSuggestionClick(suggestion.value)}
              className="w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center justify-between group transition-colors"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              <span className="text-white">{suggestion.display}</span>
              <span 
                className={`text-xs px-2 py-1 rounded text-white ${
                  suggestion.type === 'player' ? 'bg-blue-600' : 
                  suggestion.type === 'team' ? 'bg-green-600' : 'bg-purple-600'
                }`}
              >
                {suggestion.type === 'player' ? 'Player' : 
                 suggestion.type === 'team' ? 'Team' : 'City'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showSuggestions && suggestions.length === 0 && value.length >= 2 && (
        <div style={suggestionsStyles}>
          <div 
            className="px-4 py-3 text-gray-400 text-sm flex items-center"
            style={{ minHeight: '44px' }}
          >
            No suggestions found
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
