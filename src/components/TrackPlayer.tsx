
import { useState, useRef, useEffect } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackHeader from "./player/TrackHeader";
import PlaybackControls from "./player/PlaybackControls";
import { isInServerCooldown } from "@/services/trackShareService";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import { TrackVersion } from "@/types/track";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import AudioStatusIndicator from "./player/AudioStatusIndicator";
import WaveformSection from "./player/WaveformSection";
import PlaylistModeIndicator from "./player/PlaylistModeIndicator";
import AudioElement from "./player/AudioElement";
import TrackPlayerProvider from "./player/TrackPlayerProvider";

interface TrackPlayerProps {
  trackId: string;
  trackName: string;
  audioUrl?: string;
  originalUrl?: string;
  waveformAnalysisUrl?: string;
  waveformPeaksUrl?: string;
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
  showFFTVisualizer?: boolean;
}

const TrackPlayer = ({ 
  trackId, 
  trackName, 
  audioUrl, 
  originalUrl,
  waveformAnalysisUrl,
  waveformPeaksUrl,
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
  isLoading = false,
  showFFTVisualizer = true
}: TrackPlayerProps) => {
  // Local states
  const [serverCooldown, setServerCooldown] = useState(false);
  const [playedRecently, setPlayedRecently] = useState(false);
  
  // Access playlist context when in playlist mode
  const { 
    playNextTrack: contextPlayNext, 
    playPreviousTrack: contextPlayPrevious, 
    togglePlayPause: contextTogglePlayPause,
    isPlaying: contextIsPlaying
  } = isPlaylistMode ? usePlaylistPlayer() : { 
    playNextTrack: () => {}, 
    playPreviousTrack: () => {},
    togglePlayPause: () => {},
    isPlaying: false
  };
  
  // Determine which URL to use for playback
  const playbackUrl = opusUrl || mp3Url || audioUrl;

  // Determine which URL to use for waveform analysis
  const waveformUrl = mp3Url || waveformAnalysisUrl;
  
  // Check server cooldown on load
  useEffect(() => {
    const checkServerCooldown = async () => {
      if (shareKey) {
        const inCooldown = await isInServerCooldown(shareKey);
        setServerCooldown(inCooldown);
      }
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
  
  // Sync with playlist context when in playlist mode
  useEffect(() => {
    if (!isPlaylistMode || !audioRef.current) return;
    
    if (contextIsPlaying && !isPlaying) {
      audioRef.current.play().catch(err => {
        console.error("Error playing from context sync:", err);
      });
    } else if (!contextIsPlaying && isPlaying) {
      audioRef.current.pause();
    }
  }, [contextIsPlaying, isPlaying, isPlaylistMode]);
  
  // Handle track end for playlist autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaylistMode) return;
    
    const handleTrackEnd = () => {
      contextPlayNext();
    };
    
    audio.addEventListener('ended', handleTrackEnd);
    
    return () => {
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [contextPlayNext, isPlaylistMode]);
  
  // Combined toggle play function
  const handleTogglePlayPause = () => {
    if (isPlaylistMode) {
      contextTogglePlayPause();
      localTogglePlayPause();
    } else {
      localTogglePlayPause();
    }
  };
  
  // Update playedRecently when a track finishes playing
  useEffect(() => {
    if (playbackState === 'paused' && currentTime > 0 && currentTime >= duration * 0.9) {
      setPlayedRecently(true);
      
      if (shareKey) {
        const checkServerCooldown = async () => {
          const inCooldown = await isInServerCooldown(shareKey);
          setServerCooldown(inCooldown);
        };
        
        checkServerCooldown();
      }
    }
  }, [playbackState, currentTime, duration, shareKey]);
  
  // Check if we're using the original WAV file
  const originalFileType = getFileTypeFromUrl(originalUrl);
  const isPlayingWav = isWavFormat(originalFileType) && playbackUrl === originalUrl;
  
  // Check if we're using the MP3 version
  const usingMp3 = !!mp3Url;
  
  // Check if we're using the Opus version
  const usingOpus = !!opusUrl;
  
  // Determine combined cooldown state
  const isCooldown = inCooldownPeriod || serverCooldown;
  
  // Player context value for potential future use
  const playerContextValue = {
    isPlaying: isPlaylistMode ? contextIsPlaying : isPlaying,
    currentTime,
    duration,
    handleTogglePlayPause
  };
  
  return (
    <TrackPlayerProvider value={playerContextValue}>
      <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
        <AudioElement audioRef={audioRef} playbackUrl={playbackUrl} />
        
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
          waveformPeaksUrl={waveformPeaksUrl}
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
          audioRef={audioRef}
          showFFTVisualizer={showFFTVisualizer}
          isOwner={isOwner}
          originalUrl={originalUrl}
          originalFilename={originalFilename}
          trackId={trackId}
          downloadsEnabled={downloadsEnabled}
          shareKey={shareKey}
          trackVersions={trackVersions}
          trackTitle={trackName}
          isPlaylistMode={isPlaylistMode}
        />
      </div>
    </TrackPlayerProvider>
  );
};

export default TrackPlayer;
