
import React, { useEffect, useState } from "react";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [processedUrl, setProcessedUrl] = useState<string>(playbackUrl);
  
  // Process URL to handle CORS if needed
  useEffect(() => {
    if (!playbackUrl) {
      setProcessedUrl('');
      return;
    }
    
    // Check if URL is from a known CORS-restricted domain (like S3)
    const isExternalUrl = playbackUrl.includes('amazonaws.com') || 
                          playbackUrl.includes('storage.googleapis.com') || 
                          (!playbackUrl.includes('localhost') && !playbackUrl.startsWith('/'));
    
    if (isExternalUrl) {
      // Create a proxied URL
      const projectRef = 'qzykfyavenplpxpdnfxh'; // The Supabase project reference
      const proxyUrl = `https://${projectRef}.functions.supabase.co/audio-proxy?url=${encodeURIComponent(playbackUrl)}`;
      console.log(`Using proxied URL: ${proxyUrl}`);
      setProcessedUrl(proxyUrl);
    } else {
      // Use the original URL for local resources
      setProcessedUrl(playbackUrl);
    }
  }, [playbackUrl]);
  
  // Handle track end for playlist autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaylistMode || !contextPlayNext) return;
    
    const handleTrackEnd = () => contextPlayNext();
    
    audio.addEventListener('ended', handleTrackEnd);
    return () => audio.removeEventListener('ended', handleTrackEnd);
  }, [contextPlayNext, isPlaylistMode, audioRef]);
  
  return <audio ref={audioRef} src={processedUrl} preload="auto" />;
};

export default AudioElement;
