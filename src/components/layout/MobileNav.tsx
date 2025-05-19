
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Home, Menu, Upload, User, X } from "lucide-react";
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

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[80vw] bg-wip-dark border-wip-gray">
                <div className="flex flex-col gap-6 h-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2"
                      onClick={() => handleNavigation("/")}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                    
                    {user ? (
                      <>
                        {/* Removed the Playlists button here */}
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-2"
                          onClick={() => handleNavigation("/profile")}
                        >
                          <User className="h-4 w-4 mr-2" />
                          My Profile
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="w-full mt-4"
                        onClick={() => handleNavigation("/auth")}
                      >
                        Sign In
                      </Button>
                    )}
                  </div>
                  
                  {user && (
                    <div className="mt-auto">
                      <Profile />
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileNav;
