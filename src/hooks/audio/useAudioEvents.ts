
import { useEffect } from "react";
import { useAudioMetadata } from "./useAudioMetadata";
import { usePlaybackEvents } from "./usePlaybackEvents";
import { useBufferEvents } from "./useBufferEvents";
import { useErrorHandling } from "./useErrorHandling";

/**
 * Hook that sets up audio event listeners and handles audio events
 */
export function useAudioEvents({
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
  onTrackEnd
}: any) {
  
  // Set up metadata loading
  useAudioMetadata({
    audioRef,
    setDuration,
    setAudioLoaded
  });
  
  // Set up playback events
  usePlaybackEvents({
    audioRef,
    isPlaying,
    setIsPlaying,
    setPlaybackState,
    setCurrentTime,
    onTrackEnd,
    clearBufferingTimeout
  });
  
  // Set up buffer events
  useBufferEvents({
    audioRef,
    isPlaying,
    playbackState,
    setPlaybackState,
    setAudioLoaded,
    setShowBufferingUI,
    clearBufferingTimeout,
    setDuration
  });
  
  // Set up error handling
  useErrorHandling({
    audioRef,
    loadRetries,
    setLoadRetries,
    setPlaybackState,
    setIsPlaying,
    audioUrl
  });
  
  // Set volume and muted state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = volume;
    audio.muted = isMuted;
    
    return () => {
      clearBufferingTimeout();
    };
  }, [volume, isMuted, audioRef, clearBufferingTimeout]);

  return { handlePlaybackError: null }; // This is just a placeholder as the hook's main purpose is the effect
}
