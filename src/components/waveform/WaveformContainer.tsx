
import React from 'react';
import WaveformLoader from './WaveformLoader';
import WaveformCanvas from './WaveformCanvas';
import WaveformStatus from './WaveformStatus';
import { useWaveformData } from './hooks/useWaveformData';

interface WaveformContainerProps {
  audioUrl?: string;
  peaksDataUrl?: string;
  waveformData?: number[] | Float32Array; // Allow direct passing of waveform data
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  totalChunks?: number;
  isBuffering?: boolean;
  showBufferingUI?: boolean;
  isMp3Available?: boolean;
  isOpusAvailable?: boolean;
  isGeneratingWaveform?: boolean;
  audioLoaded?: boolean;
}

const WaveformContainer: React.FC<WaveformContainerProps> = ({
  audioUrl,
  peaksDataUrl,
  waveformData: externalWaveformData, // Renamed to avoid conflict
  isPlaying,
  currentTime,
  duration,
  onSeek,
  totalChunks = 1,
  isBuffering = false,
  showBufferingUI = false,
  isMp3Available = false,
  isOpusAvailable = false,
  isGeneratingWaveform = false,
  audioLoaded = false
}) => {
  // Only use the hook if we don't have data passed directly
  const {
    waveformData: internalWaveformData,
    isAnalyzing,
    isPeaksLoading,
    analysisError,
    usingPrecomputedPeaks,
    isWaveformGenerated
  } = useWaveformData({
    peaksDataUrl, // Remove waveformAnalysisUrl, just use peaksDataUrl
    isGeneratingWaveform
  });
  
  // Use externally provided data if available, otherwise use internal data
  const waveformData = externalWaveformData || internalWaveformData;
  
  // Show loading states
  if ((isAnalyzing || isPeaksLoading) && !externalWaveformData) {
    return <WaveformLoader isAnalyzing={isAnalyzing} isGeneratingWaveform={isPeaksLoading} />;
  }
  
  if (isGeneratingWaveform && !externalWaveformData) {
    return <WaveformLoader isGeneratingWaveform={true} />;
  }
  
  const isAudioDurationValid = isFinite(duration) && duration > 0;
  
  return (
    <div className="w-full h-32 relative">
      <WaveformCanvas 
        waveformData={waveformData}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        isMp3Available={isMp3Available || isOpusAvailable}
        onSeek={onSeek}
      />
      
      <WaveformStatus 
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={isMp3Available}
        analysisError={analysisError}
        isAudioLoading={!isAudioDurationValid && !analysisError}
        currentTime={currentTime}
        usingPrecomputedPeaks={usingPrecomputedPeaks || !!externalWaveformData}
      />
    </div>
  );
};

export default WaveformContainer;
