
import React, { useRef, useEffect } from 'react';
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
  
  // Debug logging for component lifecycle
  useEffect(() => {
    console.log('OscilloscopePanel mounted/updated');
    return () => {
      console.log('OscilloscopePanel unmounted - cleaning up oscilloscope');
    };
  }, []);
  
  // Initialize Oscilloscope visualizer
  const { draw } = useOscilloscopeVisualizer(
    oscilloscopeCanvasRef,
    audioContext,
    isPlaying && enabled,
    config
  );
  
  // Make sure to clean up on unmount
  useEffect(() => {
    return () => {
      // Extra cleanup logic if needed
    };
  }, []);

  return (
    <VisualizerPanel width="w-full" enabled={enabled} type="Oscilloscope">
      <VisualizerCanvas ref={oscilloscopeCanvasRef} className="bg-black" />
    </VisualizerPanel>
  );
};

export default OscilloscopePanel;
