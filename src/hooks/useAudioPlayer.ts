
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error';

interface UseAudioPlayerProps {
  mp3Url: string | null | undefined;
  defaultAudioUrl?: string;
}

export function useAudioPlayer({ mp3Url, defaultAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav" }: UseAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [loadRetries, setLoadRetries] = useState(0);
  const [isGeneratingWaveform, setIsGeneratingWaveform] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  // Better buffering and seeking states
  const [showBufferingUI, setShowBufferingUI] = useState(false);
  const bufferingTimeoutRef = useRef<number | null>(null);
  const bufferingStartTimeRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const recentlySeekRef = useRef<boolean>(false);
  const playClickTimeRef = useRef<number>(0); // Track when play button was clicked
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Determine the audio URL to use
  const audioUrl = mp3Url || defaultAudioUrl;
  
  // Clear any buffering timeouts
  const clearBufferingTimeout = () => {
    if (bufferingTimeoutRef.current !== null) {
      window.clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    
    const handleEnd = () => {
      setIsPlaying(false);
      setPlaybackState('idle');
      setCurrentTime(0);
      clearBufferingTimeout();
      setShowBufferingUI(false);
    };
    
    const handleLoadedMetadata = () => {
      // Ensure we don't set Infinity or NaN as the duration
      if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setAudioLoaded(true);
        console.log(`Metadata loaded. Duration: ${audio.duration}`);
      } else {
        // Fallback for when duration is not available
        console.log("Invalid duration detected, using fallback");
        estimateAudioDuration(audio);
      }
    };

    // Estimate duration if metadata doesn't provide it
    const estimateAudioDuration = (audioElement: HTMLAudioElement) => {
      // Start with a reasonable default
      setDuration(180); // 3 minutes as fallback
      
      // Try to load duration again after a delay
      setTimeout(() => {
        if (isFinite(audioElement.duration) && !isNaN(audioElement.duration) && audioElement.duration > 0) {
          setDuration(audioElement.duration);
          setAudioLoaded(true);
        }
      }, 1000);
    };
    
    const handleCanPlay = () => {
      console.log(`Audio can play now`);
      setAudioLoaded(true);
      
      // Double-check duration once we can play
      if (isFinite(audio.duration) && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      
      // Clear buffering timeout and reset UI
      clearBufferingTimeout();
      
      // Only reset showBufferingUI if we haven't recently seeked
      if (!recentlySeekRef.current) {
        setShowBufferingUI(false);
      }
      
      if (playbackState === 'buffering' && isPlaying) {
        audio.play()
          .then(() => {
            setPlaybackState('playing');
            setLoadRetries(0);
          })
          .catch(error => {
            console.error(`Error playing audio:`, error);
            handlePlaybackError();
          });
      } else if (playbackState === 'loading') {
        setPlaybackState('idle');
      }
    };
    
    const handleWaiting = () => {
      console.log(`Audio is waiting/buffering`);
      setPlaybackState('buffering');
      
      // Don't show buffering UI immediately after seeking
      const timeSinceLastSeek = Date.now() - lastSeekTimeRef.current;
      const timeSincePlayClick = Date.now() - playClickTimeRef.current;
      const recentSeek = timeSinceLastSeek < 1000; // Within 1 second of a seek
      const recentPlayClick = timeSincePlayClick < 1000; // Within 1 second of clicking play
      
      if (recentSeek || recentPlayClick) {
        console.log(recentPlayClick ? "Ignoring brief buffering after play click" : "Ignoring brief buffering after seek");
        return;
      }
      
      // Start buffering timer only if not already started
      if (bufferingStartTimeRef.current === null) {
        bufferingStartTimeRef.current = Date.now();
        
        // Set a 5-second timeout before showing buffering UI
        bufferingTimeoutRef.current = window.setTimeout(() => {
          // Only show buffering UI if we're still buffering after 5 seconds
          // AND we haven't recently performed a seek or clicked play
          const stillRecentPlayClick = (Date.now() - playClickTimeRef.current) < 1000;
          if (playbackState === 'buffering' && !recentlySeekRef.current && !stillRecentPlayClick) {
            setShowBufferingUI(true);
          }
          bufferingTimeoutRef.current = null;
        }, 5000);
      }
    };
    
    const handleError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error(`Error with audio playback: ${error?.code} - ${error?.message}`);
      handlePlaybackError();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnd);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);

    // Set volume and muted state
    audio.volume = volume;
    audio.muted = isMuted;

    return () => {
      clearBufferingTimeout();
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnd);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
    };
  }, [isPlaying, playbackState]);

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

  const handlePlaybackError = () => {
    if (loadRetries < 3) {
      setLoadRetries(prev => prev + 1);
      setPlaybackState('loading');
      
      const audio = audioRef.current;
      if (audio && audioUrl) {
        console.log(`Retrying audio load (attempt ${loadRetries + 1})`);
        setTimeout(() => {
          audio.load();
        }, 1000); // Wait a second before retrying
      }
    } else {
      setPlaybackState('error');
      setIsPlaying(false);
      toast({
        title: "Playback Error",
        description: "Could not play this track. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Record the time when play was clicked to prevent buffering flash
    playClickTimeRef.current = Date.now();

    if (isPlaying) {
      audio.pause();
      setPlaybackState('paused');
      setIsPlaying(false);
    } else {
      setPlaybackState('buffering');
      // Don't show buffering UI immediately after play button click
      setShowBufferingUI(false);
      
      audio.play()
        .then(() => {
          setPlaybackState('playing');
          setIsPlaying(true);
        })
        .catch(error => {
          console.error("Playback failed:", error);
          handlePlaybackError();
        });
    }
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || !isFinite(time) || isNaN(time)) return;
    
    // Mark that we recently performed a seek operation
    lastSeekTimeRef.current = Date.now();
    recentlySeekRef.current = true;
    
    // Reset buffering states when seeking
    clearBufferingTimeout();
    bufferingStartTimeRef.current = null;
    
    // Don't immediately clear showBufferingUI - this prevents flickering
    // when seeking while already in a buffering state
    // We'll let the timeout handle clearing this flag
    
    // Ensure we're seeking to a valid time within the audio duration
    const validTime = Math.max(0, Math.min(time, isFinite(duration) ? duration : 0));
    audio.currentTime = validTime;
    setCurrentTime(validTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      audio.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
    }
  };

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackState,
    isGeneratingWaveform,
    audioLoaded,
    showBufferingUI,
    isBuffering: playbackState === 'buffering',
    togglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange,
  };
}
