import React, { useState } from 'react';

const AzureImageAnalyzer = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [analysisType, setAnalysisType] = useState('full');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!imageUrl) {
      setError('Please enter an image URL first');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/azure-vision/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          analysisType: analysisType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }

      setResults(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResults = () => {
    setImageUrl('');
    setResults(null);
    setError('');
  };

  const renderResults = () => {
    if (!results) return null;

    switch (analysisType) {
      case 'ocr':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">OCR Results:</h3>
            <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
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

      case 'read':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Read API Results:</h3>
            <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
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

      case 'objects':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Detected Objects:</h3>
            <div className="grid grid-cols-2 gap-2">
              {Array.isArray(results) && results.length > 0 ? (
                results.map((object, index) => (
                  <div key={index} className="bg-purple-100 p-2 rounded">
                    <span className="font-medium">{object.objectProperty}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      Confidence: {Math.round(object.confidence * 100)}%
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No objects detected</p>
              )}
            </div>
          </div>
        );

      case 'faces':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Detected Faces:</h3>
            <div className="space-y-2">
              {Array.isArray(results) && results.length > 0 ? (
                results.map((face, index) => (
                  <div key={index} className="bg-green-100 p-3 rounded">
                    <p><strong>Age:</strong> {face.age}</p>
                    <p><strong>Gender:</strong> {face.gender}</p>
                    {face.emotion && (
                      <div>
                        <p><strong>Emotions:</strong></p>
                        <ul className="ml-4">
                          {Object.entries(face.emotion).map(([emotion, value]) => (
                            <li key={emotion}>{emotion}: {Math.round(value * 100)}%</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No faces detected</p>
              )}
            </div>
          </div>
        );

      case 'tags':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Image Tags:</h3>
            <div className="grid grid-cols-2 gap-2">
              {Array.isArray(results) && results.length > 0 ? (
                results.map((tag, index) => (
                  <div key={index} className="bg-blue-100 p-2 rounded">
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({Math.round(tag.confidence * 100)}%)
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No tags detected</p>
              )}
            </div>
          </div>
        );

      case 'description':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Image Description:</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              {results.captions && results.captions.length > 0 ? (
                <div>
                  <p className="font-semibold mb-2">Captions:</p>
                  {results.captions.map((caption, index) => (
                    <p key={index} className="mb-2">
                      {caption.text} (Confidence: {Math.round(caption.confidence * 100)}%)
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No description available</p>
              )}
            </div>
          </div>
        );

      case 'full':
      default:
        return (
          <div className="mt-4 space-y-4">
            {/* Description Results */}
            {results.description && (
              <div>
                <h3 className="text-lg font-bold mb-2">Image Description:</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  {results.description.captions && results.description.captions.length > 0 ? (
                    results.description.captions.map((caption, index) => (
                      <p key={index} className="mb-2">
                        {caption.text} (Confidence: {Math.round(caption.confidence * 100)}%)
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No description available</p>
                  )}
                </div>
              </div>
            )}

            {/* Tags Results */}
            {results.tags && (
              <div>
                <h3 className="text-lg font-bold mb-2">Image Tags:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {results.tags.slice(0, 9).map((tag, index) => (
                    <div key={index} className="bg-blue-100 p-2 rounded text-sm">
                      <span className="font-medium">{tag.name}</span>
                      <span className="text-xs text-gray-600 ml-1">
                        ({Math.round(tag.confidence * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objects Results */}
            {results.objects && (
              <div>
                <h3 className="text-lg font-bold mb-2">Detected Objects:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {results.objects.slice(0, 6).map((object, index) => (
                    <div key={index} className="bg-purple-100 p-2 rounded text-sm">
                      <span className="font-medium">{object.objectProperty}</span>
                      <span className="text-xs text-gray-600 ml-1">
                        ({Math.round(object.confidence * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Faces Results */}
            {results.faces && (
              <div>
                <h3 className="text-lg font-bold mb-2">Detected Faces:</h3>
                <div className="space-y-2">
                  {results.faces.map((face, index) => (
                    <div key={index} className="bg-green-100 p-2 rounded text-sm">
                      <p><strong>Age:</strong> {face.age}</p>
                      <p><strong>Gender:</strong> {face.gender}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Results */}
            {results.categories && (
              <div>
                <h3 className="text-lg font-bold mb-2">Categories:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {results.categories.slice(0, 4).map((category, index) => (
                    <div key={index} className="bg-yellow-100 p-2 rounded text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs text-gray-600 ml-1">
                        ({Math.round(category.score * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Image Analysis with Azure Computer Vision</h2>
      
      {/* Image URL Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image URL
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter a publicly accessible image URL
        </p>
      </div>

      {/* Analysis Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Analysis Type
        </label>
        <select
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="full">Full Analysis</option>
          <option value="ocr">OCR (Printed Text)</option>
          <option value="read">Read API (Document Text)</option>
          <option value="objects">Object Detection</option>
          <option value="faces">Face Detection</option>
          <option value="tags">Image Tags</option>
          <option value="description">Image Description</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleAnalyze}
          disabled={!imageUrl || isAnalyzing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
        </button>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Clear
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
    </div>
  );
};

export default AzureImageAnalyzer; 