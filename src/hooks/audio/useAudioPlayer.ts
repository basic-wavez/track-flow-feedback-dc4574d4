
import { useEffect } from "react";
import { useAudioState } from "./useAudioState";
import { useBufferingState } from "./useBufferingState";
import { useAudioEvents } from "./useAudioEvents";
import { useAudioControls } from "./useAudioControls";
import { useAudioEffects } from "./useAudioEffects";
import { useAudioInitialization } from "./useAudioInitialization";
import { useBackgroundPlayback } from "./useBackgroundPlayback";
import { usePlayCounting } from "./usePlayCounting";

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface UseAudioPlayerProps {
  mp3Url: string | null | undefined;
  defaultAudioUrl?: string;
  trackId?: string;
  shareKey?: string;
  allowBackgroundPlayback?: boolean;
}

export function useAudioPlayer({ 
  mp3Url, 
  defaultAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav",
  trackId,
  shareKey,
  allowBackgroundPlayback = false
}: UseAudioPlayerProps) {
  // Determine the audio URL to use - prefer MP3 if available
  const audioUrl = mp3Url || defaultAudioUrl;
  
  // Initialize audio elements and state
  const {
    audioRef,
    hasRestoredAfterTabSwitch,
    setHasRestoredAfterTabSwitch,
    lastKnownPositionRef,
    audioLoadedStateRef,
    visibilityStateRef,
    isFirstLoadRef,
    timeUpdateActiveRef,
    markAudioAsLoaded,
    syncCurrentTimeWithAudio
  } = useAudioInitialization({
    audioUrl,
    trackId,
    shareKey,
    allowBackgroundPlayback
  });
  
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

  // Play counting functionality
  const {
    startTracking,
    endTracking,
    cancelTracking,
    trackEndOfPlay
  } = usePlayCounting();
  
  // Mark audio as loaded in cache when it's successfully loaded
  useEffect(() => {
    if (audioLoaded && audioUrl) {
      markAudioAsLoaded(audioUrl);
    }
  }, [audioLoaded, audioUrl]);

  // Handle background playback
  useBackgroundPlayback({
    audioRef,
    visibilityStateRef,
    setHasRestoredAfterTabSwitch,
    syncCurrentTimeWithAudio,
    setCurrentTime,
    recentlySeekRef,
    setShowBufferingUI,
    clearBufferingTimeout,
    allowBackgroundPlayback
  });

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
          startTracking(trackId || null, shareKey || null);
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
        endTracking();
      } else {
        cancelTracking();
      }
    }
  };

  // Handle reaching the end of the track
  const handleTrackEnd = () => {
    // Track has finished playing naturally, check if we should increment
    trackEndOfPlay();
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
    timeUpdateActiveRef
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
    setCurrentTime,
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
