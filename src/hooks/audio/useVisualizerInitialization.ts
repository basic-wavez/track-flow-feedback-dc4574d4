import { useEffect } from 'react';
import { AudioContextState } from '@/hooks/audio/useAudioContext';
import { toast } from "@/components/ui/use-toast";

// Updated the type to include the initializeContext function
interface AudioContextWithInitialize extends AudioContextState {
  initializeContext: () => void;
}

export const useVisualizerInitialization = (
  audioRef: React.RefObject<HTMLAudioElement>,
  audioContext: AudioContextWithInitialize
) => {
  // Initialize audio context on first user interaction (required by browsers)
  useEffect(() => {
    const handleInitialize = () => {
      if (!audioContext.isInitialized) {
        console.log("MultiVisualizer: Initializing audio context on user interaction");
        audioContext.initializeContext();
        
        // Check for errors after initialization attempt
        setTimeout(() => {
          if (audioContext.error) {
            console.error("MultiVisualizer: Error initializing audio context:", audioContext.error);
            toast({
              title: "Visualizer issue",
              description: "Visualizer disabled due to CORS restrictions. Audio playback will continue normally.",
              variant: "destructive",
            });
          }
        }, 500);
      }
    };
    
    // Try to initialize on mount if possible
    if (audioRef.current?.readyState > 0) {
      handleInitialize();
    }
    
    // Otherwise wait for user interaction
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('play', handleInitialize);
      audio.addEventListener('canplay', handleInitialize);
      
      return () => {
        audio.removeEventListener('play', handleInitialize);
        audio.removeEventListener('canplay', handleInitialize);
      };
    }
  }, [audioContext, audioRef]);

  // Debugging information for visualizer
  useEffect(() => {
    if (audioContext.error) {
      console.warn("MultiVisualizer: Visualizer active but audio context has error:", audioContext.error);
    }
    
    if (!audioContext.isInitialized) {
      console.warn("MultiVisualizer: Visualizer active but audio context not initialized");
    }
  }, [audioContext.error, audioContext.isInitialized]);

  return { isInitialized: audioContext.isInitialized };
};
