import { useEffect } from 'react';

/**
 * Hook that handles play, pause, and ended events
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
  setPlaybackState: (state: string) => void;
  setCurrentTime: (time: number) => void;
  onTrackEnd?: () => void;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not found - cannot set up playback events');
      return;
    }

    // Time update handler - keep this running in background tabs
    const handleTimeUpdate = () => {
      if (!audio) return;
      
      // Always update time state from audio element to keep UI in sync
      setCurrentTime(audio.currentTime || 0);
      
      // If we don't have a valid duration yet, try to get it from the audio element
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        // This is handled by useAudioMetadataEvents now
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

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    
    // Clean up
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, setIsPlaying, setPlaybackState, setCurrentTime, onTrackEnd]);
}
