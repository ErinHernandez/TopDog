/**
 * V3 Demo Page - Showcase of New Architecture
 * Demonstrates the V3 component system and design patterns
 */

import React, { useState } from 'react';
import AppShell from '../components/v3/Layout/AppShell';
import ContentContainer from '../components/v3/Layout/ContentContainer';
import Card from '../components/v3/UI/Card';
import Button from '../components/v3/UI/Button';
import SearchBar from '../components/v3/UI/SearchBar';
import LoadingState from '../components/v3/UI/LoadingState';
import { theme } from '../lib/theme';

export default function V3Demo() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock suggestions data
  const suggestions = [
    { type: 'player', value: 'Josh Allen', display: 'Josh Allen (QB)' },
    { type: 'player', value: 'Christian McCaffrey', display: 'Christian McCaffrey (RB)' },
    { type: 'team', value: 'Buffalo Bills', display: 'Buffalo Bills' },
    { type: 'team', value: 'San Francisco 49ers', display: 'San Francisco 49ers' }
  ].filter(s => 
    s.display.toLowerCase().includes(searchValue.toLowerCase()) &&
    !selectedTags.includes(s.value)
  );

  const handleTagAdd = (tag) => {
    setSelectedTags([...selectedTags, tag]);
    setSearchValue('');
  };

  const handleTagRemove = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleClear = () => {
    setSelectedTags([]);
    setSearchValue('');
  };

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  if (loading) {
    return (
      <LoadingState 
        type="page" 
        message="Loading V3 Demo..." 
        showLogo={true}
      />
    );
  }

  return (
    <AppShell
      title="V3 Demo - TopDog Fantasy Sports"
      description="Demonstration of V3 component architecture"
      activeTab="lobby"
      containerMaxWidth="1400px"
    >
      <ContentContainer maxWidth="1200px" padding="lg">
        {/* Header Section */}
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: theme.colors.text.primary }}
          >
            TopDog V3 Architecture Demo
          </h1>
          <p 
            className="text-lg"
            style={{ color: theme.colors.text.secondary }}
          >
            Showcasing the new component system, design patterns, and user experience improvements.
          </p>
        </div>

        {/* Component Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Button Variants Card */}
          <Card variant="elevated" padding="lg" shadow={true}>
            <h2 className="text-xl font-semibold mb-6 text-white">Button Components</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm">Primary Small</Button>
                <Button variant="primary" size="md">Primary Medium</Button>
                <Button variant="primary" size="lg">Primary Large</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button loading onClick={simulateLoading}>
                  {loading ? 'Loading...' : 'Test Loading'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Search Component Card */}
          <Card variant="accent" padding="lg">
            <h2 className="text-xl font-semibold mb-6 text-white">Advanced Search</h2>
            <SearchBar
              placeholder="Search players or teams..."
              value={searchValue}
              onChange={setSearchValue}
              suggestions={suggestions}
              selectedTags={selectedTags}
              onTagAdd={handleTagAdd}
              onTagRemove={handleTagRemove}
              onClear={handleClear}
              showSuggestions={showSuggestions}
              onSuggestionsToggle={setShowSuggestions}
            />
            <div className="mt-4 text-sm text-gray-400">
              Try searching for "Josh", "Bills", or "McCaffrey"
            </div>
          </Card>

        </div>

        {/* Card Variants Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="default" padding="md" hover={true}>
            <h3 className="text-lg font-semibold text-white mb-2">Default Card</h3>
            <p className="text-gray-300">Standard card with hover effect</p>
          </Card>

          <Card variant="glass" padding="md" hover={true}>
            <h3 className="text-lg font-semibold text-white mb-2">Glass Card</h3>
            <p className="text-gray-300">Glassmorphism design with blur</p>
          </Card>

          <Card variant="elevated" padding="md" shadow={true} hover={true}>
            <h3 className="text-lg font-semibold text-white mb-2">Elevated Card</h3>
            <p className="text-gray-300">Enhanced with shadow and elevation</p>
          </Card>
        </div>

        {/* Loading States Showcase */}
        <Card variant="default" padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold mb-6 text-white">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Inline Loading</h4>
              <LoadingState type="inline" message="Processing..." size="sm" />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Button Loading</h4>
              <LoadingState type="button" message="Saving..." />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Card Loading</h4>
              <LoadingState type="card" message="Loading data..." size="md" />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Actions</h4>
              <Button onClick={simulateLoading} variant="secondary" fullWidth>
                Simulate Page Loading
              </Button>
            </div>

          </div>
        </Card>

        {/* Theme Colors Showcase */}
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold mb-6 text-white">Color System</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ background: theme.colors.primary[600] }}
              />
              <div className="text-sm text-gray-300">Primary</div>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ background: theme.colors.accent.teal }}
              />
              <div className="text-sm text-gray-300">Accent Teal</div>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ background: theme.colors.accent.yellow }}
              />
              <div className="text-sm text-gray-300">Warning</div>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ background: theme.colors.accent.green }}
              />
              <div className="text-sm text-gray-300">Success</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ background: theme.colors.positions.QB }}
              />
              <div className="text-sm text-gray-300">QB</div>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ background: theme.colors.positions.RB }}
              />
              <div className="text-sm text-gray-300">RB</div>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ background: theme.colors.positions.WR }}
              />
              <div className="text-sm text-gray-300">WR</div>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-lg mx-auto mb-2"
                style={{ background: theme.colors.positions.TE }}
              />
              <div className="text-sm text-gray-300">TE</div>
            </div>
          </div>
        </Card>

      </ContentContainer>
    </AppShell>
  );
}
