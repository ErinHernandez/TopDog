import React from 'react';

function Error({ statusCode, err }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </h1>
        <p className="text-lg text-gray-300">
          {statusCode === 404 
            ? 'The page you are looking for does not exist.'
            : 'Something went wrong. Please try refreshing the page.'
          }
        </p>
        {err && process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 p-4 bg-gray-800 rounded text-sm text-red-400 overflow-auto max-w-md">
            {err.message}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-[#c4b5fd] text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-[#2DE2C5] transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, err };
};

export default Error; 