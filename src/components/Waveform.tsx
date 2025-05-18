import { useEffect, useState, useRef } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformCanvas from './waveform/WaveformCanvas';
import WaveformStatus from './waveform/WaveformStatus';
import { 
  storeWaveformData, 
  getCachedWaveformData, 
  markAnalysisAttempted,
  hasAttemptedAnalysis,
} from './waveform/WaveformCache';

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
  audioQuality?: string;
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
  audioQuality
}: WaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const didRestoreFromVisibilityRef = useRef(false);
  
  // Track visible state to handle tab switching
  const visibilityStateRef = useRef<'visible' | 'hidden'>(
    document.visibilityState === 'visible' ? 'visible' : 'hidden'
  );
  
  // Check for cached waveform data on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Handle visibility changes to persist state during tab switches
    const handleVisibilityChange = () => {
      const wasHidden = visibilityStateRef.current === 'hidden';
      const isNowVisible = document.visibilityState === 'visible';
      
      visibilityStateRef.current = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      
      // If we're becoming visible again after being hidden
      if (wasHidden && isNowVisible) {
        console.log('Waveform: Tab became visible, restoring state for url:', waveformAnalysisUrl);
        
        // If we have an analysis URL, attempt to restore cached data
        if (waveformAnalysisUrl) {
          const cachedData = getCachedWaveformData(waveformAnalysisUrl);
          
          if (cachedData && cachedData.length > 0) {
            console.log('Waveform: Restored cached data on visibility change');
            setWaveformData(cachedData);
            setIsWaveformGenerated(true);
            didRestoreFromVisibilityRef.current = true;
          }
          
          // If analysis has been attempted for this URL, mark it as attempted
          if (hasAttemptedAnalysis(waveformAnalysisUrl)) {
            setAnalysisAttempted(true);
          }
        }
      }
    };
    
    // Also handle pageshow event for browser back/forward cache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log('Waveform: Page restored from bfcache');
        
        // Similar logic to visibility change for bfcache restoration
        if (waveformAnalysisUrl) {
          const cachedData = getCachedWaveformData(waveformAnalysisUrl);
          
          if (cachedData && cachedData.length > 0) {
            console.log('Waveform: Restored cached data from bfcache');
            setWaveformData(cachedData);
            setIsWaveformGenerated(true);
            didRestoreFromVisibilityRef.current = true;
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [waveformAnalysisUrl]);
  
  // Generate initial placeholder waveform immediately with more segments for detail
  useEffect(() => {
    if (waveformData.length === 0 && !didRestoreFromVisibilityRef.current) {
      // Try to get cached data first
      if (waveformAnalysisUrl) {
        const cachedData = getCachedWaveformData(waveformAnalysisUrl);
        
        if (cachedData) {
          console.log('Using cached waveform data:', waveformAnalysisUrl);
          setWaveformData(cachedData);
          setIsWaveformGenerated(true);
          return;
        }
      }
      
      // Generate placeholder waveform if no cached data
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, [waveformData.length]);
  
  // Log which URL we're using for analysis to help with debugging
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== prevUrlRef.current) {
      console.log('Waveform analysis URL set to:', waveformAnalysisUrl);
      setAnalysisUrl(waveformAnalysisUrl);
      prevUrlRef.current = waveformAnalysisUrl;
      
      // Reset analysis state if URL changes significantly
      if (waveformAnalysisUrl !== prevUrlRef.current) {
        setAnalysisAttempted(false);
        didRestoreFromVisibilityRef.current = false;
      }
    }
  }, [waveformAnalysisUrl]);
  
  // Attempt to analyze waveform data when analysis URL is available
  useEffect(() => {
    // Only proceed if we have a URL to analyze and haven't attempted analysis yet
    if (!analysisUrl || analysisAttempted || didRestoreFromVisibilityRef.current) return;
    
    // Try to get from cache first
    const cachedData = getCachedWaveformData(analysisUrl);
    if (cachedData) {
      console.log('Using cached waveform data for URL:', analysisUrl);
      setWaveformData(cachedData);
      setIsWaveformGenerated(true);
      setAnalysisAttempted(true);
      return;
    }
    
    // Mark that we've attempted analysis
    setAnalysisAttempted(true);
    markAnalysisAttempted(analysisUrl);
    
    const segments = 250;
    
    console.log('Starting waveform analysis from URL:', analysisUrl);
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Attempt to analyze the audio file with enhanced dynamics
    analyzeAudio(analysisUrl, segments)
      .then(analyzedData => {
        if (!isMountedRef.current) return;
        
        if (analyzedData && analyzedData.length > 0) {
          console.log('Successfully analyzed waveform data:', analyzedData.length, 'segments');
          
          // Cache the waveform data
          storeWaveformData(analysisUrl, analyzedData);
          
          setWaveformData(analyzedData);
          setIsWaveformGenerated(true);
        } else {
          throw new Error("No waveform data generated from analysis");
        }
      })
      .catch(error => {
        if (!isMountedRef.current) return;
        
        console.error("Error analyzing audio:", error);
        setAnalysisError(`Failed to analyze audio: ${error.message}. Using fallback visualization.`);
        
        // Fall back to generated data with higher variance for more realistic appearance
        const fallbackData = generateWaveformWithVariance(segments, 0.6);
        setWaveformData(fallbackData);
        setIsWaveformGenerated(true);
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsAnalyzing(false);
        }
      });
  }, [analysisUrl, analysisAttempted]);
  
  // Show loading states
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
        audioQuality={audioQuality}
      />
    </div>
  );
};

export default Waveform;
