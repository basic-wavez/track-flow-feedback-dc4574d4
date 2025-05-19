
import { useRef, useMemo, useCallback } from "react";
import { useAudioState } from "./useAudioState";
import { useBufferingState } from "./useBufferingState";
import { useAudioEvents } from "./useAudioEvents";
import { useAudioControls } from "./useAudioControls";
import { useAudioEffects } from "./useAudioEffects";
import { startPlayTracking, endPlayTracking, cancelPlayTracking } from "@/services/playCountService";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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
  
  // Get location to check if we're in a shared route
  const location = useLocation();
  const isSharedRoute = useMemo(() => 
    location.pathname.includes('/shared/'), [location.pathname]);
  
  // Get authentication status
  const { user } = useAuth();
  
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

  // Custom toggle play/pause handler for play count tracking - memoized
  const handleTogglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      // Starting to play
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setPlaybackState('playing');
          
          // Only track plays if user is logged in or if we're not on a shared route
          if (user || isSharedRoute) {
            // Start tracking play time for this track
            startPlayTracking(trackId || null, shareKey || null);
          }
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          setPlaybackState('error');
        });
    } else {
      // Pausing playback
      audio.pause();
      setIsPlaying(false);
      setPlaybackState('paused');
      
      // Only end tracking when user is authenticated or we're on a shared route
      if (user || isSharedRoute) {
        // Only end tracking when pausing if we've played for some time
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
    }
  }, [isPlaying, isSharedRoute, setIsPlaying, setPlaybackState, shareKey, trackId, user]);

  // Handle reaching the end of the track - memoized
  const handleTrackEnd = useCallback(() => {
    // Only track plays if user is logged in or if we're on a shared route
    if (user || isSharedRoute) {
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
    }
  }, [isSharedRoute, user]);
  
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

  // Return memoized values to prevent unnecessary re-renders
  return useMemo(() => ({
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
    togglePlayPause: handleTogglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange,
  }), [
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackState,
    isGeneratingWaveform,
    audioLoaded,
    handleTogglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange
  ]);
}
