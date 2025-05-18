
import { useRef, useEffect } from "react";
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
  
  // Save audio state to session storage for persistence across page navigations
  const saveAudioStateToSession = () => {
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
      
      sessionStorage.setItem(`audioState_${trackId || audioUrl}`, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Error saving audio state to session storage:', e);
    }
  };
  
  // Restore audio state from session storage
  const restoreAudioStateFromSession = () => {
    try {
      const storedState = sessionStorage.getItem(`audioState_${trackId || audioUrl}`);
      if (storedState) {
        const state = JSON.parse(storedState);
        
        // Only restore if it's the same track and not too old (within last hour)
        if (
          (state.trackId === trackId || state.audioUrl === audioUrl) &&
          Date.now() - state.timestamp < 60 * 60 * 1000
        ) {
          const audio = audioRef.current;
          if (!audio) return false;
          
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
          
          return true;
        }
      }
    } catch (e) {
      console.warn('Error restoring audio state from session storage:', e);
    }
    
    return false;
  };

  // Handle visibility change to persist audio state between tab switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        // Tab is hidden, store the current position
        lastKnownPositionRef.current = audio.currentTime;
        audioLoadedStateRef.current = audioLoaded;
        
        // Save state to session storage for persistence
        saveAudioStateToSession();
        
        // If we're playing, pause the audio to save resources
        if (!audio.paused) {
          audio.pause();
          // We don't call setIsPlaying(false) here because we want to 
          // remember that the user intended to play this
        }
      } else {
        // Tab is visible again
        const wasRestored = restoreAudioStateFromSession();
        
        // If we couldn't restore from session, use the in-memory reference
        if (!wasRestored) {
          audio.currentTime = lastKnownPositionRef.current;
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
          }, 100);
        }
        
        // Restore loaded state if needed
        if (audioLoadedStateRef.current) {
          setAudioLoaded(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Save state when unmounting component
      saveAudioStateToSession();
    };
  }, [isPlaying, setIsPlaying, setPlaybackState, audioLoaded, setAudioLoaded]);
  
  // Save audio state periodically while playing
  useEffect(() => {
    let saveInterval: number | undefined;
    
    if (isPlaying) {
      // Save state every 5 seconds while playing
      saveInterval = window.setInterval(() => {
        saveAudioStateToSession();
      }, 5000);
    }
    
    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  }, [isPlaying, trackId, audioUrl]);

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
              // We could dispatch an event or update some state here if needed
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
    onTrackEnd: handleTrackEnd
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
    currentTime
  });
  
  // Attempt to restore audio state on mount
  useEffect(() => {
    setTimeout(() => {
      restoreAudioStateFromSession();
    }, 200);
  }, []);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackState,
    isGeneratingWaveform,
    audioLoaded,
    showBufferingUI: false, // Always force this to false
    isBuffering: false, // Always force this to false
    togglePlayPause: handleTogglePlayPause, // Use our custom handler
    handleSeek,
    toggleMute,
    handleVolumeChange,
  };
}
