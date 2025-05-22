
import { useState, useEffect, useCallback } from 'react';
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
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null);
  const [isPeaksLoading, setIsPeaksLoading] = useState(false);
  const [usingPrecomputedPeaks, setUsingPrecomputedPeaks] = useState(false);
  
  // Generate initial placeholder waveform immediately
  useEffect(() => {
    if (waveformData.length === 0) {
      // Use enhanced generation with 250 segments and higher variance for more dynamics
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Function to load pre-computed peaks data
  const loadPeaksData = useCallback(async (url: string) => {
    try {
      setIsPeaksLoading(true);
      console.log('Loading pre-computed waveform peaks from:', url);
      
      // Check browser storage cache first
      const cacheKey = `waveform_peaks_${url}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          console.log('Using cached waveform peaks data');
          setWaveformData(parsedData);
          setIsWaveformGenerated(true);
          setUsingPrecomputedPeaks(true);
          setIsPeaksLoading(false);
          return true;
        } catch (e) {
          console.warn('Error parsing cached peaks data:', e);
          // Continue to fetch from server if cache parsing fails
          localStorage.removeItem(cacheKey);
        }
      }
      
      // Fetch from server if not in cache
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch peaks data: ${response.status} ${response.statusText}`);
      }
      
      const peaksData = await response.json();
      
      if (Array.isArray(peaksData) && peaksData.length > 0) {
        console.log('Successfully loaded pre-computed waveform peaks:', peaksData.length, 'points');
        
        // Cache the data for future use
        try {
          localStorage.setItem(cacheKey, JSON.stringify(peaksData));
        } catch (e) {
          console.warn('Failed to cache waveform peaks data:', e);
          // Non-fatal error, continue without caching
        }
        
        setWaveformData(peaksData);
        setIsWaveformGenerated(true);
        setUsingPrecomputedPeaks(true);
        
        // Set analysis as attempted when peaks are successfully loaded
        // This prevents the analysis from running later
        setAnalysisAttempted(true);
        
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
  
  // Try to load pre-computed peaks data first
  useEffect(() => {
    if (peaksDataUrl && !isWaveformGenerated && !isAnalyzing && !isPeaksLoading) {
      loadPeaksData(peaksDataUrl)
        .then(success => {
          if (!success) {
            // If peaks data loading fails, fall back to analysis
            console.log('Falling back to audio analysis after peaks data loading failed');
            setAnalysisAttempted(false);
          }
        });
    }
  }, [peaksDataUrl, isWaveformGenerated, isAnalyzing, isPeaksLoading, loadPeaksData]);
  
  // Log which URL we're using for analysis to help with debugging
  useEffect(() => {
    if (waveformAnalysisUrl) {
      console.log('Waveform analysis URL set to:', waveformAnalysisUrl);
      setAnalysisUrl(waveformAnalysisUrl);
    }
  }, [waveformAnalysisUrl]);
  
  // Attempt to analyze waveform data when analysis URL is available and peaks data is not
  useEffect(() => {
    // Skip analysis if we're using pre-computed peaks data
    if (usingPrecomputedPeaks) {
      console.log('Skipping waveform analysis since pre-computed peaks are being used');
      return;
    }
    
    // Only proceed if we have a URL to analyze and haven't attempted analysis yet
    if (!analysisUrl || analysisAttempted || isWaveformGenerated) return;
    
    // Store the fact that we've attempted analysis
    setAnalysisAttempted(true);
    
    // Use higher segment count for more detailed visualization
    const segments = 250;
    
    console.log('Starting waveform analysis from URL:', analysisUrl);
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Attempt to analyze the audio file with enhanced dynamics
    analyzeAudio(analysisUrl, segments)
      .then(analyzedData => {
        if (analyzedData && analyzedData.length > 0) {
          console.log('Successfully analyzed waveform data:', analyzedData.length, 'segments');
          setWaveformData(analyzedData);
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
  }, [analysisUrl, analysisAttempted, isWaveformGenerated, usingPrecomputedPeaks]);
  
  // Reset analysis attempted flag when the URL changes significantly, but ONLY if we're not using precomputed peaks
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== analysisUrl && !usingPrecomputedPeaks) {
      console.log('Waveform analysis URL changed, resetting analysis state');
      setAnalysisAttempted(false);
      setAnalysisUrl(waveformAnalysisUrl);
    }
  }, [waveformAnalysisUrl, analysisUrl, usingPrecomputedPeaks]);

  return {
    waveformData,
    isAnalyzing,
    isPeaksLoading,
    analysisError,
    usingPrecomputedPeaks,
    isWaveformGenerated
  };
};

