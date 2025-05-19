
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ListMusic, Upload } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Profile from "@/components/auth/Profile";

// Simple Logo component since it's missing
const Logo = ({ className }: { className?: string }) => (
  <div className={`font-bold text-xl ${className}`}>Demo Manager</div>
);

const Navigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Don't show navigation on mobile - we have a separate MobileNav component
  if (isMobile) return null;

  return (
    <header className="border-b border-wip-gray">
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <Logo className="h-8 w-auto" />
            </Link>

            <nav className="hidden md:flex items-center space-x-4">
              {user && (
                <>
                  <Link
                    to="/playlists"
                    className="text-sm font-medium hover:text-wip-pink transition-colors flex items-center"
                  >
                    <ListMusic className="h-4 w-4 mr-1" />
                    <span>Playlists</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="text-sm font-medium hover:text-wip-pink transition-colors"
                  >
                    My Profile
                  </Link>
                </>
              )}
              <Link
                to="/about"
                className="text-sm font-medium hover:text-wip-pink transition-colors"
              >
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  variant="default"
                  onClick={() => navigate("/")}
                  className="bg-wip-pink hover:bg-wip-pink/90"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <Profile />
              </>
            ) : (
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
