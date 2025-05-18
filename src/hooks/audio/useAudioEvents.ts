import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/use-toast";

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
  onTrackEnd,
  hasRestoredAfterTabSwitch = false,
  // We'll still keep this ref but won't use it to block updates
  timeUpdateActiveRef = { current: true }
}: any) {
  // Track if this hook has been initialized for the current audio URL
  const hasInitializedEventsRef = useRef(false);
  const prevAudioUrlRef = useRef<string | undefined>(undefined);
  const lastVisibilityStateRef = useRef<'visible' | 'hidden'>(
    document.visibilityState === 'visible' ? 'visible' : 'hidden'
  );
  // Add a RAF ID ref to manage the animation frame
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // If we've already restored after tab switch, avoid unnecessary metadata loads
    if (hasRestoredAfterTabSwitch && audio.duration > 0) {
      console.log('Using restored duration after tab switch:', audio.duration);
      setDuration(audio.duration);
      setAudioLoaded(true);
      
      // Ensure buffering UI is hidden after tab switch
      clearBufferingTimeout();
      setShowBufferingUI(false);
      
      // Skip rest of initialization if this is a tab switch and we've already set up events
      if (hasInitializedEventsRef.current && prevAudioUrlRef.current === audioUrl) {
        console.log('Audio events already initialized after tab switch, skipping redundant setup');
        return;
      }
    }
    
    // Update initialization tracking
    hasInitializedEventsRef.current = true;
    prevAudioUrlRef.current = audioUrl;

    // Update time function - ALWAYS updates regardless of tab visibility
    const updateTime = () => {
      // No longer check timeUpdateActiveRef - always update the time
      setCurrentTime(audio.currentTime || 0);
    };
    
    // Start smooth animation loop that only runs when tab is visible
    const startSmoothUpdates = () => {
      // Cancel any existing animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Animation loop function
      const animationLoop = () => {
        // Only run updates when tab is visible
        if (document.visibilityState === 'visible' && !audio.paused) {
          setCurrentTime(audio.currentTime || 0);
          rafIdRef.current = requestAnimationFrame(animationLoop);
        } else {
          // Stop the loop when tab hidden or audio paused
          rafIdRef.current = null;
        }
      };
      
      // Start the animation loop
      rafIdRef.current = requestAnimationFrame(animationLoop);
    };
    
    // Handle when audio starts playing to start smooth updates
    const handlePlaying = () => {
      // Start the smooth update animation when playing
      startSmoothUpdates();
    };
    
    // Handle when audio stops or pauses
    const handlePause = () => {
      // Cancel animation frame when paused
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
    
    const handleEnd = () => {
      setIsPlaying(false);
      setPlaybackState('idle');
      setCurrentTime(0);
      clearBufferingTimeout();
      // Always ensure buffering UI is disabled
      setShowBufferingUI(false);
      
      // Cancel animation frame when ended
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      // Call the onTrackEnd callback if provided
      if (typeof onTrackEnd === 'function') {
        onTrackEnd();
      }
    };
    
    const handleLoadedMetadata = () => {
      // Skip redundant processing if we've already restored after tab switch
      if (hasRestoredAfterTabSwitch && audio.duration > 0) {
        return;
      }
      
      // Ensure we don't set Infinity or NaN as the duration
      if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setAudioLoaded(true);
        console.log(`Metadata loaded. Duration: ${audio.duration}`);
      } else {
        // Fallback for when duration is not available
        console.log("Invalid duration detected, using fallback");
        estimateAudioDuration(audio);
      }
    };

    // Estimate duration if metadata doesn't provide it
    const estimateAudioDuration = (audioElement: HTMLAudioElement) => {
      // Skip estimation if we've already restored after tab switch
      if (hasRestoredAfterTabSwitch) return;
      
      // Start with a reasonable default
      setDuration(180); // 3 minutes as fallback
      
      // Try to load duration again after a delay
      setTimeout(() => {
        if (isFinite(audioElement.duration) && !isNaN(audioElement.duration) && audioElement.duration > 0) {
          setDuration(audioElement.duration);
          setAudioLoaded(true);
        }
      }, 1000);
    };
    
    const handleCanPlay = () => {
      console.log(`Audio can play now`);
      setAudioLoaded(true);
      
      // Double-check duration once we can play
      if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      
      // Clear buffering timeout and reset UI
      clearBufferingTimeout();
      setShowBufferingUI(false); // Always hide buffering UI when we can play
      
      if (playbackState === 'loading' && isPlaying) {
        audio.play()
          .then(() => {
            setPlaybackState('playing');
            setLoadRetries(0);
            // Start smooth updates when we start playing
            startSmoothUpdates();
          })
          .catch(error => {
            console.error(`Error playing audio:`, error);
            handlePlaybackError();
          });
      } else if (playbackState === 'loading') {
        setPlaybackState('idle');
      }
    };
    
    const handleWaiting = () => {
      // For visibility changes, skip waiting events just after returning
      if (hasRestoredAfterTabSwitch) {
        console.log('Ignoring waiting event after tab switch');
        return;
      }
      
      console.log(`Audio is waiting/buffering`);
      
      // Only log buffering state for debugging, never show UI or change state
      const timeSinceLastSeek = Date.now() - lastSeekTimeRef.current;
      const timeSincePlayClick = Date.now() - playClickTimeRef.current;
      
      console.log(`Time since seek: ${timeSinceLastSeek}ms`);
      console.log(`Time since play click: ${timeSincePlayClick}ms`);
      console.log(`Current time: ${audio.currentTime}`);
      
      // Reset buffering state and never show the UI
      clearBufferingTimeout();
      bufferingStartTimeRef.current = null;
      
      // CRITICAL: Always force buffering UI to be hidden
      setShowBufferingUI(false);
    };
    
    const handleError = (e: Event) => {
      // Skip error handling if we've already restored after tab switch
      if (hasRestoredAfterTabSwitch) {
        console.log('Ignoring error event after tab switch');
        return;
      }
      
      const error = (e.target as HTMLAudioElement).error;
      console.error(`Error with audio playback: ${error?.code} - ${error?.message}`);
      handlePlaybackError();
    };

    const handlePlaybackError = () => {
      if (loadRetries < 3) {
        setLoadRetries(prev => prev + 1);
        setPlaybackState('loading');
        
        const audio = audioRef.current;
        if (audio && audioUrl) {
          console.log(`Retrying audio load (attempt ${loadRetries + 1})`);
          setTimeout(() => {
            audio.load();
          }, 1000); // Wait a second before retrying
        }
      } else {
        setPlaybackState('error');
        setIsPlaying(false);
        toast({
          title: "Playback Error",
          description: "Could not play this track. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    // Add visibility change handler to preserve state during tab switches
    const handleVisibilityChange = () => {
      const wasHidden = lastVisibilityStateRef.current === 'hidden';
      const isNowVisible = document.visibilityState === 'visible';
      
      lastVisibilityStateRef.current = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      
      if (wasHidden && isNowVisible) {
        console.log('Audio: Tab became visible, syncing with real audio position');
        
        // When coming back to visible, ALWAYS read the current position from the audio element
        // instead of trying to restore from any cache
        if (audio) {
          // Make sure we update to audio's true position
          setCurrentTime(audio.currentTime || 0);
          
          // Reset any flags that might interfere with seeking
          recentlySeekRef.current = false;
          
          // Restart the smooth animation loop if audio is playing
          if (!audio.paused) {
            startSmoothUpdates();
          }
        }
        
        // Ensure buffering UI is hidden after tab switch
        clearBufferingTimeout();
        setShowBufferingUI(false);
      } else if (document.hidden) {
        // If we're going into background, cancel the animation frame loop
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      }
    };
    
    // Register all event listeners
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set volume and muted state
    audio.volume = volume;
    audio.muted = isMuted;
    
    // Start smooth updates if already playing
    if (!audio.paused) {
      startSmoothUpdates();
    }

    return () => {
      clearBufferingTimeout();
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      
      // Clean up animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isPlaying, playbackState, hasRestoredAfterTabSwitch, audioUrl]);

  return { 
    handlePlaybackError: null, // This is just a placeholder as the hook's main purpose is the effect
    hasInitialized: hasInitializedEventsRef.current 
  };
}
