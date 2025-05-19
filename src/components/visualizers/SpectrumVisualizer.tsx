
import React, { useRef, useEffect } from 'react';
import { useSpectrum } from '@/hooks/audio/useSpectrum';
import { useVisualizer } from '@/context/VisualizerContext';

interface SpectrumVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({ 
  analyserNode, 
  isPlaying 
}) => {
  const { theme, isVisible, showPeaks } = useVisualizer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { frequencyData, peakData } = useSpectrum(analyserNode, isPlaying, isVisible, showPeaks);
  
  // Render the spectrum on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frequencyData.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up dimensions
    const width = canvas.width;
    const height = canvas.height;
    const barCount = Math.min(128, frequencyData.length); // Limit bars for performance
    const barWidth = width / barCount;
    const barGap = Math.max(1, barWidth * 0.2); // Gap between bars, min 1px
    const barThickness = barWidth - barGap;
    
    // Create gradient for bars
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, theme.primary);
    gradient.addColorStop(1, theme.secondary || theme.primary);
    
    // Draw frequency bars
    for (let i = 0; i < barCount; i++) {
      // Apply frequency scaling - emphasize mids and highs, log scale for better visualization
      const index = Math.floor(i * frequencyData.length / barCount);
      
      // Calculate bar height with a logarithmic scale for better visual response
      // Add small base value so bars are visible even when silent
      const value = frequencyData[index];
      const barHeight = (Math.log(value + 1) / Math.log(256)) * height;
      
      // Draw the bar
      ctx.fillStyle = gradient;
      ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barThickness,
        barHeight
      );
      
      // Draw peak indicator if enabled
      if (showPeaks && peakData.length > 0) {
        const peakValue = peakData[index];
        const peakHeight = (Math.log(peakValue + 1) / Math.log(256)) * height;
        
        ctx.fillStyle = theme.lineColor || '#ffffff';
        ctx.fillRect(
          i * barWidth,
          height - peakHeight - 2,
          barThickness,
          2
        );
      }
    }
  }, [frequencyData, peakData, theme, showPeaks]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      width={500}
      height={150}
    />
  );
};

export default React.memo(SpectrumVisualizer);
