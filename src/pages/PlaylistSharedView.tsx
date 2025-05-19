
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPlaylistByShareKey } from "@/services/playlistShareService";
import { Separator } from "@/components/ui/separator";
import PlaylistTrackList from "@/components/playlist/PlaylistTrackList";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { PlaylistWithTracks } from "@/types/playlist";
import Header from "@/components/layout/Header";
import TrackPlayer from "@/components/TrackPlayer";
import PlaylistSharedLoading from "@/components/playlist/PlaylistSharedLoading";
import PlaylistSharedError from "@/components/playlist/PlaylistSharedError";
import PlaylistSharedHeader from "@/components/playlist/PlaylistSharedHeader";
import PlaylistEmptyState from "@/components/playlist/PlaylistEmptyState";
import { useTrackLoader } from "@/hooks/useTrackLoader";

const PlaylistSharedView = () => {
  const { shareKey } = useParams<{ shareKey: string }>();
  const { setPlaylist, playTrack, currentTrack, currentTrackIndex } = usePlaylistPlayer();
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(true);
  const [playlist, setPlaylistData] = useState<PlaylistWithTracks | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use our new hook to load track data
  const { isLoadingTrack, trackAudioUrl, waveformUrl } = useTrackLoader(currentTrack);

  // Fetch the playlist by share key
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        console.log("Fetching shared playlist with shareKey:", shareKey);
        setIsLoadingPlaylist(true);
        const data = await getPlaylistByShareKey(shareKey || "");
        
        console.log("Playlist data received:", data);
        console.log("Tracks in playlist:", data?.tracks?.length || 0);
        
        setPlaylistData(data);
        
        // Set the playlist in context
        if (data) {
          console.log("Setting playlist in context");
          setPlaylist(data);
        } else {
          console.error("No playlist data returned for shareKey:", shareKey);
          setError("The shared playlist could not be loaded.");
        }
      } catch (err) {
        console.error("Error fetching shared playlist:", err);
        setError(`Failed to load the shared playlist: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoadingPlaylist(false);
      }
    };

    if (shareKey) {
      fetchPlaylist();
    } else {
      console.error("No shareKey provided in URL parameters");
      setError("Invalid share link: No key provided");
      setIsLoadingPlaylist(false);
    }
  }, [shareKey, setPlaylist]);

  // Handle play all button click
  const handlePlayAllClick = () => {
    console.log("Play All button clicked");
    if (playlist && playlist.tracks.length > 0) {
      console.log("Starting playback of first track");
      playTrack(0);
    }
  };

  if (isLoadingPlaylist) {
    return <PlaylistSharedLoading />;
  }

  if (error || !playlist) {
    return <PlaylistSharedError error={error} />;
  }

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <PlaylistSharedHeader playlist={playlist} onPlayAll={handlePlayAllClick} />

        {/* Show player when a track is selected */}
        {currentTrack && (
          <div className="mb-8">
            <TrackPlayer
              trackId={currentTrack.track_id}
              trackName={currentTrack.track?.title || "Unknown Track"}
              audioUrl={trackAudioUrl}
              waveformAnalysisUrl={waveformUrl}
              isPlaylistMode={true}
              currentIndex={currentTrackIndex}
              totalTracks={playlist.tracks.length}
              isLoading={isLoadingTrack}
            />
          </div>
        )}
        
        <Separator className="my-4" />

        {/* Show message when the playlist is empty */}
        {playlist.tracks.length === 0 ? (
          <PlaylistEmptyState />
        ) : (
          <PlaylistTrackList tracks={playlist.tracks} />
        )}
      </div>
    </>
  );
};

export default PlaylistSharedView;
