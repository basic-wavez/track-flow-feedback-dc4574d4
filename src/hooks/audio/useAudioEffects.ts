import { useEffect } from 'react';

/**
 * Hook that handles audio effects and state synchronization
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
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioUrl: string | null | undefined;
  setAudioLoaded: (loaded: boolean) => void;
  setPlaybackState: (state: 'idle' | 'loading' | 'playing' | 'paused' | 'error') => void;
  setDuration: (duration: number) => void;
  clearBufferingTimeout: () => void;
  setShowBufferingUI: (show: boolean) => void;
  bufferingStartTimeRef: React.MutableRefObject<number | null>;
  setIsGeneratingWaveform: (isGenerating: boolean) => void;
  playbackState: string;
  recentlySeekRef: React.MutableRefObject<boolean>;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  hasRestoredAfterTabSwitch: React.MutableRefObject<boolean>;
  allowBackgroundPlayback: boolean;
  timeUpdateActiveRef?: React.MutableRefObject<boolean>;
}) {
  // Effect to handle audio URL changes
  useEffect(() => {
    if (!audioUrl) return;
    
    console.log(`Audio URL changed to: ${audioUrl}`);
    
    // Reset state when URL changes
    setAudioLoaded(false);
    setPlaybackState('loading');
    clearBufferingTimeout();
    bufferingStartTimeRef.current = null;
    setShowBufferingUI(false);
    
    // Start waveform generation
    setIsGeneratingWaveform(true);
  }, [audioUrl, setAudioLoaded, setPlaybackState, clearBufferingTimeout, 
      setShowBufferingUI, bufferingStartTimeRef, setIsGeneratingWaveform]);
  
  // Effect to handle audio loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    
    // Handle canplaythrough event
    const handleCanPlayThrough = () => {
      console.log('Audio can play through without buffering');
      setAudioLoaded(true);
      
      // Update duration if it's not already set
      if (audio.duration && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
      
      // Clear any buffering state
      clearBufferingTimeout();
      bufferingStartTimeRef.current = null;
      setShowBufferingUI(false);
      
      // Finish waveform generation
      setIsGeneratingWaveform(false);
    };
    
    // Add event listener
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    
    // Clean up
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [audioRef, audioUrl, setAudioLoaded, setDuration, clearBufferingTimeout, 
      bufferingStartTimeRef, setShowBufferingUI, setIsGeneratingWaveform]);
  
  // Effect to handle seeking and time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Handle seeking
    const handleSeeking = () => {
      recentlySeekRef.current = true;
    };
    
    // Handle seeked event
    const handleSeeked = () => {
      // Reset the recently seek flag after a short delay
      setTimeout(() => {
        recentlySeekRef.current = false;
      }, 500);
    };
    
    // Add event listeners
    audio.addEventListener('seeking', handleSeeking);
    audio.addEventListener('seeked', handleSeeked);
    
    // Clean up
    return () => {
      audio.removeEventListener('seeking', handleSeeking);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [audioRef, recentlySeekRef]);
  
  // Effect to handle background playback restoration
  useEffect(() => {
    // Skip if background playback is not allowed
    if (!allowBackgroundPlayback) return;
    
    const audio = audioRef.current;
    if (!audio) return;
    
    // If we've restored after tab switch and we're playing,
    // make sure the UI is in sync with the audio element
    if (hasRestoredAfterTabSwitch.current && playbackState === 'playing') {
      // Get the current position directly from the audio element
      const currentAudioTime = audio.currentTime;
      
      // Only update if there's a significant difference
      if (Math.abs(currentAudioTime - currentTime) > 0.5) {
        console.log(`Syncing UI time with audio time after tab switch: ${currentAudioTime}`);
        setCurrentTime(currentAudioTime);
      }
      
      // Reset the flag
      hasRestoredAfterTabSwitch.current = false;
    }
  }, [hasRestoredAfterTabSwitch, playbackState, audioRef, currentTime, setCurrentTime, allowBackgroundPlayback]);
  
  // Effect to handle time update throttling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !timeUpdateActiveRef) return;
    
    // Handle time updates with throttling
    const handleTimeUpdate = () => {
      if (timeUpdateActiveRef.current) {
        setCurrentTime(audio.currentTime);
        
        // Throttle updates to reduce CPU usage
        timeUpdateActiveRef.current = false;
        setTimeout(() => {
          timeUpdateActiveRef.current = true;
        }, 250); // Update at most 4 times per second
      }
    };
    
    // Add event listener
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    // Clean up
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioRef, setCurrentTime, timeUpdateActiveRef]);
  
  return null;
}
