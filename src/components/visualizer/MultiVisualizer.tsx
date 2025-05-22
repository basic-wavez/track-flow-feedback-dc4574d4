
import React from 'react';
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
}

const MultiVisualizer: React.FC<MultiVisualizerProps> = ({
  audioRef,
  isPlaying,
  className = ''
}) => {
  // Audio context initialization
  const audioContext = useAudioContext(audioRef);
  
  // Initialize visualizer
  useVisualizerInitialization(audioRef, audioContext);
  
  // Get visualizer configuration based on device and settings
  const { fftConfig, oscilloscopeConfig, spectrogramConfig, settings } = useVisualizerConfig();

  return (
    <VisualizerContainer className={className}>
      {/* FFT Visualizer */}
      <FFTVisualizerPanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={fftConfig}
        enabled={settings.fftEnabled}
      />
      
      {/* Oscilloscope Visualizer */}
      <OscilloscopePanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={oscilloscopeConfig}
        enabled={settings.oscilloscopeEnabled}
      />
      
      {/* Spectrogram Visualizer */}
      <SpectrogramPanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={spectrogramConfig}
        enabled={settings.spectrogramEnabled}
      />
    </VisualizerContainer>
  );
};

export default React.memo(MultiVisualizer);
