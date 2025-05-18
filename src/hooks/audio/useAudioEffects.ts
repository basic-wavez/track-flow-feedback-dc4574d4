
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
  hasRestoredAfterTabSwitch = false,
  allowBackgroundPlayback = false, // New prop for background playback
  timeUpdateActiveRef = { current: true } // Ref to control time updates
}: any) {
  // Track if this effect has already run for this URL
  const hasInitializedRef = useRef(false);
  const prevAudioUrlRef = useRef<string | undefined>(undefined);
  const visibilityChangeRef = useRef<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  
  // Store audio state in session storage to preserve across tab switches
  const storeAudioState = () => {
    if (!audioUrl || !audioRef.current) return;
    
    try {
      const stateToStore = {
        url: audioUrl,
        currentTime: audioRef.current?.currentTime || 0,
        playbackState,
        lastUpdated: Date.now()
      };
      
      sessionStorage.setItem('audioPlayerState', JSON.stringify(stateToStore));
    } catch (e) {
      console.warn('Error storing audio state in session storage:', e);
    }
  };
  
  // Effect to save audio state before tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityChangeRef.current++;
      
      if (document.visibilityState === 'hidden') {
        console.log('useAudioEffects: Tab becoming hidden, storing state');
        storeAudioState();
        
        // If background playback is enabled, disable time updates but let audio continue
        if (allowBackgroundPlayback && audioRef.current && !audioRef.current.paused) {
          console.log('useAudioEffects: Background playback enabled, disabling UI updates');
          timeUpdateActiveRef.current = false;
        }
      } else if (document.visibilityState === 'visible') {
        console.log('useAudioEffects: Tab became visible');
        
        // Always re-enable time updates when returning to visible state
        timeUpdateActiveRef.current = true;
        
        // If we have background playback and audio is playing, force a sync
        if (allowBackgroundPlayback && audioRef.current && !audioRef.current.paused) {
          console.log('useAudioEffects: Syncing time after returning to visible tab');
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
  }, [audioUrl, playbackState, allowBackgroundPlayback]);
  
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
    
    // Always ensure time updates are enabled when loading new audio
    timeUpdateActiveRef.current = true;
    
    // Generate waveform visualization for this URL
    // Temporarily set this flag to show the loading state
    setIsGeneratingWaveform(true);
    
    // Try to restore state from session storage on tab switches
    let shouldRestoreState = false;
    try {
      const storedStateJson = sessionStorage.getItem('audioPlayerState');
      
      if (storedStateJson) {
        const storedState = JSON.parse(storedStateJson);
        const timeSinceUpdate = Date.now() - storedState.lastUpdated;
        
        if (storedState.url === audioUrl && timeSinceUpdate < 3600000) { // 1 hour max
          shouldRestoreState = true;
          console.log('Found stored audio state to restore:', storedState);
        }
      }
    } catch (e) {
      console.warn('Error retrieving audio state from session storage:', e);
    }
    
    // Give a short delay before attempting to load the audio
    // This helps with browser performance and UI rendering
    setTimeout(() => {
      // Turn off waveform generation indicator after a delay
      setIsGeneratingWaveform(false);
      
      // Load the audio if we're still mounted and the URL hasn't changed
      if (audioRef.current && prevAudioUrlRef.current === audioUrl) {
        audioRef.current.load();
        
        // If we have stored state to restore and background playback isn't enabled
        if (shouldRestoreState && !allowBackgroundPlayback) {
          try {
            const storedState = JSON.parse(sessionStorage.getItem('audioPlayerState') || '{}');
            if (storedState.currentTime > 0 && audioRef.current) {
              console.log(`Restoring audio time to ${storedState.currentTime}`);
              audioRef.current.currentTime = storedState.currentTime;
            }
          } catch (e) {
            console.warn('Error restoring audio state:', e);
          }
        }
      }
    }, 200);
    
    return () => {
      clearBufferingTimeout();
    };
  }, [audioUrl, hasRestoredAfterTabSwitch]);

  // Effect to log playback state changes
  useEffect(() => {
    console.log(`Playback state changed to: ${playbackState}`);
    
    // Store state updates to session storage
    storeAudioState();
  }, [playbackState]);

  // Effect to update the document title based on playback state
  useEffect(() => {
    // Only update title if we're actually playing and not seeking
    if (playbackState === 'playing' && !recentlySeekRef.current && currentTime > 0) {
      // The title could be updated here if needed based on track info
      storeAudioState();
    }
  }, [playbackState, currentTime]);

  // Return a flag indicating if this is a restored session after tab switch
  return { 
    isRestoredSession: hasRestoredAfterTabSwitch,
    visibilityChanges: visibilityChangeRef.current
  };
}
