
import { useRef, useEffect, useState, useMemo } from 'react';

export interface AudioContextState {
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  sourceNode: MediaElementAudioSourceNode | null;
  isInitialized: boolean;
  fftSize: number;
  setFFTSize: (size: number) => void;
  error: Error | null;
  corsIssueDetected: boolean;
}

export function useAudioContext(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [fftSize, setFFTSize] = useState(2048); // Default FFT size
  const [error, setError] = useState<Error | null>(null);
  const [corsIssueDetected, setCorsIssueDetected] = useState(false);
  
  // Use refs to avoid re-creating the audio nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const initAttemptedRef = useRef<boolean>(false);

  // Initialize the audio context and nodes
  useEffect(() => {
    if (!audioRef.current) return;

    const initializeAudio = () => {
      // Skip if already attempted initialization and failed with CORS
      if (initAttemptedRef.current && corsIssueDetected) return;
      
      initAttemptedRef.current = true;
      
      try {
        // Create audio context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          console.warn('Web Audio API is not supported in this browser');
          return;
        }

        // Create new context only if we don't have one
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
          analyserNodeRef.current = audioContextRef.current.createAnalyser();
          
          // Configure analyzer
          analyserNodeRef.current.fftSize = fftSize;
          analyserNodeRef.current.smoothingTimeConstant = 0.85;
        }
        
        try {
          // Don't attempt to connect if we've already detected CORS issues
          if (corsIssueDetected) return;
          
          // Connect source node - this is where CORS errors typically happen
          if (!sourceNodeRef.current && audioRef.current) {
            sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            sourceNodeRef.current.connect(analyserNodeRef.current!);
            
            // Connect to destination (speakers)
            analyserNodeRef.current!.connect(audioContextRef.current.destination);
            
            setIsInitialized(true);
            console.log('Audio context initialized for visualizers');
          }
        } catch (err) {
          // Handle CORS errors specifically
          console.error('Error connecting audio source:', err);
          
          if (err instanceof DOMException && 
             (err.message.includes('security') || 
              err.message.includes('CORS') || 
              err.message.includes('cross-origin'))) {
            setCorsIssueDetected(true);
            console.warn('CORS issue detected with audio source. Visualizers will be disabled.');
          }
          
          setError(err instanceof Error ? err : new Error(String(err)));
          
          // Attempt to clean up any partially created resources
          cleanupAudioNodes();
        }
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        setError(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const cleanupAudioNodes = () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {
          console.error('Error disconnecting source node:', e);
        }
        sourceNodeRef.current = null;
      }
      
      if (analyserNodeRef.current) {
        try {
          analyserNodeRef.current.disconnect();
        } catch (e) {
          console.error('Error disconnecting analyser node:', e);
        }
      }
    };

    // Initialize on user interaction (play/click)
    const handleInteraction = () => {
      if (!isInitialized && !corsIssueDetected) {
        initializeAudio();
      }
    };

    // Listen for play event to initialize audio context (browser policy)
    const audio = audioRef.current;
    audio.addEventListener('play', handleInteraction, { once: true });
    
    // Also try on canplay as a fallback
    audio.addEventListener('canplay', handleInteraction, { once: true });
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handleInteraction);
        audioRef.current.removeEventListener('canplay', handleInteraction);
      }
      
      cleanupAudioNodes();
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [audioRef, isInitialized, corsIssueDetected]);

  // Update FFT size when it changes
  useEffect(() => {
    if (analyserNodeRef.current && isInitialized) {
      analyserNodeRef.current.fftSize = fftSize;
    }
  }, [fftSize, isInitialized]);

  // Reset CORS detection when the audio source changes
  useEffect(() => {
    if (audioRef.current && audioRef.current.src) {
      const audioSrc = audioRef.current.src;
      const isLocalOrProxied = audioSrc.includes('localhost') || 
                              audioSrc.includes('.functions.supabase.co') || 
                              audioSrc.startsWith('/');
      
      // If we switch to a local or proxied source, reset CORS detection
      if (isLocalOrProxied && corsIssueDetected) {
        setCorsIssueDetected(false);
        initAttemptedRef.current = false;
      }
    }
  }, [audioRef.current?.src, corsIssueDetected]);

  // Expose the audio nodes and context
  const audioContextState = useMemo<AudioContextState>(() => ({
    audioContext: audioContextRef.current,
    analyserNode: analyserNodeRef.current,
    sourceNode: sourceNodeRef.current,
    isInitialized,
    fftSize,
    setFFTSize,
    error,
    corsIssueDetected
  }), [isInitialized, fftSize, error, corsIssueDetected]);

  return audioContextState;
}
