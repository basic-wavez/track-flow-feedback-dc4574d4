import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AudioUploader from "@/components/AudioUploader";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploadedTrackId, setUploadedTrackId] = useState("");
  const [uploadedTrackName, setUploadedTrackName] = useState("");
  const [shouldNavigate, setShouldNavigate] = useState(false);
  
  // Add effect to log authentication state when component mounts
  useEffect(() => {
    console.log("Index - Initial auth state:", { 
      isAuthenticated: !!user, 
      userId: user?.id,
      email: user?.email,
      path: window.location.pathname
    });
    
    // Ensure we have the latest auth state
    refreshSession().catch(error => {
      console.error("Index - Error refreshing session:", error);
    });
  }, []);
  
  // Monitor auth state changes
  useEffect(() => {
    console.log("Index - Auth state updated:", { 
      isAuthenticated: !!user, 
      userId: user?.id,
      email: user?.email,
      isAuthModalOpen,
      path: window.location.pathname
    });
  }, [user, isAuthModalOpen]);
  
  useEffect(() => {
    // Handle navigation in an effect to ensure it happens only once
    if (shouldNavigate && uploadedTrackId) {
      // Use a timeout to ensure all state updates are processed
      const timer = setTimeout(() => {
        console.log("Index - Navigating to track page:", uploadedTrackId);
        navigate(`/track/${uploadedTrackId}`, { 
          replace: true // Using replace to prevent back navigation
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldNavigate, uploadedTrackId, navigate]);
  
  const handleUploadComplete = useCallback((trackId: string, trackName: string) => {
    console.log("Index - Upload complete:", { trackId, trackName, isAuthenticated: !!user });
    
    setUploadedTrackId(trackId);
    setUploadedTrackName(trackName);
    
    // If user is already authenticated, set flag to navigate
    if (user) {
      setShouldNavigate(true);
    }
  }, [user]);
  
  const handleAuthRequired = useCallback(async () => {
    // Double-check current auth state before opening modal
    await refreshSession();
    
    // Check again after refresh to make sure we have the most current state
    console.log("Index - Auth required check after refresh:", { 
      isAuthenticated: !!user, 
      willOpenModal: !user 
    });
    
    // Only open auth modal if user is not logged in
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      // If we already have authentication and a track ID, navigate
      if (uploadedTrackId) {
        setShouldNavigate(true);
      }
    }
  }, [user, uploadedTrackId, refreshSession]);
  
  const handleAuthSuccess = useCallback(() => {
    console.log("Index - Auth success:", { hasTrackId: !!uploadedTrackId });
    
    // Close the auth modal
    setIsAuthModalOpen(false);
    
    // Only navigate if we have a track ID
    if (uploadedTrackId) {
      setShouldNavigate(true);
    }
  }, [uploadedTrackId]);

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <nav className="border-b border-wip-gray/30 bg-wip-darker">
        <div className="max-w-7xl mx-auto px-4">
          <NavigationMenu className="py-2">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Button 
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-wip-gray/10 text-wip-pink")} 
                  variant="ghost"
                  onClick={() => navigate("/")}
                >
                  Home
                </Button>
              </NavigationMenuItem>
              
              {user && (
                <NavigationMenuItem>
                  <Button 
                    className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-wip-gray/10 text-wip-pink")} 
                    variant="ghost"
                    onClick={() => navigate("/profile")}
                  >
                    My Profile
                  </Button>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </nav>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-wip-pink">
            Share your demo
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
                1
              </div>
              <div>
                <h4 className="font-medium">Upload Your Track</h4>
                <p className="text-gray-400">
                  Drag and drop your audio file (WAV, FLAC, AIFF, or MP3).
                </p>
              </div>
            </li>
            
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
                2
              </div>
              <div>
                <h4 className="font-medium">Share with Others</h4>
                <p className="text-gray-400">
                  Generate a link to share your track with other producers.
                </p>
              </div>
            </li>
            
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-wip-pink flex items-center justify-center font-bold text-black">
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
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
