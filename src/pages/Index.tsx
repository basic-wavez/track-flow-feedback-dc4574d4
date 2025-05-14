
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AudioUploader from "@/components/AudioUploader";
import AuthModal from "@/components/auth/AuthModal";
import Profile from "@/components/auth/Profile";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedTrackName, setUploadedTrackName] = useState("");
  
  const handleUploadComplete = (fileName: string, trackName: string) => {
    setUploadedFileName(fileName);
    setUploadedTrackName(trackName);
    
    // If user is already authenticated, navigate to the track page
    // Using setTimeout to ensure state is updated before navigation
    if (user) {
      setTimeout(() => {
        navigate("/track/demo-123", { replace: true });
      }, 100);
    }
  };
  
  const handleAuthRequired = () => {
    // Only open auth modal if user is not logged in
    if (!user) {
      setIsAuthModalOpen(true);
    }
  };
  
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    
    // If we have an uploaded track, navigate to its page
    // Using replace: true to prevent going back to home page
    if (uploadedFileName) {
      setTimeout(() => {
        navigate("/track/demo-123", { replace: true });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-wip-gray/30">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold gradient-text">
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
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            Share Your Works In Progress
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your music, get detailed feedback from other producers, and perfect your tracks.
          </p>
        </div>
        
        <AudioUploader 
          onUploadComplete={handleUploadComplete}
          onAuthRequired={handleAuthRequired}
        />
        
        <div className="mt-16 px-6 py-8 w-full max-w-3xl mx-auto border border-wip-gray/30 rounded-lg bg-wip-gray/5">
          <h3 className="text-xl font-semibold mb-4">How It Works</h3>
          
          <ol className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-bg flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Upload Your Track</h4>
                <p className="text-gray-400">
                  Drag and drop your audio file (WAV, FLAC, AIFF, or MP3). We'll compress it while preserving quality.
                </p>
              </div>
            </li>
            
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-bg flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Share with Others</h4>
                <p className="text-gray-400">
                  Generate a link to share your track with other producers and get their honest feedback.
                </p>
              </div>
            </li>
            
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-bg flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Get Detailed Feedback</h4>
                <p className="text-gray-400">
                  Receive ratings on mixing, melody, sound design, and more, along with written feedback.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </main>
      
      <footer className="py-6 px-8 border-t border-wip-gray/30 text-center text-gray-500">
        <p>© {new Date().getFullYear()} WIP Manager - For music producers, by music producers</p>
      </footer>
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
