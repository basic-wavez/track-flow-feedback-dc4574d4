
import { useEffect } from 'react';

/**
 * Hook that handles metadata loading and canplay events
 */
export function useAudioMetadataEvents({
  audioRef,
  setDuration,
  setAudioLoaded,
  setShowBufferingUI,
  clearBufferingTimeout,
  setCurrentTime,
  setSourceReady,
  audioUrl
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  setDuration: (duration: number) => void;
  setAudioLoaded: (loaded: boolean) => void;
  setShowBufferingUI: (show: boolean) => void;
  clearBufferingTimeout: () => void;
  setCurrentTime: (time: number) => void;
  setSourceReady: (ready: boolean) => void;
  audioUrl: string | null | undefined;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not found - cannot set up metadata events');
      return;
    }

    console.log(`Setting up metadata events for audio URL: ${audioUrl}`);
    // Mark source as not ready when URL changes
    setSourceReady(false);
    
    const handleLoadedMetadata = () => {
      if (!audio) return;
      
      console.log(`Audio loaded metadata: duration=${audio.duration}, src=${audio.src}`);
      
      // Ensure we set a valid duration
      if (isFinite(audio.duration)) {
        setDuration(audio.duration || 0);
      } else {
        // If duration is not valid yet, we'll set a temporary value
        console.log("Invalid duration from metadata, will try to get it later");
      }
      
      setAudioLoaded(true);
      
      // Reset buffering UI
      clearBufferingTimeout();
      setShowBufferingUI(false);
      
      // Default to seeking to beginning for consistency
      audio.currentTime = 0;
      setCurrentTime(0);
    };
    
    // Add a canplay handler to ensure we have valid metadata
    const handleCanPlay = () => {
      console.log(`Audio can play, duration=${audio.duration}, src=${audio.src}`);
      
      // Double check if duration is now available and valid
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      
      setAudioLoaded(true);
      setSourceReady(true);
    };

    // Add loadstart handler to track initial loading
    const handleLoadStart = () => {
      console.log('Audio load started');
      setSourceReady(false);
    };

    // Add error handler
    const handleLoadError = (e: Event) => {
      console.error('Audio loading error:', audio.error);
      setSourceReady(false);
    };

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleLoadError);
    
    // Clean up
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleLoadError);
    };
  }, [audioRef, audioUrl, setDuration, setAudioLoaded, clearBufferingTimeout, setShowBufferingUI, setCurrentTime, setSourceReady]);
}
