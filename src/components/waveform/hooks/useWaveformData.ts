
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import { loadPeaksDataWithCaching } from '@/lib/peaksDataUtils';

interface UseWaveformDataProps {
  peaksDataUrl?: string;
  isGeneratingWaveform?: boolean;
}

export const useWaveformData = ({
  peaksDataUrl,
  isGeneratingWaveform = false,
}: UseWaveformDataProps) => {
  // State management
  const [waveformData, setWaveformData] = useState<number[] | Float32Array>([]);
  const [isPeaksLoading, setIsPeaksLoading] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [usingPrecomputedPeaks, setUsingPrecomputedPeaks] = useState(false);
  
  // Use refs to track state
  const peaksLoadedRef = useRef(false);
  
  // Generate initial placeholder waveform immediately
  useEffect(() => {
    if ((Array.isArray(waveformData) && waveformData.length === 0) || 
        (waveformData instanceof Float32Array && waveformData.length === 0)) {
      console.log('Generating initial placeholder waveform');
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Function to load pre-computed peaks data
  const loadPeaksData = useCallback(async (url: string) => {
    try {
      setIsPeaksLoading(true);
      
      const { data, success } = await loadPeaksDataWithCaching(url);
      
      if (success && data) {
        setWaveformData(data);
        setIsWaveformGenerated(true);
        setUsingPrecomputedPeaks(true);
        peaksLoadedRef.current = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in loadPeaksData:', error);
      setUsingPrecomputedPeaks(false);
      return false;
    } finally {
      setIsPeaksLoading(false);
    }
  }, []);
  
  // Load pre-computed peaks data
  useEffect(() => {
    // Skip if we already have peaks or if we're already loading
    if (peaksLoadedRef.current || !peaksDataUrl || isWaveformGenerated || isPeaksLoading) {
      return;
    }
    
    console.log('Attempting to load peaks data from URL:', peaksDataUrl);
    loadPeaksData(peaksDataUrl);
  }, [peaksDataUrl, isWaveformGenerated, isPeaksLoading, loadPeaksData]);

  return {
    waveformData,
    isAnalyzing: false, // We're not analyzing anymore
    isPeaksLoading,
    analysisError,
    usingPrecomputedPeaks,
    isWaveformGenerated
  };
};
