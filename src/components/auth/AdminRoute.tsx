
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
  
  useEffect(() => {
    // Debug logging to help troubleshoot auth state issues
    console.log("AdminRoute - Auth state:", { 
      user: user ? `User: ${user.email}` : "No user",
      isAdmin, 
      loading, 
      path: location.pathname,
      authChecked
    });
    
    // Only set authChecked after loading is complete
    if (!loading) {
      setAuthChecked(true);
    }
  }, [user, isAdmin, loading, location, authChecked]);
  
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
  if (authChecked && (!user || !isAdmin)) {
    console.log("AdminRoute - Redirecting to auth page from:", location.pathname);
    // Redirect to home page with the return URL
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  // Only render children when we have a user and isAdmin
  return <>{children}</>;
};

export default AdminRoute;
