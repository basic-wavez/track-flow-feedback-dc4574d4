
import { useEffect, useState, useCallback } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformCanvas from './waveform/WaveformCanvas';
import WaveformStatus from './waveform/WaveformStatus';

interface WaveformProps {
  audioUrl?: string;
  waveformAnalysisUrl?: string; // URL specifically for waveform analysis
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
  waveformJsonUrl?: string; // New: URL to pre-computed waveform data JSON
}

const Waveform = ({ 
  audioUrl, 
  waveformAnalysisUrl, // Use dedicated analysis URL if available
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
  waveformJsonUrl // New: pre-computed waveform JSON URL
}: WaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null);
  const [isLoadingWaveformJson, setIsLoadingWaveformJson] = useState(false);
  
  // Generate initial placeholder waveform immediately with more segments for detail
  useEffect(() => {
    if (waveformData.length === 0) {
      // Use enhanced generation with 250 segments and higher variance for more dynamics
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // New: Try to fetch pre-computed waveform data first
  const fetchWaveformJson = useCallback(async (url: string) => {
    setIsLoadingWaveformJson(true);
    try {
      console.log('Fetching pre-computed waveform data from:', url);
      
      // Fetch with cache headers
      const response = await fetch(url, { 
        headers: { 'Cache-Control': 'max-age=31536000' },
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch waveform JSON: ${response.status}`);
      }
      
      const waveformJson = await response.json();
      
      // Store in localStorage for faster future loads
      try {
        localStorage.setItem(`waveform:${url}`, JSON.stringify(waveformJson));
      } catch (err) {
        console.warn('Failed to cache waveform data in localStorage:', err);
      }
      
      console.log('Successfully loaded pre-computed waveform data:', waveformJson.length);
      setWaveformData(waveformJson);
      setIsWaveformGenerated(true);
      return true;
    } catch (error) {
      console.error('Error fetching waveform JSON:', error);
      return false;
    } finally {
      setIsLoadingWaveformJson(false);
    }
  }, []);
  
  // Try to load waveform from pre-computed JSON first
  useEffect(() => {
    if (!waveformJsonUrl || isWaveformGenerated) return;
    
    // Check localStorage cache first
    try {
      const cachedWaveform = localStorage.getItem(`waveform:${waveformJsonUrl}`);
      if (cachedWaveform) {
        console.log('Using cached waveform data from localStorage');
        const waveformJson = JSON.parse(cachedWaveform);
        setWaveformData(waveformJson);
        setIsWaveformGenerated(true);
        return;
      }
    } catch (err) {
      console.warn('Failed to read from localStorage:', err);
    }
    
    // If not in cache, fetch from server
    fetchWaveformJson(waveformJsonUrl)
      .then(success => {
        // If we couldn't fetch the JSON, fall back to analysis
        if (!success) {
          setAnalysisAttempted(false); // Allow normal analysis to proceed
        }
      });
  }, [waveformJsonUrl, fetchWaveformJson, isWaveformGenerated]);
  
  // Log which URL we're using for analysis to help with debugging
  useEffect(() => {
    if (waveformAnalysisUrl) {
      console.log('Waveform analysis URL set to:', waveformAnalysisUrl);
      setAnalysisUrl(waveformAnalysisUrl);
    }
  }, [waveformAnalysisUrl]);
  
  // Attempt to analyze waveform data when analysis URL is available
  // and we couldn't load it from pre-computed JSON
  useEffect(() => {
    // Only proceed if we have a URL to analyze, haven't attempted analysis yet,
    // and don't have pre-computed waveform data
    if (!analysisUrl || analysisAttempted || isWaveformGenerated || isLoadingWaveformJson) return;
    
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
  }, [analysisUrl, analysisAttempted, isWaveformGenerated, isLoadingWaveformJson]);
  
  // Reset analysis attempted flag when the URL changes significantly
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== analysisUrl) {
      console.log('Waveform analysis URL changed, resetting analysis state');
      setAnalysisAttempted(false);
      setAnalysisUrl(waveformAnalysisUrl);
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
