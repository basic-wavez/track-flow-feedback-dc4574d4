import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requestTrackProcessing, getTrackProcessingStatus } from "@/services/trackProcessingService";
import { toast } from "sonner";

interface ProcessingIndicatorProps {
  trackId: string;
  trackName: string;
  status: string;
  isOwner: boolean;
  originalFormat?: string;
  onComplete?: () => void;
}

const ProcessingIndicator = ({ 
  trackId, 
  trackName, 
  status: initialStatus, 
  isOwner,
  originalFormat,
  onComplete
}: ProcessingIndicatorProps) => {
  const [progress, setProgress] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [pollCount, setPollCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [forceRefreshed, setForceRefreshed] = useState(false);
  
  // Auto-refresh after 12 seconds timeout (changed from 5 seconds)
  const AUTO_REFRESH_TIMEOUT = 12000; // 12 seconds in milliseconds
  const MAX_POLL_TIME = 60000; // 60 seconds maximum polling time
  
  // Poll for status updates
  useEffect(() => {
    // Set initial status and progress
    setCurrentStatus(initialStatus);
    updateProgressFromStatus(initialStatus);
    
    if (initialStatus !== "completed" && initialStatus !== "failed") {
      console.log(`Starting processing status polling for track ${trackId}`);
      
      // Poll every 3 seconds
      const interval = setInterval(async () => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const newPollCount = pollCount + 1;
        
        console.log(`[Poll #${newPollCount}] Polling status for ${trackId} (elapsed: ${Math.round(elapsedTime / 1000)}s)`);
        setPollCount(newPollCount);
        
        try {
          const { mp3Status } = await getTrackProcessingStatus(trackId);
          console.log(`[Poll #${newPollCount}] Status update for ${trackId}: ${mp3Status} (current: ${currentStatus})`);
          
          // Check if we need to force a refresh due to timeout
          if (elapsedTime >= AUTO_REFRESH_TIMEOUT && !forceRefreshed) {
            console.log(`Auto-refresh triggered after ${AUTO_REFRESH_TIMEOUT / 1000} seconds`);
            toast.info("Auto-refreshing processing status...");
            setForceRefreshed(true);
            
            // Force refresh by calling the onComplete callback
            if (onComplete) {
              console.log("Triggering forced refresh via onComplete callback");
              onComplete();
            }
            
            // Also update local state to show completion
            setCurrentStatus("completed");
            updateProgressFromStatus("completed");
            clearInterval(interval);
            return;
          }
          
          // Check for max poll time exceeded
          if (elapsedTime >= MAX_POLL_TIME) {
            console.log(`Maximum polling time (${MAX_POLL_TIME / 1000}s) exceeded. Stopping polling.`);
            toast.warning("Processing is taking longer than expected. Refreshing status...");
            
            if (onComplete) {
              console.log("Triggering forced refresh via onComplete callback due to max poll time");
              onComplete();
            }
            
            clearInterval(interval);
            return;
          }
          
          // Normal status update logic
          if (mp3Status !== currentStatus) {
            console.log(`Status changed from ${currentStatus} to ${mp3Status}`);
            setCurrentStatus(mp3Status);
            updateProgressFromStatus(mp3Status);
            
            if (mp3Status === "completed") {
              console.log("Processing completed - clearing interval");
              clearInterval(interval);
              toast.success("Audio processing completed");
              
              if (onComplete) {
                console.log("Invoking onComplete callback");
                onComplete();
              }
            }
          }
        } catch (error) {
          console.error("Error polling for processing status:", error);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [trackId, initialStatus, startTime, pollCount, onComplete, forceRefreshed]);
  
  // Set progress based on status
  const updateProgressFromStatus = (status: string) => {
    switch (status) {
      case "pending":
        setProgress(10);
        break;
      case "queued":
        setProgress(25);
        break;
      case "processing":
        setProgress(60); // Start higher to show faster progress
        break;
      case "completed":
        setProgress(100);
        break;
      case "failed":
        setProgress(0);
        break;
      default:
        setProgress(10);
    }
  };
  
  const handleRequestProcessing = async () => {
    setIsRequesting(true);
    try {
      const success = await requestTrackProcessing(trackId);
      if (success) {
        setCurrentStatus("queued");
        updateProgressFromStatus("queued");
        toast.success("Processing requested successfully");
      }
    } catch (error) {
      console.error("Error requesting processing:", error);
      toast.error("Failed to request processing");
    } finally {
      setIsRequesting(false);
    }
  };
  
  const getStatusDisplay = () => {
    switch (currentStatus) {
      case "pending":
        return "Waiting to process";
      case "queued":
        return "In processing queue";
      case "processing":
        return "Processing audio";
      case "failed":
        return "Processing failed";
      case "completed":
        return "Processing completed";
      default:
        return "Optimizing for streaming";
    }
  };
  
  const getStatusBadge = () => {
    switch (currentStatus) {
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
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-900 text-green-200 border-green-700 mt-2">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatName = originalFormat ? ` (${originalFormat.toUpperCase().replace('AUDIO/', '')})` : '';

  return (
    <div className="w-full max-w-4xl mx-auto bg-wip-darker rounded-lg p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold gradient-text">{trackName}{formatName}</h2>
        <p className="text-gray-400 mt-2">
          We're optimizing your audio for the best streaming experience.
        </p>
        {getStatusBadge()}
        {forceRefreshed && (
          <p className="text-sm text-wip-pink mt-2">Auto-refreshed for latest status</p>
        )}
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
          {currentStatus === "failed" && isOwner && (
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
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Try Again
                  </>
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
