
import { useState, useRef } from "react";
import { useAudioState } from "./useAudioState";

/**
 * Hook that handles audio initialization and state restoration
 */
export function useAudioInitialization({
  audioUrl,
  trackId,
  shareKey,
  allowBackgroundPlayback = false
}: {
  audioUrl: string | null | undefined;
  trackId?: string;
  shareKey?: string;
  allowBackgroundPlayback?: boolean;
}) {
  // Create audio element reference
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Track whether we've restored state after tab switch
  // Change from useState to useRef to match the expected type in useAudioPlayer
  const hasRestoredAfterTabSwitch = useRef<boolean>(false);
  const setHasRestoredAfterTabSwitch = (value: boolean) => {
    hasRestoredAfterTabSwitch.current = value;
  };

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

  // Cache management for loaded audio files
  const loadedAudioCache = useRef<Set<string>>(new Set());
  
  // Mark audio as loaded in cache
  const markAudioAsLoaded = (url: string) => {
    if (url) {
      loadedAudioCache.current.add(url);
    }
  };
  
  // Check if audio is in cache
  const isAudioLoaded = (url: string) => {
    return url ? loadedAudioCache.current.has(url) : false;
  };

  // Sync current time function - gets the time directly from the audio element
  const syncCurrentTimeWithAudio = () => {
    const audio = audioRef.current;
    if (!audio) return 0;
    
    // Get the current position directly from the audio element
    const currentAudioTime = audio.currentTime;
    console.log(`Syncing UI time with audio time: ${currentAudioTime}`);
    
    return currentAudioTime;
  };

  return {
    audioRef,
    hasRestoredAfterTabSwitch,
    setHasRestoredAfterTabSwitch,
    lastKnownPositionRef,
    audioLoadedStateRef,
    visibilityStateRef,
    isFirstLoadRef,
    timeUpdateActiveRef,
    markAudioAsLoaded,
    isAudioLoaded,
    syncCurrentTimeWithAudio
  };
}
