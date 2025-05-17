
import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  Menu, 
  Music, 
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileNav = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  
  // Helper function to check if a path is active
  const isActivePath = (path: string) => location.pathname === path;
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
          <Menu className="h-5 w-5 text-white" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[80%] bg-wip-dark border-wip-gray/30 py-8">
        <nav className="flex flex-col space-y-6">
          <Link
            to="/"
            className={`flex items-center px-2 py-3 text-base font-medium rounded-md ${
              isActivePath('/') ? 'text-wip-pink bg-wip-gray/10' : 'text-gray-300 hover:text-wip-pink'
            }`}
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          
          {user && (
            <>
              <Link
                to="/profile"
                className={`flex items-center px-2 py-3 text-base font-medium rounded-md ${
                  isActivePath('/profile') ? 'text-wip-pink bg-wip-gray/10' : 'text-gray-300 hover:text-wip-pink'
                }`}
                onClick={() => setOpen(false)}
              >
                <User className="h-5 w-5 mr-3" />
                My Profile
              </Link>
              
              <Link
                to="/profile"
                className={`flex items-center px-2 py-3 text-base font-medium rounded-md ${
                  isActivePath('/profile') ? 'text-wip-pink bg-wip-gray/10' : 'text-gray-300 hover:text-wip-pink'
                }`}
                onClick={() => setOpen(false)}
              >
                <Music className="h-5 w-5 mr-3" />
                My Demos
              </Link>
            </>
          )}
          
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center px-2 py-3 text-base font-medium rounded-md ${
                isActivePath('/admin') ? 'text-wip-pink bg-wip-gray/10' : 'text-wip-pink/80 hover:text-wip-pink'
              }`}
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Admin
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
