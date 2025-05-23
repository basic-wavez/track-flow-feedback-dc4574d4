
import React, { useRef } from 'react';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { AudioContextState } from '@/hooks/audio/useAudioContext';
import VisualizerCanvas from './components/VisualizerCanvas';
import VisualizerPanel from './components/VisualizerPanel';

interface FFTVisualizerPanelProps {
  audioContext: AudioContextState;
  isPlaying: boolean;
  config: any;
  enabled: boolean;
}

const FFTVisualizerPanel: React.FC<FFTVisualizerPanelProps> = ({
  audioContext,
  isPlaying,
  config,
  enabled
}) => {
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize FFT visualizer
  useAudioVisualizer(
    fftCanvasRef,
    audioContext,
    isPlaying && enabled,
    config
  );

  return (
    <VisualizerPanel width="w-[40%]" enabled={enabled} type="FFT">
      <VisualizerCanvas ref={fftCanvasRef} className="bg-black" />
    </VisualizerPanel>
  );
};

export default FFTVisualizerPanel;
