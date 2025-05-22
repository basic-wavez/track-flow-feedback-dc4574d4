
import React, { forwardRef } from 'react';

interface VisualizerCanvasProps {
  className?: string;
}

const VisualizerCanvas = forwardRef<HTMLCanvasElement, VisualizerCanvasProps>(
  ({ className = '' }, ref) => {
    return (
      <canvas 
        ref={ref}
        className={`w-full h-full bg-[#1A1A1A] ${className}`}
      />
    );
  }
);

VisualizerCanvas.displayName = 'VisualizerCanvas';

export default VisualizerCanvas;
