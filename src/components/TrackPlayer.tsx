
import { useState, useRef, useEffect, useCallback, memo } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackHeader from "./player/TrackHeader";
import PlaybackControls from "./player/PlaybackControls";
import TrackActions from "./player/TrackActions";
import { isInServerCooldown } from "@/services/trackShareService";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import { TrackVersion } from "@/types/track";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import AudioStatusIndicator from "./player/AudioStatusIndicator";
import WaveformSection from "./player/WaveformSection";
import PlaylistModeIndicator from "./player/PlaylistModeIndicator";

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
  // Local states
  const [serverCooldown, setServerCooldown] = useState(false);
  const [playedRecently, setPlayedRecently] = useState(false);
  
  // Access playlist context when in playlist mode with memo to prevent rerenders
  const { 
    playNextTrack: contextPlayNext, 
    playPreviousTrack: contextPlayPrevious, 
    togglePlayPause: contextTogglePlayPause,
    isPlaying: contextIsPlaying
  } = usePlaylistPlayer();
  
  // Memoize the playback URL to prevent re-renders
  const playbackUrl = useRef(opusUrl || mp3Url || audioUrl).current;
  
  // Memoize the waveform URL
  const waveformUrl = useRef(mp3Url || waveformAnalysisUrl).current;
  
  // Check server cooldown on load
  useEffect(() => {
    if (!shareKey) return;
    
    const checkServerCooldown = async () => {
      const inCooldown = await isInServerCooldown(shareKey);
      setServerCooldown(inCooldown);
    };
    
    checkServerCooldown();
  }, [shareKey]);
  
  // Use custom hook for audio playback
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
    togglePlayPause: localTogglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange,
  } = useAudioPlayer({ 
    mp3Url: playbackUrl,
    trackId,
    shareKey 
  });
  
  // Memoized toggle play function to prevent recreation on render
  const handleTogglePlayPause = useCallback(() => {
    if (isPlaylistMode) {
      contextTogglePlayPause();
    }
    localTogglePlayPause();
  }, [isPlaylistMode, contextTogglePlayPause, localTogglePlayPause]);

  // Sync with playlist context - optimized to minimize re-renders
  useEffect(() => {
    if (!isPlaylistMode || !audioRef.current) return;
    
    if (contextIsPlaying !== isPlaying) {
      if (contextIsPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Error playing from context sync:", err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [contextIsPlaying, isPlaying, isPlaylistMode]);
  
  // Handle track end for playlist autoplay - memoized to prevent re-renders
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaylistMode || !contextPlayNext) return;
    
    const handleTrackEnd = () => contextPlayNext();
    
    audio.addEventListener('ended', handleTrackEnd);
    return () => audio.removeEventListener('ended', handleTrackEnd);
  }, [contextPlayNext, isPlaylistMode]);
  
  // Update playedRecently when a track finishes playing
  useEffect(() => {
    if (playbackState !== 'paused' || currentTime <= 0 || currentTime < duration * 0.9) return;
    
    setPlayedRecently(true);
    
    if (!shareKey) return;
    
    const checkServerCooldown = async () => {
      const inCooldown = await isInServerCooldown(shareKey);
      setServerCooldown(inCooldown);
    };
    
    checkServerCooldown();
  }, [playbackState, currentTime, duration, shareKey]);
  
  // Check if we're using the original WAV file - memoized
  const originalFileType = originalUrl ? getFileTypeFromUrl(originalUrl) : null;
  const isPlayingWav = isWavFormat(originalFileType) && playbackUrl === originalUrl;
  
  // Check if we're using the MP3/Opus version - memoized
  const usingMp3 = !!mp3Url;
  const usingOpus = !!opusUrl;
  
  // Determine combined cooldown state
  const isCooldown = inCooldownPeriod || serverCooldown;
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      {/* Main audio element */}
      <audio 
        ref={audioRef} 
        src={playbackUrl}
        preload="auto"
      />
      
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
        isPlaying={isPlaylistMode ? contextIsPlaying : isPlaying}
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
        isPlaying={isPlaylistMode ? contextIsPlaying : isPlaying}
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
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(TrackPlayer);
