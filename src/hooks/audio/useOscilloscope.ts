
import { useState, useEffect, useRef } from 'react';

export function useOscilloscope(
  analyser: AnalyserNode | null,
  isPlaying: boolean,
  isVisible: boolean
) {
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [timeData, setTimeData] = useState<Uint8Array>(new Uint8Array());
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize data array when analyser changes
  useEffect(() => {
    if (!analyser) return;
    
    const bufferLength = analyser.fftSize;
    dataArrayRef.current = new Uint8Array(bufferLength);
    setTimeData(new Uint8Array(bufferLength));
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser]);
  
  // Start the animation loop when playing changes
  useEffect(() => {
    if (!analyser || !dataArrayRef.current || !isPlaying || !isVisible) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }
    
    const updateData = () => {
      analyser.getByteTimeDomainData(dataArrayRef.current!);
      setTimeData(new Uint8Array(dataArrayRef.current!));
      animationFrameRef.current = requestAnimationFrame(updateData);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateData);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isPlaying, isVisible]);
  
  return { timeData };
}
