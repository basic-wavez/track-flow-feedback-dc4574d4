
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-6">
        <h1 className="text-6xl font-bold mb-4 text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <p className="text-md text-gray-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a 
          href="/" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
