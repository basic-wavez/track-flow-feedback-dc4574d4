
import { useEffect } from 'react';

/**
 * Hook that handles audio error events
 */
export function useAudioErrorEvents({
  audioRef,
  setPlaybackState,
  setLoadRetries,
  loadRetries
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  setPlaybackState: (state: string) => void;
  setLoadRetries: (retries: number) => void;
  loadRetries: number;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not found - cannot set up error events');
      return;
    }
    
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      const errorCode = audioElement?.error?.code;
      const errorMessage = audioElement?.error?.message;
      
      console.error("Audio error:", { code: errorCode, message: errorMessage });
      setPlaybackState('error');
      
      // Retry logic for transient errors
      if (loadRetries < 3) {
        console.log(`Retrying audio load, attempt ${loadRetries + 1}`);
        setLoadRetries(loadRetries + 1);
        
        setTimeout(() => {
          if (audio) audio.load();
        }, 1000);
      }
    };

    // Add event listeners
    audio.addEventListener('error', handleError);
    
    // Clean up
    return () => {
      audio.removeEventListener('error', handleError);
    };
  }, [audioRef, setPlaybackState, setLoadRetries, loadRetries]);
}
