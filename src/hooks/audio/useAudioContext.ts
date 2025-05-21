
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
      
      // Try to use the maximum FFT size allowed by the browser
      const maxPossibleFftSize = 32768;
      
      // Create main analyser node for FFT with enhanced settings
      const analyser = context.createAnalyser();
      try {
        analyser.fftSize = maxPossibleFftSize; // Try to set to maximum
        console.log(`Main analyser fftSize set to: ${analyser.fftSize}`);
      } catch (e) {
        console.warn(`Browser limited fftSize to: ${analyser.fftSize}`, e);
      }
      
      analyser.smoothingTimeConstant = 0.0; // No smoothing for maximum detail
      analyser.minDecibels = -100; // Wider dynamic range
      analyser.maxDecibels = -30;
      console.log('Main analyser node created with enhanced settings');
      
      // Create a source node from the audio element
      const source = context.createMediaElementSource(audioRef.current);
      console.log('Media element source created');
      
      // Create a channel splitter for stereo analysis
      const splitter = context.createChannelSplitter(2);
      console.log('Channel splitter created');
      
      // Create separate analysers for left and right channels
      const leftAnalyser = context.createAnalyser();
      try {
        // Use a slightly smaller FFT size for the channel analysers to save resources
        leftAnalyser.fftSize = Math.min(maxPossibleFftSize / 2, 16384);
      } catch (e) {
        console.warn(`Browser limited left channel fftSize to: ${leftAnalyser.fftSize}`, e);
      }
      leftAnalyser.smoothingTimeConstant = 0.0;
      
      const rightAnalyser = context.createAnalyser();
      try {
        rightAnalyser.fftSize = Math.min(maxPossibleFftSize / 2, 16384);
      } catch (e) {
        console.warn(`Browser limited right channel fftSize to: ${rightAnalyser.fftSize}`, e);
      }
      rightAnalyser.smoothingTimeConstant = 0.0;
      
      console.log('Left and right channel analysers created with enhanced settings');
      
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
      console.log('Audio context initialized successfully with enhanced FFT settings');
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
