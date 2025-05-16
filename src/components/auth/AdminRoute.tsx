
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  
  useEffect(() => {
    // Debug logging to help troubleshoot auth state issues
    console.log("AdminRoute - Auth state:", { 
      user: user ? `User: ${user.email}` : "No user",
      isAdmin, 
      loading,
      isCheckingAdmin,
      path: location.pathname,
      authChecked,
      retryCount
    });
    
    // Only check admin status if we have a user and haven't exceeded retry count
    if (user && !loading && !authChecked && retryCount < MAX_RETRIES) {
      setIsCheckingAdmin(true);
      
      // Small timeout to prevent potential race conditions
      const timeoutId = setTimeout(() => {
        console.log("AdminRoute - Checking admin status, retry:", retryCount);
        setRetryCount(prev => prev + 1);
        setIsCheckingAdmin(false);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else if (!loading && !isCheckingAdmin) {
      // Only set authChecked after all loading is complete
      setAuthChecked(true);
    }
  }, [user, isAdmin, loading, isCheckingAdmin, location, authChecked, retryCount]);
  
  if (loading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Checking admin permissions...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect after loading is complete and auth has been checked
  if (authChecked && (!user || !isAdmin)) {
    console.log("AdminRoute - Redirecting to auth page from:", location.pathname);
    // Redirect to home page with the return URL
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  // Only render children when we have a user and isAdmin
  return <>{children}</>;
};

export default AdminRoute;
