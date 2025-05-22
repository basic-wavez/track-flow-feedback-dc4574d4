
import React, { useEffect, useState } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useVisualizerConfig } from './config/visualizerConfig';
import { useVisualizerInitialization } from './hooks/useVisualizerInitialization';
import VisualizerContainer from './components/VisualizerContainer';
import FFTVisualizerPanel from './components/FFTVisualizerPanel';
import OscilloscopePanel from './components/OscilloscopePanel';
import SpectrogramPanel from './components/SpectrogramPanel';

interface MultiVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  className?: string;
  preComputedWaveform?: number[] | null;
}

const MultiVisualizer: React.FC<MultiVisualizerProps> = ({
  audioRef,
  isPlaying,
  className = '',
  preComputedWaveform
}) => {
  // Track visualization state
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  
  // Audio context initialization
  const audioContext = useAudioContext(audioRef);
  
  // Initialize visualizer
  useVisualizerInitialization(audioRef, audioContext);
  
  // Get visualizer configuration based on device and settings
  const { fftConfig, oscilloscopeConfig, spectrogramConfig, settings } = useVisualizerConfig();

  // Disable visualizer if we encounter CORS errors
  useEffect(() => {
    if (audioContext.error) {
      const errorMessage = audioContext.error.toString();
      if (errorMessage.includes("CORS") || errorMessage.includes("MediaElementAudioSource")) {
        console.warn("MultiVisualizer: Disabling visualizer due to CORS restrictions");
        setVisualizerEnabled(false);
      }
    }
  }, [audioContext.error]);

  // If visualizer is disabled due to CORS, render a simple message
  if (!visualizerEnabled) {
    return (
      <div className={`${className} flex items-center justify-center h-20 bg-wip-darker rounded-md`}>
        <p className="text-sm text-gray-400">Visualizer disabled - CORS restrictions</p>
      </div>
    );
  }

  return (
    <VisualizerContainer className={className}>
      {/* FFT Visualizer */}
      <FFTVisualizerPanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={{...fftConfig, preComputedWaveform}}
        enabled={settings.fftEnabled}
      />
      
      {/* Oscilloscope Visualizer */}
      <OscilloscopePanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={{...oscilloscopeConfig, preComputedWaveform}}
        enabled={settings.oscilloscopeEnabled}
      />
      
      {/* Spectrogram Visualizer */}
      <SpectrogramPanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={{...spectrogramConfig, preComputedWaveform}}
        enabled={settings.spectrogramEnabled}
      />
    </VisualizerContainer>
  );
};

export default React.memo(MultiVisualizer);
