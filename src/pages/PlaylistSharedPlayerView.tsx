import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { ArrowLeft } from "lucide-react";
import TrackPlayer from "@/components/TrackPlayer";
import PlaylistTrackList from "@/components/playlist/PlaylistTrackList";
import { Separator } from "@/components/ui/separator";
import { getTrack } from "@/services/trackQueryService";
import { getPlaylistByShareKey } from "@/services/playlistShareService";
import { PlaylistWithTracks } from "@/types/playlist";
import Header from "@/components/layout/Header";

const PlaylistSharedPlayerView = () => {
  const { shareKey } = useParams<{ shareKey: string }>();
  const navigate = useNavigate();
  const { 
    setPlaylist, 
    currentTrack,
    playlist: activePlaylist,
    currentTrackIndex,
    isPlaying: contextIsPlaying
  } = usePlaylistPlayer();
  
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [trackAudioUrl, setTrackAudioUrl] = useState<string | undefined>();
  const [waveformUrl, setWaveformUrl] = useState<string | undefined>();
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(true);
  const [playlistData, setPlaylistData] = useState<PlaylistWithTracks | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the playlist data by share key
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setIsLoadingPlaylist(true);
        const data = await getPlaylistByShareKey(shareKey || "");
        setPlaylistData(data);
        
        // Set the playlist only on initial load
        if (data && initialLoad) {
          setPlaylist(data);
          setInitialLoad(false);
        }
      } catch (err) {
        console.error("Error fetching shared playlist:", err);
        setError("Failed to load the shared playlist.");
      } finally {
        setIsLoadingPlaylist(false);
      }
    };

    if (shareKey) {
      fetchPlaylist();
    }
  }, [shareKey, initialLoad, setPlaylist]);

  // Load detailed track data when current track changes
  useEffect(() => {
    const loadTrackData = async () => {
      if (currentTrack?.track_id) {
        setIsLoadingTrack(true);
        try {
          const trackData = await getTrack(currentTrack.track_id);
          if (trackData) {
            // Use the best available URL - prefer mp3, then opus, then compressed, then original
            const audioUrl = trackData.mp3_url || 
                            trackData.opus_url || 
                            trackData.compressed_url || 
                            trackData.original_url;
            
            // Set the waveform URL - prefer mp3, then compressed
            const waveformAnalysisUrl = trackData.mp3_url || trackData.compressed_url;
            
            setTrackAudioUrl(audioUrl);
            setWaveformUrl(waveformAnalysisUrl);
          }
        } catch (error) {
          console.error("Error loading track data:", error);
        } finally {
          setIsLoadingTrack(false);
        }
      }
    };
    
    loadTrackData();
  }, [currentTrack]);

  // Handle loading and error states
  if (isLoadingPlaylist) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <div className="animate-pulse">Loading shared playlist...</div>
          </div>
        </div>
      </>
    );
  }

  if (error || !playlistData) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-2 text-red-500">Error loading shared playlist</h2>
            <p className="text-gray-400 mb-6">This playlist might not exist or has been deleted.</p>
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
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => navigate(`/shared/playlist/${shareKey}`)}
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
              audioUrl={trackAudioUrl}
              waveformAnalysisUrl={waveformUrl}
              isPlaylistMode={true}
              currentIndex={currentTrackIndex}
              totalTracks={playlistData.tracks.length}
              isLoading={isLoadingTrack}
              showFFTVisualizer={true}
            />
          </div>
        )}
        
        <Separator className="my-4" />
        
        {/* Show message when the playlist is empty */}
        {playlistData.tracks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-wip-gray rounded-lg bg-wip-darker">
            <h3 className="text-xl font-medium mb-2">This Playlist is Empty</h3>
            <p className="text-gray-400">The owner hasn't added any tracks yet.</p>
          </div>
        ) : (
          <PlaylistTrackList tracks={playlistData.tracks} />
        )}
      </div>
    </>
  );
};

export default PlaylistSharedPlayerView;
