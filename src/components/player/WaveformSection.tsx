
import React from 'react';
import Waveform from "../Waveform";
import MultiVisualizer from '../visualizer/MultiVisualizer';
import TrackActions from './TrackActions';

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
  audioRef: React.RefObject<HTMLAudioElement>;
  showFFTVisualizer?: boolean;
  // New props for track actions
  isOwner: boolean;
  originalUrl?: string;
  originalFilename?: string;
  trackId: string;
  downloadsEnabled?: boolean;
  shareKey?: string;
  trackVersions?: any[];
  trackTitle?: string;
  isPlaylistMode?: boolean;
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
  audioLoaded,
  audioRef,
  showFFTVisualizer = true,
  // Track action props
  isOwner = false,
  originalUrl,
  originalFilename,
  trackId,
  downloadsEnabled = false,
  shareKey,
  trackVersions = [],
  trackTitle = "",
  isPlaylistMode = false
}) => {
  return (
    <div className="flex flex-col space-y-4">
      {/* Waveform comes first */}
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
      
      {/* Track Actions (Download/Share buttons) */}
      {!isPlaylistMode && (
        <div className="mb-4">
          <TrackActions 
            isOwner={isOwner}
            originalUrl={originalUrl}
            originalFilename={originalFilename}
            trackId={trackId}
            downloadsEnabled={downloadsEnabled}
            shareKey={shareKey}
            trackVersions={trackVersions}
            trackTitle={trackTitle}
          />
        </div>
      )}
      
      {/* Visualizers moved below waveform and action buttons with more height */}
      {showFFTVisualizer && (
        <div className="h-[360px] mt-6">
          <MultiVisualizer 
            audioRef={audioRef}
            isPlaying={isPlaying}
            className="h-full w-full"
          />
        </div>
      )}
    </div>
  );
};

export default WaveformSection;
