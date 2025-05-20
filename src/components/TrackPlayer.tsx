
import { memo } from "react";
import { TrackVersion } from "@/types/track";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import TrackPlayerContainer from "./player/TrackPlayerContainer";
import { useTrackPlayer } from "@/hooks/useTrackPlayer";

interface TrackPlayerProps {
  trackId: string;
  trackName: string;
  audioUrl?: string;
  originalUrl?: string;
  waveformAnalysisUrl?: string;
  originalFilename?: string;
  isOwner?: boolean;
  processingStatus?: string;
  mp3Url?: string;
  opusUrl?: string;
  opusProcessingStatus?: string;
  shareKey?: string;
  inCooldownPeriod?: boolean;
  downloadsEnabled?: boolean;
  versionNumber?: number;
  trackVersions?: TrackVersion[];
  isPlaylistMode?: boolean;
  currentIndex?: number;
  totalTracks?: number;
  isLoading?: boolean;
}

const TrackPlayer = ({ 
  trackId, 
  trackName, 
  audioUrl, 
  originalUrl,
  waveformAnalysisUrl,
  originalFilename,
  isOwner = false,
  processingStatus = 'completed',
  mp3Url,
  opusUrl,
  opusProcessingStatus = 'pending',
  shareKey,
  inCooldownPeriod = false,
  downloadsEnabled = false,
  versionNumber = 1,
  trackVersions = [],
  isPlaylistMode = false,
  currentIndex = -1,
  totalTracks = 0,
  isLoading = false
}: TrackPlayerProps) => {
  // Determine the playback and waveform URLs
  const playbackUrl = opusUrl || mp3Url || audioUrl || '';
  const waveformUrl = mp3Url || waveformAnalysisUrl || '';
  
  // Check if we're using the MP3/Opus version
  const usingMp3 = !!mp3Url;
  const usingOpus = !!opusUrl;
  
  // Use our custom hook for player functionality
  const {
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
    contextPlayPrevious
  } = useTrackPlayer({
    trackId,
    shareKey,
    isPlaylistMode,
    playbackUrl,
    originalUrl,
    processingStatus
  });
  
  return (
    <TrackPlayerContainer
      trackId={trackId}
      trackName={trackName}
      audioRef={audioRef}
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      volume={volume}
      isMuted={isMuted}
      playbackState={playbackState}
      isGeneratingWaveform={isGeneratingWaveform}
      audioLoaded={audioLoaded}
      showBufferingUI={showBufferingUI}
      isBuffering={isBuffering}
      handleTogglePlayPause={handleTogglePlayPause}
      handleSeek={handleSeek}
      toggleMute={toggleMute}
      handleVolumeChange={handleVolumeChange}
      isPlayingWav={isPlayingWav}
      contextPlayNext={contextPlayNext}
      contextPlayPrevious={contextPlayPrevious}
      playbackUrl={playbackUrl}
      waveformUrl={waveformUrl}
      usingMp3={usingMp3}
      usingOpus={usingOpus}
      processingStatus={processingStatus}
      isOwner={isOwner}
      isPlaylistMode={isPlaylistMode}
      currentIndex={currentIndex}
      totalTracks={totalTracks}
      isLoading={isLoading}
      shareKey={shareKey}
      originalUrl={originalUrl}
      originalFilename={originalFilename}
      downloadsEnabled={downloadsEnabled}
      trackVersions={trackVersions}
      versionNumber={versionNumber}
    />
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(TrackPlayer);
