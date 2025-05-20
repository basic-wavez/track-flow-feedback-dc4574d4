import React, { useRef, useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { useOscilloscopeVisualizer } from '@/hooks/audio/useOscilloscopeVisualizer';
import { useSpectrogramVisualizer } from '@/hooks/audio/useSpectrogramVisualizer';
import { useStereoMeterVisualizer } from '@/hooks/audio/useStereoMeterVisualizer';
import { useLUFSMeterVisualizer } from '@/hooks/audio/useLUFSMeterVisualizer';
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
  const stereoMeterCanvasRef = useRef<HTMLCanvasElement>(null);
  const lufsMeterCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Settings for all visualizers
  const { settings, updateSetting, toggleSetting } = useVisualizerSettings();
  
  // Controls state
  const [showControls, setShowControls] = React.useState(false);
  
  // Audio context initialization
  const audioContext = useAudioContext(audioRef);
  
  // Initialize FFT visualizer
  const { isActive: fftActive } = useAudioVisualizer(
    fftCanvasRef,
    audioContext,
    isPlaying && settings.fftEnabled,
    {
      barCount: 64,
      barColor: settings.fftBarColor,
      capColor: '#D946EF',
    }
  );
  
  // Initialize Oscilloscope visualizer
  useOscilloscopeVisualizer(
    oscilloscopeCanvasRef,
    audioContext,
    isPlaying && settings.oscilloscopeEnabled,
    {
      lineColor: settings.oscilloscopeColor,
      sensitivity: settings.sensitivity,
    }
  );
  
  // Initialize Spectrogram visualizer
  useSpectrogramVisualizer(
    spectrogramCanvasRef,
    audioContext,
    isPlaying && settings.spectrogramEnabled,
    {
      colorMid: settings.fftBarColor,
      timeScale: 3 / settings.sensitivity, // Adjust time scale based on sensitivity
    }
  );
  
  // Initialize Stereo Meter visualizer
  useStereoMeterVisualizer(
    stereoMeterCanvasRef,
    audioContext,
    isPlaying && settings.stereoMeterEnabled
  );
  
  // Initialize LUFS Meter visualizer
  const { currentLUFS, integratedLUFS } = useLUFSMeterVisualizer(
    lufsMeterCanvasRef,
    audioContext,
    isPlaying && settings.lufsEnabled
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
  
  // Determine the grid layout class based on settings
  const getGridLayoutClass = () => {
    switch (settings.gridLayout) {
      case '2x2':
        return 'grid-cols-2 grid-rows-2';
      case '2x3':
        return 'grid-cols-2 grid-rows-3';
      case '3x2':
        return 'grid-cols-3 grid-rows-2';
      default:
        return 'grid-cols-2 grid-rows-2';
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
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
      
      <div className={`grid ${getGridLayoutClass()} gap-2 bg-wip-darker rounded-md p-2`}>
        {/* FFT Visualizer */}
        <div className="rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">FFT Spectrum</div>
          {settings.fftEnabled ? (
            <VisualizerCanvas ref={fftCanvasRef} className="bg-black h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              FFT disabled
            </div>
          )}
        </div>
        
        {/* Oscilloscope Visualizer */}
        <div className="rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">Oscilloscope</div>
          {settings.oscilloscopeEnabled ? (
            <VisualizerCanvas ref={oscilloscopeCanvasRef} className="bg-black h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              Oscilloscope disabled
            </div>
          )}
        </div>
        
        {/* Spectrogram Visualizer */}
        <div className="rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">Spectrogram</div>
          {settings.spectrogramEnabled ? (
            <VisualizerCanvas ref={spectrogramCanvasRef} className="bg-black h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              Spectrogram disabled
            </div>
          )}
        </div>
        
        {/* Stereo Meter Visualizer */}
        <div className="rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">Stereo Meter</div>
          {settings.stereoMeterEnabled ? (
            <VisualizerCanvas ref={stereoMeterCanvasRef} className="bg-black h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              Stereo meter disabled
            </div>
          )}
        </div>
        
        {/* LUFS Meter Visualizer */}
        <div className="rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">LUFS Meter</div>
          {settings.lufsEnabled ? (
            <VisualizerCanvas ref={lufsMeterCanvasRef} className="bg-black h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              LUFS meter disabled
            </div>
          )}
        </div>
        
        {/* Stats Panel */}
        <div className="rounded-md overflow-hidden border border-gray-800 bg-black">
          <div className="text-xs font-semibold p-1 bg-gray-800 text-gray-200">Audio Stats</div>
          <div className="p-2 text-xs text-gray-300 space-y-2">
            <p>Short-term LUFS: {isFinite(currentLUFS) ? currentLUFS.toFixed(1) : 'N/A'}</p>
            <p>Integrated LUFS: {isFinite(integratedLUFS) ? integratedLUFS.toFixed(1) : 'N/A'}</p>
            <p>Sample Rate: {audioContext.audioContext?.sampleRate || 'N/A'} Hz</p>
            <p>Status: {audioContext.isInitialized ? 'Ready' : 'Not Initialized'}</p>
            <p>Audio Context: {audioContext.audioContext?.state || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MultiVisualizer);
