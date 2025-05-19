
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PlaylistTrack, PlaylistWithTracks } from "@/types/playlist";
import { useNavigate } from "react-router-dom";

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

  // Calculate the current track based on the index
  const currentTrack = playlist && currentTrackIndex >= 0 && currentTrackIndex < playlist.tracks.length
    ? playlist.tracks[currentTrackIndex]
    : null;

  // Set up media session API
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.track?.title || 'Unknown Track',
        artist: playlist?.name || 'Unknown Playlist',
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPreviousTrack());
    }
    
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      }
    };
  }, [currentTrack, isPlaying]);

  // Set the playlist and optionally start playing a track
  const setPlaylist = (newPlaylist: PlaylistWithTracks) => {
    setPlaylistState(newPlaylist);
  };

  // Play a specific track by index
  const playTrack = (index: number) => {
    if (!playlist || index < 0 || index >= playlist.tracks.length) return;
    
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    
    // Navigate to the player view if not already there
    navigate(`/playlist/${playlist.id}/play`);
  };

  // Play the next track in the playlist
  const playNextTrack = () => {
    if (!playlist || playlist.tracks.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % playlist.tracks.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  // Play the previous track in the playlist
  const playPreviousTrack = () => {
    if (!playlist || playlist.tracks.length === 0) return;
    
    const prevIndex = currentTrackIndex <= 0 
      ? playlist.tracks.length - 1 
      : currentTrackIndex - 1;
    
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  // Toggle play/pause state
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const value = {
    playlist,
    currentTrackIndex,
    isPlaying,
    setPlaylist,
    playTrack,
    playNextTrack,
    playPreviousTrack,
    togglePlayPause,
    currentTrack
  };

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
