
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import { loadPeaksDataWithCaching } from '@/lib/peaksDataUtils';
import { getTrackWaveformData } from '@/services/trackWaveformService';

interface UseWaveformDataProps {
  peaksDataUrl?: string;
  isGeneratingWaveform?: boolean;
  trackId?: string;
}

export const useWaveformData = ({
  peaksDataUrl,
  isGeneratingWaveform = false,
  trackId,
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
  
  // Load waveform data from Supabase if available
  const loadWaveformDataFromDatabase = useCallback(async () => {
    if (!trackId || peaksLoadedRef.current) return false;
    
    try {
      setIsPeaksLoading(true);
      console.log('Attempting to load waveform data from database for track:', trackId);
      
      const data = await getTrackWaveformData(trackId);
      
      if (data && data.length > 0) {
        console.log('Successfully loaded waveform data from database');
        setWaveformData(data);
        setIsWaveformGenerated(true);
        setUsingPrecomputedPeaks(true);
        peaksLoadedRef.current = true;
        return true;
      }
      
      console.log('No waveform data found in database');
      return false;
    } catch (error) {
      console.error('Error loading waveform data from database:', error);
      return false;
    } finally {
      setIsPeaksLoading(false);
    }
  }, [trackId]);
  
  // Load data based on priority:
  // 1. Pre-computed peaks URL
  // 2. Database waveform data
  // 3. Fall back to placeholder
  useEffect(() => {
    // Skip if we already have peaks or if we're already loading
    if (peaksLoadedRef.current || isPeaksLoading) {
      return;
    }
    
    const loadData = async () => {
      let loaded = false;
      
      // First try loading from URL if available
      if (peaksDataUrl) {
        console.log('Attempting to load peaks data from URL:', peaksDataUrl);
        loaded = await loadPeaksData(peaksDataUrl);
      }
      
      // If URL loading failed and we have a track ID, try database
      if (!loaded && trackId) {
        console.log('Trying to load from database after URL failed');
        loaded = await loadWaveformDataFromDatabase();
      }
      
      // If both failed, we'll use the placeholder generated in the first effect
    };
    
    loadData();
  }, [peaksDataUrl, trackId, isPeaksLoading, loadPeaksData, loadWaveformDataFromDatabase]);

  return {
    waveformData,
    isAnalyzing: false,
    isPeaksLoading,
    analysisError,
    usingPrecomputedPeaks,
    isWaveformGenerated
  };
};
