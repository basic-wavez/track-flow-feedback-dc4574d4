
import { useEffect, useRef } from "react";
import { getLastVisibilityState, didTabBecomeVisible } from "@/components/waveform/WaveformCache";

/**
 * Hook that handles audio-related side effects like loadedmetadata, timeupdate, etc.
 * Enhanced to properly handle tab switching
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
  setCurrentTime, // Add this parameter to fix the error
  hasRestoredAfterTabSwitch = false,
  allowBackgroundPlayback = false, // New prop for background playback
  timeUpdateActiveRef = { current: true } // Ref to control time updates
}: any) {
  // Track if this effect has already run for this URL
  const hasInitializedRef = useRef(false);
  const prevAudioUrlRef = useRef<string | undefined>(undefined);
  const visibilityChangeRef = useRef<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  
  // Effect to handle URL changes and reset state
  useEffect(() => {
    if (!audioUrl) return;
    
    // Skip reset if we've restored after tab switch
    if (hasRestoredAfterTabSwitch) {
      console.log('Skipping audio effects reset after tab switch');
      return;
    }
    
    // Skip if we've already initialized this URL and it hasn't changed
    if (hasInitializedRef.current && prevAudioUrlRef.current === audioUrl) {
      console.log(`Audio URL ${audioUrl} already initialized, skipping redundant reset`);
      return;
    }
    
    const audio = audioRef.current;
    if (!audio) return;

    // Update refs to prevent redundant initialization
    hasInitializedRef.current = true;
    prevAudioUrlRef.current = audioUrl;

    // Reset state when URL changes
    console.log(`Audio URL changed to: ${audioUrl}`);
    setAudioLoaded(false);
    setPlaybackState('loading');

    // Reset any flags for buffering visualization
    clearBufferingTimeout();
    setShowBufferingUI(false);
    bufferingStartTimeRef.current = null;
    
    // Always ensure time updates are enabled
    timeUpdateActiveRef.current = true;
    
    // Generate waveform visualization for this URL
    // Temporarily set this flag to show the loading state
    setIsGeneratingWaveform(true);
    
    // Give a short delay before attempting to load the audio
    // This helps with browser performance and UI rendering
    setTimeout(() => {
      // Turn off waveform generation indicator after a delay
      setIsGeneratingWaveform(false);
      
      // Load the audio if we're still mounted and the URL hasn't changed
      if (audioRef.current && prevAudioUrlRef.current === audioUrl) {
        audioRef.current.load();
      }
    }, 200);
    
    return () => {
      clearBufferingTimeout();
    };
  }, [audioUrl, hasRestoredAfterTabSwitch]);

  // Effect to handle visibility changes for tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityChangeRef.current++;
      
      if (document.visibilityState === 'visible') {
        console.log('useAudioEffects: Tab became visible');
        
        // When returning to visible state, read the current time from the audio element
        if (audioRef.current) {
          // Sync UI with actual audio position
          setCurrentTime(audioRef.current.currentTime || 0);
          
          // Reset seeking state to ensure we can seek after returning
          recentlySeekRef.current = false;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioUrl, playbackState]);

  // Effect to log playback state changes
  useEffect(() => {
    console.log(`Playback state changed to: ${playbackState}`);
  }, [playbackState]);

  // Return a flag indicating if this is a restored session after tab switch
  return { 
    isRestoredSession: hasRestoredAfterTabSwitch,
    visibilityChanges: visibilityChangeRef.current
  };
}
