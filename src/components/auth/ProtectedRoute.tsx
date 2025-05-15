
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Debug logging to help troubleshoot auth state issues
    console.log("ProtectedRoute - Auth state:", { 
      user: user ? `User: ${user.email}` : "No user", 
      loading, 
      path: location.pathname 
    });
    
    // If user becomes null after loading is complete, redirect to auth page
    if (!loading && !user) {
      console.log("ProtectedRoute - Redirecting to auth page");
      navigate("/auth", { state: { from: location }, replace: true });
    }
  }, [user, loading, location, navigate]);
  
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
  
  if (!user) {
    // Redirect to auth page with the return URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
