
import { useEffect } from "react";
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
  
  // Handle track end for playlist autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaylistMode || !contextPlayNext) return;
    
    const handleTrackEnd = () => contextPlayNext();
    
    audio.addEventListener('ended', handleTrackEnd);
    return () => audio.removeEventListener('ended', handleTrackEnd);
  }, [contextPlayNext, isPlaylistMode, audioRef]);
  
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
