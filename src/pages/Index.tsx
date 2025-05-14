
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AudioUploader from "@/components/AudioUploader";
import AuthModal from "@/components/auth/AuthModal";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedTrackName, setUploadedTrackName] = useState("");
  
  const handleUploadComplete = (fileName: string, trackName: string) => {
    setUploadedFileName(fileName);
    setUploadedTrackName(trackName);
  };
  
  const handleAuthRequired = () => {
    setIsAuthModalOpen(true);
  };
  
  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    
    // In a real app with Supabase, this would create a new track in the database
    // For this demo, we'll navigate to a track with a demo ID
    navigate("/track/demo-123");
  };

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-wip-gray/30">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold gradient-text">
            WIP Manager
          </h1>
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
