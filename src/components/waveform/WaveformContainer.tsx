
import React from 'react';
import WaveformLoader from './WaveformLoader';
import WaveformCanvas from './WaveformCanvas';
import WaveformStatus from './WaveformStatus';
import { useWaveformData } from './hooks/useWaveformData';

interface WaveformContainerProps {
  audioUrl?: string;
  waveformAnalysisUrl?: string;
  peaksDataUrl?: string;
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
  waveformAnalysisUrl,
  peaksDataUrl,
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
  const {
    waveformData,
    isAnalyzing,
    isPeaksLoading,
    analysisError,
    usingPrecomputedPeaks,
    isWaveformGenerated
  } = useWaveformData({
    waveformAnalysisUrl,
    peaksDataUrl,
    isGeneratingWaveform
  });
  
  // Show loading states
  if (isAnalyzing || isPeaksLoading) {
    return <WaveformLoader isAnalyzing={isAnalyzing} isGeneratingWaveform={isPeaksLoading} />;
  }
  
  if (isGeneratingWaveform) {
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
        usingPrecomputedPeaks={usingPrecomputedPeaks}
      />
    </div>
  );
};

export default WaveformContainer;
