
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    navigate("/");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        {user?.email}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </Button>
    </div>
  );
};

export default Profile;
