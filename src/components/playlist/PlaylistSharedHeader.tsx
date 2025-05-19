
import { Button } from "@/components/ui/button";
import { ListMusic } from "lucide-react";
import { PlaylistWithTracks } from "@/types/playlist";

interface PlaylistSharedHeaderProps {
  playlist: PlaylistWithTracks;
  onPlayAll: () => void;
}

const PlaylistSharedHeader = ({ playlist, onPlayAll }: PlaylistSharedHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ListMusic className="text-wip-pink h-6 w-6" />
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
        </div>
        
        {playlist.description && (
          <p className="text-gray-300 mb-2">{playlist.description}</p>
        )}
        
        <p className="text-sm text-gray-400">
          {playlist.tracks.length} tracks
        </p>
      </div>

      <Button 
        onClick={onPlayAll} 
        size="lg" 
        disabled={playlist.tracks.length === 0}
      >
        <ListMusic className="h-4 w-4 mr-1" />
        Play All
      </Button>
    </div>
  );
};

export default PlaylistSharedHeader;
