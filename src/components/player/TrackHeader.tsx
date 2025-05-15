
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw } from "lucide-react";
import { useState } from "react";

interface TrackHeaderProps {
  trackName: string;
  playbackState: string;
  isLoading: boolean;
  usingMp3: boolean;
  processingStatus: string;
  showProcessButton: boolean;
  isRequestingProcessing: boolean;
  onRequestProcessing: () => Promise<void>;
}

const TrackHeader = ({
  trackName,
  playbackState,
  isLoading,
  usingMp3,
  processingStatus,
  showProcessButton,
  isRequestingProcessing,
  onRequestProcessing
}: TrackHeaderProps) => {
  const [statusMode, setStatusMode] = useState<"wip" | "demo">("wip");

  // Helper function to render playback status indicator
  const renderPlaybackStatus = () => {
    switch (playbackState) {
      case 'buffering':
        return (
          <div className="flex items-center gap-2 text-wip-pink animate-pulse">
            <Loader className="h-4 w-4 animate-spin" />
            <span>Buffering...</span>
          </div>
        );
      case 'error':
        return <span className="text-red-500">Error loading audio</span>;
      default:
        if (isLoading) {
          return <span className="text-gray-400">Loading audio...</span>;
        }
        return null;
    }
  };

  // Helper function to render processing status
  const renderProcessingStatus = () => {
    if (usingMp3) return null;
    
    switch (processingStatus) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-gray-700 text-gray-300">
            MP3 Processing Pending
          </Badge>
        );
      case 'queued':
        return (
          <Badge variant="outline" className="bg-blue-900 text-blue-200 border-blue-700">
            MP3 Processing Queued
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-amber-900 text-amber-200 border-amber-700 flex items-center gap-1">
            <Loader className="h-3 w-3 animate-spin" />
            MP3 Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-900 text-red-200 border-red-700">
            MP3 Processing Failed
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-900 text-green-200 border-green-700">
            MP3 Processing Complete
          </Badge>
        );
      default:
        return null;
    }
  };

  const toggleStatus = () => {
    setStatusMode(statusMode === "wip" ? "demo" : "wip");
  };

  return (
    <div className="mb-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold gradient-text">{trackName}</h2>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-gray-400 text-sm">
            {renderPlaybackStatus()}
          </p>
          {renderProcessingStatus()}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {showProcessButton && (
          <Button
            onClick={onRequestProcessing}
            variant="outline"
            size="sm"
            className="border-wip-pink text-wip-pink hover:bg-wip-pink/10 flex gap-1 items-center"
            disabled={isRequestingProcessing}
          >
            {isRequestingProcessing ? (
              <Loader className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Process MP3
          </Button>
        )}
        <Badge 
          variant="outline" 
          className="border-wip-pink text-wip-pink cursor-pointer hover:bg-wip-pink/10 transition-colors"
          onClick={toggleStatus}
        >
          {statusMode === "wip" ? "Work In Progress" : "Demo"}
        </Badge>
      </div>
    </div>
  );
};

export default TrackHeader;
