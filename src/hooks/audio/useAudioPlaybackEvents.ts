
import { useEffect } from 'react';

/**
 * Hook that handles playback events like play, pause, ended, etc.
 */
export function useAudioPlaybackEvents({
  audioRef,
  setIsPlaying,
  setPlaybackState,
  setCurrentTime,
  onTrackEnd
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackState: (state: 'idle' | 'loading' | 'playing' | 'paused' | 'error') => void;
  setCurrentTime: (time: number) => void;
  onTrackEnd: () => void;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Handle time updates
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    // Handle track ending
    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackState('paused');
      onTrackEnd();
    };
    
    // Handle play event
    const handlePlay = () => {
      setIsPlaying(true);
      setPlaybackState('playing');
    };
    
    // Handle pause event
    const handlePause = () => {
      setIsPlaying(false);
      setPlaybackState('paused');
    };
    
    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    // Clean up
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioRef, setIsPlaying, setPlaybackState, setCurrentTime, onTrackEnd]);
}
