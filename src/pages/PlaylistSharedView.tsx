
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlaylistByShareKey } from "@/services/playlistShareService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ListMusic } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import PlaylistTrackList from "@/components/playlist/PlaylistTrackList";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { PlaylistWithTracks } from "@/types/playlist";
import Header from "@/components/layout/Header";
import TrackPlayer from "@/components/TrackPlayer";
import { getTrack } from "@/services/trackQueryService";
import { handleError } from "@/utils/errorHandler";

const PlaylistSharedView = () => {
  const { shareKey } = useParams<{ shareKey: string }>();
  const navigate = useNavigate();
  const { setPlaylist, playTrack, currentTrack, isPlaying, currentTrackIndex } = usePlaylistPlayer();
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(true);
  const [playlist, setPlaylistData] = useState<PlaylistWithTracks | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [trackAudioUrl, setTrackAudioUrl] = useState<string | undefined>();
  const [waveformUrl, setWaveformUrl] = useState<string | undefined>();

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

  // Load detailed track data when current track changes
  useEffect(() => {
    const loadTrackData = async () => {
      if (currentTrack?.track_id) {
        console.log("Loading track data for track_id:", currentTrack.track_id);
        setIsLoadingTrack(true);
        try {
          const trackData = await getTrack(currentTrack.track_id);
          console.log("Track data loaded:", trackData);
          
          if (trackData) {
            // Use the best available URL - prefer mp3, then opus, then compressed, then original
            const audioUrl = trackData.mp3_url || 
                          trackData.opus_url || 
                          trackData.compressed_url || 
                          trackData.original_url;
            
            // Set the waveform URL - prefer mp3, then compressed
            const waveformAnalysisUrl = trackData.mp3_url || trackData.compressed_url;
            
            console.log("Using audio URL:", audioUrl);
            console.log("Using waveform URL:", waveformAnalysisUrl);
            
            setTrackAudioUrl(audioUrl);
            setWaveformUrl(waveformAnalysisUrl);
            
            if (!audioUrl) {
              console.error("No audio URL available for track:", currentTrack.track_id);
            }
          } else {
            console.error("No track data returned for track_id:", currentTrack.track_id);
          }
        } catch (error) {
          console.error("Error loading track data:", error);
          handleError(error, "Track Loading Error", "Could not load track data");
        } finally {
          setIsLoadingTrack(false);
        }
      }
    };
    
    loadTrackData();
  }, [currentTrack]);

  // Handle play all button click
  const handlePlayAllClick = () => {
    console.log("Play All button clicked");
    if (playlist && playlist.tracks.length > 0) {
      console.log("Starting playback of first track");
      playTrack(0);
    }
  };

  if (isLoadingPlaylist) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-64 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 w-40 bg-gray-700 rounded"></div>
              <div className="mt-8 text-gray-400">Loading shared playlist...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !playlist) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-2 text-red-500">Error loading shared playlist</h2>
            <p className="text-gray-400 mb-6">{error || "This playlist might not exist or has been deleted."}</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-8">
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
            onClick={handlePlayAllClick} 
            size="lg" 
            disabled={playlist.tracks.length === 0}
          >
            <ListMusic className="h-4 w-4 mr-1" />
            Play All
          </Button>
        </div>

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
          <div className="text-center py-16 border border-dashed border-wip-gray rounded-lg bg-wip-darker">
            <h3 className="text-xl font-medium mb-2">This Playlist is Empty</h3>
            <p className="text-gray-400">The owner hasn't added any tracks yet.</p>
          </div>
        ) : (
          <PlaylistTrackList tracks={playlist.tracks} />
        )}
      </div>
    </>
  );
};

export default PlaylistSharedView;
