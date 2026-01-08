import React from 'react';

function Custom500() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Error 500
        </h1>
        <p className="text-lg text-gray-300">
          Internal server error. Please try again later.
        </p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          className="mt-6 bg-[#c4b5fd] text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-[#2DE2C5] transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export default Custom500; 