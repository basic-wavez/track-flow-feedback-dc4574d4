
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';

export interface OscilloscopeOptions {
  lineColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  sensitivity?: number;
  drawMode?: 'line' | 'dots' | 'bars';
  dashPattern?: number[]; // For dashed line [dash length, gap length]
  fillColor?: string; // For filled mode
  fillOpacity?: number; // For filled mode transparency
  invertY?: boolean; // Invert the Y axis
}

export function useOscilloscopeVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: OscilloscopeOptions = {}
) {
  const animationFrameId = useRef<number | null>(null);
  const dataArray = useRef<Float32Array | null>(null);
  const lastWidth = useRef<number>(0);
  const lastHeight = useRef<number>(0);

  // Default options
  const {
    lineColor = '#34c759',
    lineWidth = 2,
    backgroundColor = 'transparent',
    sensitivity = 1.0,
    drawMode = 'line',
    dashPattern = [],
    fillColor = 'rgba(52, 199, 89, 0.1)',
    fillOpacity = 0.2,
    invertY = false
  } = options;

  // Initialize the time domain data array
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const analyser = audioContext.analyserNode;
    dataArray.current = new Float32Array(analyser.fftSize);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [audioContext.analyserNode]);

  // Draw the oscilloscope frame
  const draw = () => {
    if (!canvasRef.current || !audioContext.analyserNode || !dataArray.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Get current dimensions from the parent element
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.width;
    const height = parent ? parent.clientHeight : canvas.height;
    
    // Only update canvas dimensions if they've changed
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      
      // Store the last dimensions we set
      lastWidth.current = width;
      lastHeight.current = height;
    }
    
    // Clear the canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Get time domain data
    const analyser = audioContext.analyserNode;
    analyser.getFloatTimeDomainData(dataArray.current);
    
    // Calculate vertical scaling based on sensitivity
    const verticalScale = height * 0.4 * sensitivity;
    const sliceWidth = width / dataArray.current.length;
    
    // Set up dash pattern if specified
    if (dashPattern && dashPattern.length > 0) {
      ctx.setLineDash(dashPattern);
    } else {
      ctx.setLineDash([]);
    }
    
    // Draw the waveform based on draw mode
    if (drawMode === 'line') {
      // Standard line drawing
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;
      ctx.beginPath();
      
      for (let i = 0; i < dataArray.current.length; i++) {
        const x = i * sliceWidth;
        const yNormalized = invertY 
          ? (0.5 - dataArray.current[i] * -0.5) 
          : (0.5 + dataArray.current[i] * -0.5);
        const y = yNormalized * verticalScale + height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Fill below the line if fillColor is provided
      if (fillColor !== 'transparent') {
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.globalAlpha = fillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset alpha
      }
      
    } else if (drawMode === 'dots') {
      // Draw dots for each sample
      ctx.fillStyle = lineColor;
      
      for (let i = 0; i < dataArray.current.length; i += 2) {
        const x = i * sliceWidth;
        const yNormalized = invertY 
          ? (0.5 - dataArray.current[i] * -0.5) 
          : (0.5 + dataArray.current[i] * -0.5);
        const y = yNormalized * verticalScale + height / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, lineWidth, 0, 2 * Math.PI);
        ctx.fill();
      }
      
    } else if (drawMode === 'bars') {
      // Draw vertical bars
      ctx.fillStyle = lineColor;
      
      for (let i = 0; i < dataArray.current.length; i += 4) {
        const x = i * sliceWidth;
        const yNormalized = invertY 
          ? (0.5 - dataArray.current[i] * -0.5) 
          : (0.5 + dataArray.current[i] * -0.5);
        const y = yNormalized * verticalScale + height / 2;
        const barHeight = Math.abs(y - height / 2);
        
        ctx.fillRect(
          x - lineWidth / 2, 
          Math.min(y, height / 2), 
          lineWidth, 
          barHeight
        );
      }
    }
    
    animationFrameId.current = requestAnimationFrame(draw);
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioContext.isInitialized) {
      // Resume the audio context if it's suspended (browser autoplay policy)
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
      animationFrameId.current = requestAnimationFrame(draw);
    } else if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [isPlaying, audioContext.isInitialized, options]);

  return { draw };
}
