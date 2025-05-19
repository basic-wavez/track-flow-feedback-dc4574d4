
import { useEffect, useRef } from 'react';

interface UseVisibilityEffectsProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

/**
 * Custom hook to handle visibility change effects for audio playback
 * This implementation respects the application's staleTime policy (5 minutes)
 * and prevents unnecessary re-renders or network requests on tab focus
 */
export const useVisibilityEffects = ({
  audioRef,
  isPlaying,
  setIsPlaying
}: UseVisibilityEffectsProps) => {
  const wasPlayingBeforeHideRef = useRef(false);
  const lastInteractionRef = useRef(Date.now());
  
  useEffect(() => {
    // Handler for visibility changes
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;
      
      const currentTime = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;
      
      if (document.visibilityState === 'hidden') {
        // Store playback state when hiding
        wasPlayingBeforeHideRef.current = isPlaying;
        lastInteractionRef.current = currentTime;
      } else if (document.visibilityState === 'visible') {
        // Only take action if it's been a significant time since last interaction
        const timeSinceLastInteraction = currentTime - lastInteractionRef.current;
        
        // Resume audio context if it was suspended
        if (wasPlayingBeforeHideRef.current && audio.paused) {
          // If it was playing before and is now paused, try to resume
          // only if we've been away long enough that the browser might have suspended it
          if (timeSinceLastInteraction > 10000) { // 10 seconds threshold
            audio.play().catch(error => {
              console.error('Failed to resume audio after visibility change', error);
              // Update state to match reality
              setIsPlaying(false);
            });
          }
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
    wasPlayingBeforeHideRef,
    lastInteractionRef
  };
};

// Export additional utility hooks for visibility-aware components
export const useVisibilityAwareEffect = (
  effect: () => void | (() => void),
  deps: React.DependencyList
) => {
  useEffect(() => {
    // Only run the effect when the tab is visible
    if (document.visibilityState === 'hidden') {
      return;
    }
    
    return effect();
  }, [...deps, /* Add document.visibilityState here if needed */]);
};
