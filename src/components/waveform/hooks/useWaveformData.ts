
import { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance, isValidPeaksData } from '@/lib/waveformUtils';

interface UseWaveformDataProps {
  waveformAnalysisUrl?: string;
  peaksDataUrl?: string;
  isGeneratingWaveform?: boolean;
}

export const useWaveformData = ({
  waveformAnalysisUrl,
  peaksDataUrl,
  isGeneratingWaveform = false,
}: UseWaveformDataProps) => {
  // State management
  const [waveformData, setWaveformData] = useState<number[] | Float32Array>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [isPeaksLoading, setIsPeaksLoading] = useState(false);
  const [usingPrecomputedPeaks, setUsingPrecomputedPeaks] = useState(false);
  
  // Use refs to track state between effects
  const peaksLoadedRef = useRef(false);
  const analysisUrlRef = useRef<string | null>(null);
  
  // Generate initial placeholder waveform immediately
  useEffect(() => {
    if ((Array.isArray(waveformData) && waveformData.length === 0) || 
        (waveformData instanceof Float32Array && waveformData.length === 0)) {
      console.log('Generating initial placeholder waveform');
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Function to load pre-computed peaks data - completely prevents any analysis
  const loadPeaksData = useCallback(async (url: string) => {
    console.log('Attempting to load pre-computed peaks from:', url);
    
    try {
      setIsPeaksLoading(true);
      
      // Important: Mark that we're attempting analysis to prevent parallel analysis path
      // Set this flag FIRST to make sure no race conditions occur
      setAnalysisAttempted(true);
      
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
  
  // First priority: Try to load pre-computed peaks data
  useEffect(() => {
    // Skip if we already have peaks or if we're already loading
    if (peaksLoadedRef.current || !peaksDataUrl || isWaveformGenerated || isAnalyzing || isPeaksLoading) {
      return;
    }
    
    console.log('Attempting to load peaks data from URL:', peaksDataUrl);
    loadPeaksData(peaksDataUrl)
      .then(success => {
        if (!success && !analysisAttempted) {
          console.log('Peaks data loading failed, will attempt audio analysis as fallback');
          setAnalysisAttempted(false);
        }
      });
  }, [peaksDataUrl, isWaveformGenerated, isAnalyzing, isPeaksLoading, loadPeaksData, analysisAttempted]);
  
  // Track analysis URL for debugging
  useEffect(() => {
    if (waveformAnalysisUrl) {
      console.log('Waveform analysis URL set to:', waveformAnalysisUrl);
      analysisUrlRef.current = waveformAnalysisUrl;
    }
  }, [waveformAnalysisUrl]);
  
  // Fallback: Analyze waveform data only if peaks loading failed and we have a URL
  useEffect(() => {
    // Skip analysis if:
    // 1. We're using pre-computed peaks data
    // 2. We don't have a URL to analyze
    // 3. We've already attempted analysis
    // 4. We've already generated the waveform
    // 5. We're already analyzing
    if (peaksLoadedRef.current || 
        usingPrecomputedPeaks || 
        !analysisUrlRef.current || 
        analysisAttempted || 
        isWaveformGenerated || 
        isAnalyzing) {
      return;
    }
    
    // Store the fact that we've attempted analysis
    setAnalysisAttempted(true);
    
    // Use higher segment count for more detailed visualization
    const segments = 250;
    
    console.log('Starting waveform analysis from URL:', analysisUrlRef.current);
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Attempt to analyze the audio file with enhanced dynamics
    analyzeAudio(analysisUrlRef.current, segments)
      .then(analyzedData => {
        if (analyzedData && analyzedData.length > 0) {
          console.log('Successfully analyzed waveform data:', analyzedData.length, 'segments');
          
          // Store as Float32Array for consistent rendering
          const typedArray = Float32Array.from(analyzedData);
          setWaveformData(typedArray);
          setIsWaveformGenerated(true);
        } else {
          throw new Error("No waveform data generated from analysis");
        }
      })
      .catch(error => {
        console.error("Error analyzing audio:", error);
        setAnalysisError(`Failed to analyze audio: ${error.message}. Using fallback visualization.`);
        
        // Fall back to generated data with higher variance for more realistic appearance
        const fallbackData = generateWaveformWithVariance(segments, 0.6);
        setWaveformData(fallbackData);
        setIsWaveformGenerated(true);
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  }, [analysisAttempted, isWaveformGenerated, usingPrecomputedPeaks, isAnalyzing]);
  
  // Reset analysis attempted flag when the URL changes significantly
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== analysisUrlRef.current && !peaksLoadedRef.current) {
      console.log('Waveform analysis URL changed, resetting analysis state');
      setAnalysisAttempted(false);
      analysisUrlRef.current = waveformAnalysisUrl;
    }
  }, [waveformAnalysisUrl]);

  return {
    waveformData,
    isAnalyzing,
    isPeaksLoading,
    analysisError,
    usingPrecomputedPeaks,
    isWaveformGenerated
  };
};
