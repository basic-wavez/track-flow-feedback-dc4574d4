
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
  
  // Handle track end for playlist autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaylistMode || !contextPlayNext) return;
    
    const handleTrackEnd = () => contextPlayNext();
    
    audio.addEventListener('ended', handleTrackEnd);
    return () => audio.removeEventListener('ended', handleTrackEnd);
  }, [contextPlayNext, isPlaylistMode, audioRef]);
  
  // Main audio configuration and playback control - separated from the play/pause logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playbackUrl) {
      console.debug('Audio element or playback URL not available:', { 
        audioExists: !!audio, 
        playbackUrl 
      });
      return;
    }
    
    // Only reconfigure if the URL changed
    if (previousUrlRef.current === playbackUrl) {
      console.debug('Playback URL unchanged, skipping reconfiguration:', playbackUrl);
      return;
    }
    
    console.debug('Setting up new audio source:', playbackUrl, 'Current state:', { 
      isPlaying, 
      currentSrc: audio.src,
      readyState: audio.readyState
    });
    
    // Reset audio state
    audio.pause();
    audio.currentTime = 0;
    
    // First set crossOrigin, then src to ensure proper fetch sequence
    audio.crossOrigin = "anonymous";
    previousUrlRef.current = playbackUrl;
    audio.src = playbackUrl;
    
    console.debug('Audio element configured with src:', playbackUrl);
  }, [playbackUrl, audioRef]);
  
  // Separate effect for play control to avoid race conditions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playbackUrl) return;
    
    console.debug('Play state changed:', { isPlaying, readyState: audio.readyState, src: audio.src });
    
    if (isPlaying) {
      // Ensure we have a valid source before attempting to play
      if (audio.src && audio.src.includes(playbackUrl)) {
        console.debug('Attempting to play audio:', playbackUrl);
        
        // Small timeout to ensure the browser has processed the src change
        setTimeout(() => {
          audio.play()
            .then(() => {
              console.debug('Playback started successfully, readyState:', audio.readyState);
            })
            .catch(err => {
              console.error('Could not start playback:', err, 'readyState:', audio.readyState);
            });
        }, 50);
      } else {
        console.warn('Cannot play - source not properly set:', { 
          audioSrc: audio.src, 
          expectedSrc: playbackUrl 
        });
      }
    } else {
      audio.pause();
      console.debug('Audio paused');
    }
  }, [isPlaying, playbackUrl, audioRef]);
  
  // Debug event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const logPlayEvent = () => console.debug('Play event fired, readyState:', audio.readyState);
    const logLoadStart = () => console.debug('LoadStart event fired');
    const logCanPlay = () => console.debug('CanPlay event fired, readyState:', audio.readyState);
    const logError = (e: ErrorEvent) => console.error('Audio error:', e);
    
    audio.addEventListener('play', logPlayEvent);
    audio.addEventListener('loadstart', logLoadStart);
    audio.addEventListener('canplay', logCanPlay);
    audio.addEventListener('error', logError as EventListener);
    
    return () => {
      audio.removeEventListener('play', logPlayEvent);
      audio.removeEventListener('loadstart', logLoadStart);
      audio.removeEventListener('canplay', logCanPlay);
      audio.removeEventListener('error', logError as EventListener);
    };
  }, [audioRef]);
  
  return <audio ref={audioRef} preload="auto" />;
};

export default AudioElement;
