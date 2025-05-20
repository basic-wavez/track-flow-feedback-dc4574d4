
import { useEffect, useRef } from "react";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";

interface AudioElementProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  playbackUrl: string;
  isPlaying: boolean;
  isPlaylistMode?: boolean;
}

const AudioElement: React.FC<AudioElementProps> = ({ 
  audioRef, 
  playbackUrl, 
  isPlaying,
  isPlaylistMode = false
}) => {
  const { playNextTrack: contextPlayNext } = usePlaylistPlayer();
  const previousUrlRef = useRef<string>('');
  const playAttemptTimeoutRef = useRef<number | null>(null);
  
  // Handle track end for playlist autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaylistMode || !contextPlayNext) return;
    
    const handleTrackEnd = () => contextPlayNext();
    
    audio.addEventListener('ended', handleTrackEnd);
    return () => audio.removeEventListener('ended', handleTrackEnd);
  }, [contextPlayNext, isPlaylistMode, audioRef]);
  
  // Combined audio source setup and playback control in one effect
  // to ensure proper sequencing of operations
  useEffect(() => {
    // Clear any pending play attempts when effect runs
    if (playAttemptTimeoutRef.current) {
      window.clearTimeout(playAttemptTimeoutRef.current);
      playAttemptTimeoutRef.current = null;
    }
    
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not available');
      return;
    }
    
    if (!playbackUrl) {
      console.error('No playback URL provided');
      return;
    }
    
    // Log the current state to help diagnose issues
    console.debug('AudioElement effect running with:', { 
      playbackUrl, 
      isPlaying, 
      currentSrc: audio.src,
      previousUrl: previousUrlRef.current
    });
    
    // Validate URL format (basic check)
    if (!playbackUrl.startsWith('http')) {
      console.error('Invalid playback URL format:', playbackUrl);
      return;
    }
    
    // If URL hasn't changed, just handle play state
    if (previousUrlRef.current === playbackUrl) {
      console.debug('URL unchanged, only updating play state:', { isPlaying });
      
      if (isPlaying) {
        if (audio.paused && audio.readyState >= 2) {
          console.debug('Playing with existing source');
          audio.play()
            .then(() => console.debug('Playback started'))
            .catch(err => console.error('Play failed with existing source:', err));
        }
      } else {
        audio.pause();
      }
      return;
    }
    
    // URL has changed, need to reset and reconfigure audio
    console.debug('Setting up new audio source:', playbackUrl);
    
    // Always pause and reset before changing source
    audio.pause();
    audio.currentTime = 0;
    
    // Set crossOrigin first (before src)
    audio.crossOrigin = "anonymous";
    
    try {
      // Save the URL we're about to use
      previousUrlRef.current = playbackUrl;
      
      // Set the source
      audio.src = playbackUrl;
      console.debug('Audio source set:', playbackUrl);
      
      // Load the audio (explicit call)
      audio.load();
      
      // If we should be playing, set up a play attempt
      if (isPlaying) {
        // Wait for metadata loading to start
        const attemptPlay = () => {
          console.debug('Attempting to play, readyState:', audio.readyState);
          
          audio.play()
            .then(() => {
              console.debug('Playback started successfully');
            })
            .catch(err => {
              console.error('Play failed:', err.name, err.message);
              
              // If not ready, retry once more after a delay
              if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
                console.debug('Retrying play after delay');
                playAttemptTimeoutRef.current = window.setTimeout(() => {
                  audio.play()
                    .then(() => console.debug('Retry playback successful'))
                    .catch(retryErr => console.error('Retry play failed:', retryErr));
                }, 300);
              }
            });
        };
        
        // Small delay before playing to allow browser to process the source change
        playAttemptTimeoutRef.current = window.setTimeout(attemptPlay, 100);
      }
    } catch (err) {
      console.error('Error configuring audio source:', err);
    }
    
    // Clean up function
    return () => {
      if (playAttemptTimeoutRef.current) {
        window.clearTimeout(playAttemptTimeoutRef.current);
        playAttemptTimeoutRef.current = null;
      }
    };
  }, [playbackUrl, isPlaying, audioRef]); // Dependencies include all used variables
  
  // Enhanced debug event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const logPlayEvent = () => console.debug('Play event fired, readyState:', audio.readyState);
    const logLoadStart = () => console.debug('LoadStart event fired');
    const logCanPlay = () => console.debug('CanPlay event fired, readyState:', audio.readyState);
    const logWaiting = () => console.debug('Waiting event fired (buffering)');
    const logEmptied = () => console.debug('Emptied event fired (source removed)');
    const logStalled = () => console.debug('Stalled event fired (data retrieval issue)');
    const logSuspend = () => console.debug('Suspend event fired (data retrieval stopped)');
    
    const logError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error('Audio error occurred:', { 
        code: error?.code,
        message: error?.message,
        currentSrc: audio.src
      });
    };
    
    // Register all listeners
    audio.addEventListener('play', logPlayEvent);
    audio.addEventListener('loadstart', logLoadStart);
    audio.addEventListener('canplay', logCanPlay);
    audio.addEventListener('waiting', logWaiting);
    audio.addEventListener('emptied', logEmptied);
    audio.addEventListener('stalled', logStalled);
    audio.addEventListener('suspend', logSuspend);
    audio.addEventListener('error', logError);
    
    return () => {
      // Clean up all listeners
      audio.removeEventListener('play', logPlayEvent);
      audio.removeEventListener('loadstart', logLoadStart);
      audio.removeEventListener('canplay', logCanPlay);
      audio.removeEventListener('waiting', logWaiting);
      audio.removeEventListener('emptied', logEmptied);
      audio.removeEventListener('stalled', logStalled);
      audio.removeEventListener('suspend', logSuspend);
      audio.removeEventListener('error', logError);
    };
  }, [audioRef]);
  
  return <audio ref={audioRef} preload="auto" />;
};

export default AudioElement;
