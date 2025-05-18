
import { useEffect } from 'react';

/**
 * Hook that handles visibility change events
 */
export function useVisibilityEvents({
  audioRef,
  setCurrentTime,
  setIsPlaying,
  setPlaybackState,
  setDuration,
  recentlySeekRef
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackState: (state: string) => void;
  setDuration: (duration: number) => void;
  recentlySeekRef: React.MutableRefObject<boolean>;
}) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible - syncing audio state');
        
        const audio = audioRef.current;
        if (!audio) return;
        
        // When tab becomes visible, always sync the UI with the actual audio position
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
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioRef, setCurrentTime, setIsPlaying, setPlaybackState, setDuration, recentlySeekRef]);
}
