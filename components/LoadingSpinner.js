import React from 'react';

export default function LoadingSpinner({ message = "Loading...", size = "medium" }) {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8", 
    large: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-[#3B82F6] ${sizeClasses[size] || sizeClasses.medium}`}></div>
      {message && (
        <div className="mt-3 text-white text-center">
          {message}
        </div>
      )}
    </div>
  );
} 