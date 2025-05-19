
import { useEffect, useRef } from 'react';

interface UseVisibilityEffectsProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

/**
 * Custom hook to handle visibility change effects for audio playback
 */
export const useVisibilityEffects = ({
  audioRef,
  isPlaying,
  setIsPlaying
}: UseVisibilityEffectsProps) => {
  const wasPlayingBeforeHideRef = useRef(false);
  
  useEffect(() => {
    // Handler for visibility changes
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;
      
      if (document.visibilityState === 'hidden') {
        // Store playback state when hiding
        wasPlayingBeforeHideRef.current = isPlaying;
      } else if (document.visibilityState === 'visible') {
        // Resume audio context if it was suspended
        if (wasPlayingBeforeHideRef.current && audio.paused) {
          // If it was playing before and is now paused, try to resume
          audio.play().catch(error => {
            console.error('Failed to resume audio after visibility change', error);
            // Update state to match reality
            setIsPlaying(false);
          });
        }
      }
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioRef, isPlaying, setIsPlaying]);
  
  return {
    wasPlayingBeforeHideRef
  };
};
