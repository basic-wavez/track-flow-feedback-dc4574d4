import React, { useRef, useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import VisualizerCanvas from './VisualizerCanvas';
import { Button } from '@/components/ui/button';
import { WaveformCircle } from 'lucide-react';

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
  const { isActive, toggleVisualizer } = useAudioVisualizer(
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
        audioContext.initializeContext();
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
      return () => {
        audio.removeEventListener('play', handleInitialize);
      };
    }
  }, [audioContext, audioRef]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleVisualizer}
        className={`absolute top-2 right-2 z-10 opacity-70 hover:opacity-100 ${
          isActive ? 'text-wip-pink' : 'text-gray-400'
        }`}
        title={isActive ? "Disable visualizer" : "Enable visualizer"}
      >
        <WaveformCircle size={18} />
      </Button>
      
      {isActive ? (
        <VisualizerCanvas ref={canvasRef} className="bg-wip-darker" />
      ) : (
        <div className="w-full h-24 bg-wip-darker rounded-md flex items-center justify-center">
          <p className="text-sm text-gray-400">Visualizer disabled</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(FFTVisualizer);
