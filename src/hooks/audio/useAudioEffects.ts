
import { useEffect } from "react";

/**
 * Hook that manages side effects for the audio player
 */
export function useAudioEffects({
  audioRef,
  audioUrl,
  setAudioLoaded,
  setPlaybackState,
  setDuration,
  clearBufferingTimeout,
  setShowBufferingUI,
  bufferingStartTimeRef,
  setIsGeneratingWaveform,
  playbackState,
  recentlySeekRef,
  currentTime
}: any) {
  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearBufferingTimeout();
    };
  }, []);
  
  // Reset buffering timer when leaving buffering state
  useEffect(() => {
    if (playbackState !== 'buffering') {
      clearBufferingTimeout();
      bufferingStartTimeRef.current = null;
      
      // Only reset showBufferingUI if we haven't recently seeked
      if (!recentlySeekRef.current) {
        setShowBufferingUI(false);
      }
    }
  }, [playbackState]);

  // Reset the recentlySeek flag after a delay
  useEffect(() => {
    if (recentlySeekRef.current) {
      const timer = setTimeout(() => {
        recentlySeekRef.current = false;
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentTime]); // Depend on currentTime to detect changes after seek
}
