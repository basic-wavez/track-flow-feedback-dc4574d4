import { memo } from "react";
import { TrackVersion } from "@/types/track";
import TrackHeader from "./player/TrackHeader";
import PlaybackControls from "./player/PlaybackControls";
import TrackActions from "./player/TrackActions";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import AudioStatusIndicator from "./player/AudioStatusIndicator";
import WaveformSection from "./player/WaveformSection";
import PlaylistModeIndicator from "./player/PlaylistModeIndicator";
import AudioVisualizer from "./visualizers/AudioVisualizer";
import AudioElement from "./player/AudioElement";
import PlayerStateManager from "./player/PlayerStateManager";
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
          const isCooldown = inCooldownPeriod || serverCooldown;
          
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
              
              {/* Audio Visualizer */}
              <AudioVisualizer 
                audioRef={audioRef}
                isPlaying={isPlaying}
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
        }}
      </PlayerStateManager>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(TrackPlayer);
