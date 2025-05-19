
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getTrack } from "@/services/trackService";
import { TrackData } from "@/types/track";
import { useFeedbackData } from "@/hooks/useFeedbackData";
import FeedbackHeader from "@/components/feedback/FeedbackHeader";
import TrackPlayerView from "@/components/feedback/TrackPlayerView";
import FeedbackSummaryCard from "@/components/feedback/FeedbackSummaryCard";
import FeedbackList from "@/components/feedback/FeedbackList";
import NoFeedbackMessage from "@/components/feedback/NoFeedbackMessage";

const FeedbackView: React.FC = () => {
  const { trackId } = useParams();
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing data reload

  const {
    feedback,
    averageRatings,
    djSetPercentage,
    listeningPercentage,
    formatDate,
    getUserDisplayName,
    getUserAvatar
  } = useFeedbackData(trackId);

  useEffect(() => {
    const fetchTrackData = async () => {
      if (!trackId) return;

      setIsLoading(true);
      try {
        const track = await getTrack(trackId);
        if (track) {
          setTrackData(track);
        }
      } catch (error) {
        console.error("Error fetching track:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackData();
  }, [trackId, refreshKey]);

  // Handler for when processing completes
  const handleProcessingComplete = () => {
    console.log("Processing complete in FeedbackView - refreshing track data");
    setRefreshKey(prev => prev + 1); // Increment refresh key to trigger data reload
  };

  return (
    <div className="min-h-screen flex flex-col bg-wip-dark">
      <Header />
      
      <FeedbackHeader trackId={trackId} />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <TrackPlayerView 
            trackData={trackData}
            isLoading={isLoading}
            trackId={trackId}
            onProcessingComplete={handleProcessingComplete}
          />
          
          {feedback.length > 0 ? (
            <>
              <FeedbackSummaryCard
                feedback={feedback}
                averageRatings={averageRatings}
                djSetPercentage={djSetPercentage}
                listeningPercentage={listeningPercentage}
              />
              
              <FeedbackList
                feedback={feedback}
                getUserDisplayName={getUserDisplayName}
                getUserAvatar={getUserAvatar}
                formatDate={formatDate}
              />
            </>
          ) : (
            <NoFeedbackMessage />
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FeedbackView;
