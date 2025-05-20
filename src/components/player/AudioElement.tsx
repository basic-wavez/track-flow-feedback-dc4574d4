
import React, { useEffect, useState, useRef } from "react";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
  const [usingProxy, setUsingProxy] = useState<boolean>(false);
  const [proxyFailed, setProxyFailed] = useState<boolean>(false);
  const errorCountRef = useRef<number>(0);
  
  // Process URL to handle CORS if needed
  useEffect(() => {
    if (!playbackUrl) {
      setProcessedUrl('');
      setUsingProxy(false);
      setProxyFailed(false);
      return;
    }
    
    // Reset proxy failed state on new URL
    setProxyFailed(false);
    errorCountRef.current = 0;
    
    // Check if URL is from a known CORS-restricted domain (like S3)
    const isExternalUrl = playbackUrl.includes('amazonaws.com') || 
                          playbackUrl.includes('storage.googleapis.com') || 
                          (!playbackUrl.includes('localhost') && !playbackUrl.startsWith('/'));
    
    if (isExternalUrl && !proxyFailed) {
      // Create a proxied URL
      const projectRef = 'qzykfyavenplpxpdnfxh'; // The Supabase project reference
      const proxyUrl = `https://${projectRef}.functions.supabase.co/audio-proxy?url=${encodeURIComponent(playbackUrl)}`;
      console.log(`Using proxied URL: ${proxyUrl}`);
      setProcessedUrl(proxyUrl);
      setUsingProxy(true);
    } else {
      // Use the original URL for local resources or if proxy failed
      console.log(`Using direct URL: ${playbackUrl}`);
      setProcessedUrl(playbackUrl);
      setUsingProxy(false);
    }
  }, [playbackUrl, proxyFailed]);
  
  // Handle track end for playlist autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaylistMode || !contextPlayNext) return;
    
    const handleTrackEnd = () => contextPlayNext();
    
    audio.addEventListener('ended', handleTrackEnd);
    return () => audio.removeEventListener('ended', handleTrackEnd);
  }, [contextPlayNext, isPlaylistMode, audioRef]);

  // Add error handling for audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error(`Audio error: ${error?.code} - ${error?.message}`);
      
      // Check if using proxy and error occurs
      if (usingProxy) {
        errorCountRef.current += 1;
        
        if (errorCountRef.current >= 2) {
          console.log("Proxy failed, falling back to direct URL");
          setProxyFailed(true);
          toast({
            title: "Audio Proxy Issue",
            description: "Trying direct playback instead. Some visualizers may be disabled.",
            duration: 5000,
          });
        }
      } else if (errorCountRef.current >= 3) {
        // If we've tried both proxy and direct and still have errors
        toast({
          title: "Playback Error",
          description: "Could not play the audio track. Please try again later.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };
    
    audio.addEventListener('error', handleError);
    return () => audio.removeEventListener('error', handleError);
  }, [usingProxy]);

  return <audio ref={audioRef} src={processedUrl} preload="auto" />;
};

export default AudioElement;
