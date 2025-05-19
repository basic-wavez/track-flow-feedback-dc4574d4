
import { Playlist } from "@/types/playlist";
import { formatDistanceToNow } from "date-fns";
import { ListMusic, Lock, Globe, ExternalLink, Share2, Play } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import PlaylistShareDialog from "./PlaylistShareDialog";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete?: (playlistId: string) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onDelete }) => {
  const navigate = useNavigate();
  const createdAt = playlist.created_at 
    ? formatDistanceToNow(new Date(playlist.created_at), { addSuffix: true })
    : "Unknown date";

  return (
    <div className="border border-wip-gray rounded-lg p-4 bg-wip-darker hover:bg-wip-dark/50 transition duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <ListMusic className="text-wip-pink w-4 h-4" />
            <h3 className="text-lg font-medium truncate">{playlist.name}</h3>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            Created {createdAt}
            <span className="mx-1">•</span>
            {playlist.is_public ? (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" /> Public
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private
              </span>
            )}
          </div>
        </div>
      </div>
      
      {playlist.description && (
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
          {playlist.description}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate(`/playlist/${playlist.id}/play`)}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/playlist/${playlist.id}`)}
          >
            <ListMusic className="h-4 w-4 mr-1" />
            View
          </Button>
          
          <PlaylistShareDialog 
            playlistId={playlist.id} 
            playlistName={playlist.name}
          >
            <Button 
              variant="outline" 
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </PlaylistShareDialog>
        </div>
        
        {onDelete && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => onDelete(playlist.id)}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default PlaylistCard;
