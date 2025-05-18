
import { useRef, useEffect, useState } from "react";
import { useAudioState } from "./useAudioState";
import { useBufferingState } from "./useBufferingState";
import { useAudioEvents } from "./useAudioEvents";
import { useAudioControls } from "./useAudioControls";
import { useAudioEffects } from "./useAudioEffects";
import { startPlayTracking, endPlayTracking, cancelPlayTracking } from "@/services/playCountService";

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface UseAudioPlayerProps {
  mp3Url: string | null | undefined;
  defaultAudioUrl?: string;
  trackId?: string;
  shareKey?: string;
}

// Track which audio we've already loaded to prevent double-loading on tab switch
const loadedAudioCache = new Set<string>();

export function useAudioPlayer({ 
  mp3Url, 
  defaultAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav",
  trackId,
  shareKey
}: UseAudioPlayerProps) {
  // Create audio element reference
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Determine the audio URL to use - prefer MP3 if available
  const audioUrl = mp3Url || defaultAudioUrl;
  
  // Track whether we've restored state after tab switch
  const [hasRestoredAfterTabSwitch, setHasRestoredAfterTabSwitch] = useState(false);
  
  // State for the audio player
  const {
    isPlaying, setIsPlaying,
    currentTime, setCurrentTime,
    duration, setDuration,
    volume, setVolume,
    isMuted, setIsMuted,
    playbackState, setPlaybackState,
    loadRetries, setLoadRetries,
    isGeneratingWaveform, setIsGeneratingWaveform,
    audioLoaded, setAudioLoaded,
    showBufferingUI, setShowBufferingUI
  } = useAudioState(defaultAudioUrl);
  
  // Buffering state management
  const {
    bufferingTimeoutRef,
    bufferingStartTimeRef,
    lastSeekTimeRef,
    recentlySeekRef,
    playClickTimeRef,
    clearBufferingTimeout
  } = useBufferingState();

  // Store the last known position for tab switching
  const lastKnownPositionRef = useRef<number>(0);
  const audioLoadedStateRef = useRef<boolean>(false);
  const visibilityStateRef = useRef<'visible' | 'hidden'>(
    document.visibilityState === 'visible' ? 'visible' : 'hidden'
  );
  
  // Track if this is the first load to avoid unnecessary localStorage operations
  const isFirstLoadRef = useRef(true);
  
  // Save audio state to localStorage for persistence across page navigations
  const saveAudioStateToStorage = () => {
    try {
      const audio = audioRef.current;
      if (!audio) return;
      
      const stateToSave = {
        currentTime: audio.currentTime,
        duration: audio.duration,
        isPlaying: !audio.paused,
        volume: audio.volume,
        isMuted: audio.muted,
        trackId,
        shareKey,
        audioUrl,
        timestamp: Date.now()
      };
      
      // Use localStorage instead of sessionStorage for better persistence
      localStorage.setItem(`audioState_${trackId || audioUrl}`, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Error saving audio state to localStorage:', e);
    }
  };
  
  // Restore audio state from localStorage
  const restoreAudioStateFromStorage = () => {
    try {
      const storedState = localStorage.getItem(`audioState_${trackId || audioUrl}`);
      if (storedState) {
        const state = JSON.parse(storedState);
        
        // Only restore if it's the same track and not too old (within last 4 hours)
        if (
          (state.trackId === trackId || state.audioUrl === audioUrl) &&
          Date.now() - state.timestamp < 4 * 60 * 60 * 1000
        ) {
          const audio = audioRef.current;
          if (!audio) return false;
          
          console.log('Restoring audio state from localStorage:', state.currentTime);
          
          // Restore the audio position
          if (isFinite(state.currentTime) && state.currentTime > 0) {
            audio.currentTime = state.currentTime;
            setCurrentTime(state.currentTime);
          }
          
          // Restore volume settings
          if (isFinite(state.volume)) {
            audio.volume = state.volume;
            setVolume(state.volume);
          }
          
          if (state.isMuted) {
            audio.muted = true;
            setIsMuted(true);
          }
          
          // Mark as loaded if we've loaded this URL before
          if (loadedAudioCache.has(audioUrl)) {
            console.log('Audio was previously loaded, restoring loaded state');
            setAudioLoaded(true);
          }
          
          return true;
        }
      }
    } catch (e) {
      console.warn('Error restoring audio state from localStorage:', e);
    }
    
    return false;
  };

  // Handle visibility change to persist audio state between tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasHidden = visibilityStateRef.current === 'hidden';
      const isNowVisible = document.visibilityState === 'visible';
      
      visibilityStateRef.current = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        // Tab is hidden, store the current position
        lastKnownPositionRef.current = audio.currentTime;
        audioLoadedStateRef.current = audioLoaded;
        
        // Save state to localStorage for persistence
        saveAudioStateToStorage();
        
        // If we're playing, pause the audio to save resources
        if (!audio.paused) {
          audio.pause();
          // We don't call setIsPlaying(false) here because we want to 
          // remember that the user intended to play this
        }
      } else if (wasHidden && isNowVisible) {
        // Tab is visible again after being hidden
        console.log('Tab visible again, restoring audio state');
        
        // Set flag to prevent unnecessary reloading
        setHasRestoredAfterTabSwitch(true);
        
        // Always restore from localStorage first for most accurate state
        const wasRestored = restoreAudioStateFromStorage();
        
        // If we couldn't restore from localStorage, use the in-memory reference
        if (!wasRestored && lastKnownPositionRef.current > 0) {
          console.log('Restoring from in-memory position:', lastKnownPositionRef.current);
          audio.currentTime = lastKnownPositionRef.current;
          setCurrentTime(lastKnownPositionRef.current);
        }
        
        if (isPlaying && audio.paused) {
          // The user had been playing the audio before switching tabs
          
          // Resume playback - with small delay to allow the UI to stabilize
          setTimeout(() => {
            audio.play()
              .then(() => {
                // Successfully resumed
                setPlaybackState('playing');
              })
              .catch(error => {
                console.error('Error resuming audio after tab switch:', error);
                setPlaybackState('error');
                setIsPlaying(false);
              });
          }, 150);
        }
        
        // Restore loaded state if needed
        if (audioLoadedStateRef.current) {
          setAudioLoaded(true);
          
          // Also mark this URL as loaded in our cache
          if (audioUrl) {
            loadedAudioCache.add(audioUrl);
          }
        }
      }
    };
    
    // Handle pageshow event for back/forward cache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log('Page was restored from bfcache');
        
        // Similar to visibility change but for back/forward navigation
        const wasRestored = restoreAudioStateFromStorage();
        
        if (wasRestored) {
          setHasRestoredAfterTabSwitch(true);
          
          // Mark audio as loaded if we restored successfully
          setAudioLoaded(true);
          
          // Add to loaded cache
          if (audioUrl) {
            loadedAudioCache.add(audioUrl);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      
      // Save state when unmounting component
      saveAudioStateToStorage();
    };
  }, [isPlaying, setIsPlaying, setPlaybackState, audioLoaded, setAudioLoaded, audioUrl]);
  
  // Mark audio as loaded in cache when it's successfully loaded
  useEffect(() => {
    if (audioLoaded && audioUrl) {
      loadedAudioCache.add(audioUrl);
    }
  }, [audioLoaded, audioUrl]);
  
  // Save audio state periodically while playing
  useEffect(() => {
    let saveInterval: number | undefined;
    
    if (isPlaying) {
      // Save state every 5 seconds while playing
      saveInterval = window.setInterval(() => {
        saveAudioStateToStorage();
      }, 5000);
    }
    
    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  }, [isPlaying, trackId, audioUrl]);

  // Only attempt to restore on first mount
  useEffect(() => {
    if (isFirstLoadRef.current && audioUrl) {
      isFirstLoadRef.current = false;
      
      setTimeout(() => {
        restoreAudioStateFromStorage();
        
        // If this URL is in our loaded cache, mark it as loaded
        if (loadedAudioCache.has(audioUrl)) {
          setAudioLoaded(true);
        }
      }, 200);
    }
  }, [audioUrl]);

  // Custom toggle play/pause handler for play count tracking
  const handleTogglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      // Starting to play
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setPlaybackState('playing');
          // Start tracking play time for this track
          startPlayTracking(trackId || null, shareKey || null);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          setPlaybackState('error');
          
          // Show more details about the error
          if (error.name === 'NotSupportedError') {
            console.error('Browser does not support this audio format');
          } else if (error.name === 'NotAllowedError') {
            console.error('Auto-play prevented - user interaction needed');
          }
        });
    } else {
      // Pausing playback
      audio.pause();
      setIsPlaying(false);
      setPlaybackState('paused');
      
      // Only end tracking when pausing if we've played for some time
      // This avoids unnecessary calls when rapidly toggling play/pause
      if (audio.currentTime > 2) {
        endPlayTracking()
          .then(incremented => {
            if (incremented) {
              console.log("Play count incremented successfully");
            }
          })
          .catch(error => {
            console.error("Error handling play count:", error);
          });
      } else {
        cancelPlayTracking();
      }
    }
  };

  // Handle reaching the end of the track
  const handleTrackEnd = () => {
    // Track has finished playing naturally, check if we should increment
    endPlayTracking()
      .then(incremented => {
        if (incremented) {
          console.log("Play count incremented after track finished");
        }
      })
      .catch(error => {
        console.error("Error handling play count at track end:", error);
      });
  };
  
  // Setup audio event listeners
  useAudioEvents({
    audioRef,
    audioUrl,
    playbackState,
    isPlaying,
    setPlaybackState,
    setDuration,
    setCurrentTime,
    setIsPlaying,
    setAudioLoaded,
    setShowBufferingUI,
    setLoadRetries,
    volume,
    isMuted,
    bufferingStartTimeRef,
    bufferingTimeoutRef,
    recentlySeekRef,
    playClickTimeRef,
    clearBufferingTimeout,
    loadRetries,
    lastSeekTimeRef,
    onTrackEnd: handleTrackEnd,
    hasRestoredAfterTabSwitch
  });
  
  // Audio controls
  const {
    handleSeek,
    toggleMute,
    handleVolumeChange
  } = useAudioControls({
    audioRef,
    audioUrl,
    setPlaybackState,
    setIsPlaying,
    duration,
    playClickTimeRef,
    lastSeekTimeRef,
    recentlySeekRef,
    clearBufferingTimeout,
    bufferingStartTimeRef,
    setCurrentTime,
    isMuted,
    setIsMuted,
    setVolume,
    isPlaying,
    setShowBufferingUI
  });
  
  // Setup audio effects
  useAudioEffects({
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
    hasRestoredAfterTabSwitch
  });

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackState,
    isGeneratingWaveform: false, // Force this to always be false after tab switch
    audioLoaded,
    showBufferingUI: false, // Always force this to false
    isBuffering: false, // Always force this to false
    togglePlayPause: handleTogglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange,
  };
}
