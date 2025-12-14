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
                    Identify and locate objects within images with bounding box coordinates.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Face Detection</h3>
                  <p className="text-gray-600">
                    Detect faces and analyze age, gender, and facial expressions.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Image Tagging</h3>
                  <p className="text-gray-600">
                    Automatically generate descriptive tags for images with confidence scores.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Image Description</h3>
                  <p className="text-gray-600">
                    Generate natural language descriptions of image content.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Sample Image URLs for Testing</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Text Images</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• https://raw.githubusercontent.com/microsoft/Azure-Computer-Vision-API/master/Samples/OCR/OCR-1.jpg</li>
                    <li>• https://raw.githubusercontent.com/microsoft/Azure-Computer-Vision-API/master/Samples/OCR/OCR-2.jpg</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Object/Face Images</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• https://raw.githubusercontent.com/microsoft/Azure-Computer-Vision-API/master/Samples/Images/Objects.jpg</li>
                    <li>• https://raw.githubusercontent.com/microsoft/Azure-Computer-Vision-API/master/Samples/Images/Faces.jpg</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 