import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Button } from "@/components/ui/button";
import { usePlaylistPlayer } from "@/context/PlaylistPlayerContext";
import { ArrowLeft } from "lucide-react";
import TrackPlayer from "@/components/TrackPlayer";
import PlaylistTrackList from "@/components/playlist/PlaylistTrackList";
import { Separator } from "@/components/ui/separator";
import { getTrack } from "@/services/trackQueryService";
import Header from "@/components/layout/Header";

const PlaylistPlayerView = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { getPlaylist } = usePlaylists();
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
  
  // Log status for debugging
  useEffect(() => {
    console.log("PlaylistPlayerView state:", {
      isPlaying: contextIsPlaying,
      currentTrackIndex,
      currentTrackId: currentTrack?.track_id,
      isLoadingTrack
    });
  }, [contextIsPlaying, currentTrackIndex, currentTrack, isLoadingTrack]);
  
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
            
            console.log("Loaded track data:", { 
              trackId: trackData.id,
              title: trackData.title,
              mp3Url: trackData.mp3_url,
              opusUrl: trackData.opus_url,
              compressedUrl: trackData.compressed_url,
              originalUrl: trackData.original_url,
              selectedUrl: audioUrl,
              waveformUrl: waveformAnalysisUrl
            });
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
    <>
      <Header />
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
              audioUrl={trackAudioUrl}
              waveformAnalysisUrl={waveformUrl}
              isPlaylistMode={true}
              currentIndex={currentTrackIndex}
              totalTracks={playlistData.tracks.length}
              isLoading={isLoadingTrack}
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
    </>
  );
};

export default PlaylistPlayerView;
