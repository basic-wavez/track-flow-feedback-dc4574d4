import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrackData, TrackVersion } from "@/types/track";
import TrackPlayer from "@/components/TrackPlayer";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import TrackFeedbackDisplay from "@/components/track/TrackFeedbackDisplay";
import TrackFeedbackSection from "@/components/track/TrackFeedbackSection";
import ShareLinkManager from "@/components/track/ShareLinkManager";
import { isInCooldownPeriod } from "@/services/playCountService";
import { getFileTypeFromUrl, needsProcessingIndicator, isWavFormat } from "@/lib/audioUtils";
import { User } from "@supabase/supabase-js";

interface TrackContentProps {
  trackData: TrackData;
  isOwner: boolean;
  shareKey?: string;
  user?: User | null;
  resolvedTrackId?: string;
  trackVersions: TrackVersion[];
  onProcessingComplete: () => void;
}

const TrackContent = ({
  trackData,
  isOwner,
  shareKey,
  user,
  resolvedTrackId,
  trackVersions,
  onProcessingComplete
}: TrackContentProps) => {
  const [activeTab, setActiveTab] = useState<string>("feedback");
  
  // Use the original filename for display - this keeps hyphens and original capitalization
  const displayName = trackData.title;
  const versionNumber = trackData.version_number || 1;
  
  // Determine if we need to show the processing indicator instead of the player
  const originalFileType = getFileTypeFromUrl(trackData?.original_url);
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

  // Check if share key is in cooldown period
  const inCooldownPeriod = shareKey ? isInCooldownPeriod(shareKey) : false;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {trackData && showProcessingIndicator ? (
        <ProcessingIndicator
          trackId={trackData.id}
          trackName={trackData.title}
          status={trackData.processing_status || "pending"}
          isOwner={isOwner}
          originalFormat={originalFileType}
          onComplete={onProcessingComplete}
        />
      ) : trackData && (
        <TrackPlayer 
          trackId={trackData.id}
          trackName={trackData.title} 
          audioUrl={getPlaybackUrl()} 
          originalUrl={trackData.original_url}
          waveformAnalysisUrl={getWaveformUrl()}
          originalFilename={trackData.original_filename}
          isOwner={isOwner}
          mp3Url={trackData.mp3_url}
          opusUrl={trackData.opus_url}
          opusProcessingStatus={trackData.opus_processing_status}
          shareKey={shareKey}
          inCooldownPeriod={inCooldownPeriod}
          downloadsEnabled={trackData.downloads_enabled || false}
          versionNumber={versionNumber}
          trackVersions={trackVersions}
        />
      )}
      
      {isOwner ? (
        <div>
          <div className="flex mb-6 space-x-4 border-b">
            <Button
              variant="ghost"
              className={`pb-2 ${activeTab === "feedback" ? "border-b-2 border-wip-pink text-wip-pink" : ""}`}
              onClick={() => setActiveTab("feedback")}
            >
              Feedback
            </Button>
            <Button
              variant="ghost"
              className={`pb-2 ${activeTab === "share" ? "border-b-2 border-wip-pink text-wip-pink" : ""}`}
              onClick={() => setActiveTab("share")}
            >
              Share
            </Button>
          </div>
          
          {trackData && activeTab === "feedback" ? (
            <TrackFeedbackDisplay 
              trackId={trackData.id} 
              trackTitle={trackData.title} 
              trackVersion={versionNumber}
            />
          ) : trackData && (
            <ShareLinkManager trackId={trackData.id} trackTitle={trackData.title} />
          )}
        </div>
      ) : (
        trackData && <TrackFeedbackSection 
          trackTitle={trackData.title} 
          trackVersion={versionNumber}
          user={user} 
          trackId={resolvedTrackId} 
        />
      )}
    </div>
  );
};

export default TrackContent;
