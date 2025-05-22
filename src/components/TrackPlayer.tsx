
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
import { PeaksDataProvider } from "@/context/PeaksDataContext";

interface TrackPlayerProps {
  trackId: string;
  trackName: string;
  audioUrl?: string;
  originalUrl?: string;
  waveformAnalysisUrl?: string;
  waveformPeaksUrl?: string; // Add this prop for pre-computed peaks data
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
  
  // Console logging for debugging
  useEffect(() => {
    if (isPlaylistMode) {
      console.log("Playlist mode states:", { 
        contextIsPlaying, 
        isLoading,
        "audio element exists": !!audioRef.current
      });
    }
  }, [contextIsPlaying, isLoading, isPlaylistMode]);
  
  // Determine which URL to use for playback - prefer Opus if available, then MP3, then audioUrl
  const playbackUrl = opusUrl || mp3Url || audioUrl;

  // Determine which URL to use for waveform analysis - ALWAYS prefer MP3 if available
  const waveformUrl = mp3Url || waveformAnalysisUrl;
  
  // Log peaks URL on load for debugging
  useEffect(() => {
    if (waveformPeaksUrl) {
      console.log("Track has pre-computed peaks data URL:", waveformPeaksUrl);
    }
  }, [waveformPeaksUrl]);
  
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
  
  // Sync with playlist context when in playlist mode - fixed implementation
  useEffect(() => {
    if (!isPlaylistMode || !audioRef.current) return;
    
    console.log("Sync effect triggered:", { contextIsPlaying, isPlaying });
    
    if (contextIsPlaying && !isPlaying) {
      console.log("Context is playing but local is not - starting playback");
      audioRef.current.play().catch(err => {
        console.error("Error playing from context sync:", err);
      });
    } else if (!contextIsPlaying && isPlaying) {
      console.log("Context is paused but local is playing - pausing playback");
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
  
  // Combined toggle play function - updated to ensure both states update
  const handleTogglePlayPause = () => {
    console.log("Toggle play/pause clicked", { isPlaylistMode, isPlaying, contextIsPlaying });
    
    if (isPlaylistMode) {
      // Update the context state first
      contextTogglePlayPause();
      
      // Also update the local audio state
      // The sync effect will handle the actual audio element changes
      // But we still call localTogglePlayPause to update local state in sync
      localTogglePlayPause();
    } else {
      // Just use local toggle when not in playlist mode
      localTogglePlayPause();
    }
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
  
  // Determine combined cooldown state
  const isCooldown = inCooldownPeriod || serverCooldown;
  
  return (
    <PeaksDataProvider>
      <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
        {/* Main audio element - adding crossOrigin attribute */}
        <audio 
          ref={audioRef} 
          src={playbackUrl}
          preload="auto"
          crossOrigin="anonymous"
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
          waveformPeaksUrl={waveformPeaksUrl}
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
          // Pass track action props directly to WaveformSection
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
    </PeaksDataProvider>
  );
};

export default TrackPlayer;
