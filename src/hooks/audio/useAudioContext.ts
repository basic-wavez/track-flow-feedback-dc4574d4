
import { useState, useEffect, useRef } from 'react';

export interface AudioContextState {
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  sourceNode: MediaElementAudioSourceNode | null;
  isInitialized: boolean;
  error: Error | null;
}

export function useAudioContext(audioRef: React.RefObject<HTMLAudioElement>) {
  const [state, setState] = useState<AudioContextState>({
    audioContext: null,
    analyserNode: null,
    sourceNode: null,
    isInitialized: false,
    error: null,
  });
  
  // Track if the context has been initialized to prevent duplicate initialization
  const isInitializedRef = useRef(false);

  // Initialize the audio context and nodes
  const initializeContext = () => {
    if (isInitializedRef.current || !audioRef.current) return;
    
    try {
      // Create new AudioContext
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create an analyser node
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      // Create a source node from the audio element
      const source = context.createMediaElementSource(audioRef.current);
      
      // Connect the nodes: source -> analyser -> destination
      source.connect(analyser);
      analyser.connect(context.destination);
      
      setState({
        audioContext: context,
        analyserNode: analyser,
        sourceNode: source,
        isInitialized: true,
        error: null,
      });
      
      isInitializedRef.current = true;
      console.log('Audio context initialized successfully');
    } catch (err) {
      console.error('Failed to initialize audio context:', err);
      setState(prev => ({ ...prev, error: err as Error }));
    }
  };

  // Clean up the audio context when the component unmounts
  useEffect(() => {
    return () => {
      if (state.audioContext && state.audioContext.state !== 'closed') {
        state.audioContext.close().catch(console.error);
        console.log('Audio context closed');
      }
    };
  }, [state.audioContext]);

  return {
    ...state,
    initializeContext,
  };
}
