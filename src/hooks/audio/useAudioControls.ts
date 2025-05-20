
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
  setShowBufferingUI
}: any) {
  
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Record the time when play was clicked
    playClickTimeRef.current = Date.now();
    console.log(`Play/pause clicked at ${new Date().toISOString()}`);

    // Always reset any buffering state on play click
    clearBufferingTimeout();
    bufferingStartTimeRef.current = null;
    setShowBufferingUI(false); // Explicitly force buffering UI to be hidden

    if (isPlaying) {
      audio.pause();
      setPlaybackState('paused');
      setIsPlaying(false);
    } else {
      // Set state to loading until playback begins
      setPlaybackState('loading');
      
      // Always ensure buffering UI is disabled
      setShowBufferingUI(false);
      
      audio.play()
        .then(() => {
          setPlaybackState('playing');
          setIsPlaying(true);
        })
        .catch(error => {
          console.error("Playback failed:", error);
          handlePlaybackError();
        });
    }
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || !isFinite(time) || isNaN(time)) return;
    
    // Mark that we recently performed a seek operation
    lastSeekTimeRef.current = Date.now();
    recentlySeekRef.current = true;
    console.log(`Seek performed at ${new Date().toISOString()} to ${time}s`);
    
    // Reset buffering states when seeking
    clearBufferingTimeout();
    bufferingStartTimeRef.current = null;
    setShowBufferingUI(false); // Always force buffering UI to be hidden
    
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

  const handlePlaybackError = () => {
    setPlaybackState('error');
    setIsPlaying(false);
    toast({
      title: "Playback Error",
      description: "Could not play this track. Please try again later.",
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
