import React from 'react';
import Head from 'next/head';
import AzureImageAnalyzer from '../components/AzureImageAnalyzer';

export default function AzureVisionDemo() {
  return (
    <>
      <Head>
        <title>Azure Computer Vision Demo - TopDog</title>
        <meta name="description" content="Test Microsoft Azure Computer Vision API with image analysis" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Microsoft Azure Computer Vision API Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Analyze images using Microsoft Azure Computer Vision API. 
              Extract text, detect objects, faces, and get detailed image descriptions.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Free Tier:</strong> 5,000 transactions per month
              </p>
            </div>
          </div>
          
          <AzureImageAnalyzer />
          
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Azure Computer Vision Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">OCR (Optical Character Recognition)</h3>
                  <p className="text-gray-600">
                    Extract printed text from images with high accuracy and support for multiple languages.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Read API</h3>
                  <p className="text-gray-600">
                    Advanced document text extraction with layout analysis and handwriting recognition.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Object Detection</h3>
                  <p className="text-gray-600">
                    Detect and identify objects in images with bounding boxes and confidence scores.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Face Detection</h3>
                  <p className="text-gray-600">
                    Detect faces and analyze emotions, age, and other facial attributes.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Image Analysis</h3>
                  <p className="text-gray-600">
                    Get detailed descriptions, tags, and categories for images.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Brand Detection</h3>
                  <p className="text-gray-600">
                    Identify commercial brands and logos in images.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
