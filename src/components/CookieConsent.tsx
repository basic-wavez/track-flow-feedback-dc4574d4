
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Check if the user has already accepted cookies
    const hasConsented = localStorage.getItem("cookieConsent");
    
    // If no consent found, show the banner after a short delay
    if (!hasConsented) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const acceptAll = () => {
    localStorage.setItem("cookieConsent", "all");
    setShowBanner(false);
  };
  
  const acceptNecessary = () => {
    localStorage.setItem("cookieConsent", "necessary");
    setShowBanner(false);
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-opacity-95 backdrop-blur-sm bg-supabase-darker border-t border-supabase-border p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Cookie className="h-5 w-5 text-wip-pink flex-shrink-0 mt-1" />
          <div>
            <p className="text-sm text-gray-300">
              We use cookies to enhance your browsing experience, analyze site traffic, and improve our services.
              By clicking "Accept All", you consent to our use of cookies. Learn more in our{" "}
              <Link to="/cookies" className="text-wip-pink hover:underline">Cookie Policy</Link>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 ml-0 md:ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={acceptNecessary}
            className="text-xs whitespace-nowrap"
          >
            Necessary Only
          </Button>
          <Button
            size="sm"
            onClick={acceptAll}
            className="bg-wip-pink hover:bg-wip-pink/80 text-white text-xs whitespace-nowrap"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
