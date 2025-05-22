
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { Play, Pause } from "lucide-react";
import PlaybackControls from '@/components/player/PlaybackControls';
import WaveformSection from '@/components/player/WaveformSection';
import TrackHeader from '@/components/player/TrackHeader';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import { checkTrackProcessing } from '@/services/trackProcessingService';
import { TrackData } from '@/types/track';

interface TrackPlayerSectionProps {
  trackData: TrackData;
  currentShareKey?: string;
  isOwner: boolean;
  onProcessingComplete?: () => void;
  trackVersions?: any[];
}

const TrackPlayerSection = ({
  trackData,
  currentShareKey,
  isOwner,
  onProcessingComplete,
  trackVersions
}: TrackPlayerSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [processingStatus, setProcessingStatus] = useState(trackData.processing_status || "pending");
  const [opusProcessingStatus, setOpusProcessingStatus] = useState(trackData.opus_processing_status || "pending");
  
  // Determine if track is being processed
  const isProcessing = processingStatus === "processing" || processingStatus === "pending";
  const isOpusProcessing = opusProcessingStatus === "processing" || opusProcessingStatus === "pending";
  
  // Select the best available URL for playback
  const playbackUrl = trackData.mp3_url || trackData.opus_url || trackData.compressed_url || trackData.original_url;
  
  // Determine which URL to use for waveform analysis - prefer mp3 or compressed
  const waveformAnalysisUrl = trackData.mp3_url || trackData.compressed_url;
  
  // Use these flags to enhance UI when MP3 is available
  const usingMp3 = !!trackData.mp3_url;
  const usingOpus = !!trackData.opus_url;
  
  // Setup audio player
  const audioPlayer = useAudioPlayer({
    mp3Url: playbackUrl,
    trackId: trackData.id,
    shareKey: currentShareKey
  });
  
  const { 
    audioRef, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isMuted,
    togglePlayPause, 
    handleSeek,
    toggleMute,
    handleVolumeChange,
    isBuffering,
    showBufferingUI,
    isGeneratingWaveform,
    audioLoaded
  } = audioPlayer;
  
  // Periodically check if processing has completed
  useEffect(() => {
    // Only check if the track is currently in processing state
    if (isProcessing || isOpusProcessing) {
      const intervalId = setInterval(async () => {
        try {
          // Use trackId to check for processing status
          const { processingComplete, opusProcessingComplete } = await checkTrackProcessing(trackData.id);
          
          // Update processing status if completed
          if (processingComplete && processingStatus !== "completed") {
            setProcessingStatus("completed");
            
            // Notify parent component that processing is complete
            if (onProcessingComplete) {
              onProcessingComplete();
            }
          }
          
          // Update opus processing status if completed
          if (opusProcessingComplete && opusProcessingStatus !== "completed") {
            setOpusProcessingStatus("completed");
          }
          
          // If both are complete, clear interval
          if (processingComplete && opusProcessingComplete) {
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error checking track processing status:", error);
        }
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [trackData.id, isProcessing, isOpusProcessing, processingStatus, opusProcessingStatus, onProcessingComplete]);
  
  const handlePlayClick = (event: React.MouseEvent) => {
    event.preventDefault();
    togglePlayPause();
  };
  
  return (
    <div className="bg-wip-darker border border-wip-gray rounded-lg p-4 sm:p-6">
      {/* Track header with title, version info, etc. */}
      <TrackHeader 
        title={trackData.title}
        versionNumber={trackData.version_number || 1}
      />

      {/* The main waveform and visualizer section */}
      <div className="mt-4">
        <div className="relative">
          <WaveformSection
            playbackUrl={playbackUrl}
            waveformUrl={waveformAnalysisUrl}
            isPlaying={isPlaying}
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
            isOwner={isOwner}
            originalUrl={trackData.original_url}
            originalFilename={trackData.original_filename}
            trackId={trackData.id}
            downloadsEnabled={trackData.downloads_enabled}
            shareKey={currentShareKey}
            trackVersions={trackVersions}
            trackTitle={trackData.title}
            waveformJsonUrl={trackData.waveform_json_url} // Pass the pre-computed waveform JSON URL
          />
        </div>
        
        {/* Add an audio tag for the player */}
        <audio ref={audioRef} preload="auto" />
        
        {/* Playback controls */}
        <div className="mt-2">
          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            togglePlayPause={togglePlayPause}
            toggleMute={toggleMute}
            handleVolumeChange={handleVolumeChange}
          />
        </div>
        
        {/* Show processing indicator if the track is being processed */}
        {(isProcessing || isOpusProcessing) && (
          <div className="mt-4">
            <ProcessingIndicator 
              isProcessingMp3={isProcessing}
              isProcessingOpus={isOpusProcessing}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPlayerSection;
