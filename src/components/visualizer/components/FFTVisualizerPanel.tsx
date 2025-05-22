
import React, { useRef } from 'react';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { AudioContextState } from '@/hooks/audio/useAudioContext';
import VisualizerCanvas from './VisualizerCanvas';
import VisualizerPanel from './VisualizerPanel';

interface FFTVisualizerPanelProps {
  audioContext: AudioContextState;
  isPlaying: boolean;
  config: any;
  enabled: boolean;
  preComputedWaveform?: number[] | null;
}

const FFTVisualizerPanel: React.FC<FFTVisualizerPanelProps> = ({
  audioContext,
  isPlaying,
  config,
  enabled,
  preComputedWaveform
}) => {
  const fftCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize FFT visualizer with pre-computed waveform data
  const { isActive } = useAudioVisualizer(
    fftCanvasRef,
    audioContext,
    isPlaying && enabled,
    {
      ...config,
      preComputedWaveform: preComputedWaveform
    }
  );

  return (
    <VisualizerPanel width="w-[40%]" enabled={enabled} type="FFT">
      <VisualizerCanvas ref={fftCanvasRef} className="bg-black" />
    </VisualizerPanel>
  );
};

export default FFTVisualizerPanel;
