import { useEffect } from 'react';
import { AudioContextState } from '@/hooks/audio/useAudioContext';
import { toast } from "@/components/ui/use-toast";

// Updated the type to include the initializeContext function
interface AudioContextWithInitialize extends AudioContextState {
  initializeContext: () => void;
}

interface VisualizerInitOptions {
  peaksDataUrl?: string;
  peaksData?: number[] | null;
}

export const useVisualizerInitialization = (
  audioRef: React.RefObject<HTMLAudioElement>,
  audioContext: AudioContextWithInitialize,
  options: VisualizerInitOptions = {}
) => {
  const { peaksDataUrl, peaksData } = options;
  const hasPeaksData = !!peaksData && Array.isArray(peaksData) && peaksData.length > 0;

  // Initialize audio context on first user interaction (required by browsers)
  useEffect(() => {
    const handleInitialize = () => {
      if (!audioContext.isInitialized) {
        console.log("MultiVisualizer: Initializing audio context on user interaction");
        
        // If we have peaks data, we can potentially use it instead of analyzing the audio signal
        if (hasPeaksData) {
          console.log("MultiVisualizer: Found pre-computed peaks data, may be used for visualization");
          // The peaks data will be used when the visualization renders
        }
        
        audioContext.initializeContext();
        
        // Check for errors after initialization attempt
        setTimeout(() => {
          if (audioContext.error) {
            console.error("MultiVisualizer: Error initializing audio context:", audioContext.error);
            toast({
              title: "Visualizer issue",
              description: "Could not initialize audio visualizer. CORS restrictions may apply.",
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
  }, [audioContext, audioRef, hasPeaksData]);

  // Debugging information for visualizer
  useEffect(() => {
    if (audioContext.error) {
      console.warn("MultiVisualizer: Visualizer active but audio context has error:", audioContext.error);
    }
    
    if (!audioContext.isInitialized) {
      console.warn("MultiVisualizer: Visualizer active but audio context not initialized");
    }
    
    if (hasPeaksData) {
      console.log("MultiVisualizer: Pre-computed peaks data available:", peaksData?.length, "points");
    } else if (peaksDataUrl) {
      console.log("MultiVisualizer: Pre-computed peaks URL available but data not loaded yet");
    }
  }, [audioContext.error, audioContext.isInitialized, hasPeaksData, peaksData, peaksDataUrl]);

  return { 
    isInitialized: audioContext.isInitialized,
    hasPeaksData
  };
};
