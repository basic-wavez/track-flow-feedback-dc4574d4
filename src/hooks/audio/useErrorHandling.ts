
import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook that handles audio playback errors
 */
export function useErrorHandling({
  audioRef,
  loadRetries,
  setLoadRetries,
  setPlaybackState,
  setIsPlaying,
  audioUrl
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  loadRetries: number;
  setLoadRetries: (callback: (prev: number) => number) => void;
  setPlaybackState: (state: string) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  audioUrl?: string;
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error(`Error with audio playback: ${error?.code} - ${error?.message}`);
      handlePlaybackError();
    };

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

    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("error", handleError);
    };
  }, [audioRef, loadRetries, setLoadRetries, setPlaybackState, setIsPlaying, audioUrl]);
  
  return null;
}
