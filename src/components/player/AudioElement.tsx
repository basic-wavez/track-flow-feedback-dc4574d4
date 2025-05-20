
import React, { useEffect, useRef } from "react";
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
  
  // Properly set crossOrigin before src to prevent fetch cancellation
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playbackUrl) return;
    
    // First set crossOrigin, then src to ensure proper fetch sequence
    audio.crossOrigin = "anonymous";
    audio.src = playbackUrl;
    
    // If isPlaying flag is true, start playback after setting the source
    if (isPlaying) {
      audio.play().catch(err => {
        console.error('Could not start playback:', err);
      });
    }
    
    // Log readyState for debugging
    console.debug('Audio element configured with src:', playbackUrl);
    
    const logPlayEvent = () => {
      console.debug('Audio play event triggered, readyState:', audio.readyState);
    };
    
    audio.addEventListener('play', logPlayEvent, { once: true });
    return () => audio.removeEventListener('play', logPlayEvent);
  }, [playbackUrl, audioRef, isPlaying]);
  
  return <audio ref={audioRef} preload="auto" />;
};

export default AudioElement;
