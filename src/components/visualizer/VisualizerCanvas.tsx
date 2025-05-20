
import React, { forwardRef, useEffect, useRef } from 'react';

interface VisualizerCanvasProps {
  className?: string;
}

const VisualizerCanvas = forwardRef<HTMLCanvasElement, VisualizerCanvasProps>(
  ({ className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
    // Set ref from forwardRef and our local ref
    useEffect(() => {
      if (typeof ref === 'function') {
        if (canvasRef.current) ref(canvasRef.current);
      } else if (ref) {
        // @ts-ignore - We know ref.current is assignable
        ref.current = canvasRef.current;
      }
    }, [ref]);
    
    return (
      <canvas 
        ref={canvasRef}
        className={`w-full h-full rounded-md ${className}`}
        style={{ maxHeight: '100%', objectFit: 'contain' }}
        role="img"
        aria-label="Audio frequency visualizer"
      />
    );
  }
);

VisualizerCanvas.displayName = 'VisualizerCanvas';

export default VisualizerCanvas;
