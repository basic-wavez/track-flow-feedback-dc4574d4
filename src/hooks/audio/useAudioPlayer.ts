
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
  allowBackgroundPlayback?: boolean; // Option to allow background playback
}

// Track which audio we've already loaded to prevent double-loading on tab switch
const loadedAudioCache = new Set<string>();

export function useAudioPlayer({ 
  mp3Url, 
  defaultAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav",
  trackId,
  shareKey,
  allowBackgroundPlayback = false // Default to false for backward compatibility
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

  // Add a new flag to track if the timeupdate event handler is active
  const timeUpdateActiveRef = useRef(true);

  // Sync current time function - gets the time directly from the audio element
  const syncCurrentTimeWithAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Get the current position directly from the audio element
    const currentAudioTime = audio.currentTime;
    
    // Update the UI state to match the audio's actual position
    console.log(`Syncing UI time with audio time: ${currentAudioTime}`);
    setCurrentTime(currentAudioTime);
    
    // Reset seeking flag to ensure seeking works correctly
    recentlySeekRef.current = false;
  };

  // Handle visibility change to manage background playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasHidden = visibilityStateRef.current === 'hidden';
      const isNowVisible = document.visibilityState === 'visible';
      
      visibilityStateRef.current = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      
      const audio = audioRef.current;
      if (!audio) return;

      if (document.visibilityState === 'visible' && wasHidden) {
        console.log('Tab visible again, syncing with audio');
        
        // Set flag to prevent unnecessary reloading
        setHasRestoredAfterTabSwitch(true);
        
        // When returning to visible state, ALWAYS read the current state from the audio element
        // This is critical for background playback
        if (allowBackgroundPlayback) {
          // Sync the UI with the actual audio position
          syncCurrentTimeWithAudio();
          
          // Reset any flags that could interfere with seeking
          recentlySeekRef.current = false;
        }
        
        // Ensure buffering UI is hidden after tab switch
        setShowBufferingUI(false);
        clearBufferingTimeout();
      }
    };
    
    // Handle pageshow event for back/forward cache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log('Page was restored from bfcache');
        
        // When returning from bfcache, sync with the audio's actual position
        const audio = audioRef.current;
        if (audio && !audio.paused && allowBackgroundPlayback) {
          // Sync UI with real audio position
          syncCurrentTimeWithAudio();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isPlaying, setIsPlaying, setPlaybackState, audioLoaded, setAudioLoaded, audioUrl, allowBackgroundPlayback]);
  
  // Mark audio as loaded in cache when it's successfully loaded
  useEffect(() => {
    if (audioLoaded && audioUrl) {
      loadedAudioCache.add(audioUrl);
    }
  }, [audioLoaded, audioUrl]);

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
    hasRestoredAfterTabSwitch,
    timeUpdateActiveRef // Pass the ref to control time updates
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
    setShowBufferingUI,
    allowBackgroundPlayback,
    syncCurrentTimeWithAudio
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
    setCurrentTime, // Pass setCurrentTime to useAudioEffects
    hasRestoredAfterTabSwitch,
    allowBackgroundPlayback,
    timeUpdateActiveRef
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
