
import { useEffect } from "react";

/**
 * Hook that handles buffering and can-play events
 */
export function useBufferEvents({
  audioRef,
  isPlaying,
  playbackState,
  setPlaybackState,
  setAudioLoaded,
  setShowBufferingUI,
  clearBufferingTimeout,
  setDuration
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  playbackState: string;
  setPlaybackState: (state: string) => void;
  setAudioLoaded: (loaded: boolean) => void;
  setShowBufferingUI: (show: boolean) => void;
  clearBufferingTimeout: () => void;
  setDuration: (duration: number) => void;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
      
      // If we're supposed to be playing but aren't, try to resume
      if (isPlaying && audio.paused) {
        console.log('Resuming playback after canplay event');
        audio.play()
          .catch(error => {
            console.error(`Error resuming playback:`, error);
          });
      } else if (playbackState === 'loading') {
        setPlaybackState('idle');
      }
    };
    
    const handleWaiting = () => {
      // Just log the waiting event, don't pause or show buffering UI
      console.log(`Audio is waiting/buffering`);
      
      // CRITICAL: Always force buffering UI to be hidden
      setShowBufferingUI(false);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
    };
  }, [audioRef, isPlaying, playbackState, setPlaybackState, setAudioLoaded, setShowBufferingUI, clearBufferingTimeout, setDuration]);
}
