
import { useState, useRef } from "react";
import { requestTrackProcessing } from "@/services/trackService";
import Waveform from "./Waveform";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackHeader from "./player/TrackHeader";
import PlaybackControls from "./player/PlaybackControls";
import TrackActions from "./player/TrackActions";
import { Json } from "@/integrations/supabase/types";

interface TrackPlayerProps {
  trackId: string;
  trackName: string;
  audioUrl?: string;
  originalUrl?: string;
  originalFilename?: string;
  isOwner?: boolean;
  waveformData?: number[] | Json; // Waveform data from database
}

const TrackPlayer = ({ 
  trackId, 
  trackName, 
  audioUrl, 
  originalUrl,
  originalFilename,
  isOwner = false,
  waveformData // Waveform data from database
}: TrackPlayerProps) => {
  // State management
  const [isRequestingProcessing, setIsRequestingProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('completed');
  
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
  } = useAudioPlayer({ mp3Url: audioUrl });
  
  // Hidden audio element for preloading next chunk (kept for compatibility)
  const nextAudioRef = useRef<HTMLAudioElement>(null);
  
  const handleRequestProcessing = async () => {
    if (!trackId || isRequestingProcessing) return;
    
    setIsRequestingProcessing(true);
    try {
      await requestTrackProcessing(trackId);
      // Update status immediately for better UX
      setProcessingStatus('queued');
    } finally {
      setIsRequestingProcessing(false);
    }
  };

  const showProcessButton = isOwner && 
    processingStatus === 'failed';
  
  // Always using MP3 now
  const usingMp3 = true;
  const isLoading = playbackState === 'loading';

  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      {/* Main audio element */}
      <audio 
        ref={audioRef} 
        src={audioUrl}
        preload="auto"
      />
      
      {/* Hidden audio element for preloading (kept for compatibility) */}
      <audio 
        ref={nextAudioRef} 
        preload="auto" 
        style={{ display: 'none' }}
      />
      
      <TrackHeader 
        trackName={trackName}
        playbackState={playbackState}
        isLoading={isLoading}
        usingMp3={usingMp3}
        processingStatus={processingStatus}
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
        trackId={trackId} // Pass the track ID to save waveform data
        audioUrl={audioUrl}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        totalChunks={1} // Always 1 chunk for MP3
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={usingMp3}
        isGeneratingWaveform={isGeneratingWaveform}
        audioLoaded={audioLoaded}
        waveformData={waveformData} // Pass the waveform data from the database
        isOwner={isOwner} // Pass ownership status to control saving
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
