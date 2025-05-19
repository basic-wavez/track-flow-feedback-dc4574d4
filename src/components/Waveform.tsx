
import { useEffect, useState, useRef } from 'react';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformStatus from './waveform/WaveformStatus';
import { useAudioPlayer } from '@/providers/GlobalAudioProvider';
import { useWaveformProgress } from '@/hooks/useWaveformProgress';
import { 
  storeWaveformData, 
  getCachedWaveformData,
  markAnalysisAttempted,
  hasAttemptedAnalysis,
} from './waveform/WaveformCache';

interface WaveformProps {
  audioUrl?: string;
  waveformAnalysisUrl?: string;
  totalChunks?: number;
  audioQuality?: string;
}

const Waveform = ({ 
  audioUrl, 
  waveformAnalysisUrl,
  totalChunks = 1,
  audioQuality = '',
}: WaveformProps) => {
  // Get audio player state from global context
  const {
    currentTime, 
    duration, 
    isPlaying, 
    playbackState,
    seek,
    isBuffering,
    isAudioLoaded
  } = useAudioPlayer();
  
  // State for waveform data and display
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null);
  
  // Refs for tracking state
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const prevUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  
  // Use the waveform progress hook for UI interactions
  const {
    progressPercent,
    hoverPercent,
    setHoverPercent,
    getTimeFromPercent,
    getPercentFromEvent,
    handleMouseMove,
    handleMouseLeave,
  } = useWaveformProgress({
    currentTime,
    duration,
    waveformData,
    isPlaying,
    isBuffering,
  });
  
  // Generate initial placeholder waveform
  useEffect(() => {
    if (waveformData.length === 0) {
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
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Track which URL we're using for analysis
  useEffect(() => {
    if (waveformAnalysisUrl && waveformAnalysisUrl !== prevUrlRef.current) {
      console.log('Waveform analysis URL set to:', waveformAnalysisUrl);
      setAnalysisUrl(waveformAnalysisUrl);
      prevUrlRef.current = waveformAnalysisUrl;
      
      // Reset analysis state when URL changes
      setAnalysisAttempted(false);
    }
  }, [waveformAnalysisUrl]);
  
  // Attempt to load waveform data from JSON file
  useEffect(() => {
    // Only proceed if we have a URL to analyze and haven't attempted analysis yet
    if (!analysisUrl || analysisAttempted) return;
    
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
    
    // Fetch the waveform JSON data
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    fetch(analysisUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch waveform data: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!isMountedRef.current) return;
        
        if (data && data.length > 0) {
          console.log('Successfully loaded waveform data:', data.length, 'points');
          
          // Cache the waveform data
          storeWaveformData(analysisUrl, data);
          
          setWaveformData(data);
          setIsWaveformGenerated(true);
        } else {
          throw new Error("No waveform data in response");
        }
      })
      .catch(error => {
        if (!isMountedRef.current) return;
        
        console.error("Error loading waveform data:", error);
        setAnalysisError(`Failed to load waveform data: ${error.message}. Using fallback visualization.`);
        
        // Fall back to generated data with higher variance
        const fallbackData = generateWaveformWithVariance(250, 0.6);
        setWaveformData(fallbackData);
        setIsWaveformGenerated(true);
      })
      .finally(() => {
        if (isMountedRef.current) {
          setIsAnalyzing(false);
        }
      });
  }, [analysisUrl, analysisAttempted]);
  
  // Handle seeking when user interacts with waveform
  const handleSeek = (event: React.MouseEvent | React.TouchEvent) => {
    const percent = getPercentFromEvent(event);
    const seekTime = getTimeFromPercent(percent);
    seek(seekTime);
  };
  
  // Handle mouse down for dragging
  const handleMouseDown = (event: React.MouseEvent) => {
    isDraggingRef.current = true;
    handleSeek(event);
    
    // Add global event listeners for dragging
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };
  
  // Handle touch start for mobile dragging
  const handleTouchStart = (event: React.TouchEvent) => {
    isDraggingRef.current = true;
    handleSeek(event);
  };
  
  // Handle global mouse move (for dragging outside component)
  const handleGlobalMouseMove = (event: MouseEvent) => {
    if (!isDraggingRef.current || !waveformContainerRef.current) return;
    
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width;
    const percent = Math.min(100, Math.max(0, position * 100));
    const seekTime = getTimeFromPercent(percent);
    
    seek(seekTime);
  };
  
  // Handle global mouse up (end dragging)
  const handleGlobalMouseUp = () => {
    isDraggingRef.current = false;
    
    // Remove global event listeners
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
  };
  
  // Handle touch move for mobile dragging
  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    handleSeek(event);
  };
  
  // Handle touch end for mobile
  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };
  
  // Show loading states
  if (isAnalyzing) {
    return <WaveformLoader isAnalyzing={true} />;
  }
  
  const isAudioDurationValid = isFinite(duration) && duration > 0;
  const showBufferingUI = isBuffering && isPlaying;
  const isMp3Available = !!audioUrl;
  
  // Render the waveform visualization
  return (
    <div 
      ref={waveformContainerRef}
      className="w-full h-32 relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Waveform bars */}
      <div className="w-full h-full flex items-center">
        {waveformData.map((value, index) => {
          const normalizedHeight = value * 100;
          const barPercent = (index / waveformData.length) * 100;
          const isActive = barPercent <= progressPercent;
          const heightClass = `${Math.max(4, normalizedHeight)}%`;
          
          return (
            <div
              key={`bar-${index}`}
              className={`flex-1 mx-px ${isActive ? 'bg-purple-500' : 'bg-gray-600'}`}
              style={{ height: heightClass }}
            />
          );
        })}
      </div>
      
      {/* Progress indicator */}
      {progressPercent > 0 && (
        <div
          className="absolute top-0 h-full bg-purple-500 opacity-20 pointer-events-none"
          style={{ width: `${progressPercent}%`, transition: 'width 0.1s linear' }}
        />
      )}
      
      {/* Playhead */}
      <div
        className="absolute top-0 w-1 h-full bg-purple-400 pointer-events-none"
        style={{ left: `${progressPercent}%`, transition: isDraggingRef.current ? 'none' : 'left 0.1s linear' }}
      />
      
      {/* Hover position */}
      {hoverPercent !== null && (
        <div
          className="absolute top-0 w-0.5 h-full bg-white opacity-50 pointer-events-none"
          style={{ left: `${hoverPercent}%` }}
        />
      )}
      
      {/* Status overlay */}
      <WaveformStatus 
        isBuffering={isBuffering}
        showBufferingUI={showBufferingUI}
        isMp3Available={isMp3Available}
        analysisError={analysisError}
        isAudioLoading={!isAudioDurationValid && !analysisError && playbackState === 'loading'}
        currentTime={currentTime}
        audioQuality={audioQuality}
      />
    </div>
  );
};

export default Waveform;
