
import React, { useRef, useEffect, useState } from 'react';
import { useSpectrogram } from '@/hooks/audio/useSpectrogram';
import { useVisualizer } from '@/context/VisualizerContext';

interface SpectrogramVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

const SpectrogramVisualizer: React.FC<SpectrogramVisualizerProps> = ({ 
  analyserNode, 
  isPlaying 
}) => {
  const { isVisible } = useVisualizer();
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 150 });
  
  // Get the offscreen canvas from the hook
  const { canvasRef: offscreenCanvasRef, isInitialized } = useSpectrogram(
    analyserNode,
    isPlaying,
    isVisible,
    dimensions.width,
    dimensions.height
  );
  
  // Update dimensions when the canvas size changes
  useEffect(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    
    const updateDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      
      if (width !== dimensions.width || height !== dimensions.height) {
        setDimensions({ width, height });
        
        // Update canvas dimensions
        canvas.width = width;
        canvas.height = height;
      }
    };
    
    // Initial size
    updateDimensions();
    
    // Listen for resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(canvas);
    
    return () => resizeObserver.disconnect();
  }, [dimensions]);
  
  // Copy from offscreen canvas to display canvas
  useEffect(() => {
    const displayCanvas = displayCanvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    
    if (!displayCanvas || !offscreenCanvas || !isInitialized) return;
    
    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;
    
    const updateCanvas = () => {
      ctx.drawImage(offscreenCanvas, 0, 0, displayCanvas.width, displayCanvas.height);
      requestAnimationFrame(updateCanvas);
    };
    
    const animationFrame = requestAnimationFrame(updateCanvas);
    return () => cancelAnimationFrame(animationFrame);
  }, [offscreenCanvasRef, isInitialized]);
  
  return (
    <canvas 
      ref={displayCanvasRef} 
      className="w-full h-full"
      width={dimensions.width}
      height={dimensions.height}
    />
  );
};

export default React.memo(SpectrogramVisualizer);
