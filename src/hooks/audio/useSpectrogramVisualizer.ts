
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';
import { sharedFrameController } from './useAudioVisualizer';
import { SpectrogramOptions } from './types/spectrogramTypes';
import { generateColorCache, RGBColor } from './utils/colorMapUtils';
import { 
  renderSpectrogram, 
  drawFrequencyLabels, 
  computeLogPositionCache 
} from './utils/spectrogramRenderer';

export function useSpectrogramVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: SpectrogramOptions = {}
) {
  const dataArray = useRef<Uint8Array | null>(null);
  const spectrogramData = useRef<Uint8Array[]>([]);
  const lastDrawTime = useRef<number>(0);
  const canvasDimensions = useRef({ width: 0, height: 0 });
  const frameCount = useRef(0);
  const colorCache = useRef<RGBColor[]>(Array(256).fill({r: 0, g: 0, b: 0}));
  const logPositionCache = useRef<number[]>([]);
  const devicePixelRatio = useRef<number>(window.devicePixelRatio || 1);

  // Default options
  const {
    colorStart = '#000033',
    colorMid = '#9b87f5',
    colorEnd = '#ff0000',
    timeScale = 2.0,
    backgroundColor = '#000000',
    maxFrequency = 15000,
    targetFPS = 20,
    bufferSize = 200,
    fftSize = 32768,
    smoothingTimeConstant = 0,
    minDecibels = -100,
    maxDecibels = -30,
    useLogScale = true,
    useDevicePixelRatio = true,
    colorMap = 'default',
  } = options;

  // Initialize the frequency data array
  useEffect(() => {
    if (!audioContext.analyserNode) return;
    
    const analyser = audioContext.analyserNode;
    
    // Apply the new FFT settings
    try {
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      
      console.log(`Spectrogram: Applied FFT settings - fftSize: ${fftSize}, smoothing: ${smoothingTimeConstant}, dB range: ${minDecibels} to ${maxDecibels}`);
    } catch (e) {
      console.warn(`Spectrogram: Could not set requested fftSize ${fftSize}, using maximum allowed by browser:`, e);
      // Some browsers limit fftSize, so we handle the error gracefully
    }
    
    dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [audioContext.analyserNode, fftSize, smoothingTimeConstant, minDecibels, maxDecibels]);

  // Generate the color map based on the selected palette
  useEffect(() => {
    colorCache.current = generateColorCache(colorMap, colorStart, colorMid, colorEnd);
    console.log(`Generated color map: ${colorMap}`);
  }, [colorMap, colorStart, colorMid, colorEnd]);

  // Function to initialize or resize the spectrogram buffer based on canvas dimensions
  const initializeSpectrogramBuffer = (width: number) => {
    if (!dataArray.current) return;
    
    // Use the actual canvas width as the buffer size to ensure full width coverage
    const actualBufferSize = Math.max(width, bufferSize);
    
    spectrogramData.current = Array(actualBufferSize)
      .fill(null)
      .map(() => new Uint8Array(dataArray.current?.length || 0).fill(0));
    
    console.log(`Spectrogram buffer resized: ${actualBufferSize} columns (canvas width: ${width}px)`);
  };

  // Draw the spectrogram frame
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
    
    frameCount.current += 1;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    if (!ctx) return;
    
    // Get current dimensions from the parent element
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : canvas.width;
    const height = parent ? parent.clientHeight : canvas.height;
    
    // Handle canvas dimension changes
    if (canvasDimensions.current.width !== width || canvasDimensions.current.height !== height) {
      // Apply device pixel ratio scaling for sharper rendering
      if (useDevicePixelRatio) {
        const dpr = devicePixelRatio.current;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // Scale the context to counter the DPR scaling of the canvas
        ctx.scale(dpr, dpr);
        
        // Set style dimensions to maintain layout size
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        console.log(`Spectrogram: Applied DPR scaling ${dpr}x to canvas`);
      } else {
        // Standard sizing without DPR scaling
        canvas.width = width;
        canvas.height = height;
      }
      
      canvasDimensions.current = { width, height };
      
      // Initialize or resize spectrogram buffer when dimensions change
      initializeSpectrogramBuffer(width);
      
      // Update the log position cache when dimensions change
      if (useLogScale && dataArray.current) {
        const sampleRate = audioContext.audioContext?.sampleRate || 44100;
        logPositionCache.current = computeLogPositionCache(
          height, 
          dataArray.current.length, 
          maxFrequency, 
          sampleRate
        );
      }
      
      // Clear the canvas completely
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      // Draw frequency labels once
      drawFrequencyLabels(ctx, height, useLogScale);
    }
    
    // Update audio data at a rate based on timeScale
    // Lower timeScale = slower movement, higher timeScale = faster movement
    const updateInterval = 1000 / 30 / timeScale;
    if (now - lastDrawTime.current >= updateInterval) {
      // Get frequency data
      audioContext.analyserNode.getByteFrequencyData(dataArray.current);
      
      // Shift the spectrogram data buffer to make space for new data
      // Only shift when we actually have new data to add
      for (let i = spectrogramData.current.length - 1; i > 0; i--) {
        spectrogramData.current[i] = spectrogramData.current[i - 1];
      }
      
      // Add the new data at index 0 (newest data)
      spectrogramData.current[0] = new Uint8Array(dataArray.current);
      
      lastDrawTime.current = now;
      
      // Calculate frequency bin information for rendering
      const sampleRate = audioContext.audioContext?.sampleRate || 44100;
      const nyquist = sampleRate / 2;
      const binCount = dataArray.current.length;
      const maxBinIndex = Math.floor((maxFrequency / nyquist) * binCount);
      
      // Render the spectrogram
      renderSpectrogram(
        ctx,
        { width, height },
        spectrogramData.current,
        colorCache.current,
        {
          useLogScale,
          maxBinIndex,
          logPositionCache: logPositionCache.current
        }
      );
      
      // Redraw the frequency labels on top to ensure they're visible
      if (frameCount.current % 30 === 0) {
        drawFrequencyLabels(ctx, height, useLogScale);
      }
    }
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioContext.isInitialized) {
      // Resume the audio context if it's suspended
      if (audioContext.audioContext?.state === 'suspended') {
        audioContext.audioContext.resume().catch(console.error);
      }
      
      // Initialize the spectrogram buffer when starting to play
      // But only if we already have canvas dimensions
      if (canvasDimensions.current.width > 0 && dataArray.current) {
        initializeSpectrogramBuffer(canvasDimensions.current.width);
        
        // Initialize log position cache if using log scale
        if (useLogScale) {
          const sampleRate = audioContext.audioContext?.sampleRate || 44100;
          logPositionCache.current = computeLogPositionCache(
            canvasDimensions.current.height,
            dataArray.current.length,
            maxFrequency,
            sampleRate
          );
        }
      }
      
      frameCount.current = 0;
      sharedFrameController.register(draw);
    } else {
      sharedFrameController.unregister(draw);
    }
    
    return () => {
      sharedFrameController.unregister(draw);
    };
  }, [isPlaying, audioContext.isInitialized, bufferSize, useLogScale]);

  return { draw };
}
