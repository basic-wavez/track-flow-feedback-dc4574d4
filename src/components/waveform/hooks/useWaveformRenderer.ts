
import { useEffect, RefObject } from 'react';
import { 
  drawWaveformBars, 
  drawPulseEffects, 
  drawPlayhead 
} from '../utils/waveformDrawing';

interface UseWaveformRendererProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  waveformData: number[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isMp3Available: boolean;
}

export const useWaveformRenderer = ({
  canvasRef,
  waveformData,
  currentTime,
  duration,
  isPlaying,
  isBuffering,
  isMp3Available
}: UseWaveformRendererProps) => {
  useEffect(() => {
    const drawWaveform = () => {
      const canvas = canvasRef.current;
      if (!canvas || waveformData.length === 0) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear the canvas
      ctx.clearRect(0, 0, width, height);
      
      // Calculate the progress position
      const isValidDuration = isFinite(duration) && duration > 0;
      const progress = isValidDuration ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
      const progressPixel = width * progress;
      
      // Draw the waveform bars
      drawWaveformBars(ctx, waveformData, width, height, progressPixel, isMp3Available);
      
      // Draw pulse effects
      drawPulseEffects(ctx, waveformData, width, height, progressPixel, isPlaying, isBuffering);
      
      // Draw playhead and buffering indicator
      drawPlayhead(ctx, width, height, progressPixel, isBuffering);
    };
    
    // Draw the waveform
    drawWaveform();
    
    // Set up animation if playing or buffering
    let animationFrame: number;
    if (isPlaying || isBuffering) {
      const animate = () => {
        drawWaveform();
        animationFrame = requestAnimationFrame(animate);
      };
      
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [
    canvasRef,
    waveformData,
    currentTime,
    duration,
    isPlaying,
    isBuffering,
    isMp3Available
  ]);
};
