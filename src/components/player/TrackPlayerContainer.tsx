
import { memo } from "react";
import { TrackVersion } from "@/types/track";
import AudioElement from "./AudioElement";
import PlayerStateManager from "./PlayerStateManager";
import TrackDetailsSection from "./TrackDetailsSection";
import TrackVisualizerSection from "./TrackVisualizerSection";

interface TrackPlayerContainerProps {
  trackId: string;
  trackName: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackState: string;
  isGeneratingWaveform: boolean;
  audioLoaded: boolean;
  showBufferingUI: boolean;
  isBuffering: boolean;
  handleTogglePlayPause: () => void;
  handleSeek: (time: number) => void;
  toggleMute: () => void;
  handleVolumeChange: (volume: number) => void;
  isPlayingWav: boolean;
  contextPlayNext?: () => void;
  contextPlayPrevious?: () => void;
  playbackUrl: string;
  waveformUrl: string;
  usingMp3: boolean;
  usingOpus: boolean;
  processingStatus: string;
  isOwner?: boolean;
  isPlaylistMode?: boolean;
  currentIndex?: number;
  totalTracks?: number;
  isLoading?: boolean;
  shareKey?: string;
  originalUrl?: string;
  originalFilename?: string;
  downloadsEnabled?: boolean;
  trackVersions?: TrackVersion[];
  versionNumber?: number;
}

const TrackPlayerContainer = ({ 
  trackId, 
  trackName,
  audioRef,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackState,
  isGeneratingWaveform,
  audioLoaded,
  showBufferingUI,
  isBuffering,
  handleTogglePlayPause,
  handleSeek,
  toggleMute,
  handleVolumeChange,
  isPlayingWav,
  contextPlayNext,
  contextPlayPrevious,
  playbackUrl,
  waveformUrl,
  usingMp3,
  usingOpus,
  processingStatus,
  isOwner = false,
  isPlaylistMode = false,
  currentIndex = -1,
  totalTracks = 0,
  isLoading = false,
  shareKey,
  originalUrl,
  originalFilename,
  downloadsEnabled = false,
  trackVersions = [],
  versionNumber = 1
}: TrackPlayerContainerProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      <AudioElement
        audioRef={audioRef}
        isPlaying={isPlaying}
        isPlaylistMode={isPlaylistMode}
      />
      
      <PlayerStateManager
        audioRef={audioRef}
        shareKey={shareKey}
        playbackState={playbackState}
        currentTime={currentTime}
        duration={duration}
      >
        {({ serverCooldown, playedRecently }) => {
          // Determine combined cooldown state
          const isCooldown = false || serverCooldown;
          
          return (
            <>
              <TrackDetailsSection 
                trackId={trackId}
                trackName={trackName}
                playbackState={playbackState}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                isPlayingWav={isPlayingWav}
                processingStatus={processingStatus}
                audioRef={audioRef}
                isLoading={isLoading}
                usingMp3={usingMp3}
                usingOpus={usingOpus}
                playbackUrl={playbackUrl}
                waveformUrl={waveformUrl}
                isBuffering={isBuffering}
                showBufferingUI={showBufferingUI}
                isGeneratingWaveform={isGeneratingWaveform}
                audioLoaded={audioLoaded}
                handleTogglePlayPause={handleTogglePlayPause}
                handleSeek={handleSeek}
                handleVolumeChange={handleVolumeChange}
                toggleMute={toggleMute}
                isPlaylistMode={isPlaylistMode}
                contextPlayNext={contextPlayNext}
                contextPlayPrevious={contextPlayPrevious}
                currentIndex={currentIndex}
                totalTracks={totalTracks}
                isOwner={isOwner}
                downloadsEnabled={downloadsEnabled}
                originalUrl={originalUrl}
                originalFilename={originalFilename}
                shareKey={shareKey}
                trackVersions={trackVersions}
                versionNumber={versionNumber}
              />
              
              <TrackVisualizerSection 
                audioRef={audioRef}
                isPlaying={isPlaying}
              />
            </>
          );
        }}
      </PlayerStateManager>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(TrackPlayerContainer);
