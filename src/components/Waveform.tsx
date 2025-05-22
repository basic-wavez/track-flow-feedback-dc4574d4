
import { useEffect, useState, useCallback } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance, isValidPeaksData } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformCanvas from './waveform/WaveformCanvas';
import WaveformStatus from './waveform/WaveformStatus';
import { usePeaksData } from '@/context/PeaksDataContext';

interface WaveformProps {
  audioUrl?: string;
  waveformAnalysisUrl?: string; // URL specifically for waveform analysis
  peaksDataUrl?: string; // URL for pre-computed peaks data
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  totalChunks?: number;
  isBuffering?: boolean;
  showBufferingUI?: boolean;
  isMp3Available?: boolean;
  isOpusAvailable?: boolean;
  isGeneratingWaveform?: boolean;
  audioLoaded?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

const Waveform = ({ 
  audioUrl, 
  waveformAnalysisUrl,
  peaksDataUrl,
  isPlaying, 
  currentTime, 
  duration, 
  onSeek,
  totalChunks = 1,
  isBuffering = false,
  showBufferingUI = false,
  isMp3Available = false,
  isOpusAvailable = false,
  isGeneratingWaveform = false,
  audioLoaded = false,
  audioRef
}: WaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null);
  const [isPeaksLoading, setIsPeaksLoading] = useState(false);
  const [usedPrecomputedPeaks, setUsedPrecomputedPeaks] = useState(false);
  
  // Get access to the shared peaks data context
  const { peaksData, setPeaksData, hasPeaksData } = usePeaksData();
  
  // Generate initial placeholder waveform immediately with more segments for detail
  useEffect(() => {
    if (waveformData.length === 0 && !hasPeaksData) {
      // Use enhanced generation with 250 segments and higher variance for more dynamics
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // If we already have peaks data in the context, use it immediately
  useEffect(() => {
    if (hasPeaksData && peaksData && !isWaveformGenerated) {
      console.log('Using peaks data from context:', peaksData.length, 'points');
      setWaveformData(peaksData);
      setIsWaveformGenerated(true);
      setUsedPrecomputedPeaks(true);
    }
  }, [hasPeaksData, peaksData, isWaveformGenerated]);
  
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
          if (isValidPeaksData(parsedData)) {
            console.log('Using cached waveform peaks data');
            setWaveformData(parsedData);
            setPeaksData(parsedData); // Store in context for other components
            setIsWaveformGenerated(true);
            setUsedPrecomputedPeaks(true);
            setIsPeaksLoading(false);
            return true;
          } else {
            console.warn('Cached peaks data is invalid, fetching from server');
            localStorage.removeItem(cacheKey);
          }
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
      
      if (isValidPeaksData(peaksData)) {
        console.log('Successfully loaded pre-computed waveform peaks:', peaksData.length, 'points');
        
        // Cache the data for future use
        try {
          localStorage.setItem(cacheKey, JSON.stringify(peaksData));
        } catch (e) {
          console.warn('Failed to cache waveform peaks data:', e);
          // Non-fatal error, continue without caching
        }
        
        setWaveformData(peaksData);
        setPeaksData(peaksData); // Store in context for other components
        setIsWaveformGenerated(true);
        setUsedPrecomputedPeaks(true);
        return true;
      } else {
        throw new Error('Invalid peaks data format');
      }
    } catch (error) {
      console.error('Error loading pre-computed peaks data:', error);
      return false;
    } finally {
      setIsPeaksLoading(false);
    }
  }, [setPeaksData]);
  
  // Try to load pre-computed peaks data first
  useEffect(() => {
    if (peaksDataUrl && !isWaveformGenerated && !isAnalyzing && !isPeaksLoading && !hasPeaksData) {
      loadPeaksData(peaksDataUrl)
        .then(success => {
          if (!success) {
            // If peaks data loading fails, fall back to analysis
            console.log('Falling back to audio analysis after peaks data loading failed');
            setAnalysisAttempted(false);
          }
        });
    }
  }, [peaksDataUrl, isWaveformGenerated, isAnalyzing, isPeaksLoading, hasPeaksData, loadPeaksData]);
  
  // Log which URL we're using for analysis to help with debugging
  useEffect(() => {
    if (waveformAnalysisUrl) {
      console.log('Waveform analysis URL set to:', waveformAnalysisUrl);
      setAnalysisUrl(waveformAnalysisUrl);
    }
  }, [waveformAnalysisUrl]);
  
  // Attempt to analyze waveform data when analysis URL is available and peaks data is not
  useEffect(() => {
    // Only proceed if:
    // 1. We have a URL to analyze 
    // 2. Haven't attempted analysis yet
    // 3. Don't have waveform data yet
    // 4. Don't have pre-computed peaks or they failed to load
    // 5. We're not already in the process of analyzing
    if (!analysisUrl || analysisAttempted || isWaveformGenerated || isPeaksLoading || isAnalyzing || usedPrecomputedPeaks) {
      return;
    }
    
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
  }, [analysisUrl, analysisAttempted, isWaveformGenerated, isPeaksLoading, isAnalyzing, usedPrecomputedPeaks]);
  
  // Reset analysis attempted flag when the URL changes significantly
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== analysisUrl) {
      console.log('Waveform analysis URL changed, resetting analysis state');
      setAnalysisAttempted(false);
      setAnalysisUrl(waveformAnalysisUrl);
    }
  }, [waveformAnalysisUrl, analysisUrl]);
  
  // Show loading states
  if (isAnalyzing || isPeaksLoading) {
    return <WaveformLoader isAnalyzing={isAnalyzing} isLoadingPeaks={isPeaksLoading} />;
  }
  
  if (isGeneratingWaveform) {
    return <WaveformLoader isGeneratingWaveform={true} />;
  }
  
  const isAudioDurationValid = isFinite(duration) && duration > 0;
  
  return (
    <div className="w-full h-32 relative">
      <WaveformCanvas 
        waveformData={waveformData}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        isMp3Available={isMp3Available || isOpusAvailable}
        onSeek={onSeek}
        usedPrecomputedPeaks={usedPrecomputedPeaks}
      />
      
      <WaveformStatus 
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={isMp3Available}
        analysisError={analysisError}
        isAudioLoading={!isAudioDurationValid && !analysisError}
        currentTime={currentTime}
        usedPrecomputedPeaks={usedPrecomputedPeaks}
      />
    </div>
  );
};

export default Waveform;
