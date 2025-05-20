
import { TrackVersion } from "@/types/track";
import TrackHeader from "./TrackHeader";
import PlaybackControls from "./PlaybackControls";
import TrackActions from "./TrackActions";
import AudioStatusIndicator from "./AudioStatusIndicator";
import PlaylistModeIndicator from "./PlaylistModeIndicator";
import WaveformSection from "./WaveformSection";

interface TrackDetailsSectionProps {
  trackId: string;
  trackName: string;
  playbackState: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlayingWav: boolean;
  processingStatus: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  isLoading: boolean;
  usingMp3: boolean;
  usingOpus: boolean;
  playbackUrl: string;
  waveformUrl: string;
  isBuffering: boolean;
  showBufferingUI: boolean;
  isGeneratingWaveform: boolean;
  audioLoaded: boolean;
  handleTogglePlayPause: () => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  isPlaylistMode: boolean;
  contextPlayNext?: () => void;
  contextPlayPrevious?: () => void;
  currentIndex?: number;
  totalTracks?: number;
  isOwner?: boolean;
  downloadsEnabled?: boolean;
  originalUrl?: string;
  originalFilename?: string;
  shareKey?: string;
  trackVersions?: TrackVersion[];
  versionNumber: number;
}

const TrackDetailsSection = ({
  trackId,
  trackName,
  playbackState,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isPlayingWav,
  processingStatus,
  audioRef,
  isLoading,
  usingMp3,
  usingOpus,
  playbackUrl,
  waveformUrl,
  isBuffering,
  showBufferingUI,
  isGeneratingWaveform,
  audioLoaded,
  handleTogglePlayPause,
  handleSeek,
  handleVolumeChange,
  toggleMute,
  isPlaylistMode,
  contextPlayNext,
  contextPlayPrevious,
  currentIndex = -1,
  totalTracks = 0,
  isOwner = false,
  downloadsEnabled = false,
  originalUrl,
  originalFilename,
  shareKey,
  trackVersions = [],
  versionNumber
}: TrackDetailsSectionProps) => {
  return (
    <>
      <TrackHeader 
        trackId={trackId}
        trackName={trackName}
        playbackState={playbackState}
        isLoading={isLoading || playbackState === 'loading'}
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
        isLoading={isLoading || playbackState === 'loading'}
        onPlayPause={handleTogglePlayPause}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
        isPlaylistMode={isPlaylistMode}
        onPrevious={isPlaylistMode ? contextPlayPrevious : undefined}
        onNext={isPlaylistMode ? contextPlayNext : undefined}
      />
      
      <PlaylistModeIndicator 
        isPlaylistMode={isPlaylistMode}
        currentIndex={currentIndex}
        totalTracks={totalTracks}
      />
      
      <AudioStatusIndicator 
        isPlayingWav={isPlayingWav}
        processingStatus={processingStatus}
      />
      
      <WaveformSection 
        playbackUrl={playbackUrl}
        waveformUrl={waveformUrl}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        handleSeek={handleSeek}
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        usingMp3={usingMp3}
        usingOpus={usingOpus}
        isGeneratingWaveform={isGeneratingWaveform}
        audioLoaded={audioLoaded}
      />

      {!isPlaylistMode && (
        <TrackActions 
          isOwner={isOwner}
          originalUrl={originalUrl}
          originalFilename={originalFilename}
          trackId={trackId}
          downloadsEnabled={downloadsEnabled}
          shareKey={shareKey}
          trackVersions={trackVersions}
          trackTitle={trackName}
        />
      )}
    </>
  );
};

export default TrackDetailsSection;
