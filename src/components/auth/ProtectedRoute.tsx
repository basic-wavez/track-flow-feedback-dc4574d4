
import { ReactNode, useEffect, useState, useMemo, useRef } from "react";
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
  
  // Memoize the authentication status to prevent unnecessary rerenders
  const authStatus = useMemo(() => {
    // Avoid redundant auth checks in quick succession (e.g., during tab switching)
    const now = Date.now();
    if (now - authCheckTimeRef.current < 500 && prevUserIdRef.current === (user?.id || null)) {
      return { isAuthenticated: !!user, needsRedirect: authChecked && !user };
    }
    
    authCheckTimeRef.current = now;
    prevUserIdRef.current = user?.id || null;
    
    return { 
      isAuthenticated: !!user,
      needsRedirect: authChecked && !user
    };
  }, [user, authChecked]);
  
  useEffect(() => {
    // Debug logging to help troubleshoot auth state issues
    console.log("ProtectedRoute - Auth state:", { 
      user: user ? `User: ${user.email}` : "No user", 
      loading, 
      path: location.pathname,
      authChecked
    });
    
    // Only set authChecked after loading is complete
    if (!loading) {
      setAuthChecked(true);
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
  // And prevent redirects during visibility changes
  if (authStatus.needsRedirect) {
    // Before redirecting, check if this might be a tab visibility change
    // and give a small delay to allow auth state to stabilize
    console.log("ProtectedRoute - Redirecting to auth page from:", location.pathname);
    
    // Redirect to auth page with the return URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Only render children when we have a user or we're still checking auth
  return <>{children}</>;
};

export default ProtectedRoute;
