
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';
import { sharedFrameController } from './useAudioVisualizer';

export interface OscilloscopeOptions {
  lineColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  sensitivity?: number;
  drawMode?: 'line' | 'dots' | 'bars';
  dashPattern?: number[];
  fillColor?: string;
  fillOpacity?: number;
  invertY?: boolean;
  targetFPS?: number;
}

export function useOscilloscopeVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: OscilloscopeOptions = {}
) {
  const dataArray = useRef<Float32Array | null>(null);
  const canvasDimensions = useRef({ width: 0, height: 0 });
  const lastDrawTime = useRef(0);

  // Default options - making sure to use #E7A2C8 (pink) as the default color
  const {
    lineColor = '#E7A2C8',
    lineWidth = 2,
    backgroundColor = 'transparent',
    sensitivity = 1.0,
    drawMode = 'line',
    dashPattern = [],
    fillColor = 'rgba(231, 162, 200, 0.1)', // Semi-transparent pink that matches lineColor
    fillOpacity = 0.2,
    invertY = false,
    targetFPS = 30
  } = options;

  // Initialize the time domain data array with smaller fftSize
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const analyser = audioContext.analyserNode;
    // Reduce fftSize for better performance
    const fftSize = 1024; // Reduced from 2048
    analyser.fftSize = fftSize;
    dataArray.current = new Float32Array(fftSize);
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [audioContext.analyserNode]);

  // Draw the oscilloscope frame
  const draw = () => {
    if (!canvasRef.current || !audioContext.analyserNode || !dataArray.current) {
      return;
    }

    const now = performance.now();
    const frameInterval = 1000 / targetFPS;
    
    // Skip frame if not enough time has elapsed
    if (now - lastDrawTime.current < frameInterval) {
      return;
    }
    
    lastDrawTime.current = now;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance
    
    if (!ctx) return;
    
    // Get current dimensions from the parent element
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.width;
    const height = parent ? parent.clientHeight : canvas.height;
    
    // Only update canvas dimensions if they've changed
    if (canvasDimensions.current.width !== width || canvasDimensions.current.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvasDimensions.current = { width, height };
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
      // Standard line drawing - optimized
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor; // Make sure to use the pink color
      ctx.beginPath();
      
      // Reduce the number of points we draw for better performance
      const skipPoints = Math.max(1, Math.floor(dataArray.current.length / 300));
      
      for (let i = 0; i < dataArray.current.length; i += skipPoints) {
        const x = i * sliceWidth;
        
        const yValue = dataArray.current[i];
        const yValueWithInversion = invertY ? -yValue : yValue;
        const y = height / 2 - (yValueWithInversion * verticalScale);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Fill below the line if fillColor is provided
      if (fillColor !== 'transparent' && fillOpacity > 0) {
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.globalAlpha = fillOpacity;
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset alpha
      }
      
    } else if (drawMode === 'dots') {
      // Draw dots for each sample - optimized to draw fewer points
      ctx.fillStyle = lineColor; // Make sure to use the pink color
      
      // Draw fewer dots for better performance
      const skipPoints = Math.max(2, Math.floor(dataArray.current.length / 100));
      
      for (let i = 0; i < dataArray.current.length; i += skipPoints) {
        const x = i * sliceWidth;
        
        const yValue = dataArray.current[i];
        const yValueWithInversion = invertY ? -yValue : yValue;
        const y = height / 2 - (yValueWithInversion * verticalScale);
        
        ctx.beginPath();
        ctx.arc(x, y, lineWidth, 0, 2 * Math.PI);
        ctx.fill();
      }
      
    } else if (drawMode === 'bars') {
      // Draw vertical bars - optimized
      ctx.fillStyle = lineColor; // Make sure to use the pink color
      
      // Draw fewer bars for better performance
      const skipPoints = Math.max(4, Math.floor(dataArray.current.length / 75));
      
      for (let i = 0; i < dataArray.current.length; i += skipPoints) {
        const x = i * sliceWidth;
        
        const yValue = dataArray.current[i];
        const yValueWithInversion = invertY ? -yValue : yValue;
        const y = height / 2 - (yValueWithInversion * verticalScale);
        
        // Draw bar from center line to signal point
        const barHeight = Math.abs(y - height / 2);
        
        ctx.fillRect(
          x - lineWidth / 2, 
          Math.min(y, height / 2), 
          lineWidth, 
          barHeight
        );
      }
    }
  };
  
  // Define the cleanup function explicitly
  const cleanupFunction = () => {
    sharedFrameController.unregister(draw);
    console.log('Oscilloscope visualizer cleanup executed');
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioContext.isInitialized) {
      // Resume the audio context if it's suspended
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
      sharedFrameController.register(draw);
    } else {
      sharedFrameController.unregister(draw);
    }
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [isPlaying, audioContext.isInitialized, options]);

  return { draw, cleanup: cleanupFunction };
}
