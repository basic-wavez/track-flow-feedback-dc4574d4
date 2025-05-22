
import React, { useState } from "react";
import TrackPlayer from "@/components/TrackPlayer";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import { getFileTypeFromUrl, needsProcessingIndicator, isWavFormat } from "@/lib/audioUtils";
import { TrackData } from "@/types/track";

interface TrackPlayerViewProps {
  trackData: TrackData | null;
  isLoading: boolean;
  trackId?: string;
  onProcessingComplete: () => void;
}

const TrackPlayerView: React.FC<TrackPlayerViewProps> = ({
  trackData,
  isLoading,
  trackId,
  onProcessingComplete,
}) => {
  // Determine if we need to show the processing indicator instead of the player
  const originalFileType = trackData ? getFileTypeFromUrl(trackData.original_url) : undefined;
  const showProcessingIndicator = trackData ? needsProcessingIndicator(
    originalFileType,
    trackData.mp3_url,
    trackData.opus_url,
    trackData.processing_status
  ) : false;
  
  // Determine which URL to prioritize for playback
  const getPlaybackUrl = () => {
    if (!trackData) return undefined;
    
    // For WAV files, prioritize the original URL for immediate playback
    if (isWavFormat(originalFileType)) {
      return trackData.original_url;
    }
    
    // Otherwise follow the normal priority: MP3 > compressed > original
    return trackData.mp3_url || trackData.compressed_url || trackData.original_url;
  };
  
  // Get the best URL for waveform analysis
  const getWaveformUrl = () => {
    if (!trackData) return undefined;
    
    // For WAV files, we can use the original for waveform too
    if (isWavFormat(originalFileType)) {
      return trackData.original_url;
    }
    
    return trackData.mp3_url || trackData.compressed_url;
  };

  if (!trackData) {
    return (
      <div className="h-60 bg-wip-darker rounded-lg flex items-center justify-center">
        <p className="text-wip-pink">{isLoading ? 'Loading track...' : 'Track not found'}</p>
      </div>
    );
  }

  if (showProcessingIndicator) {
    return (
      <ProcessingIndicator
        trackId={trackId || ''}
        trackName={trackData.title || 'Untitled Track'}
        status={trackData.processing_status || "pending"}
        isOwner={true}
        originalFormat={originalFileType}
        onComplete={onProcessingComplete}
      />
    );
  }

  return (
    <TrackPlayer 
      trackId={trackId || ''}
      trackName={trackData.title || 'Untitled Track'} 
      audioUrl={getPlaybackUrl()} 
      originalUrl={trackData.original_url}
      waveformAnalysisUrl={getWaveformUrl()} 
      waveformPeaksUrl={trackData.waveform_peaks_url}
      originalFilename={trackData.original_filename}
      isOwner={true}
      versionNumber={trackData.version_number || 1}
      mp3Url={trackData.mp3_url}
      showFFTVisualizer={true}
    />
  );
};

export default React.memo(TrackPlayerView);
