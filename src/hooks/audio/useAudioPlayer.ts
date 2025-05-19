import { useRef, useMemo } from "react";
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
  
  // Store visibility-related state
  const wasPlayingBeforeHideRef = useRef(false);
  
  // Determine the audio URL to use - prefer MP3 if available
  const audioUrl = useMemo(() => mp3Url || defaultAudioUrl, [mp3Url, defaultAudioUrl]);
  
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

  // Effect to handle tab visibility changes
  useMemo(() => {
    if (typeof document === 'undefined') return () => {};
    
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;
      
      if (document.visibilityState === 'hidden') {
        // Store the current playing state before hiding
        wasPlayingBeforeHideRef.current = isPlaying;
        
        // Don't pause audio when tab is hidden - keep playing
      } else if (document.visibilityState === 'visible') {
        // Resume audio context if it was suspended
        if (audio.paused && wasPlayingBeforeHideRef.current) {
          // Only attempt to resume if it was playing before
          audio.play().catch(() => {
            // If auto-resume fails, update the state to match reality
            setIsPlaying(false);
            setPlaybackState('paused');
          });
        }
        
        // Update current time display to match actual audio element time
        setCurrentTime(audio.currentTime);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, setCurrentTime, setIsPlaying, setPlaybackState]);

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
