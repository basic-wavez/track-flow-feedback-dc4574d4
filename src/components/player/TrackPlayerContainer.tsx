
import { useState, useEffect } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { isInServerCooldown } from "@/services/trackShareService";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import { TrackVersion } from "@/types/track";
import TrackPlayer from "./TrackPlayer";
import { toast } from "@/components/ui/use-toast";

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
  const [validatedPlaybackUrl, setValidatedPlaybackUrl] = useState<string | undefined>(undefined);
  
  // Determine which URL to use for playback - prefer Opus if available, then MP3, then audioUrl
  const playbackUrl = opusUrl || mp3Url || audioUrl;

  // Determine which URL to use for waveform analysis - ALWAYS prefer MP3 if available
  const waveformUrl = mp3Url || waveformAnalysisUrl;
  
  // Validate playback URL before using it
  useEffect(() => {
    if (playbackUrl) {
      console.log(`Validating playback URL: ${playbackUrl}`);
      
      // Simple check if URL is accessible
      const checkUrl = async () => {
        try {
          const response = await fetch(playbackUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`Playback URL validated: ${playbackUrl}`);
            setValidatedPlaybackUrl(playbackUrl);
          } else {
            console.error(`Playback URL validation failed: ${playbackUrl}, status: ${response.status}`);
            // Fall back to next available URL
            if (playbackUrl === opusUrl && mp3Url) {
              setValidatedPlaybackUrl(mp3Url);
            } else if ((playbackUrl === opusUrl || playbackUrl === mp3Url) && audioUrl) {
              setValidatedPlaybackUrl(audioUrl);
            } else {
              toast({
                title: "Playback Issue",
                description: "Could not validate audio URL",
                variant: "destructive",
              });
            }
          }
        } catch (err) {
          console.error(`Error validating playback URL:`, err);
          // Use the URL anyway as our validation might be blocked by CORS
          setValidatedPlaybackUrl(playbackUrl);
        }
      };
      
      checkUrl();
    } else {
      setValidatedPlaybackUrl(undefined);
    }
  }, [playbackUrl, mp3Url, opusUrl, audioUrl]);
  
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
  
  // Log when playback URL changes to help debugging
  useEffect(() => {
    console.log(`TrackPlayerContainer: validated playbackUrl set to ${validatedPlaybackUrl}`);
    if (!validatedPlaybackUrl && playbackUrl) {
      console.log(`Waiting for URL validation for ${playbackUrl}...`);
    }
    
    if (!playbackUrl) {
      toast({
        title: "Playback Issue",
        description: "No audio URL available for playback",
        variant: "destructive",
      });
    }
  }, [validatedPlaybackUrl, playbackUrl]);

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
    mp3Url: validatedPlaybackUrl,
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
  const isPlayingWav = isWavFormat(originalFileType) && validatedPlaybackUrl === originalUrl;
  
  // Check if we're using the MP3 version
  const usingMp3 = validatedPlaybackUrl === mp3Url && !!mp3Url;
  
  // Check if we're using the Opus version
  const usingOpus = validatedPlaybackUrl === opusUrl && !!opusUrl;
  
  const isLoading = playbackState === 'loading';
  
  // Determine combined cooldown state
  const isCooldown = inCooldownPeriod || serverCooldown;
  
  return (
    <TrackPlayer
      audioRef={audioRef}
      trackId={trackId}
      trackName={trackName}
      playbackUrl={validatedPlaybackUrl}
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
