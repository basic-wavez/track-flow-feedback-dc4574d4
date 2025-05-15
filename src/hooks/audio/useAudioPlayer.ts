
import { useRef } from "react";
import { useAudioState } from "./useAudioState";
import { useBufferingState } from "./useBufferingState";
import { useAudioEvents } from "./useAudioEvents";
import { useAudioControls } from "./useAudioControls";
import { useAudioEffects } from "./useAudioEffects";

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface UseAudioPlayerProps {
  mp3Url: string | null | undefined;
  defaultAudioUrl?: string;
}

export function useAudioPlayer({ mp3Url, defaultAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav" }: UseAudioPlayerProps) {
  // Create audio element reference
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Determine the audio URL to use
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
    lastSeekTimeRef
  });
  
  // Audio controls
  const {
    togglePlayPause,
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
    togglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange,
  };
}
