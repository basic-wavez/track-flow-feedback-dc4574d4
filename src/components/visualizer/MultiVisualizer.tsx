
import React, { useRef, useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { useOscilloscopeVisualizer } from '@/hooks/audio/useOscilloscopeVisualizer';
import { useSpectrogramVisualizer } from '@/hooks/audio/useSpectrogramVisualizer';
import { useVisualizerSettings } from '@/hooks/audio/useVisualizerSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import VisualizerCanvas from './VisualizerCanvas';
import { toast } from "@/components/ui/use-toast";

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
  
  // Settings for all visualizers - now only using the settings, no update methods
  const { settings } = useVisualizerSettings();
  
  // Audio context initialization
  const audioContext = useAudioContext(audioRef);
  
  // Initialize FFT visualizer
  const { isActive: fftActive } = useAudioVisualizer(
    fftCanvasRef,
    audioContext,
    isPlaying && settings.fftEnabled,
    {
      barCount: settings.fftBarCount || 32,
      barColor: settings.fftBarColor,
      capColor: settings.fftCapColor || '#000000',
      maxFrequency: settings.fftMaxFrequency || 15000,
    }
  );

  // Create oscilloscope options from settings
  const oscilloscopeOptions = {
    lineColor: settings.oscilloscopeColor,
    sensitivity: settings.oscilloscopeSensitivity || settings.sensitivity,
    lineWidth: settings.oscilloscopeLineWidth,
    backgroundColor: settings.oscilloscopeBackgroundColor || 'transparent',
    drawMode: settings.oscilloscopeDrawMode,
    dashPattern: settings.oscilloscopeDashPattern,
    fillColor: settings.oscilloscopeFillColor,
    fillOpacity: settings.oscilloscopeFillOpacity,
    invertY: settings.oscilloscopeInvertY
  };
  
  // Initialize Oscilloscope visualizer with extended options
  useOscilloscopeVisualizer(
    oscilloscopeCanvasRef,
    audioContext,
    isPlaying && settings.oscilloscopeEnabled,
    oscilloscopeOptions
  );
  
  // Initialize Spectrogram visualizer
  useSpectrogramVisualizer(
    spectrogramCanvasRef,
    audioContext,
    isPlaying && settings.spectrogramEnabled,
    {
      colorMid: settings.spectrogramColorMid || settings.fftBarColor,
      timeScale: settings.spectrogramTimeScale || 10,
      maxFrequency: settings.spectrogramMaxFrequency || 15000,
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
      <div className={`flex gap-2 p-2 ${visualizerHeight}`}>
        {/* FFT Visualizer - Takes more space (40%) */}
        <div className="w-[40%] rounded-md overflow-hidden border border-gray-800 bg-black">
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
        
        {/* Oscilloscope Visualizer - Square in the middle (20%) */}
        <div className="w-[20%] aspect-square rounded-md overflow-hidden border border-gray-800 bg-black">
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
        
        {/* Spectrogram Visualizer - Takes more space (40%) */}
        <div className="w-[40%] rounded-md overflow-hidden border border-gray-800 bg-black">
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
      </div>
    </div>
  );
};

export default React.memo(MultiVisualizer);
