
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";

interface PlaylistSharedErrorProps {
  error: string | null;
}

const PlaylistSharedError = ({ error }: PlaylistSharedErrorProps) => {
  const navigate = useNavigate();
  
  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2 text-red-500">Error loading shared playlist</h2>
          <p className="text-gray-400 mb-6">{error || "This playlist might not exist or has been deleted."}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Button>
        </div>
      </div>
    </>
  );
};

export default PlaylistSharedError;
