
import { useState, useEffect, useRef } from 'react';

interface UseAudioAnalysisProps {
  audioRef?: React.RefObject<HTMLAudioElement>;
  audioUrl?: string;
  onAnalysisComplete?: (waveformData: Float32Array) => void;
}

/**
 * Hook to analyze audio data and extract waveform peaks
 */
export const useAudioAnalysis = ({
  audioRef,
  audioUrl,
  onAnalysisComplete
}: UseAudioAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const analyzeAudio = async () => {
    // Skip if we're already analyzing or don't have necessary inputs
    if (isAnalyzing || (!audioRef?.current && !audioUrl) || waveformData) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      // Get audio data either from element or URL
      let audioData: ArrayBuffer;
      
      if (audioUrl) {
        // Fetch audio data from URL
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        audioData = await response.arrayBuffer();
      } else if (audioRef?.current?.src) {
        // Fetch from audio element's src
        const response = await fetch(audioRef.current.src);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio from element: ${response.status}`);
        }
        audioData = await response.arrayBuffer();
      } else {
        throw new Error('No audio source available');
      }
      
      // Decode audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      
      // Get audio samples (we'll use left channel)
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate peak data by downsampling
      // Target around 1000 data points for visualization
      const sampleSize = Math.floor(channelData.length / 1000) || 1;
      const peaks = new Float32Array(1000);
      
      for (let i = 0; i < 1000; i++) {
        const start = i * sampleSize;
        const end = start + sampleSize > channelData.length ? channelData.length : start + sampleSize;
        let max = 0;
        
        // Find peak value in this sample window
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > max) max = abs;
        }
        
        peaks[i] = max;
      }
      
      // Normalize peaks to 0-1 range
      const maxPeak = Math.max(...Array.from(peaks));
      if (maxPeak > 0) {
        for (let i = 0; i < peaks.length; i++) {
          peaks[i] = peaks[i] / maxPeak;
        }
      }
      
      // Set the analyzed data
      setWaveformData(peaks);
      
      // Notify caller
      if (onAnalysisComplete) {
        onAnalysisComplete(peaks);
      }
      
    } catch (err: any) {
      console.error('Audio analysis error:', err);
      setError(err.message || 'Failed to analyze audio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // Start analysis when audio is available
    if ((audioRef?.current?.src || audioUrl) && !waveformData && !isAnalyzing) {
      analyzeAudio();
    }
  }, [audioRef?.current?.src, audioUrl, waveformData, isAnalyzing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { waveformData, isAnalyzing, error, analyzeAudio };
};
