
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePlaylists } from "@/hooks/usePlaylists";
import { getUserTracks } from "@/services/trackService";
import { TrackData } from "@/types/track";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AddTracksToPlaylist = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  
  const { getPlaylist, addTrackToPlaylist } = usePlaylists();
  const { 
    data: playlist,
    isLoading: isLoadingPlaylist,
  } = getPlaylist(playlistId || "");

  // Redirect if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Fetch user tracks on mount
  useEffect(() => {
    const loadTracks = async () => {
      setIsLoading(true);
      try {
        const userTracks = await getUserTracks();
        // Ensure we get TrackData compatible objects
        setTracks(userTracks.map(track => ({
          id: track.id,
          title: track.title,
          original_filename: track.original_filename,
          compressed_url: track.compressed_url || '',
          user_id: track.user_id || '',
          version_number: track.version_number || 1,
          is_latest_version: track.is_latest_version || false
        })));
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTracks();
  }, []);

  // Check if track is already in playlist
  const isTrackInPlaylist = (trackId: string): boolean => {
    if (!playlist) return false;
    return playlist.tracks.some(track => track.track_id === trackId);
  };

  // Toggle track selection
  const toggleTrack = (trackId: string) => {
    const newSelection = new Set(selectedTracks);
    if (newSelection.has(trackId)) {
      newSelection.delete(trackId);
    } else {
      newSelection.add(trackId);
    }
    setSelectedTracks(newSelection);
  };

  // Add selected tracks to playlist
  const handleAddTracks = async () => {
    if (!playlist || selectedTracks.size === 0) return;
    
    setIsAdding(true);
    
    try {
      // Add each track
      for (const trackId of selectedTracks) {
        await addTrackToPlaylist({
          playlistId: playlist.id,
          trackId
        });
      }
      
      // Navigate back to playlist
      navigate(`/playlist/${playlist.id}`);
    } catch (error) {
      console.error("Error adding tracks:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Handle loading and error states
  if (isLoadingPlaylist) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-pulse">Loading playlist...</div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2 text-red-500">Playlist not found</h2>
          <Button onClick={() => navigate('/playlists')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Playlists
          </Button>
        </div>
      </div>
    );
  }

  // Check ownership
  const isOwner = user && playlist.user_id === user.id;
  if (!isOwner) {
    navigate(`/playlist/${playlist.id}`);
    return null;
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate(`/playlist/${playlist.id}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Playlist
      </Button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Tracks to "{playlist.name}"</h1>
        <p className="text-gray-300 mt-1">Select tracks to add to your playlist</p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <Badge variant="outline" className="text-wip-pink">
            {selectedTracks.size} tracks selected
          </Badge>
        </div>
        
        <Button 
          onClick={handleAddTracks} 
          disabled={selectedTracks.size === 0 || isAdding}
        >
          {isAdding ? (
            "Adding tracks..."
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Add Selected Tracks
            </>
          )}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse">Loading tracks...</div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-wip-gray rounded-lg bg-wip-darker">
          <h3 className="text-xl font-medium mb-2">No Tracks Found</h3>
          <p className="text-gray-400">You haven't uploaded any tracks yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => {
            const isInPlaylist = isTrackInPlaylist(track.id);
            const isSelected = selectedTracks.has(track.id);
            
            return (
              <div 
                key={track.id}
                className={`
                  flex items-center border border-wip-gray rounded-md px-4 py-3
                  ${isInPlaylist ? 'bg-wip-dark/20 opacity-50' : 'bg-wip-darker hover:bg-wip-dark/50'} 
                  ${isSelected ? 'ring-2 ring-wip-pink' : ''} 
                  transition-colors
                `}
                onClick={() => {
                  if (!isInPlaylist) toggleTrack(track.id);
                }}
              >
                <div className="w-8 mr-3 flex justify-center">
                  {isInPlaylist ? (
                    <span className="text-gray-400 text-sm">Added</span>
                  ) : isSelected ? (
                    <Check className="h-5 w-5 text-wip-pink" />
                  ) : (
                    <div className="h-5 w-5 border border-wip-gray rounded-sm" />
                  )}
                </div>
                
                <div className="flex-grow">
                  <h3 className="font-medium">
                    {track.title}
                    {track.version_number > 1 && (
                      <span className="ml-1 text-sm text-gray-400">
                        (v{track.version_number})
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {track.original_filename}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleAddTracks} 
          disabled={selectedTracks.size === 0 || isAdding}
        >
          {isAdding ? (
            "Adding tracks..."
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Add Selected Tracks ({selectedTracks.size})
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AddTracksToPlaylist;
