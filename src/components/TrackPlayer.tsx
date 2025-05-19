
import { useState, useRef, useEffect } from "react";
import Waveform from "./Waveform";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackHeader from "./player/TrackHeader";
import PlaybackControls from "./player/PlaybackControls";
import TrackActions from "./player/TrackActions";
import { isInServerCooldown } from "@/services/trackShareService";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import { TrackVersion } from "@/types/track";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";

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
  totalTracks = 0
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
  
  // Determine which URL to use for playback - prefer Opus if available, then MP3, then audioUrl
  const playbackUrl = opusUrl || mp3Url || audioUrl;

  // Determine which URL to use for waveform analysis - ALWAYS prefer MP3 if available
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
    if (isPlaylistMode && audioRef.current) {
      if (contextIsPlaying && !isPlaying) {
        audioRef.current.play().catch(console.error);
      } else if (!contextIsPlaying && isPlaying) {
        audioRef.current.pause();
      }
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
    }
    localTogglePlayPause();
  };
  
  // Update playedRecently when a track finishes playing
  useEffect(() => {
    if (playbackState === 'paused' && currentTime > 0 && currentTime >= duration * 0.9) {
      setPlayedRecently(true);
      
      // Check if we're now in server cooldown
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
  
  const isLoading = playbackState === 'loading';
  
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
        onPlayPause={handleTogglePlayPause}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
        isPlaylistMode={isPlaylistMode}
        onPrevious={isPlaylistMode ? contextPlayPrevious : undefined}
        onNext={isPlaylistMode ? contextPlayNext : undefined}
      />
      
      {isPlaylistMode && currentIndex >= 0 && totalTracks > 0 && (
        <div className="text-sm text-gray-400 mb-3">
          Track {currentIndex + 1} of {totalTracks}
        </div>
      )}
      
      {isPlayingWav && processingStatus === 'pending' ? (
        <div className="text-blue-400 text-sm mb-2 bg-blue-900/20 p-2 rounded">
          Playing WAV file directly. MP3 version is being processed in the background for better streaming quality.
        </div>
      ) : null}
      
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

export default TrackPlayer;
