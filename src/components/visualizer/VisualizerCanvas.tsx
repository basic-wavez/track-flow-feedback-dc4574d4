
import React, { forwardRef } from 'react';

interface VisualizerCanvasProps {
  className?: string;
}

const VisualizerCanvas = forwardRef<HTMLCanvasElement, VisualizerCanvasProps>(
  ({ className = '' }, ref) => {
    return (
      <canvas 
        ref={ref}
        className={`w-full h-24 rounded-md ${className}`}
        role="img"
        aria-label="Audio frequency visualizer"
      />
    );
  }
);

VisualizerCanvas.displayName = 'VisualizerCanvas';

export default VisualizerCanvas;
