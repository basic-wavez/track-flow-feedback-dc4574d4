
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import FeedbackHeader from "@/components/feedback/FeedbackHeader";
import TrackPlayerView from "@/components/feedback/TrackPlayerView";
import FeedbackList from "@/components/feedback/FeedbackList";
import NoFeedbackMessage from "@/components/feedback/NoFeedbackMessage";
import { useFeedbackData } from "@/hooks/useFeedbackData";
import { setDocumentTitle, updateMetaTags } from "@/lib/metadataUtils";

const FeedbackView: React.FC = () => {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  
  const {
    trackData,
    feedback,
    isLoading,
    error,
    trackId,
    handleProcessingComplete,
    getUserDisplayName,
    getUserAvatar,
    formatDate,
  } = useFeedbackData(feedbackId);

  // Update metadata when track data is loaded
  useEffect(() => {
    if (trackData) {
      // Set document title with track name
      const trackTitle = `Feedback for ${trackData.title} - Demo Manager`;
      setDocumentTitle(trackTitle);
      
      // Update meta tags for social sharing
      updateMetaTags({
        title: trackTitle,
        description: `Check out feedback for ${trackData.title} - Version ${trackData.version_number || 1} on Demo Manager by Basic Wavez`,
        imageUrl: "/lovable-uploads/723beaa8-0198-4cde-8ef2-d170e19e5512.png",
        url: window.location.href
      });
    }
    
    // Clean up function to reset metadata when component unmounts
    return () => {
      setDocumentTitle("Demo Manager by Basic Wavez");
    };
  }, [trackData]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading feedback...</div>;
  }

  if (error) {
    return <div className="text-center p-8">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <FeedbackHeader trackId={trackId} />
      
      <div className="flex-1 max-w-5xl mx-auto py-8 px-4">
        <div className="space-y-8">
          <TrackPlayerView 
            trackData={trackData} 
            isLoading={isLoading} 
            trackId={trackId} 
            onProcessingComplete={handleProcessingComplete} 
          />
          
          {feedback && feedback.length > 0 ? (
            <FeedbackList 
              feedback={feedback} 
              getUserDisplayName={getUserDisplayName}
              getUserAvatar={getUserAvatar}
              formatDate={formatDate}
            />
          ) : (
            <NoFeedbackMessage />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(FeedbackView);
