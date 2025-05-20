
import { useEffect } from "react";

/**
 * Hook that handles play/pause/end events
 */
export function usePlaybackEvents({
  audioRef,
  isPlaying,
  setIsPlaying,
  setPlaybackState,
  setCurrentTime,
  onTrackEnd,
  clearBufferingTimeout
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackState: (state: string) => void;
  setCurrentTime: (time: number) => void;
  onTrackEnd?: () => void;
  clearBufferingTimeout: () => void;
}) {
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
      
      // Call the onTrackEnd callback if provided
      if (typeof onTrackEnd === 'function') {
        onTrackEnd();
      }
    };
    
    const handlePause = () => {
      console.log("Audio paused event triggered");
      // Only update state if it doesn't match current reality
      if (isPlaying) {
        setIsPlaying(false);
        setPlaybackState('paused');
      }
    };
    
    const handlePlay = () => {
      console.log("Audio play event triggered");
      // Only update state if it doesn't match current reality
      if (!isPlaying) {
        setIsPlaying(true);
        setPlaybackState('playing');
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, [audioRef, isPlaying, setIsPlaying, setPlaybackState, setCurrentTime, onTrackEnd, clearBufferingTimeout]);
}
