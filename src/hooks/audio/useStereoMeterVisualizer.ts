
import { useRef, useEffect } from 'react';
import { AudioContextState } from './useAudioContext';
import { calculateRMS, linearToDecibels, getLevelColor } from '@/lib/audioAnalysisUtils';

interface StereoMeterOptions {
  meterGap?: number;
  meterWidth?: number;
  peakFalloffSpeed?: number;
  backgroundColor?: string;
}

export function useStereoMeterVisualizer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioContext: AudioContextState,
  isPlaying: boolean,
  options: StereoMeterOptions = {}
) {
  const animationFrameId = useRef<number | null>(null);
  const leftDataArray = useRef<Float32Array | null>(null);
  const rightDataArray = useRef<Float32Array | null>(null);
  const leftPeakLevel = useRef<number>(0);
  const rightPeakLevel = useRef<number>(0);

  // Default options
  const {
    meterGap = 4,
    meterWidth = 20,
    peakFalloffSpeed = 0.05,
    backgroundColor = 'transparent'
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

  // Draw the stereo meter frame
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
    
    // Calculate RMS values for each channel
    const leftRMS = calculateRMS(leftDataArray.current);
    const rightRMS = calculateRMS(rightDataArray.current);
    
    // Convert to decibels
    const leftDB = linearToDecibels(leftRMS);
    const rightDB = linearToDecibels(rightRMS);
    
    // Update peak levels
    if (leftDB > leftPeakLevel.current) {
      leftPeakLevel.current = leftDB;
    } else {
      leftPeakLevel.current -= peakFalloffSpeed;
    }
    
    if (rightDB > rightPeakLevel.current) {
      rightPeakLevel.current = rightDB;
    } else {
      rightPeakLevel.current -= peakFalloffSpeed;
    }
    
    // Scale levels to fit the canvas height (0dB at top, -60dB at bottom)
    const dbMin = -60;
    const dbMax = 0;
    const leftHeight = Math.max(0, (leftDB - dbMin) / (dbMax - dbMin)) * height;
    const rightHeight = Math.max(0, (rightDB - dbMin) / (dbMax - dbMin)) * height;
    
    // Calculate peak positions
    const leftPeakY = height - Math.max(0, (leftPeakLevel.current - dbMin) / (dbMax - dbMin)) * height;
    const rightPeakY = height - Math.max(0, (rightPeakLevel.current - dbMin) / (dbMax - dbMin)) * height;
    
    // Calculate meter positions
    const totalWidth = (meterWidth * 2) + meterGap;
    const startX = (width - totalWidth) / 2;
    
    // Draw left channel meter
    const leftColor = getLevelColor(leftDB);
    ctx.fillStyle = leftColor;
    ctx.fillRect(startX, height - leftHeight, meterWidth, leftHeight);
    
    // Draw right channel meter
    const rightColor = getLevelColor(rightDB);
    ctx.fillStyle = rightColor;
    ctx.fillRect(startX + meterWidth + meterGap, height - rightHeight, meterWidth, rightHeight);
    
    // Draw peak markers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startX, leftPeakY, meterWidth, 2);
    ctx.fillRect(startX + meterWidth + meterGap, rightPeakY, meterWidth, 2);
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L', startX + meterWidth / 2, height - 5);
    ctx.fillText('R', startX + meterWidth + meterGap + meterWidth / 2, height - 5);
    
    // Draw dB scale
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.fillText('0', startX - 5, 10);
    ctx.fillText('-20', startX - 5, height / 3);
    ctx.fillText('-40', startX - 5, (height / 3) * 2);
    ctx.fillText('-60', startX - 5, height - 5);
    
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

  return { draw };
}
