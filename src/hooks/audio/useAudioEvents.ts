
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
  lastSeekTimeRef
}: any) {

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
    };
    
    const handleLoadedMetadata = () => {
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
      
      if (playbackState === 'buffering' && isPlaying) {
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
      console.log(`Audio is waiting/buffering`);
      
      // Still track the buffering state internally for debugging
      // but don't show the UI or change playback state
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
      
      // Don't change to buffering state to avoid UI updates
      // setPlaybackState('buffering');
    };
    
    const handleError = (e: Event) => {
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
  }, [isPlaying, playbackState]);

  return { handlePlaybackError: null }; // This is just a placeholder as the hook's main purpose is the effect
}
