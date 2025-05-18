
import { useEffect } from 'react';

/**
 * Hook that handles buffering and waiting events
 */
export function useAudioBufferingEvents({
  audioRef,
  isPlaying,
  bufferingStartTimeRef,
  bufferingTimeoutRef,
  playClickTimeRef,
  clearBufferingTimeout,
  setShowBufferingUI,
  playbackState,
  setPlaybackState
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  bufferingStartTimeRef: React.MutableRefObject<number | null>;
  bufferingTimeoutRef: React.MutableRefObject<number | ReturnType<typeof setTimeout> | null>;
  playClickTimeRef: React.MutableRefObject<number>;
  clearBufferingTimeout: () => void;
  setShowBufferingUI: (show: boolean) => void;
  playbackState: string;
  setPlaybackState: (state: string) => void;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not found - cannot set up buffering events');
      return;
    }
    
    const handleWaiting = () => {
      // Mark the time when we first detected buffering
      if (!bufferingStartTimeRef.current) {
        bufferingStartTimeRef.current = Date.now();
        console.log(`Audio buffering started at ${new Date().toISOString()}`);
      }
      
      // If we're actively playing and it's been >500ms since user clicked play,
      // schedule showing the buffering UI after a delay
      if (isPlaying && (!playClickTimeRef.current || Date.now() - playClickTimeRef.current > 500)) {
        clearBufferingTimeout();
        
        bufferingTimeoutRef.current = setTimeout(() => {
          if (isPlaying && bufferingStartTimeRef.current) {
            setShowBufferingUI(true);
            console.log(`Showing buffering UI after delay`);
          }
        }, 1000); // Wait 1 second before showing buffering UI
      }
    };
    
    const handlePlaying = () => {
      clearBufferingTimeout();
      bufferingStartTimeRef.current = null;
      setShowBufferingUI(false);
      
      if (playbackState === 'loading') {
        setPlaybackState('playing');
      }
      
      console.log(`Audio playing at ${new Date().toISOString()}`);
    };

    // Add event listeners
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    
    // Clean up
    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, [
    audioRef,
    isPlaying,
    bufferingStartTimeRef,
    bufferingTimeoutRef,
    playClickTimeRef,
    clearBufferingTimeout,
    setShowBufferingUI,
    playbackState,
    setPlaybackState
  ]);
}
