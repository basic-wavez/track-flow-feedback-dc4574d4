import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrackPlayer from "@/components/TrackPlayer";
import { useAuth } from "@/context/AuthContext";
import { getTrack, getTrackProcessingStatus } from "@/services/trackService";
import { TrackData } from "@/types/track";
import { toast } from "@/components/ui/use-toast";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrackFeedbackSection from "@/components/track/TrackFeedbackSection";
import TrackNotFound from "@/components/track/TrackNotFound";
import TrackLoading from "@/components/track/TrackLoading";

const TrackView = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [track, setTrack] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // Check if track is ready for full player (MP3 is processed and URL is available)
  const isTrackReady = track?.processing_status === 'completed' && track?.mp3_url;
  
  // Show processing indicator if track is not ready
  const isProcessing = !isTrackReady;
  
  useEffect(() => {
    const fetchTrackData = async () => {
      if (!trackId) return;
      
      setIsLoading(true);
      
      try {
        const trackData = await getTrack(trackId);
        
        if (!trackData) {
          toast({
            title: "Track Not Found",
            description: "The track you're looking for doesn't exist or has been removed.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        setTrack(trackData);
        setProcessingStatus(trackData.processing_status || 'pending');
      } catch (error) {
        console.error("Error loading track:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrackData();
    
    // Setup polling for processing status if track is being processed
    let intervalId: number | undefined;
    
    if (trackId) {
      intervalId = window.setInterval(async () => {
        try {
          const status = await getTrackProcessingStatus(trackId);
          setProcessingStatus(status);
          
          // If processing completed, refresh track data to get MP3 URL
          if (status === 'completed' && processingStatus !== 'completed') {
            fetchTrackData();
            
            toast({
              title: "Processing Complete",
              description: "Your track has been optimized for streaming."
            });
            
            // Clear interval once processing is complete
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error checking processing status:", error);
        }
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [trackId, navigate, processingStatus]);

  // Check if track owner matches current user
  const isOwner = user && track?.user_id === user.id;

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />

      <div className="flex-1 py-12 px-4">
        {isLoading ? (
          <TrackLoading />
        ) : track ? (
          <div className="max-w-5xl mx-auto space-y-12">
            {isProcessing ? (
              <ProcessingIndicator
                trackId={trackId || ''}
                trackName={track.title}
                status={processingStatus}
                isOwner={isOwner}
              />
            ) : (
              <TrackPlayer 
                trackId={trackId || ''}
                trackName={track.title}
                audioUrl={track.mp3_url}
                originalUrl={track.original_url}
                originalFilename={track.original_filename} // Pass the original filename
                isOwner={isOwner}
              />
            )}
            
            <TrackFeedbackSection 
              trackTitle={track.title}
              user={user}
            />
          </div>
        ) : (
          <TrackNotFound />
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default TrackView;
