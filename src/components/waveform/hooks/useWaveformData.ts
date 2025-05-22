
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import { loadPeaksDataWithCaching } from '@/lib/peaksDataUtils';
import { getTrackWaveformData } from '@/services/trackWaveformService';

interface UseWaveformDataProps {
  peaksDataUrl?: string;
  isGeneratingWaveform?: boolean;
  trackId?: string;
  onDatabaseLoadingComplete?: (success: boolean) => void;
}

export const useWaveformData = ({
  peaksDataUrl,
  isGeneratingWaveform = false,
  trackId,
  onDatabaseLoadingComplete
}: UseWaveformDataProps) => {
  // State management
  const [waveformData, setWaveformData] = useState<number[] | Float32Array>([]);
  const [isPeaksLoading, setIsPeaksLoading] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [usingPrecomputedPeaks, setUsingPrecomputedPeaks] = useState(false);
  const [databaseLoadingAttempted, setDatabaseLoadingAttempted] = useState(false);
  
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
        if (onDatabaseLoadingComplete) onDatabaseLoadingComplete(true);
        return true;
      }
      
      console.log('No waveform data found in database');
      if (onDatabaseLoadingComplete) onDatabaseLoadingComplete(false);
      return false;
    } catch (error) {
      console.error('Error loading waveform data from database:', error);
      if (onDatabaseLoadingComplete) onDatabaseLoadingComplete(false);
      return false;
    } finally {
      setIsPeaksLoading(false);
      setDatabaseLoadingAttempted(true);
    }
  }, [trackId, onDatabaseLoadingComplete]);
  
  // Function to load pre-computed peaks data from URL
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
  
  // Changed load priority: 1. Database, 2. Pre-computed peaks URL, 3. Placeholder
  useEffect(() => {
    // Skip if we already have peaks or if we're already loading
    if (peaksLoadedRef.current || isPeaksLoading) {
      return;
    }
    
    const loadData = async () => {
      let loaded = false;
      
      // First priority: Try to load from Supabase database if we have a track ID
      if (trackId) {
        console.log('First priority: Loading waveform from database for track:', trackId);
        loaded = await loadWaveformDataFromDatabase();
      }
      
      // Second priority: If database loading failed and we have a peaks URL, try loading from URL
      if (!loaded && peaksDataUrl) {
        console.log('Second priority: Loading waveform from peaksDataUrl:', peaksDataUrl);
        loaded = await loadPeaksData(peaksDataUrl);
      }
      
      // If both failed, we'll use the placeholder generated in the first effect
      if (!loaded) {
        console.log('Both loading methods failed, using placeholder waveform');
      }
    };
    
    loadData();
  }, [trackId, peaksDataUrl, isPeaksLoading, loadWaveformDataFromDatabase, loadPeaksData]);

  return {
    waveformData,
    isAnalyzing: false,
    isPeaksLoading,
    analysisError,
    usingPrecomputedPeaks,
    isWaveformGenerated,
    databaseLoadingAttempted
  };
};
