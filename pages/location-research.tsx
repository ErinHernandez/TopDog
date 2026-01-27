/**
 * Location Research Page
 *
 * Research and analyze locations for fantasy sports compliance.
 * Displays state-by-state regulations for season-long fantasy sports.
 *
 * @module pages/location-research
 */

import React, { useState } from 'react';
import type { JSX } from 'react';
import { useUser } from '../lib/userContext';
import { LocationList, LocationDetails } from '../components/location-research';
import { allStatesData, initialNevadaData } from '../lib/location-research';
import type { LocationData, SortBy, SortOrder, ViewMode } from '../lib/location-research/types';

export default function LocationResearch(): JSX.Element {
  const { user } = useUser();
  const [locations, setLocations] = useState<LocationData[]>(allStatesData);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialNevadaData);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>(allStatesData);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const handleSelectLocation = (location: LocationData): void => {
    setSelectedLocation(location);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Location Research</h1>
          <p className="mt-2 text-gray-600">
            Research and analyze locations for fantasy sports compliance
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Location List Sidebar */}
          <div className="lg:col-span-1">
            <LocationList
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
            />
          </div>

          {/* Location Details */}
          <div className="lg:col-span-2">
            <LocationDetails location={selectedLocation} />
          </div>
        </div>
      </div>
    </div>
  );
}
