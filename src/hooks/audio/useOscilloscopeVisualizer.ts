
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';
import { sharedFrameController } from './useAudioVisualizer';
import { OscilloscopeOptions } from './oscilloscope/types';
import { drawOscilloscope } from './oscilloscope/drawingUtils';

export type { OscilloscopeOptions } from './oscilloscope/types';

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
    
    // Get time domain data
    const analyser = audioContext.analyserNode;
    analyser.getFloatTimeDomainData(dataArray.current);
    
    // Draw the oscilloscope using the utility function
    drawOscilloscope(ctx, dataArray.current, width, height, {
      lineColor,
      lineWidth,
      backgroundColor,
      sensitivity,
      drawMode,
      dashPattern,
      fillColor,
      fillOpacity,
      invertY
    });
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
