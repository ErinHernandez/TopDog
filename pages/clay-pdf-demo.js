import React from 'react';
import Head from 'next/head';
import ClayPdfProcessor from '../components/ClayPdfProcessor';

export default function ClayPdfDemo() {
  return (
    <>
      <Head>
        <title>Clay PDF Processor - TopDog</title>
        <meta name="description" content="Process Clay projections PDF using Azure Computer Vision" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Clay Projections PDF Processor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Extract text from the Clay projections PDF using Microsoft Azure Computer Vision API.
              Convert PDF pages to images and process them for text extraction.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Source:</strong> ESPN Clay Projections 2025 PDF
              </p>
            </div>
          </div>
          
          <ClayPdfProcessor />
          
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">1. PDF Conversion</h3>
                  <p className="text-gray-600">
                    PDF pages are converted to high-resolution images using pdf2pic library.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Azure Vision API</h3>
                  <p className="text-gray-600">
                    Images are processed through Microsoft Azure Computer Vision API for text extraction.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">3. Text Extraction</h3>
                  <p className="text-gray-600">
                    Extracted text is returned with confidence scores and line-by-line breakdown.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Single Page Processing</h3>
                  <p className="text-gray-600">
                    Process individual pages from the Clay projections PDF for detailed analysis.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Multi-Page Processing</h3>
                  <p className="text-gray-600">
                    Process multiple pages in sequence for comprehensive data extraction.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Read API</h3>
                  <p className="text-gray-600">
                    Advanced document text extraction with layout analysis and handwriting recognition.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">OCR</h3>
                  <p className="text-gray-600">
                    Traditional OCR for printed text extraction with high accuracy.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Use Cases</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Player Data Extraction</h3>
                  <p className="text-gray-600">
                    Extract player names, teams, positions, and projections from the Clay PDF for database population.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Projection Analysis</h3>
                  <p className="text-gray-600">
                    Process fantasy football projections and statistics for analysis and comparison.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Data Validation</h3>
                  <p className="text-gray-600">
                    Verify and cross-reference player data with existing databases and sources.
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