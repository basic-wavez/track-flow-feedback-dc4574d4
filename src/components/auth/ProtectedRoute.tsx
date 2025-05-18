
import { ReactNode, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const prevUserIdRef = useRef<string | null>(null);
  const authCheckTimeRef = useRef<number>(0);
  const visibilityChangeTimeRef = useRef<number>(0);
  
  // Check if this is a tab visibility change
  const isVisibilityChange = useCallback(() => {
    try {
      const lastVisibilityChangeTime = parseInt(sessionStorage.getItem('last_visibility_change') || '0', 10);
      // If we've had a visibility change in the last 2 seconds, treat this as a visibility event
      const isRecentChange = Date.now() - lastVisibilityChangeTime < 2000;
      if (isRecentChange && lastVisibilityChangeTime > visibilityChangeTimeRef.current) {
        visibilityChangeTimeRef.current = lastVisibilityChangeTime;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, []);
  
  // Memoize the authentication status to prevent unnecessary rerenders
  const authStatus = useMemo(() => {
    const now = Date.now();
    
    // Skip auth check if this is a visibility change and we already checked recently
    if (isVisibilityChange() && now - authCheckTimeRef.current < 5000 && prevUserIdRef.current === (user?.id || null)) {
      return { 
        isAuthenticated: !!user, 
        needsRedirect: false, // Don't redirect during tab changes
        skippedCheck: true 
      };
    }
    
    // Save the current time and user ID
    authCheckTimeRef.current = now;
    prevUserIdRef.current = user?.id || null;
    
    return { 
      isAuthenticated: !!user,
      needsRedirect: authChecked && !user,
      skippedCheck: false
    };
  }, [user, authChecked, isVisibilityChange]);
  
  useEffect(() => {
    // Only log this if not a visibility change to reduce noise
    if (!isVisibilityChange()) {
      console.log("ProtectedRoute - Auth state:", { 
        user: user ? `User: ${user.email}` : "No user", 
        loading, 
        path: location.pathname,
        authChecked,
        timestamp: new Date().toISOString()
      });
    }
    
    // Only set authChecked after loading is complete
    if (!loading) {
      setAuthChecked(true);
    }
  }, [user, loading, location, authChecked, isVisibilityChange]);
  
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
  // And prevent redirects during visibility changes
  if (authStatus.needsRedirect && !isVisibilityChange()) {
    console.log("ProtectedRoute - Redirecting to auth page from:", location.pathname);
    
    // Redirect to auth page with the return URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Only render children when we have a user or we're still checking auth
  return <>{children}</>;
};

export default ProtectedRoute;
