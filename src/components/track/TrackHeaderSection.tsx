
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, History } from "lucide-react";
import TrackVersionsDrawer from "@/components/track/TrackVersionsDrawer";
import { TrackVersion } from "@/types/track";

interface TrackHeaderSectionProps {
  trackId: string;
  displayName: string;
  isOwner: boolean;
  trackVersions: TrackVersion[];
}

const TrackHeaderSection: React.FC<TrackHeaderSectionProps> = ({
  trackId,
  displayName,
  isOwner,
  trackVersions
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold gradient-text">{displayName}</h1>
      </div>
      
      {isOwner && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex gap-2 items-center"
            onClick={() => navigate(`/track/${trackId}/version`)}
          >
            <ArrowUpCircle className="h-4 w-4" />
            New Version
          </Button>
          
          <TrackVersionsDrawer
            trackId={trackId}
            trackTitle={displayName}
            versions={trackVersions}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex gap-2 items-center"
            >
              <History className="h-4 w-4" />
              Version History
            </Button>
          </TrackVersionsDrawer>
        </div>
      )}
    </div>
  );
};

export default React.memo(TrackHeaderSection);
