
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Profile from "@/components/auth/Profile";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
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
  );
};

export default Header;
