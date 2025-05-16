
// Re-export the useAudioPlayer hook from the audio directory
export { useAudioPlayer } from './audio/useAudioPlayer';

// Re-export the types for backwards compatibility
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface UseAudioPlayerProps {
  mp3Url: string | null | undefined;
  defaultAudioUrl?: string;
  trackId?: string;
  shareKey?: string;
}
