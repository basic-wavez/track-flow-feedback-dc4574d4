
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Button } from "@/components/ui/button";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { ArrowLeft } from "lucide-react";
import TrackPlayer from "@/components/TrackPlayer";
import PlaylistTrackList from "@/components/playlist/PlaylistTrackList";
import { PlaylistWithTracks } from "@/types/playlist";
import { Separator } from "@/components/ui/separator";

const PlaylistPlayerView = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { getPlaylist } = usePlaylists();
  const { 
    setPlaylist, 
    currentTrack,
    playlist: activePlaylist,
    currentTrackIndex,
    isPlaying
  } = usePlaylistPlayer();
  
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Fetch the playlist data
  const { 
    data: playlistData,
    isLoading,
    error
  } = getPlaylist(playlistId || "");
  
  // Set the playlist in the context when data is loaded
  useEffect(() => {
    if (playlistData && initialLoad) {
      setPlaylist(playlistData);
      setInitialLoad(false);
    }
  }, [playlistData, setPlaylist, initialLoad]);

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

  if (error || !playlistData) {
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

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => navigate(`/playlist/${playlistId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div>
          <h1 className="text-xl font-bold">{playlistData.name}</h1>
          <p className="text-sm text-gray-400">
            {playlistData.tracks.length} tracks
          </p>
        </div>
      </div>
      
      {/* Show the player only when a track is selected */}
      {currentTrack && (
        <div className="mb-8">
          <TrackPlayer
            trackId={currentTrack.track_id}
            trackName={currentTrack.track?.title || "Unknown Track"}
            mp3Url={`/api/tracks/${currentTrack.track_id}/mp3`} // This is a placeholder, replace with actual URL
            isPlaylistMode={true}
            currentIndex={currentTrackIndex}
            totalTracks={playlistData.tracks.length}
          />
        </div>
      )}
      
      <Separator className="my-4" />
      
      {/* Show message when the playlist is empty */}
      {playlistData.tracks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-wip-gray rounded-lg bg-wip-darker">
          <h3 className="text-xl font-medium mb-2">This Playlist is Empty</h3>
          <p className="text-gray-400 mb-6">Add some tracks to get started.</p>
          <Button onClick={() => navigate(`/playlist/${playlistId}/add-tracks`)}>
            Add Tracks
          </Button>
        </div>
      ) : (
        <PlaylistTrackList tracks={playlistData.tracks} />
      )}
    </div>
  );
};

export default PlaylistPlayerView;
