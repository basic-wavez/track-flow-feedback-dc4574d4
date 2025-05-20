
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';

interface OscilloscopeOptions {
  lineColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  sensitivity?: number;
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
    sensitivity = 1.0
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
    // This prevents continuous resizing that causes the growing issue
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
    
    // Set up line style
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.beginPath();
    
    // Calculate vertical scaling based on sensitivity
    const verticalScale = height * 0.4 * sensitivity;
    const sliceWidth = width / dataArray.current.length;
    
    // Draw the waveform
    for (let i = 0; i < dataArray.current.length; i++) {
      const x = i * sliceWidth;
      const y = (0.5 + dataArray.current[i] * -0.5) * verticalScale + height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
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
  }, [isPlaying, audioContext.isInitialized]);

  return { draw };
}
