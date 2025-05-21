
import React, { useRef, useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { useOscilloscopeVisualizer, OscilloscopeOptions } from '@/hooks/audio/useOscilloscopeVisualizer';
import { useSpectrogramVisualizer } from '@/hooks/audio/useSpectrogramVisualizer';
import { useVisualizerSettings } from '@/hooks/audio/useVisualizerSettings';
import VisualizerCanvas from './VisualizerCanvas';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import VisualizerControls from './VisualizerControls';

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
  
  // Settings for all visualizers
  const { settings, updateSetting, toggleSetting } = useVisualizerSettings();
  
  // Controls state
  const [showControls, setShowControls] = React.useState(false);
  
  // Audio context initialization
  const audioContext = useAudioContext(audioRef);
  
  // Define max frequency - focusing on up to 15kHz instead of full range
  const maxFrequency = 15000; // 15kHz
  
  // Initialize FFT visualizer
  const { isActive: fftActive } = useAudioVisualizer(
    fftCanvasRef,
    audioContext,
    isPlaying && settings.fftEnabled,
    {
      barCount: 64,
      barColor: settings.fftBarColor,
      capColor: '#D946EF',
      maxFrequency: maxFrequency, // Pass max frequency to visualizer
    }
  );

  // Create oscilloscope options from settings
  const oscilloscopeOptions: OscilloscopeOptions = {
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
      colorMid: settings.fftBarColor,
      timeScale: 3 / settings.sensitivity,
      maxFrequency: maxFrequency, // Pass max frequency to visualizer
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

  // Toggle controls panel
  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border border-gray-800 bg-wip-darker ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleControls}
        className="absolute top-2 right-2 z-10 opacity-70 hover:opacity-100 text-gray-400"
        title="Visualizer settings"
      >
        <Settings2 size={18} />
      </Button>
      
      {showControls && (
        <VisualizerControls 
          settings={settings}
          onToggleSetting={toggleSetting}
          onUpdateSetting={updateSetting}
          onClose={() => setShowControls(false)}
        />
      )}
      
      {/* Reduced height by half (from 300px to 150px) */}
      <div className="flex gap-2 p-2 h-[150px]">
        {/* FFT Visualizer - Takes more space (40%) */}
        <div className="w-[40%] rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">FFT Spectrum (0-15kHz)</div>
          {settings.fftEnabled ? (
            <div className="h-[calc(100%-24px)]">
              <VisualizerCanvas ref={fftCanvasRef} className="bg-black" />
            </div>
          ) : (
            <div className="w-full h-[calc(100%-24px)] flex items-center justify-center text-xs text-gray-500">
              FFT disabled
            </div>
          )}
        </div>
        
        {/* Oscilloscope Visualizer - Square in the middle (20%) */}
        <div className="w-[20%] aspect-square rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">Oscilloscope</div>
          {settings.oscilloscopeEnabled ? (
            <div className="h-[calc(100%-24px)]">
              <VisualizerCanvas ref={oscilloscopeCanvasRef} className="bg-black" />
            </div>
          ) : (
            <div className="w-full h-[calc(100%-24px)] flex items-center justify-center text-xs text-gray-500">
              Oscilloscope disabled
            </div>
          )}
        </div>
        
        {/* Spectrogram Visualizer - Takes more space (40%) */}
        <div className="w-[40%] rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">Spectrogram (0-15kHz)</div>
          {settings.spectrogramEnabled ? (
            <div className="h-[calc(100%-24px)]">
              <VisualizerCanvas ref={spectrogramCanvasRef} className="bg-black" />
            </div>
          ) : (
            <div className="w-full h-[calc(100%-24px)] flex items-center justify-center text-xs text-gray-500">
              Spectrogram disabled
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MultiVisualizer);
