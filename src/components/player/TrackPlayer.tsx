
import { RefObject } from "react";
import Waveform from "../Waveform";
import TrackHeader from "./TrackHeader";
import PlaybackControls from "./PlaybackControls";
import TrackActions from "./TrackActions";
import WavFormatNotice from "./WavFormatNotice";
import { TrackVersion } from "@/types/track";

interface TrackPlayerProps {
  audioRef: RefObject<HTMLAudioElement>;
  trackId: string;
  trackName: string;
  playbackUrl?: string;
  waveformUrl?: string;
  originalUrl?: string;
  originalFilename?: string;
  isOwner: boolean;
  processingStatus: string;
  isPlayingWav: boolean;
  usingMp3: boolean;
  usingOpus: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackState: string;
  isLoading: boolean;
  isGeneratingWaveform: boolean;
  audioLoaded: boolean;
  showBufferingUI: boolean;
  isBuffering: boolean;
  togglePlayPause: () => void;
  handleSeek: (time: number) => void;
  toggleMute: () => void;
  handleVolumeChange: (volume: number) => void;
  downloadsEnabled: boolean;
  shareKey?: string;
  versionNumber: number;
  trackVersions: TrackVersion[];
}

/**
 * Presentation component for the audio player
 */
const TrackPlayer = ({
  audioRef,
  trackId,
  trackName,
  playbackUrl,
  waveformUrl,
  originalUrl,
  originalFilename,
  isOwner,
  processingStatus,
  isPlayingWav,
  usingMp3,
  usingOpus,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackState,
  isLoading,
  isGeneratingWaveform,
  audioLoaded,
  showBufferingUI,
  isBuffering,
  togglePlayPause,
  handleSeek,
  toggleMute,
  handleVolumeChange,
  downloadsEnabled,
  shareKey,
  versionNumber,
  trackVersions
}: TrackPlayerProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      {/* Main audio element */}
      <audio 
        ref={audioRef} 
        src={playbackUrl}
        preload="auto"
        onError={(e) => console.error("Audio error event:", e)}
      />
      
      <TrackHeader 
        trackId={trackId}
        trackName={trackName}
        playbackState={playbackState}
        isLoading={isLoading}
        usingMp3={usingMp3}
        processingStatus={processingStatus}
        showProcessButton={false}
        isRequestingProcessing={false}
        onRequestProcessing={async () => {}}
        isOwner={isOwner}
        versionNumber={versionNumber}
      />
      
      <PlaybackControls 
        isPlaying={isPlaying}
        playbackState={playbackState}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isLoading={isLoading}
        onPlayPause={togglePlayPause}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
      />
      
      <WavFormatNotice 
        isPlayingWav={isPlayingWav} 
        processingStatus={processingStatus} 
      />
      
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
        audioQuality={''}  // Removed format indicator by passing empty string
      />
      
      <TrackActions 
        isOwner={isOwner}
        originalUrl={originalUrl}
        originalFilename={originalFilename}
        trackId={trackId}
        downloadsEnabled={downloadsEnabled}
        shareKey={shareKey}
        versionNumber={versionNumber}
        trackVersions={trackVersions}
      />
    </div>
  );
};

export default TrackPlayer;
