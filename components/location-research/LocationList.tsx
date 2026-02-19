/**
 * Location List Component
 *
 * Displays a scrollable list of locations with status indicators.
 * Allows selection of locations for detailed view.
 *
 * @module components/location-research/LocationList
 */

import React from 'react';

import type { LocationData } from '../../lib/location-research/types';

interface LocationListProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  onSelectLocation: (location: LocationData) => void;
}

/**
 * Get status badge classes based on location status
 */
function getStatusClasses(status: string): string {
  switch (status) {
    case 'research':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'denied':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function LocationList({
  locations,
  selectedLocation,
  onSelectLocation,
}: LocationListProps): React.ReactElement {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
        <p className="text-sm text-gray-500">{locations.length} locations</p>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {locations.map((location) => (
          <div
            key={location.id}
            onClick={() => onSelectLocation(location)}
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
              selectedLocation?.id === location.id ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{location.name}</h3>
                <p className="text-sm text-gray-500">{location.state}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getStatusClasses(location.status)}`}
              >
                {location.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LocationList;
