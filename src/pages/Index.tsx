
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AudioUploader from "@/components/AudioUploader";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import Footer from "@/components/layout/Footer";

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
      console.log("Index - User authenticated, proceeding to navigation");
      setShouldNavigate(true);
    } else {
      console.log("Index - User not authenticated after upload completion");
    }
  }, [user]);
  
  const handleAuthRequired = useCallback(async () => {
    // Double-check current auth state before opening modal
    console.log("Index - Auth required triggered, refreshing session");
    await refreshSession();
    
    // Check again after refresh to make sure we have the most current state
    console.log("Index - Auth required check after refresh:", { 
      isAuthenticated: !!user, 
      willOpenModal: !user 
    });
    
    // Only open auth modal if user is not logged in
    if (!user) {
      console.log("Index - Opening auth modal");
      setIsAuthModalOpen(true);
    } else {
      console.log("Index - User already authenticated, no need for auth modal");
      // If we already have authentication and a track ID, navigate
      if (uploadedTrackId) {
        console.log("Index - Have track ID already, setting navigation flag");
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
      console.log("Index - Auth success with track ID, setting navigation flag");
      setShouldNavigate(true);
    }
  }, [uploadedTrackId]);

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 mb-24">
        <Hero />
        
        <AudioUploader 
          onUploadComplete={handleUploadComplete}
          onAuthRequired={handleAuthRequired}
        />
        
        <HowItWorks />
      </main>
      
      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
