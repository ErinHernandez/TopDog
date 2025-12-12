import React, { Suspense, lazy } from 'react';
import LoadingSpinner from '../../../LoadingSpinner';
import ErrorBoundary from '../ui/ErrorBoundary';

/**
 * ElementRenderer - Dynamic component loading system
 * 
 * This allows for easy element replacement and updates:
 * - Dynamic imports for code splitting
 * - Lazy loading for performance
 * - Error boundaries for stability
 * - Hot-swappable components
 * - A/B testing support
 */

// Component registry for easy updates
const COMPONENT_REGISTRY = {
  // Header elements
  'navbar': lazy(() => import('../ui/Navbar')),
  'draft-timer': lazy(() => import('../ui/DraftTimer')),
  'room-info': lazy(() => import('../ui/RoomInfo')),
  
  // Sidebar elements
  'player-list': lazy(() => import('../ui/PlayerList')),
  'player-search': lazy(() => import('../ui/PlayerSearch')),
  'queue-manager': lazy(() => import('../ui/QueueManager')),
  'rankings': lazy(() => import('../ui/Rankings')),
  
  // Center elements
  'draft-board': lazy(() => import('../ui/DraftBoard')),
  'pick-cards': lazy(() => import('../ui/PickCards')),
  'pick-history': lazy(() => import('../ui/PickHistory')),
  
  // Right panel elements
  'team-roster': lazy(() => import('../ui/TeamRoster')),
  'draft-stats': lazy(() => import('../ui/DraftStats')),
  'chat': lazy(() => import('../ui/Chat')),
  
  // Footer elements
  'controls': lazy(() => import('../ui/Controls')),
  'settings': lazy(() => import('../ui/Settings')),
  
  // Special elements
  'full-board': lazy(() => import('../ui/FullBoard')),
  'player-card': lazy(() => import('../ui/PlayerCard')),
  
  // Development elements (can be easily swapped)
  'dev-tools': lazy(() => import('../dev/DevTools')),
  'performance-monitor': lazy(() => import('../dev/PerformanceMonitor'))
};

/**
 * Load component version (for A/B testing or gradual rollouts)
 */
const getComponentVersion = (elementType, version) => {
  if (version && version !== 'default') {
    const versionedKey = `${elementType}-${version}`;
    if (COMPONENT_REGISTRY[versionedKey]) {
      return COMPONENT_REGISTRY[versionedKey];
    }
  }
  return COMPONENT_REGISTRY[elementType];
};

/**
 * Element wrapper with error handling and loading states
 */
const ElementWrapper = ({ element, zone }) => {
  const { type, props = {}, version, id } = element;
  
  const Component = getComponentVersion(type, version);
  
  if (!Component) {
    console.warn(`Component not found: ${type}${version ? ` (version: ${version})` : ''}`);
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded">
        <p className="text-red-400">Component not found: {type}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      fallback={
        <div className="p-4 bg-red-900/20 border border-red-500 rounded">
          <p className="text-red-400">Element error: {type}</p>
        </div>
      }
    >
      <Suspense 
        fallback={
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner size="small" />
          </div>
        }
      >
        <Component 
          {...props} 
          elementId={id}
          zone={zone}
        />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Main ElementRenderer component
 */
export default function ElementRenderer({ zone, elements = [] }) {
  if (!elements || elements.length === 0) {
    return null;
  }

  return (
    <div className={`zone-${zone}`}>
      {elements.map((element, index) => (
        <ElementWrapper 
          key={element.id || `${zone}-${index}`}
          element={element}
          zone={zone}
        />
      ))}
    </div>
  );
}

/**
 * Register new component (for runtime updates)
 */
export const registerComponent = (key, component) => {
  COMPONENT_REGISTRY[key] = component;
};

/**
 * Get available components
 */
export const getAvailableComponents = () => {
  return Object.keys(COMPONENT_REGISTRY);
};