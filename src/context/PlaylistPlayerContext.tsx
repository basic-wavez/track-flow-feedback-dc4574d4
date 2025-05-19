
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { PlaylistTrack, PlaylistWithTracks } from "@/types/playlist";
import { useNavigate, useLocation } from "react-router-dom";

interface PlaylistPlayerContextType {
  playlist: PlaylistWithTracks | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  setPlaylist: (playlist: PlaylistWithTracks) => void;
  playTrack: (index: number) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  togglePlayPause: () => void;
  currentTrack: PlaylistTrack | null;
}

const PlaylistPlayerContext = createContext<PlaylistPlayerContextType | undefined>(undefined);

export function PlaylistPlayerProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylistState] = useState<PlaylistWithTracks | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on a shared route - memoized
  const isSharedRoute = useMemo(() => 
    location.pathname.includes('/shared/'), [location.pathname]);

  // Calculate the current track based on the index - memoized
  const currentTrack = useMemo(() => 
    playlist && currentTrackIndex >= 0 && currentTrackIndex < playlist.tracks.length
      ? playlist.tracks[currentTrackIndex]
      : null, 
    [playlist, currentTrackIndex]
  );

  // Set up media session API
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.track?.title || 'Unknown Track',
      artist: playlist?.name || 'Unknown Playlist',
    });

    // Set up media session action handlers
    const actionHandlers = [
      ['play', () => setIsPlaying(true)],
      ['pause', () => setIsPlaying(false)],
      ['nexttrack', playNextTrack],
      ['previoustrack', playPreviousTrack]
    ] as const;
    
    // Register each handler
    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.log(`The media session action "${action}" is not supported`);
      }
    });
    
    return () => {
      // Clean up handlers when component unmounts or track changes
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (error) {
          // Ignore errors when cleaning up
        }
      });
    };
  }, [currentTrack, playlist?.name]);

  // Set the playlist and optionally start playing a track - memoized
  const setPlaylist = useCallback((newPlaylist: PlaylistWithTracks) => {
    setPlaylistState(newPlaylist);
  }, []);

  // Play a specific track by index - memoized
  const playTrack = useCallback((index: number) => {
    if (!playlist || index < 0 || index >= playlist.tracks.length) return;
    
    console.log("PlaylistContext: Playing track at index:", index);
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    
    // Navigate to the player view if not already there
    // Handle different routes for shared vs. logged-in users
    if (isSharedRoute) {
      // Extract share key from the URL
      const pathParts = location.pathname.split('/');
      const shareKeyIndex = pathParts.indexOf('playlist') + 1;
      if (shareKeyIndex > 0 && shareKeyIndex < pathParts.length) {
        const shareKey = pathParts[shareKeyIndex];
        navigate(`/shared/playlist/${shareKey}/play`);
      }
    } else if (playlist) {
      navigate(`/playlist/${playlist.id}/play`);
    }
  }, [playlist, isSharedRoute, location.pathname, navigate]);

  // Play the next track in the playlist - memoized
  const playNextTrack = useCallback(() => {
    if (!playlist || playlist.tracks.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % playlist.tracks.length;
    console.log("PlaylistContext: Playing next track:", nextIndex);
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  }, [currentTrackIndex, playlist]);

  // Play the previous track in the playlist - memoized
  const playPreviousTrack = useCallback(() => {
    if (!playlist || playlist.tracks.length === 0) return;
    
    const prevIndex = currentTrackIndex <= 0 
      ? playlist.tracks.length - 1 
      : currentTrackIndex - 1;
    
    console.log("PlaylistContext: Playing previous track:", prevIndex);
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  }, [currentTrackIndex, playlist]);

  // Toggle play/pause state - memoized
  const togglePlayPause = useCallback(() => {
    console.log("PlaylistContext: Toggling play/pause from", isPlaying, "to", !isPlaying);
    setIsPlaying(prev => !prev);
  }, [isPlaying]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    playlist,
    currentTrackIndex,
    isPlaying,
    setPlaylist,
    playTrack,
    playNextTrack,
    playPreviousTrack,
    togglePlayPause,
    currentTrack
  }), [
    playlist,
    currentTrackIndex,
    isPlaying,
    setPlaylist,
    playTrack,
    playNextTrack,
    playPreviousTrack,
    togglePlayPause,
    currentTrack
  ]);

  return (
    <PlaylistPlayerContext.Provider value={value}>
      {children}
    </PlaylistPlayerContext.Provider>
  );
}

export function usePlaylistPlayer() {
  const context = useContext(PlaylistPlayerContext);
  if (context === undefined) {
    throw new Error("usePlaylistPlayer must be used within a PlaylistPlayerProvider");
  }
  return context;
}
