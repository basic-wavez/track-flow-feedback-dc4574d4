
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWaveformProgressOptions {
  currentTime: number;
  duration: number;
  waveformData: number[];
  isPlaying: boolean;
  isBuffering: boolean;
}

export function useWaveformProgress({
  currentTime,
  duration,
  waveformData,
  isPlaying,
  isBuffering,
}: UseWaveformProgressOptions) {
  const [progressPercent, setProgressPercent] = useState(0);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(document.visibilityState === 'visible');
  
  // Calculate progress percentage based on current time and duration
  useEffect(() => {
    if (duration > 0) {
      const percent = (currentTime / duration) * 100;
      setProgressPercent(Math.min(100, Math.max(0, percent)));
    } else {
      setProgressPercent(0);
    }
  }, [currentTime, duration]);
  
  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      
      // When tab becomes visible, force a progress update
      if (isVisibleRef.current && duration > 0) {
        setProgressPercent((currentTime / duration) * 100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentTime, duration]);
  
  // Calculate time from percent
  const getTimeFromPercent = useCallback((percent: number): number => {
    if (duration <= 0) return 0;
    return (percent / 100) * duration;
  }, [duration]);
  
  // Get percent from mouse position
  const getPercentFromEvent = useCallback((event: React.MouseEvent | React.TouchEvent): number => {
    const element = event.currentTarget as HTMLDivElement;
    const rect = element.getBoundingClientRect();
    const clientX = 'touches' in event 
      ? event.touches[0].clientX
      : event.clientX;
    
    const position = (clientX - rect.left) / rect.width;
    return Math.min(100, Math.max(0, position * 100));
  }, []);
  
  // Handlers for mouse/touch events
  const handleMouseMove = useCallback((event: React.MouseEvent): void => {
    const percent = getPercentFromEvent(event);
    setHoverPercent(percent);
  }, [getPercentFromEvent]);
  
  const handleMouseLeave = useCallback((): void => {
    setHoverPercent(null);
  }, []);
  
  return {
    progressPercent,
    hoverPercent,
    setHoverPercent,
    getTimeFromPercent,
    getPercentFromEvent,
    handleMouseMove,
    handleMouseLeave,
  };
}

export default useWaveformProgress;
