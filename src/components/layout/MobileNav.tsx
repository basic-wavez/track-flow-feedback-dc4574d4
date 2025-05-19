
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Home, Upload, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import Profile from "@/components/auth/Profile";

const MobileNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Only show on mobile
  if (!isMobile) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <header className="border-b border-wip-gray">
      <div className="container px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Demo Manager
          </Link>

          <div className="flex items-center space-x-2">
            {user && (
              <Button
                variant="default"
                onClick={() => navigate("/")}
                className="bg-wip-pink hover:bg-wip-pink/90"
                size="sm"
              >
                <Upload className="h-4 w-4" />
                <span className="sr-only">Upload</span>
              </Button>
            )}

            <Profile />
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileNav;
