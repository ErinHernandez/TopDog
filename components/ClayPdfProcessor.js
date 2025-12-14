import React, { useState } from 'react';

const ClayPdfProcessor = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [analysisType, setAnalysisType] = useState('read');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [processMultiple, setProcessMultiple] = useState(false);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(5);

  const handleProcessPdf = async () => {
    setIsProcessing(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/azure-vision/clay-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageNumber: processMultiple ? undefined : pageNumber,
          analysisType,
          processMultiple,
          startPage: processMultiple ? startPage : undefined,
          endPage: processMultiple ? endPage : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process Clay PDF');
      }

      setResults(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError('');
  };

  const renderResults = () => {
    if (!results) return null;

    if (Array.isArray(results)) {
      // Multiple pages processed
      return (
        <div className="mt-4 space-y-4">
          <h3 className="text-lg font-bold mb-2">Multi-Page Results:</h3>
          {results.map((pageResult, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Page {pageResult.page}</h4>
              {pageResult.success ? (
                <div className="bg-gray-100 p-3 rounded max-h-64 overflow-y-auto">
                  {pageResult.result.text ? (
                    <div>
                      <p className="font-semibold mb-2">Extracted Text:</p>
                      <p className="whitespace-pre-wrap text-sm">{pageResult.result.text}</p>
                      {pageResult.result.lines && pageResult.result.lines.length > 0 && (
                        <div className="mt-4">
                          <p className="font-semibold mb-2">Lines:</p>
                          {pageResult.result.lines.slice(0, 10).map((line, lineIndex) => (
                            <p key={lineIndex} className="mb-1 text-sm">{line}</p>
                          ))}
                          {pageResult.result.lines.length > 10 && (
                            <p className="text-gray-500 text-sm">... and {pageResult.result.lines.length - 10} more lines</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No text detected</p>
                  )}
                </div>
              ) : (
                <div className="bg-red-100 p-3 rounded">
                  <p className="text-red-700">Error: {pageResult.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } else {
      // Single page processed
      return (
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Page {pageNumber} Results:</h3>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {results.text ? (
              <div>
                <p className="font-semibold mb-2">Extracted Text:</p>
                <p className="whitespace-pre-wrap">{results.text}</p>
                {results.lines && results.lines.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold mb-2">Lines:</p>
                    {results.lines.map((line, index) => (
                      <p key={index} className="mb-1">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No text detected</p>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Clay Projections PDF Processor</h2>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Processing:</strong> Clay Projections 2025 PDF from ESPN
        </p>
        <p className="text-sm text-blue-700 mt-1">
          Using Microsoft Azure Computer Vision API for text extraction
        </p>
      </div>

      {/* Processing Options */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="processMultiple"
            checked={processMultiple}
            onChange={(e) => setProcessMultiple(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="processMultiple" className="font-medium">
            Process Multiple Pages
          </label>
        </div>

        {processMultiple ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Page
              </label>
              <input
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                min="1"
                className="block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Page
              </label>
              <input
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(parseInt(e.target.value) || 5)}
                min={startPage}
                className="block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Number
            </label>
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
              min="1"
              className="block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Type
          </label>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="read">Read API (Document Text - Recommended)</option>
            <option value="ocr">OCR (Printed Text)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Read API is better for documents with complex layouts
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleProcessPdf}
          disabled={isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isProcessing ? 'Processing PDF...' : 'Process Clay PDF'}
        </button>
        <button
          onClick={clearResults}
          className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Results */}
      {renderResults()}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• The Clay projections PDF will be converted to images and processed through Azure Computer Vision</li>
          <li>• Use "Read API" for better results with complex document layouts</li>
          <li>• Processing multiple pages may take several minutes</li>
          <li>• Make sure you have Azure Computer Vision credentials configured</li>
        </ul>
      </div>
    </div>
  );
};

export default ClayPdfProcessor; 