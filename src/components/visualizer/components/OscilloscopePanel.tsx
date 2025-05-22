
import React, { useRef } from 'react';
import { useOscilloscopeVisualizer } from '@/hooks/audio/useOscilloscopeVisualizer';
import { AudioContextState } from '@/hooks/audio/useAudioContext';
import VisualizerCanvas from './VisualizerCanvas';
import VisualizerPanel from './VisualizerPanel';

interface OscilloscopePanelProps {
  audioContext: AudioContextState;
  isPlaying: boolean;
  config: any;
  enabled: boolean;
  preComputedWaveform?: number[] | null;
}

const OscilloscopePanel: React.FC<OscilloscopePanelProps> = ({
  audioContext,
  isPlaying,
  config,
  enabled,
  preComputedWaveform
}) => {
  const oscilloscopeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize Oscilloscope visualizer with pre-computed data option
  useOscilloscopeVisualizer(
    oscilloscopeCanvasRef,
    audioContext,
    isPlaying && enabled,
    {
      ...config,
      preComputedWaveform
    }
  );

  return (
    <VisualizerPanel width="w-[20%]" enabled={enabled} type="Oscilloscope">
      <VisualizerCanvas ref={oscilloscopeCanvasRef} className="bg-black" />
    </VisualizerPanel>
  );
};

export default OscilloscopePanel;
