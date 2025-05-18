
import { useEffect } from "react";

/**
 * Hook that handles audio-related side effects like loadedmetadata, timeupdate, etc.
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
  currentTime,
  hasRestoredAfterTabSwitch = false
}: any) {
  // Effect to handle URL changes and reset state
  useEffect(() => {
    if (!audioUrl) return;
    
    // Skip reset if we've restored after tab switch
    if (hasRestoredAfterTabSwitch) {
      console.log('Skipping audio effects reset after tab switch');
      return;
    }
    
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state when URL changes
    console.log(`Audio URL changed to: ${audioUrl}`);
    setAudioLoaded(false);
    setPlaybackState('loading');

    // Reset any flags for buffering visualization
    clearBufferingTimeout();
    setShowBufferingUI(false);
    bufferingStartTimeRef.current = null;
    
    // Generate waveform visualization for this URL
    // Temporarily set this flag to show the loading state
    setIsGeneratingWaveform(true);
    
    // Give a short delay before attempting to load the audio
    // This helps with browser performance and UI rendering
    setTimeout(() => {
      // Turn off waveform generation indicator after a delay
      setIsGeneratingWaveform(false);
      
      // Load the audio
      if (audioRef.current) {
        audioRef.current.load();
      }
    }, 200);
    
    return () => {
      clearBufferingTimeout();
    };
  }, [audioUrl]);

  // Effect to log playback state changes
  useEffect(() => {
    console.log(`Playback state changed to: ${playbackState}`);
  }, [playbackState]);

  // Effect to update the document title based on playback state
  useEffect(() => {
    // Only update title if we're actually playing and not seeking
    if (playbackState === 'playing' && !recentlySeekRef.current && currentTime > 0) {
      // The title could be updated here if needed based on track info
    }
  }, [playbackState, currentTime]);

  return {}; // This hook doesn't return anything as it's a side-effects hook
}
