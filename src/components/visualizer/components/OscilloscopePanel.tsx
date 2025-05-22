
import React, { useRef } from 'react';
import { useOscilloscopeVisualizer } from '@/hooks/audio/useOscilloscopeVisualizer';
import { AudioContextState } from '@/hooks/audio/useAudioContext';
import VisualizerCanvas from './VisualizerCanvas';
import VisualizerPanel from './VisualizerPanel';

interface OscilloscopePanelProps {
  audioContext: AudioContextState;
  audioRef?: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  config: any;
  enabled: boolean;
}

const OscilloscopePanel: React.FC<OscilloscopePanelProps> = ({
  audioContext,
  audioRef,
  isPlaying,
  config,
  enabled
}) => {
  const oscilloscopeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize Oscilloscope visualizer
  useOscilloscopeVisualizer(
    oscilloscopeCanvasRef,
    audioContext,
    isPlaying && enabled,
    config
  );

  return (
    <VisualizerPanel width="w-full" enabled={enabled} type="Oscilloscope">
      <VisualizerCanvas ref={oscilloscopeCanvasRef} className="bg-[#1A1A1A]" />
    </VisualizerPanel>
  );
};

export default OscilloscopePanel;
