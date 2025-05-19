import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlaylistTrack } from "@/types/playlist";
import { useAuth } from "@/context/AuthContext";
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  GripVertical, 
  ExternalLink, 
  Globe, 
  Lock,
  Play
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const PlaylistView = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { 
    getPlaylist,
    removeTrackFromPlaylist,
  } = usePlaylists();
  
  // Use the getPlaylist hook with the playlistId
  const { 
    data: playlist,
    isLoading,
    error
  } = getPlaylist(playlistId || "");

  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-pulse">Loading playlist...</div>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2 text-red-500">Error loading playlist</h2>
          <p className="text-gray-400 mb-6">This playlist might not exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/playlists')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Playlists
          </Button>
        </div>
      </div>
    );
  }

  const handleRemoveTrack = async (trackId: string) => {
    await removeTrackFromPlaylist({
      playlistId: playlist.id,
      trackId
    });
  };

  const isOwner = user && playlist.user_id === user.id;
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate('/playlists')}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Playlists
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{playlist.name}</h1>
            {playlist.is_public ? (
              <Globe className="h-4 w-4 text-gray-400" />
            ) : (
              <Lock className="h-4 w-4 text-gray-400" />
            )}
          </div>
          {playlist.description && (
            <p className="text-gray-300 mt-1">{playlist.description}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          {playlist.tracks.length > 0 && (
            <Button 
              variant="secondary"
              onClick={() => navigate(`/playlist/${playlist.id}/play`)}
            >
              <Play className="h-4 w-4 mr-1" />
              Play Playlist
            </Button>
          )}
          
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-wip-dark border-wip-gray">
                <DropdownMenuItem onClick={() => navigate(`/playlist/${playlist.id}/edit`)}>
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/playlist/${playlist.id}/add-tracks`)}>
                  Add Tracks
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this playlist?")) {
                      // Delete functionality to be implemented
                    }
                  }}
                >
                  Delete Playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {playlist.tracks.length === 0 ? (
        
        <div className="text-center py-16 border border-dashed border-wip-gray rounded-lg bg-wip-darker">
          <h3 className="text-xl font-medium mb-2">This Playlist is Empty</h3>
          <p className="text-gray-400 mb-6">Add some tracks to get started.</p>
          {isOwner && (
            <Button onClick={() => navigate(`/playlist/${playlist.id}/add-tracks`)}>
              Add Tracks
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {playlist.tracks.map((item) => (
            <PlaylistTrackItem
              key={item.id}
              track={item}
              isOwner={isOwner}
              onRemove={() => handleRemoveTrack(item.track_id)}
              onOpen={() => navigate(`/track/${item.track_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component for displaying a track in the playlist

interface PlaylistTrackItemProps {
  track: PlaylistTrack;
  isOwner: boolean;
  onRemove: () => void;
  onOpen: () => void;
}

const PlaylistTrackItem: React.FC<PlaylistTrackItemProps> = ({ 
  track, 
  isOwner, 
  onRemove,
  onOpen
}) => {
  return (
    <div className="flex items-center border border-wip-gray rounded-md px-4 py-3 bg-wip-darker hover:bg-wip-dark/50 transition-colors">
      <div className="flex items-center gap-2 text-gray-400 mr-3">
        <span className="w-6 text-center">{track.position + 1}</span>
        {isOwner && <GripVertical className="h-4 w-4 cursor-move" />}
      </div>
      
      <div className="flex-grow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
          <div>
            <h3 className="font-medium">
              {track.track?.title || "Unknown Track"}
            </h3>
            <span className="text-xs text-gray-400">
              {track.track?.original_filename || "Unknown file"}
              {track.track?.version_number > 1 && ` (v${track.track?.version_number})`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={onOpen}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Open
            </Button>
            
            {isOwner && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistView;
