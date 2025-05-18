
import { useEffect } from "react";
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
  hasRestoredAfterTabSwitch = false
}: any) {

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
    }

    const updateTime = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    
    const handleEnd = () => {
      setIsPlaying(false);
      setPlaybackState('idle');
      setCurrentTime(0);
      clearBufferingTimeout();
      // Always ensure buffering UI is disabled
      setShowBufferingUI(false);
      
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

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    // Set volume and muted state
    audio.volume = volume;
    audio.muted = isMuted;

    return () => {
      clearBufferingTimeout();
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
    };
  }, [isPlaying, playbackState, hasRestoredAfterTabSwitch]);

  return { handlePlaybackError: null }; // This is just a placeholder as the hook's main purpose is the effect
}
