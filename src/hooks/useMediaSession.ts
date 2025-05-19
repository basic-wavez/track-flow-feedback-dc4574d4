
import { useEffect } from 'react';

interface MediaSessionOptions {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: MediaImage[];
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

export function useMediaSession({
  title = 'Unknown Track',
  artist = 'Unknown Artist',
  album = '',
  artwork = [],
  isPlaying,
  duration,
  currentTime,
  onPlay,
  onPause,
  onSeek,
}: MediaSessionOptions) {
  useEffect(() => {
    // Only proceed if the Media Session API is supported
    if (!('mediaSession' in navigator)) return;
    
    // Update metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album,
      artwork,
    });
    
    // Update playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    
    // Set up action handlers
    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', onPlay],
      ['pause', onPause],
      ['stop', onPause],
      ['seekto', (details) => {
        if (details?.seekTime !== undefined) {
          onSeek(details.seekTime);
        }
      }],
      ['previoustrack', () => {
        // Seek to beginning if we're more than 3 seconds in
        if (currentTime > 3) {
          onSeek(0);
        }
      }],
      ['nexttrack', () => {
        // Not supported in this implementation
      }],
    ];
    
    // Register all action handlers
    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.log(`The media session action "${action}" is not supported.`);
      }
    }
    
    // Update position state if supported
    if (duration > 0 && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: currentTime,
        });
      } catch (error) {
        console.error('Error updating position state:', error);
      }
    }
    
    return () => {
      // Clear action handlers when component unmounts
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (error) {
          // Ignore errors here
        }
      }
    };
  }, [title, artist, album, artwork, isPlaying, duration, currentTime, onPlay, onPause, onSeek]);
}

export default useMediaSession;
