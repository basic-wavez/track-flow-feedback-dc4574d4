
import { useRef, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import { useAudioState } from "./useAudioState";
import { useBufferingState } from "./useBufferingState";
import { useAudioEvents } from "./useAudioEvents";
import { useAudioControls } from "./useAudioControls";
import { useAudioEffects } from "./useAudioEffects";
import { usePlayCountTracking } from "./usePlayCountTracking";
import { useVisibilityState } from "./useVisibilityState";

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
  
  // Get visibility-related state
  const { wasPlayingBeforeHideRef } = useVisibilityState();
  
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

  // Play count tracking
  const {
    startTracking,
    endTracking,
    handleTrackEnd
  } = usePlayCountTracking({
    isPlaying,
    isSharedRoute,
    trackId,
    shareKey,
    user,
    audioRef
  });

  // Custom toggle play/pause handler - memoized
  const handleTogglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not available');
      return;
    }

    if (!isPlaying) {
      // Starting to play - IMPORTANT: Set up everything in the correct order
      console.debug('Starting playback with URL:', audioUrl);
      
      // First pause any existing playback and reset
      audio.pause();
      audio.currentTime = 0;
      
      // Set crossOrigin first (before src)
      audio.crossOrigin = "anonymous";
      
      // Set the source - this triggers the browser to queue the fetch
      if (audioUrl && audioUrl.startsWith('http')) {
        audio.src = audioUrl;
        
        // Explicitly load the audio
        audio.load();
        
        // Set state to loading while we prepare the audio
        setPlaybackState('loading');
        
        // Try to resume the audio context if we're using it
        const audioContext = (window as any).audioContext;
        if (audioContext && audioContext.state === 'suspended') {
          console.log('Resuming AudioContext');
          audioContext.resume().catch((err: any) => console.error('Failed to resume AudioContext:', err));
        }
        
        // Now attempt to play
        audio.play()
          .then(() => {
            console.debug('Playback started successfully for URL:', audioUrl);
            setIsPlaying(true);
            setPlaybackState('playing');
            
            // Start tracking play count
            startTracking();
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            setPlaybackState('error');
            setIsPlaying(false);
          });
      } else {
        console.error('Invalid or missing audio URL:', audioUrl);
        setPlaybackState('error');
      }
    } else {
      // Pausing playback
      audio.pause();
      setIsPlaying(false);
      setPlaybackState('paused');
      
      // End tracking when pausing
      endTracking();
    }
  }, [audioUrl, isPlaying, setIsPlaying, setPlaybackState, startTracking, endTracking]);
  
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
