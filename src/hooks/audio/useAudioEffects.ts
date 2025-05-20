
import { useEffect } from "react";

/**
 * Hook that manages side effects for the audio player
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
  currentTime
}: any) {
  // When mp3Url changes, reload the audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    
    // Reset states on new audio load
    setAudioLoaded(false);
    setPlaybackState('loading');
    setDuration(0);
    clearBufferingTimeout();
    setShowBufferingUI(false);
    bufferingStartTimeRef.current = null;
    
    console.log(`Loading audio: ${audioUrl}`);
    
    // Show generating waveform state briefly when loading new audio
    setIsGeneratingWaveform(true);
    setTimeout(() => {
      setIsGeneratingWaveform(false);
    }, 1500);
    
    audio.src = audioUrl;
    audio.load();
    
  }, [audioUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearBufferingTimeout();
    };
  }, []);
  
  // Reset buffering timer when leaving buffering state
  useEffect(() => {
    if (playbackState !== 'buffering') {
      clearBufferingTimeout();
      bufferingStartTimeRef.current = null;
      
      // Only reset showBufferingUI if we haven't recently seeked
      if (!recentlySeekRef.current) {
        setShowBufferingUI(false);
      }
    }
  }, [playbackState]);

  // Reset the recentlySeek flag after a delay
  useEffect(() => {
    if (recentlySeekRef.current) {
      const timer = setTimeout(() => {
        recentlySeekRef.current = false;
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentTime]); // Depend on currentTime to detect changes after seek
}
