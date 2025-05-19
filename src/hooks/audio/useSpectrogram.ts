
import { useState, useEffect, useRef } from 'react';

export function useSpectrogram(
  analyser: AnalyserNode | null,
  isPlaying: boolean,
  isVisible: boolean,
  width: number,
  height: number
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize the offscreen canvas and data array
  useEffect(() => {
    if (!analyser || !width || !height) return;
    
    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    
    // Create an offscreen canvas for the spectrogram
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;
    
    // Mark as initialized
    setIsInitialized(true);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvasRef.current = null;
    };
  }, [analyser, width, height]);
  
  // Update spectrogram when playing or visibility changes
  useEffect(() => {
    if (!analyser || !dataArrayRef.current || !canvasRef.current || !isPlaying || !isVisible || !isInitialized) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Create a frequency to color mapper
    const getColorForFrequency = (value: number): string => {
      // Rainbow-like gradient: blue (low) -> cyan -> green -> yellow -> red (high)
      if (value < 40) return `rgb(0, 0, ${Math.floor(value * 6.375)})`; // blue
      if (value < 80) return `rgb(0, ${Math.floor((value - 40) * 6.375)}, 255)`; // blue to cyan
      if (value < 120) return `rgb(0, 255, ${Math.floor(255 - (value - 80) * 6.375)})`; // cyan to green
      if (value < 170) return `rgb(${Math.floor((value - 120) * 5.1)}, 255, 0)`; // green to yellow
      if (value < 210) return `rgb(255, ${Math.floor(255 - (value - 170) * 6.375)}, 0)`; // yellow to red
      return `rgb(255, 0, 0)`; // red
    };
    
    const updateSpectrogram = () => {
      // Get frequency data
      analyser.getByteFrequencyData(dataArrayRef.current!);
      
      // Shift the existing spectrogram left by 1 pixel
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(canvas, 1, 0, canvas.width - 1, canvas.height, 0, 0, canvas.width - 1, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw the new column of frequency data
      const x = canvas.width - 1;
      const sliceHeight = Math.max(1, canvas.height / dataArrayRef.current!.length);
      
      for (let i = 0; i < dataArrayRef.current!.length; i++) {
        const value = dataArrayRef.current![i];
        ctx.fillStyle = getColorForFrequency(value);
        
        // Draw from bottom to top (low frequencies at the bottom)
        const y = canvas.height - (i * sliceHeight) - sliceHeight;
        ctx.fillRect(x, y, 1, sliceHeight);
      }
      
      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updateSpectrogram);
    };
    
    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updateSpectrogram);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isPlaying, isVisible, isInitialized]);
  
  return { canvasRef, isInitialized };
}
