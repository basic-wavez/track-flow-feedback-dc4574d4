
import { Badge } from "@/components/ui/badge";
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

  // Helper function to render playback status indicator - never show loading
  const renderPlaybackStatus = () => {
    if (playbackState === 'error') {
      return <span className="text-red-500">Error loading audio</span>;
    }
    return null;
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
          {/* Processing status badges completely removed */}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Process MP3 button removed */}
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
