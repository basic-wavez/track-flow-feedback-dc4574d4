
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Check if we're on a shared route
  const isSharedRoute = location.pathname.includes('/shared/');

  return (
    <header className="bg-wip-dark border-b border-wip-gray/30">
      <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
        <Link 
          to="/"
          className="text-xl font-bold text-white flex items-center space-x-2"
        >
          <span className="text-wip-pink">Demo</span>
          <span>Manager</span>
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to="/profile"
                className="text-sm font-medium text-white hover:text-wip-pink transition-colors"
              >
                My Library
              </Link>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                {!isMobile && <span>Sign Out</span>}
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
