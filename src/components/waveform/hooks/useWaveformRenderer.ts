
import { useEffect, RefObject } from 'react';
import { renderWaveform } from '../utils/waveformRenderer';

interface UseWaveformRendererProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  waveformData: number[] | Float32Array; // Updated to support Float32Array
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
    // Skip rendering if we have no waveform data
    if (!waveformData || 
        (Array.isArray(waveformData) && waveformData.length === 0) || 
        (waveformData instanceof Float32Array && waveformData.length === 0)) {
      return;
    }
    
    const drawWaveform = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Calculate the progress position
      const isValidDuration = isFinite(duration) && duration > 0;
      const progress = isValidDuration ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
      const progressPixel = width * progress;
      
      // Use our unified renderer function with the provided waveform data
      renderWaveform(
        ctx, 
        waveformData, 
        width, 
        height, 
        progressPixel, 
        isPlaying, 
        isBuffering, 
        isMp3Available
      );
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
