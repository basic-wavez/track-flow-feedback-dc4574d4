
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, loading, signOut, isAdmin } = useAuth();

  // Extract initials for avatar fallback
  const getInitials = () => {
    if (!user || !user.email) return "?";
    return user.email.substring(0, 2).toUpperCase();
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
          {isAdmin && (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="outline-none">
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9 border border-wip-gray/30">
                    <AvatarImage src="..." />
                    <AvatarFallback className="bg-wip-dark text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-wip-dark border border-wip-gray/30"
              >
                <DropdownMenuLabel className="text-white">
                  {user?.email}
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
                  onClick={() => signOut()} 
                  className="cursor-pointer text-white hover:bg-wip-gray/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
