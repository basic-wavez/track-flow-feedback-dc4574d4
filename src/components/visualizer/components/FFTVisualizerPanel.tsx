
import React, { useState } from 'react';
import { AudioContextState } from '@/hooks/audio/useAudioContext';
import VisualizerPanel from './VisualizerPanel';
import VisualizerCanvas from './VisualizerCanvas';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { BarVisConfig } from '../config/visualizerConfig';

interface FFTVisualizerPanelProps {
  audioContext: AudioContextState;
  isPlaying: boolean;
  config: BarVisConfig;
  enabled?: boolean;
  usePeaksData?: boolean; // New prop for pre-computed peaks
}

const FFTVisualizerPanel: React.FC<FFTVisualizerPanelProps> = ({
  audioContext,
  isPlaying,
  config,
  enabled = true,
  usePeaksData = false
}) => {
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  
  const { isActive } = useAudioVisualizer(
    { current: canvasRef },
    audioContext,
    isPlaying,
    {
      ...config,
      usePeaksData, // Pass the flag to useAudioVisualizer
    }
  );

  if (!enabled) return null;
  
  return (
    <VisualizerPanel
      title="Spectrum Analyzer"
      type="FFT Visualizer"
      enabled={enabled}
      active={isActive && audioContext.isInitialized}
      loading={!audioContext.isInitialized}
      error={audioContext.error}
    >
      <VisualizerCanvas
        ref={setCanvasRef}
        className={usePeaksData ? "bg-purple-950/50" : "bg-zinc-950"}
      />
    </VisualizerPanel>
  );
};

export default React.memo(FFTVisualizerPanel);
