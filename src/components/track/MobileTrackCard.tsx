
import { formatDistanceToNow } from "date-fns";
import { Clock, Share2, ExternalLink, FilePlus, Trash2, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import TrackVersionsDrawer from "./TrackVersionsDrawer";
import { TrackWithVersions } from "@/types/track";

interface MobileTrackCardProps {
  track: TrackWithVersions;
  onShareTrack: (trackId: string) => void;
  onDeletePrompt: (trackId: string, title: string) => void;
}

const MobileTrackCard = ({ 
  track, 
  onShareTrack, 
  onDeletePrompt 
}: MobileTrackCardProps) => {
  const navigate = useNavigate();
  
  const handleOpenTrack = (trackId: string) => {
    navigate(`/track/${trackId}`);
  };
  
  return (
    <div className="p-4 border border-wip-gray/30 rounded-md mb-3 bg-wip-darker">
      <div className="mb-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium line-clamp-2">{track.title}</h3>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-wip-darker border-wip-gray">
              <DropdownMenuItem 
                className="flex gap-2 cursor-pointer"
                onClick={() => handleOpenTrack(track.versions.find(v => v.is_latest_version)?.id || track.id)}
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex gap-2 cursor-pointer"
                onClick={() => onShareTrack(track.versions.find(v => v.is_latest_version)?.id || track.id)}
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex gap-2 cursor-pointer"
                onClick={() => navigate(`/track/${track.id}/version`)}
              >
                <FilePlus className="h-4 w-4" />
                <span>New Version</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => onDeletePrompt(track.id, track.title)}
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(new Date(track.created_at || ""), { addSuffix: true })}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 text-sm mb-3">
        <div className="flex items-center">
          <span className="text-gray-400 mr-2">Feedback:</span>
          <Badge variant="outline">
            {track.feedbackCount} {track.feedbackCount === 1 ? 'review' : 'reviews'}
          </Badge>
        </div>
        
        <div className="flex items-center">
          <span className="text-gray-400 mr-2">Versions:</span>
          {track.versions.length > 1 ? (
            <TrackVersionsDrawer 
              trackId={track.id}
              trackTitle={track.title}
              versions={track.versions}
            >
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-6 px-2 py-0"
              >
                <History className="h-3 w-3" />
                <span className="text-xs">View All ({track.versions.length})</span>
              </Button>
            </TrackVersionsDrawer>
          ) : (
            <Badge variant="outline">v{track.versions[0]?.version_number || 1}</Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileTrackCard;
