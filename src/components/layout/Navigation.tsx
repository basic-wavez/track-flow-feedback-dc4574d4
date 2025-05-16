
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Bug, HelpCircle, Info, MessageSquare, LayoutDashboard } from "lucide-react";

const Navigation = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-wip-dark border-b border-wip-gray/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-12">
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-wip-pink border-b-2 ${
                location.pathname === '/' ? 'border-wip-pink text-wip-pink' : 'border-transparent'
              } hover:border-wip-pink transition-colors`}
            >
              Home
            </Link>
            
            <Link
              to="/about"
              className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-wip-pink border-b-2 ${
                location.pathname === '/about' ? 'border-wip-pink text-wip-pink' : 'border-transparent'
              } hover:border-wip-pink transition-colors`}
            >
              <Info className="h-4 w-4 mr-1" />
              About
            </Link>
            
            <div className="relative group">
              <button className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-wip-pink border-b-2 border-transparent hover:border-wip-pink transition-colors">
                <HelpCircle className="h-4 w-4 mr-1" />
                Support
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-supabase-darker border border-supabase-border rounded-md shadow-lg z-10 hidden group-hover:block">
                <div className="py-1">
                  <Link
                    to="/faq"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-wip-pink/10 hover:text-wip-pink"
                  >
                    FAQ
                  </Link>
                  <Link
                    to="/contact"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-wip-pink/10 hover:text-wip-pink"
                  >
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Contact Us
                  </Link>
                  <Link
                    to="/bug-report"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-wip-pink/10 hover:text-wip-pink"
                  >
                    <Bug className="h-4 w-4 inline mr-1" />
                    Report a Bug
                  </Link>
                </div>
              </div>
            </div>
            
            {user && (
              <Link
                to="/profile"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-wip-pink border-b-2 ${
                  location.pathname === '/profile' ? 'border-wip-pink text-wip-pink' : 'border-transparent'
                } hover:border-wip-pink transition-colors`}
              >
                My Demos
              </Link>
            )}
            
            {isAdmin && (
              <Link
                to="/admin"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/admin' ? 'text-wip-pink border-wip-pink' : 'text-wip-pink/80 border-transparent'
                } border-b-2 hover:text-wip-pink hover:border-wip-pink transition-colors`}
              >
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
