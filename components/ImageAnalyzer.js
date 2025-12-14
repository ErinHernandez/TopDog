import React, { useState, useRef } from 'react';

const ImageAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analysisType, setAnalysisType] = useState('full');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setResults(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResults(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(selectedFile);
      
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          imageType: selectedFile.type,
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

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const clearResults = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderResults = () => {
    if (!results) return null;

    switch (analysisType) {
      case 'text':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Detected Text:</h3>
            <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
              {Array.isArray(results) && results.length > 0 ? (
                results.map((text, index) => (
                  <p key={index} className="mb-2">{text}</p>
                ))
              ) : (
                <p className="text-gray-500">No text detected</p>
              )}
            </div>
          </div>
        );

      case 'labels':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Detected Labels:</h3>
            <div className="grid grid-cols-2 gap-2">
              {Array.isArray(results) && results.length > 0 ? (
                results.map((label, index) => (
                  <div key={index} className="bg-blue-100 p-2 rounded">
                    <span className="font-medium">{label.description}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({Math.round(label.confidence * 100)}%)
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No labels detected</p>
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
                    <p><strong>Confidence:</strong> {Math.round(face.confidence * 100)}%</p>
                    <p><strong>Joy:</strong> {face.joy}</p>
                    <p><strong>Sorrow:</strong> {face.sorrow}</p>
                    <p><strong>Anger:</strong> {face.anger}</p>
                    <p><strong>Surprise:</strong> {face.surprise}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No faces detected</p>
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
                    <span className="font-medium">{object.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({Math.round(object.confidence * 100)}%)
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No objects detected</p>
              )}
            </div>
          </div>
        );

      case 'full':
      default:
        return (
          <div className="mt-4 space-y-4">
            {/* Text Results */}
            <div>
              <h3 className="text-lg font-bold mb-2">Detected Text:</h3>
              <div className="bg-gray-100 p-4 rounded-lg max-h-32 overflow-y-auto">
                {results.text && results.text.length > 0 ? (
                  results.text.slice(1).map((text, index) => (
                    <p key={index} className="mb-1 text-sm">{text.description}</p>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No text detected</p>
                )}
              </div>
            </div>

            {/* Labels Results */}
            <div>
              <h3 className="text-lg font-bold mb-2">Detected Labels:</h3>
              <div className="grid grid-cols-3 gap-2">
                {results.labels && results.labels.length > 0 ? (
                  results.labels.slice(0, 6).map((label, index) => (
                    <div key={index} className="bg-blue-100 p-2 rounded text-sm">
                      <span className="font-medium">{label.description}</span>
                      <span className="text-xs text-gray-600 ml-1">
                        ({Math.round(label.score * 100)}%)
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No labels detected</p>
                )}
              </div>
            </div>

            {/* Objects Results */}
            <div>
              <h3 className="text-lg font-bold mb-2">Detected Objects:</h3>
              <div className="grid grid-cols-3 gap-2">
                {results.objects && results.objects.length > 0 ? (
                  results.objects.slice(0, 6).map((object, index) => (
                    <div key={index} className="bg-purple-100 p-2 rounded text-sm">
                      <span className="font-medium">{object.name}</span>
                      <span className="text-xs text-gray-600 ml-1">
                        ({Math.round(object.score * 100)}%)
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No objects detected</p>
                )}
              </div>
            </div>

            {/* Faces Results */}
            <div>
              <h3 className="text-lg font-bold mb-2">Detected Faces:</h3>
              <div className="space-y-2">
                {results.faces && results.faces.length > 0 ? (
                  results.faces.map((face, index) => (
                    <div key={index} className="bg-green-100 p-2 rounded text-sm">
                      <p><strong>Confidence:</strong> {Math.round(face.detectionConfidence * 100)}%</p>
                      <p><strong>Joy:</strong> {face.joyLikelihood}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No faces detected</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Image Analysis with Google Cloud Vision</h2>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full h-64 object-contain border rounded-lg"
          />
        </div>
      )}

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
          <option value="text">Text Detection</option>
          <option value="document">Document Text</option>
          <option value="labels">Label Detection</option>
          <option value="faces">Face Detection</option>
          <option value="objects">Object Detection</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing}
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

export default ImageAnalyzer; 