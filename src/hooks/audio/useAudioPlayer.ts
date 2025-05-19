
import { useEffect, useCallback } from "react";
import { useAudioState } from "./useAudioState";
import { useBufferingState } from "./useBufferingState";
import { useAudioEvents } from "./useAudioEvents";
import { useAudioControls } from "./useAudioControls";
import { useAudioEffects } from "./useAudioEffects";
import { useAudioInitialization } from "./useAudioInitialization";
import { useBackgroundPlayback } from "./useBackgroundPlayback";
import { usePlayCounting } from "./usePlayCounting";
import { toast } from "@/components/ui/use-toast";

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
    syncCurrentTimeWithAudio,
    currentAudioUrlRef
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
    showBufferingUI, setShowBufferingUI,
    sourceReady, setSourceReady,
    lastPlayAttempt, setLastPlayAttempt
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

  // Debug utility for audio element
  const logAudioState = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    console.log({
      currentTime: audio.currentTime,
      duration: audio.duration,
      paused: audio.paused,
      ended: audio.ended,
      src: audio.src,
      readyState: audio.readyState,
      networkState: audio.networkState,
      error: audio.error ? `Error: ${audio.error.code}` : null
    });
  }, [audioRef]);

  // Custom toggle play/pause handler for play count tracking
  const handleTogglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error("No audio element found");
      return;
    }

    if (!audioUrl) {
      console.error("No audio URL provided");
      toast({
        title: "Playback Error",
        description: "No audio URL available",
        variant: "destructive",
      });
      return;
    }

    // Debug current audio state
    logAudioState();
    
    // Rate limit play attempts to prevent rapid consecutive attempts
    const now = Date.now();
    if (now - lastPlayAttempt < 300 && !isPlaying) {
      console.log("Ignoring rapid play attempt");
      return;
    }
    setLastPlayAttempt(now);

    if (!isPlaying) {
      // Make sure the audio source is set correctly
      if (audio.src !== audioUrl) {
        console.log(`Setting audio src to ${audioUrl}`);
        audio.src = audioUrl;
        setSourceReady(false);
        audio.load();
      }
      
      // Starting to play
      playClickTimeRef.current = Date.now();
      console.log(`Play attempt at ${new Date().toISOString()}, source ready: ${sourceReady}`);
      
      // Ensure audio source is ready or at least loaded
      if (!sourceReady && audio.readyState < 2) {
        console.log(`Audio not ready yet, readyState: ${audio.readyState}`);
        setPlaybackState('loading');
        
        // Set a timeout to attempt play after a delay if source isn't ready
        setTimeout(() => {
          console.log("Attempting play after delay");
          attemptPlay();
        }, 500);
      } else {
        attemptPlay();
      }
    } else {
      // Pausing playback
      audio.pause();
      setIsPlaying(false);
      setPlaybackState('paused');
      
      // Only end tracking when pausing if we've played for some time
      if (audio.currentTime > 2) {
        endTracking();
      } else {
        cancelTracking();
      }
    }
  }, [audioRef, audioUrl, isPlaying, sourceReady, setPlaybackState, setIsPlaying, endTracking, cancelTracking, logAudioState, lastPlayAttempt, setLastPlayAttempt, setSourceReady]);

  // Extracted play attempt logic for reuse
  const attemptPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Reset buffering UI
    clearBufferingTimeout();
    setShowBufferingUI(false);
    
    // Set loading state before attempting to play
    setPlaybackState('loading');
    
    // Try to play and handle failures
    audio.play()
      .then(() => {
        console.log('Play succeeded');
        setIsPlaying(true);
        setPlaybackState('playing');
        
        // Start tracking play time for this track
        startTracking(trackId || null, shareKey || null);
      })
      .catch(error => {
        console.error('Error playing audio:', error);
        setPlaybackState('error');
        setIsPlaying(false);
        
        // Show more details about the error
        let errorMessage = "Playback failed";
        if (error.name === 'NotSupportedError') {
          errorMessage = 'Browser does not support this audio format';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Auto-play prevented - user interaction needed';
        }
        
        toast({
          title: "Playback Error",
          description: errorMessage,
          variant: "destructive",
        });
      });
  }, [audioRef, setIsPlaying, setPlaybackState, clearBufferingTimeout, setShowBufferingUI, startTracking, trackId, shareKey]);

  // Handle reaching the end of the track
  const handleTrackEnd = useCallback(() => {
    // Track has finished playing naturally
    trackEndOfPlay();
  }, [trackEndOfPlay]);
  
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
    setSourceReady,
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
    timeUpdateActiveRef,
    currentAudioUrlRef
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
    syncCurrentTimeWithAudio,
    sourceReady
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
    timeUpdateActiveRef,
    setSourceReady
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
