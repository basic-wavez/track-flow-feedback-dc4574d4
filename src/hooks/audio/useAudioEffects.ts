
import { useEffect } from "react";

/**
 * Hook that handles audio special effects and side effects
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
  hasRestoredAfterTabSwitch = { current: false },
  allowBackgroundPlayback = false,
  timeUpdateActiveRef = { current: true },
  setSourceReady
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioUrl: string | null | undefined;
  setAudioLoaded: (loaded: boolean) => void;
  setPlaybackState: (state: 'idle' | 'loading' | 'playing' | 'paused' | 'error') => void;
  setDuration: (duration: number) => void;
  clearBufferingTimeout: () => void;
  setShowBufferingUI: (show: boolean) => void;
  bufferingStartTimeRef: React.MutableRefObject<number | null>;
  setIsGeneratingWaveform: (generating: boolean) => void;
  playbackState: string;
  recentlySeekRef: React.MutableRefObject<boolean>;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  hasRestoredAfterTabSwitch?: React.MutableRefObject<boolean>;
  allowBackgroundPlayback?: boolean;
  timeUpdateActiveRef?: React.MutableRefObject<boolean>;
  setSourceReady?: (ready: boolean) => void;
}) {
  // Reset audio loaded state when URL changes
  useEffect(() => {
    if (!audioUrl) return;
    
    console.log(`AudioEffects: Audio URL changed to ${audioUrl}`);
    setAudioLoaded(false);
    if (setSourceReady) {
      setSourceReady(false);
    }
    
    // Reset buffering state
    clearBufferingTimeout();
    bufferingStartTimeRef.current = null;
    setShowBufferingUI(false);
    
    // Generate waveform if needed
    if (!audioRef.current?.src?.includes(audioUrl)) {
      setIsGeneratingWaveform(true);
    }
  }, [audioUrl]);

  // Effect to update audio loaded state
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;
    
    // Track audio loaded state
    if (audioRef.current.readyState >= 3) {
      console.log(`AudioEffects: Audio loaded state reached: ${audioRef.current.readyState}`);
      setAudioLoaded(true);
      if (setSourceReady) {
        setSourceReady(true);
      }
    }
  }, [audioRef.current?.readyState, audioUrl, setAudioLoaded, setSourceReady]);
  
  // Reset waveform generation state when playback state changes
  useEffect(() => {
    if (playbackState === 'playing' || playbackState === 'paused') {
      setIsGeneratingWaveform(false);
    }
  }, [playbackState, setIsGeneratingWaveform]);
  
  // Extra effect to handle tab switching
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        console.log('Document became visible again, updating audio state');
        const audio = audioRef.current;
        
        if (audio && audioUrl) {
          // Check if audio element has a valid source
          if (audio.src !== audioUrl) {
            console.log(`Restoring audio src to ${audioUrl} after visibility change`);
            audio.src = audioUrl;
            if (setSourceReady) {
              setSourceReady(false);
            }
          }
          
          // Check playback state
          console.log('Current audio status:', {
            paused: audio.paused,
            ended: audio.ended,
            muted: audio.muted,
            volume: audio.volume,
            readyState: audio.readyState,
            currentTime: audio.currentTime,
            duration: audio.duration
          });
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioRef, audioUrl, setSourceReady]);
  
  return {};
}
