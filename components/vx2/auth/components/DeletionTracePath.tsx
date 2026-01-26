/**
 * DeletionTracePath – Path user must trace to confirm account deletion
 *
 * Why we have this: People have accidentally deleted accounts by pocket-dialing,
 * brushing the screen, or hitting buttons by mistake (e.g. in other apps like Underdog).
 * Tracing this path with a finger ensures a real person is intentionally confirming.
 *
 * Directions: Trace the path from the green circle (start) to the red circle (end)
 * with your finger. You must complete the path to continue.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

const W = 240;
const H = 120;
// Path: start left → right → down → left → down → right to end (simple maze-ish shape)
const PATH = 'M 24 60 L 100 60 L 100 30 L 140 30 L 140 90 L 216 90';
const TOLERANCE = 28;
const COMPLETE_THRESHOLD = 0.98;

const COLORS = {
  bg: 'rgba(255,255,255,0.05)',
  path: 'rgba(255,255,255,0.25)',
  traced: '#10B981',
  start: '#10B981',
  end: '#EF4444',
};

export interface DeletionTracePathProps {
  onComplete: () => void;
  disabled?: boolean;
}

export function DeletionTracePath({ onComplete, disabled }: DeletionTracePathProps): React.ReactElement {
  const [progress, setProgress] = useState(0);
  const [pathLength, setPathLength] = useState(320);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const el = pathRef.current;
    if (el) setPathLength(el.getTotalLength());
  }, []);

  const getClosestT = useCallback((x: number, y: number): number => {
    const path = pathRef.current;
    if (!path) return -1;
    const len = path.getTotalLength();
    let bestT = 0;
    let bestD = 1e9;
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * len;
      const pt = path.getPointAtLength(t);
      const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        bestT = t;
      }
    }
    return bestD <= TOLERANCE * TOLERANCE ? bestT / len : -1;
  }, []);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled) return;
      const rect = pathRef.current?.closest('svg')?.getBoundingClientRect();
      if (!rect) return;
      const x = ((clientX - rect.left) / rect.width) * W;
      const y = ((clientY - rect.top) / rect.height) * H;
      const t = getClosestT(x, y);
      if (t >= 0) {
        setProgress((p) => Math.max(p, t));
        setPoints((prev) => (prev.length >= 20 ? [...prev.slice(1), { x, y }] : [...prev, { x, y }]));
      }
    },
    [disabled, getClosestT]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      handlePointer(e.clientX, e.clientY);
    },
    [handlePointer]
  );
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setPoints([]);
      handlePointer(e.clientX, e.clientY);
    },
    [handlePointer]
  );

  useEffect(() => {
    if (progress >= COMPLETE_THRESHOLD) {
      onComplete();
    }
  }, [progress, onComplete]);

  const tracedLength = progress * pathLength;

  return (
    <div>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
        <strong>Why we ask you to trace:</strong> People have accidentally deleted accounts by
        pocket-dialing or brushing the screen. Tracing this path ensures a real person is
        intentionally confirming.
      </p>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12 }}>
        <strong>What to do:</strong> Trace from the green circle to the red circle with your finger.
      </p>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ maxWidth: W, height: H, touchAction: 'none', background: COLORS.bg, borderRadius: 12 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => {}}
        onPointerUp={() => {}}
      >
        <defs>
          <linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={COLORS.traced} />
            <stop offset={progress} stopColor={COLORS.traced} />
            <stop offset={progress} stopColor={COLORS.path} />
            <stop offset="1" stopColor={COLORS.path} />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={PATH}
          fill="none"
          stroke="url(#traceGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength - tracedLength}
        />
        <circle cx={24} cy={60} r={10} fill={COLORS.start} />
        <circle cx={216} cy={90} r={10} fill={COLORS.end} />
      </svg>
    </div>
  );
}

export default DeletionTracePath;
