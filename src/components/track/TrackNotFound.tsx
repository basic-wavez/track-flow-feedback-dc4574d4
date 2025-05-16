
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TrackNotFoundProps {
  error?: string | null;
}

const TrackNotFound = ({ error }: TrackNotFoundProps = {}) => {
  const navigate = useNavigate();
  
  const errorMessage = error || "The track you're looking for doesn't exist or has been removed.";
  
  return (
    <div className="text-center p-12">
      <h2 className="text-2xl font-bold mb-4">Track Not Found</h2>
      <p className="text-gray-400 mb-6">
        {errorMessage}
      </p>
      <Button 
        onClick={() => navigate("/")}
        variant="outline"
        className="border-wip-pink text-wip-pink hover:bg-wip-pink/10"
      >
        Back to Home
      </Button>
    </div>
  );
};

export default TrackNotFound;
