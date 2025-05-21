
import React, { useRef, useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { useIsMobile } from '@/hooks/use-mobile';
import VisualizerCanvas from './VisualizerCanvas';
import { toast } from "@/components/ui/use-toast";

interface FFTVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  className?: string;
}

const FFTVisualizer: React.FC<FFTVisualizerProps> = ({
  audioRef,
  isPlaying,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContext = useAudioContext(audioRef);
  const isMobile = useIsMobile();
  
  const { isActive } = useAudioVisualizer(
    canvasRef,
    audioContext,
    isPlaying,
    {
      barCount: 64,
      barColor: '#9b87f5', // Purple color from design system
      capColor: '#D946EF', // Magenta pink from design system
    }
  );
  
  // Initialize audio context on first user interaction (required by browsers)
  useEffect(() => {
    const handleInitialize = () => {
      if (!audioContext.isInitialized) {
        console.log("FFTVisualizer: Initializing audio context on user interaction");
        audioContext.initializeContext();
        
        // Check for errors after initialization attempt
        setTimeout(() => {
          if (audioContext.error) {
            console.error("FFTVisualizer: Error initializing audio context:", audioContext.error);
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
  }, [audioContext, audioRef]);
  
  // Add additional debug information for visualizer
  useEffect(() => {
    if (isActive && audioContext.error) {
      console.warn("FFTVisualizer: Visualizer active but audio context has error:", audioContext.error);
    }
    
    if (isActive && !audioContext.isInitialized) {
      console.warn("FFTVisualizer: Visualizer active but audio context not initialized");
    }
  }, [isActive, audioContext.error, audioContext.isInitialized]);

  // Set the height based on whether we're on mobile or not
  const visualizerHeight = isMobile ? 'h-12' : 'h-24';

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isActive ? (
        <VisualizerCanvas ref={canvasRef} className={`bg-wip-darker ${visualizerHeight}`} />
      ) : (
        <div className={`w-full ${visualizerHeight} bg-wip-darker rounded-md flex items-center justify-center`}>
          <p className="text-sm text-gray-400">Visualizer disabled</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(FFTVisualizer);
