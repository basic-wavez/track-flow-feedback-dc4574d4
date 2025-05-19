import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { startPlayTracking, endPlayTracking, cancelPlayTracking } from "@/services/playCountService";

// Define types for our context
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface GlobalAudioContextType {
  play: (url: string, trackId?: string, shareKey?: string) => void;
  pause: () => void;
  seek: (time: number) => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackState: PlaybackState;
  currentUrl: string | null;
  isBuffering: boolean;
  isAudioLoaded: boolean;
}

// Create context with default values
const GlobalAudioContext = createContext<GlobalAudioContextType>({
  play: () => {},
  pause: () => {},
  seek: () => {},
  togglePlayPause: () => {},
  toggleMute: () => {},
  setVolume: () => {},
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isMuted: false,
  volume: 0.7,
  playbackState: 'idle',
  currentUrl: null,
  isBuffering: false,
  isAudioLoaded: false,
});

export const useAudioPlayer = () => useContext(GlobalAudioContext);

interface GlobalAudioProviderProps {
  children: React.ReactNode;
}

export const GlobalAudioProvider: React.FC<GlobalAudioProviderProps> = ({ children }) => {
  // Create a single audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // State management
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  
  // Refs to track state across effects and event handlers
  const currentTrackIdRef = useRef<string | null>(null);
  const currentShareKeyRef = useRef<string | null>(null);
  const isVisibleRef = useRef<boolean>(document.visibilityState === 'visible');
  const bufferingTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Create audio element on mount
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Set initial volume
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
    
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Cancel any pending animations
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Cancel any pending timeouts
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasHidden = !isVisibleRef.current;
      const isNowVisible = document.visibilityState === 'visible';
      isVisibleRef.current = isNowVisible;
      
      // Handle visibility change logic
      if (wasHidden && isNowVisible && audioRef.current) {
        console.log('Tab visible again, syncing UI with audio state');
        
        // When returning to visible state, sync UI with audio state
        setCurrentTime(audioRef.current.currentTime);
        setIsPlaying(!audioRef.current.paused);
        setPlaybackState(!audioRef.current.paused ? 'playing' : 'paused');
        
        if (isFinite(audioRef.current.duration)) {
          setDuration(audioRef.current.duration);
        }
        
        // Start animation frame updates when visible
        startProgressAnimation();
      } else if (!isNowVisible) {
        // Stop animation when tab is hidden
        stopProgressAnimation();
      }
    };
    
    // Also handle pageshow event for back/forward cache
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && audioRef.current) {
        console.log('Page restored from bfcache, syncing UI state');
        setCurrentTime(audioRef.current.currentTime);
        setIsPlaying(!audioRef.current.paused);
        
        // Start animation if playing and visible
        if (!audioRef.current.paused && document.visibilityState === 'visible') {
          startProgressAnimation();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);
  
  // Set up audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleLoadStart = () => {
      console.log(`Audio load started: ${audio.currentSrc}`);
      setPlaybackState('loading');
    };
    
    const handleLoadedMetadata = () => {
      console.log(`Audio metadata loaded: duration=${audio.duration}`);
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsAudioLoaded(true);
      
      // If already playing, ensure buffering UI is cleared
      if (!audio.paused) {
        clearBufferingState();
      }
    };
    
    const handleCanPlay = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      setIsAudioLoaded(true);
    };
    
    const handleTimeUpdate = () => {
      // Update time state from audio element to keep UI in sync
      // This runs in background tabs (less frequently)
      setCurrentTime(audio.currentTime);
    };
    
    const handlePlay = () => {
      console.log('Audio played');
      setIsPlaying(true);
      setPlaybackState('playing');
      
      // Start tracking play time for analytics
      startPlayTracking(currentTrackIdRef.current, currentShareKeyRef.current);
      
      // Start animation frame updates if visible
      if (document.visibilityState === 'visible') {
        startProgressAnimation();
      }
    };
    
    const handlePause = () => {
      console.log('Audio paused');
      setIsPlaying(false);
      setPlaybackState('paused');
      
      // Stop animation
      stopProgressAnimation();
      
      // Only end tracking when pausing if we've played for some time
      if (audio.currentTime > 2) {
        endPlayTracking()
          .then(incremented => {
            if (incremented) {
              console.log("Play count incremented successfully");
            }
          })
          .catch(error => {
            console.error("Error handling play count:", error);
          });
      } else {
        cancelPlayTracking();
      }
    };
    
    const handleEnded = () => {
      console.log('Audio ended');
      setIsPlaying(false);
      setPlaybackState('paused');
      setCurrentTime(0);
      
      // Stop animation
      stopProgressAnimation();
      
      // Track completion for analytics
      endPlayTracking()
        .then(incremented => {
          if (incremented) {
            console.log("Play count incremented after track finished");
          }
        })
        .catch(error => {
          console.error("Error handling play count at track end:", error);
        });
    };
    
    const handleWaiting = () => {
      setIsBuffering(true);
      
      // If we're waiting for more than 1 second, show buffering UI
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
      
      bufferingTimeoutRef.current = window.setTimeout(() => {
        // Only show buffering UI if we're still playing
        if (isPlaying) {
          console.log('Showing buffering UI');
          setIsBuffering(true);
        }
      }, 1000);
    };
    
    const handlePlaying = () => {
      clearBufferingState();
      
      if (playbackState === 'loading') {
        setPlaybackState('playing');
      }
    };
    
    const handleError = (event: Event) => {
      console.error("Audio error:", event);
      setPlaybackState('error');
      stopProgressAnimation();
      setIsPlaying(false);
    };
    
    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);
    
    return () => {
      // Remove event listeners on cleanup
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
      
      // Clean up any remaining timeouts
      clearBufferingState();
    };
  }, [playbackState, isPlaying]);
  
  // Helper function to start progress animation
  const startProgressAnimation = () => {
    stopProgressAnimation(); // Clear any existing animation
    
    const updateProgressWithAnimation = () => {
      if (audioRef.current && isVisibleRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        animationFrameRef.current = requestAnimationFrame(updateProgressWithAnimation);
      }
    };
    
    if (isVisibleRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateProgressWithAnimation);
    }
  };
  
  // Helper function to stop progress animation
  const stopProgressAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };
  
  // Helper function to clear buffering state
  const clearBufferingState = () => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
    setIsBuffering(false);
  };

  // API Functions
  const play = (url: string, trackId?: string, shareKey?: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Store track identification for analytics
    currentTrackIdRef.current = trackId || null;
    currentShareKeyRef.current = shareKey || null;
    
    // Only load the audio if the URL has changed
    if (url !== audio.currentSrc) {
      console.log(`Loading new audio: ${url}`);
      setPlaybackState('loading');
      setIsAudioLoaded(false);
      setCurrentUrl(url);
      
      // Set the new source without calling load()
      audio.src = url;
    }
    
    // Start playback
    audio.play()
      .then(() => {
        setIsPlaying(true);
        setPlaybackState('playing');
      })
      .catch(error => {
        console.error("Playback failed:", error);
        setPlaybackState('error');
        setIsPlaying(false);
      });
  };
  
  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
  };
  
  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const validTime = Math.max(0, Math.min(time, isFinite(duration) ? duration : 0));
    
    // Update the audio position
    audio.currentTime = validTime;
    
    // Update UI immediately for responsive feel
    setCurrentTime(validTime);
    
    // Clear any buffering state
    clearBufferingState();
  };
  
  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      if (currentUrl) {
        play(currentUrl, currentTrackIdRef.current || undefined, currentShareKeyRef.current || undefined);
      }
    }
  };
  
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const handleSetVolume = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Ensure volume is between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audio.volume = clampedVolume;
    setVolume(clampedVolume);
    
    // Update mute state based on volume
    if (clampedVolume === 0) {
      audio.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    }
  };
  
  // Context value
  const contextValue: GlobalAudioContextType = {
    play,
    pause,
    seek,
    togglePlayPause,
    toggleMute,
    setVolume: handleSetVolume,
    currentTime,
    duration,
    isPlaying,
    isMuted,
    volume,
    playbackState,
    currentUrl,
    isBuffering,
    isAudioLoaded,
  };
  
  return (
    <GlobalAudioContext.Provider value={contextValue}>
      {children}
    </GlobalAudioContext.Provider>
  );
};

export default GlobalAudioProvider;
