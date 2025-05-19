import { useEffect } from "react";

/**
 * Hook that provides audio effects for the audio player
 */
export function useAudioEffects({
  audioRef,
  audioUrl,
  setAudioLoaded,
  setPlaybackState,
  setDuration,
  clearBufferingTimeout,
  setShowBufferingUI,
  bufferingStartTimeRef,
  setIsGeneratingWaveform,
  playbackState,
  recentlySeekRef,
  currentTime,
  setCurrentTime,
  hasRestoredAfterTabSwitch,
  allowBackgroundPlayback,
  timeUpdateActiveRef
}: any) {
  // Reset state when audio URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (audioUrl) {
      console.log(`Audio URL changed to ${audioUrl}`);
      
      // Reset state when audio URL changes
      setAudioLoaded(false);
      
      if (playbackState !== 'error') {
        setPlaybackState('idle');
      }
      
      // Reset buffering indicators
      clearBufferingTimeout();
      bufferingStartTimeRef.current = null;
      setShowBufferingUI(false);
      
      // Reset waveform generation
      setIsGeneratingWaveform(false);
      
      // Force load the audio to ensure metadata is loaded
      audio.load();
      
      // After a short delay, check if the audio has a valid duration
      setTimeout(() => {
        if (audio && isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      }, 200);
    }
  }, [audioUrl]);

  // Keep audio element and state in sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Synchronize when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab visible - syncing audio effects');
        
        // When coming back to the tab, check if audio has loaded
        // and update duration if needed
        if (audio && audio.readyState >= 2) {
          if (isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
          setAudioLoaded(true);
        }
        
        // If audio is playing and we have a current position, sync with it
        if (!audio.paused && !recentlySeekRef.current) {
          setCurrentTime(audio.currentTime);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioRef, setCurrentTime, recentlySeekRef, setDuration, setAudioLoaded]);
}
