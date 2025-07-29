import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-70" onClick={onClose}></div>
      <div className="relative bg-gray-800 rounded-xl shadow-2xl p-8 z-10 border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-white">×</button>
        {children}
      </div>
    </div>
  );
} 