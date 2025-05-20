import { useRef, useEffect, useState } from 'react';
import { AudioContextState } from './useAudioContext';
import { calculateApproximateLUFS, getLevelColor } from '@/lib/audioAnalysisUtils';

interface LUFSMeterOptions {
  meterWidth?: number;
  backgroundColor?: string;
  historyLength?: number;
}

export function useLUFSMeterVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: LUFSMeterOptions = {}
) {
  const animationFrameId = useRef<number | null>(null);
  const leftDataArray = useRef<Float32Array | null>(null);
  const rightDataArray = useRef<Float32Array | null>(null);
  const [currentLUFS, setCurrentLUFS] = useState<number>(-Infinity);
  const shortTermLUFSHistory = useRef<number[]>([]);
  const integratedLUFS = useRef<number>(-Infinity);
  const lastUpdateTime = useRef<number>(0);

  // Default options
  const {
    meterWidth = 40,
    backgroundColor = 'transparent',
    historyLength = 100
  } = options;

  // Initialize the data arrays
  useEffect(() => {
    if (!audioContext.leftAnalyserNode || !audioContext.rightAnalyserNode) return;
    
    const leftFftSize = audioContext.leftAnalyserNode.fftSize;
    const rightFftSize = audioContext.rightAnalyserNode.fftSize;
    
    leftDataArray.current = new Float32Array(leftFftSize);
    rightDataArray.current = new Float32Array(rightFftSize);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [audioContext.leftAnalyserNode, audioContext.rightAnalyserNode]);

  // Draw the LUFS meter frame
  const draw = () => {
    if (!canvasRef.current || !audioContext.leftAnalyserNode || !audioContext.rightAnalyserNode || 
        !leftDataArray.current || !rightDataArray.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Make sure the canvas dimensions match the element's display size
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    
    // Clear the canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Get time domain data for both channels
    audioContext.leftAnalyserNode.getFloatTimeDomainData(leftDataArray.current);
    audioContext.rightAnalyserNode.getFloatTimeDomainData(rightDataArray.current);
    
    // Update LUFS calculation every ~100ms to avoid too frequent updates
    const now = performance.now();
    if (now - lastUpdateTime.current > 100) {
      // Calculate LUFS
      const lufs = calculateApproximateLUFS(
        leftDataArray.current,
        rightDataArray.current
      );
      
      // Update short-term LUFS history
      if (isFinite(lufs) && lufs > -70) { // Ignore initial silence
        shortTermLUFSHistory.current.push(lufs);
        // Keep history to limited size
        if (shortTermLUFSHistory.current.length > historyLength) {
          shortTermLUFSHistory.current.shift();
        }
        
        // Calculate integrated LUFS (simplified - average of history)
        const validLufs = shortTermLUFSHistory.current.filter(val => isFinite(val) && val > -70);
        if (validLufs.length > 0) {
          integratedLUFS.current = validLufs.reduce((sum, val) => sum + val, 0) / validLufs.length;
        }
        
        setCurrentLUFS(lufs);
      }
      
      lastUpdateTime.current = now;
    }
    
    // Scale LUFS to fit the canvas height (-23 LUFS target at center)
    const lufsMin = -40;
    const lufsMax = 0;
    const targetLUFS = -23; // EBU R128 target for broadcast content
    
    // Draw LUFS meter
    const centerX = width / 2;
    const startX = centerX - meterWidth / 2;
    
    // Calculate meter height
    const lufsValue = isFinite(currentLUFS) ? currentLUFS : lufsMin;
    const meterHeight = Math.max(0, (lufsValue - lufsMin) / (lufsMax - lufsMin)) * height;
    
    // Calculate integrated LUFS height
    const integratedValue = isFinite(integratedLUFS.current) ? integratedLUFS.current : lufsMin;
    const integratedHeight = Math.max(0, (integratedValue - lufsMin) / (lufsMax - lufsMin)) * height;
    
    // Calculate target LUFS position
    const targetHeight = (targetLUFS - lufsMin) / (lufsMax - lufsMin) * height;
    
    // Draw background meter
    ctx.fillStyle = '#333333';
    ctx.fillRect(startX, 0, meterWidth, height);
    
    // Draw target line
    ctx.fillStyle = '#4CD964';
    ctx.fillRect(startX, height - targetHeight - 1, meterWidth, 2);
    
    // Draw instantaneous LUFS
    const lufsColor = getLevelColor(lufsValue);
    ctx.fillStyle = lufsColor;
    ctx.fillRect(startX, height - meterHeight, meterWidth, meterHeight);
    
    // Draw integrated LUFS marker
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(startX, height - integratedHeight - 1, meterWidth, 2);
    
    // Draw LUFS values
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    
    // Format LUFS values to 1 decimal place
    const instantaneousText = isFinite(lufsValue) 
      ? `${lufsValue.toFixed(1)} LUFS` 
      : 'N/A';
    
    const integratedText = isFinite(integratedLUFS.current) 
      ? `${integratedLUFS.current.toFixed(1)} LUFS` 
      : 'N/A';
    
    // Draw texts
    ctx.fillText('Short-term', centerX, 15);
    ctx.fillText(instantaneousText, centerX, 30);
    
    ctx.fillText('Integrated', centerX, height - 30);
    ctx.fillText(integratedText, centerX, height - 15);
    
    animationFrameId.current = requestAnimationFrame(draw);
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioContext.isInitialized && 
        audioContext.leftAnalyserNode && audioContext.rightAnalyserNode) {
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

  return { currentLUFS, integratedLUFS: integratedLUFS.current };
}
