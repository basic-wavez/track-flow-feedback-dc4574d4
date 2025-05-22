
import React, { useRef } from 'react';
import { useSpectrogramVisualizer } from '@/hooks/audio/useSpectrogramVisualizer';
import { AudioContextState } from '@/hooks/audio/useAudioContext';
import { SpectrogramOptions } from '@/hooks/audio/types/spectrogramTypes';
import VisualizerCanvas from './VisualizerCanvas';
import VisualizerPanel from './VisualizerPanel';

interface SpectrogramPanelProps {
  audioContext: AudioContextState;
  isPlaying: boolean;
  config: SpectrogramOptions;
  enabled: boolean;
}

const SpectrogramPanel: React.FC<SpectrogramPanelProps> = ({
  audioContext,
  isPlaying,
  config,
  enabled
}) => {
  const spectrogramCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize Spectrogram visualizer
  useSpectrogramVisualizer(
    spectrogramCanvasRef,
    audioContext,
    isPlaying && enabled,
    config
  );

  return (
    <VisualizerPanel width="w-[40%]" enabled={enabled} type="Spectrogram">
      <VisualizerCanvas ref={spectrogramCanvasRef} className="bg-black" />
    </VisualizerPanel>
  );
};

export default SpectrogramPanel;
