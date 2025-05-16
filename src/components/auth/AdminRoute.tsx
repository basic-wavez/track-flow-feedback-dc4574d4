
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
  const [checkAttempts, setCheckAttempts] = useState(0);
  const MAX_CHECK_ATTEMPTS = 3;
  
  useEffect(() => {
    // Debug logging to help troubleshoot auth state
    console.log("AdminRoute - Auth state:", { 
      user: user ? `User: ${user.email}` : "No user",
      isAdmin, 
      loading,
      authChecked,
      checkAttempts,
      path: location.pathname
    });
    
    // If we're still loading or we've already completed our check, do nothing
    if (loading || authChecked) {
      return;
    }
    
    // If we have no user or already know they're not admin, mark check as complete
    if (!user || isAdmin === false) {
      console.log("AdminRoute - No user or not admin, check complete");
      setAuthChecked(true);
      return;
    }
    
    // If we know they're admin, mark check as complete
    if (isAdmin === true) {
      console.log("AdminRoute - User is admin, check complete");
      setAuthChecked(true);
      return;
    }
    
    // Only increment check attempts if we're still trying to determine admin status
    // and haven't exceeded max attempts
    if (user && isAdmin === undefined && checkAttempts < MAX_CHECK_ATTEMPTS) {
      console.log(`AdminRoute - Admin check attempt ${checkAttempts + 1}/${MAX_CHECK_ATTEMPTS}`);
      // Set a small delay to prevent immediate re-renders
      const timer = setTimeout(() => {
        setCheckAttempts(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // If we've exceeded max attempts and still haven't determined admin status,
    // consider the check complete to prevent infinite loop
    if (checkAttempts >= MAX_CHECK_ATTEMPTS) {
      console.log("AdminRoute - Max admin check attempts reached, forcing check completion");
      setAuthChecked(true);
    }
  }, [user, isAdmin, loading, location, authChecked, checkAttempts]);
  
  // Show loading state while we're determining admin status
  if (loading || (user && !authChecked)) {
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
