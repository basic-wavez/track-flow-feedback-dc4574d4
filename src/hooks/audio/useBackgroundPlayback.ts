
import { useEffect } from "react";

/**
 * Hook that manages background playback functionality
 */
export function useBackgroundPlayback({
  audioRef,
  visibilityStateRef,
  setHasRestoredAfterTabSwitch,
  syncCurrentTimeWithAudio,
  setCurrentTime,
  recentlySeekRef,
  setShowBufferingUI,
  clearBufferingTimeout,
  allowBackgroundPlayback
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  visibilityStateRef: React.MutableRefObject<'visible' | 'hidden'>;
  setHasRestoredAfterTabSwitch: (value: boolean) => void;
  syncCurrentTimeWithAudio: () => number;
  setCurrentTime: (time: number) => void;
  recentlySeekRef: React.MutableRefObject<boolean>;
  setShowBufferingUI: (value: boolean) => void;
  clearBufferingTimeout: () => void;
  allowBackgroundPlayback: boolean;
}) {
  // Handle visibility change to manage background playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasHidden = visibilityStateRef.current === 'hidden';
      const isNowVisible = document.visibilityState === 'visible';
      
      visibilityStateRef.current = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      
      const audio = audioRef.current;
      if (!audio) return;

      if (document.visibilityState === 'visible' && wasHidden) {
        console.log('Tab visible again, syncing with audio');
        
        // Set flag to prevent unnecessary reloading
        setHasRestoredAfterTabSwitch(true);
        
        // When returning to visible state, ALWAYS read the current state from the audio element
        // This is critical for background playback
        if (allowBackgroundPlayback) {
          // Sync the UI with the actual audio position
          const currentTime = syncCurrentTimeWithAudio();
          setCurrentTime(currentTime);
          
          // Reset any flags that could interfere with seeking
          recentlySeekRef.current = false;
        }
        
        // Ensure buffering UI is hidden after tab switch
        setShowBufferingUI(false);
        clearBufferingTimeout();
      }
    };
    
    // Handle pageshow event for back/forward cache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log('Page was restored from bfcache');
        
        // When returning from bfcache, sync with the audio's actual position
        const audio = audioRef.current;
        if (audio && !audio.paused && allowBackgroundPlayback) {
          // Sync UI with real audio position
          const currentTime = syncCurrentTimeWithAudio();
          setCurrentTime(currentTime);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [
    audioRef,
    visibilityStateRef,
    setHasRestoredAfterTabSwitch,
    syncCurrentTimeWithAudio,
    setCurrentTime,
    recentlySeekRef,
    setShowBufferingUI,
    clearBufferingTimeout,
    allowBackgroundPlayback
  ]);
}
