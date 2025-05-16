
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";
import Profile from "@/components/auth/Profile";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="py-6 px-8 flex justify-between items-center border-b border-wip-gray/30">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/9e167482-9f73-4eb4-9bb0-fa8641a7551b.png" 
          alt="DEMO4U Logo" 
          className="h-10 cursor-pointer" 
          onClick={() => navigate("/")}
        />
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2 text-wip-pink hover:bg-wip-pink/10"
            onClick={() => navigate("/profile")}
          >
            <User size={16} />
            <span>My Profile</span>
          </Button>
        )}
        
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
  );
};

export default Header;
