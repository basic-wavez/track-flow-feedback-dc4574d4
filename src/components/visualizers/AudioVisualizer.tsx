
import React, { useState, useEffect } from 'react';
import { useAudioContext } from '@/hooks/audio/useAudioContext';
import { useVisualizer, VisualizerProvider } from '@/context/VisualizerContext';
import SpectrumVisualizer from './SpectrumVisualizer';
import OscilloscopeVisualizer from './OscilloscopeVisualizer';
import SpectrogramVisualizer from './SpectrogramVisualizer';
import VisualizerControls from './VisualizerControls';
import { toast } from "@/components/ui/use-toast";

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

const VisualizerContent = ({ audioRef, isPlaying }: AudioVisualizerProps) => {
  const { activeVisualizer, isVisible, setActiveVisualizer } = useVisualizer();
  const [isExpanded, setIsExpanded] = useState(false);
  const audioContext = useAudioContext(audioRef);
  const [hasShownCorsWarning, setHasShownCorsWarning] = useState(false);
  
  // Handle CORS issues for visualizers
  useEffect(() => {
    if (audioContext.corsIssueDetected && !hasShownCorsWarning) {
      setHasShownCorsWarning(true);
      // Disable visualizer automatically
      setActiveVisualizer('none');
      // Show a toast message to inform the user
      toast({
        title: "Visualizers Disabled",
        description: "Audio visualizers have been disabled due to cross-origin restrictions. Audio playback will continue normally.",
        duration: 5000,
      });
    }
  }, [audioContext.corsIssueDetected, hasShownCorsWarning, setActiveVisualizer]);
  
  // Show nothing if visualizer is disabled or CORS issue detected
  if (activeVisualizer === 'none' || !isVisible || audioContext.corsIssueDetected) {
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
