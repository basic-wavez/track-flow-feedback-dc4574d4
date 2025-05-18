
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FeedbackHeader from "@/components/feedback/FeedbackHeader";
import FeedbackContainer from "@/components/feedback/FeedbackContainer";
import FeedbackDisplay from "@/components/feedback/FeedbackDisplay";
import useFeedbackData from "@/hooks/useFeedbackData";
import { getTrack } from "@/services/trackService";
import { TrackData } from "@/types/track";

const FeedbackView = () => {
  const { trackId } = useParams();
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use our custom hook to fetch and process feedback data
  const {
    feedback,
    userDetails,
    averageRatings,
    djSetPercentage,
    listeningPercentage,
    isLoading: isFeedbackLoading
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
          <FeedbackContainer
            trackData={trackData}
            isLoading={isLoading}
            trackId={trackId}
            onProcessingComplete={handleProcessingComplete}
          />
          
          {!isFeedbackLoading && (
            <FeedbackDisplay
              feedback={feedback}
              userDetails={userDetails}
              averageRatings={averageRatings}
              djSetPercentage={djSetPercentage}
              listeningPercentage={listeningPercentage}
            />
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FeedbackView;
