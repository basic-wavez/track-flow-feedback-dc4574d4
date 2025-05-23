
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
  const currentTrackIdRef = useRef<string | undefined>(trackId);
  const isMountedRef = useRef(true);
  const databaseLoadingStartedRef = useRef(false);
  const peaksLoadingStartedRef = useRef(false);
  
  // Reset all state whenever trackId changes
  useEffect(() => {
    // Only reset if we have a new track ID that's different from the current one
    if (trackId !== currentTrackIdRef.current) {
      console.log(`Track ID changed from ${currentTrackIdRef.current} to ${trackId}, resetting waveform state`);
      
      // Update the current track ref
      currentTrackIdRef.current = trackId;
      
      // Reset all state variables and refs
      peaksLoadedRef.current = false;
      databaseLoadingStartedRef.current = false;
      peaksLoadingStartedRef.current = false;
      setWaveformData([]);
      setIsPeaksLoading(false);
      setIsWaveformGenerated(false);
      setAnalysisError(null);
      setUsingPrecomputedPeaks(false);
      setDatabaseLoadingAttempted(false);
      
      // Generate new placeholder immediately
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, [trackId]);
  
  // Cleanup function to run on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      databaseLoadingStartedRef.current = false;
      peaksLoadingStartedRef.current = false;
    };
  }, []);
  
  // Generate initial placeholder waveform immediately
  useEffect(() => {
    if ((Array.isArray(waveformData) && waveformData.length === 0) || 
        (waveformData instanceof Float32Array && waveformData.length === 0)) {
      console.log('Generating initial placeholder waveform');
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Load waveform data from Supabase if available - only called once per track
  const loadWaveformDataFromDatabase = useCallback(async () => {
    // Prevent multiple concurrent database loading attempts for the same track
    if (!trackId || peaksLoadedRef.current || databaseLoadingStartedRef.current) {
      return false;
    }
    
    // Set flag to prevent duplicate calls
    databaseLoadingStartedRef.current = true;
    
    try {
      setIsPeaksLoading(true);
      console.log('Attempting to load waveform data from database for track:', trackId);
      
      const data = await getTrackWaveformData(trackId);
      
      // Make sure we're still mounted and the trackId is still relevant
      if (!isMountedRef.current || trackId !== currentTrackIdRef.current) {
        console.log('Component unmounted or track changed during database load, aborting');
        return false;
      }
      
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
      if (isMountedRef.current) {
        setIsPeaksLoading(false);
        setDatabaseLoadingAttempted(true);
        databaseLoadingStartedRef.current = false;
      }
    }
  }, [trackId, onDatabaseLoadingComplete]);
  
  // Function to load pre-computed peaks data from URL - only called once per track
  const loadPeaksData = useCallback(async (url: string) => {
    // Prevent multiple concurrent peaks loading attempts
    if (peaksLoadedRef.current || peaksLoadingStartedRef.current) {
      return false;
    }
    
    // Set flag to prevent duplicate calls
    peaksLoadingStartedRef.current = true;
    
    try {
      setIsPeaksLoading(true);
      console.log(`Loading peaks data from URL: ${url}`);
      
      const { data, success } = await loadPeaksDataWithCaching(url);
      
      // Make sure we're still mounted and the trackId is still relevant
      if (!isMountedRef.current || trackId !== currentTrackIdRef.current) {
        console.log('Component unmounted or track changed during peaks load, aborting');
        return false;
      }
      
      if (success && data) {
        console.log('Successfully loaded peaks data from URL');
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
      if (isMountedRef.current) {
        setIsPeaksLoading(false);
        peaksLoadingStartedRef.current = false;
      }
    }
  }, [trackId]);
  
  // Changed load priority: 1. Database, 2. Pre-computed peaks URL, 3. Placeholder
  // Only attempt loading once per track ID change
  useEffect(() => {
    // Skip if we already have peaks or if we're already loading
    if (peaksLoadedRef.current || isPeaksLoading) {
      return;
    }
    
    // Create a cleanup flag to prevent state updates after unmount
    let isCancelled = false;
    
    const loadData = async () => {
      let loaded = false;
      
      // First priority: Try to load from Supabase database if we have a track ID
      if (trackId && !isCancelled && !databaseLoadingStartedRef.current) {
        console.log('First priority: Loading waveform from database for track:', trackId);
        loaded = await loadWaveformDataFromDatabase();
      }
      
      // Second priority: If database loading failed and we have a peaks URL, try loading from URL
      if (!loaded && !isCancelled && peaksDataUrl && !peaksLoadingStartedRef.current) {
        console.log('Second priority: Loading waveform from peaksDataUrl:', peaksDataUrl);
        loaded = await loadPeaksData(peaksDataUrl);
      }
      
      // If both failed, we'll use the placeholder generated in the first effect
      if (!loaded && !isCancelled) {
        console.log('Both loading methods failed, using placeholder waveform');
      }
    };
    
    loadData();
    
    // Cleanup function to cancel any pending operations
    return () => {
      isCancelled = true;
    };
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
