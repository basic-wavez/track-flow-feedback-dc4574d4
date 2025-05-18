
import { useState, useEffect } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { isInServerCooldown } from "@/services/trackShareService";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import { TrackVersion } from "@/types/track";
import TrackPlayer from "./TrackPlayer";

interface TrackPlayerContainerProps {
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
}

/**
 * Container component that manages state and logic for the audio player
 */
const TrackPlayerContainer = ({ 
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
  trackVersions = []
}: TrackPlayerContainerProps) => {
  // Local states
  const [serverCooldown, setServerCooldown] = useState(false);
  const [playedRecently, setPlayedRecently] = useState(false);
  
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
    togglePlayPause,
    handleSeek,
    toggleMute,
    handleVolumeChange,
  } = useAudioPlayer({ 
    mp3Url: playbackUrl,
    trackId,
    shareKey,
    allowBackgroundPlayback: true // Enable background playback
  });
  
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
  
  // Log which URLs we're using to help with debugging
  useEffect(() => {
    console.log('TrackPlayer URLs:', {
      playbackUrl,
      waveformUrl,
      originalUrl,
      mp3Url,
      opusUrl,
      isPlayingWav
    });
  }, [playbackUrl, waveformUrl, originalUrl, mp3Url, opusUrl, isPlayingWav]);

  return (
    <TrackPlayer
      audioRef={audioRef}
      trackId={trackId}
      trackName={trackName}
      playbackUrl={playbackUrl}
      waveformUrl={waveformUrl}
      originalUrl={originalUrl}
      originalFilename={originalFilename}
      isOwner={isOwner}
      processingStatus={processingStatus}
      isPlayingWav={isPlayingWav}
      usingMp3={usingMp3}
      usingOpus={usingOpus}
      isPlaying={isPlaying}
      currentTime={currentTime}
      duration={duration}
      volume={volume}
      isMuted={isMuted}
      playbackState={playbackState}
      isLoading={isLoading}
      isGeneratingWaveform={isGeneratingWaveform}
      audioLoaded={audioLoaded}
      showBufferingUI={showBufferingUI}
      isBuffering={isBuffering}
      togglePlayPause={togglePlayPause}
      handleSeek={handleSeek}
      toggleMute={toggleMute}
      handleVolumeChange={handleVolumeChange}
      downloadsEnabled={downloadsEnabled}
      shareKey={shareKey}
      versionNumber={versionNumber}
      trackVersions={trackVersions}
    />
  );
};

export default TrackPlayerContainer;
