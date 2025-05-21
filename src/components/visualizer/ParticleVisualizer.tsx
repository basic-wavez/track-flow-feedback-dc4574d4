
import React, { useRef, useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useParticleVisualizer } from '@/hooks/audio/useParticleVisualizer';
import VisualizerCanvas from './VisualizerCanvas';

interface ParticleVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  className?: string;
  options?: {
    particleCount?: number;
    particleSize?: number;
    baseColor?: string;
    sensitivity?: number;
  };
}

const ParticleVisualizer: React.FC<ParticleVisualizerProps> = ({
  audioRef,
  isPlaying,
  className = '',
  options = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContext = useAudioContext(audioRef);
  
  const { draw } = useParticleVisualizer(
    canvasRef,
    audioContext, 
    isPlaying,
    {
      particleCount: options.particleCount || 1000,
      particleSize: options.particleSize || 2.0,
      baseColor: options.baseColor || '#9b87f5',
      sensitivity: options.sensitivity || 1.0,
      targetFPS: 30
    }
  );
  
  // Initialize audio context when component mounts
  useEffect(() => {
    if (!audioContext.isInitialized && audioRef.current) {
      audioContext.initializeContext();
    }
  }, [audioContext, audioRef]);
  
  return (
    <VisualizerCanvas 
      ref={canvasRef}
      className={`bg-black ${className}`}
    />
  );
};

export default React.memo(ParticleVisualizer);
