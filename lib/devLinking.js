import React from 'react';
import Link from 'next/link';

// DevLink component for development navigation
export const DevLink = ({ href, children, className = "", ...props }) => {
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
};

// DevButton component for development actions
export const DevButton = ({ onClick, children, className = "", ...props }) => {
  return (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  );
};

// DevSection component for development sections
export const DevSection = ({ children, className = "", ...props }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// DevText component for development text
export const DevText = ({ children, className = "", ...props }) => {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}; 