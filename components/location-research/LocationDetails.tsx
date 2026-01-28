/**
 * Location Details Component
 *
 * Displays detailed compliance and gambling information for a selected location.
 * Shows fantasy sports regulations, general gambling laws, and legal framework.
 *
 * @module components/location-research/LocationDetails
 */

import React from 'react';
import type { LocationData } from '../../lib/location-research/types';

interface LocationDetailsProps {
  location: LocationData | null;
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

/**
 * General Gambling Section
 */
function GeneralGamblingSection({
  gambling,
}: {
  gambling: NonNullable<LocationData['compliance']>['gambling']['generalGambling'];
}): React.ReactElement {
  return (
    <div className="mb-4">
      <h5 className="text-sm font-medium text-gray-700 mb-2">General Gambling</h5>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Legal:</span>
          <span
            className={`ml-2 font-medium ${gambling.legal ? 'text-green-600' : 'text-red-600'}`}
          >
            {gambling.legal ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Sports Betting:</span>
          <span
            className={`ml-2 font-medium ${gambling.sportsBetting ? 'text-green-600' : 'text-red-600'}`}
          >
            {gambling.sportsBetting ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
      {gambling.notes && <p className="text-sm text-gray-600 mt-2">{gambling.notes}</p>}
    </div>
  );
}

/**
 * Fantasy Sports Section
 */
function FantasySportsSection({
  fantasySports,
}: {
  fantasySports: NonNullable<NonNullable<LocationData['compliance']>['gambling']['fantasySports']>;
}): React.ReactElement {
  return (
    <div>
      <h5 className="text-sm font-medium text-gray-700 mb-2">Fantasy Sports</h5>

      {/* Season Long */}
      {fantasySports.seasonLong && (
        <div className="mb-3">
          <h6 className="text-xs font-medium text-gray-600 mb-1">Season Long</h6>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Legal:</span>
              <span
                className={`ml-2 font-medium ${fantasySports.seasonLong.legal ? 'text-green-600' : 'text-red-600'}`}
              >
                {fantasySports.seasonLong.legal ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Classification:</span>
              <span className="ml-2 font-medium text-gray-900">
                {fantasySports.seasonLong.classification}
              </span>
            </div>
          </div>
          {fantasySports.seasonLong.notes && (
            <p className="text-sm text-gray-600 mt-1">{fantasySports.seasonLong.notes}</p>
          )}
        </div>
      )}

      {/* Daily Fantasy */}
      {fantasySports.dailyFantasy && (
        <div className="mb-3">
          <h6 className="text-xs font-medium text-gray-600 mb-1">Daily Fantasy</h6>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Legal:</span>
              <span
                className={`ml-2 font-medium ${fantasySports.dailyFantasy.legal ? 'text-green-600' : 'text-red-600'}`}
              >
                {fantasySports.dailyFantasy.legal ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Classification:</span>
              <span className="ml-2 font-medium text-gray-900">
                {fantasySports.dailyFantasy.classification}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Best Ball */}
      {fantasySports.bestBall && (
        <div className="mb-3">
          <h6 className="text-xs font-medium text-gray-600 mb-1">Best Ball</h6>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Legal:</span>
              <span
                className={`ml-2 font-medium ${fantasySports.bestBall.legal ? 'text-green-600' : 'text-red-600'}`}
              >
                {fantasySports.bestBall.legal ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Classification:</span>
              <span className="ml-2 font-medium text-gray-900">
                {fantasySports.bestBall.classification}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state when no location is selected
 */
function EmptyState(): React.ReactElement {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-center">
      <div className="text-gray-400">
        <p className="text-lg mb-2">Select a location to view details</p>
      </div>
    </div>
  );
}

export function LocationDetails({ location }: LocationDetailsProps): React.ReactElement {
  if (!location) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{location.name}</h2>
            <p className="text-gray-600">
              {location.country} • {location.state}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full ${getStatusClasses(location.status)}`}>
            {location.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
          <p className="text-gray-700">{location.notes}</p>
        </div>

        {/* Compliance Section */}
        {location.compliance && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Compliance</h3>

            {/* Gambling */}
            {location.compliance.gambling && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Gambling</h4>

                {/* General Gambling */}
                {location.compliance.gambling.generalGambling && (
                  <GeneralGamblingSection gambling={location.compliance.gambling.generalGambling} />
                )}

                {/* Fantasy Sports */}
                {location.compliance.gambling.fantasySports && (
                  <FantasySportsSection fantasySports={location.compliance.gambling.fantasySports} />
                )}
              </div>
            )}

            {/* Regulatory Framework */}
            {location.compliance.gambling.regulatoryFramework && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Regulatory Framework</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Primary Regulator:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {location.compliance.gambling.regulatoryFramework.primaryRegulator || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Regulatory Level:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {location.compliance.gambling.regulatoryFramework.regulatoryLevel || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Licensing Fees:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ${location.compliance.gambling.regulatoryFramework.licensingFees?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Annual Fees:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ${location.compliance.gambling.regulatoryFramework.annualFees?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Legal Framework */}
            {location.compliance.legalFramework && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Legal Framework</h4>
                {location.compliance.legalFramework.primaryLaws.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Primary Laws</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {location.compliance.legalFramework.primaryLaws.map((law, index) => (
                        <li key={index}>{law}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {location.compliance.legalFramework.notes && (
                  <p className="text-sm text-gray-600">{location.compliance.legalFramework.notes}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationDetails;
