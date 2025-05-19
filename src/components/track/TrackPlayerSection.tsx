import React from "react";
import { getFileTypeFromUrl, needsProcessingIndicator, isWavFormat } from "@/lib/audioUtils";
import TrackPlayer from "@/components/TrackPlayer";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import { isInCooldownPeriod } from "@/services/playCountService";
import { TrackData } from "@/types/track";

interface TrackPlayerSectionProps {
  trackData: TrackData;
  currentShareKey?: string;
  isOwner: boolean;
  onProcessingComplete: () => void;
}

const TrackPlayerSection: React.FC<TrackPlayerSectionProps> = ({
  trackData,
  currentShareKey,
  isOwner,
  onProcessingComplete
}) => {
  // Determine if share key is in cooldown period
  const inCooldownPeriod = currentShareKey ? isInCooldownPeriod(currentShareKey) : false;
  
  // Use the original filename for display - this keeps hyphens and original capitalization
  const displayName = trackData.title;
  const versionNumber = trackData.version_number || 1;
  
  // Determine if we need to show the processing indicator instead of the player
  const originalFileType = getFileTypeFromUrl(trackData?.original_url);
  const showProcessingIndicator = needsProcessingIndicator(
    originalFileType,
    trackData.mp3_url,
    trackData.opus_url,
    trackData.processing_status
  );
  
  // Determine which URL to prioritize for playback
  const playbackUrl = getPlaybackUrl();
  const waveformUrl = getWaveformUrl();

  // Determine which URL to prioritize for playback
  function getPlaybackUrl() {
    // For WAV files, prioritize the original URL for immediate playback
    if (isWavFormat(originalFileType)) {
      return trackData.original_url;
    }
    
    // Otherwise follow the normal priority: MP3 > compressed > original
    return trackData.mp3_url || trackData.compressed_url || trackData.original_url;
  }
  
  // Get the best URL for waveform analysis
  function getWaveformUrl() {
    // For WAV files, we can use the original for waveform too
    if (isWavFormat(originalFileType)) {
      return trackData.original_url;
    }
    
    return trackData.mp3_url || trackData.compressed_url;
  }

  if (showProcessingIndicator) {
    return (
      <ProcessingIndicator
        trackId={trackData.id}
        trackName={trackData.title}
        status={trackData.processing_status || "pending"}
        isOwner={isOwner}
        originalFormat={originalFileType}
        onComplete={onProcessingComplete}
      />
    );
  }

  return (
    <TrackPlayer 
      trackId={trackData.id}
      trackName={trackData.title} 
      audioUrl={playbackUrl} 
      originalUrl={trackData.original_url}
      waveformAnalysisUrl={waveformUrl}
      originalFilename={trackData.original_filename}
      isOwner={isOwner}
      mp3Url={trackData.mp3_url}
      opusUrl={trackData.opus_url}
      opusProcessingStatus={trackData.opus_processing_status}
      shareKey={currentShareKey}
      inCooldownPeriod={inCooldownPeriod}
      processingStatus={trackData.processing_status}
      downloadsEnabled={trackData.downloads_enabled || false}
      versionNumber={versionNumber}
    />
  );
};

export default React.memo(TrackPlayerSection);
