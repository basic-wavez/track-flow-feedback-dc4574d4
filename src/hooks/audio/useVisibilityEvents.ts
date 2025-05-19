
import { useEffect } from 'react';

/**
 * Hook that handles visibility change events (tab switching)
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
  setPlaybackState: (state: 'idle' | 'loading' | 'playing' | 'paused' | 'error') => void;
  setDuration: (duration: number) => void;
  recentlySeekRef: React.MutableRefObject<boolean>;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible');
        
        // Check if audio is still playing and sync UI
        if (!audio.paused) {
          setIsPlaying(true);
          setPlaybackState('playing');
        } else {
          setIsPlaying(false);
          setPlaybackState('paused');
        }
        
        // Sync UI with audio state
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
        
        // Mark that we've recently sought to avoid duplicate handling
        recentlySeekRef.current = true;
        setTimeout(() => {
          recentlySeekRef.current = false;
        }, 500);
      }
    };
    
    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioRef, setCurrentTime, setIsPlaying, setPlaybackState, setDuration, recentlySeekRef]);
}
