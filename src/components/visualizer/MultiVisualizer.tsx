
import React, { useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useVisualizerConfig } from './config/visualizerConfig';
import { useVisualizerInitialization } from './hooks/useVisualizerInitialization';
import VisualizerContainer from './components/VisualizerContainer';
import FFTVisualizerPanel from './components/FFTVisualizerPanel';
import OscilloscopePanel from './components/OscilloscopePanel';
import SpectrogramPanel from './components/SpectrogramPanel';
import { usePeaksData } from '@/context/PeaksDataContext';

interface MultiVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  className?: string;
  peaksDataUrl?: string; // Add URL for pre-computed peaks data
}

const MultiVisualizer: React.FC<MultiVisualizerProps> = ({
  audioRef,
  isPlaying,
  className = '',
  peaksDataUrl
}) => {
  // Audio context initialization
  const audioContext = useAudioContext(audioRef);
  
  // Get access to shared peaks data
  const { hasPeaksData, peaksData } = usePeaksData();
  
  // Initialize visualizer, passing the peaks data - fix by removing the third argument
  const { isInitialized } = useVisualizerInitialization(audioRef, audioContext);
  
  // Get visualizer configuration based on device and settings
  const { fftConfig, oscilloscopeConfig, spectrogramConfig, settings } = useVisualizerConfig();

  // Load peaks data from URL if provided
  useEffect(() => {
    if (peaksDataUrl && !hasPeaksData && peaksData === null) {
      console.log('MultiVisualizer: Loading peaks data from URL:', peaksDataUrl);
      // Normally we would fetch the peaks data here, but that's handled by the PeaksDataContext
    }
  }, [peaksDataUrl, hasPeaksData, peaksData]);

  // Log initialization status for debugging
  useEffect(() => {
    if (isInitialized) {
      console.log('MultiVisualizer: Audio visualizer initialized with AudioContext');
      if (hasPeaksData) {
        console.log('MultiVisualizer: Using pre-computed peaks data');
      }
    }
  }, [isInitialized, hasPeaksData]);

  return (
    <VisualizerContainer className={className}>
      {/* FFT Visualizer */}
      <FFTVisualizerPanel 
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={fftConfig}
        enabled={settings.fftEnabled}
        usePeaksData={hasPeaksData}
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
