
import { useEffect, useState } from 'react';
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
  isGeneratingWaveform?: boolean;
  audioLoaded?: boolean;
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
  isGeneratingWaveform = false,
  audioLoaded = false
}: WaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null);
  
  // Generate initial placeholder waveform immediately with more segments for detail
  useEffect(() => {
    if (waveformData.length === 0) {
      // Use enhanced generation with 250 segments and higher variance for more dynamics
      const initialWaveformData = generateWaveformWithVariance(250, 0.6);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Log which URL we're using for analysis to help with debugging
  useEffect(() => {
    if (waveformAnalysisUrl) {
      console.log('Waveform analysis URL set to:', waveformAnalysisUrl);
      setAnalysisUrl(waveformAnalysisUrl);
    }
  }, [waveformAnalysisUrl]);
  
  // Attempt to analyze waveform data when analysis URL is available
  useEffect(() => {
    // Only proceed if we have a URL to analyze and haven't attempted analysis yet
    if (!analysisUrl || analysisAttempted) return;
    
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
        isMp3Available={isMp3Available}
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
