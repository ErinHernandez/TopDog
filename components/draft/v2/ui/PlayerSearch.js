import React, { useState } from 'react';

/**
 * PlayerSearch - Search and filter players
 */
export default function PlayerSearch({ 
  showFilters = true, 
  showSort = true,
  minimal = false,
  experimental = false
}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    position: 'ALL',
    team: 'ALL',
    availability: 'ALL'
  });

  return (
    <div className="p-4 bg-gray-800 border-b border-gray-700">
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        
        {showFilters && !minimal && (
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.position}
              onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
              className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="ALL">All Positions</option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="WR">WR</option>
              <option value="TE">TE</option>
            </select>
            
            <select
              value={filters.availability}
              onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
              className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
            >
              <option value="ALL">All Players</option>
              <option value="AVAILABLE">Available</option>
              <option value="QUEUED">Queued</option>
            </select>
          </div>
        )}

        {experimental && process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-purple-900/20 border border-purple-500 rounded text-purple-300 text-sm">
            🧪 Experimental Search Features Enabled
          </div>
        )}
      </div>
    </div>
  );
}