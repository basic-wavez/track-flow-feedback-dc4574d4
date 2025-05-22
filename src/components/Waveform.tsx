
import React from 'react';
import WaveformContainer from './waveform/WaveformContainer';

interface WaveformProps {
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

const Waveform = (props: WaveformProps) => {
  return <WaveformContainer {...props} />;
};

export default Waveform;
