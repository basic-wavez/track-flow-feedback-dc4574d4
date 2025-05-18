
import { useEffect } from 'react';
import { useAudioMetadataEvents } from './useAudioMetadataEvents';
import { useAudioPlaybackEvents } from './useAudioPlaybackEvents';
import { useAudioBufferingEvents } from './useAudioBufferingEvents';
import { useAudioErrorEvents } from './useAudioErrorEvents';
import { useVisibilityEvents } from './useVisibilityEvents';

/**
 * Hook that coordinates all audio event handlers
 * Refactored for better organization and maintainability
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
  onTrackEnd,
  hasRestoredAfterTabSwitch,
  timeUpdateActiveRef
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioUrl: string | null | undefined;
  playbackState: string;
  isPlaying: boolean;
  setPlaybackState: (state: string) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setAudioLoaded: (loaded: boolean) => void;
  setShowBufferingUI: (show: boolean) => void;
  setLoadRetries: (retries: number) => void;
  volume: number;
  isMuted: boolean;
  bufferingStartTimeRef: React.MutableRefObject<number | null>;
  bufferingTimeoutRef: React.MutableRefObject<number | ReturnType<typeof setTimeout> | null>;
  recentlySeekRef: React.MutableRefObject<boolean>;
  playClickTimeRef: React.MutableRefObject<number>;
  clearBufferingTimeout: () => void;
  loadRetries: number;
  lastSeekTimeRef: React.MutableRefObject<number>;
  onTrackEnd: () => void;
  hasRestoredAfterTabSwitch?: React.MutableRefObject<boolean>;
  timeUpdateActiveRef?: React.MutableRefObject<boolean>;
}) {
  // Set up volume and mute when they change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = volume;
    audio.muted = isMuted;
  }, [audioRef, volume, isMuted]);

  // Use specialized event hooks
  useAudioMetadataEvents({
    audioRef,
    setDuration,
    setAudioLoaded,
    setShowBufferingUI,
    clearBufferingTimeout,
    setCurrentTime
  });
  
  useAudioPlaybackEvents({
    audioRef,
    setIsPlaying,
    setPlaybackState,
    setCurrentTime,
    onTrackEnd
  });
  
  useAudioBufferingEvents({
    audioRef,
    isPlaying,
    bufferingStartTimeRef,
    bufferingTimeoutRef,
    playClickTimeRef,
    clearBufferingTimeout,
    setShowBufferingUI,
    playbackState,
    setPlaybackState
  });
  
  useAudioErrorEvents({
    audioRef,
    setPlaybackState,
    setLoadRetries,
    loadRetries
  });
  
  useVisibilityEvents({
    audioRef,
    setCurrentTime,
    setIsPlaying,
    setPlaybackState,
    setDuration,
    recentlySeekRef
  });

  // Main effect for setting up audio URL and loading
  useEffect(() => {
    if (!audioUrl) {
      console.log('No audio URL provided - cannot set up audio events');
      return;
    }
    
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not found - cannot set up audio events');
      return;
    }

    // Explicitly load the audio when URL changes
    try {
      console.log(`Loading audio URL: ${audioUrl}`);
      audio.load();
    } catch (e) {
      console.error('Error loading audio:', e);
    }
    
    // Clean up buffering timeout when unmounting
    return () => {
      clearBufferingTimeout();
    };
  }, [audioUrl, audioRef, clearBufferingTimeout]);
}
