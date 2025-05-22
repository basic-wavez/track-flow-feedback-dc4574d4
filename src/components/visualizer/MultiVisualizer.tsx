
import React from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useVisualizerConfig } from './config/visualizerConfig';
import { useVisualizerInitialization } from './hooks/useVisualizerInitialization';
import VisualizerContainer from './components/VisualizerContainer';
import OscilloscopePanel from './components/OscilloscopePanel';

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
  const { oscilloscopeConfig } = useVisualizerConfig();

  return (
    <VisualizerContainer className={className}>
      {/* Only show Oscilloscope Visualizer at full width */}
      <OscilloscopePanel 
        audioRef={audioRef}
        audioContext={audioContext}
        isPlaying={isPlaying}
        config={oscilloscopeConfig}
        enabled={true}
      />
    </VisualizerContainer>
  );
};

export default React.memo(MultiVisualizer);
