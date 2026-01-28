/**
 * Universal Export Modal
 * Accessible export interface for all users
 */

import React, { useState, useEffect } from 'react';
import { createScopedLogger } from '../lib/clientLogger';

const logger = createScopedLogger('[ExportModal]');

export default function ExportModal({ 
  isOpen, 
  onClose, 
  exportType = 'draft', 
  exportId = null,
  userId = null 
}) {
  const [format, setFormat] = useState('csv');
  const [timeframe, setTimeframe] = useState('season');
  const [anonymize, setAnonymize] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [accessRestricted, setAccessRestricted] = useState(false);
  const [restrictionInfo, setRestrictionInfo] = useState(null);

  // Check access restrictions when modal opens
  useEffect(() => {
    if (isOpen && exportType !== 'draft') {
      checkDataAccess();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- checkDataAccess is stable, only run when modal opens or type changes
  }, [isOpen, exportType]);

  const checkDataAccess = async () => {
    try {
      const response = await fetch(`/api/export/${exportType}/${exportId}?userId=${userId}&check=true`);
      if (response.status === 403) {
        const data = await response.json();
        setAccessRestricted(true);
        setRestrictionInfo(data);
      } else {
        setAccessRestricted(false);
        setRestrictionInfo(null);
      }
    } catch (error) {
      logger.error('Error checking data access', error);
    }
  };

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Build export URL
      let exportUrl = `/api/export/${exportType}/${exportId}?format=${format}`;
      
      if (userId && exportType === 'draft') {
        exportUrl += `&userId=${userId}`;
      }
      
      if (exportType === 'user') {
        exportUrl += `&timeframe=${timeframe}`;
      }
      
      if (exportType === 'tournament' && anonymize) {
        exportUrl += `&anonymize=true`;
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `topdog_export_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      logger.error('Export failed', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getExportTitle = () => {
    switch (exportType) {
      case 'draft': return 'Export Draft Data';
      case 'tournament': return 'Export Tournament Data';
      case 'player': return 'Export Player Data';
      case 'user': return 'Export User History';
      default: return 'Export Data';
    }
  };

  const getExportDescription = () => {
    switch (exportType) {
      case 'draft': 
        return 'Download your draft picks, timing, and analytics data.';
      case 'tournament': 
        return 'Download complete tournament data including all picks and analytics.';
      case 'player': 
        return 'Download historical data for this player across all tournaments.';
      case 'user': 
        return 'Download your complete draft history and performance data.';
      default: 
        return 'Download your data for external analysis.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#000F55] border border-[#60A5FA] rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#60A5FA]">
            {getExportTitle()}
          </h2>
          
          <p className="text-gray-300 mb-6">
            {getExportDescription()}
          </p>

          {/* Restriction Notice */}
          {accessRestricted && restrictionInfo && (
            <div className="mb-6 p-4 bg-blue-900 border border-blue-600 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-blue-400 text-xl mr-2">Data</span>
                <h3 className="text-blue-200 font-semibold">Data Not Yet Available</h3>
              </div>
              <p className="text-blue-100 text-sm mb-3">
                {restrictionInfo.reason}
              </p>
              <div className="text-blue-200 text-xs">
                <p><strong>Current Period:</strong> {restrictionInfo.period}</p>
                <p><strong>Status:</strong> {restrictionInfo.status}</p>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div className="mb-4 text-left">
            <label className="block text-gray-300 mb-2 font-semibold">
              Export Format:
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="csv">CSV (Excel compatible)</option>
              <option value="json">JSON (for developers)</option>
              <option value="txt">Text (readable format)</option>
            </select>
          </div>

          {/* User History Timeframe */}
          {exportType === 'user' && (
            <div className="mb-4 text-left">
              <label className="block text-gray-300 mb-2 font-semibold">
                Time Period:
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="season">Current Season</option>
                <option value="all">All Time</option>
                <option value="month">Last Month</option>
              </select>
            </div>
          )}

          {/* Tournament Anonymization */}
          {exportType === 'tournament' && (
            <div className="mb-4 text-left">
              <label className="flex items-center text-gray-300">
                <input
                  type="checkbox"
                  checked={anonymize}
                  onChange={(e) => setAnonymize(e.target.checked)}
                  className="mr-2"
                />
                Anonymize user data (recommended for sharing)
              </label>
            </div>
          )}

          {/* Export Info */}
          <div className="mb-6 p-3 bg-gray-800 rounded text-sm text-left">
            <h4 className="font-semibold text-[#2DE2C5] mb-2">What&apos;s Included:</h4>
            <ul className="text-gray-300 space-y-1">
              {exportType === 'draft' && (
                <>
                  <li>• Your pick history with timing</li>
                  <li>• Player projections and ADP</li>
                  <li>• Position breakdown</li>
                  <li>• Draft summary statistics</li>
                </>
              )}
              {exportType === 'tournament' && (
                <>
                  <li>• All tournament picks</li>
                  <li>• Ownership percentages</li>
                  <li>• Popular players analysis</li>
                  <li>• Position trends</li>
                </>
              )}
              {exportType === 'player' && (
                <>
                  <li>• Draft history across tournaments</li>
                  <li>• Average draft position</li>
                  <li>• Ownership trends</li>
                  <li>• Performance analytics</li>
                </>
              )}
              {exportType === 'user' && (
                <>
                  <li>• Complete draft history</li>
                  <li>• Pick tendencies by position</li>
                  <li>• Performance metrics</li>
                  <li>• Timing analytics</li>
                </>
              )}
            </ul>
          </div>

          {/* Success Message */}
          {exportSuccess && (
            <div className="mb-4 p-3 bg-green-800 text-green-200 rounded">
              ✅ Export successful! Download should start automatically.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || accessRestricted}
              className="flex-1 px-4 py-2 bg-[#60A5FA] text-[#000F55] rounded font-bold hover:bg-[#2DE2C5] transition-colors disabled:opacity-50"
            >
              {accessRestricted ? 'Data Not Available' : isExporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>

          {/* Usage Note */}
          <p className="text-xs text-gray-400 mt-4">
            Perfect for Excel analysis, streamer tools, or personal research. 
            Data exports respect all privacy settings.
          </p>
        </div>
      </div>
    </div>
  );
}