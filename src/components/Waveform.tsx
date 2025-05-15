
import { useEffect, useState } from 'react';
import { analyzeAudio } from '@/lib/audioUtils';
import { generateWaveformWithVariance } from '@/lib/waveformUtils';
import WaveformLoader from './waveform/WaveformLoader';
import WaveformCanvas from './waveform/WaveformCanvas';
import WaveformStatus from './waveform/WaveformStatus';

interface WaveformProps {
  audioUrl?: string;
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
  waveformData?: number[]; // Add prop for database waveform data
}

const Waveform = ({ 
  audioUrl, 
  isPlaying, 
  currentTime, 
  duration, 
  onSeek,
  totalChunks = 1,
  isBuffering = false,
  showBufferingUI = false,
  isMp3Available = false,
  isGeneratingWaveform = false,
  audioLoaded = false,
  waveformData: storedWaveformData // Rename to avoid confusion
}: WaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWaveformGenerated, setIsWaveformGenerated] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Generate initial placeholder waveform immediately
  useEffect(() => {
    if (waveformData.length === 0) {
      const initialWaveformData = generateWaveformWithVariance(150, 0.3);
      setWaveformData(initialWaveformData);
    }
  }, []);
  
  // Use stored waveform data from database if available, otherwise analyze or generate
  useEffect(() => {
    if (!audioUrl) return;
    
    // If we have stored waveform data from the database, use it
    if (storedWaveformData && storedWaveformData.length > 0) {
      console.log('Using waveform data from database:', storedWaveformData.length, 'points');
      setWaveformData(storedWaveformData);
      setIsWaveformGenerated(true);
      return;
    }
    
    // If we already have waveform data for this audioUrl, don't regenerate
    // unless it's specifically for an MP3 that just became available
    if (isWaveformGenerated && !isMp3Available) return;
    
    // Determine number of segments for the waveform
    const segments = isMp3Available 
      ? 200 // More segments for MP3 for better visualization
      : Math.max(150, 50 * totalChunks);
    
    // For MP3 files, analyze the actual audio data
    if (isMp3Available && audioUrl && audioLoaded) {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      analyzeAudio(audioUrl, segments)
        .then(analyzedData => {
          if (analyzedData && analyzedData.length > 0) {
            setWaveformData(analyzedData);
            setIsWaveformGenerated(true);
          } else {
            throw new Error("No waveform data generated from analysis");
          }
        })
        .catch(error => {
          console.error("Error analyzing audio:", error);
          setAnalysisError("Failed to analyze audio. Using fallback visualization.");
          
          // Fall back to generated data
          const fallbackData = generateWaveformWithVariance(segments, 0.4);
          setWaveformData(fallbackData);
          setIsWaveformGenerated(true);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });
    } else {
      // For non-MP3 or when analysis fails, use generated data
      const newWaveformData = generateWaveformWithVariance(
        segments, 
        isMp3Available ? 0.4 : 0.2 // Higher variance for MP3 waveforms
      );
      
      setWaveformData(newWaveformData);
      setIsWaveformGenerated(true);
    }
  }, [audioUrl, totalChunks, isMp3Available, isWaveformGenerated, audioLoaded, storedWaveformData]);
  
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
