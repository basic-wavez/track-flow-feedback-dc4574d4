
import { useState, useRef } from "react";
import { requestTrackProcessing } from "@/services/trackService";
import Waveform from "./Waveform";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackHeader from "./player/TrackHeader";
import PlaybackControls from "./player/PlaybackControls";
import TrackActions from "./player/TrackActions";

interface TrackPlayerProps {
  trackId: string;
  trackName: string;
  audioUrl?: string;
  originalUrl?: string;
  originalFilename?: string;
  isOwner?: boolean;
  processingStatus?: string;
  mp3Url?: string;
}

const TrackPlayer = ({ 
  trackId, 
  trackName, 
  audioUrl, 
  originalUrl,
  originalFilename,
  isOwner = false,
  processingStatus = 'completed',
  mp3Url
}: TrackPlayerProps) => {
  // State management
  const [isRequestingProcessing, setIsRequestingProcessing] = useState(false);
  const [currentProcessingStatus, setCurrentProcessingStatus] = useState<string>(processingStatus);
  
  // Determine which URL to use for playback - prefer MP3 if available
  const playbackUrl = mp3Url || audioUrl;
  
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
  } = useAudioPlayer({ mp3Url: playbackUrl });
  
  const handleRequestProcessing = async () => {
    if (!trackId || isRequestingProcessing) return;
    
    setIsRequestingProcessing(true);
    try {
      await requestTrackProcessing(trackId);
      // Update status immediately for better UX
      setCurrentProcessingStatus('queued');
    } finally {
      setIsRequestingProcessing(false);
    }
  };

  const showProcessButton = isOwner && 
    (currentProcessingStatus === 'failed' || !mp3Url);
  
  // Check if we're using the MP3 version
  const usingMp3 = !!mp3Url;
  const isLoading = playbackState === 'loading';

  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      {/* Main audio element */}
      <audio 
        ref={audioRef} 
        src={playbackUrl}
        preload="auto"
      />
      
      <TrackHeader 
        trackName={trackName}
        playbackState={playbackState}
        isLoading={isLoading}
        usingMp3={usingMp3}
        processingStatus={currentProcessingStatus}
        showProcessButton={showProcessButton}
        isRequestingProcessing={isRequestingProcessing}
        onRequestProcessing={handleRequestProcessing}
      />
      
      <PlaybackControls 
        isPlaying={isPlaying}
        playbackState={playbackState}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isLoading={isLoading}
        onPlayPause={togglePlayPause}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
      />
      
      <Waveform 
        audioUrl={playbackUrl}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        totalChunks={1} // No more chunks, always 1
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={usingMp3}
        isGeneratingWaveform={isGeneratingWaveform}
        audioLoaded={audioLoaded}
      />
      
      <TrackActions 
        isOwner={isOwner}
        originalUrl={originalUrl}
        originalFilename={originalFilename}
        trackId={trackId}
      />
    </div>
  );
};

export default TrackPlayer;
