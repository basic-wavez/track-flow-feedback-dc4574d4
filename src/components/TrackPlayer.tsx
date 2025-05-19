
import { useState, useEffect } from "react";
import { useAudioPlayer } from "@/providers/GlobalAudioProvider";
import { useMediaSession } from "@/hooks/useMediaSession";
import { useHotkeys } from "@/hooks/useHotkeys";
import Waveform from "./Waveform";
import TrackHeader from "./player/TrackHeader";
import PlayerControls from "./PlayerControls";
import TrackActions from "./player/TrackActions";
import { isInServerCooldown } from "@/services/trackShareService";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import { TrackVersion } from "@/types/track";

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
  trackVersions = []
}: TrackPlayerProps) => {
  // Local states
  const [serverCooldown, setServerCooldown] = useState(false);
  const [playedRecently, setPlayedRecently] = useState(false);

  // Get Global Audio Player
  const { 
    play, 
    pause, 
    seek, 
    currentTime, 
    duration, 
    isPlaying, 
    volume, 
    isMuted,
    toggleMute, 
    setVolume, 
    playbackState,
    currentUrl,
    isBuffering,
    isAudioLoaded
  } = useAudioPlayer();
  
  // Determine which URL to use for playback - prefer Opus if available, then MP3, then audioUrl
  const playbackUrl = opusUrl || mp3Url || audioUrl;
  
  // Determine which URL to use for waveform analysis - ALWAYS prefer MP3 if available
  const waveformUrl = mp3Url || waveformAnalysisUrl;
  
  // Setup Media Session API integration
  useMediaSession({
    title: trackName,
    artist: `Track ID: ${trackId}`,
    artwork: [
      {
        src: '/placeholder.svg',
        sizes: '512x512',
        type: 'image/svg+xml'
      }
    ],
    isPlaying,
    duration,
    currentTime,
    onPlay: () => {
      if (playbackUrl) {
        play(playbackUrl, trackId, shareKey);
      }
    },
    onPause: pause,
    onSeek: seek,
  });
  
  // Setup keyboard controls
  useHotkeys({
    onPlayPause: () => {
      if (isPlaying) {
        pause();
      } else if (playbackUrl) {
        play(playbackUrl, trackId, shareKey);
      }
    },
    onSeekForward: () => seek(currentTime + 5),
    onSeekBackward: () => seek(Math.max(0, currentTime - 5)),
  });
  
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
  
  // Start playback when URL is available
  useEffect(() => {
    if (playbackUrl && !currentUrl) {
      // Auto-play when URL is first available
      // play(playbackUrl, trackId, shareKey);
      console.log("Track ready to play:", playbackUrl);
    }
  }, [playbackUrl, currentUrl]);
  
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
  
  // Simple toggle play/pause handler
  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (playbackUrl) {
      play(playbackUrl, trackId, shareKey);
    }
  };
  
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
      
      <PlayerControls className="mb-4" />
      
      {isPlayingWav && processingStatus === 'pending' ? (
        <div className="text-blue-400 text-sm mb-2 bg-blue-900/20 p-2 rounded">
          Playing WAV file directly. MP3 version is being processed in the background for better streaming quality.
        </div>
      ) : null}
      
      <Waveform 
        audioUrl={playbackUrl}
        waveformAnalysisUrl={waveformUrl}
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
}

export default TrackPlayer;
