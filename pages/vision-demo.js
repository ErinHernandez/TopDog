import React from 'react';
import Head from 'next/head';
import ImageAnalyzer from '../components/ImageAnalyzer';

export default function VisionDemo() {
  return (
    <>
      <Head>
        <title>Cloud Vision API Demo - TopDog</title>
        <meta name="description" content="Test Google Cloud Vision API with image analysis" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Google Cloud Vision API Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload an image to analyze it using Google Cloud Vision API. 
              Detect text, objects, faces, and labels in your images.
            </p>
          </div>
          
          <ImageAnalyzer />
          
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Text Detection</h3>
                  <p className="text-gray-600">
                    Extract text from images, including handwritten text and printed documents.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Label Detection</h3>
                  <p className="text-gray-600">
                    Identify objects, places, and activities in images with confidence scores.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Face Detection</h3>
                  <p className="text-gray-600">
                    Detect faces and analyze emotions like joy, sorrow, anger, and surprise.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Object Detection</h3>
                  <p className="text-gray-600">
                    Locate and identify objects within images with bounding box coordinates.
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