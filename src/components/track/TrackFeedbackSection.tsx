
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import FeedbackForm from "@/components/FeedbackForm";
import AuthModal from "@/components/auth/AuthModal";
import { User } from "@supabase/supabase-js";

interface TrackFeedbackSectionProps {
  trackTitle: string;
  trackVersion?: number;
  user: User | null;
  trackId?: string; // Add explicit trackId prop
}

const TrackFeedbackSection = ({ 
  trackTitle, 
  trackVersion = 1, 
  user,
  trackId: explicitTrackId // Rename to avoid collision with the one from useParams
}: TrackFeedbackSectionProps) => {
  const navigate = useNavigate();
  const { trackId: urlTrackId } = useParams(); // Get trackId from URL params
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Prioritize explicit trackId (from props) over the one from URL params
  const effectiveTrackId = explicitTrackId || urlTrackId;

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  const handleFeedbackSubmitted = () => {
    setFeedbackSubmitted(true);
    // We're removing the page reload to show the thank you message instead
  };

  if (feedbackSubmitted) {
    return (
      <div className="text-center p-12 border border-wip-pink/30 rounded-lg bg-wip-pink/5">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          Thank You for Your Feedback!
        </h2>
        <p className="text-gray-400 mb-6">
          The producer will be notified of your feedback.
        </p>
        <Button 
          onClick={() => navigate("/")}
          variant="outline"
          className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
        >
          Upload Your Own Track
        </Button>
      </div>
    );
  }

  return (
    <>
      <FeedbackForm 
        trackId={effectiveTrackId}
        trackName={trackTitle}
        trackVersion={trackVersion}
        onFeedbackSubmit={handleFeedbackSubmitted}
        onLoginRequest={() => setIsAuthModalOpen(true)}
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default TrackFeedbackSection;
