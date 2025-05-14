
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrackPlayer from "@/components/TrackPlayer";
import FeedbackForm from "@/components/FeedbackForm";
import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Profile from "@/components/auth/Profile";

const TrackView = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackName, setTrackName] = useState("Untitled Track");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Default audio for demo purposes
  const demoAudioUrl = "https://assets.mixkit.co/active_storage/sfx/5135/5135.wav";

  useEffect(() => {
    // In a real app, this would fetch the track details from Supabase
    // For this demo, we'll use a placeholder track name
    setTrackName("Midnight Groove (WIP)");
  }, [trackId]);

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
        <div className="max-w-5xl mx-auto space-y-12">
          <TrackPlayer 
            trackName={trackName} 
            audioUrl={demoAudioUrl}
            isOwner={true}
          />
          
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
              trackName={trackName}
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
      </div>
      
      <footer className="py-6 px-8 border-t border-wip-gray/30 text-center text-gray-500">
        <p>© {new Date().getFullYear()} WIP Manager - For music producers, by music producers</p>
      </footer>
    </div>
  );
};

export default TrackView;
