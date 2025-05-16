
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilePlus, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VersionControlsProps {
  trackId: string;
  title: string;
  versionNumber: number;
  isOwner: boolean;
  hasParentTrack: boolean;
}

const VersionControls = ({ 
  trackId, 
  title, 
  versionNumber, 
  isOwner,
  hasParentTrack 
}: VersionControlsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold gradient-text">{title}</h1>
        <Badge variant="outline" className="text-xs font-mono">
          v{versionNumber}
        </Badge>
      </div>
      
      {isOwner && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex gap-2 items-center"
            onClick={() => navigate(`/track/${trackId}/version`)}
          >
            <FilePlus className="h-4 w-4" />
            New Version
          </Button>
          
          {hasParentTrack && (
            <Button
              variant="outline"
              size="sm"
              className="flex gap-2 items-center"
              onClick={() => navigate(`/profile`)}
            >
              <History className="h-4 w-4" />
              View History
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionControls;
