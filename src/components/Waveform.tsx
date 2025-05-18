
import { useEffect, useState, useRef } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformCanvas from './waveform/WaveformCanvas';
import WaveformStatus from './waveform/WaveformStatus';

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

// Create a global waveform cache object to persist across route changes
const waveformCache: Record<string, number[]> = {};

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
  
  // Check for cached waveform data on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Generate initial placeholder waveform immediately with more segments for detail
  useEffect(() => {
    if (waveformData.length === 0) {
      // Check if we have this waveform cached in memory or session storage
      if (waveformAnalysisUrl && waveformCache[waveformAnalysisUrl]) {
        console.log('Using cached waveform data from memory:', waveformAnalysisUrl);
        setWaveformData(waveformCache[waveformAnalysisUrl]);
        setIsWaveformGenerated(true);
        return;
      }
      
      try {
        const sessionKey = `waveform_${waveformAnalysisUrl}`;
        const cachedData = sessionStorage.getItem(sessionKey);
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          console.log('Using cached waveform data from session storage:', waveformAnalysisUrl);
          setWaveformData(parsedData);
          waveformCache[waveformAnalysisUrl || ''] = parsedData; // Also store in memory cache
          setIsWaveformGenerated(true);
          return;
        }
      } catch (e) {
        console.warn('Error retrieving from session storage:', e);
      }
      
      // Use enhanced generation with 250 segments and higher variance for more dynamics
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Log which URL we're using for analysis to help with debugging
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== prevUrlRef.current) {
      console.log('Waveform analysis URL set to:', waveformAnalysisUrl);
      setAnalysisUrl(waveformAnalysisUrl);
      prevUrlRef.current = waveformAnalysisUrl;
      
      // Reset analysis state if URL changes
      if (waveformAnalysisUrl !== prevUrlRef.current) {
        setAnalysisAttempted(false);
      }
    }
  }, [waveformAnalysisUrl]);
  
  // Attempt to analyze waveform data when analysis URL is available
  useEffect(() => {
    // Only proceed if we have a URL to analyze and haven't attempted analysis yet
    if (!analysisUrl || analysisAttempted) return;
    
    // If we already have this in our cache, use it
    if (waveformCache[analysisUrl]) {
      console.log('Using cached waveform data for URL:', analysisUrl);
      setWaveformData(waveformCache[analysisUrl]);
      setIsWaveformGenerated(true);
      setAnalysisAttempted(true);
      return;
    }
    
    // Try to get from session storage first
    try {
      const sessionKey = `waveform_${analysisUrl}`;
      const cachedData = sessionStorage.getItem(sessionKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log('Retrieved waveform data from session storage:', analysisUrl);
        setWaveformData(parsedData);
        waveformCache[analysisUrl] = parsedData; // Also store in memory cache
        setIsWaveformGenerated(true);
        setAnalysisAttempted(true);
        return;
      }
    } catch (e) {
      console.warn('Error retrieving from session storage:', e);
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
        if (!isMountedRef.current) return;
        
        if (analyzedData && analyzedData.length > 0) {
          console.log('Successfully analyzed waveform data:', analyzedData.length, 'segments');
          
          // Cache the waveform data in memory
          waveformCache[analysisUrl] = analyzedData;
          
          // Store in session storage for persistence across page navigations
          try {
            const sessionKey = `waveform_${analysisUrl}`;
            sessionStorage.setItem(sessionKey, JSON.stringify(analyzedData));
          } catch (e) {
            console.warn('Error storing in session storage:', e);
          }
          
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
  
  // Reset analysis attempted flag when the URL changes significantly
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== analysisUrl) {
      console.log('Waveform analysis URL changed, resetting analysis state');
      setAnalysisAttempted(false);
      setAnalysisUrl(waveformAnalysisUrl);
    }
  }, [waveformAnalysisUrl, analysisUrl]);
  
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
