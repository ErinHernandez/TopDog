import React, { useState, useEffect } from 'react';

export default function PerformanceMonitor({ enabled = false }) {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    renderTime: 0,
    frameRate: 0,
    gpuLayers: 0
  });

  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      // Memory usage
      if (performance.memory) {
        const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        setMetrics(prev => ({ ...prev, memoryUsage: memoryMB }));
      }

      // Frame rate monitoring
      let lastTime = performance.now();
      let frameCount = 0;
      
      const measureFrameRate = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          setMetrics(prev => ({ ...prev, frameRate: frameCount }));
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFrameRate);
      };
      
      measureFrameRate();
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Performance Monitor</div>
      <div>Memory: {metrics.memoryUsage}MB</div>
      <div>FPS: {metrics.frameRate}</div>
      <div>GPU Layers: {metrics.gpuLayers}</div>
      <div style={{ marginTop: '5px', fontSize: '10px', color: '#ccc' }}>
        {metrics.memoryUsage > 100 && '⚠️ High memory usage'}
        {metrics.frameRate < 30 && '⚠️ Low frame rate'}
      </div>
    </div>
  );
}
