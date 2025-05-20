
import { useRef, useEffect, useState, useMemo } from 'react';

export interface AudioContextState {
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  sourceNode: MediaElementAudioSourceNode | null;
  isInitialized: boolean;
  fftSize: number;
  setFFTSize: (size: number) => void;
}

export function useAudioContext(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fftSize, setFFTSize] = useState(2048); // Default FFT size
  
  // Use refs to avoid re-creating the audio nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize the audio context and nodes
  useEffect(() => {
    if (!audioRef.current || isInitialized) return;

    const initializeAudio = () => {
      try {
        // Create audio context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          console.warn('Web Audio API is not supported in this browser');
          return;
        }

        audioContextRef.current = new AudioContext();
        analyserNodeRef.current = audioContextRef.current.createAnalyser();
        
        // Configure analyzer
        analyserNodeRef.current.fftSize = fftSize;
        analyserNodeRef.current.smoothingTimeConstant = 0.85;
        
        // Connect source node
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current!);
        sourceNodeRef.current.connect(analyserNodeRef.current);
        
        // Connect to destination (speakers)
        analyserNodeRef.current.connect(audioContextRef.current.destination);
        
        setIsInitialized(true);
        console.log('Audio context initialized for visualizers');
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    // Initialize on user interaction (play/click)
    const handleInteraction = () => {
      if (!isInitialized) {
        initializeAudio();
      }
    };

    // Listen for play event to initialize audio context (browser policy)
    audioRef.current.addEventListener('play', handleInteraction, { once: true });
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handleInteraction);
      }
      
      // Clean up audio nodes
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      
      if (analyserNodeRef.current) {
        analyserNodeRef.current.disconnect();
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioRef, isInitialized]);

  // Update FFT size when it changes
  useEffect(() => {
    if (analyserNodeRef.current && isInitialized) {
      analyserNodeRef.current.fftSize = fftSize;
    }
  }, [fftSize, isInitialized]);

  // Expose the audio nodes and context
  const audioContextState = useMemo<AudioContextState>(() => ({
    audioContext: audioContextRef.current,
    analyserNode: analyserNodeRef.current,
    sourceNode: sourceNodeRef.current,
    isInitialized,
    fftSize,
    setFFTSize,
  }), [isInitialized, fftSize]);

  return audioContextState;
}
