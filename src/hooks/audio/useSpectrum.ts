import { useState, useEffect, useRef, useMemo } from 'react';

export function useSpectrum(
  analyser: AnalyserNode | null,
  isPlaying: boolean,
  isVisible: boolean,
  showPeaks: boolean = false
) {
  // Create data arrays for current and peak values
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const peakArrayRef = useRef<Uint8Array | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array());
  const [peakData, setPeakData] = useState<Uint8Array>(new Uint8Array());
  
  // Set up the animation frame
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize data arrays when analyser changes
  useEffect(() => {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    
    if (showPeaks) {
      peakArrayRef.current = new Uint8Array(bufferLength).fill(0);
    }
    
    setFrequencyData(new Uint8Array(bufferLength));
    setPeakData(new Uint8Array(bufferLength));
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser]);
  
  // Start the animation loop when playing changes
  useEffect(() => {
    if (!analyser || !dataArrayRef.current || !isPlaying || !isVisible) {
      // Cancel any existing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }
    
    const peakDecay = 2; // How fast peaks fall
    
    const updateData = () => {
      analyser.getByteFrequencyData(dataArrayRef.current!);
      
      if (showPeaks && peakArrayRef.current) {
        // Update peak values - keep the higher value and apply decay
        for (let i = 0; i < dataArrayRef.current!.length; i++) {
          const currentValue = dataArrayRef.current![i];
          if (currentValue > peakArrayRef.current[i]) {
            peakArrayRef.current[i] = currentValue;
          } else {
            peakArrayRef.current[i] = Math.max(0, peakArrayRef.current[i] - peakDecay);
          }
        }
        
        // Create a copy to trigger React update
        setPeakData(new Uint8Array(peakArrayRef.current));
      }
      
      // Create a copy of frequency data to trigger React update
      setFrequencyData(new Uint8Array(dataArrayRef.current!));
      
      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updateData);
    };
    
    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updateData);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isPlaying, isVisible, showPeaks]);
  
  return { frequencyData, peakData };
}
