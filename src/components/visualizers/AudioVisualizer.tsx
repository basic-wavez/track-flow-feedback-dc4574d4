
import React, { useState } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useVisualizer, VisualizerProvider } from '@/context/VisualizerContext';
import SpectrumVisualizer from './SpectrumVisualizer';
import OscilloscopeVisualizer from './OscilloscopeVisualizer';
import SpectrogramVisualizer from './SpectrogramVisualizer';
import VisualizerControls from './VisualizerControls';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

const VisualizerContent = ({ audioRef, isPlaying }: AudioVisualizerProps) => {
  const { activeVisualizer, isVisible } = useVisualizer();
  const [isExpanded, setIsExpanded] = useState(false);
  const audioContext = useAudioContext(audioRef);
  
  // Show nothing if visualizer is disabled
  if (activeVisualizer === 'none' || !isVisible) {
    return null;
  }
  
  const visualizerHeight = isExpanded ? 'h-60' : 'h-32';
  
  return (
    <div className="mt-4 transition-all duration-300">
      <VisualizerControls 
        isExpanded={isExpanded}
        toggleExpand={() => setIsExpanded(!isExpanded)}
      />
      
      <div className={`relative overflow-hidden rounded-lg ${visualizerHeight}`}>
        {/* Spectrum visualizer */}
        {activeVisualizer === 'spectrum' && (
          <div className="absolute inset-0 bg-gray-900/70">
            <SpectrumVisualizer 
              analyserNode={audioContext.analyserNode} 
              isPlaying={isPlaying}
            />
          </div>
        )}
        
        {/* Oscilloscope visualizer */}
        {activeVisualizer === 'oscilloscope' && (
          <div className="absolute inset-0 bg-gray-900/70">
            <OscilloscopeVisualizer 
              analyserNode={audioContext.analyserNode} 
              isPlaying={isPlaying}
            />
          </div>
        )}
        
        {/* Spectrogram visualizer */}
        {activeVisualizer === 'spectrogram' && (
          <div className="absolute inset-0 bg-gray-900/70">
            <SpectrogramVisualizer 
              analyserNode={audioContext.analyserNode} 
              isPlaying={isPlaying}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component that provides the VisualizerContext
const AudioVisualizer: React.FC<AudioVisualizerProps> = (props) => {
  return (
    <VisualizerProvider>
      <VisualizerContent {...props} />
    </VisualizerProvider>
  );
};

export default AudioVisualizer;
