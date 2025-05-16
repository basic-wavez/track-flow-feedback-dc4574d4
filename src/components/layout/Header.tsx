
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";
import Profile from "@/components/auth/Profile";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  // Fetch username when user loads or changes
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) {
        setUsername(null);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching username:", error);
          return;
        }
        
        setUsername(data?.username || 'User');
      } catch (error) {
        console.error("Failed to fetch username:", error);
      }
    };
    
    fetchUsername();
  }, [user]);

  return (
    <header className="py-6 px-8 flex justify-between items-center border-b border-wip-gray/30">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/e6c4664d-7099-4ef1-aa3a-945789a5ee5a.png" 
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
            <span>{username || 'My Profile'}</span>
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
