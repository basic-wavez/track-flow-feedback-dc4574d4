
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrackVersion } from "@/types/track";
import { formatDistanceToNow } from "date-fns";
import { Clock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TrackVersionItemProps {
  version: TrackVersion;
  trackId: string;
  isCurrent?: boolean;
}

const TrackVersionItem = ({ version, trackId, isCurrent = false }: TrackVersionItemProps) => {
  const navigate = useNavigate();
  
  const isLatest = isCurrent || version.is_latest_version;
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-wip-gray/20 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono border-white text-white">
              v{version.version_number}
            </Badge>
            
            {isLatest && (
              <Badge className="bg-wip-green text-xs">Latest</Badge>
            )}
            
            {version.version_notes && (
              <span className="text-sm text-gray-400 italic">"{version.version_notes}"</span>
            )}
          </div>
          
          <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            {version.created_at && 
              formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="flex gap-1 items-center border-white text-white"
        onClick={() => navigate(`/track/${version.id}`)}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Open
      </Button>
    </div>
  );
};

export default TrackVersionItem;
