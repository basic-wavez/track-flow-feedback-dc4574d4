
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
  preComputedWaveform?: number[] | null;
}

const MultiVisualizer: React.FC<MultiVisualizerProps> = ({
  audioRef,
  isPlaying,
  className = '',
  preComputedWaveform = null
}) => {
  // Audio context initialization
  const audioContext = useAudioContext(audioRef);
  
  // Initialize visualizer
  useVisualizerInitialization(audioRef, audioContext);
  
  // Get visualizer configuration based on device and settings
  const { fftConfig, oscilloscopeConfig, spectrogramConfig, settings } = useVisualizerConfig();
  
  // Log when preComputed waveform is available
  React.useEffect(() => {
    if (preComputedWaveform && preComputedWaveform.length > 0) {
      console.log('MultiVisualizer: Pre-computed waveform available with', preComputedWaveform.length, 'points');
    }
  }, [preComputedWaveform]);

  return (
    <VisualizerContainer className={className}>
      {/* FFT Visualizer */}
      <FFTVisualizerPanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={fftConfig}
        enabled={settings.fftEnabled}
        preComputedWaveform={preComputedWaveform}
      />
      
      {/* Oscilloscope Visualizer */}
      <OscilloscopePanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={oscilloscopeConfig}
        enabled={settings.oscilloscopeEnabled}
        preComputedWaveform={preComputedWaveform}
      />
      
      {/* Spectrogram Visualizer */}
      <SpectrogramPanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={spectrogramConfig}
        enabled={settings.spectrogramEnabled}
        preComputedWaveform={preComputedWaveform}
      />
    </VisualizerContainer>
  );
};

export default React.memo(MultiVisualizer);
