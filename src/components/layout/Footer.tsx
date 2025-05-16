
import { Link } from 'react-router-dom';
import { Bug, Copyright, HelpCircle, Home, Info, MessageSquare } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-6 px-8 border-t border-wip-gray/30">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Main Navigation Links - Left aligned */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Navigation</h3>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-gray-400 hover:text-wip-pink transition-colors flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link to="/about" className="text-sm text-gray-400 hover:text-wip-pink transition-colors flex items-center gap-2">
                <Info className="h-4 w-4" />
                About
              </Link>
            </div>
          </div>
          
          {/* Support Links - Center aligned */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Support</h3>
            <div className="flex flex-col gap-2 items-center">
              <Link to="/faq" className="text-sm text-gray-400 hover:text-wip-pink transition-colors flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </Link>
              <Link to="/contact" className="text-sm text-gray-400 hover:text-wip-pink transition-colors flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Contact Us
              </Link>
              <Link to="/bug-report" className="text-sm text-gray-400 hover:text-wip-pink transition-colors flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Report a Bug
              </Link>
            </div>
          </div>
          
          {/* Legal Links - Right aligned */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Legal</h3>
            <div className="flex flex-col gap-2 items-center md:items-end">
              <Link to="/terms" className="text-sm text-gray-400 hover:text-wip-pink transition-colors flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-sm text-gray-400 hover:text-wip-pink transition-colors flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                Privacy Policy
              </Link>
              <Link to="/cookies" className="text-sm text-gray-400 hover:text-wip-pink transition-colors flex items-center gap-2">
                <Copyright className="h-4 w-4" />
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center md:justify-between items-center pt-4 border-t border-wip-gray/30">
          <p className="text-sm text-gray-400">© 2025 Demo Manager by Basic Wavez</p>
          <div className="hidden md:flex gap-4">
            <Link to="/faq" className="text-sm text-gray-400 hover:text-wip-pink transition-colors">
              <HelpCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
