
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FeedbackForm from "@/components/FeedbackForm";
import AuthModal from "@/components/auth/AuthModal";
import { User } from "@supabase/supabase-js";

interface TrackFeedbackSectionProps {
  trackTitle: string;
  user: User | null;
}

const TrackFeedbackSection = ({ trackTitle, user }: TrackFeedbackSectionProps) => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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

  if (showFeedbackForm) {
    return (
      <FeedbackForm 
        trackName={trackTitle}
        onFeedbackSubmit={handleFeedbackSubmitted}
        onLoginRequest={() => setIsAuthModalOpen(true)}
      />
    );
  }

  if (feedbackSubmitted) {
    return (
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
    );
  }

  return (
    <>
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
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default TrackFeedbackSection;
