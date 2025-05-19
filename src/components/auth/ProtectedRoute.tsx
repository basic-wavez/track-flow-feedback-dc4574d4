
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
  
  // Check if we're on a shared route that should be publicly accessible
  const isSharedRoute = location.pathname.includes('/shared/');
  
  // User ID for dependency tracking rather than the full user object
  const userId = user?.id;
  
  useEffect(() => {
    // Only log and set authChecked if this is the first check or if visibility is visible
    if ((!initialCheckDoneRef.current || document.visibilityState === 'visible') && !loading) {
      // Debug logging to help troubleshoot auth state issues
      console.log("ProtectedRoute - Auth state:", { 
        user: userId ? `User: ${user?.email}` : "No user", 
        loading, 
        path: location.pathname,
        authChecked,
        visibilityState: document.visibilityState,
        isSharedRoute
      });
      
      // Only set authChecked after loading is complete
      setAuthChecked(true);
      initialCheckDoneRef.current = true;
    }
  }, [userId, loading, location, authChecked, isSharedRoute]); // Changed from user to userId and added isSharedRoute
  
  // Use a ref to prevent re-rendering the loading state on tab visibility changes
  const renderedLoadingRef = useRef(false);
  
  if (loading && !renderedLoadingRef.current) {
    renderedLoadingRef.current = true;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Allow access to shared routes without authentication
  if (isSharedRoute) {
    return <>{children}</>;
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
