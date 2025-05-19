
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
  setPlaybackState: (state: 'idle' | 'loading' | 'playing' | 'paused' | 'error') => void;
  setLoadRetries: (retries: number) => void;
  loadRetries: number;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Handle error event
    const handleError = (e: Event) => {
      const error = audio.error;
      console.error('Audio error:', error?.message || 'Unknown audio error');
      
      setPlaybackState('error');
      
      // Check for specific error codes
      if (error) {
        console.error(`Audio error code: ${error.code}`);
        
        // Try to reload the audio if it's a network error
        if (error.code === MediaError.MEDIA_ERR_NETWORK || error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          if (loadRetries < 3) {
            console.log(`Retrying load (attempt ${loadRetries + 1})...`);
            setTimeout(() => {
              setLoadRetries(loadRetries + 1);
              audio.load();
            }, 1000 * (loadRetries + 1)); // Exponential backoff
          }
        }
      }
    };
    
    // Add event listener
    audio.addEventListener('error', handleError);
    
    // Clean up
    return () => {
      audio.removeEventListener('error', handleError);
    };
  }, [audioRef, setPlaybackState, setLoadRetries, loadRetries]);
}
