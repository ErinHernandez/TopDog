import Head from 'next/head';
import React from 'react';

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
                    Extracted text is parsed and structured into player data for database integration.
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
