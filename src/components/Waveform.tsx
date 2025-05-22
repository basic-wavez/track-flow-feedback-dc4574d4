
import { useEffect, useState, useCallback, useRef } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformCanvas from './waveform/WaveformCanvas';
import WaveformStatus from './waveform/WaveformStatus';
import { useWaveformCache } from '@/hooks/useWaveformCache';

interface WaveformProps {
  audioUrl?: string;
  waveformAnalysisUrl?: string;
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
  waveformJsonUrl?: string;
  onWaveformDataLoaded?: (data: number[]) => void;
}

const Waveform = ({ 
  audioUrl, 
  waveformAnalysisUrl,
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
  waveformJsonUrl,
  onWaveformDataLoaded
}: WaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null);
  const [isLoadingWaveformJson, setIsLoadingWaveformJson] = useState(false);
  
  // Ref to track if we've already attempted to load precomputed waveform
  const precomputedLoadAttemptedRef = useRef(false);
  
  // Generate initial placeholder waveform immediately with more segments for detail
  useEffect(() => {
    if (waveformData.length === 0) {
      // Use enhanced generation with 250 segments and higher variance for more dynamics
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Create a cache key based on the URL
  const createCacheKey = useCallback((url: string) => {
    return `waveform:${url.split('?')[0]}`; // Remove any query params for more reliable caching
  }, []);
  
  // Try to fetch pre-computed waveform data
  const fetchWaveformJson = useCallback(async (url: string) => {
    if (!url) return false;
    
    setIsLoadingWaveformJson(true);
    const cacheKey = createCacheKey(url);
    
    try {
      console.log('Fetching pre-computed waveform data from:', url);
      
      // Try to get from localStorage first
      try {
        const cachedWaveform = localStorage.getItem(cacheKey);
        if (cachedWaveform) {
          console.log('Using cached waveform data from localStorage');
          const waveformJson = JSON.parse(cachedWaveform);
          if (waveformJson && Array.isArray(waveformJson) && waveformJson.length > 0) {
            setWaveformData(waveformJson);
            setIsWaveformGenerated(true);
            
            // Notify parent component about loaded waveform data
            if (onWaveformDataLoaded) {
              console.log('Notifying parent with cached waveform data:', waveformJson.length, 'points');
              onWaveformDataLoaded(waveformJson);
            }
            
            setIsLoadingWaveformJson(false);
            return true;
          }
        }
      } catch (err) {
        console.warn('Failed to read from localStorage:', err);
      }
      
      // Fetch with cache headers and disable cache busting
      const response = await fetch(url, { 
        headers: { 'Cache-Control': 'max-age=31536000' },
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch waveform JSON: ${response.status}`);
      }
      
      const waveformJson = await response.json();
      
      if (!Array.isArray(waveformJson) || waveformJson.length === 0) {
        throw new Error('Invalid waveform data format');
      }
      
      // Store in localStorage for faster future loads
      try {
        localStorage.setItem(cacheKey, JSON.stringify(waveformJson));
        console.log('Saved waveform data to localStorage with key:', cacheKey);
      } catch (err) {
        console.warn('Failed to cache waveform data in localStorage:', err);
      }
      
      console.log('Successfully loaded pre-computed waveform data:', waveformJson.length, 'points');
      setWaveformData(waveformJson);
      setIsWaveformGenerated(true);
      
      // Notify parent component about loaded waveform data
      if (onWaveformDataLoaded) {
        console.log('Notifying parent with fetched waveform data:', waveformJson.length, 'points');
        onWaveformDataLoaded(waveformJson);
      }
      
      return true;
    } catch (error) {
      console.error('Error fetching waveform JSON:', error);
      return false;
    } finally {
      setIsLoadingWaveformJson(false);
    }
  }, [createCacheKey, onWaveformDataLoaded]);
  
  // FIRST PRIORITY: Try to load waveform from pre-computed JSON
  // This effect runs first and has priority over analysis
  useEffect(() => {
    // Skip if already generated or already attempted
    if (!waveformJsonUrl || isWaveformGenerated || precomputedLoadAttemptedRef.current) return;
    
    console.log('Attempting to load pre-computed waveform data:', waveformJsonUrl);
    precomputedLoadAttemptedRef.current = true;
    
    fetchWaveformJson(waveformJsonUrl)
      .then(success => {
        if (success) {
          console.log('Successfully loaded pre-computed waveform data');
          // Explicitly prevent analysis if we successfully loaded JSON
          setAnalysisAttempted(true);
        } else {
          console.log('Failed to load pre-computed waveform, will fall back to analysis');
          // Allow fallback to analysis by NOT marking analysis as attempted
        }
      });
  }, [waveformJsonUrl, fetchWaveformJson, isWaveformGenerated]);
  
  // Set analysis URL from waveformAnalysisUrl prop
  useEffect(() => {
    if (waveformAnalysisUrl && !analysisUrl) {
      console.log('Setting waveform analysis URL to:', waveformAnalysisUrl);
      setAnalysisUrl(waveformAnalysisUrl);
    }
  }, [waveformAnalysisUrl, analysisUrl]);
  
  // SECOND PRIORITY: Fall back to audio analysis if pre-computed data loading failed
  useEffect(() => {
    // Only proceed if:
    // 1. We have an analysis URL
    // 2. We haven't attempted analysis yet
    // 3. We haven't successfully generated a waveform (either from pre-computed or analysis)
    // 4. We're not currently loading pre-computed data
    if (!analysisUrl || 
        analysisAttempted || 
        isWaveformGenerated || 
        isLoadingWaveformJson) {
      return;
    }
    
    // Mark that we've attempted analysis
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
          
          // Notify parent component about analyzed waveform data
          if (onWaveformDataLoaded) {
            console.log('Notifying parent with analyzed waveform data:', analyzedData.length, 'points');
            onWaveformDataLoaded(analyzedData);
          }
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
        
        // Also notify parent about fallback data
        if (onWaveformDataLoaded) {
          console.log('Notifying parent with fallback waveform data');
          onWaveformDataLoaded(fallbackData);
        }
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  }, [analysisUrl, analysisAttempted, isWaveformGenerated, isLoadingWaveformJson, onWaveformDataLoaded]);
  
  // Reset analysis flags when URL changes significantly
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== analysisUrl) {
      console.log('Waveform analysis URL changed, resetting analysis state');
      setAnalysisAttempted(false);
      setAnalysisUrl(waveformAnalysisUrl);
      precomputedLoadAttemptedRef.current = false;
    }
  }, [waveformAnalysisUrl, analysisUrl]);
  
  // Show loading states
  if (isLoadingWaveformJson) {
    return <WaveformLoader message="Loading waveform data..." />;
  }
  
  if (isAnalyzing) {
    return <WaveformLoader isAnalyzing={true} />;
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
      />
      
      <WaveformStatus 
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={isMp3Available}
        analysisError={analysisError}
        isAudioLoading={!isAudioDurationValid && !analysisError}
        currentTime={currentTime}
      />
    </div>
  );
};

export default Waveform;
