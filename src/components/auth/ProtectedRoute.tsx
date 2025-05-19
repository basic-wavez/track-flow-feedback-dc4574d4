
import { ReactNode, useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const initialCheckDoneRef = useRef(false);
  
  useEffect(() => {
    // Only log and set authChecked if this is the first check or if visibility is visible
    if (!initialCheckDoneRef.current || document.visibilityState === 'visible') {
      // Debug logging to help troubleshoot auth state issues
      console.log("ProtectedRoute - Auth state:", { 
        user: user ? `User: ${user.email}` : "No user", 
        loading, 
        path: location.pathname,
        authChecked,
        visibilityState: document.visibilityState
      });
      
      // Only set authChecked after loading is complete
      if (!loading) {
        setAuthChecked(true);
        initialCheckDoneRef.current = true;
      }
    }
  }, [user, loading, location, authChecked]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect after loading is complete and auth has been checked
  if (authChecked && !user) {
    console.log("ProtectedRoute - Redirecting to auth page from:", location.pathname);
    // Redirect to auth page with the return URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Only render children when we have a user or we're still checking auth
  return <>{children}</>;
};

export default ProtectedRoute;
