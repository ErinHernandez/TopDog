/**
 * Queue Page - iOS Style
 * 
 * Full page queue view showing user's queued players with drag and drop reordering
 */

import React, { useState, useEffect } from 'react';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import { createTeamGradient } from '../../../../../../lib/gradientUtils';
import { isMobile } from '../../../../../../lib/deviceUtils';
import { getByeWeek } from '../../../../../../lib/nflConstants';
import { POSITION_COLORS } from '../../../constants/positions';
// Note: Scrollbar hiding is now handled globally in globals.css
import PositionBadge from './PositionBadge';

export default function QueuePage({ queuedPlayers = [], onRemoveFromQueue, onReorderQueue, onDraftPlayer, isMyTurn = false }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropLinePosition, setDropLinePosition] = useState(null);
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [clickedIndex, setClickedIndex] = useState(null);

  // Helper to get position color from centralized constants
  const getPositionColor = (position) => {
    return POSITION_COLORS[position]?.primary || '#808080';
  };

  // Handle drag start (desktop only)
  const handleDragStart = (e, index) => {
    if (isMobile()) {
      e.preventDefault();
      return;
    }
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Create invisible drag image to hide default drag preview
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.globalAlpha = 0;
    e.dataTransfer.setDragImage(canvas, 0, 0);
    
    // Don't change cell appearance during drag
    document.body.style.cursor = 'grabbing';
  };

  // Handle drag over (desktop only)
  const handleDragOver = (e, index) => {
    if (isMobile()) {
      return;
    }
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    
    // Always show drop indicator above the hovered cell
    // This indicates the dragged item will be inserted before this cell
    setDropLinePosition(`${index}-above`);
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    document.body.style.cursor = 'auto';
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropLinePosition(null);
  };

  // Handle drop (desktop only)
  const handleDrop = (e, dropIndex) => {
    if (isMobile()) {
      return;
    }
    
    e.preventDefault();
    document.body.style.cursor = 'auto';
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDropLinePosition(null);
      return;
    }

    // Reorder the queue - insert dragged item before the drop target
    const newQueue = [...queuedPlayers];
    const draggedPlayer = newQueue[draggedIndex];
    
    // Remove dragged item
    newQueue.splice(draggedIndex, 1);
    
    // Adjust drop index if we removed an item before it
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    
    // Insert at new position (before the target cell)
    newQueue.splice(adjustedDropIndex, 0, draggedPlayer);
    
    onReorderQueue?.(newQueue);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropLinePosition(null);
  };


  // Handle arrow click with 1.1s delay for single clicks
  const handleArrowClick = (e, index) => {
    e.stopPropagation();
    
    if (index === 0) return; // Already at top
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    // Check for double-click (within 700ms and same index)
    if (timeDiff < 700 && clickedIndex === index) {
      // Double-click: Move player to top of queue with 0.7s delay
      
      // Clear any pending single-click timeout
      if (window.queueArrowTimeout) {
        clearTimeout(window.queueArrowTimeout);
        window.queueArrowTimeout = null;
      }
      
      // Reset click tracking
      setLastClickTime(0);
      setClickedIndex(null);
      
      // Set timeout for double-click action (move to top)
      window.queueArrowTimeout = setTimeout(() => {
        const newQueue = [...queuedPlayers];
        const playerToMove = newQueue[index];
        
        // Remove player from current position
        newQueue.splice(index, 1);
        
        // Insert at the beginning (top of queue)
        newQueue.unshift(playerToMove);
        
        onReorderQueue?.(newQueue);
        window.queueArrowTimeout = null;
      }, 700);
    } else {
      // Single click: Set up 0.7s delay before moving up one position
      setLastClickTime(currentTime);
      setClickedIndex(index);
      
      // Clear any existing timeout
      if (window.queueArrowTimeout) {
        clearTimeout(window.queueArrowTimeout);
      }
      
      // Set new timeout for single-click action
      window.queueArrowTimeout = setTimeout(() => {
        // Only execute if this is still the most recent click
        if (clickedIndex === index) {
          const newQueue = [...queuedPlayers];
          [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
          onReorderQueue?.(newQueue);
          
          // Reset click tracking
          setLastClickTime(0);
          setClickedIndex(null);
        }
        window.queueArrowTimeout = null;
      }, 700);
    }
  };



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
      // Clear any pending arrow click timeout
      if (window.queueArrowTimeout) {
        clearTimeout(window.queueArrowTimeout);
        window.queueArrowTimeout = null;
      }
    };
  }, []);

  return (
    <>
      {/* Scrollbar hiding now handled globally in globals.css */}
      <style jsx>{`
        @media (max-width: 768px) {
          .queue-scroll::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .queue-scroll {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 border-b border-white/10" style={{ paddingTop: '14px', paddingBottom: '16px' }}>
      </div>

      {/* Queue Header */}
      {queuedPlayers.length > 0 && (
        <div className="px-4 py-3 border-b border-white/10 relative">
          <div 
            className="text-xs font-medium text-gray-400 text-center absolute"
            style={{ 
              width: '40px',
              right: '14px', // Moved 5px left from ADP column
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px'
            }}
          >
            ADP
          </div>
        </div>
      )}

      {/* Queue Content */}
      <div 
        className="overflow-y-auto queue-scroll"
        style={{
          height: '600px',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {queuedPlayers.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-lg mb-2">No players queued</div>
            <div className="text-gray-500 text-sm">Add players to your queue from the available players list</div>
          </div>
        ) : (
          <div className="pb-8 px-1">
            {queuedPlayers.map((player, index) => {

              return (
              <div key={`${player.name}-${index}`} className="w-full relative">
                <div 
                  {...(!isMobile() ? {
                    draggable: true,
                    onDragStart: (e) => handleDragStart(e, index),
                    onDragOver: (e) => handleDragOver(e, index),
                    onDragEnd: handleDragEnd,
                    onDrop: (e) => handleDrop(e, index)
                  } : {
                    draggable: false
                  })}
                  className="flex items-center relative overflow-hidden border-b border-white/10 cursor-pointer transition-colors duration-200"
                style={{ 
                  minHeight: '40px', // Fixed height for all cells - matches PlayerListApple
                  height: '40px', // Ensure consistent height
                  backgroundColor: '#1f2833',
                  // Show position-colored border for player being moved (complete 4-sided border)
                  ...(draggedIndex === index && {
                    border: `3px solid ${(() => {
                      switch (player.position) {
                        case 'QB': return '#F472B6';
                        case 'RB': return '#0fba80';
                        case 'WR': return '#FBBF25';
                        case 'TE': return '#7C3AED';
                        default: return '#4285F4';
                      }
                    })()}`
                  }),
                }}
              >
                
                {/* Remove Button - Match Players Tab Circled Minus Style - Moved to right side */}
                <div
                  style={{
                    position: 'absolute',
                     right: '98px', // Moved 18px left from previous position
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 20
                  }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Minus button clicked for player:', player.name);
                      onRemoveFromQueue?.(player);
                    }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: '2px solid #6b7280', // Grey border
                      backgroundColor: 'transparent', // No background
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#ef4444'; // Red on hover
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent'; // Back to transparent
                    }}
                  >
                    <div
                      style={{
                        color: '#ffffff',
                        fontSize: '18px',
                        fontWeight: 'normal',
                        lineHeight: '1',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Arial, sans-serif',
                        textAlign: 'center',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                        pointerEvents: 'none'
                      }}
                    >
                      -
                    </div>
                  </div>
                </div>

                {/* Player Info - Moved Further Right */}
                 <div className="flex-1 min-w-0 relative z-10" style={{ marginTop: '0px', marginLeft: '63px' }}>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium text-white"
                      style={{ 
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {player.name}
                    </div>
                    {/* Team and Bye Week Info with Clean Badge */}
                    <div style={{ 
                      fontSize: '11.5px',
                      marginTop: '1px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {/* Clean Position Badge */}
                      <div style={{
                        position: 'relative',
                        width: '25px',
                        height: '16px',
                        marginRight: '6px',
                        flexShrink: 0
                      }}>
                        <PositionBadge position={player.position} />
                      </div>
                      
                      {/* Team and Bye Week Info */}
                      <span className="text-xs text-gray-400">
                        {player.team} ({getByeWeek(player.team) || 'TBD'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Move Up Arrow - Left Edge */}
                {index > 0 ? (
                  <button
                    onClick={(e) => handleArrowClick(e, index)}
                    className="absolute flex items-center justify-center transition-colors hover:text-gray-300 focus:outline-none"
                    style={{ 
                      left: '16px', // Moved 8px right from left edge
                      top: '50%',
                      transform: 'translateY(-50%)', // Centered vertically
                      flexShrink: 0,
                      zIndex: 15,
                      width: '28px', // Match minus button size
                      height: '28px', // Match minus button size
                      borderRadius: '50%',
                      border: '2px solid #6b7280', // Grey border matching minus button
                      backgroundColor: 'transparent' // No background
                    }}
                    title="Click to move up one position (0.7s delay) • Double-click to move to top"
                  >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-300">
                      <path d="M10 1L2 11h6v8h4V11h6L10 1z"/>
                    </svg>
                  </button>
                ) : null}
                
                
                {/* ADP Value - Just the number */}
                <div
                  className="text-center text-xs font-sans text-gray-400 absolute z-10"
                  style={{
                    fontSize: '13px',
                    right: '9px', // Match players tab ADP positioning
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {parseFloat(player.adp || 0).toFixed(1)}
                </div>
                
                {/* Drop Indicator - separate from player border */}
                {dropLinePosition === `${index}-above` && draggedIndex !== index && (
                  <div 
                    className="absolute left-0 right-0 z-50"
                    style={{ 
                      top: '-6px',
                      height: '12px',
                      backgroundColor: draggedIndex !== null && queuedPlayers[draggedIndex] 
                        ? (() => {
                            switch (queuedPlayers[draggedIndex].position) {
                              case 'QB': return '#F472B6';
                              case 'RB': return '#0fba80';
                              case 'WR': return '#FBBF25';
                              case 'TE': return '#7C3AED';
                              default: return '#4285F4';
                            }
                          })()
                        : '#4285F4'
                    }}
                  />
                )}
                
              </div>

            </div>
            );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
