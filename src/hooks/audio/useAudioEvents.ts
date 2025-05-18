import { useEffect } from 'react';

/**
 * Hook that provides event handlers for the audio player
 * Improved to handle background playback and tab visibility changes
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
}: any) {
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
    
    // Handlers to set up for the audio element
    const handleLoadedMetadata = () => {
      if (!audio) return;
      
      console.log(`Audio loaded metadata: duration=${audio.duration}`);
      
      // Ensure we set a valid duration
      if (isFinite(audio.duration)) {
        setDuration(audio.duration || 0);
      } else {
        // If duration is not valid yet, we'll set a temporary value
        console.log("Invalid duration from metadata, will try to get it later");
      }
      
      setAudioLoaded(true);
      
      // Reset buffering UI
      clearBufferingTimeout();
      setShowBufferingUI(false);
      
      // Default to seeking to beginning for consistency
      audio.currentTime = 0;
      setCurrentTime(0);
    };
    
    // Add a canplay handler to ensure we have valid metadata
    const handleCanPlay = () => {
      console.log(`Audio can play, duration=${audio.duration}`);
      
      // Double check if duration is now available and valid
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      
      setAudioLoaded(true);
    };
    
    // Time update handler - keep this running in background tabs
    const handleTimeUpdate = () => {
      if (!audio) return;
      
      // Always update time state from audio element to keep UI in sync
      setCurrentTime(audio.currentTime || 0);
      
      // If we don't have a valid duration yet, try to get it from the audio element
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      
      // Reset recent seek flag after a short delay
      if (recentlySeekRef.current && Date.now() - (lastSeekTimeRef.current || 0) > 500) {
        recentlySeekRef.current = false;
      }
    };
    
    const handlePlay = () => {
      console.log(`Audio played at ${new Date().toISOString()}`);
      setIsPlaying(true);
      setPlaybackState('playing');
    };
    
    const handlePause = () => {
      console.log(`Audio paused at ${new Date().toISOString()}`);
      setIsPlaying(false);
      setPlaybackState('paused');
    };
    
    const handleEnded = () => {
      console.log(`Audio ended at ${new Date().toISOString()}`);
      setIsPlaying(false);
      setPlaybackState('paused');
      setCurrentTime(0);
      
      // Call track end handler if provided
      if (onTrackEnd && typeof onTrackEnd === 'function') {
        onTrackEnd();
      }
    };
    
    const handleWaiting = () => {
      // Mark the time when we first detected buffering
      if (!bufferingStartTimeRef.current) {
        bufferingStartTimeRef.current = Date.now();
        console.log(`Audio buffering started at ${new Date().toISOString()}`);
      }
      
      // If we're actively playing and it's been >500ms since user clicked play,
      // schedule showing the buffering UI after a delay
      if (isPlaying && (!playClickTimeRef.current || Date.now() - playClickTimeRef.current > 500)) {
        clearBufferingTimeout();
        
        bufferingTimeoutRef.current = setTimeout(() => {
          if (isPlaying && bufferingStartTimeRef.current) {
            setShowBufferingUI(true);
            console.log(`Showing buffering UI after delay`);
          }
        }, 1000); // Wait 1 second before showing buffering UI
      }
    };
    
    const handlePlaying = () => {
      clearBufferingTimeout();
      bufferingStartTimeRef.current = null;
      setShowBufferingUI(false);
      
      if (playbackState === 'loading') {
        setPlaybackState('playing');
      }
      
      console.log(`Audio playing at ${new Date().toISOString()}`);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible - syncing audio state');
        
        // When tab becomes visible, always sync the UI with the actual audio position
        if (audio) {
          setCurrentTime(audio.currentTime || 0);
          
          // Reset the seeking flag to ensure seeking works properly after tab switch
          recentlySeekRef.current = false;
          
          // Update play state based on actual audio element state
          setIsPlaying(!audio.paused);
          setPlaybackState(!audio.paused ? 'playing' : 'paused');
          
          // Ensure we have the updated duration
          if (isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
          }
        }
      }
    };
    
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      const errorCode = audioElement?.error?.code;
      const errorMessage = audioElement?.error?.message;
      
      console.error("Audio error:", { code: errorCode, message: errorMessage });
      setPlaybackState('error');
      
      // Retry logic for transient errors
      if (loadRetries < 3) {
        console.log(`Retrying audio load, attempt ${loadRetries + 1}`);
        setLoadRetries(loadRetries + 1);
        
        setTimeout(() => {
          if (audio) audio.load();
        }, 1000);
      }
    };
    
    // Set up volume and mute
    audio.volume = volume;
    audio.muted = isMuted;
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      // Clean up event listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up buffering timeout
      clearBufferingTimeout();
    };
  }, [audioUrl, playbackState, isPlaying, loadRetries, hasRestoredAfterTabSwitch]);
}
