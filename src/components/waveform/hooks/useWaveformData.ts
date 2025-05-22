
import { useState, useEffect, useCallback, useRef } from 'react';
import { generateWaveformWithVariance, isValidPeaksData } from '@/lib/waveformUtils';

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
    console.log('Attempting to load pre-computed peaks from:', url);
    
    try {
      setIsPeaksLoading(true);
      
      // Check browser storage cache first
      const cacheKey = `waveform_peaks_${url}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (isValidPeaksData(parsedData)) {
            console.log('Using cached waveform peaks data - skipping analysis completely');
            
            // Convert to Float32Array for direct rendering
            const typedArray = Float32Array.from(parsedData);
            setWaveformData(typedArray);
            setIsWaveformGenerated(true);
            setUsingPrecomputedPeaks(true);
            peaksLoadedRef.current = true;
            return true;
          } else {
            console.warn('Cached peaks data is invalid, removing from cache');
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
          console.warn('Error parsing cached peaks data:', e);
          localStorage.removeItem(cacheKey);
        }
      }
      
      // Fetch from server if not in cache
      console.log('Fetching peaks data from server:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch peaks data: ${response.status} ${response.statusText}`);
      }
      
      const peaksData = await response.json();
      
      if (isValidPeaksData(peaksData)) {
        console.log('Successfully loaded pre-computed waveform peaks:', peaksData.length, 'points');
        
        // Convert to Float32Array for direct rendering
        const typedArray = Float32Array.from(peaksData);
        
        // Cache the data for future use
        try {
          localStorage.setItem(cacheKey, JSON.stringify(peaksData));
        } catch (e) {
          console.warn('Failed to cache waveform peaks data:', e);
        }
        
        setWaveformData(typedArray);
        setIsWaveformGenerated(true);
        setUsingPrecomputedPeaks(true);
        peaksLoadedRef.current = true;
        return true;
      } else {
        throw new Error('Invalid peaks data format');
      }
    } catch (error) {
      console.error('Error loading pre-computed peaks data:', error);
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
