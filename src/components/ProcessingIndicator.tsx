
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requestTrackProcessing } from "@/services/trackProcessingService";

interface ProcessingIndicatorProps {
  trackId: string;
  trackName: string;
  status: string;
  isOwner: boolean;
}

const ProcessingIndicator = ({ 
  trackId, 
  trackName, 
  status, 
  isOwner
}: ProcessingIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Simulate progress based on status
  useEffect(() => {
    if (status === "pending") {
      setProgress(10);
    } else if (status === "queued") {
      setProgress(25);
    } else if (status === "processing") {
      // Simulate incremental progress during processing
      setProgress(50);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; // Cap at 90% until complete
          return prev + 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const handleRequestProcessing = async () => {
    setIsRequesting(true);
    try {
      await requestTrackProcessing(trackId);
    } finally {
      setIsRequesting(false);
    }
  };
  
  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return "Waiting to process";
      case "queued":
        return "In processing queue";
      case "processing":
        return "Processing audio";
      case "failed":
        return "Processing failed";
      default:
        return "Optimizing for streaming";
    }
  };
  
  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-gray-700 text-gray-300 mt-2">
            Pending
          </Badge>
        );
      case "queued":
        return (
          <Badge variant="outline" className="bg-blue-900 text-blue-200 border-blue-700 mt-2">
            Queued
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-amber-900 text-amber-200 border-amber-700 flex items-center gap-1 mt-2">
            <Loader className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-900 text-red-200 border-red-700 mt-2">
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold gradient-text">{trackName}</h2>
        <p className="text-gray-400 mt-2">
          We're optimizing your audio for the best streaming experience.
        </p>
        {getStatusBadge()}
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{getStatusDisplay()}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-wip-gray/30"
          />
        </div>
        
        <div className="text-gray-400 text-sm">
          <p>Audio optimization improves streaming quality and performance.</p>
          {status === "failed" && isOwner && (
            <div className="mt-4">
              <p className="text-red-400 mb-2">
                Processing failed. You can request processing again.
              </p>
              <Button
                onClick={handleRequestProcessing}
                variant="outline"
                size="sm"
                className="border-wip-pink text-wip-pink hover:bg-wip-pink/10 mr-2"
                disabled={isRequesting}
              >
                {isRequesting ? (
                  <>
                    <Loader className="h-3 w-3 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  "Try Again"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;
