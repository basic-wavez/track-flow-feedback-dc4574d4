
import { useState, useEffect, useRef } from 'react';

export interface AudioContextState {
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  sourceNode: MediaElementAudioSourceNode | null;
  leftAnalyserNode: AnalyserNode | null;
  rightAnalyserNode: AnalyserNode | null;
  splitterNode: ChannelSplitterNode | null;
  isInitialized: boolean;
  error: Error | null;
}

export function useAudioContext(audioRef: React.RefObject<HTMLAudioElement>) {
  const [state, setState] = useState<AudioContextState>({
    audioContext: null,
    analyserNode: null,
    sourceNode: null,
    leftAnalyserNode: null,
    rightAnalyserNode: null,
    splitterNode: null,
    isInitialized: false,
    error: null,
  });
  
  // Track if the context has been initialized to prevent duplicate initialization
  const isInitializedRef = useRef(false);

  // Initialize the audio context and nodes
  const initializeContext = () => {
    if (isInitializedRef.current || !audioRef.current) return;
    
    try {
      console.log('Initializing audio context...');
      
      // Create new AudioContext
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context created:', context.state);
      
      // Ensure the audio element has crossOrigin set
      if (!audioRef.current.crossOrigin) {
        audioRef.current.crossOrigin = 'anonymous';
        console.log('Set crossOrigin="anonymous" on audio element');
      }
      
      // Create main analyser node for FFT
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      console.log('Main analyser node created');
      
      // Create a source node from the audio element
      const source = context.createMediaElementSource(audioRef.current);
      console.log('Media element source created');
      
      // Create a channel splitter for stereo analysis
      const splitter = context.createChannelSplitter(2);
      console.log('Channel splitter created');
      
      // Create separate analysers for left and right channels
      const leftAnalyser = context.createAnalyser();
      leftAnalyser.fftSize = 1024;
      leftAnalyser.smoothingTimeConstant = 0.8;
      
      const rightAnalyser = context.createAnalyser();
      rightAnalyser.fftSize = 1024;
      rightAnalyser.smoothingTimeConstant = 0.8;
      console.log('Left and right channel analysers created');
      
      // Connect the nodes:
      // source -> analyser -> destination (main path)
      // source -> splitter -> leftAnalyser/rightAnalyser (stereo analysis)
      source.connect(analyser);
      analyser.connect(context.destination);
      
      source.connect(splitter);
      splitter.connect(leftAnalyser, 0);
      splitter.connect(rightAnalyser, 1);
      console.log('Audio nodes connected with stereo analysis');
      
      setState({
        audioContext: context,
        analyserNode: analyser,
        sourceNode: source,
        leftAnalyserNode: leftAnalyser,
        rightAnalyserNode: rightAnalyser,
        splitterNode: splitter,
        isInitialized: true,
        error: null,
      });
      
      isInitializedRef.current = true;
      console.log('Audio context initialized successfully with stereo analysis');
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
