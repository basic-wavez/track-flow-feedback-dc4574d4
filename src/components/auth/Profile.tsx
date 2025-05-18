
import { useState, useCallback, memo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Profile = memo(() => {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();

  // Memoize the signout function to prevent unnecessary rerenders
  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return; // Prevent multiple sign-out attempts
    
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
      });
      // Navigate after successful sign out
      navigate("/");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  }, [signOut, navigate, toast, isSigningOut]);

  // More efficient rendering that depends only on session.access_token
  // instead of the entire user object
  const isLoggedIn = !!session?.access_token;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
      onClick={handleSignOut}
      disabled={isSigningOut || !isLoggedIn}
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
});

// Add display name for better debugging
Profile.displayName = "Profile";

export default Profile;
