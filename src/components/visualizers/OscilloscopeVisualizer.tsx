
import React, { useRef, useEffect } from 'react';
import { useOscilloscope } from '@/hooks/audio/useOscilloscope';
import { useVisualizer } from '@/context/VisualizerContext';

interface OscilloscopeVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

const OscilloscopeVisualizer: React.FC<OscilloscopeVisualizerProps> = ({ 
  analyserNode, 
  isPlaying 
}) => {
  const { theme, isVisible } = useVisualizer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { timeData } = useOscilloscope(analyserNode, isPlaying, isVisible);
  
  // Render the oscilloscope on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !timeData.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up dimensions
    const width = canvas.width;
    const height = canvas.height;
    const mid = height / 2;
    const lineWidth = 2;
    
    // Set up line style
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = theme.lineColor || theme.primary;
    
    // Draw time-domain waveform
    ctx.beginPath();
    
    // Calculate how many points to skip for better performance
    const skipFactor = Math.max(1, Math.floor(timeData.length / width));
    
    for (let i = 0; i < timeData.length; i += skipFactor) {
      // Normalize value (0-255 -> -1 to 1) and scale to canvas height
      const x = (i / skipFactor) * (width / (timeData.length / skipFactor));
      const y = ((timeData[i] / 128.0) - 1) * mid + mid;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }, [timeData, theme]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      width={500}
      height={150}
    />
  );
};

export default React.memo(OscilloscopeVisualizer);
