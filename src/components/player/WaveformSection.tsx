
import React from 'react';
import Waveform from "../Waveform";

interface WaveformSectionProps {
  playbackUrl: string | undefined;
  waveformUrl: string | undefined;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  handleSeek: (time: number) => void;
  isBuffering: boolean;
  showBufferingUI: boolean;
  usingMp3: boolean;
  usingOpus: boolean;
  isGeneratingWaveform: boolean;
  audioLoaded: boolean;
}

const WaveformSection: React.FC<WaveformSectionProps> = ({
  playbackUrl,
  waveformUrl,
  isPlaying,
  currentTime,
  duration,
  handleSeek,
  isBuffering,
  showBufferingUI,
  usingMp3,
  usingOpus,
  isGeneratingWaveform,
  audioLoaded
}) => {
  return (
    <Waveform 
      audioUrl={playbackUrl}
      waveformAnalysisUrl={waveformUrl}
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      onSeek={handleSeek}
      totalChunks={1}
      isBuffering={isBuffering}
      showBufferingUI={showBufferingUI}
      isMp3Available={usingMp3}
      isOpusAvailable={usingOpus}
      isGeneratingWaveform={isGeneratingWaveform}
      audioLoaded={audioLoaded}
    />
  );
};

export default WaveformSection;
