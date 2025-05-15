
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrackPlayer from "@/components/TrackPlayer";
import FeedbackForm from "@/components/FeedbackForm";
import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Profile from "@/components/auth/Profile";
import { getTrack, getTrackProcessingStatus } from "@/services/trackService";
import { TrackData } from "@/types/track";
import { toast } from "@/components/ui/use-toast";
import ProcessingIndicator from "@/components/ProcessingIndicator";

const TrackView = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [track, setTrack] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnoptimizedPlayer, setShowUnoptimizedPlayer] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // Check if track is still being processed
  const isProcessing = track?.processing_status !== 'completed' && 
                      track?.processing_status !== undefined && 
                      !showUnoptimizedPlayer;
  
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

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const handleRequestFeedback = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setShowFeedbackForm(true);
    }
  };

  const handleFeedbackSubmitted = () => {
    setFeedbackSubmitted(true);
    setShowFeedbackForm(false);
  };

  const handlePlayUnoptimized = () => {
    setShowUnoptimizedPlayer(true);
  };

  // Check if track owner matches current user
  const isOwner = user && track?.user_id === user.id;

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-wip-gray/30">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold gradient-text cursor-pointer" onClick={() => navigate("/")}>
            WIP Manager
          </h1>
        </div>
        
        <div>
          {user ? (
            <Profile />
          ) : (
            <Button 
              onClick={() => navigate("/auth")}
              variant="outline"
              className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
            >
              Login / Sign Up
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 py-12 px-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-wip-pink">Loading track...</div>
          </div>
        ) : track ? (
          <div className="max-w-5xl mx-auto space-y-12">
            {isProcessing ? (
              <ProcessingIndicator
                trackId={trackId || ''}
                trackName={track.title}
                status={processingStatus}
                isOwner={isOwner}
                onPlayUnoptimized={handlePlayUnoptimized}
              />
            ) : (
              <TrackPlayer 
                trackId={trackId || ''}
                trackName={track.title}
                audioUrl={track.compressed_url} 
                isOwner={isOwner}
              />
            )}
            
            {!showFeedbackForm && !feedbackSubmitted ? (
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-2xl font-bold gradient-text mb-2">
                  How does this track sound?
                </h2>
                <p className="text-gray-400 text-center max-w-lg mb-4">
                  Your feedback helps producers improve their music. Provide ratings and comments to help them perfect their track.
                </p>
                <Button 
                  onClick={handleRequestFeedback}
                  className="gradient-bg hover:opacity-90 text-lg px-8 py-6"
                  size="lg"
                >
                  Give Feedback
                </Button>
              </div>
            ) : feedbackSubmitted ? (
              <div className="text-center p-12 border border-wip-pink/30 rounded-lg bg-wip-pink/5">
                <h2 className="text-2xl font-bold gradient-text mb-4">
                  Thank You for Your Feedback!
                </h2>
                <p className="text-gray-400 mb-6">
                  Your insights help artists improve their craft. The producer will be notified of your feedback.
                </p>
                <Button 
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
                >
                  Upload Your Own Track
                </Button>
              </div>
            ) : (
              <FeedbackForm 
                trackName={track.title}
                onFeedbackSubmit={handleFeedbackSubmitted}
                onLoginRequest={() => setIsAuthModalOpen(true)}
              />
            )}
            
            <AuthModal 
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              onSuccess={handleAuthSuccess}
            />
          </div>
        ) : (
          <div className="text-center p-12">
            <h2 className="text-2xl font-bold mb-4">Track Not Found</h2>
            <p className="text-gray-400 mb-6">
              The track you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
            >
              Back to Home
            </Button>
          </div>
        )}
      </div>
      
      <footer className="py-6 px-8 border-t border-wip-gray/30 text-center text-gray-500">
        <p>© {new Date().getFullYear()} WIP Manager - For music producers, by music producers</p>
      </footer>
    </div>
  );
};

export default TrackView;
