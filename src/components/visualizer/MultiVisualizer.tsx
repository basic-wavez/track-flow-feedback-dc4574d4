
import React, { useRef, useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { useOscilloscopeVisualizer } from '@/hooks/audio/useOscilloscopeVisualizer';
import { useSpectrogramVisualizer } from '@/hooks/audio/useSpectrogramVisualizer';
import { useVisualizerSettings } from '@/hooks/audio/useVisualizerSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import VisualizerCanvas from './VisualizerCanvas';
import { toast } from "@/components/ui/use-toast";
import ParticleVisualizer from './ParticleVisualizer';

interface MultiVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  className?: string;
}

const MultiVisualizer: React.FC<MultiVisualizerProps> = ({
  audioRef,
  isPlaying,
  className = ''
}) => {
  // Individual canvas references
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);
  const oscilloscopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrogramCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Check if on mobile
  const isMobile = useIsMobile();
  
  // Settings for all visualizers
  const { settings } = useVisualizerSettings();
  
  // Audio context initialization
  const audioContext = useAudioContext(audioRef);
  
  // Set adjusted target FPS based on mobile status
  const targetFPS = isMobile ? 20 : 30;
  
  // Initialize FFT visualizer with reduced settings for better performance
  const { isActive: fftActive } = useAudioVisualizer(
    fftCanvasRef,
    audioContext,
    isPlaying && settings.fftEnabled,
    {
      barCount: isMobile ? 32 : (settings.fftBarCount || 32), // Reduce bars on mobile
      barColor: settings.fftBarColor,
      capColor: settings.fftCapColor || '#000000',
      maxFrequency: settings.fftMaxFrequency || 15000,
      targetFPS: targetFPS,
    }
  );

  // Create oscilloscope options from settings with performance optimizations
  const oscilloscopeOptions = {
    lineColor: settings.oscilloscopeColor,
    sensitivity: settings.oscilloscopeSensitivity || settings.sensitivity,
    lineWidth: settings.oscilloscopeLineWidth,
    backgroundColor: settings.oscilloscopeBackgroundColor || 'transparent',
    drawMode: settings.oscilloscopeDrawMode,
    dashPattern: settings.oscilloscopeDashPattern,
    fillColor: settings.oscilloscopeFillColor,
    fillOpacity: settings.oscilloscopeFillOpacity,
    invertY: settings.oscilloscopeInvertY,
    targetFPS: targetFPS,
  };
  
  // Initialize Oscilloscope visualizer with extended options
  useOscilloscopeVisualizer(
    oscilloscopeCanvasRef,
    audioContext,
    isPlaying && settings.oscilloscopeEnabled,
    oscilloscopeOptions
  );
  
  // Initialize Spectrogram visualizer with reduced settings on mobile
  useSpectrogramVisualizer(
    spectrogramCanvasRef,
    audioContext,
    isPlaying && settings.spectrogramEnabled,
    {
      colorMid: settings.spectrogramColorMid || settings.fftBarColor,
      timeScale: isMobile ? (settings.spectrogramTimeScale || 10) * 0.5 : settings.spectrogramTimeScale || 10,
      maxFrequency: settings.spectrogramMaxFrequency || 15000,
      targetFPS: isMobile ? 15 : 20, // Even lower FPS for spectrogram
      bufferSize: isMobile ? 100 : 200, // Smaller buffer on mobile
    }
  );
  
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
  
  // Debugging information for visualizer
  useEffect(() => {
    if (audioContext.error) {
      console.warn("MultiVisualizer: Visualizer active but audio context has error:", audioContext.error);
    }
    
    if (!audioContext.isInitialized) {
      console.warn("MultiVisualizer: Visualizer active but audio context not initialized");
    }
  }, [audioContext.error, audioContext.isInitialized]);

  // Define the height based on mobile status
  const visualizerHeight = isMobile ? 'h-[75px]' : 'h-[150px]';

  return (
    <div className={`relative overflow-hidden rounded-lg border border-gray-800 bg-wip-darker ${className}`} id="visualizer-container">
      {/* Visualizer containers with dynamic height */}
      <div className={`flex flex-wrap gap-2 p-2 ${visualizerHeight}`}>
        {/* FFT Visualizer */}
        <div className="w-[23%] rounded-md overflow-hidden border border-gray-800 bg-black">
          {settings.fftEnabled ? (
            <div className="h-full">
              <VisualizerCanvas ref={fftCanvasRef} className="bg-black" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              FFT disabled
            </div>
          )}
        </div>
        
        {/* Oscilloscope Visualizer */}
        <div className="w-[23%] rounded-md overflow-hidden border border-gray-800 bg-black">
          {settings.oscilloscopeEnabled ? (
            <div className="h-full">
              <VisualizerCanvas ref={oscilloscopeCanvasRef} className="bg-black" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              Oscilloscope disabled
            </div>
          )}
        </div>
        
        {/* Spectrogram Visualizer */}
        <div className="w-[23%] rounded-md overflow-hidden border border-gray-800 bg-black">
          {settings.spectrogramEnabled ? (
            <div className="h-full">
              <VisualizerCanvas ref={spectrogramCanvasRef} className="bg-black" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              Spectrogram disabled
            </div>
          )}
        </div>
        
        {/* Particle Visualizer - New */}
        <div className="w-[23%] rounded-md overflow-hidden border border-gray-800 bg-black">
          {settings.particleEnabled ? (
            <div className="h-full">
              <ParticleVisualizer 
                audioRef={audioRef} 
                isPlaying={isPlaying} 
                options={{
                  particleCount: isMobile ? 500 : (settings.particleCount || 1000),
                  particleSize: settings.particleSize || 2.0,
                  baseColor: settings.particleColor || settings.fftBarColor,
                  sensitivity: settings.particleSensitivity || settings.sensitivity
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              Particles disabled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(MultiVisualizer);
