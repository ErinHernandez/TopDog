import React, { useState, useEffect } from 'react';
import { useUser } from '../lib/userContext';

export default function LocationData2() {
  const { user } = useUser();
  const [svgContent, setSvgContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filteredStates, setFilteredStates] = useState([]);
  const [allStates, setAllStates] = useState([]);
  
  // State categories for filtering
  const stateCategories = {
    all: 'All States',
    northeast: 'Northeast',
    southeast: 'Southeast', 
    midwest: 'Midwest',
    southwest: 'Southwest',
    west: 'West',
    territories: 'Territories'
  };
  
  // State region mapping
  const stateRegions = {
    // Northeast
    'ME': 'northeast', 'NH': 'northeast', 'VT': 'northeast', 'MA': 'northeast',
    'RI': 'northeast', 'CT': 'northeast', 'NY': 'northeast', 'NJ': 'northeast',
    'PA': 'northeast', 'DE': 'northeast', 'MD': 'northeast',
    
    // Southeast
    'VA': 'southeast', 'WV': 'southeast', 'KY': 'southeast', 'TN': 'southeast',
    'NC': 'southeast', 'SC': 'southeast', 'GA': 'southeast', 'FL': 'southeast',
    'AL': 'southeast', 'MS': 'southeast', 'AR': 'southeast', 'LA': 'southeast',
    
    // Midwest
    'OH': 'midwest', 'IN': 'midwest', 'IL': 'midwest', 'MI': 'midwest',
    'WI': 'midwest', 'MN': 'midwest', 'IA': 'midwest', 'MO': 'midwest',
    'ND': 'midwest', 'SD': 'midwest', 'NE': 'midwest', 'KS': 'midwest',
    
    // Southwest
    'OK': 'southwest', 'TX': 'southwest', 'NM': 'southwest', 'AZ': 'southwest',
    
    // West
    'WA': 'west', 'OR': 'west', 'CA': 'west', 'NV': 'west', 'ID': 'west',
    'MT': 'west', 'WY': 'west', 'UT': 'west', 'CO': 'west', 'AK': 'west',
    'HI': 'west',
    
    // Territories
    'DC': 'territories', 'PR': 'territories', 'VI': 'territories',
    'GU': 'territories', 'MP': 'territories', 'AS': 'territories'
  };

  useEffect(() => {
    // Load the SVG file
    const loadSvg = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/vecteezy_united-states_36654955.svg');
        if (!response.ok) {
          throw new Error('Failed to load SVG file');
        }
        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (err) {
        setError(err.message);
        console.error('Error loading SVG:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSvg();
  }, []);

  // Effect to update filtered states when search or filter changes
  useEffect(() => {
    if (allStates.length > 0) {
      const filtered = filterStates(allStates, searchTerm, filterCategory);
      setFilteredStates(filtered);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filterStates is a stable function
  }, [searchTerm, filterCategory, allStates]);

  // Function to handle state hover
  const handleStateHover = (stateId) => {
    setHoveredState(stateId);
  };

  // Function to handle state click
  const handleStateClick = (stateId) => {
    setSelectedState(selectedState === stateId ? null : stateId);
  };

  // Function to extract states from SVG content
  const extractStatesFromSvg = (svgString) => {
    const stateMatches = svgString.match(/id="([A-Z]{2})"/g);
    if (stateMatches) {
      const states = stateMatches.map(match => match.replace('id="', '').replace('"', ''));
      setAllStates(states);
      return states;
    }
    return [];
  };

  // Function to filter states based on search and category
  const filterStates = (states, search, category) => {
    return states.filter(state => {
      const matchesSearch = search === '' || 
        state.toLowerCase().includes(search.toLowerCase()) ||
        getStateName(state).toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = category === 'all' || stateRegions[state] === category;
      
      return matchesSearch && matchesCategory;
    });
  };

  // Function to get state name from abbreviation
  const getStateName = (abbreviation) => {
    const stateNames = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
      'DC': 'District of Columbia', 'PR': 'Puerto Rico', 'VI': 'U.S. Virgin Islands',
      'GU': 'Guam', 'MP': 'Northern Mariana Islands', 'AS': 'American Samoa'
    };
    return stateNames[abbreviation] || abbreviation;
  };

  // Function to sanitize SVG content to prevent XSS
  const sanitizeSVGContent = (svgString) => {
    if (!svgString) return '';
    
    // Remove script tags and event handlers
    let sanitized = svgString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe/gi, '<iframe-disabled');
    
    return sanitized;
  };

  // Function to process SVG content and add interactivity
  const processSvgContent = (svgString) => {
    // Extract states first
    const states = extractStatesFromSvg(svgString);
    
    // Filter states based on current search and category
    const filtered = filterStates(states, searchTerm, filterCategory);
    setFilteredStates(filtered);
    
    // This will be implemented to add event handlers to SVG paths
    // For now, return the raw SVG content
    return svgString;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading location data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Location Data 2.0
            </h1>
            <p className="mt-2 text-gray-600">
              Interactive location analysis with SVG map visualization
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main SVG Display */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Interactive Map</h2>
              
              {/* SVG Container */}
              <div className="relative bg-gray-100 rounded-lg p-4 overflow-auto">
                <div 
                  className="svg-container"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeSVGContent(processSvgContent(svgContent))
                  }}
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '600px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search & Filters</h2>
              
              {/* Search Bar */}
              <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search States
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or abbreviation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Region
                </label>
                <select
                  id="category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(stateCategories).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Results */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Results</h3>
                <div className="text-sm text-gray-600">
                  <p>Showing {filteredStates.length} of {allStates.length} states</p>
                  {searchTerm && (
                    <p className="text-blue-600">Search: "{searchTerm}"</p>
                  )}
                  {filterCategory !== 'all' && (
                    <p className="text-green-600">Region: {stateCategories[filterCategory]}</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategory('all');
                    }}
                    className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => setSelectedState(null)}
                    className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
              
              {/* State Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selected State</h3>
                {selectedState ? (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">{selectedState}</p>
                    <p className="text-sm text-blue-700">State ID: {selectedState}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No state selected</p>
                )}
              </div>

              {/* Hover Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Hovered State</h3>
                {hoveredState ? (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-900">{hoveredState}</p>
                    <p className="text-sm text-green-700">State ID: {hoveredState}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No state hovered</p>
                )}
              </div>

              {/* Map Controls */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Map Controls</h3>
                
                <button 
                  onClick={() => setSelectedState(null)}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
                
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reload Map
                </button>
              </div>

              {/* Filtered States List */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Filtered States</h3>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {filteredStates.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {filteredStates.map(state => (
                        <button
                          key={state}
                          onClick={() => setSelectedState(state)}
                          className={`p-1 rounded text-left hover:bg-blue-50 transition-colors ${
                            selectedState === state ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{state}</div>
                          <div className="text-gray-500">{getStateName(state)}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs">No states match your filters</p>
                  )}
                </div>
              </div>

              {/* Debug Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>SVG Loaded: {svgContent ? 'Yes' : 'No'}</p>
                  <p>Content Length: {svgContent.length} characters</p>
                  <p>Total States: {allStates.length}</p>
                  <p>Filtered States: {filteredStates.length}</p>
                  <p>Search Term: "{searchTerm}"</p>
                  <p>Filter Category: {stateCategories[filterCategory]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
