
import { useCallback } from "react";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { useAudioPlayer } from "./useAudioPlayer";
import { isWavFormat, getFileTypeFromUrl } from "@/lib/audioUtils";
import { isInServerCooldown } from "@/services/trackShareService";

interface UseTrackPlayerProps {
  trackId: string;
  shareKey?: string;
  isPlaylistMode?: boolean;
  playbackUrl: string;
  originalUrl?: string;
  processingStatus?: string;
}

export function useTrackPlayer({
  trackId,
  shareKey,
  isPlaylistMode = false,
  playbackUrl,
  originalUrl,
  processingStatus = 'completed'
}: UseTrackPlayerProps) {
  // Access playlist context when in playlist mode
  const { 
    playNextTrack: contextPlayNext, 
    playPreviousTrack: contextPlayPrevious, 
    togglePlayPause: contextTogglePlayPause,
    isPlaying: contextIsPlaying
  } = usePlaylistPlayer();
  
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

  // Check if we're using the original WAV file
  const originalFileType = originalUrl ? getFileTypeFromUrl(originalUrl) : null;
  const isPlayingWav = isWavFormat(originalFileType) && playbackUrl === originalUrl;
  
  // Additional player state checkers
  const checkCooldownStatus = async (shareKey?: string) => {
    if (!shareKey) return false;
    return await isInServerCooldown(shareKey);
  };
  
  return {
    audioRef,
    isPlaying: isPlaylistMode ? contextIsPlaying : isPlaying,
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
    originalFileType,
    contextPlayNext,
    contextPlayPrevious,
    checkCooldownStatus
  };
}
