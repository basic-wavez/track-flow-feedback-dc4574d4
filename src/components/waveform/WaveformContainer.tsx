
import React, { useState, useEffect } from 'react';
import WaveformLoader from './WaveformLoader';
import WaveformCanvas from './WaveformCanvas';
import WaveformStatus from './WaveformStatus';
import { useWaveformData } from './hooks/useWaveformData';

interface WaveformContainerProps {
  audioUrl?: string;
  peaksDataUrl?: string;
  trackId?: string;
  waveformData?: number[] | Float32Array;
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
  onDatabaseLoadingComplete?: (success: boolean) => void;
}

const WaveformContainer: React.FC<WaveformContainerProps> = ({
  audioUrl,
  peaksDataUrl,
  trackId,
  waveformData: externalWaveformData,
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
  audioLoaded = false,
  onDatabaseLoadingComplete
}) => {
  // Debug logging for component lifecycle
  useEffect(() => {
    console.log(`WaveformContainer mounted for trackId: ${trackId}`);
    return () => {
      console.log(`WaveformContainer unmounted for trackId: ${trackId}`);
    };
  }, [trackId]);

  // Only use the hook if we don't have data passed directly
  const {
    waveformData: internalWaveformData,
    isAnalyzing,
    isPeaksLoading,
    analysisError,
    usingPrecomputedPeaks,
    isWaveformGenerated,
    databaseLoadingAttempted
  } = useWaveformData({
    peaksDataUrl,
    isGeneratingWaveform,
    trackId,
    onDatabaseLoadingComplete
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
        databaseLoadingAttempted={databaseLoadingAttempted}
      />
    </div>
  );
};

export default WaveformContainer;
