/**
 * TournamentBoardMarketing - Marketing-Ready Tournament Board Grid
 * 
 * A blank tournament/draft board grid for marketing materials.
 * Features perfect square cells with position-colored borders.
 * 
 * Design specs:
 * - Square cells (configurable size)
 * - 12 columns (teams) x 18 rows (rounds)
 * - Position-based border colors cycling through QB/RB/WR/TE
 * - Dark cell backgrounds with subtle color variations
 * - Rounded corners matching brand aesthetic
 * 
 * Usage: Homepage hero, marketing materials, social media
 */

import React, { useMemo, type ReactElement, type CSSProperties } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Position colors matching the brand (exact colors from reference)
 * WR: Yellow/Gold, RB: Teal/Green, QB: Pink, TE: Purple
 */
const POSITION_COLORS = {
  WR: '#FBBF24',  // Yellow/Gold
  RB: '#0fba80',  // Teal/Green
  QB: '#F472B6',  // Pink
  TE: '#7C3AED',  // Purple
} as const;

/**
 * Cell background colors - EXACT MATCH to DraftBoard PickCell backgrounds
 * Formula: position color at hex alpha 0x20 (12.5%) over base #101927
 * 
 * Calculation: result = base + (position - base) * 0.125
 * - WR #FBBF25: R=45, G=46, B=39 → #2D2E27
 * - RB #0fba80: R=16, G=45, B=50 → #102D32
 * - QB #F472B6: R=45, G=36, B=57 → #2D2439
 * - TE #7C3AED: R=30, G=29, B=64 → #1E1D40
 */
const CELL_BG_COLORS = {
  // Yellow/Gold border (WR) - #FBBF25 at 12.5% over #101927
  WR: '#2D2E27',
  // Teal/Green border (RB) - #0fba80 at 12.5% over #101927
  RB: '#102D32',
  // Pink border (QB) - #F472B6 at 12.5% over #101927
  QB: '#2D2439',
  // Purple border (TE) - #7C3AED at 12.5% over #101927
  TE: '#1E1D40',
} as const;

/**
 * Reference pattern from the image - exact border color sequence
 * This 12-column pattern repeats and shifts for visual variety
 * Pattern derived from analyzing the reference image row by row
 */
const BORDER_PATTERN: Array<Array<keyof typeof POSITION_COLORS>> = [
  // Row 0
  ['WR', 'RB', 'QB', 'RB', 'WR', 'RB', 'WR', 'RB', 'TE', 'RB', 'WR', 'RB'],
  // Row 1
  ['TE', 'TE', 'RB', 'WR', 'RB', 'QB', 'RB', 'WR', 'RB', 'TE', 'RB', 'WR'],
  // Row 2
  ['QB', 'RB', 'RB', 'RB', 'WR', 'RB', 'TE', 'RB', 'QB', 'RB', 'WR', 'RB'],
  // Row 3
  ['WR', 'QB', 'RB', 'QB', 'RB', 'WR', 'RB', 'TE', 'RB', 'WR', 'RB', 'QB'],
  // Row 4
  ['RB', 'WR', 'RB', 'RB', 'RB', 'QB', 'RB', 'RB', 'WR', 'RB', 'TE', 'RB'],
  // Row 5
  ['TE', 'RB', 'WR', 'RB', 'TE', 'RB', 'QB', 'RB', 'RB', 'WR', 'RB', 'WR'],
  // Row 6
  ['QB', 'RB', 'RB', 'WR', 'RB', 'WR', 'RB', 'TE', 'RB', 'QB', 'RB', 'RB'],
  // Row 7
  ['WR', 'TE', 'RB', 'QB', 'RB', 'RB', 'WR', 'RB', 'WR', 'RB', 'QB', 'RB'],
  // Row 8
  ['RB', 'RB', 'WR', 'RB', 'TE', 'RB', 'QB', 'RB', 'RB', 'WR', 'RB', 'TE'],
  // Row 9
  ['TE', 'RB', 'QB', 'RB', 'RB', 'WR', 'RB', 'WR', 'RB', 'TE', 'RB', 'QB'],
  // Row 10
  ['RB', 'WR', 'RB', 'TE', 'RB', 'QB', 'RB', 'RB', 'WR', 'RB', 'WR', 'RB'],
  // Row 11
  ['QB', 'RB', 'WR', 'RB', 'WR', 'RB', 'TE', 'RB', 'QB', 'RB', 'RB', 'WR'],
];

/**
 * Default board configuration
 */
const DEFAULT_CONFIG = {
  columns: 12,       // Number of teams
  rows: 18,          // Number of rounds
  cellSize: 80,      // Square cell size in pixels
  borderWidth: 3,    // Border width in pixels
  borderRadius: 10,  // Corner radius in pixels
  gap: 2,            // Gap between cells in pixels
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentBoardMarketingProps {
  /** Number of columns (teams) - default 12 */
  columns?: number;
  /** Number of rows (rounds) - default 18 */
  rows?: number;
  /** Cell size in pixels (square) - default 80 */
  cellSize?: number;
  /** Border width in pixels - default 3 */
  borderWidth?: number;
  /** Border radius in pixels - default 10 */
  borderRadius?: number;
  /** Gap between cells in pixels - default 2 */
  gap?: number;
  /** Whether to animate the board */
  animated?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom style */
  style?: CSSProperties;
}

interface CellData {
  row: number;
  col: number;
  borderColor: string;
  bgColor: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get border color from the exact reference pattern
 * Pattern repeats every 12 rows, wraps for columns
 */
function getBorderColor(row: number, col: number): string {
  const patternRow = row % BORDER_PATTERN.length;
  const patternCol = col % BORDER_PATTERN[0].length;
  const position = BORDER_PATTERN[patternRow][patternCol];
  return POSITION_COLORS[position];
}

/**
 * Get position key for a cell
 */
function getPositionKey(row: number, col: number): keyof typeof POSITION_COLORS {
  const patternRow = row % BORDER_PATTERN.length;
  const patternCol = col % BORDER_PATTERN[0].length;
  return BORDER_PATTERN[patternRow][patternCol];
}

/**
 * Get background color MATCHED to border color
 * Each cell's background corresponds to its border color family
 */
function getBgColor(row: number, col: number): string {
  const position = getPositionKey(row, col);
  return CELL_BG_COLORS[position];
}

/**
 * Generate the grid data
 */
function generateGridData(rows: number, cols: number): CellData[][] {
  const grid: CellData[][] = [];
  
  for (let row = 0; row < rows; row++) {
    const rowData: CellData[] = [];
    for (let col = 0; col < cols; col++) {
      rowData.push({
        row,
        col,
        borderColor: getBorderColor(row, col),
        bgColor: getBgColor(row, col),
      });
    }
    grid.push(rowData);
  }
  
  return grid;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CellProps {
  data: CellData;
  size: number;
  borderWidth: number;
  borderRadius: number;
  animated?: boolean;
}

function Cell({ data, size, borderWidth, borderRadius, animated }: CellProps): ReactElement {
  const animationDelay = animated ? `${(data.row * 0.02 + data.col * 0.03)}s` : undefined;
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
        border: `${borderWidth}px solid ${data.borderColor}`,
        backgroundColor: data.bgColor,
        boxSizing: 'border-box',
        flexShrink: 0,
        // Subtle inner shadow for depth
        boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3)`,
        // Animation
        animation: animated ? 'cellFadeIn 0.5s ease-out forwards' : undefined,
        animationDelay,
        opacity: animated ? 0 : 1,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TournamentBoardMarketing({
  columns = DEFAULT_CONFIG.columns,
  rows = DEFAULT_CONFIG.rows,
  cellSize = DEFAULT_CONFIG.cellSize,
  borderWidth = DEFAULT_CONFIG.borderWidth,
  borderRadius = DEFAULT_CONFIG.borderRadius,
  gap = DEFAULT_CONFIG.gap,
  animated = false,
  className = '',
  style,
}: TournamentBoardMarketingProps): ReactElement {
  // Generate grid data (memoized for performance)
  const gridData = useMemo(
    () => generateGridData(rows, columns),
    [rows, columns]
  );
  
  // Calculate total dimensions
  const totalWidth = columns * cellSize + (columns - 1) * gap;
  const totalHeight = rows * cellSize + (rows - 1) * gap;
  
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: gap,
        backgroundColor: '#0d1117',
        padding: gap,
        borderRadius: borderRadius + 4,
        ...style,
      }}
      role="img"
      aria-label={`Tournament board grid with ${columns} teams and ${rows} rounds`}
    >
      {/* Animation keyframes */}
      {animated && (
        <style>{`
          @keyframes cellFadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      )}
      
      {gridData.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            gap: gap,
          }}
        >
          {row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              data={cell}
              size={cellSize}
              borderWidth={borderWidth}
              borderRadius={borderRadius}
              animated={animated}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PRESET EXPORTS
// ============================================================================

/**
 * Pre-configured board for homepage hero
 * Larger cells, optimized for desktop viewport
 */
export function HomepageHeroBoard(props: Partial<TournamentBoardMarketingProps>): ReactElement {
  return (
    <TournamentBoardMarketing
      cellSize={72}
      borderWidth={3}
      borderRadius={8}
      gap={3}
      animated
      {...props}
    />
  );
}

/**
 * Pre-configured board for social media
 * Square aspect ratio, fits 1080x1080
 */
export function SocialMediaBoard(props: Partial<TournamentBoardMarketingProps>): ReactElement {
  return (
    <TournamentBoardMarketing
      columns={10}
      rows={10}
      cellSize={100}
      borderWidth={4}
      borderRadius={12}
      gap={4}
      {...props}
    />
  );
}

/**
 * Pre-configured board for thumbnail/preview
 * Compact size
 */
export function ThumbnailBoard(props: Partial<TournamentBoardMarketingProps>): ReactElement {
  return (
    <TournamentBoardMarketing
      cellSize={32}
      borderWidth={2}
      borderRadius={4}
      gap={1}
      {...props}
    />
  );
}

