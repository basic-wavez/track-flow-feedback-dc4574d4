
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, User as UserIcon, LayoutDashboard, Music, ListMusic } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNav from "./MobileNav";

const Header = () => {
  const { user, loading, signOut, isAdmin, profile } = useAuth();
  const isMobile = useIsMobile();

  // Get display name for user button
  const getDisplayName = () => {
    // First priority: username from profile if available
    if (profile && profile.username) {
      return profile.username;
    }
    
    // Second priority: email if no username
    if (user && user.email) {
      return user.email;
    }
    
    // Fallback
    return "User";
  };

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
          {!isMobile && user && (
            <>
              <Link
                to="/profile"
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-white hover:text-wip-pink transition-colors"
              >
                <Music className="h-4 w-4 mr-1" />
                My Demos
              </Link>
              
              <Link
                to="/playlists"
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-white hover:text-wip-pink transition-colors"
              >
                <ListMusic className="h-4 w-4 mr-1" />
                Playlists
              </Link>
            </>
          )}
          
          {!isMobile && isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-wip-pink/80 hover:text-wip-pink transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Admin
            </Link>
          )}
          
          {loading ? (
            <Loader2 className="animate-spin text-wip-pink h-5 w-5" />
          ) : user ? (
            <>
              {isMobile && <MobileNav />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="outline-none">
                  <Button 
                    variant="outline" 
                    className="h-9 px-3 text-sm"
                    size="sm"
                  >
                    {getDisplayName()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-wip-dark border border-wip-gray/30"
                >
                  <DropdownMenuLabel className="text-white">
                    {user?.email}
                    {profile?.username && <div className="text-xs text-gray-400">@{profile.username}</div>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-wip-gray/30" />
                  <DropdownMenuItem 
                    className="cursor-pointer text-white hover:bg-wip-gray/10"
                    asChild
                  >
                    <Link to="/profile" className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-white hover:bg-wip-gray/10"
                    asChild
                  >
                    <Link to="/playlists" className="flex items-center">
                      <ListMusic className="mr-2 h-4 w-4" />
                      <span>Playlists</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => signOut()} 
                    className="cursor-pointer text-white hover:bg-wip-gray/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {isMobile && <MobileNav />}
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
