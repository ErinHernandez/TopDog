/**
 * Ripple Effect Component
 * 
 * Creates a pond-like ripple effect that radiates from a specific point
 * Used for urgent timer warnings when user is on the clock
 */

import React, { useState, useEffect } from 'react';

export default function RippleEffect({ 
  isActive = false, 
  centerX = '50%', 
  centerY = '50%',
  onComplete = null 
}) {
  const [ripples, setRipples] = useState([]);
  const [animationId, setAnimationId] = useState(0);

  useEffect(() => {
    if (isActive) {
      // Create multiple ripples for a more realistic pond effect
      const newAnimationId = Date.now();
      setAnimationId(newAnimationId);
      
      const createRipple = (delay = 0, intensity = 1) => {
        setTimeout(() => {
          const rippleId = `${newAnimationId}-${Date.now()}-${Math.random()}`;
          const newRipple = {
            id: rippleId,
            intensity,
            startTime: Date.now()
          };
          
          setRipples(prev => [...prev, newRipple]);
          
          // Remove ripple after animation completes
          setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== rippleId));
          }, 2000);
        }, delay);
      };

      // Create multiple ripples with slight delays for realistic effect
      createRipple(0, 1);      // Main ripple
      createRipple(300, 0.7);  // Second ripple
      createRipple(600, 0.5);  // Third ripple
      
      // Call onComplete callback after all ripples
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    }
  }, [isActive, onComplete]);

  if (!isActive && ripples.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute"
          style={{
            left: centerX,
            top: centerY,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: `2px solid rgba(239, 68, 68, ${0.8 * ripple.intensity})`, // Red color with opacity
            animation: `rippleExpand 2s ease-out forwards`,
            animationDelay: '0s'
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes rippleExpand {
          0% {
            width: 20px;
            height: 20px;
            opacity: 0.8;
            border-width: 3px;
          }
          50% {
            opacity: 0.4;
            border-width: 2px;
          }
          100% {
            width: 200vmax;
            height: 200vmax;
            opacity: 0;
            border-width: 1px;
          }
        }
        
        @media (max-width: 768px) {
          @keyframes rippleExpand {
            0% {
              width: 20px;
              height: 20px;
              opacity: 0.8;
              border-width: 3px;
            }
            50% {
              opacity: 0.4;
              border-width: 2px;
            }
            100% {
              width: 300vmax;
              height: 300vmax;
              opacity: 0;
              border-width: 1px;
            }
          }
        }
      `}</style>
    </div>
  );
}
