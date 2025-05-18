
import { toast } from "@/components/ui/use-toast";

/**
 * Hook that provides playback control functions for the audio player
 */
export function useAudioControls({
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
  allowBackgroundPlayback = false,
  syncCurrentTimeWithAudio = () => {}
}: any) {
  
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error("Cannot toggle play/pause: Audio element not found");
      return;
    }
    
    if (!audioUrl) {
      console.error("Cannot toggle play/pause: No audio URL provided");
      handlePlaybackError("No audio URL available");
      return;
    }

    // Record the time when play was clicked
    playClickTimeRef.current = Date.now();
    console.log(`Play/pause clicked at ${new Date().toISOString()}`);

    // Always reset any buffering state on play click
    clearBufferingTimeout();
    bufferingStartTimeRef.current = null;
    setShowBufferingUI(false);

    if (isPlaying) {
      audio.pause();
      setPlaybackState('paused');
      setIsPlaying(false);
    } else {
      setPlaybackState('loading');
      
      // Always ensure buffering UI is disabled
      setShowBufferingUI(false);
      
      // Try to play and handle failures more gracefully
      try {
        const playPromise = audio.play();
        
        // Modern browsers return a promise from play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Playback started successfully");
              setPlaybackState('playing');
              setIsPlaying(true);
            })
            .catch(error => {
              console.error("Playback failed:", error.name, error.message);
              
              // Provide more detailed error info for debugging
              if (error.name === 'NotAllowedError') {
                handlePlaybackError("Playback not allowed - user interaction needed");
              } else if (error.name === 'NotSupportedError') {
                handlePlaybackError("Audio format not supported");
              } else {
                handlePlaybackError(error.message || "Unknown playback error");
              }
            });
        } else {
          // Older browsers don't return a promise
          // Immediately assume it worked, but might fail silently
          setPlaybackState('playing');
          setIsPlaying(true);
        }
      } catch (e) {
        console.error("Error during play() call:", e);
        handlePlaybackError("Playback failed");
      }
    }
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || !isFinite(time) || isNaN(time)) return;
    
    // If we're in background playback mode and we might have stale state,
    // first synchronize the UI with the audio's actual position
    if (allowBackgroundPlayback) {
      // Force sync our UI with the actual audio position before seeking
      syncCurrentTimeWithAudio();
    }
    
    // Mark that we recently performed a seek operation
    lastSeekTimeRef.current = Date.now();
    recentlySeekRef.current = true;
    console.log(`Seek performed at ${new Date().toISOString()} to ${time}s`);
    
    // Reset buffering states when seeking
    clearBufferingTimeout();
    bufferingStartTimeRef.current = null;
    setShowBufferingUI(false);
    
    // Ensure we're seeking to a valid time within the audio duration
    const validTime = Math.max(0, Math.min(time, isFinite(duration) ? duration : 0));
    audio.currentTime = validTime;
    setCurrentTime(validTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      audio.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    }
  };

  const handlePlaybackError = (errorMessage: string = "Could not play this track") => {
    console.error(`Playback error: ${errorMessage}`);
    setPlaybackState('error');
    setIsPlaying(false);
    
    toast({
      title: "Playback Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  return {
    togglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange
  };
}
