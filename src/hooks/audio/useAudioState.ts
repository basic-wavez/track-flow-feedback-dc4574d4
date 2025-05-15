
import { useState } from "react";

/**
 * Hook that manages the audio player's state values
 */
export function useAudioState(defaultAudioUrl: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackState, setPlaybackState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
  const [loadRetries, setLoadRetries] = useState(0);
  const [isGeneratingWaveform, setIsGeneratingWaveform] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showBufferingUI, setShowBufferingUI] = useState(false);

  return {
    isPlaying, setIsPlaying,
    currentTime, setCurrentTime,
    duration, setDuration,
    volume, setVolume,
    isMuted, setIsMuted,
    playbackState, setPlaybackState,
    loadRetries, setLoadRetries,
    isGeneratingWaveform, setIsGeneratingWaveform,
    audioLoaded, setAudioLoaded,
    showBufferingUI, setShowBufferingUI
  };
}
